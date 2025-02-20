const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all employees
router.get('/', async (req, res) => {
    try {
        const [employees] = await db.execute(
            'SELECT * FROM employees WHERE is_active = TRUE ORDER BY order_number ASC'
        );
        
        res.render('public/employees', {
            title: 'Zaposleni',
            page: 'employees',
            employees: employees
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).render('error', { error: 'Greška pri učitavanju zaposlenih' });
    }
});

module.exports = router;
