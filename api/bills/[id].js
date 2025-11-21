const db = require('../../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id } = req.query;

    try {
        if (req.method === 'GET') {
            // Get bill by ID
            const bill = await db.queryOne('SELECT * FROM bills WHERE id = $1', [id]);
            return res.json(bill);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Bill API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
