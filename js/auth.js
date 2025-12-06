// ========== AUTH MANAGEMENT ==========

// Check if user is logged in
function checkAuth() {
    const session = localStorage.getItem('userSession');
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(session);
}

// Get current user
function getCurrentUser() {
    const session = localStorage.getItem('userSession');
    return session ? JSON.parse(session) : null;
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Logout
function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('userSession');
        window.location.href = 'login.html';
    }
}

// Generate sidebar menu based on role
function generateSidebar(activePage) {
    const user = getCurrentUser();
    if (!user) return '';

    const isAdminUser = user.role === 'admin';
    
    let menuItems = '';

    // Home menu
    menuItems += `
        <a href="index.html" class="nav-link text-white mb-2 ${activePage === 'home' ? 'active' : ''}">
            <i class="bi bi-house-fill me-2"></i>Trang chủ
        </a>
    `;
    
    // Admin-only menu
    if (isAdminUser) {
        menuItems += `
            <a href="admin-contract.html" class="nav-link text-white mb-2 ${activePage === 'admin-contract' ? 'active' : ''}">
                <i class="bi bi-gear-fill me-2"></i>Quản lý Mẫu Hợp đồng
            </a>
        `;
    }
    
    // Common menus
    menuItems += `
        <a href="user-extract.html" class="nav-link text-white mb-2 ${activePage === 'user-extract' ? 'active' : ''}">
            <i class="bi bi-card-image me-2"></i>Trích xuất thông tin
        </a>
        <a href="user-chat.html" class="nav-link text-white mb-2 ${activePage === 'user-chat' ? 'active' : ''}">
            <i class="bi bi-chat-dots-fill me-2"></i>Chat AI
        </a>
    `;

    // Check if page uses p-3 wrapper or col-md-2 layout
    const isFullPage = activePage === 'user-chat';
    
    if (isFullPage) {
        // For user-chat.html (uses fixed sidebar with p-3)
        return `
            <div class="d-flex align-items-center mb-3">
                <i class="bi bi-person-circle me-2" style="font-size: 24px;"></i>
                <div>
                    <div class="fw-bold">${user.name}</div>
                    <small class="text-white-50">${isAdminUser ? 'Quản trị viên' : 'Người dùng'}</small>
                </div>
            </div>
            <hr class="border-light">
            <h6 class="mb-3 text-white-50">MENU</h6>
            <div class="nav flex-column">
                ${menuItems}
            </div>
            <hr class="border-light mt-4">
            <a href="#" class="nav-link text-white" onclick="logout(); return false;">
                <i class="bi bi-box-arrow-left me-2"></i>Đăng xuất
            </a>
            <div class="mt-4 text-center">
                <small class="text-white-50">Phiên bản 1.0</small>
            </div>
        `;
    } else {
        // For admin-contract.html and user-extract.html (uses col-md-2 with p-3 wrapper)
        return `
            <div class="p-3">
                <div class="d-flex align-items-center mb-3">
                    <i class="bi bi-person-circle me-2" style="font-size: 24px;"></i>
                    <div>
                        <div class="fw-bold small">${user.name}</div>
                        <small class="text-white-50" style="font-size: 10px;">${isAdminUser ? 'Admin' : 'User'}</small>
                    </div>
                </div>
                <hr class="border-light my-2">
                <div class="nav flex-column">
                    ${menuItems}
                </div>
                <hr class="border-light my-2">
                <a href="#" class="nav-link text-white py-1" onclick="logout(); return false;">
                    <i class="bi bi-box-arrow-left me-2"></i>Đăng xuất
                </a>
                <div class="mt-3 text-center">
                    <small class="text-white-50">Phiên bản 1.0</small>
                </div>
            </div>
        `;
    }
}

// Initialize page with auth check
function initPage(activePage) {
    const user = checkAuth();
    if (!user) return false;

    // If trying to access admin page without admin role
    if (activePage === 'admin-contract' && user.role !== 'admin') {
        alert('Bạn không có quyền truy cập trang này!');
        window.location.href = 'user-extract.html';
        return false;
    }

    return true;
}
