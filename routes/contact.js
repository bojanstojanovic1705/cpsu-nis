const express = require('express');
const router = express.Router();
const { transporter, adminEmails } = require('../config/email');
const db = require('../config/database');

router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message, phone } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            req.flash('error', 'Molimo popunite sva obavezna polja');
            return res.redirect('/kontakt');
        }

        // Save message to database
        const [result] = await db.execute(
            'INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone || null, subject, message]
        );

        // If email settings are configured, send email
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                // Prepare email content
                const mailOptions = {
                    from: `"CPSU Kontakt Forma" <${process.env.EMAIL_USER}>`,
                    to: adminEmails.join(', '),
                    subject: `Nova poruka: ${subject}`,
                    html: `
                        <h2>Nova poruka sa kontakt forme</h2>
                        <p><strong>Od:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
                        <p><strong>Naslov:</strong> ${subject}</p>
                        <p><strong>Poruka:</strong></p>
                        <p>${message.replace(/\n/g, '<br>')}</p>
                    `
                };

                // Send email
                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                // Continue execution even if email fails
            }
        }

        // Set success message and redirect
        req.flash('success', 'Vaša poruka je uspešno poslata. Kontaktiraćemo vas uskoro.');
        res.redirect('/kontakt');
    } catch (error) {
        console.error('Error saving message:', error);
        req.flash('error', 'Došlo je do greške pri slanju poruke. Molimo pokušajte ponovo.');
        res.redirect('/kontakt');
    }
});

module.exports = router;
