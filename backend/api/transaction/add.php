<?php
/**
 * 添加交易记录API
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 简单的权限验证，实际项目中应该使用更安全的JWT或OAuth
function authenticateUser() {
    // 在实际应用中，应该验证请求头中的令牌
    // 简化处理，这里假设用户ID通过请求参数传递
    if (empty($_GET['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => '未授权访问']);
        exit;
    }
    return intval($_GET['user_id']);
}

require_once __DIR__ . '/../../models/Transaction.php';

// 仅处理POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => '不支持的请求方法']);
    exit;
}

// 用户验证
$user_id = authenticateUser();

// 获取POST数据
$data = json_decode(file_get_contents('php://input'), true);

// 验证必填字段
if (empty($data['category_id']) || !isset($data['amount']) || empty($data['type']) || empty($data['transaction_date'])) {
    http_response_code(400);
    echo json_encode(['error' => '类别、金额、类型和日期不能为空']);
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

// 添加用户ID
$data['user_id'] = $user_id;

// 处理请求
$transaction = new Transaction();
$result = $transaction->add($data);

if (isset($result['error'])) {
    http_response_code(400);
    echo json_encode($result);
} else {
    echo json_encode(['message' => '添加成功', 'transaction_id' => $result['id']]);
} 