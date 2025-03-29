<?php
/**
 * 获取收支趋势统计API
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

// 验证日期参数
if (empty($_GET['start_date']) || empty($_GET['end_date'])) {
    http_response_code(400);
    echo json_encode(['error' => '开始日期和结束日期不能为空']);
    exit;
}

$start_date = $_GET['start_date'];
$end_date = $_GET['end_date'];

// 获取趋势统计数据
$transaction = new Transaction();
$results = $transaction->getTrendStats($user_id, $start_date, $end_date);

echo json_encode($results); 