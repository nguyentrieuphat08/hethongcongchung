// Main JavaScript file for common functions

// Check if storage API is available
window.addEventListener('load', () => {
    if (typeof window.storage === 'undefined') {
        console.warn('Storage API not available. Using localStorage fallback.');
        window.storage = createLocalStorageFallback();
    }
});

// LocalStorage fallback if window.storage is not available
function createLocalStorageFallback() {
    return {
        async get(key) {
            const value = localStorage.getItem(key);
            return value ? { key, value } : null;
        },
        async set(key, value) {
            localStorage.setItem(key, value);
            return { key, value };
        },
        async delete(key) {
            localStorage.removeItem(key);
            return { key, deleted: true };
        },
        async list(prefix = '') {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(prefix)) {
                    keys.push(key);
                }
            }
            return { keys };
        }
    };
}

// Active menu highlighting
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const menuLinks = document.querySelectorAll('#mainMenu .nav-link');
    
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('vi-VN');
}

function formatDateTime(date) {
    return new Date(date).toLocaleString('vi-VN');
}

function showLoading() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'spinner-overlay';
    overlay.innerHTML = `
        <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

console.log('Main.js loaded successfully');