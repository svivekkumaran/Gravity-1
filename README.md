# Retail Shop Pro - PostgreSQL Edition

A modern retail shop management system with billing, inventory, GST calculations, and comprehensive reporting. Now powered by PostgreSQL for serverless deployment on Vercel.

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
- **Backend**: Node.js with Express (Serverless Functions)
- **Database**: PostgreSQL (Vercel Postgres)
- **Deployment**: Vercel
- **PDF Generation**: jsPDF library

## 📦 Installation

### For Vercel Deployment (Recommended)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed Vercel deployment instructions.

### For Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/svivekkumaran/Gravity-1.git
   cd Gravity-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Vercel Postgres** (for local development)
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and link project
   vercel login
   vercel link
   
   # Pull environment variables
   vercel env pull .env.local
   ```

4. **Initialize database**
   ```bash
   node -e "require('./lib/db').initializeDatabase()"
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔐 Default Credentials

- **Admin**: `admin` / `admin123`
- **Billing**: `billing` / `billing123`

**⚠️ Change these passwords in production!**

## 📁 Project Structure

```
Gravity-1/
├── api/                    # Vercel serverless functions
│   ├── users/             # User management endpoints
│   ├── products/          # Product management endpoints
│   ├── bills/             # Billing endpoints
│   ├── settings/          # Settings endpoints
│   ├── export.js          # Data export
│   ├── import.js          # Data import
│   └── clear.js           # Clear data
├── lib/
│   └── db.js              # PostgreSQL connection & utilities
├── js/
│   ├── auth.js            # Authentication logic
│   ├── billing.js         # Billing functionality
│   ├── database.js        # API client
│   ├── products.js        # Product management
│   ├── reports.js         # Report generation
│   ├── pdf.js             # PDF generation
│   └── utils.js           # Utility functions
├── admin.html             # Admin dashboard
├── billing.html           # Billing page
├── index.html             # Login page
├── schema.sql             # PostgreSQL schema
├── vercel.json            # Vercel configuration
├── DEPLOYMENT.md          # Deployment guide
└── README.md              # This file
```

## 🌐 API Endpoints

All endpoints are available at `/api/`:

- **Users**: `/api/users`, `/api/users/[id]`, `/api/users/username/[username]`
- **Products**: `/api/products`, `/api/products/[id]`, `/api/products/search/[query]`, `/api/products/lowstock/all`
- **Bills**: `/api/bills`, `/api/bills/[id]`, `/api/bills/range`, `/api/bills/invoice/next`
- **Settings**: `/api/settings`
- **Utilities**: `/api/export`, `/api/import`, `/api/clear`

## 🔧 Environment Variables

Required environment variables (automatically set by Vercel):

```env
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
```

See `.env.example` for the complete list.

## 📊 Database Schema

The application uses PostgreSQL with the following tables:

- `users` - User accounts and authentication
- `products` - Product inventory
- `bills` - Sales transactions
- `settings` - Company settings

See `schema.sql` for the complete schema definition.

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add Vercel Postgres database
4. Deploy!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 📝 Migration from SQLite

If you're migrating from the SQLite version:

1. Export your data from the old version (Settings → Export Backup)
2. Deploy the new PostgreSQL version
3. Import your data (Settings → Import Backup)

## 🐛 Troubleshooting

### Database Connection Issues
- Verify environment variables are set
- Check Vercel Postgres dashboard for database status
- Ensure schema is initialized

### API Errors
- Check Vercel function logs
- Verify CORS settings in `vercel.json`
- Check browser console for errors

### Build Failures
- Ensure all dependencies are in `package.json`
- Check Vercel build logs
- Verify Node.js version compatibility

## 📄 License

ISC

## 👤 Author

Vivek Kumaran

## 🙏 Acknowledgments

- Built with modern web technologies
- Deployed on Vercel's edge network
- Powered by PostgreSQL for reliability and scalability
