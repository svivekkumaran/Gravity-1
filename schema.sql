-- Retail Shop Pro - PostgreSQL Schema
-- Migration from SQLite to PostgreSQL for Vercel deployment

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'billing')),
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    gst_rate DECIMAL(5, 2) NOT NULL,
    min_stock DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    invoice_no TEXT UNIQUE NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT NOW(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    billed_by TEXT,
    items JSONB NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    cgst DECIMAL(10, 2) NOT NULL,
    sgst DECIMAL(10, 2) NOT NULL,
    igst DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name TEXT NOT NULL,
    address TEXT NOT NULL,
    gstin TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    state_code TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
CREATE INDEX IF NOT EXISTS idx_bills_invoice_no ON bills(invoice_no);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Insert default data
INSERT INTO users (id, username, password, role, name, email, created_at)
VALUES 
    ('user_1', 'admin', 'admin123', 'admin', 'Administrator', 'admin@retailshop.com', NOW()),
    ('user_2', 'billing', 'billing123', 'billing', 'Billing Person', 'billing@retailshop.com', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, category, price, stock, unit, gst_rate, min_stock, created_at, updated_at)
VALUES 
    ('prod_1', 'Sample Product 1', 'Electronics', 1000.00, 50, 'number', 18.00, 10, NOW(), NOW()),
    ('prod_2', 'Sample Product 2', 'Groceries', 500.00, 100, 'liters', 5.00, 20, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (id, company_name, address, gstin, phone, email, state_code)
VALUES (1, 'Retail Shop Pro', '123 Business Street, City, State - 123456', '22AAAAA0000A1Z5', '+91 9876543210', 'info@retailshop.com', '22')
ON CONFLICT (id) DO NOTHING;
