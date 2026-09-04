const db = require('../lib/db');

// Returns the start of the Indian financial year (Apr 1) for a given date
function getFYStart(date) {
    const d = date ? new Date(date) : new Date();
    // Month is 0-indexed: 3 = April
    return d.getMonth() >= 3
        ? new Date(d.getFullYear(), 3, 1)      // Apr 1 this year
        : new Date(d.getFullYear() - 1, 3, 1); // Apr 1 last year
}

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
                    const prefix = 'KA';
                    const year = new Date().getFullYear();
                    const bills = await db.queryAll(
                        'SELECT invoice_no FROM bills WHERE invoice_no LIKE $1 OR invoice_no LIKE $2',
                        [`${prefix}${year}%`, `EST${year}%`]
                    );
                    const nextNum = bills.length + 1;
                    const invoiceNo = `${prefix}${year}${String(nextNum).padStart(5, '0')}`;
                    return res.json({ invoiceNo });
                } else {
                    // For GST Invoice — scope to the FY of the requested bill date.
                    // If a backdated bill date is passed (e.g. Mar 31), its FY is
                    // used so the number comes from the correct series.
                    const { date: billDate } = req.query; // optional: ?date=YYYY-MM-DD
                    const fyStart = getFYStart(billDate);
                    const fyEnd = new Date(fyStart.getFullYear() + 1, 3, 1); // Apr 1 next year

                    const bills = await db.queryAll(
                        'SELECT invoice_no FROM bills WHERE date >= $1 AND date < $2',
                        [fyStart.toISOString(), fyEnd.toISOString()]
                    );

                    let maxNum = 0;
                    for (const bill of bills) {
                        if (/^\d+$/.test(bill.invoice_no)) {
                            const num = parseInt(bill.invoice_no, 10);
                            if (num > maxNum) maxNum = num;
                        }
                    }

                    const nextNum = maxNum > 0 ? maxNum + 1 : 1;
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
                prefix = 'KA';
                // Get next invoice number using MAX to avoid race conditions
                const result = await db.queryOne(
                    `SELECT invoice_no FROM bills 
                     WHERE invoice_no LIKE $1 OR invoice_no LIKE $2 
                     ORDER BY invoice_no DESC 
                     LIMIT 1`,
                    [`${prefix}${year}%`, `EST${year}%`]
                );

                let nextNum = 1;
                if (result && result.invoice_no) {
                    const lastNum = parseInt(result.invoice_no.replace(/^(KA|EST)\d{4}/, ''));
                    if (!isNaN(lastNum)) {
                        nextNum = lastNum + 1;
                    }
                }
                invoiceNo = `${prefix}${year}${String(nextNum).padStart(5, '0')}`;
            } else {
                // GST Invoice Logic — scoped to the FY of the bill's actual date.
                // Backdated bills (e.g. Mar 31) correctly use the old FY series.
                const fyStart = getFYStart(date); // 'date' comes from req.body
                const fyEnd = new Date(fyStart.getFullYear() + 1, 3, 1);

                const bills = await db.queryAll(
                    'SELECT invoice_no FROM bills WHERE date >= $1 AND date < $2',
                    [fyStart.toISOString(), fyEnd.toISOString()]
                );
                let maxNum = 0;
                for (const bill of bills) {
                    if (/^\d+$/.test(bill.invoice_no)) {
                        const num = parseInt(bill.invoice_no, 10);
                        if (num > maxNum) maxNum = num;
                    }
                }
                const nextNum = maxNum > 0 ? maxNum + 1 : 1;
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
                            const currentNum = parseInt(invoiceNo.replace(/^(KA|EST)\d{4}/, ''));
                            const nextVal = !isNaN(currentNum) ? currentNum + 1 : 1;
                            invoiceNo = `${prefix}${year}${String(nextVal).padStart(5, '0')}`;
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
