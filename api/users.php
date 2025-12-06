<?php
require_once 'db-config.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'register':
        handleRegister();
        break;
    case 'list':
        listUsers();
        break;
    case 'update':
        updateUser();
        break;
    case 'delete':
        deleteUser();
        break;
    default:
        echo json_encode(['error' => 'Invalid action']);
}

// Login handler
function handleLogin() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Vui lòng nhập đầy đủ thông tin']);
        return;
    }
    
    $username = trim($data['username']);
    $password = $data['password'];
    
    try {
        $pdo = getDB();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND is_active = 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Tên đăng nhập không tồn tại']);
            return;
        }
        
        // Verify password
        if (!password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Mật khẩu không đúng']);
            return;
        }
        
        // Update last login
        $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $updateStmt->execute([$user['id']]);
        
        // Return user data (without password)
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Lỗi server: ' . $e->getMessage()]);
    }
}

// Register new user
function handleRegister() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $required = ['username', 'password', 'name'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Thiếu thông tin: $field"]);
            return;
        }
    }
    
    $username = trim($data['username']);
    $password = $data['password'];
    $name = trim($data['name']);
    $email = isset($data['email']) ? trim($data['email']) : '';
    $role = isset($data['role']) ? $data['role'] : 'user';
    
    // Validate role
    if (!in_array($role, ['admin', 'user'])) {
        $role = 'user';
    }
    
    try {
        $pdo = getDB();
        
        // Check if username exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Tên đăng nhập đã tồn tại']);
            return;
        }
        
        // Hash password
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert user
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, name, email, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$username, $passwordHash, $name, $email, $role]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Đăng ký thành công',
            'userId' => $pdo->lastInsertId()
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Lỗi server: ' . $e->getMessage()]);
    }
}

// List all users (admin only)
function listUsers() {
    try {
        $pdo = getDB();
        $stmt = $pdo->query("SELECT id, username, name, email, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'users' => $users]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Lỗi server: ' . $e->getMessage()]);
    }
}

// Update user
function updateUser() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Thiếu ID người dùng']);
        return;
    }
    
    try {
        $pdo = getDB();
        
        $updates = [];
        $params = [];
        
        if (isset($data['name'])) {
            $updates[] = "name = ?";
            $params[] = trim($data['name']);
        }
        if (isset($data['email'])) {
            $updates[] = "email = ?";
            $params[] = trim($data['email']);
        }
        if (isset($data['role']) && in_array($data['role'], ['admin', 'user'])) {
            $updates[] = "role = ?";
            $params[] = $data['role'];
        }
        if (isset($data['is_active'])) {
            $updates[] = "is_active = ?";
            $params[] = $data['is_active'] ? 1 : 0;
        }
        if (isset($data['password']) && !empty($data['password'])) {
            $updates[] = "password_hash = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (empty($updates)) {
            echo json_encode(['success' => true, 'message' => 'Không có gì thay đổi']);
            return;
        }
        
        $params[] = $data['id'];
        $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Cập nhật thành công']);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Lỗi server: ' . $e->getMessage()]);
    }
}

// Delete user
function deleteUser() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Thiếu ID người dùng']);
        return;
    }
    
    try {
        $pdo = getDB();
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$data['id']]);
        
        echo json_encode(['success' => true, 'message' => 'Xóa thành công']);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Lỗi server: ' . $e->getMessage()]);
    }
}
?>
