const db = require('../../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id } = req.query;

    try {
        if (req.method === 'GET') {
            // Get user by ID
            const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [id]);
            return res.json(user);
        }

        if (req.method === 'PUT') {
            // Update user
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

        if (req.method === 'DELETE') {
            // Delete user
            await db.query('DELETE FROM users WHERE id = $1', [id]);
            return res.json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('User API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
