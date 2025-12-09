// ============================================
// PDF GENERATION MODULE
// Uses jsPDF library
// ============================================

const PDFGenerator = {
  // Helper function to format tamil blessing (underline first line)
  formatTamilBlessing(blessing) {
    if (!blessing) return '';
    const lines = blessing.split('\n');
    if (lines.length === 0) return '';

    // Underline the first line, keep rest as-is
    const firstLine = `<u>${lines[0]}</u>`;
    const remainingLines = lines.slice(1).join('<br>');

    return remainingLines ? `${firstLine}<br>${remainingLines}` : firstLine;
  },

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
    const tamilBlessing = settings.tamilBlessing || '';

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
            padding: 20px;
          }
          
          .invoice-header {
            border-bottom: 3px solid #333;
            padding-bottom: 12px;
            margin-bottom: 12px;
            position: relative;
          }
          
          .tamil-blessing {
            text-align: center;
            font-size: 10px;
            font-weight: normal;
            color: #000;
            margin-bottom: 8px;
            line-height: 1.4;
            white-space: pre-line;
          }
          
          .company-name {
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
          }
          
          .company-details {
            text-align: center;
            font-size: 12px;
            line-height: 1.6;
            color: #666;
          }
          
          .invoice-title {
            font-size: 20px;
            font-weight: bold;
            margin: 12px 0;
            color: #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .invoice-number {
            font-size: 16px;
            color: #667eea;
            font-weight: bold;
          }
          
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
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
            margin: 12px 0;
            page-break-inside: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tbody {
            display: table-row-group;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          th {
            background: #667eea;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
          }
          
          td {
            padding: 6px 8px;
            border-bottom: 1px solid #ddd;
            font-size: 11px;
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
            margin-top: 10px;
            page-break-inside: avoid;
          }
          
          .summary-table td {
            border: none;
            padding: 5px 8px;
          }
          
          .summary-table .total-row {
            background: #667eea;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          
          .footer {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #666;
            page-break-inside: avoid;
          }
          
          .signature-section {
            margin-top: 15px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            page-break-before: avoid;
          }
          
          .signature-block {
            text-align: center;
          }
          
          .signature-line {
            width: 200px;
            border-top: 1px solid #333;
            margin-top: 35px;
            padding-top: 5px;
            font-size: 11px;
          }
          
          @page {
            margin: 0.5cm;
            size: A4;
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
            /* Prevent page breaks */
            .summary-table,
            .signature-section,
            .footer {
              page-break-inside: avoid;
            }
            
            /* Keep Terms & Conditions with signature */
            .signature-section {
              page-break-before: avoid;
            }
            
            /* Allow table to break naturally but keep rows together */
            table {
              page-break-inside: auto;
            }
            
            thead {
              display: table-header-group;
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            /* Fix Chrome color printing */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="invoice-header">
            ${tamilBlessing ? `<div class="tamil-blessing">${this.formatTamilBlessing(tamilBlessing)}</div>` : ''}
            <div class="company-name">${companyName}</div>
            <div class="company-details">
              ${address}<br>
              GSTIN: ${gstin} | Phone: ${phone}<br>
              Email: ${email}
            </div>
          </div>
          
          <!-- Invoice Title -->
          <div class="invoice-title">
            <span>TAX INVOICE</span>
            <span class="invoice-number">Invoice No: ${bill.invoiceNo}</span>
          </div>
          
          <!-- Invoice Info -->
          <div class="invoice-info">
            <div class="info-block">
              <h3>Bill To:</h3>
              <p>
                <strong>${bill.customerName}</strong><br>
                ${bill.customerAddress ? bill.customerAddress + '<br>' : ''}
                ${bill.customerPhone ? 'Phone: ' + bill.customerPhone + '<br>' : ''}
                ${bill.customerGstin ? 'GSTIN: ' + bill.customerGstin : ''}
              </p>
              ${bill.deliveryAddress ? `
              <p style="margin-top: 10px;">
                <strong>Deliver To:</strong><br>
                ${bill.deliveryAddress}
              </p>
              ` : ''}
            </div>
            <div class="info-block" style="text-align: right;">
              <p>
                <strong>Date:</strong> ${formatDateTime(bill.date)}<br>
                <strong>Place of Supply:</strong> ${bill.placeOfSupply || 'Tamil Nadu (33)'}<br>
                <strong>Billed By:</strong> ${bill.billedBy || 'N/A'}
              </p>
            </div>
          </div>
          
          <!-- Items Table -->
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Product Name</th>
                <th>HSN</th>
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

      // Format unit for display - capitalize first letter and handle singular/plural
      let unitDisplay = item.unit || 'units';
      if (unitDisplay === 'num') unitDisplay = 'Num';
      else if (unitDisplay === 'bags') unitDisplay = item.qty === 1 ? 'Bag' : 'Bags';
      else if (unitDisplay === 'units') unitDisplay = item.qty === 1 ? 'Unit' : 'Units';
      else unitDisplay = unitDisplay.charAt(0).toUpperCase() + unitDisplay.slice(1);

      return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.hsnCode || 'N/A'}</td>
                    <td class="text-center">${item.qty} ${unitDisplay}</td>
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
          
          <!-- Amount in Words -->
          ${bill.amountInWords ? `
          <div style="margin-top: 10px; padding: 6px; background: #f9f9f9; border-left: 3px solid #667eea; font-size: 11px;">
            <strong>Amount in Words:</strong> ${bill.amountInWords}
          </div>
          ` : ''}
          
          <!-- Transport Vehicle (if exists) -->
          ${bill.transportVehicleNumber ? `
          <div style="margin-top: 8px; padding: 6px; background: #f9f9f9; border: 1px solid #ddd;">
            <p style="margin: 0; font-size: 10px;"><strong>Transport Vehicle:</strong> ${bill.transportVehicleNumber}</p>
          </div>
          ` : ''}
          
          <!-- Additional Notes Section (simple text box) -->
          <div style="margin-top: 8px; padding: 8px; min-height: 30px; page-break-inside: avoid;">
            <strong style="font-size: 10px; color: #333;">Additional Notes:</strong>
            <span style="font-size: 10px; margin-left: 5px;">${bill.billingNotes || ''}</span>
          </div>
          
          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-block">
              <div class="signature-line">Customer Signature</div>
            </div>
            <div class="signature-block">
              <div class="signature-line">Authorized Signatory</div>
            </div>
          </div>
          
          <!-- Footer with Terms & Conditions -->
          <div class="footer">
            <p style="margin: 0 0 5px 0;"><strong>Thank you for your business!</strong></p>
            <p style="margin: 0 0 5px 0;">This is a computer-generated invoice and does not require a physical signature.</p>
            <p style="margin: 0; font-size: 9px; color: #888;"><strong>Terms & Conditions:</strong> Goods once sold cannot be returned</p>
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

    // Fix Safari empty page issue - wait for content to load before showing
    printWindow.onload = function () {
      // Small delay to ensure rendering is complete
      setTimeout(function () {
        printWindow.focus();
      }, 100);
    };
  }
};
