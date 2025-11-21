const db = require('../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id, username } = req.query;

    try {
        // GET /api/users - Get all users
        // GET /api/users?id=xxx - Get user by ID
        // GET /api/users?username=xxx - Get user by username
        if (req.method === 'GET') {
            if (id) {
                const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [id]);
                return res.json(user);
            }

            if (username) {
                const user = await db.queryOne('SELECT * FROM users WHERE username = $1', [username]);
                return res.json(user);
            }

            const users = await db.queryAll('SELECT * FROM users');
            return res.json(users);
        }

        // POST /api/users - Create new user
        if (req.method === 'POST') {
            const { username, password, role, name, email } = req.body;
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await db.query(
                'INSERT INTO users (id, username, password, role, name, email, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
                [userId, username, password, role, name, email || '']
            );

            const newUser = await db.queryOne('SELECT * FROM users WHERE id = $1', [userId]);
            return res.json(newUser);
        }

        // PUT /api/users?id=xxx - Update user
        if (req.method === 'PUT') {
            if (!id) {
                return res.status(400).json({ error: 'User ID required' });
            }

            const updates = req.body;
            const fields = Object.keys(updates);
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            const values = [...Object.values(updates), id];

            await db.query(
                `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1}`,
                values
            );

            const updatedUser = await db.queryOne('SELECT * FROM users WHERE id = $1', [id]);
            return res.json(updatedUser);
        }

        // DELETE /api/users?id=xxx - Delete user
        if (req.method === 'DELETE') {
            if (!id) {
                return res.status(400).json({ error: 'User ID required' });
            }

            await db.query('DELETE FROM users WHERE id = $1', [id]);
            return res.json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Users API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
