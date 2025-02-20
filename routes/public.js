const express = require('express');
const router = express.Router();
const newsRouter = require('./public/news');
const db = require('../config/database');

router.get('/', async (req, res) => {
    try {
        // Get latest news
        const [news] = await db.execute(
            `SELECT * FROM news 
             WHERE is_published = 1 
             ORDER BY created_at DESC 
             LIMIT 6`
        );

        res.render('public/home', {
            title: 'Centar za porodični smeštaj i usvojenje',
            page: 'home',
            news: news
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            title: 'Greška',
            page: 'error',
            error: 'Greška pri učitavanju početne strane'
        });
    }
});

router.get('/o-nama', (req, res) => {
    res.render('public/about', {
        title: 'O nama',
        page: 'about'
    });
});

router.get('/usluge', (req, res) => {
    res.render('public/services', {
        title: 'Naše usluge',
        page: 'services'
    });
});

router.get('/kontakt', (req, res) => {
    res.render('public/contact', {
        title: 'Kontakt',
        page: 'contact'
    });
});

// Ruta za zaposlene
router.get('/zaposleni', async (req, res) => {
    try {
        const [employees] = await db.execute(`
            SELECT * FROM employees 
            WHERE is_active = 1 
            ORDER BY position_order, name
        `);
        
        res.render('public/employees', {
            title: 'Zaposleni',
            page: 'employees',
            employees: employees
        });
    } catch (error) {
        console.error('Error loading employees:', error);
        res.status(500).render('error', {
            title: 'Greška',
            page: 'error',
            error: 'Greška pri učitavanju zaposlenih'
        });
    }
});

// Ruta za vesti
router.get('/vest/:slug', async (req, res) => {
    try {
        // Get news and increment views
        const [news] = await db.execute(
            'SELECT * FROM news WHERE slug = ? AND is_published = 1',
            [req.params.slug]
        );

        if (news.length === 0) {
            return res.status(404).render('error', {
                title: 'Greška',
                page: 'error',
                error: 'Vest nije pronađena'
            });
        }

        // Get additional images
        const [additionalImages] = await db.execute(
            'SELECT * FROM news_images WHERE news_id = ? ORDER BY position_order',
            [news[0].id]
        );

        // Increment views
        await db.execute(
            'UPDATE news SET views = views + 1 WHERE id = ?',
            [news[0].id]
        );

        res.render('public/news-single', {
            title: news[0].title,
            page: 'news',
            news: news[0],
            additionalImages: additionalImages
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

// Lista vesti
router.get('/vesti', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // broj vesti po stranici
        const offset = (page - 1) * limit;
        
        // Priprema WHERE uslova za filtriranje
        let whereConditions = ['is_published = 1'];
        let queryParams = [];
        
        // Pretraga po tekstu
        if (req.query.search) {
            whereConditions.push('(title LIKE ? OR content LIKE ?)');
            const searchTerm = `%${req.query.search}%`;
            queryParams.push(searchTerm, searchTerm);
        }
        
        // Filter po godini
        if (req.query.year) {
            whereConditions.push('YEAR(created_at) = ?');
            queryParams.push(req.query.year);
        }
        
        // Filter po mesecu
        if (req.query.month) {
            whereConditions.push('MONTH(created_at) = ?');
            queryParams.push(req.query.month);
        }
        
        // Kreiranje WHERE klauzule
        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';
        
        // Dobavljanje ukupnog broja vesti za paginaciju
        const [countResult] = await db.execute(
            `SELECT COUNT(*) as total FROM news ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);
        
        // Dobavljanje vesti za trenutnu stranu
        const [news] = await db.execute(
            `SELECT * FROM news 
             ${whereClause}
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [...queryParams, limit, offset]
        );
        
        res.render('public/vesti', {
            title: 'Vesti',
            page: 'news',
            news: news,
            currentPage: page,
            totalPages: totalPages,
            searchTerm: req.query.search,
            selectedYear: req.query.year,
            selectedMonth: req.query.month
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

// Ruta za dinamičke stranice
router.get('/:slug', async (req, res, next) => {
    try {
        const [pages] = await db.execute('SELECT * FROM pages WHERE slug = ? AND is_published = 1', [req.params.slug]);
        if (pages.length === 0) {
            return next(); // Ako stranica nije pronađena, nastavi na sledeću rutu
        }
        res.render('public/page', {
            title: pages[0].title,
            page: pages[0].slug,
            currentPage: pages[0].slug,
            content: pages[0].content
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { 
            title: 'Greška',
            page: 'error',
            error: 'Greška pri učitavanju stranice'
        });
    }
});

// Politika privatnosti
router.get('/politika-privatnosti', (req, res) => {
    res.render('public/politika-privatnosti', {
        title: 'Politika privatnosti',
        page: 'politika-privatnosti'
    });
});

// Uslovi korišćenja
router.get('/uslovi-koriscenja-sajta', (req, res) => {
    res.render('public/uslovi-koriscenja-sajta', {
        title: 'Uslovi korišćenja',
        page: 'uslovi-koriscenja-sajta'
    });
});

// Informacije i nabavke
router.get('/informacije-i-nabavke', (req, res) => {
    res.render('public/informacije-i-nabavke', {
        title: 'Informacije i javne nabavke',
        page: 'info-nabavke'
    });
});

// Hraniteljstvo
router.get('/hraniteljstvo', (req, res) => {
    res.render('public/hraniteljstvo', {
        title: 'O hraniteljstvu',
        page: 'hraniteljstvo'
    });
});

module.exports = router;
