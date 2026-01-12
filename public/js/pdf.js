// ============================================
// PDF GENERATION MODULE
// Uses jsPDF library
// ============================================

// ============================================
// PDF GENERATION MODULE
// Uses jsPDF library (via html2pdf)
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

  // Generate HTML for invoice
  async generateInvoiceHTML(bill) {
    const settings = await DB.getSettings();

    // Provide fallback values to prevent "undefined" in PDF
    const companyName = settings.companyName || 'Your Company Name';
    const address = settings.address || 'Company Address';
    const gstin = settings.gstin || 'GSTIN Number';
    const phone = settings.phone || 'Phone Number';
    const email = settings.email || 'Email Address';
    const tamilBlessing = settings.tamilBlessing || '';

    const isEstimate = bill.invoiceNo && bill.invoiceNo.startsWith('EST');
    const invoiceTitle = isEstimate ? 'ESTIMATE' : 'TAX INVOICE';

    // Calculate valid values for display, handling missing fields in old bills
    // Use parseFloat to Ensure numbers, default to 0 if NaN
    const subtotal = parseFloat(bill.subtotal) || 0;
    const cgst = parseFloat(bill.cgst) || 0;
    const sgst = parseFloat(bill.sgst) || 0;
    const igst = parseFloat(bill.igst) || 0;
    const taxTotal = subtotal + cgst + sgst + igst;

    let displayRoundOff, displayTotal;

    // Strict check for valid roundOff
    if (bill.roundOff !== undefined && bill.roundOff !== null && !isNaN(parseFloat(bill.roundOff))) {
      displayRoundOff = parseFloat(bill.roundOff);
      displayTotal = parseFloat(bill.total) || (taxTotal + displayRoundOff);
    } else {
      // Calculate for old bills or missing roundOff
      const roundedTotal = Math.round(taxTotal);
      displayRoundOff = roundedTotal - taxTotal;
      displayTotal = roundedTotal;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${invoiceTitle} ${bill.invoiceNo}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body { font-family: 'Arial', sans-serif; padding: 20px; color: #333; background: white; }
          .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
          .invoice-header { border-bottom: 3px solid #333; padding-bottom: 12px; margin-bottom: 12px; position: relative; }
          .tamil-blessing { text-align: center; font-size: 10px; font-weight: normal; color: #000; margin-bottom: 8px; line-height: 1.4; white-space: pre-line; }
          .company-name { text-align: center; font-size: 28px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
          .company-details { text-align: center; font-size: 12px; line-height: 1.6; color: #666; }
          .invoice-title { font-size: 20px; font-weight: bold; margin: 12px 0; color: #333; display: flex; justify-content: space-between; align-items: center; }
          .invoice-number { font-size: 16px; color: #667eea; font-weight: bold; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 15px; }
          .info-block { flex: 1; }
          .info-block h3 { font-size: 14px; margin-bottom: 10px; color: #667eea; }
          .info-block p { font-size: 12px; line-height: 1.6; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; page-break-inside: auto; }
          thead { display: table-header-group; }
          tbody { display: table-row-group; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th { background: #667eea; color: white; padding: 8px; text-align: left; font-size: 11px; font-weight: bold; }
          td { padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 11px; }
          tr:nth-child(even) { background: #f9f9f9; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .summary-table { margin-left: auto; width: 300px; margin-top: 10px; page-break-inside: avoid; }
          .summary-table td { border: none; padding: 5px 8px; }
          .summary-table .total-row { background: #667eea; color: white; font-weight: bold; font-size: 14px; }
          .footer { margin-top: 8px; padding-top: 8px; border-top: 2px solid #ddd; text-align: center; font-size: 10px; color: #666; page-break-inside: avoid; }
          .signature-section { margin-top: 15px; display: flex; justify-content: space-between; page-break-inside: avoid; page-break-before: avoid; }
          .signature-block { text-align: center; }
          .signature-line { width: 200px; border-top: 1px solid #333; margin-top: 35px; padding-top: 5px; font-size: 11px; }
          @page { margin: 0.5cm; size: A4; }
          @media print {
            body { padding: 0; }
            .invoice-container { border: none; }
            .no-print { display: none; }
            .summary-table, .signature-section, .footer { page-break-inside: avoid; }
            .signature-section { page-break-before: avoid; }
            table { page-break-inside: auto; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container" id="invoice">
          <!-- Header -->
          <div class="invoice-header">
            ${tamilBlessing ? `<div class="tamil-blessing">${this.formatTamilBlessing(tamilBlessing)}</div>` : ''}
            <div class="company-name">${companyName}</div>
            <div class="company-details">
              ${address}<br>
              ${!isEstimate ? `GSTIN: ${gstin} | ` : ''}Phone: ${phone}<br>
              ${!isEstimate ? `Email: ${email}` : ''}
            </div>
          </div>
          
          <!-- Invoice Title -->
          <div class="invoice-title">
            <span>${invoiceTitle}</span>
            <span class="invoice-number">No: ${bill.invoiceNo}</span>
          </div>
          
          <!-- Invoice Info -->
          <div class="invoice-info">
            <div class="info-block">
              <h3>Bill To:</h3>
              <p>
                <strong>${bill.customerName}</strong><br>
                ${bill.customerAddress ? bill.customerAddress.replace(/\n/g, '<br>') + '<br>' : ''}
                ${bill.customerPhone ? 'Phone: ' + bill.customerPhone + '<br>' : ''}
                ${!isEstimate && bill.customerGstin ? 'GSTIN: ' + bill.customerGstin : ''}
              </p>
            </div>
            ${!isEstimate || bill.deliveryAddress ? `
            <div class="info-block">
              <h3>Delivery To:</h3>
              <p>${(bill.deliveryAddress || bill.customerAddress || 'Same as Bill To Address').replace(/\n/g, '<br>')}</p>
            </div> ` : '<div class="info-block"></div>'}
            <div class="info-block" style="text-align: right;">
              <p>
                <strong>Date:</strong> ${formatDate(bill.date)}<br>
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
                ${!isEstimate ? '<th>HSN</th>' : ''}
                <th class="text-center">Qty</th>
                <th class="text-right">Price</th>
                ${!isEstimate ? `
                <th class="text-center">GST%</th>
                <th class="text-right">GST Amt</th>
                ` : ''}
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map((item, index) => {
      const itemSubtotal = item.price * item.qty;
      const gst = calculateGST(itemSubtotal, item.gstRate);
      const itemTotal = itemSubtotal + (isEstimate ? 0 : gst.total);

      // Format unit for display
      let unitDisplay = item.unit || 'units';
      if (unitDisplay === 'num') unitDisplay = 'Num';
      else if (unitDisplay === 'bags') unitDisplay = item.qty === 1 ? 'Bag' : 'Bags';
      else if (unitDisplay === 'units') unitDisplay = item.qty === 1 ? 'Unit' : 'Units';
      else unitDisplay = unitDisplay.charAt(0).toUpperCase() + unitDisplay.slice(1);

      return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    ${!isEstimate ? `<td>${item.hsnCode || 'N/A'}</td>` : ''}
                    <td class="text-center">${item.qty} ${unitDisplay}</td>
                    <td class="text-right">${formatCurrency(item.price)}</td>
                    ${!isEstimate ? `
                    <td class="text-center">${item.gstRate}%</td>
                    <td class="text-right">${formatCurrency(gst.total)}</td>
                    ` : ''}
                    <td class="text-right"><strong>${formatCurrency(itemTotal)}</strong></td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
          
          <!-- Summary -->
          <table class="summary-table">
            ${isEstimate ? `
            <tr class="total-row">
              <td>Grand Total:</td>
              <td class="text-right">${formatCurrency(bill.total)}</td>
            </tr>
            ` : `
            <tr>
              <td>Subtotal:</td>
              <td class="text-right"><strong>${formatCurrency(subtotal)}</strong></td>
            </tr>
            <tr>
              <td>CGST:</td>
              <td class="text-right">${formatCurrency(cgst)}</td>
            </tr>
            <tr>
              <td>SGST:</td>
              <td class="text-right">${formatCurrency(sgst)}</td>
            </tr>
            ${igst > 0 ? `
              <tr>
                <td>IGST:</td>
                <td class="text-right">${formatCurrency(igst)}</td>
              </tr>
            ` : ''}
            <tr>
              <td>Round Off:</td>
              <td class="text-right">${formatCurrency(displayRoundOff)}</td>
            </tr>
            <tr class="total-row">
              <td>Grand Total:</td>
              <td class="text-right">${formatCurrency(displayTotal)}</td>
            </tr>
            `}
          </table >
          
          <!-- Amount in Words -->
  ${bill.amountInWords ? `
          <div style="margin-top: 10px; padding: 6px; background: #f9f9f9; border-left: 3px solid #667eea; font-size: 11px;">
            <strong>Amount in Words:</strong> ${bill.amountInWords}
          </div>
          ` : ''
      }
          
          <!-- Transport Vehicle (if exists) -->
  ${bill.transportVehicleNumber ? `
          <div style="margin-top: 8px; padding: 6px; background: #f9f9f9; border: 1px solid #ddd;">
            <p style="margin: 0; font-size: 10px;"><strong>Transport Vehicle:</strong> ${bill.transportVehicleNumber}</p>
          </div>
          ` : ''
      }
          
          <!-- Additional Notes Section (simple text box) -->
          <div style="margin-top: 8px; padding: 8px; min-height: 30px; page-break-inside: avoid;">
            <strong style="font-size: 10px; color: #333;">Additional Notes:</strong>
            <span style="font-size: 10px; margin-left: 5px;">${bill.billingNotes || ''}</span>
          </div>
          
          <!-- Bank Details Section (Configurable) -->
          ${settings.accountHolderName || settings.accountNumber ? `
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; page-break-inside: avoid;">
             <div style="font-size: 11px; font-weight: bold; color: #667eea; margin-bottom: 5px; text-transform: uppercase;">Bank Account Details</div>
             <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 15px; font-size: 11px; color: #333;">
                ${settings.accountHolderName ? `
                  <div style="font-weight: bold; color: #667eea;">NAME</div>
                  <div style="font-weight: bold; color: #667eea;">: ${settings.accountHolderName}</div>
                ` : ''}
                ${settings.accountNumber ? `
                  <div style="font-weight: bold; color: #667eea;">BANK A/C NO</div>
                  <div style="font-weight: bold; color: #667eea;">: ${settings.accountNumber}</div>
                ` : ''}
                ${settings.ifscCode ? `
                  <div style="font-weight: bold; color: #667eea;">IFSC CODE</div>
                  <div style="font-weight: bold; color: #667eea;">: ${settings.ifscCode}</div>
                ` : ''}
                 ${settings.bankName ? `
                  <div style="font-weight: bold; color: #667eea;">BANK NAME</div>
                  <div style="font-weight: bold; color: #667eea;">: ${settings.bankName}</div>
                ` : ''}
             </div>
          </div>
          ` : ''}
          
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
          
          <!-- Print Button (Only visible in Print Window) -->
  <div style="text-align: center; margin-top: 30px;" class="no-print">
    <button onclick="window.print()" style="padding: 12px 30px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-right: 10px;">
      Print Invoice
    </button>
    <button onclick="window.close()" style="padding: 12px 30px; background: #666; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
      Close
    </button>
  </div>
        </div >
      </body >
      </html >
  `;
  },

  // Generate and open invoice (Print view)
  async generateInvoice(bill) {
    const printWindow = window.open('', '_blank');
    const invoiceHTML = await this.generateInvoiceHTML(bill);
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();

    // Fix Safari empty page issue - wait for content to load before showing
    printWindow.onload = function () {
      setTimeout(function () {
        printWindow.focus();
      }, 100);
    };
  },

  // Download invoice as PDF
  async downloadInvoice(bill) {
    // Generate HTML
    const invoiceHTML = await this.generateInvoiceHTML(bill);

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = invoiceHTML;

    // Remove the print buttons before converting
    const noPrint = container.querySelector('.no-print');
    if (noPrint) noPrint.remove();

    // The actual invoice content
    const element = container.querySelector('.invoice-container');

    // We need to temporarily append to body to ensure styles render correctly for html2pdf
    // But since we are extracting inline styles, we can just pass the element if it has all styles.
    // However, html2pdf works best with live DOM elements.

    // Better approach for html2pdf with custom styles:
    // Create an iframe to render the HTML, then use html2pdf on that.
    // OR: simpler approach -> just create a temporary div off-screen.

    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.innerHTML = invoiceHTML;
    document.body.appendChild(wrapper);

    // Target the invoice part
    const content = wrapper.querySelector('.invoice-container');

    // Remove buttons again just in case
    wrapper.querySelector('.no-print')?.remove();

    const opt = {
      margin: [0, 0, 0, 0], // Reduced margin since CSS likely handles it
      filename: `Invoice_${bill.invoiceNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use a try-catch to handle if html2pdf is not loaded
    try {
      await html2pdf().set(opt).from(content).save();
    } catch (err) {
      console.error("PDF Download Error:", err);
      // Fallback to print if library fails
      this.generateInvoice(bill);
    } finally {
      document.body.removeChild(wrapper);
    }
  }
};

