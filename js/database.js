// ============================================
// DATABASE MODULE - PostgreSQL API Client
// ============================================

// Auto-detect API base URL based on environment
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

const DB = {
  // Initialize database (now handled by server)
  init() {
    // No-op: Database initialization is handled by the server
    console.log('Database connected to SQLite backend');
  },

  // Get all data
  async getData() {
    try {
      const response = await fetch(`${API_BASE}/data`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get data:', error);
      return null;
    }
  },

  // Generate unique ID (kept for compatibility, but server generates IDs)
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // ============================================
  // USER OPERATIONS
  // ============================================

  async getUsers() {
    try {
      const response = await fetch(`${API_BASE}/users`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  },

  async getUserById(id) {
    try {
      const response = await fetch(`${API_BASE}/users/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  },

  async getUserByUsername(username) {
    try {
      const response = await fetch(`${API_BASE}/users/username/${username}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  },

  async addUser(userData) {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to add user:', error);
      return null;
    }
  },

  async updateUser(id, updates) {
    try {
      const response = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to update user:', error);
      return null;
    }
  },

  async deleteUser(id) {
    try {
      await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  },

  // ============================================
  // PRODUCT OPERATIONS
  // ============================================

  async getProducts() {
    try {
      const response = await fetch(`${API_BASE}/products`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  },

  async getProductById(id) {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get product:', error);
      return null;
    }
  },

  async searchProducts(query) {
    try {
      const response = await fetch(`${API_BASE}/products/search/${encodeURIComponent(query)}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to search products:', error);
      return [];
    }
  },

  async addProduct(productData) {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to add product:', error);
      return null;
    }
  },

  async updateProduct(id, updates) {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to update product:', error);
      return null;
    }
  },

  async deleteProduct(id) {
    try {
      await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  },

  async updateStock(id, quantity) {
    try {
      const product = await this.getProductById(id);
      if (product) {
        return await this.updateProduct(id, { stock: product.stock + quantity });
      }
      return null;
    } catch (error) {
      console.error('Failed to update stock:', error);
      return null;
    }
  },

  async getLowStockProducts() {
    try {
      const response = await fetch(`${API_BASE}/products/lowstock/all`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get low stock products:', error);
      return [];
    }
  },

  // ============================================
  // BILL OPERATIONS
  // ============================================

  async getBills() {
    try {
      const response = await fetch(`${API_BASE}/bills`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get bills:', error);
      return [];
    }
  },

  async getBillById(id) {
    try {
      const response = await fetch(`${API_BASE}/bills/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get bill:', error);
      return null;
    }
  },

  async getNextInvoiceNumber() {
    try {
      const response = await fetch(`${API_BASE}/bills/invoice/next`);
      const data = await response.json();
      return data.invoiceNo;
    } catch (error) {
      console.error('Failed to get next invoice number:', error);
      const year = new Date().getFullYear();
      return `INV${year}00001`;
    }
  },

  async addBill(billData) {
    try {
      const response = await fetch(`${API_BASE}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to add bill:', error);
      return null;
    }
  },

  async getBillsByDateRange(startDate, endDate) {
    try {
      const response = await fetch(`${API_BASE}/bills/range/${startDate}/${endDate}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get bills by date range:', error);
      return [];
    }
  },

  // ============================================
  // SETTINGS OPERATIONS
  // ============================================

  async getSettings() {
    try {
      const response = await fetch(`${API_BASE}/settings`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get settings:', error);
      return {};
    }
  },

  async updateSettings(updates) {
    try {
      const response = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to update settings:', error);
      return null;
    }
  },

  // ============================================
  // EXPORT/IMPORT
  // ============================================

  async exportData() {
    try {
      const response = await fetch(`${API_BASE}/export`);
      const data = await response.json();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  },

  async importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      // Data migration: Add unit field to products if missing
      if (data.products && Array.isArray(data.products)) {
        data.products = data.products.map(product => {
          if (!product.unit) {
            return { ...product, unit: 'units' };
          }
          return product;
        });
      }

      const response = await fetch(`${API_BASE}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  },

  // Export data to downloadable JSON file
  async exportToFile() {
    try {
      const data = await this.exportData();
      const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `retail_backup_${timestamp}.json`;
      a.setAttribute('download', `retail_backup_${timestamp}.json`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Failed to export to file:', error);
      return false;
    }
  },

  // Import data from file
  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = e.target.result;
          const success = await this.importData(jsonData);
          if (success) {
            resolve(true);
          } else {
            reject(new Error('Invalid data format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  // Clear all data (use with caution)
  async clearAll() {
    try {
      await fetch(`${API_BASE}/clear`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }
};

// Initialize database on load
DB.init();
