const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const employeesRouter = require('./admin/employees');
const newsRouter = require('./admin/news');
const pagesRouter = require('./admin/pages');
const messagesRouter = require('./admin/messages');

// Auth middleware for all admin routes
router.use(auth.requireAdmin);

// Debug middleware
router.use((req, res, next) => {
    console.log('Admin route accessed:', {
        path: req.path,
        method: req.method,
        user: req.session.user,
        originalUrl: req.originalUrl
    });
    next();
});

// Root route - redirect to dashboard
router.get('/', (req, res) => {
    console.log('Root admin route accessed, redirecting to dashboard');
    res.redirect('/admin/dashboard');
});

// Dashboard
router.get('/dashboard', (req, res) => {
    console.log('Dashboard route accessed');
    res.render('admin/dashboard', {
        title: 'Admin Panel',
        page: 'dashboard'
    });
});

// Rute za zaposlene
router.use('/employees', employeesRouter);

// Rute za vesti
router.use('/news', newsRouter);

// Messages routes
console.log('Registering messages router');
router.use('/messages', (req, res, next) => {
    console.log('Messages middleware hit:', req.path);
    next();
}, messagesRouter);

// Rute za stranice
router.use('/pages', pagesRouter);

module.exports = router;
