<?php
/**
 * 交易类别模型
 * 
 * 处理交易类别的查询操作
 */
require_once __DIR__ . '/../config/db.php';

class Category {
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
     * 获取所有类别
     * 
     * @input string $type 可选，类别类型(收入/支出)
     * @process 查询所有类别或指定类型的类别
     * @output 类别数组
     */
    public function getAll($type = null) {
        try {
            $sql = "SELECT * FROM categories";
            $params = [];
            
            if ($type) {
                $sql .= " WHERE type = ?";
                $params[] = $type;
            }
            
            $sql .= " ORDER BY type, name";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            return ['error' => '获取类别失败: ' . $e->getMessage()];
        }
    }
    
    /**
     * 根据ID获取类别
     * 
     * @input int $id 类别ID
     * @process 查询指定ID的类别
     * @output 类别信息
     */
    public function getById($id) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            
            return $stmt->fetch();
        } catch (PDOException $e) {
            return ['error' => '获取类别失败: ' . $e->getMessage()];
        }
    }
} 