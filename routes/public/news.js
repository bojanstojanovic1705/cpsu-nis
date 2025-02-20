const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// Lista vesti
router.get('/', async (req, res) => {
    try {
        const [news] = await db.execute(
            'SELECT n.*, u.name as author_name FROM news n LEFT JOIN users u ON n.author_id = u.id ORDER BY n.published_at DESC'
        );
        res.render('public/news/index', {
            title: 'Vesti',
            page: 'news',
            news
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error: 'Greška pri učitavanju vesti' });
    }
});

// Pojedinačna vest
router.get('/:id', async (req, res) => {
    try {
        const [news] = await db.execute(
            'SELECT n.*, u.name as author_name FROM news n LEFT JOIN users u ON n.author_id = u.id WHERE n.id = ?',
            [req.params.id]
        );
        
        if (news.length === 0) {
            return res.status(404).render('error', { error: 'Vest nije pronađena' });
        }

        res.render('public/news/show', {
            title: news[0].title,
            page: 'news',
            news: news[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error: 'Greška pri učitavanju vesti' });
    }
});

module.exports = router;
