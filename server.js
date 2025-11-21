const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Initialize SQLite Database
const db = new Database('database.sqlite');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    stock REAL NOT NULL,
    unit TEXT NOT NULL,
    gstRate REAL NOT NULL,
    minStock REAL NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    invoiceNo TEXT UNIQUE NOT NULL,
    date TEXT NOT NULL,
    customerName TEXT NOT NULL,
    customerPhone TEXT,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    cgst REAL NOT NULL,
    sgst REAL NOT NULL,
    total REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    companyName TEXT NOT NULL,
    address TEXT NOT NULL,
    gstin TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    stateCode TEXT NOT NULL
  );
`);

// Initialize default data if tables are empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
    const defaultUsers = [
        {
            id: 'user_1',
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            name: 'Administrator',
            email: 'admin@retailshop.com',
            createdAt: new Date().toISOString()
        },
        {
            id: 'user_2',
            username: 'billing',
            password: 'billing123',
            role: 'billing',
            name: 'Billing Person',
            email: 'billing@retailshop.com',
            createdAt: new Date().toISOString()
        }
    ];

    const insertUser = db.prepare(`
    INSERT INTO users (id, username, password, role, name, email, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

    for (const user of defaultUsers) {
        insertUser.run(user.id, user.username, user.password, user.role, user.name, user.email, user.createdAt);
    }
}

