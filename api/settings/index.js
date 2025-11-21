const db = require('../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Get settings
            const settings = await db.queryOne('SELECT * FROM settings WHERE id = 1');
            return res.json(settings);
        }

        if (req.method === 'PUT') {
            // Update settings
            const { companyName, address, gstin, phone, email, stateCode } = req.body;

            await db.query(
                'UPDATE settings SET company_name = $1, address = $2, gstin = $3, phone = $4, email = $5, state_code = $6 WHERE id = 1',
                [companyName, address, gstin, phone, email, stateCode]
            );

            const settings = await db.queryOne('SELECT * FROM settings WHERE id = 1');
            return res.json(settings);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Settings API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
