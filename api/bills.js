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

                if (type === 'ESTIMATE') {
                    const prefix = 'EST';
                    const year = new Date().getFullYear();
                    const bills = await db.queryAll(
                        'SELECT invoice_no FROM bills WHERE invoice_no LIKE $1',
                        [`${prefix}${year}%`]
                    );
                    const nextNum = bills.length + 1;
                    const invoiceNo = `${prefix}${year}${String(nextNum).padStart(5, '0')}`;
                    return res.json({ invoiceNo });
                } else {
                    // For GST Invoice (type !== ESTIMATE)
                    // Logic: Get all invoice numbers that are purely numeric
                    // If found, take max + 1. If not found, start from 415.

                    const bills = await db.queryAll('SELECT invoice_no FROM bills');

                    let maxNum = 0;
                    for (const bill of bills) {
                        // Check if invoice_no is numeric
                        if (/^\d+$/.test(bill.invoice_no)) {
                            const num = parseInt(bill.invoice_no, 10);
                            if (num > maxNum) {
                                maxNum = num;
                            }
                        }
                    }

                    const nextNum = maxNum > 0 ? maxNum + 1 : 415;
                    return res.json({ invoiceNo: String(nextNum) });
                }
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

            let invoiceNo;
            let prefix;
            let year = new Date().getFullYear();

            if (type === 'ESTIMATE') {
                prefix = 'EST';
                // Get next invoice number using MAX to avoid race conditions
                const result = await db.queryOne(
                    `SELECT invoice_no FROM bills 
                     WHERE invoice_no LIKE $1 
                     ORDER BY invoice_no DESC 
                     LIMIT 1`,
                    [`${prefix}${year}%`]
                );

                let nextNum = 1;
                if (result && result.invoice_no) {
                    const lastNum = parseInt(result.invoice_no.replace(`${prefix}${year}`, ''));
                    nextNum = lastNum + 1;
                }
                invoiceNo = `${prefix}${year}${String(nextNum).padStart(5, '0')}`;
            } else {
                // GST Invoice Logic
                // Get max numeric invoice number
                // We fetch all because checking "IS NUMERIC" in SQL varies by DB (Postgres has regex but strict portable way is tricky without specific function)
                // However, since we are using 'better-sqlite3' locally or postgres in prod, let's stick to simple logic: select all and parse in JS or use a regex query if possible.
                // Given the code base seems to support postgres migration, let's try to be efficient.
                // But typically for invoices, fetching all 'invoice_no' is cheap enough for small businesses.
                // Or better: SELECT invoice_no FROM bills WHERE invoice_no ~ '^[0-9]+$' ORDER BY length(invoice_no) DESC, invoice_no DESC LIMIT 1 (Postgres specific)
                // Since this is node js logic, let's reuse the logic we wrote for GET to be safe across DBs if the `db` abstraction allows. 
                // Wait, previous code used `db.queryOne`. Let's assume standard SQL or do the JS way for safety if `~` isn't supported in sqlite.
                // Actually, let's keep it simple and consistent with the GET logic.

                const bills = await db.queryAll('SELECT invoice_no FROM bills');
                let maxNum = 0;
                for (const bill of bills) {
                    if (/^\d+$/.test(bill.invoice_no)) {
                        const num = parseInt(bill.invoice_no, 10);
                        if (num > maxNum) {
                            maxNum = num;
                        }
                    }
                }
                const nextNum = maxNum > 0 ? maxNum + 1 : 415;
                invoiceNo = String(nextNum);
            }

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
                        if (type === 'ESTIMATE') {
                            // Re-calculate for Estimate (simplified retry, just add random or increment locally if possible, but simplest is just retry loop logic effectively)
                            // Ideally we should re-fetch max, but for now let's just create a new random-ish one or re-fetch.
                            // Actually, let's just re-run the "fetch max" logic inside the loop? No, that's expensive.
                            // Let's just try incrementing the one we tried.
                            const currentNum = parseInt(invoiceNo.replace(`${prefix}${year}`, ''));
                            invoiceNo = `${prefix}${year}${String(currentNum + 1).padStart(5, '0')}`;
                        } else {
                            // Retry for GST
                            const currentNum = parseInt(invoiceNo);
                            invoiceNo = String(currentNum + 1);
                        }
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
