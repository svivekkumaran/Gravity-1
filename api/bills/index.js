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
            // Get all bills
            const bills = await db.queryAll('SELECT * FROM bills ORDER BY date DESC');
            return res.json(bills);
        }

        if (req.method === 'POST') {
            // Create new bill
            const { customerName, customerPhone, items, subtotal, cgst, sgst, total } = req.body;
            const id = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Get next invoice number
            const year = new Date().getFullYear();
            const existingBills = await db.queryAll(
                'SELECT invoice_no FROM bills WHERE invoice_no LIKE $1',
                [`INV${year}%`]
            );
            const nextNum = existingBills.length + 1;
            const invoiceNo = `INV${year}${String(nextNum).padStart(5, '0')}`;

            // Update stock for each item
            for (const item of items) {
                await db.query(
                    'UPDATE products SET stock = stock - $1 WHERE id = $2',
                    [item.qty, item.productId]
                );
            }

            // Insert bill
            await db.query(
                'INSERT INTO bills (id, invoice_no, date, customer_name, customer_phone, items, subtotal, cgst, sgst, total) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9)',
                [id, invoiceNo, customerName, customerPhone || '', JSON.stringify(items), subtotal, cgst, sgst, total]
            );

            const newBill = await db.queryOne('SELECT * FROM bills WHERE id = $1', [id]);
            return res.json(newBill);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Bills API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
