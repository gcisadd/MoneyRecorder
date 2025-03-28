<?php
/**
 * 用户注册API
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
if (empty($data['username']) || empty($data['password']) || empty($data['email'])) {
    http_response_code(400);
    echo json_encode(['error' => '用户名、密码和邮箱不能为空']);
    exit;
}

// 验证用户名格式
if (!preg_match('/^[a-zA-Z0-9_]{3,20}$/', $data['username'])) {
    http_response_code(400);
    echo json_encode(['error' => '用户名只能包含字母、数字和下划线，长度在3-20个字符']);
    exit;
}

// 验证邮箱格式
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => '邮箱格式不正确']);
    exit;
}

// 验证密码强度
if (strlen($data['password']) < 6) {
    http_response_code(400);
    echo json_encode(['error' => '密码长度至少为6个字符']);
    exit;
}

// 处理注册请求
$user = new User();
$result = $user->register($data['username'], $data['password'], $data['email']);

if (isset($result['error'])) {
    http_response_code(400);
    echo json_encode($result);
} else {
    echo json_encode(['message' => '注册成功', 'user_id' => $result['id']]);
} 