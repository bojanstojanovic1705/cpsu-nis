const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../../config/database');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/employees')
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

// Get all employees for admin
router.get('/', async (req, res) => {
    try {
        const [employees] = await db.execute(
            'SELECT * FROM employees ORDER BY position_order ASC'
        );
        res.render('admin/employees/index', {
            title: 'Upravljanje zaposlenima',
            page: 'admin-employees',
            employees: employees
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            title: 'Greška',
            page: 'error',
            error: 'Greška pri učitavanju zaposlenih'
        });
    }
});

// Show form for new employee
router.get('/new', (req, res) => {
    res.render('admin/employees/form', {
        title: 'Novi zaposleni',
        page: 'admin-employees',
        employee: {}
    });
});

// Show form for editing employee
router.get('/edit/:id', async (req, res) => {
    try {
        const [employees] = await db.execute('SELECT * FROM employees WHERE id = ?', [req.params.id]);
        if (employees.length === 0) {
            return res.status(404).render('error', {
                title: 'Greška',
                page: 'error',
                error: 'Zaposleni nije pronađen'
            });
        }
        res.render('admin/employees/form', {
            title: 'Izmena zaposlenog',
            page: 'admin-employees',
            employee: employees[0]
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            title: 'Greška',
            page: 'error',
            error: 'Greška pri učitavanju zaposlenog'
        });
    }
});

// Add new employee
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, position, description, email, phone, position_order, is_active } = req.body;
        const image = req.file ? req.file.filename : null;

        await db.execute(
            `INSERT INTO employees 
            (name, position, description, email, phone, image, position_order, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, position, description, email, phone, image, position_order || 0, is_active ? 1 : 0]
        );

        res.redirect('/admin/employees');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            title: 'Greška',
            page: 'error',
            error: 'Greška pri dodavanju zaposlenog'
        });
    }
});

// Update employee
router.post('/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, position, description, email, phone, position_order, is_active } = req.body;
        const { id } = req.params;

        let query = `UPDATE employees 
                    SET name = ?, position = ?, description = ?, 
                        email = ?, phone = ?, position_order = ?, 
                        is_active = ?`;
        let params = [name, position, description, email, phone, position_order || 0, is_active ? 1 : 0];

        if (req.file) {
            // Delete old image if exists
            const [oldEmployee] = await db.execute('SELECT image FROM employees WHERE id = ?', [id]);
            if (oldEmployee[0] && oldEmployee[0].image) {
                const oldImagePath = path.join(__dirname, '../../public/uploads/employees', oldEmployee[0].image);
                await fs.unlink(oldImagePath).catch(console.error);
            }

            // Add new image
            query += ', image = ?';
            params.push(req.file.filename);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await db.execute(query, params);
        res.redirect('/admin/employees');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            title: 'Greška',
            page: 'error',
            error: 'Greška pri ažuriranju zaposlenog'
        });
    }
});

// Delete employee
router.post('/:id/delete', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete image if exists
        const [oldEmployee] = await db.execute('SELECT image FROM employees WHERE id = ?', [id]);
        if (oldEmployee[0] && oldEmployee[0].image) {
            const imagePath = path.join(__dirname, '../../public/uploads/employees', oldEmployee[0].image);
            await fs.unlink(imagePath).catch(console.error);
        }

        await db.execute('DELETE FROM employees WHERE id = ?', [id]);
        res.redirect('/admin/employees');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            title: 'Greška',
            page: 'error',
            error: 'Greška pri brisanju zaposlenog'
        });
    }
});

module.exports = router;
