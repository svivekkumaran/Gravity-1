# Gravity-1

Retail Billing & Inventory Management System

A modern retail management solution built for small and medium businesses to handle billing, GST-aware invoicing, stock tracking, reporting, and daily store operations in a simple web-based workflow.

## Overview

Gravity-1 is designed to help retail businesses manage the entire sales lifecycle efficiently:

- create and print invoices
- track product stock in real time
- manage pricing and inventory entries
- handle GST calculations
- generate reports for sales and product movement
- export/import business data
- support multiple user roles for store operations

The project uses a lightweight full-stack architecture with HTML, CSS, and JavaScript for the frontend, Node.js serverless functions for the backend, and PostgreSQL for persistent data storage.

## Key Features

- User authentication and role-based access
- Product catalog management
- Inventory and stock tracking
- GST-based invoice generation
- PDF export of bills and invoices
- Reporting for sales and stock insights
- Export and import for backup/migration
- Responsive billing interface
- Admin and billing workflows

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js serverless APIs
- Database: PostgreSQL
- Deployment: Vercel
- PDF generation: jsPDF

## Project Structure

```text
Gravity-1/
├── api/                     # Serverless backend endpoints
│   ├── bills.js
│   ├── products.js
│   ├── users.js
│   ├── settings.js
│   ├── export.js
│   ├── import.js
│   ├── clear.js
│   └── generate-pdf.js
├── lib/
│   └── db.js                # Database connection helper
├── public/
│   ├── admin.html
│   ├── billing.html
│   ├── estimate.html
│   ├── index.html
│   ├── styles.css
│   └── js/
│       ├── auth.js
│       ├── billing.js
│       ├── database.js
│       ├── estimate.js
│       ├── pdf.js
│       ├── products.js
│       ├── reports.js
│       └── utils.js
├── migrations/              # Database migration files
├── schema.sql               # Database schema
├── DEPLOYMENT.md            # Setup and deployment guide
├── README.md
├── package.json
├── vercel.json
├── migrate.js
├── migrate_local.js
├── migrate_bank_details.js
└── ...
```

## Business Workflow

### Billing Flow
The billing module allows a cashier to:
- select or search products
- enter quantity and pricing
- apply GST/tax logic automatically
- generate totals
- save the invoice
- print or export a PDF bill

### Inventory Flow
When invoices are created, stock levels are updated to reflect sold products and maintain inventory accuracy.

### Reporting Flow
The reporting module helps business owners understand:
- sales performance
- stock movement
- GST-related statistics
- invoice trends over time

## Database Overview

The application stores core retail data such as:

- users
- products
- bills
- bill line items
- settings
- stock-related data
- historical invoice records

The schema is defined in `schema.sql`, while database changes are managed through migration files in `migrations/`.

## Local Setup

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Configure your PostgreSQL database connection.
4. Run the schema and migration files as needed.
5. Start the application in your local environment.

For complete setup instructions, refer to `DEPLOYMENT.md`.

## Deployment

This project is configured for Vercel deployment and uses PostgreSQL for the database layer. It is designed to be deployed in a serverless environment with API routes under `/api`.

## Default Credentials

The app includes demo credentials for local testing:

- Admin: `admin` / `admin123`
- Billing: `billing` / `billing123`

Important: change these credentials before production deployment.

## API Summary

The major API endpoints are:

- `GET /api/users`, `POST /api/users`
- `GET /api/products`, `POST /api/products`
- `GET /api/bills`, `POST /api/bills`
- `GET /api/settings`, `PUT /api/settings`
- `GET /api/export`
- `POST /api/import`
- `POST /api/clear`

## Recommended Future Enhancement

One of the strongest improvements for this project is a purchase-history-driven suggestion system.

### Idea
When a customer is identified by phone number or name, the system can:
- fetch their previous bills
- identify frequently bought products
- show quick product suggestions in the billing page
- auto-fill repeated customer information such as address and GST details
- reduce repetitive manual entry during invoicing

### Example
If a customer usually buys:
- rice
- cement
- paint
- pipes

Then the system can suggest these items automatically during repeat billing, making the process faster and more efficient.

This feature would greatly improve usability and make the billing workflow more intelligent for repeat customers.

## Security Considerations

For production use, the following improvements should be considered:

- password hashing for user records
- strict input validation
- role restrictions for administrative operations
- audit logging for sales and stock changes
- secure environment variable management

## License

ISC

## Author

S. Vivek Kumaran  
Sr Software Engineer  
Optum Global Solution