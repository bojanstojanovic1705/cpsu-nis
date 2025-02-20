const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const slugify = require('slugify');

// Pomoćna funkcija za dobijanje dostupnih roditeljskih stranica
async function getAvailableParents(excludeId = null) {
    const query = 'SELECT id, title FROM pages WHERE id != ? ORDER BY title';
    const [pages] = await db.execute(query, [excludeId || 0]);
    return pages;
}

// Lista stranica
router.get('/', async (req, res) => {
    try {
        const [pages] = await db.execute(`
            SELECT p.*, parent.title as parent_title 
            FROM pages p 
            LEFT JOIN pages parent ON p.parent_id = parent.id 
            ORDER BY COALESCE(p.parent_id, 0), p.menu_order
        `);
        res.render('admin/pages/index', {
            title: 'Upravljanje stranicama',
            page: 'pages',
            pages
        });
    } catch (error) {
        console.error('Error in /admin/pages:', error);
        res.status(500).render('error', { 
            title: 'Greška',
            page: 'error',
            error: 'Greška pri učitavanju stranica'
        });
    }
});

// Forma za novu stranicu
router.get('/new', async (req, res) => {
    try {
        const availableParents = await getAvailableParents();
        res.render('admin/pages/form', {
            title: 'Nova stranica',
            page: 'pages',
            pageData: {},
            availableParents
        });
    } catch (error) {
        console.error('Error in /admin/pages/new:', error);
        res.status(500).render('error', { 
            title: 'Greška',
            page: 'error',
            error: 'Greška pri učitavanju forme'
        });
    }
});

// Kreiranje nove stranice
router.post('/', async (req, res) => {
    try {
        console.log('Kreiranje nove stranice - body:', req.body);
        const { title, content, parent_id, menu_order, is_published, show_in_menu } = req.body;
        const slug = slugify(title, { lower: true, strict: true });

        console.log('Pripremljeni podaci:', {
            title,
            slug,
            content,
            parent_id: parent_id || null,
            menu_order: menu_order || 0,
            is_published: is_published ? 1 : 0,
            show_in_menu: show_in_menu ? 1 : 0
        });

        const result = await db.execute(
            'INSERT INTO pages (title, slug, content, parent_id, menu_order, is_published, show_in_menu) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, slug, content, parent_id || null, menu_order || 0, is_published ? 1 : 0, show_in_menu ? 1 : 0]
        );

        console.log('Rezultat kreiranja:', result);
        res.redirect('/admin/pages');
    } catch (error) {
        console.error('Error in POST /admin/pages:', error);
        res.status(500).render('error', { 
            title: 'Greška',
            page: 'error',
            error: 'Greška pri kreiranju stranice'
        });
    }
});

// Forma za izmenu stranice
router.get('/:id/edit', async (req, res) => {
    try {
        const [pages] = await db.execute('SELECT * FROM pages WHERE id = ?', [req.params.id]);
        if (pages.length === 0) {
            return res.status(404).render('error', { 
                title: 'Greška',
                page: 'error',
                error: 'Stranica nije pronađena'
            });
        }

        const availableParents = await getAvailableParents(req.params.id);
        
        res.render('admin/pages/form', {
            title: 'Izmena stranice',
            page: 'pages',
            pageData: pages[0],
            availableParents
        });
    } catch (error) {
        console.error('Error in /admin/pages/:id/edit:', error);
        res.status(500).render('error', { 
            title: 'Greška',
            page: 'error',
            error: 'Greška pri učitavanju stranice'
        });
    }
});

// Ažuriranje stranice
router.post('/:id', async (req, res) => {
    try {
        const { title, content, parent_id, menu_order, is_published, show_in_menu } = req.body;
        const slug = slugify(title, { lower: true, strict: true });

        await db.execute(
            'UPDATE pages SET title = ?, slug = ?, content = ?, parent_id = ?, menu_order = ?, is_published = ?, show_in_menu = ? WHERE id = ?',
            [title, slug, content, parent_id || null, menu_order || 0, is_published ? 1 : 0, show_in_menu ? 1 : 0, req.params.id]
        );

        res.redirect('/admin/pages');
    } catch (error) {
        console.error('Error in POST /admin/pages/:id:', error);
        res.status(500).render('error', { 
            title: 'Greška',
            page: 'error',
            error: 'Greška pri ažuriranju stranice'
        });
    }
});

// Brisanje stranice
router.post('/:id/delete', async (req, res) => {
    try {
        // Prvo ažuriraj sve podstranice da nemaju roditelja
        await db.execute('UPDATE pages SET parent_id = NULL WHERE parent_id = ?', [req.params.id]);
        // Zatim obriši stranicu
        await db.execute('DELETE FROM pages WHERE id = ?', [req.params.id]);
        res.redirect('/admin/pages');
    } catch (error) {
        console.error('Error in POST /admin/pages/:id/delete:', error);
        res.status(500).render('error', { 
            title: 'Greška',
            page: 'error',
            error: 'Greška pri brisanju stranice'
        });
    }
});

module.exports = router;
