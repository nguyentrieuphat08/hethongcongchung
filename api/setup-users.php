<?php
/**
 * Script tạo bảng users và tài khoản mặc định
 * Chạy file này một lần để khởi tạo database
 */

require_once 'db-config.php';

try {
    $pdo = getDB();
    
    // Create users table
    $sql = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) DEFAULT '',
        role ENUM('admin', 'user') DEFAULT 'user',
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_username (username),
        INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
    echo "✅ Bảng 'users' đã được tạo thành công!\n<br>";
    
    // Check if default accounts exist
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $count = $stmt->fetch()['count'];
    
    if ($count == 0) {
        // Create default admin account
        $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, name, email, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['admin', $adminPassword, 'Quản trị viên', 'admin@example.com', 'admin']);
        echo "✅ Tài khoản Admin đã được tạo (admin / admin123)\n<br>";
        
        // Create default user account
        $userPassword = password_hash('user123', PASSWORD_DEFAULT);
        $stmt->execute(['user', $userPassword, 'Người dùng', 'user@example.com', 'user']);
        echo "✅ Tài khoản User đã được tạo (user / user123)\n<br>";
    } else {
        echo "ℹ️ Đã có $count tài khoản trong database\n<br>";
    }
    
    // Show all users
    echo "\n<br>📋 Danh sách tài khoản:\n<br>";
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Username</th><th>Tên</th><th>Email</th><th>Role</th><th>Active</th><th>Ngày tạo</th></tr>";
    
    $stmt = $pdo->query("SELECT * FROM users");
    while ($row = $stmt->fetch()) {
        echo "<tr>";
        echo "<td>{$row['id']}</td>";
        echo "<td>{$row['username']}</td>";
        echo "<td>{$row['name']}</td>";
        echo "<td>{$row['email']}</td>";
        echo "<td>{$row['role']}</td>";
        echo "<td>" . ($row['is_active'] ? 'Yes' : 'No') . "</td>";
        echo "<td>{$row['created_at']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "\n<br><br>✅ Setup hoàn tất!";
    
} catch (PDOException $e) {
    echo "❌ Lỗi: " . $e->getMessage();
}
?>
