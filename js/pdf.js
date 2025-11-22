// ============================================
// PDF GENERATION MODULE
// Uses jsPDF library
// ============================================

const PDFGenerator = {
  // Generate invoice PDF
  async generateInvoice(bill) {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');

    const settings = await DB.getSettings();

    // Provide fallback values to prevent "undefined" in PDF
    const companyName = settings.companyName || 'Your Company Name';
    const address = settings.address || 'Company Address';
    const gstin = settings.gstin || 'GSTIN Number';
    const phone = settings.phone || 'Phone Number';
    const email = settings.email || 'Email Address';

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${bill.invoiceNo}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            padding: 20px;
            color: #333;
            background: white;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #333;
            padding: 30px;
          }
          
          .invoice-header {
            text-align: center;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
          }
          
          .company-details {
            font-size: 12px;
            line-height: 1.6;
            color: #666;
          }
          
          .invoice-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            color: #333;
          }
          
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          
          .info-block {
            flex: 1;
          }
          
          .info-block h3 {
            font-size: 14px;
            margin-bottom: 10px;
            color: #667eea;
          }
          
          .info-block p {
            font-size: 12px;
            line-height: 1.6;
            color: #666;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          
          th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: bold;
          }
          
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
            font-size: 12px;
          }
          
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          
          .text-right {
            text-align: right;
          }
          
          .text-center {
            text-align: center;
          }
          
          .summary-table {
            margin-left: auto;
            width: 300px;
            margin-top: 20px;
          }
          
          .summary-table td {
            border: none;
            padding: 8px 12px;
          }
          
          .summary-table .total-row {
            background: #667eea;
            color: white;
            font-weight: bold;
            font-size: 16px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #666;
          }
          
          .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
          }
          
          .signature-block {
            text-align: center;
          }
          
          .signature-line {
            width: 200px;
            border-top: 1px solid #333;
            margin-top: 50px;
            padding-top: 5px;
            font-size: 12px;
          }
          
          @media print {
            body {
              padding: 0;
            }
            .invoice-container {
              border: none;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="invoice-header">
            <div class="company-name">${companyName}</div>
            <div class="company-details">
              ${address}<br>
              GSTIN: ${gstin} | Phone: ${phone}<br>
              Email: ${email}
            </div>
          </div>
          
          <!-- Invoice Title -->
          <div class="invoice-title">TAX INVOICE</div>
          
          <!-- Invoice Info -->
          <div class="invoice-info">
            <div class="info-block">
              <h3>Bill To:</h3>
              <p>
                <strong>${bill.customerName}</strong><br>
                ${bill.customerPhone ? 'Phone: ' + bill.customerPhone : ''}
              </p>
            </div>
            <div class="info-block" style="text-align: right;">
              <p>
                <strong>Invoice No:</strong> ${bill.invoiceNo}<br>
                <strong>Date:</strong> ${formatDate(bill.date)}<br>
                <strong>Billed By:</strong> ${bill.billedBy}
              </p>
            </div>
          </div>
          
          <!-- Items Table -->
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Product Name</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-center">GST%</th>
                <th class="text-right">GST Amt</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map((item, index) => {
      const itemSubtotal = item.price * item.qty;
      const gst = calculateGST(itemSubtotal, item.gstRate);
      const itemTotal = itemSubtotal + gst.total;

      return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td class="text-center">${item.qty}</td>
                    <td class="text-right">${formatCurrency(item.price)}</td>
                    <td class="text-center">${item.gstRate}%</td>
                    <td class="text-right">${formatCurrency(gst.total)}</td>
                    <td class="text-right"><strong>${formatCurrency(itemTotal)}</strong></td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
          
          <!-- Summary -->
          <table class="summary-table">
            <tr>
              <td>Subtotal:</td>
              <td class="text-right"><strong>${formatCurrency(bill.subtotal)}</strong></td>
            </tr>
            <tr>
              <td>CGST:</td>
              <td class="text-right">${formatCurrency(bill.cgst)}</td>
            </tr>
            <tr>
              <td>SGST:</td>
              <td class="text-right">${formatCurrency(bill.sgst)}</td>
            </tr>
            ${bill.igst > 0 ? `
              <tr>
                <td>IGST:</td>
                <td class="text-right">${formatCurrency(bill.igst)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td>Grand Total:</td>
              <td class="text-right">${formatCurrency(bill.total)}</td>
            </tr>
          </table>
          
          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-block">
              <div class="signature-line">Customer Signature</div>
            </div>
            <div class="signature-block">
              <div class="signature-line">Authorized Signatory</div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>This is a computer-generated invoice and does not require a physical signature.</p>
          </div>
          
          <!-- Print Button -->
          <div style="text-align: center; margin-top: 30px;" class="no-print">
            <button onclick="window.print()" style="padding: 12px 30px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-right: 10px;">
              Print Invoice
            </button>
            <button onclick="window.close()" style="padding: 12px 30px; background: #666; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
              Close
            </button>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  }
};
