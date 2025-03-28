<?php
/**
 * 数据库连接类
 * 
 * 提供数据库连接功能，使用单例模式确保只创建一个连接实例
 */
class Database {
    private static $instance = null;
    private $conn;
    
    /**
     * 构造函数
     * 
     * @input 数据库配置参数
     * @process 建立与数据库的连接
     * @output PDO连接对象
     */
    private function __construct() {
        $config = require_once __DIR__ . '/database.php';
        
        try {
            $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->conn = new PDO($dsn, $config['username'], $config['password'], $options);
        } catch (PDOException $e) {
            die("数据库连接失败: " . $e->getMessage());
        }
    }
    
    /**
     * 获取数据库实例
     * 
     * @input 无
     * @process 检查实例是否存在，不存在则创建
     * @output 数据库连接实例
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * 获取连接
     * 
     * @input 无
     * @process 返回PDO连接对象
     * @output PDO连接对象
     */
    public function getConnection() {
        return $this->conn;
    }
} 