const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// Debug middleware
router.use((req, res, next) => {
    console.log('Messages route details:', {
        path: req.path,
        method: req.method,
        baseUrl: req.baseUrl,
        originalUrl: req.originalUrl
    });
    next();
});

// List all messages
router.get('/', async (req, res) => {
    console.log('Attempting to list messages');
    try {
        const [messages] = await db.execute(
            `SELECT * FROM messages ORDER BY created_at DESC`
        );

        console.log('Found messages:', messages.length);

        // Render the messages index page
        console.log('Rendering messages/index template');
        res.render('admin/messages/index', {
            title: 'Poruke',
            page: 'messages',
            messages: messages
        });
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'Greška pri učitavanju poruka');
        res.redirect('/admin/dashboard');
    }
});

// View single message
router.get('/:id', async (req, res) => {
    console.log('Attempting to view message with id:', req.params.id);
    try {
        const [message] = await db.execute(
            'SELECT * FROM messages WHERE id = ?',
            [req.params.id]
        );

        if (message.length === 0) {
            console.log('Message not found');
            req.flash('error', 'Poruka nije pronađena');
            return res.redirect('/admin/messages');
        }

        console.log('Found message:', message[0]);

        // Mark message as read
        if (!message[0].is_read) {
            await db.execute(
                'UPDATE messages SET is_read = TRUE WHERE id = ?',
                [req.params.id]
            );
            console.log('Message marked as read');
        }

        res.render('admin/messages/view', {
            title: 'Pregled poruke',
            page: 'messages',
            message: message[0]
        });
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'Greška pri učitavanju poruke');
        res.redirect('/admin/messages');
    }
});

// Delete message
router.post('/delete/:id', async (req, res) => {
    console.log('Attempting to delete message with id:', req.params.id);
    try {
        await db.execute(
            'DELETE FROM messages WHERE id = ?',
            [req.params.id]
        );

        console.log('Message deleted successfully');
        req.flash('success', 'Poruka je uspešno obrisana');
        res.redirect('/admin/messages');
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'Greška pri brisanju poruke');
        res.redirect('/admin/messages');
    }
});

module.exports = router;
