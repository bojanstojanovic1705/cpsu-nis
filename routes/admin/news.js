const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../../config/database');
const slugify = require('../../utils/slugify');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/news')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Samo slike su dozvoljene!'));
    }
});

// Get all news for admin
router.get('/', async (req, res) => {
    try {
        const [news] = await db.execute(
            'SELECT * FROM news ORDER BY created_at DESC'
        );
        res.render('admin/news/index', {
            title: 'Upravljanje vestima',
            page: 'admin-news',
            news: news
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            title: 'Greška',
            page: 'error',
            error: 'Greška pri učitavanju vesti'
        });
    }
});

// Show form for new news
router.get('/new', (req, res) => {
    res.render('admin/news/form', {
        title: 'Nova vest',
        page: 'admin-news',
        news: {}
    });
});

// Show form for editing news
router.get('/edit/:id', async (req, res) => {
    try {
        const [news] = await db.execute('SELECT * FROM news WHERE id = ?', [req.params.id]);
        const [images] = await db.execute('SELECT * FROM news_images WHERE news_id = ? ORDER BY position_order', [req.params.id]);
        
        if (news.length === 0) {
            return res.status(404).render('error', {
                title: 'Greška',
                page: 'error',
                error: 'Vest nije pronađena'
            });
        }
        
        res.render('admin/news/form', {
            title: 'Izmena vesti',
            page: 'admin-news',
            news: news[0],
            additionalImages: images
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            title: 'Greška',
            page: 'error',
            error: 'Greška pri učitavanju vesti'
        });
    }
});

// Handle multiple image upload
const uploadFields = [
    { name: 'main_image', maxCount: 1 },
    { name: 'additional_images', maxCount: 5 }
];

// Add new news
router.post('/', upload.fields(uploadFields), async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { title, content } = req.body;
        const slug = slugify(title);
        const excerpt = content.substring(0, 300) + '...';
        const main_image = req.files['main_image'] ? req.files['main_image'][0].filename : null;

        const [result] = await conn.execute(
            `INSERT INTO news (title, slug, content, excerpt, main_image, is_published) 
             VALUES (?, ?, ?, ?, ?, 1)`,
            [title, slug, content, excerpt, main_image]
        );

        // Handle additional images
        if (req.files['additional_images']) {
            const additionalImages = req.files['additional_images'];
            for (let i = 0; i < additionalImages.length; i++) {
                await conn.execute(
                    'INSERT INTO news_images (news_id, image_path, position_order) VALUES (?, ?, ?)',
                    [result.insertId, additionalImages[i].filename, i]
                );
            }
        }

        await conn.commit();
        res.redirect('/admin/news');
    } catch (error) {
        await conn.rollback();
        console.error('Error:', error);
        res.status(500).render('error', {
            title: 'Greška',
            page: 'error',
            error: 'Greška pri dodavanju vesti'
        });
    } finally {
        conn.release();
    }
});

// Update news
router.post('/:id', upload.fields(uploadFields), async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { title, content, is_published } = req.body;
        const { id } = req.params;
        const slug = slugify(title);
        const excerpt = content.substring(0, 300) + '...';

        let query = `UPDATE news 
                    SET title = ?, slug = ?, content = ?, 
                        excerpt = ?, is_published = ?`;
        let params = [title, slug, content, excerpt, is_published ? 1 : 0];

        if (req.files['main_image']) {
            // Delete old main image
            const [oldNews] = await conn.execute('SELECT main_image FROM news WHERE id = ?', [id]);
            if (oldNews[0] && oldNews[0].main_image) {
                const oldImagePath = path.join(__dirname, '../../public/uploads/news', oldNews[0].main_image);
                await fs.unlink(oldImagePath).catch(console.error);
            }

            // Add new main image
            query += ', main_image = ?';
            params.push(req.files['main_image'][0].filename);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await conn.execute(query, params);

        // Handle additional images
        if (req.files['additional_images']) {
            // Delete old additional images
            const [oldImages] = await conn.execute('SELECT image_path FROM news_images WHERE news_id = ?', [id]);
            for (const img of oldImages) {
                const oldImagePath = path.join(__dirname, '../../public/uploads/news', img.image_path);
                await fs.unlink(oldImagePath).catch(console.error);
            }
            await conn.execute('DELETE FROM news_images WHERE news_id = ?', [id]);

            // Add new additional images
            const additionalImages = req.files['additional_images'];
            for (let i = 0; i < additionalImages.length; i++) {
                await conn.execute(
                    'INSERT INTO news_images (news_id, image_path, position_order) VALUES (?, ?, ?)',
                    [id, additionalImages[i].filename, i]
                );
            }
        }

        await conn.commit();
        res.redirect('/admin/news');
    } catch (error) {
        await conn.rollback();
        console.error('Error:', error);
        res.status(500).render('error', {
            title: 'Greška',
            page: 'error',
            error: 'Greška pri ažuriranju vesti'
        });
    } finally {
        conn.release();
    }
});

// Delete news
router.post('/:id/delete', async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { id } = req.params;

        // Delete main image
        const [oldNews] = await conn.execute('SELECT main_image FROM news WHERE id = ?', [id]);
        if (oldNews[0] && oldNews[0].main_image) {
            const mainImagePath = path.join(__dirname, '../../public/uploads/news', oldNews[0].main_image);
            await fs.unlink(mainImagePath).catch(console.error);
        }

        // Delete additional images
        const [oldImages] = await conn.execute('SELECT image_path FROM news_images WHERE news_id = ?', [id]);
        for (const img of oldImages) {
            const imagePath = path.join(__dirname, '../../public/uploads/news', img.image_path);
            await fs.unlink(imagePath).catch(console.error);
        }

        // Delete from database (news_images will be deleted automatically due to CASCADE)
        await conn.execute('DELETE FROM news WHERE id = ?', [id]);

        await conn.commit();
        res.redirect('/admin/news');
    } catch (error) {
        await conn.rollback();
        console.error('Error:', error);
        res.status(500).render('error', {
            title: 'Greška',
            page: 'error',
            error: 'Greška pri brisanju vesti'
        });
    } finally {
        conn.release();
    }
});

// Upload image for TinyMCE
router.post('/upload-image', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.json({
            location: `/uploads/news/${req.file.filename}`
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

module.exports = router;
