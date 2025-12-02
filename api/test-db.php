<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once 'db-config.php';

$result = [
    'status' => 'error',
    'message' => '',
    'tables' => [],
    'test_data' => null
];

try {
    $pdo = getDB();
    
    // Test connection
    $result['status'] = 'success';
    $result['message'] = 'Kết nối database thành công!';
    
    // List tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $result['tables'] = $tables;
    
    // Check if contracts table exists
    if (in_array('contracts', $tables)) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM contracts");
        $count = $stmt->fetch();
        $result['contracts_count'] = $count['count'];
    }
    
    // Check if placeholders table exists
    if (in_array('placeholders', $tables)) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM placeholders");
        $count = $stmt->fetch();
        $result['placeholders_count'] = $count['count'];
    }
    
} catch (PDOException $e) {
    $result['status'] = 'error';
    $result['message'] = 'Lỗi PDO: ' . $e->getMessage();
} catch (Exception $e) {
    $result['status'] = 'error';
    $result['message'] = 'Lỗi: ' . $e->getMessage();
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
