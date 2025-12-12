const Database = require('better-sqlite3');
const path = require('path');

// Open database
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

console.log('Running migration: add_invoice_fields');

try {
    // Add new columns to products table
    db.exec(`
        ALTER TABLE products ADD COLUMN hsn_code TEXT;
    `);
    console.log('✓ Added hsn_code to products table');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('- hsn_code column already exists in products table');
    } else {
        console.error('Error adding hsn_code:', error.message);
    }
}

try {
    // Add new columns to bills table
    db.exec(`
        ALTER TABLE bills ADD COLUMN customer_address TEXT;
    `);
    console.log('✓ Added customer_address to bills table');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('- customer_address column already exists in bills table');
    } else {
        console.error('Error adding customer_address:', error.message);
    }
}

try {
    db.exec(`
        ALTER TABLE bills ADD COLUMN customer_gstin TEXT;
    `);
    console.log('✓ Added customer_gstin to bills table');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('- customer_gstin column already exists in bills table');
    } else {
        console.error('Error adding customer_gstin:', error.message);
    }
}

try {
    db.exec(`
        ALTER TABLE bills ADD COLUMN place_of_supply TEXT DEFAULT 'Tamil Nadu (33)';
    `);
    console.log('✓ Added place_of_supply to bills table');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('- place_of_supply column already exists in bills table');
    } else {
        console.error('Error adding place_of_supply:', error.message);
    }
}

try {
    db.exec(`
        ALTER TABLE bills ADD COLUMN amount_in_words TEXT;
    `);
    console.log('✓ Added amount_in_words to bills table');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('- amount_in_words column already exists in bills table');
    } else {
        console.error('Error adding amount_in_words:', error.message);
    }
}

console.log('\nMigration completed successfully!');
db.close();
