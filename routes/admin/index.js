const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

// Import admin routes
const pagesRoutes = require('./pages');
const newsRoutes = require('./news');
const employeesRoutes = require('./employees');

// Apply auth middleware to all admin routes
router.use(auth.requireAuth);
router.use(auth.requireAdmin);

// Admin dashboard
router.get('/', (req, res) => {
    res.render('admin/dashboard', {
        title: 'Admin Panel',
        page: 'dashboard'
    });
});

// Register admin routes
router.use('/pages', pagesRoutes);
router.use('/news', newsRoutes);
router.use('/employees', employeesRoutes);

module.exports = router;
