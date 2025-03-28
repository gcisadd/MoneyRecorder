<?php
/**
 * 获取交易记录列表API
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 简单的权限验证
function authenticateUser() {
    if (empty($_GET['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => '未授权访问']);
        exit;
    }
    return intval($_GET['user_id']);
}

require_once __DIR__ . '/../../models/Transaction.php';

// 仅处理GET请求
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => '不支持的请求方法']);
    exit;
}

// 用户验证
$user_id = authenticateUser();

// 获取过滤参数
$filters = [];

if (!empty($_GET['start_date'])) {
    $filters['start_date'] = $_GET['start_date'];
}

if (!empty($_GET['end_date'])) {
    $filters['end_date'] = $_GET['end_date'];
}

if (!empty($_GET['type']) && in_array($_GET['type'], ['income', 'expense'])) {
    $filters['type'] = $_GET['type'];
}

if (!empty($_GET['category_id'])) {
    $filters['category_id'] = intval($_GET['category_id']);
}

// 获取交易记录
$transaction = new Transaction();
$results = $transaction->getByUserId($user_id, $filters);

echo json_encode($results); 