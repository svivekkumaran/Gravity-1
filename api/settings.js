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
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Get settings
            const settings = await db.queryOne('SELECT * FROM settings WHERE id = 1');
            return res.json(toCamelCase(settings));
        }

        if (req.method === 'PUT') {
            // Update settings
            const { companyName, address, gstin, phone, email, stateCode, tamilBlessing, accountHolderName, accountNumber, ifscCode, bankName } = req.body;

            await db.query(
                'UPDATE settings SET company_name = $1, address = $2, gstin = $3, phone = $4, email = $5, state_code = $6, tamil_blessing = $7, account_holder_name = $8, account_number = $9, ifsc_code = $10, bank_name = $11 WHERE id = 1',
                [companyName, address, gstin, phone, email, stateCode, tamilBlessing, accountHolderName, accountNumber, ifscCode, bankName]
            );

            const settings = await db.queryOne('SELECT * FROM settings WHERE id = 1');
            return res.json(toCamelCase(settings));
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Settings API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
