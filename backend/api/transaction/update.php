<?php
/**
 * 更新交易记录API
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
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

// 仅处理PUT请求
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => '不支持的请求方法']);
    exit;
}

// 用户验证
$user_id = authenticateUser();

// 获取PUT数据
$data = json_decode(file_get_contents('php://input'), true);

// 验证必填字段
if (empty($data['id']) || empty($data['category_id']) || !isset($data['amount']) || empty($data['type']) || empty($data['transaction_date'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID、类别、金额、类型和日期不能为空']);
    exit;
}

// 验证金额格式
if (!is_numeric($data['amount']) || $data['amount'] <= 0) {
    http_response_code(400);
    echo json_encode(['error' => '金额必须为正数']);
    exit;
}

// 验证类型
if (!in_array($data['type'], ['income', 'expense'])) {
    http_response_code(400);
    echo json_encode(['error' => '类型必须为收入或支出']);
    exit;
}

// 处理请求
$transaction = new Transaction();
$result = $transaction->update($data['id'], $user_id, $data);

if (isset($result['error'])) {
    http_response_code(400);
    echo json_encode($result);
} else {
    echo json_encode(['message' => '更新成功']);
} 