const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// Get latest news
router.get('/', async (req, res) => {
    try {
        const [news] = await db.execute(
            `SELECT * FROM news 
             WHERE is_published = 1 
             ORDER BY created_at DESC 
             LIMIT 6`
        );

        res.json(news);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

module.exports = router;
