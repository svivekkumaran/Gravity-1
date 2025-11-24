const db = require('./lib/db');

async function runMigration() {
    try {
        console.log('Running migration: Add billed_by column to bills table');

        // Add billed_by column if it doesn't exist
        await db.query(`
            ALTER TABLE bills ADD COLUMN IF NOT EXISTS billed_by TEXT;
        `);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
