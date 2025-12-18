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
            '0': { sales: 0, cgst: 0, sgst: 0, igst: 0 },
            '5': { sales: 0, cgst: 0, sgst: 0, igst: 0 },
            '12': { sales: 0, cgst: 0, sgst: 0, igst: 0 },
            '18': { sales: 0, cgst: 0, sgst: 0, igst: 0 },
            '28': { sales: 0, cgst: 0, sgst: 0, igst: 0 }
        };

        bills.forEach(bill => {
            bill.items.forEach(item => {
                // FIX: Parse gstRate to remove decimals (e.g., "18.00" -> "18")
                const rate = Math.floor(parseFloat(item.gstRate)).toString();
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
        if (!tbody) return;

        tbody.innerHTML = '';

        let totalSales = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let rowCount = 0;

        Object.keys(gstBreakdown).forEach(rate => {
            const data = gstBreakdown[rate];

            if (data.sales > 0) {
                totalSales += data.sales;
                totalCGST += data.cgst;
                totalSGST += data.sgst;
                rowCount++;

                const tr = document.createElement('tr');
                tr.innerHTML = `
          <td>${rate}%</td>
          <td>${formatCurrency(data.sales)}</td>
          <td>${formatCurrency(data.cgst)}</td>
          <td>${formatCurrency(data.sgst)}</td>
          <td>${formatCurrency(data.igst || 0)}</td>
          <td><strong>${formatCurrency(data.cgst + data.sgst)}</strong></td>
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
      <td>${formatCurrency(totalSales)}</td>
      <td>${formatCurrency(totalCGST)}</td>
      <td>${formatCurrency(totalSGST)}</td>
      <td>${formatCurrency(0)}</td>
      <td>${formatCurrency(totalCGST + totalSGST)}</td>
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

        // Add date range header rows
        const csvData = [
            { 'Field': 'Report Period', 'Value': `${formatDate(startDate)} to ${formatDate(endDate)}` },
            { 'Field': '', 'Value': '' }, // Empty row
            ...report.bills.map(bill => ({
                'Invoice No': bill.invoiceNo,
                'Date': formatDate(bill.date),
                'Customer Name': bill.customerName,
                'Customer Phone': bill.customerPhone || '',
                'Customer Address': bill.customerAddress || '',
                'Customer GSTIN': bill.customerGstin || '',
                'Delivery Address': bill.deliveryAddress || '',
                'Place of Supply': bill.placeOfSupply || '',
                'Items Count': bill.items.length,
                'Subtotal': bill.subtotal,
                'CGST': bill.cgst,
                'SGST': bill.sgst,
                'IGST': bill.igst || 0,
                'Discount': bill.discount || 0,
                'Transport Vehicle': bill.transportVehicleNumber || '',
                'Transport Charge': bill.transportCharge || 0,
                'Total': bill.total,
                'Amount in Words': bill.amountInWords || '',
                'Billing Notes': bill.billingNotes || '',
                'Billed By': bill.billedBy || 'N/A'
            }))
        ];

        exportToCSV(csvData, 'sales_report');
    },

    // Export stock report to CSV
    async exportStockReport() {
        const report = await this.getStockReport();
        const today = getTodayDate();

        // Add date header row
        const csvData = [
            { 'Field': 'Report Date', 'Value': formatDate(today) },
            { 'Field': '', 'Value': '' }, // Empty row
            ...report.products.map(product => ({
                'Product Name': product.name,
                'Category': product.category,
                'HSN Code': product.hsnCode || '',
                'Current Stock': product.stock,
                'Unit': product.unit || 'units',
                'Min Stock': product.minStock,
                'Price': product.price,
                'GST Rate': product.gstRate + '%',
                'Stock Value': product.price * product.stock
            }))
        ];

        exportToCSV(csvData, 'stock_report');
    },

    // Export GST report to CSV
    async exportGSTReport(startDate, endDate) {
        const gstBreakdown = await this.getGSTReport(startDate, endDate);

        // Add date range header rows
        const csvData = [
            { 'Field': 'Report Period', 'Value': `${formatDate(startDate)} to ${formatDate(endDate)}` },
            { 'Field': '', 'Value': '' }, // Empty row
        ];

        let totalSales = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;

        // Add rows for each GST rate with data
        Object.keys(gstBreakdown).forEach(rate => {
            const data = gstBreakdown[rate];
            if (data.sales > 0) {
                totalSales += data.sales;
                totalCGST += data.cgst;
                totalSGST += data.sgst;
                totalIGST += data.igst || 0;

                csvData.push({
                    'GST Rate': rate + '%',
                    'Taxable Amount': data.sales.toFixed(2),
                    'CGST': data.cgst.toFixed(2),
                    'SGST': data.sgst.toFixed(2),
                    'IGST': (data.igst || 0).toFixed(2),
                    'Total GST': (data.cgst + data.sgst).toFixed(2)
                });
            }
        });

        // Add total row
        csvData.push({
            'GST Rate': 'Total',
            'Taxable Amount': totalSales.toFixed(2),
            'CGST': totalCGST.toFixed(2),
            'SGST': totalSGST.toFixed(2),
            'IGST': totalIGST.toFixed(2),
            'Total GST': (totalCGST + totalSGST).toFixed(2)
        });

        exportToCSV(csvData, 'gst_report');
    }
};
