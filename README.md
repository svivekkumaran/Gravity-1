# Retail Shop Pro - PostgreSQL Edition

A modern retail shop management system with billing, inventory, GST calculations, and comprehensive reporting. Powered by PostgreSQL for serverless deployment on Vercel.

🚀 **Live Demo**: [https://gravity-1-three.vercel.app](https://gravity-1-three.vercel.app)

## 🚀 Features

- **User Authentication**: Role-based access (Admin & Billing)
- **Product Management**: Add, edit, delete products with stock tracking
- **Billing System**: Generate GST-compliant invoices with PDF export
- **Inventory Tracking**: Real-time stock updates and low-stock alerts
- **Reports**: Sales, stock, and GST reports with date range filtering
- **Data Management**: Export/import functionality for backups
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Vercel Serverless Functions
- **Database**: PostgreSQL (Vercel Postgres powered by Neon)
- **Deployment**: Vercel
- **PDF Generation**: jsPDF library

## 📦 Quick Start

### Deploy to Vercel

1. Fork this repository
2. Import to Vercel
3. Add Vercel Postgres database
4. Initialize schema (see [DEPLOYMENT.md](DEPLOYMENT.md))
5. Done! 🎉

### Local Development

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup instructions.

## 🔐 Default Credentials

- **Admin**: `admin` / `admin123`
- **Billing**: `billing` / `billing123`

**⚠️ Change these passwords in production!**

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[schema.sql](schema.sql)** - Database schema

## 🌐 API Endpoints

All endpoints are serverless functions in `/api/`:

- `GET/POST /api/users` - User management
- `GET/POST /api/products` - Product management
- `GET/POST /api/bills` - Billing operations
- `GET/PUT /api/settings` - Settings
- `GET /api/export` - Data export
- `POST /api/import` - Data import
- `POST /api/clear` - Clear data

## 📄 License

ISC

## 👤 Author

Vivek Kumaran

---

Built with ❤️ using modern web technologies and deployed on Vercel's edge network.
