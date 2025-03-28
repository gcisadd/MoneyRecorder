<?php
/**
 * 删除交易记录API
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 处理OPTIONS请求（预检请求）
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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

// 仅处理DELETE请求
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => '不支持的请求方法']);
    exit;
}

// 用户验证
$user_id = authenticateUser();

// 验证交易记录ID
if (empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['error' => '交易记录ID不能为空']);
    exit;
}

$id = intval($_GET['id']);

// 处理请求
$transaction = new Transaction();
$result = $transaction->delete($id, $user_id);

if (isset($result['error'])) {
    http_response_code(400);
    echo json_encode($result);
} else {
    echo json_encode(['message' => '删除成功']);
} 