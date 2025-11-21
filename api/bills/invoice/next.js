const db = require('../../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Get next invoice number
            const year = new Date().getFullYear();
            const bills = await db.queryAll(
                'SELECT invoice_no FROM bills WHERE invoice_no LIKE $1',
                [`INV${year}%`]
            );
            const nextNum = bills.length + 1;
            const invoiceNo = `INV${year}${String(nextNum).padStart(5, '0')}`;

            return res.json({ invoiceNo });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Next invoice API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
