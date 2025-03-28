<?php
/**
 * 用户模型
 * 
 * 处理用户相关的数据操作，包括注册、登录、获取用户信息等
 */
require_once __DIR__ . '/../config/db.php';

class User {
    private $db;
    
    /**
     * 构造函数
     * 
     * @input 无
     * @process 获取数据库连接
     * @output 无
     */
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * 注册新用户
     * 
     * @input string $username 用户名
     * @input string $password 密码
     * @input string $email 邮箱
     * @process 1. 验证输入数据
     *          2. 加密密码
     *          3. 将用户信息插入数据库
     * @output 成功返回用户ID，失败返回false
     */
    public function register($username, $password, $email) {
        try {
            // 检查用户名是否已存在
            $stmt = $this->db->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetch()) {
                return ['error' => '用户名已存在'];
            }
            
            // 检查邮箱是否已存在
            $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                return ['error' => '邮箱已存在'];
            }
            
            // 密码加密
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            // 插入新用户
            $stmt = $this->db->prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)");
            $stmt->execute([$username, $hashedPassword, $email]);
            
            return ['id' => $this->db->lastInsertId()];
        } catch (PDOException $e) {
            return ['error' => '注册失败: ' . $e->getMessage()];
        }
    }
    
    /**
     * 用户登录
     * 
     * @input string $username 用户名
     * @input string $password 密码
     * @process 1. 根据用户名查找用户
     *          2. 验证密码
     * @output 成功返回用户信息，失败返回false
     */
    public function login($username, $password) {
        try {
            $stmt = $this->db->prepare("SELECT id, username, password, email FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password'])) {
                unset($user['password']); // 移除密码，不返回给前端
                return $user;
            }
            
            return ['error' => '用户名或密码错误'];
        } catch (PDOException $e) {
            return ['error' => '登录失败: ' . $e->getMessage()];
        }
    }
    
    /**
     * 获取用户信息
     * 
     * @input int $id 用户ID
     * @process 根据ID查询用户信息
     * @output 用户信息数组
     */
    public function getUserById($id) {
        try {
            $stmt = $this->db->prepare("SELECT id, username, email, created_at FROM users WHERE id = ?");
            $stmt->execute([$id]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            return ['error' => '获取用户信息失败: ' . $e->getMessage()];
        }
    }
} 