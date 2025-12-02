<?php
require_once 'db-config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDB();

switch ($method) {
    case 'GET':
        // Get all placeholders
        $stmt = $pdo->query("SELECT * FROM placeholders ORDER BY is_default DESC, id ASC");
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        // Create new placeholder
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['field']) || !isset($data['label'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }
        
        $stmt = $pdo->prepare("INSERT INTO placeholders (field, label, icon, sample_data, is_default) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE label = VALUES(label), icon = VALUES(icon), sample_data = VALUES(sample_data)");
        $stmt->execute([
            $data['field'],
            $data['label'],
            $data['icon'] ?? 'bi-tag',
            $data['sample_data'] ?? '',
            $data['is_default'] ?? false
        ]);
        
        echo json_encode([
            'success' => true,
            'id' => $pdo->lastInsertId(),
            'message' => 'Placeholder saved'
        ]);
        break;

    case 'DELETE':
        // Delete placeholder (only non-default)
        $field = $_GET['field'] ?? null;
        
        if (!$field) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing field name']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM placeholders WHERE field = ? AND is_default = FALSE");
        $stmt->execute([$field]);
        
        echo json_encode(['success' => true, 'message' => 'Placeholder deleted']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
