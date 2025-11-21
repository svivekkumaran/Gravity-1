const db = require('../../lib/db');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { startDate, endDate } = req.query;

    try {
        if (req.method === 'GET') {
            // Get bills by date range
            const startDateTime = new Date(startDate + 'T00:00:00.000Z').toISOString();
            const endDateTime = new Date(endDate + 'T23:59:59.999Z').toISOString();

            const bills = await db.queryAll(
                'SELECT * FROM bills WHERE date >= $1 AND date <= $2 ORDER BY date DESC',
                [startDateTime, endDateTime]
            );
            return res.json(bills);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Bills range API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
