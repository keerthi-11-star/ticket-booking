// Auth utility functions
const API_BASE_URL = 'http://localhost:3000/api';

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return token && user;
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Set auth data
function setAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

// Clear auth data
function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Make authenticated API request
async function apiRequest(url, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        clearAuthData();
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || 'Request failed');
    }

    return response.json();
}

// Update navigation based on auth status
function updateNavigation() {
    const user = getCurrentUser();
    const dashboardLink = document.getElementById('dashboard-link');
    const adminLink = document.getElementById('admin-link');
    const logoutBtn = document.getElementById('logout-btn');

    if (isAuthenticated()) {
        if (dashboardLink) dashboardLink.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        if (user && user.role === 'admin' && adminLink) {
            adminLink.style.display = 'inline-block';
        }
    } else {
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// Logout handler
function handleLogout() {
    clearAuthData();
    window.location.href = 'index.html';
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Redirect if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Redirect if not admin
function requireAdmin() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

