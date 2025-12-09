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
            const { users, products, bills, settings } = req.body;

            // Clear existing data
            await db.query('DELETE FROM bills');
            await db.query('DELETE FROM products');
            await db.query('DELETE FROM users');

            // Import users
            for (const user of users) {
                await db.query(
                    'INSERT INTO users (id, username, password, role, name, email, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [user.id, user.username, user.password, user.role, user.name, user.email || '', user.createdAt || user.created_at || new Date().toISOString()]
                );
            }

            // Import products
            for (const product of products) {
                await db.query(
                    'INSERT INTO products (id, name, category, price, stock, unit, gst_rate, min_stock, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [
                        product.id, product.name, product.category, product.price,
                        product.stock, product.unit || 'units', product.gstRate || product.gst_rate,
                        product.minStock || product.min_stock,
                        product.createdAt || product.created_at || new Date().toISOString(),
                        product.updatedAt || product.updated_at || new Date().toISOString()
                    ]
                );
            }

            // Import bills
            for (const bill of bills) {
                await db.query(
                    'INSERT INTO bills (id, invoice_no, date, customer_name, customer_phone, items, subtotal, cgst, sgst, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [
                        bill.id, bill.invoiceNo || bill.invoice_no, bill.date,
                        bill.customerName || bill.customer_name,
                        bill.customerPhone || bill.customer_phone || '',
                        typeof bill.items === 'string' ? bill.items : JSON.stringify(bill.items),
                        bill.subtotal, bill.cgst, bill.sgst, bill.total
                    ]
                );
            }

            // Import settings
            if (settings) {
                await db.query(
                    'UPDATE settings SET company_name = $1, address = $2, gstin = $3, phone = $4, email = $5, state_code = $6, tamil_blessing = $7 WHERE id = 1',
                    [
                        settings.companyName || settings.company_name,
                        settings.address,
                        settings.gstin,
                        settings.phone,
                        settings.email,
                        settings.stateCode || settings.state_code,
                        settings.tamilBlessing || settings.tamil_blessing || ''
                    ]
                );
            }

            return res.json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Import API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
