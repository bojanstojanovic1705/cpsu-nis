require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Hash password
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 12);

        // Delete existing admin if exists
        await connection.execute('DELETE FROM users WHERE email = ?', ['admin@cpsu.rs']);

        // Insert new admin
        await connection.execute(
            'INSERT INTO users (email, password, name, is_admin) VALUES (?, ?, ?, ?)',
            ['admin@cpsu.rs', hashedPassword, 'Administrator', true]
        );

        console.log('Admin user created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin().catch(console.error);
