const { Pool } = require('pg');
require('dotenv').config();

// Debugging: This will tell us if the variable is actually loading
if (!process.env.DB_PASSWORD) {
    console.error("❌ CRITICAL: DB_PASSWORD is missing from .env file!");
}

const pool = new Pool({
    user: String(process.env.DB_USER),
    host: String(process.env.DB_HOST),
    database: String(process.env.DB_NAME),
    password: String(process.env.DB_PASSWORD), // Force it to be a string
    port: Number(process.env.DB_PORT) || 5432,
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err.stack);
    } else {
        console.log('✅ PostgreSQL Connected at:', res.rows[0].now);
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};