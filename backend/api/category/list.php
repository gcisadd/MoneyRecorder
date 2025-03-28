<?php
/**
 * 获取类别列表API
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../models/Category.php';

// 仅处理GET请求
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => '不支持的请求方法']);
    exit;
}

// 获取类型参数（可选）
$type = null;
if (!empty($_GET['type']) && in_array($_GET['type'], ['income', 'expense'])) {
    $type = $_GET['type'];
}

// 获取类别列表
$category = new Category();
$results = $category->getAll($type);

echo json_encode($results); 