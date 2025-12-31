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

  // Setup product search
  setupProductSearch() {
    const searchInput = document.getElementById('productSearch');
    const searchResults = document.getElementById('searchResults');

    if (!searchInput) return;

    searchInput.addEventListener('input', debounce(async (e) => {
      const query = e.target.value.trim();

      if (query.length < 2) {
        searchResults.innerHTML = '';
        searchResults.classList.add('hidden');
        return;
      }

      const products = await DB.searchProducts(query);

      if (products.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No products found</div>';
        searchResults.classList.remove('hidden');
        return;
      }

      searchResults.innerHTML = products.map(product => {
        const unit = product.unit || 'units';
        const stockStatus = product.stock <= product.minStock ? 'Low Stock' : `${product.stock} ${unit} available`;
        return `
        <div class="search-result-item" onclick="BillingManager.addToCart('${product.id}')">
          <div>
            <strong>${product.name}</strong>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">
              ${product.category} • ${stockStatus}
            </p>
          </div>
          <div style="text-align: right;">
            <strong>${formatCurrency(product.price)}</strong>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">
              GST: ${product.gstRate}%
            </p>
          </div>
        </div>
      `;
      }).join('');

      searchResults.classList.remove('hidden');
    }, 300));

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  },

  // Add product to cart
  async addToCart(productId) {
    const product = await DB.getProductById(productId);

    if (!product) {
      showToast('Product not found', 'error');
      return;
    }

    if (product.stock <= 0) {
      showToast('Product out of stock', 'error');
      return;
    }

    // Check if product already in cart
    const existingItem = this.cart.find(item => item.productId === productId);

    if (existingItem) {
      if (existingItem.qty >= product.stock) {
        showToast('Cannot add more than available stock', 'warning');
        return;
      }
      existingItem.qty++;
    } else {
      this.cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        gstRate: product.gstRate,
        hsnCode: product.hsnCode,
        unit: product.unit || 'units',
        qty: 1,
        maxStock: product.stock
      });
    }

    this.renderCart();

    // Clear search
    const searchInput = document.getElementById('productSearch');
    const searchResults = document.getElementById('searchResults');
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.classList.add('hidden');

    showToast(`${product.name} added to cart`, 'success');
  },

  // Update cart item quantity
  updateCartQty(productId, newQty) {
    const item = this.cart.find(item => item.productId === productId);

    if (!item) return;

    if (newQty <= 0) {
      this.removeFromCart(productId);
      return;
    }

    if (newQty > item.maxStock) {
      showToast('Quantity exceeds available stock', 'warning');
      return;
    }

    item.qty = newQty;
    item.qty = newQty;
    this.renderCart();
  },

  // Update cart item price
  updateCartPrice(productId, newPrice) {
    const item = this.cart.find(item => item.productId === productId);

    if (!item) return;

    if (newPrice < 0) {
      showToast('Price cannot be negative', 'warning');
      this.renderCart(); // Reset to valid value
      return;
    }

    item.price = newPrice;
    this.renderCart();
  },

  // Remove from cart
  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.productId !== productId);
    this.renderCart();
    showToast('Item removed from cart', 'info');
  },

  // Clear cart
  clearCart() {
    this.cart = [];
    this.currentCustomer = { name: '', phone: '' };
    this.renderCart();
    showToast('Cart cleared', 'info');
  },

  // Render cart
  renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');

    if (!cartItems) return;

    if (this.cart.length === 0) {
      if (cartEmpty) cartEmpty.classList.remove('hidden');
      cartItems.innerHTML = '';
      this.updateSummary();
      return;
    }

    if (cartEmpty) cartEmpty.classList.add('hidden');

    cartItems.innerHTML = this.cart.map(item => {
      const subtotal = item.price * item.qty;
      const gst = calculateGST(subtotal, item.gstRate);
      const total = subtotal + gst.total;
      const unit = item.unit || 'units';

      return `
        <div class="cart-item">
          <div style="flex: 1;">
            <strong>${item.name}</strong>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted);">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value="${item.price}" 
                  onchange="BillingManager.updateCartPrice('${item.productId}', parseFloat(this.value))"
                  style="width: 80px; padding: 0.25rem 0.5rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 4px; color: white; font-size: 0.9rem;"
                  placeholder="Price"
                >
                <span class="text-muted">× ${item.qty} ${unit} = ${formatCurrency(subtotal)}</span>
              </div>
            </p>
            <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">
              GST ${item.gstRate}%: ${formatCurrency(gst.total)}
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input 
              type="number" 
              min="1" 
              max="${item.maxStock}"
              value="${item.qty}" 
              onchange="BillingManager.updateCartQty('${item.productId}', parseInt(this.value))"
              style="width: 60px; padding: 0.5rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 6px; color: white; text-align: center;"
            >
            <button 
              class="btn btn-danger" 
              style="padding: 0.5rem 0.75rem;"
              onclick="BillingManager.removeFromCart('${item.productId}')"
            >
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.updateSummary();
  },

  // Update summary
  updateSummary() {
    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    this.cart.forEach(item => {
      const itemSubtotal = item.price * item.qty;
      subtotal += itemSubtotal;

      const gst = calculateGST(itemSubtotal, item.gstRate, false);
      totalCGST += gst.cgst;
      totalSGST += gst.sgst;
    });

    const total = subtotal + totalCGST + totalSGST + totalIGST;

    // Update summary display
    const summaryHTML = `
      <div class="summary-row">
        <span>Subtotal:</span>
        <strong>${formatCurrency(subtotal)}</strong>
      </div>
      <div class="summary-row">
        <span>CGST:</span>
        <strong>${formatCurrency(totalCGST)}</strong>
      </div>
      <div class="summary-row">
        <span>SGST:</span>
        <strong>${formatCurrency(totalSGST)}</strong>
      </div>
      <div class="summary-row total">
        <span>Total:</span>
        <strong>${formatCurrency(total)}</strong>
      </div>
    `;

    const summaryContainer = document.getElementById('billSummary');
    if (summaryContainer) {
      summaryContainer.innerHTML = summaryHTML;
    }

    // Store for bill generation
    this.currentBill = {
      subtotal,
      cgst: totalCGST,
      sgst: totalSGST,
      igst: totalIGST,
      total
    };
  },

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

    // Clear customer info
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
