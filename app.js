require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const db = require('./config/database');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize flash messages
app.use(flash());

// Make user available to all views
app.use((req, res, next) => {
    console.log('Session state:', {
        hasSession: !!req.session,
        sessionID: req.sessionID,
        user: req.session?.user,
        path: req.path,
        method: req.method
    });
    res.locals.user = req.session.user;
    next();
});

// Make flash messages available to all views
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Load pages for navigation
app.use(async (req, res, next) => {
    try {
        // Prvo učitamo sve stranice
        const [allPages] = await db.execute(`
            SELECT p.*, parent.title as parent_title 
            FROM pages p 
            LEFT JOIN pages parent ON p.parent_id = parent.id 
            WHERE p.is_published = 1 AND p.show_in_menu = 1 
            ORDER BY COALESCE(p.parent_id, 0), p.menu_order
        `);

        // Organizujemo stranice u hijerarhiju
        const mainPages = [];
        const pageMap = new Map();

        // Prvo mapiramo sve stranice po ID-u
        allPages.forEach(page => {
            page.children = [];
            pageMap.set(page.id, page);
        });

        // Zatim organizujemo hijerarhiju
        allPages.forEach(page => {
            if (page.parent_id) {
                const parent = pageMap.get(page.parent_id);
                if (parent) {
                    parent.children.push(page);
                }
            } else {
                mainPages.push(page);
            }
        });

        res.locals.mainPages = mainPages;
        next();
    } catch (error) {
        console.error('Error loading pages:', error);
        res.locals.mainPages = [];
        next();
    }
});

// Routes
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const auth = require('./middleware/auth');
const contactRouter = require('./routes/contact');
const newsApiRouter = require('./routes/api/news');
const messagesRouter = require('./routes/admin/messages');

// API routes
app.use('/api/news', newsApiRouter);

// Web routes
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);
app.use('/admin-messages', [auth.requireAdmin, messagesRouter]);
app.use('/auth', authRoutes);
app.use('/kontakt', contactRouter);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        title: 'Greška',
        page: 'error',
        error: err.message || 'Došlo je do greške!'
    });
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).render('error/404', {
        title: 'Stranica nije pronađena',
        page: '404'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
