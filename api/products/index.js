const db = require('../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Get all products
            const products = await db.queryAll('SELECT * FROM products ORDER BY name');
            return res.json(products);
        }

        if (req.method === 'POST') {
            // Create new product
            const { name, category, price, stock, unit, gstRate, minStock } = req.body;
            const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await db.query(
                'INSERT INTO products (id, name, category, price, stock, unit, gst_rate, min_stock, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())',
                [id, name, category, price, stock, unit, gstRate, minStock]
            );

            const newProduct = await db.queryOne('SELECT * FROM products WHERE id = $1', [id]);
            return res.json(newProduct);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Products API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
