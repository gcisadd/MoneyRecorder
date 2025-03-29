<?php
/**
 * 导出交易记录API
 */
header('Content-Type: text/csv; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 简单的权限验证
function authenticateUser() {
    if (empty($_GET['user_id'])) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['error' => '未授权访问']);
        exit;
    }
    return intval($_GET['user_id']);
}

require_once __DIR__ . '/../../models/Transaction.php';

// 仅处理GET请求
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Content-Type: application/json');
    http_response_code(405);
    echo json_encode(['error' => '不支持的请求方法']);
    exit;
}

// 用户验证
$user_id = authenticateUser();

// 获取日期范围
$start_date = $_GET['start_date'] ?? '';
$end_date = $_GET['end_date'] ?? '';

if (empty($start_date) || empty($end_date)) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => '开始日期和结束日期不能为空']);
    exit;
}

// 获取交易记录
$transaction = new Transaction();
$filters = [
    'start_date' => $start_date,
    'end_date' => $end_date
];

// 添加类型过滤
if (!empty($_GET['type']) && in_array($_GET['type'], ['income', 'expense'])) {
    $filters['type'] = $_GET['type'];
}

// 添加类别过滤
if (!empty($_GET['category_id'])) {
    $filters['category_id'] = intval($_GET['category_id']);
}

$records = $transaction->getByUserId($user_id, $filters);

if (isset($records['error'])) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode($records);
    exit;
}

// 设置文件名
$filename = "transactions_{$start_date}_to_{$end_date}.csv";
header('Content-Disposition: attachment; filename="' . $filename . '"');

// 创建CSV输出
$output = fopen('php://output', 'w');

// 添加BOM标记，确保Excel正确识别UTF-8编码
fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

// 写入CSV标题行
fputcsv($output, ['日期', '类型', '类别', '金额', '描述']);

// 写入数据行
foreach ($records as $record) {
    $type = $record['type'] === 'income' ? '收入' : '支出';
    fputcsv($output, [
        $record['transaction_date'],
        $type,
        $record['category_name'],
        $record['amount'],
        $record['description'] ?? ''
    ]);
}

fclose($output);
exit; 