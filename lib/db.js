const { Pool } = require('pg');

// Create a connection pool
let pool;

function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.POSTGRES_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }
    return pool;
}

// Query helper
async function query(text, params) {
    const pool = getPool();
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Get a single row
async function queryOne(text, params) {
    const result = await query(text, params);
    return result.rows[0] || null;
}

// Get all rows
async function queryAll(text, params) {
    const result = await query(text, params);
    return result.rows;
}

// Initialize database schema
async function initializeDatabase() {
    const fs = require('fs');
    const path = require('path');

    try {
        const schemaPath = path.join(process.cwd(), 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await query(schema);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}

module.exports = {
    query,
    queryOne,
    queryAll,
    getPool,
    initializeDatabase
};
