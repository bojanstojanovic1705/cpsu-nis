exports.requireAuth = (req, res, next) => {
    console.log('requireAuth middleware:', {
        hasSession: !!req.session,
        hasUser: !!(req.session && req.session.user),
        user: req.session?.user
    });

    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/auth/login');
    }
};

exports.requireAdmin = (req, res, next) => {
    console.log('requireAdmin middleware:', {
        hasSession: !!req.session,
        hasUser: !!(req.session && req.session.user),
        isAdmin: !!(req.session && req.session.user && req.session.user.isAdmin),
        user: req.session?.user,
        path: req.path,
        originalUrl: req.originalUrl
    });

    if (req.session && req.session.user && req.session.user.isAdmin) {
        next();
    } else {
        req.flash('error', 'Pristup nije dozvoljen');
        res.redirect('/auth/login');
    }
};
