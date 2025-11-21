const db = require('../../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { username } = req.query;

    try {
        if (req.method === 'GET') {
            // Get user by username
            const user = await db.queryOne('SELECT * FROM users WHERE username = $1', [username]);
            return res.json(user);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('User by username API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
