// ============================================
// PRODUCT MANAGEMENT MODULE
// ============================================

const ProductManager = {
  // Render products table
  async renderProductsTable(containerId = 'productsTableBody') {
    const tbody = document.getElementById(containerId);
    if (!tbody) return;

    const products = await DB.getProducts();

    const columns = [
      { field: 'name', label: 'Product Name' },
      { field: 'category', label: 'Category' },
      {
        field: 'price',
        label: 'Price',
        render: (product) => formatCurrency(product.price)
      },
      {
        field: 'stock',
        label: 'Stock',
        render: (product) => {
          const isLow = product.stock <= product.minStock;
          const unit = product.unit || 'units';
          return `<span class="badge ${isLow ? 'badge-danger' : 'badge-success'}">
            ${product.stock} ${unit}
          </span>`;
        }
      },
      {
        field: 'gstRate',
        label: 'GST Rate',
        render: (product) => `${product.gstRate}%`
      },
      {
        field: 'hsnCode',
        label: 'HSN Code',
        render: (product) => product.hsnCode || 'N/A'
      },
      {
        field: 'actions',
        label: 'Actions',
        render: (product) => `
          <div class="flex gap-1">
            <button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="ProductManager.editProduct('${product.id}')">
              Edit
            </button>
            <button class="btn btn-danger" style="padding: 0.5rem 1rem;" onclick="ProductManager.deleteProduct('${product.id}')">
              Delete
            </button>
          </div>
        `
      }
    ];

    populateTable(tbody, products, columns);
  },

  // Show add product modal
  showAddProductModal() {
    const content = `
      <form id="productForm" onsubmit="ProductManager.handleProductSubmit(event)">
        <div class="form-group">
          <label class="form-label">Product Name *</label>
          <input type="text" class="form-input" id="productName" required>
        </div>

        <div class="form-group">
          <label class="form-label">Category *</label>
          <input type="text" class="form-input" id="productCategory" required>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Price (₹) *</label>
            <input type="number" class="form-input" id="productPrice" step="0.01" min="0" required>
          </div>

          <div class="form-group">
            <label class="form-label">Stock Quantity *</label>
            <input type="number" class="form-input" id="productStock" min="0" required>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Measurement Unit *</label>
            <select class="form-select" id="productUnit" required>
              <option value="num">Num</option>
              <option value="bags">Bags</option>
              <option value="units">Units</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Min Stock Alert *</label>
            <input type="number" class="form-input" id="productMinStock" min="0" required>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">GST Rate (%) *</label>
            <select class="form-select" id="productGST" required>
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18" selected>18%</option>
              <option value="28">28%</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">HSN Code *</label>
            <input type="text" class="form-input" id="productHSN" required>
          </div>
        </div>

        <input type="hidden" id="productId">

        <div class="flex gap-2" style="justify-content: flex-end; margin-top: var(--spacing-md);">
          <button type="button" class="btn btn-outline" onclick="closeModal(this)">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Product</button>
        </div>
      </form>
    `;

    createModal('Add New Product', content);
  },

  // Edit product
  async editProduct(productId) {
    const product = await DB.getProductById(productId);
    if (!product) {
      showToast('Product not found', 'error');
      return;
    }

    this.showAddProductModal();

    // Wait for modal to render
    setTimeout(() => {
      document.getElementById('productId').value = product.id;
      document.getElementById('productName').value = product.name;
      document.getElementById('productCategory').value = product.category;
      document.getElementById('productPrice').value = product.price;
      document.getElementById('productStock').value = product.stock;
      document.getElementById('productUnit').value = product.unit || 'num';
      document.getElementById('productGST').value = product.gstRate;
      document.getElementById('productHSN').value = product.hsnCode || '';
      document.getElementById('productMinStock').value = product.minStock;

      document.querySelector('.modal-title').textContent = 'Edit Product';
    }, 100);
  },

  // Handle product form submit
  async handleProductSubmit(event) {
    event.preventDefault();

    const productData = {
      name: document.getElementById('productName').value,
      category: document.getElementById('productCategory').value,
      price: parseFloat(document.getElementById('productPrice').value),
      stock: parseInt(document.getElementById('productStock').value),
      unit: document.getElementById('productUnit').value,
      gstRate: parseFloat(document.getElementById('productGST').value),
      hsnCode: document.getElementById('productHSN').value,
      minStock: parseInt(document.getElementById('productMinStock').value)
    };

    const productId = document.getElementById('productId').value;

    if (productId) {
      // Update existing product
      await DB.updateProduct(productId, productData);
      showToast('Product updated successfully', 'success');
    } else {
      // Add new product
      await DB.addProduct(productData);
      showToast('Product added successfully', 'success');
    }

    closeModal(event.target);
    await this.renderProductsTable();
  },

  // Delete product
  async deleteProduct(productId) {
    const product = await DB.getProductById(productId);
    if (!product) return;

    confirmDialog(
      `Are you sure you want to delete "${product.name}"?`,
      async () => {
        await DB.deleteProduct(productId);
        showToast('Product deleted successfully', 'success');
        await this.renderProductsTable();
      }
    );
  },

  // Get low stock products
  async getLowStockProducts() {
    return await DB.getLowStockProducts();
  },

  // Render low stock alerts
  async renderLowStockAlerts(containerId = 'lowStockContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const lowStockProducts = await this.getLowStockProducts();

    if (lowStockProducts.length === 0) {
      container.innerHTML = '<p class="text-muted">All products are well stocked!</p>';
      return;
    }

    container.innerHTML = lowStockProducts.map(product => {
      const unit = product.unit || 'units';
      return `
      <div class="glass-card" style="padding: 1rem; margin-bottom: 0.5rem;">
        <div class="flex-between">
          <div>
            <strong>${product.name}</strong>
            <p class="text-muted" style="margin: 0; font-size: 0.9rem;">${product.category}</p>
          </div>
          <span class="badge badge-danger">${product.stock} ${unit} left</span>
        </div>
      </div>
    `;
    }).join('');
  },

  // Search products
  async searchProducts(query, callback) {
    const products = await DB.searchProducts(query);
    if (callback) callback(products);
    return products;
  }
};
