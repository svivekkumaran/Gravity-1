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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id, startDate, endDate, nextInvoice } = req.query;

    try {
        // GET /api/bills - Get all bills
        // GET /api/bills?id=xxx - Get bill by ID
        // GET /api/bills?startDate=xxx&endDate=xxx - Get bills by date range
        // GET /api/bills?nextInvoice=true - Get next invoice number
        if (req.method === 'GET') {
            if (id) {
                const bill = await db.queryOne('SELECT * FROM bills WHERE id = $1', [id]);
                return res.json(toCamelCase(bill));
            }

            if (nextInvoice === 'true') {
                const year = new Date().getFullYear();
                const bills = await db.queryAll(
                    'SELECT invoice_no FROM bills WHERE invoice_no LIKE $1',
                    [`INV${year}%`]
                );
                const nextNum = bills.length + 1;
                const invoiceNo = `INV${year}${String(nextNum).padStart(5, '0')}`;
                return res.json({ invoiceNo });
            }

            if (startDate && endDate) {
                const startDateTime = new Date(startDate + 'T00:00:00.000Z').toISOString();
                const endDateTime = new Date(endDate + 'T23:59:59.999Z').toISOString();

                const bills = await db.queryAll(
                    'SELECT * FROM bills WHERE date >= $1 AND date <= $2 ORDER BY date DESC',
                    [startDateTime, endDateTime]
                );
                return res.json(bills.map(toCamelCase));
            }

            const bills = await db.queryAll('SELECT * FROM bills ORDER BY date DESC');
            return res.json(bills.map(toCamelCase));
        }

        // POST /api/bills - Create new bill
        if (req.method === 'POST') {
            const { customerName, customerPhone, items, subtotal, cgst, sgst, igst, total, billedBy } = req.body;
            const billId = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
                'INSERT INTO bills (id, invoice_no, date, customer_name, customer_phone, billed_by, items, subtotal, cgst, sgst, igst, total) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                [billId, invoiceNo, customerName, customerPhone || '', billedBy || null, JSON.stringify(items), subtotal, cgst, sgst, igst || 0, total]
            );

            const newBill = await db.queryOne('SELECT * FROM bills WHERE id = $1', [billId]);
            return res.json(toCamelCase(newBill));
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Bills API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
