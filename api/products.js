const db = require('../lib/db');

// Helper function to convert snake_case to camelCase
function toCamelCase(obj) {
    if (!obj) return obj;

    const camelCaseObj = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        camelCaseObj[camelKey] = obj[key];
    }
    return camelCaseObj;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id, query, lowstock } = req.query;

    try {
        // GET /api/products - Get all products
        // GET /api/products?id=xxx - Get product by ID
        // GET /api/products?query=xxx - Search products
        // GET /api/products?lowstock=true - Get low stock products
        if (req.method === 'GET') {
            if (id) {
                const product = await db.queryOne('SELECT * FROM products WHERE id = $1', [id]);
                return res.json(toCamelCase(product));
            }

            if (query) {
                const searchPattern = `%${query.toLowerCase()}%`;
                const products = await db.queryAll(
                    'SELECT * FROM products WHERE LOWER(name) LIKE $1 OR LOWER(category) LIKE $1 ORDER BY name',
                    [searchPattern]
                );
                return res.json(products.map(toCamelCase));
            }

            if (lowstock === 'true') {
                const products = await db.queryAll(
                    'SELECT * FROM products WHERE stock <= min_stock ORDER BY stock ASC'
                );
                return res.json(products.map(toCamelCase));
            }

            const products = await db.queryAll('SELECT * FROM products ORDER BY name');
            return res.json(products.map(toCamelCase));
        }

        // POST /api/products - Create new product
        if (req.method === 'POST') {
            const { name, category, price, stock, unit, gstRate, minStock, hsnCode } = req.body;
            const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await db.query(
                'INSERT INTO products (id, name, category, price, stock, unit, gst_rate, min_stock, hsn_code, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())',
                [productId, name, category, price, stock, unit, gstRate, minStock, hsnCode]
            );

            const newProduct = await db.queryOne('SELECT * FROM products WHERE id = $1', [productId]);
            return res.json(toCamelCase(newProduct));
        }

        // PUT /api/products?id=xxx - Update product
        if (req.method === 'PUT') {
            if (!id) {
                return res.status(400).json({ error: 'Product ID required' });
            }

            const updates = { ...req.body, updated_at: new Date().toISOString() };
            const fields = Object.keys(updates);

            // Convert camelCase to snake_case for database columns
            const dbFields = fields.map(f => {
                if (f === 'gstRate') return 'gst_rate';
                if (f === 'minStock') return 'min_stock';
                if (f === 'hsnCode') return 'hsn_code';
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
            return res.json(toCamelCase(updatedProduct));
        }

        // DELETE /api/products?id=xxx - Delete product
        if (req.method === 'DELETE') {
            if (!id) {
                return res.status(400).json({ error: 'Product ID required' });
            }

            await db.query('DELETE FROM products WHERE id = $1', [id]);
            return res.json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Products API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
