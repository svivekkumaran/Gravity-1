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
                const { type } = req.query;
                const prefix = type === 'ESTIMATE' ? 'EST' : 'INV';
                const year = new Date().getFullYear();
                const bills = await db.queryAll(
                    'SELECT invoice_no FROM bills WHERE invoice_no LIKE $1',
                    [`${prefix}${year}%`]
                );
                const nextNum = bills.length + 1;
                const invoiceNo = `${prefix}${year}${String(nextNum).padStart(5, '0')}`;
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
            const { type, customerName, customerPhone, customerAddress, customerGstin, deliveryAddress, placeOfSupply, amountInWords, discount, transportVehicleNumber, transportCharge, billingNotes, items, subtotal, cgst, sgst, igst, total, billedBy, date } = req.body;
            const billId = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Determine prefix based on type
            const prefix = type === 'ESTIMATE' ? 'EST' : 'INV';

            // Get next invoice number using MAX to avoid race conditions
            const year = new Date().getFullYear();
            const result = await db.queryOne(
                `SELECT invoice_no FROM bills 
                 WHERE invoice_no LIKE $1 
                 ORDER BY invoice_no DESC 
                 LIMIT 1`,
                [`${prefix}${year}%`]
            );

            let nextNum = 1;
            if (result && result.invoice_no) {
                // Extract the number from the last invoice (e.g., "INV202500014" -> 14)
                const lastNum = parseInt(result.invoice_no.replace(`${prefix}${year}`, ''));
                nextNum = lastNum + 1;
            }

            let invoiceNo = `${prefix}${year}${String(nextNum).padStart(5, '0')}`; // Changed const to let for retry logic

            // Update stock for each item
            for (const item of items) {
                await db.query(
                    'UPDATE products SET stock = stock - $1 WHERE id = $2',
                    [item.qty, item.productId]
                );
            }

            // Insert bill with retry logic for duplicate invoice numbers
            let retries = 3;
            let newBill = null;

            // Use provided date or default to NOW()
            const billDateValue = date ? `${date} ${new Date().toLocaleTimeString('en-US', { hour12: false })}` : 'NOW()';
            const dateParams = date ? billDateValue : null;

            while (retries > 0 && !newBill) {
                try {
                    // We need to handle SQL injection carefully here. 
                    // If date is provided, we pass it as a parameter. If not, we use NOW() in SQL.
                    // To keep it simple with parameterized queries:
                    // We'll use a CASE or just simple logic in JS.

                    const queryDate = date ? '$3' : 'NOW()';
                    // We need to shift all other parameter indices if we insert a custom date at $3
                    // Actually, let's just use the provided date string or current timestamp string from JS to be consistent

                    const timestamp = date ? new Date(date) : new Date();
                    // Keep time if it's today, otherwise maybe noon? 
                    // Let's just use the provided date string extended with current time if it's today, or just date if backdated.
                    // Ideally user just sends 'YYYY-MM-DD'. We should append current time to avoid Bills all being at 00:00:00.

                    const finalDate = date ? date + ' ' + new Date().toTimeString().split(' ')[0] : new Date().toISOString();

                    await db.query(
                        'INSERT INTO bills (id, invoice_no, date, customer_name, customer_phone, customer_address, customer_gstin, delivery_address, place_of_supply, amount_in_words, discount, transport_vehicle_number, transport_charge, billing_notes, billed_by, items, subtotal, cgst, sgst, igst, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)',
                        [billId, invoiceNo, finalDate, customerName, customerPhone || '', customerAddress || '', customerGstin || '', deliveryAddress || '', placeOfSupply || 'Tamil Nadu (33)', amountInWords || '', discount || 0, transportVehicleNumber || '', transportCharge || 0, billingNotes || '', billedBy || null, JSON.stringify(items), subtotal, cgst, sgst, igst || 0, total]
                    );
                    newBill = await db.queryOne('SELECT * FROM bills WHERE id = $1', [billId]);
                    break;
                } catch (error) {
                    if (error.message.includes('duplicate key') && retries > 1) {
                        // Regenerate invoice number and retry
                        retries--;
                        const timestamp = Date.now();
                        nextNum = parseInt(String(timestamp).slice(-5));
                        invoiceNo = `${prefix}${year}${String(nextNum).padStart(5, '0')}`;
                    } else {
                        throw error;
                    }
                }
            }

            return res.json(toCamelCase(newBill));
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Bills API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
