const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: 'Prijava',
        page: 'login'
    });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', { email }); // Logging

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        console.log('Found users:', users.length); // Logging

        const user = users[0];
        if (!user) {
            console.log('No user found'); // Logging
            return res.render('auth/login', {
                title: 'Prijava',
                page: 'login',
                error: 'Neispravni podaci za prijavu'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isValidPassword); // Logging

        if (isValidPassword) {
            req.session.user = {
                id: user.id,
                email: user.email,
                isAdmin: user.is_admin
            };
            console.log('Session created:', req.session.user); // Logging
            return res.redirect(user.is_admin ? '/admin/dashboard' : '/');
        } else {
            return res.render('auth/login', {
                title: 'Prijava',
                page: 'login',
                error: 'Neispravni podaci za prijavu'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('error', { 
            title: 'Greška',
            page: 'error',
            error: 'Greška pri prijavi'
        });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Logout ruta
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).render('error', {
                title: 'Greška',
                page: 'error',
                error: 'Greška pri odjavljivanju'
            });
        }
        res.redirect('/');
    });
});

module.exports = router;
