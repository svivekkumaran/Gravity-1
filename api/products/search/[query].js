const db = require('../../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { query } = req.query;

    try {
        if (req.method === 'GET') {
            // Search products by name or category
            const searchPattern = `%${query.toLowerCase()}%`;
            const products = await db.queryAll(
                'SELECT * FROM products WHERE LOWER(name) LIKE $1 OR LOWER(category) LIKE $1 ORDER BY name',
                [searchPattern]
            );
            return res.json(products);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Product search API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
