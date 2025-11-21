// ============================================
// AUTHENTICATION MODULE
// ============================================

const Auth = {
    // Current logged-in user
    currentUser: null,

    // Initialize auth - check if user is logged in
    init() {
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    },

    // Login function
    async login(username, password) {
        const user = await DB.getUserByUsername(username);

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (user.password !== password) {
            return { success: false, message: 'Invalid password' };
        }

        // Store user in session
        this.currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));

        return { success: true, user };
    },

    // Logout function
    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    },

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    },

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },

    // Check if user has specific role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    },

    // Check if user is admin
    isAdmin() {
        return this.hasRole('admin');
    },

    // Require login - redirect if not logged in
    requireLogin() {
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    // Require admin - redirect if not admin
    requireAdmin() {
        if (!this.requireLogin()) return false;

        if (!this.isAdmin()) {
            showToast('Access denied. Admin privileges required.', 'error');
            window.location.href = 'billing.html';
            return false;
        }
        return true;
    }
};

// Initialize auth on page load
Auth.init();
