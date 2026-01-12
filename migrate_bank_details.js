const Database = require('better-sqlite3');
const path = require('path');

// Open database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Running migration: add_bank_details');

const columns = [
    'account_holder_name',
    'account_number',
    'ifsc_code',
    'bank_name'
];

columns.forEach(column => {
    try {
        db.exec(`
            ALTER TABLE settings ADD COLUMN ${column} TEXT DEFAULT '';
        `);
        console.log(`✓ Added ${column} to settings table`);
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log(`- ${column} column already exists in settings table`);
        } else {
            console.error(`Error adding ${column}:`, error.message);
        }
    }
});

console.log('\nMigration completed successfully!');
db.close();
