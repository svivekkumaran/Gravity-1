const db = require('../../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id } = req.query;

    try {
        if (req.method === 'GET') {
            // Get product by ID
            const product = await db.queryOne('SELECT * FROM products WHERE id = $1', [id]);
            return res.json(product);
        }

        if (req.method === 'PUT') {
            // Update product
            const updates = { ...req.body, updated_at: new Date().toISOString() };
            const fields = Object.keys(updates);

            // Convert camelCase to snake_case for database columns
            const dbFields = fields.map(f => {
                if (f === 'gstRate') return 'gst_rate';
                if (f === 'minStock') return 'min_stock';
                if (f === 'updatedAt') return 'updated_at';
                return f;
            });

            const setClause = dbFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            const values = [...Object.values(updates), id];

            await db.query(
                `UPDATE products SET ${setClause} WHERE id = $${fields.length + 1}`,
                values
            );

            const updatedProduct = await db.queryOne('SELECT * FROM products WHERE id = $1', [id]);
            return res.json(updatedProduct);
        }

        if (req.method === 'DELETE') {
            // Delete product
            await db.query('DELETE FROM products WHERE id = $1', [id]);
            return res.json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Product API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
