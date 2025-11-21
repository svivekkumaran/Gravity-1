const db = require('../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Export all data
            const users = await db.queryAll('SELECT * FROM users');
            const products = await db.queryAll('SELECT * FROM products');
            const bills = await db.queryAll('SELECT * FROM bills');
            const settings = await db.queryOne('SELECT * FROM settings WHERE id = 1');

            return res.json({ users, products, bills, settings });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Export API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
