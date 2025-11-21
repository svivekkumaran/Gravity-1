const db = require('../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'POST') {
            // Clear all data
            await db.query('DELETE FROM bills');
            await db.query('DELETE FROM products');
            await db.query('DELETE FROM users');

            // Re-initialize with default data
            await db.query(
                "INSERT INTO users (id, username, password, role, name, email, created_at) VALUES ('user_1', 'admin', 'admin123', 'admin', 'Administrator', 'admin@retailshop.com', NOW()), ('user_2', 'billing', 'billing123', 'billing', 'Billing Person', 'billing@retailshop.com', NOW())"
            );

            return res.json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Clear API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
