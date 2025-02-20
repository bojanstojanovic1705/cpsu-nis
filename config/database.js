const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Helper function to make PostgreSQL queries compatible with MySQL syntax
const execute = async (query, params = []) => {
    // Convert MySQL question mark placeholders to PostgreSQL numbered placeholders
    let pgQuery = query;
    let paramCount = 0;
    pgQuery = query.replace(/\?/g, () => `$${++paramCount}`);
    
    // Execute the query
    const result = await pool.query(pgQuery, params);
    
    // Return in a format similar to MySQL's [rows, fields]
    return [result.rows, result.fields];
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    execute,
    pool
};
