require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function migrate() {
    try {
        const schema = fs.readFileSync(
            path.join(__dirname, '..', 'database', 'schema.postgres.sql'),
            'utf8'
        );

        await pool.query(schema);
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
