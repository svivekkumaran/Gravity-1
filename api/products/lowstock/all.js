const db = require('../../lib/db');

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
            // Get low stock products
            const products = await db.queryAll(
                'SELECT * FROM products WHERE stock <= min_stock ORDER BY stock ASC'
            );
            return res.json(products);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Low stock API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
