# Retail Shop Pro - Setup Guide

## Overview
Retail Shop Pro is a professional billing and inventory management system with SQLite database backend.

## Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

### 1. Install Dependencies
```bash
npm install
```

This will install:
- `express` - Web server framework
- `better-sqlite3` - SQLite database driver
- `cors` - Cross-origin resource sharing
- `bcrypt` - Password hashing (for future use)

### 2. Start the Server
```bash
npm start
```

The server will start on `http://localhost:3000`

### 3. Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Billing Account:**
- Username: `billing`
- Password: `billing123`

## Migrating from localStorage

If you have existing data in localStorage from the previous version:

1. **Export your data** from the old version:
   - Login as admin
   - Go to Settings
   - Click "Export Backup"
   - Save the JSON file

2. **Import into new system**:
   - Start the new server
   - Login as admin
   - Go to Settings
   - Click "Import Backup"
   - Select your saved JSON file

## Features

- ✅ User authentication with role-based access
- ✅ Product management with stock tracking
- ✅ GST-compliant billing
- ✅ PDF invoice generation
- ✅ Sales and inventory reports
- ✅ Data backup and restore
- ✅ SQLite database for persistent storage

## Database

The application uses SQLite database stored in `database.sqlite` file. This file is automatically created when you first run the server.

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, you can change it in `server.js`:
```javascript
const PORT = 3000; // Change this to another port
```

### Database Issues
If you encounter database issues, you can delete `database.sqlite` and restart the server. This will create a fresh database with default data.

### Connection Errors
Make sure the server is running before accessing the application in your browser.

## Development

To run in development mode with auto-reload (requires nodemon):
```bash
npm install -g nodemon
nodemon server.js
```

## Support

For issues or questions, please check the application logs in the terminal where the server is running.
