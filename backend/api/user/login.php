<?php
/**
 * 用户登录API
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../models/User.php';

// 仅处理POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => '不支持的请求方法']);
    exit;
}

// 获取POST数据
$data = json_decode(file_get_contents('php://input'), true);

// 验证必填字段
if (empty($data['username']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => '用户名和密码不能为空']);
    exit;
}

// 处理登录请求
$user = new User();
$result = $user->login($data['username'], $data['password']);

if (isset($result['error'])) {
    http_response_code(401);
    echo json_encode($result);
} else {
    // 简单的会话令牌生成，实际应用中应使用更安全的方法
    $token = bin2hex(random_bytes(32));
    // 这里应该将令牌存储在服务器端的会话或数据库中
    
    echo json_encode([
        'message' => '登录成功',
        'user' => $result,
        'token' => $token
    ]);
} 