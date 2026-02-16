// ============================================
// REPORTS MODULE
// ============================================

const ReportsManager = {
    // Get sales report for date range
    async getSalesReport(startDate, endDate, filterType = 'ALL') {
        const allBills = await DB.getBillsByDateRange(startDate, endDate);

        // Filter based on type
        const bills = allBills.filter(bill => {
            const isEstimate = bill.invoiceNo && bill.invoiceNo.startsWith('EST');
            if (filterType === 'GST') return !isEstimate;
            if (filterType === 'ESTIMATE') return isEstimate;
            return true; // ALL
        });

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
    async renderSalesReport(startDate, endDate, filterType = 'ALL') {
        const report = await this.getSalesReport(startDate, endDate, filterType);

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
                label: 'View',
                render: (bill) => `
          <button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="(async () => { const b = await DB.getBillById('${bill.id}'); PDFGenerator.generateInvoice(b); })()">
            View
          </button>
        `
            },
            {
                field: 'download',
                label: 'Download',
                render: (bill) => `
          <button class="btn btn-outline" style="padding: 0.5rem 1rem;" onclick="(async () => { const b = await DB.getBillById('${bill.id}'); PDFGenerator.downloadInvoice(b); })()">
            <i class="fas fa-file-pdf"></i> Download
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
        const allBills = await DB.getBillsByDateRange(startDate, endDate);

        // Filter out estimates - GST report should ONLY show GST bills
        const bills = allBills.filter(bill => {
            const isEstimate = bill.invoiceNo && bill.invoiceNo.startsWith('EST');
            return !isEstimate; // Only exclude estimates
        });

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
    async exportSalesReport(startDate, endDate, filterType = 'ALL') {
        const report = await this.getSalesReport(startDate, endDate, filterType);

        // Prepare data as Array of Arrays for flexible CSV format
        const csvData = [
            ['Sales Report'],
            [`Report Period: ${formatDate(startDate)} to ${formatDate(endDate)}`],
            [`Filter: ${filterType}`],
            [], // Empty row
            // Table Headers
            [
                'Invoice No', 'Date', 'Customer Name', 'Customer Phone',
                'Customer Address', 'Customer GSTIN', 'Delivery Address', 'Place of Supply',
                'Items Count',
                'Product Name', 'HSN Code', 'Qty', 'Price', 'Subtotal', 'GST%', 'CGST', 'SGST', 'GST Amt',
                'Round Off', 'Grand Total'
            ]
        ];

        // Table Data
        report.bills.forEach(bill => {
            // Calculate Bill-level Round Off if missing
            let displayRoundOff = 0;
            let displayTotal = 0;

            // Re-calculate bill totals to ensure accuracy for round off logic
            const billSubtotal = parseFloat(bill.subtotal) || 0;
            const billCGST = parseFloat(bill.cgst) || 0;
            const billSGST = parseFloat(bill.sgst) || 0;
            const billIGST = parseFloat(bill.igst) || 0;
            const billTransport = parseFloat(bill.transportCharge) || 0;
            const totalWithTransport = billSubtotal + billCGST + billSGST + billIGST + billTransport;

            if (bill.roundOff !== undefined && bill.roundOff !== null && !isNaN(parseFloat(bill.roundOff))) {
                displayRoundOff = parseFloat(bill.roundOff);
                displayTotal = parseFloat(bill.total) || (totalWithTransport + displayRoundOff);
            } else {
                const roundedTotal = Math.round(totalWithTransport);
                displayRoundOff = roundedTotal - totalWithTransport;
                displayTotal = roundedTotal;
            }

            bill.items.forEach((item, index) => {
                const isFirstItem = index === 0;

                // Calculate Item GST
                const itemSubtotal = item.price * item.qty;
                const gst = calculateGST(itemSubtotal, item.gstRate);

                // Format unit for display
                let unitDisplay = item.unit || 'units';
                if (unitDisplay === 'num') unitDisplay = 'Num';
                else if (unitDisplay === 'bags') unitDisplay = item.qty === 1 ? 'Bag' : 'Bags';
                else if (unitDisplay === 'units') unitDisplay = item.qty === 1 ? 'Unit' : 'Units';
                else unitDisplay = unitDisplay.charAt(0).toUpperCase() + unitDisplay.slice(1);

                const qtyWithUnit = `${item.qty} ${unitDisplay}`;

                const row = [
                    // Bill Details (Only for first item)
                    isFirstItem ? bill.invoiceNo : '',
                    isFirstItem ? formatDate(bill.date) : '',
                    isFirstItem ? bill.customerName : '',
                    isFirstItem ? (bill.customerPhone || '') : '',
                    isFirstItem ? (bill.customerAddress || '') : '',
                    isFirstItem ? (bill.customerGstin || '') : '',
                    isFirstItem ? (bill.deliveryAddress || '') : '',
                    isFirstItem ? (bill.placeOfSupply || '') : '',
                    isFirstItem ? bill.items.length : '',

                    // Item Details (Always present)
                    item.name,
                    item.hsnCode || '',
                    qtyWithUnit,
                    item.price,
                    itemSubtotal.toFixed(2), // Item Subtotal
                    item.gstRate + '%',
                    gst.cgst.toFixed(2),     // Item CGST
                    gst.sgst.toFixed(2),     // Item SGST
                    gst.total.toFixed(2),    // Item GST Amt

                    // Bill Totals (Only for first item)
                    isFirstItem ? displayRoundOff.toFixed(2) : '',
                    isFirstItem ? displayTotal.toFixed(2) : ''
                ];
                csvData.push(row);
            });
        });

        exportToCSV(csvData, 'sales_report');
    },

    // Export stock report to CSV
    async exportStockReport() {
        const report = await this.getStockReport();
        const today = getTodayDate();

        const csvData = [
            ['Stock Report'],
            [`Report Date: ${formatDate(today)}`],
            [],
            // Headers
            [
                'Product Name', 'Category', 'HSN Code', 'Current Stock',
                'Unit', 'Min Stock', 'Price', 'GST Rate', 'Stock Value'
            ],
            // Data
            ...report.products.map(product => [
                product.name,
                product.category,
                product.hsnCode || '',
                product.stock,
                product.unit || 'units',
                product.minStock,
                product.price,
                product.gstRate + '%',
                product.price * product.stock
            ])
        ];

        exportToCSV(csvData, 'stock_report');
    },

    // Export GST report to CSV
    async exportGSTReport(startDate, endDate) {
        const gstBreakdown = await this.getGSTReport(startDate, endDate);

        const csvData = [
            ['GST Report'],
            [`Report Period: ${formatDate(startDate)} to ${formatDate(endDate)}`],
            [],
            // Headers
            ['GST Rate', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total GST']
        ];

        let totalSales = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;

        // Add data rows
        Object.keys(gstBreakdown).forEach(rate => {
            const data = gstBreakdown[rate];
            if (data.sales > 0) {
                totalSales += data.sales;
                totalCGST += data.cgst;
                totalSGST += data.sgst;
                totalIGST += data.igst || 0;

                csvData.push([
                    rate + '%',
                    data.sales.toFixed(2),
                    data.cgst.toFixed(2),
                    data.sgst.toFixed(2),
                    (data.igst || 0).toFixed(2),
                    (data.cgst + data.sgst).toFixed(2)
                ]);
            }
        });

        // Add total row
        csvData.push([
            'Total',
            totalSales.toFixed(2),
            totalCGST.toFixed(2),
            totalSGST.toFixed(2),
            totalIGST.toFixed(2),
            (totalCGST + totalSGST).toFixed(2)
        ]);

        exportToCSV(csvData, 'gst_report');
    }
};
