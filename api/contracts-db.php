<?php
require_once 'db-config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDB();

switch ($method) {
    case 'GET':
        // Get all contracts or single contract
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM contracts WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $contract = $stmt->fetch();
            echo json_encode($contract ?: ['error' => 'Not found']);
        } else {
            $stmt = $pdo->query("SELECT id, name, file_type, created_at, updated_at FROM contracts ORDER BY updated_at DESC");
            echo json_encode($stmt->fetchAll());
        }
        break;

    case 'POST':
        // Create new contract
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['name']) || !isset($data['file_data'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }
        
        $stmt = $pdo->prepare("INSERT INTO contracts (name, file_type, file_data, modified_content, template, placeholder_mappings, markers) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['file_type'] ?? 'word',
            $data['file_data'],
            $data['modified_content'] ?? null,
            $data['template'] ?? null,
            json_encode($data['placeholder_mappings'] ?? []),
            json_encode($data['markers'] ?? [])
        ]);
        
        echo json_encode([
            'success' => true,
            'id' => $pdo->lastInsertId(),
            'message' => 'Contract created'
        ]);
        break;

    case 'PUT':
        // Update contract
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing contract ID']);
            exit;
        }
        
        $fields = [];
        $values = [];
        
        $allowedFields = ['name', 'file_data', 'modified_content', 'template', 'placeholder_mappings', 'markers'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = is_array($data[$field]) ? json_encode($data[$field]) : $data[$field];
            }
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }
        
        $values[] = $data['id'];
        $sql = "UPDATE contracts SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        echo json_encode(['success' => true, 'message' => 'Contract updated']);
        break;

    case 'DELETE':
        // Delete contract
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing contract ID']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM contracts WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Contract deleted']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>
