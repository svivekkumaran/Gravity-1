const db = require('../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Get all users
            const users = await db.queryAll('SELECT * FROM users');
            return res.json(users);
        }

        if (req.method === 'POST') {
            // Create new user
            const { username, password, role, name, email } = req.body;
            const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await db.query(
                'INSERT INTO users (id, username, password, role, name, email, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
                [id, username, password, role, name, email || '']
            );

            const newUser = await db.queryOne('SELECT * FROM users WHERE id = $1', [id]);
            return res.json(newUser);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Users API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