const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (productCount.count === 0) {
    const defaultProducts = [
        {
            id: 'prod_1',
            name: 'Sample Product 1',
            category: 'Electronics',
            price: 1000,
            stock: 50,
            unit: 'number',
            gstRate: 18,
            minStock: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'prod_2',
            name: 'Sample Product 2',
            category: 'Groceries',
            price: 500,
            stock: 100,
            unit: 'liters',
            gstRate: 5,
            minStock: 20,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    const insertProduct = db.prepare(`
    INSERT INTO products (id, name, category, price, stock, unit, gstRate, minStock, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    for (const product of defaultProducts) {
        insertProduct.run(
            product.id, product.name, product.category, product.price,
            product.stock, product.unit, product.gstRate, product.minStock,
            product.createdAt, product.updatedAt
        );
    }
}

const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
if (settingsCount.count === 0) {
    db.prepare(`
    INSERT INTO settings (id, companyName, address, gstin, phone, email, stateCode)
    VALUES (1, ?, ?, ?, ?, ?, ?)
  `).run(
        'Retail Shop Pro',
        '123 Business Street, City, State - 123456',
        '22AAAAA0000A1Z5',
        '+91 9876543210',
        'info@retailshop.com',
        '22'
    );
}

// ============================================
// API ENDPOINTS
// ============================================

// Get all data (for compatibility)
app.get('/api/data', (req, res) => {
    try {
        const users = db.prepare('SELECT * FROM users').all();
        const products = db.prepare('SELECT * FROM products').all();
        const bills = db.prepare('SELECT * FROM bills').all().map(bill => ({
            ...bill,
            items: JSON.parse(bill.items)
        }));
        const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();

        res.json({
            users,
            products,
            bills,
            settings
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// USER ENDPOINTS
app.get('/api/users', (req, res) => {
    try {
        const users = db.prepare('SELECT * FROM users').all();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id', (req, res) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/username/:username', (req, res) => {
    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', (req, res) => {
    try {
        const { username, password, role, name, email } = req.body;
        const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const createdAt = new Date().toISOString();

        db.prepare(`
      INSERT INTO users (id, username, password, role, name, email, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, password, role, name, email, createdAt);

        const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        res.json(newUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', (req, res) => {
    try {
        const updates = req.body;
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), req.params.id];

        db.prepare(`UPDATE users SET ${fields} WHERE id = ?`).run(...values);

        const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PRODUCT ENDPOINTS
app.get('/api/products', (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products').all();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/:id', (req, res) => {
    try {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/search/:query', (req, res) => {
    try {
        const query = `%${req.params.query.toLowerCase()}%`;
        const products = db.prepare(`
      SELECT * FROM products 
      WHERE LOWER(name) LIKE ? OR LOWER(category) LIKE ?
    `).all(query, query);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/lowstock/all', (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products WHERE stock <= minStock').all();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', (req, res) => {
    try {
        const { name, category, price, stock, unit, gstRate, minStock } = req.body;
        const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;

        db.prepare(`
      INSERT INTO products (id, name, category, price, stock, unit, gstRate, minStock, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, category, price, stock, unit, gstRate, minStock, createdAt, updatedAt);

        const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        res.json(newProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', (req, res) => {
    try {
        const updates = { ...req.body, updatedAt: new Date().toISOString() };
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), req.params.id];

        db.prepare(`UPDATE products SET ${fields} WHERE id = ?`).run(...values);

        const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// BILL ENDPOINTS
app.get('/api/bills', (req, res) => {
    try {
        const bills = db.prepare('SELECT * FROM bills').all().map(bill => ({
            ...bill,
            items: JSON.parse(bill.items)
        }));
        res.json(bills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bills/:id', (req, res) => {
    try {
        const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(req.params.id);
        if (bill) {
            bill.items = JSON.parse(bill.items);
        }
        res.json(bill);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bills/range/:startDate/:endDate', (req, res) => {
    try {
        // Convert date-only strings to full ISO date ranges
        // startDate: beginning of the day (00:00:00)
        // endDate: end of the day (23:59:59.999)
        const startDateTime = new Date(req.params.startDate + 'T00:00:00.000Z').toISOString();
        const endDateTime = new Date(req.params.endDate + 'T23:59:59.999Z').toISOString();

        const bills = db.prepare(`
      SELECT * FROM bills 
      WHERE date >= ? AND date <= ?
    `).all(startDateTime, endDateTime).map(bill => ({
            ...bill,
            items: JSON.parse(bill.items)
        }));
        res.json(bills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bills/invoice/next', (req, res) => {
    try {
        const year = new Date().getFullYear();
        const bills = db.prepare(`
      SELECT invoiceNo FROM bills WHERE invoiceNo LIKE ?
    `).all(`INV${year}%`);
        const nextNum = bills.length + 1;
        const invoiceNo = `INV${year}${String(nextNum).padStart(5, '0')}`;
        res.json({ invoiceNo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bills', (req, res) => {
    try {
        const { customerName, customerPhone, items, subtotal, cgst, sgst, total } = req.body;
        const id = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const date = new Date().toISOString();

        // Get next invoice number
        const year = new Date().getFullYear();
        const bills = db.prepare(`SELECT invoiceNo FROM bills WHERE invoiceNo LIKE ?`).all(`INV${year}%`);
        const nextNum = bills.length + 1;
        const invoiceNo = `INV${year}${String(nextNum).padStart(5, '0')}`;

        // Update stock for each item
        const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
        for (const item of items) {
            updateStock.run(item.qty, item.productId);
        }

        // Insert bill
        db.prepare(`
      INSERT INTO bills (id, invoiceNo, date, customerName, customerPhone, items, subtotal, cgst, sgst, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, invoiceNo, date, customerName, customerPhone || '', JSON.stringify(items), subtotal, cgst, sgst, total);

        const newBill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
        newBill.items = JSON.parse(newBill.items);
        res.json(newBill);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// SETTINGS ENDPOINTS
app.get('/api/settings', (req, res) => {
    try {
        const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/settings', (req, res) => {
    try {
        const { companyName, address, gstin, phone, email, stateCode } = req.body;
        db.prepare(`
      UPDATE settings 
      SET companyName = ?, address = ?, gstin = ?, phone = ?, email = ?, stateCode = ?
      WHERE id = 1
    `).run(companyName, address, gstin, phone, email, stateCode);

        const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// EXPORT/IMPORT ENDPOINTS
app.get('/api/export', (req, res) => {
    try {
        const users = db.prepare('SELECT * FROM users').all();
        const products = db.prepare('SELECT * FROM products').all();
        const bills = db.prepare('SELECT * FROM bills').all().map(bill => ({
            ...bill,
            items: JSON.parse(bill.items)
        }));
        const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();

        res.json({ users, products, bills, settings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/import', (req, res) => {
    try {
        const { users, products, bills, settings } = req.body;

        // Clear existing data
        db.prepare('DELETE FROM users').run();
        db.prepare('DELETE FROM products').run();
        db.prepare('DELETE FROM bills').run();

        // Import users
        const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, role, name, email, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        for (const user of users) {
            insertUser.run(user.id, user.username, user.password, user.role, user.name, user.email || '', user.createdAt);
        }

        // Import products
        const insertProduct = db.prepare(`
      INSERT INTO products (id, name, category, price, stock, unit, gstRate, minStock, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        for (const product of products) {
            insertProduct.run(
                product.id, product.name, product.category, product.price,
                product.stock, product.unit || 'units', product.gstRate, product.minStock,
                product.createdAt, product.updatedAt
            );
        }

        // Import bills
        const insertBill = db.prepare(`
      INSERT INTO bills (id, invoiceNo, date, customerName, customerPhone, items, subtotal, cgst, sgst, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        for (const bill of bills) {
            insertBill.run(
                bill.id, bill.invoiceNo, bill.date, bill.customerName,
                bill.customerPhone || '', JSON.stringify(bill.items),
                bill.subtotal, bill.cgst, bill.sgst, bill.total
            );
        }

        // Import settings
        if (settings) {
            db.prepare(`
        UPDATE settings 
        SET companyName = ?, address = ?, gstin = ?, phone = ?, email = ?, stateCode = ?
        WHERE id = 1
      `).run(settings.companyName, settings.address, settings.gstin, settings.phone, settings.email, settings.stateCode);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/clear', (req, res) => {
    try {
        db.prepare('DELETE FROM users').run();
        db.prepare('DELETE FROM products').run();
        db.prepare('DELETE FROM bills').run();

        // Re-initialize with default data
        const defaultUsers = [
            {
                id: 'user_1',
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                name: 'Administrator',
                email: 'admin@retailshop.com',
                createdAt: new Date().toISOString()
            },
            {
                id: 'user_2',
                username: 'billing',
                password: 'billing123',
                role: 'billing',
                name: 'Billing Person',
                email: 'billing@retailshop.com',
                createdAt: new Date().toISOString()
            }
        ];

        const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, role, name, email, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        for (const user of defaultUsers) {
            insertUser.run(user.id, user.username, user.password, user.role, user.name, user.email, user.createdAt);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Retail Shop Pro server running on http://localhost:${PORT}`);
    console.log(`📊 Database: SQLite (database.sqlite)`);
});
