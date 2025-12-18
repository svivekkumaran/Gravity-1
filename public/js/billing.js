// ============================================
// BILLING MODULE
// ============================================

const BillingManager = {
  cart: [],
  currentCustomer: {
    name: '',
    phone: ''
  },

  // Initialize billing page
  init() {
    this.renderCart();
    this.setupProductSearch();

    // Set default date to today
    const billDateInput = document.getElementById('billDate');
    if (billDateInput) {
      billDateInput.value = new Date().toISOString().split('T')[0];
    }
  },

  // ... (existing code) ...

  // Generate bill
  async generateBill() {
    if (this.cart.length === 0) {
      showToast('Cart is empty', 'warning');
      return;
    }

    const customerName = document.getElementById('customerName')?.value || 'Walk-in Customer';
    const customerPhone = document.getElementById('customerPhone')?.value || '';
    const customerAddress = document.getElementById('customerAddress')?.value || '';
    const deliveryAddress = document.getElementById('deliveryAddress')?.value || '';
    const customerGstin = document.getElementById('customerGstin')?.value || '';
    const billingNotes = document.getElementById('billingNotes')?.value || '';
    const billDate = document.getElementById('billDate')?.value || new Date().toISOString().split('T')[0];

    // Get current user safely
    const currentUser = Auth.getCurrentUser();
    const billedByName = currentUser?.name || 'Unknown User';

    // Calculate amount in words
    const totalRounded = Math.round(this.currentBill.total);
    const amountInWords = numberToWords(totalRounded) + ' Rupees Only';

    const billData = {
      items: this.cart.map(item => ({
        productId: item.productId,
        name: item.name,
        qty: item.qty,
        unit: item.unit || 'units',
        price: item.price,
        gstRate: item.gstRate,
        hsnCode: item.hsnCode
      })),
      subtotal: this.currentBill.subtotal,
      cgst: this.currentBill.cgst,
      sgst: this.currentBill.sgst,
      igst: this.currentBill.igst,
      total: this.currentBill.total,
      billedBy: billedByName,
      customerName,
      customerPhone,
      customerAddress,
      deliveryAddress,
      customerGstin,
      transportVehicleNumber: document.getElementById('transportVehicle')?.value || '',
      billingNotes,
      date: billDate,
      placeOfSupply: 'Tamil Nadu (33)',
      amountInWords
    };

    const bill = await DB.addBill(billData);

    showToast('Bill generated successfully!', 'success');

    // Generate PDF
    PDFGenerator.generateInvoice(bill);

    // Clear cart
    this.clearCart();

    // Clear customer info but reset date to today
    if (document.getElementById('customerName')) document.getElementById('customerName').value = '';
    if (document.getElementById('customerPhone')) document.getElementById('customerPhone').value = '';
    if (document.getElementById('customerAddress')) document.getElementById('customerAddress').value = '';
    if (document.getElementById('deliveryAddress')) document.getElementById('deliveryAddress').value = '';
    if (document.getElementById('customerGstin')) document.getElementById('customerGstin').value = '';
    if (document.getElementById('transportVehicle')) document.getElementById('transportVehicle').value = '';
    if (document.getElementById('billingNotes')) document.getElementById('billingNotes').value = '';
    if (document.getElementById('billDate')) document.getElementById('billDate').value = new Date().toISOString().split('T')[0];
  }
};
