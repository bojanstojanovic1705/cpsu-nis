const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Admin email addresses that will receive contact form submissions
const adminEmails = [
    process.env.ADMIN_EMAIL || 'admin@cpsu.rs'
];

module.exports = {
    transporter,
    adminEmails
};
