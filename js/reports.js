// ============================================
// REPORTS MODULE
// ============================================

const ReportsManager = {
    // Get sales report for date range
    async getSalesReport(startDate, endDate) {
        const bills = await DB.getBillsByDateRange(startDate, endDate);

        let totalSales = 0;
        let totalGST = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalBills = bills.length;

        bills.forEach(bill => {
            totalSales += parseFloat(bill.total) || 0;
            totalCGST += parseFloat(bill.cgst) || 0;
            totalSGST += parseFloat(bill.sgst) || 0;
            totalGST += (parseFloat(bill.cgst) || 0) + (parseFloat(bill.sgst) || 0);
        });

        return {
            bills,
            totalBills,
            totalSales,
            totalGST,
            totalCGST,
            totalSGST,
            netSales: totalSales - totalGST
        };
    },

    // Render sales report
    async renderSalesReport(startDate, endDate) {
        const report = await this.getSalesReport(startDate, endDate);

        // Update summary cards
        document.getElementById('totalBills').textContent = report.totalBills;
        document.getElementById('totalSales').textContent = formatCurrency(report.totalSales);
        document.getElementById('totalGST').textContent = formatCurrency(report.totalGST);
        document.getElementById('netSales').textContent = formatCurrency(report.netSales);

        // Render bills table
        const tbody = document.getElementById('salesTableBody');

        const columns = [
            { field: 'invoiceNo', label: 'Invoice No' },
            {
                field: 'date',
                label: 'Date',
                render: (bill) => formatDate(bill.date)
            },
            { field: 'customerName', label: 'Customer' },
            {
                field: 'items',
                label: 'Items',
                render: (bill) => bill.items.length
            },
            {
                field: 'subtotal',
                label: 'Subtotal',
                render: (bill) => formatCurrency(bill.subtotal)
            },
            {
                field: 'gst',
                label: 'GST',
                render: (bill) => formatCurrency((bill.cgst || 0) + (bill.sgst || 0))
            },
            {
                field: 'total',
                label: 'Total',
                render: (bill) => formatCurrency(bill.total)
            },
            {
                field: 'actions',
                label: 'Actions',
                render: (bill) => `
          <button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="(async () => { const b = await DB.getBillById('${bill.id}'); PDFGenerator.generateInvoice(b); })()">
            View Invoice
          </button>
        `
            }
        ];

        populateTable(tbody, report.bills, columns);
    },

    // Get stock report
    async getStockReport() {
        const products = await DB.getProducts();

        let totalProducts = products.length;
        let totalStockValue = 0;
        let lowStockCount = 0;

        products.forEach(product => {
            totalStockValue += product.price * product.stock;
            if (product.stock <= product.minStock) {
                lowStockCount++;
            }
        });

        return {
            products,
            totalProducts,
            totalStockValue,
            lowStockCount
        };
    },

    // Render stock report
    async renderStockReport() {
        const report = await this.getStockReport();

        // Update summary
        document.getElementById('totalProducts').textContent = report.totalProducts;
        document.getElementById('totalStockValue').textContent = formatCurrency(report.totalStockValue);
        document.getElementById('lowStockCount').textContent = report.lowStockCount;

        // Render table
        const tbody = document.getElementById('stockTableBody');

        const columns = [
            { field: 'name', label: 'Product Name' },
            { field: 'category', label: 'Category' },
            {
                field: 'stock',
                label: 'Current Stock',
                render: (product) => {
                    const isLow = product.stock <= product.minStock;
                    const unit = product.unit || 'units';
                    return `<span class="badge ${isLow ? 'badge-danger' : 'badge-success'}">
            ${product.stock} ${unit}
          </span>`;
                }
            },
            {
                field: 'minStock',
                label: 'Min Stock',
                render: (product) => product.minStock
            },
            {
                field: 'price',
                label: 'Price',
                render: (product) => formatCurrency(product.price)
            },
            {
                field: 'value',
                label: 'Stock Value',
                render: (product) => formatCurrency(product.price * product.stock)
            }
        ];

        populateTable(tbody, report.products, columns);
    },

    // Get GST report
    async getGSTReport(startDate, endDate) {
        const bills = await DB.getBillsByDateRange(startDate, endDate);

        const gstBreakdown = {
            '0': { sales: 0, cgst: 0, sgst: 0 },
            '5': { sales: 0, cgst: 0, sgst: 0 },
            '12': { sales: 0, cgst: 0, sgst: 0 },
            '18': { sales: 0, cgst: 0, sgst: 0 },
            '28': { sales: 0, cgst: 0, sgst: 0 }
        };

        bills.forEach(bill => {
            bill.items.forEach(item => {
                const rate = item.gstRate.toString();
                const itemSubtotal = item.price * item.qty;
                const gst = calculateGST(itemSubtotal, item.gstRate);

                if (gstBreakdown[rate]) {
                    gstBreakdown[rate].sales += itemSubtotal;
                    gstBreakdown[rate].cgst += gst.cgst;
                    gstBreakdown[rate].sgst += gst.sgst;
                }
            });
        });

        return gstBreakdown;
    },

    // Render GST report
    async renderGSTReport(startDate, endDate) {
        const gstBreakdown = await this.getGSTReport(startDate, endDate);

        const tbody = document.getElementById('gstTableBody');
        tbody.innerHTML = '';

        let totalSales = 0;
        let totalCGST = 0;
        let totalSGST = 0;

        Object.keys(gstBreakdown).forEach(rate => {
            const data = gstBreakdown[rate];

            if (data.sales > 0) {
                totalSales += data.sales;
                totalCGST += data.cgst;
                totalSGST += data.sgst;

                const tr = document.createElement('tr');
                tr.innerHTML = `
          <td>${rate}%</td>
          <td class="text-right">${formatCurrency(data.sales)}</td>
          <td class="text-right">${formatCurrency(data.cgst)}</td>
          <td class="text-right">${formatCurrency(data.sgst)}</td>
          <td class="text-right"><strong>${formatCurrency(data.cgst + data.sgst)}</strong></td>
        `;
                tbody.appendChild(tr);
            }
        });

        // Add total row
        const totalRow = document.createElement('tr');
        totalRow.style.background = 'rgba(102, 126, 234, 0.1)';
        totalRow.style.fontWeight = 'bold';
        totalRow.innerHTML = `
      <td>Total</td>
      <td class="text-right">${formatCurrency(totalSales)}</td>
      <td class="text-right">${formatCurrency(totalCGST)}</td>
      <td class="text-right">${formatCurrency(totalSGST)}</td>
      <td class="text-right">${formatCurrency(totalCGST + totalSGST)}</td>
    `;
        tbody.appendChild(totalRow);
    },

    // Product-wise sales analysis
    async getProductAnalysis(startDate, endDate) {
        const bills = await DB.getBillsByDateRange(startDate, endDate);
        const productSales = {};

        bills.forEach(bill => {
            bill.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        name: item.name,
                        qty: 0,
                        revenue: 0
                    };
                }
                productSales[item.productId].qty += item.qty;
                productSales[item.productId].revenue += item.price * item.qty;
            });
        });

        return Object.values(productSales).sort((a, b) => b.revenue - a.revenue);
    },

    // Export report to CSV
    async exportSalesReport(startDate, endDate) {
        const report = await this.getSalesReport(startDate, endDate);

        const csvData = report.bills.map(bill => ({
            'Invoice No': bill.invoiceNo,
            'Date': formatDate(bill.date),
            'Customer': bill.customerName,
            'Items': bill.items.length,
            'Subtotal': bill.subtotal,
            'CGST': bill.cgst,
            'SGST': bill.sgst,
            'Total': bill.total,
            'Billed By': bill.billedBy || 'N/A'
        }));

        exportToCSV(csvData, 'sales_report');
    },

    // Export stock report to CSV
    async exportStockReport() {
        const report = await this.getStockReport();

        const csvData = report.products.map(product => ({
            'Product Name': product.name,
            'Category': product.category,
            'Current Stock': product.stock,
            'Unit': product.unit || 'units',
            'Min Stock': product.minStock,
            'Price': product.price,
            'GST Rate': product.gstRate + '%',
            'Stock Value': product.price * product.stock
        }));

        exportToCSV(csvData, 'stock_report');
    }
};
