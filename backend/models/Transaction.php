<?php
/**
 * 交易记录模型
 * 
 * 处理交易记录的添加、修改、查询等操作
 */
require_once __DIR__ . '/../config/db.php';

class Transaction {
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
     * 添加交易记录
     * 
     * @input array $data 交易记录数据
     * @process 将交易记录数据插入数据库
     * @output 成功返回记录ID，失败返回错误信息
     */
    public function add($data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO transactions 
                (user_id, category_id, amount, type, description, transaction_date) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['user_id'],
                $data['category_id'],
                $data['amount'],
                $data['type'],
                $data['description'] ?? null,
                $data['transaction_date']
            ]);
            
            return ['id' => $this->db->lastInsertId()];
        } catch (PDOException $e) {
            return ['error' => '添加交易记录失败: ' . $e->getMessage()];
        }
    }
    
    /**
     * 更新交易记录
     * 
     * @input int $id 记录ID
     * @input array $data 更新数据
     * @process 更新指定ID的交易记录
     * @output 成功返回true，失败返回错误信息
     */
    public function update($id, $user_id, $data) {
        try {
            // 确保记录属于当前用户
            $stmt = $this->db->prepare("SELECT id FROM transactions WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user_id]);
            if (!$stmt->fetch()) {
                return ['error' => '未找到记录或无权限修改'];
            }
            
            $stmt = $this->db->prepare("
                UPDATE transactions 
                SET category_id = ?, amount = ?, type = ?, description = ?, transaction_date = ?
                WHERE id = ? AND user_id = ?
            ");
            
            $stmt->execute([
                $data['category_id'],
                $data['amount'],
                $data['type'],
                $data['description'] ?? null,
                $data['transaction_date'],
                $id,
                $user_id
            ]);
            
            return ['success' => true];
        } catch (PDOException $e) {
            return ['error' => '更新交易记录失败: ' . $e->getMessage()];
        }
    }
    
    /**
     * 删除交易记录
     * 
     * @input int $id 记录ID
     * @input int $user_id 用户ID
     * @process 删除指定的交易记录
     * @output 成功返回true，失败返回错误信息
     */
    public function delete($id, $user_id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user_id]);
            
            if ($stmt->rowCount() > 0) {
                return ['success' => true];
            } else {
                return ['error' => '未找到记录或无权限删除'];
            }
        } catch (PDOException $e) {
            return ['error' => '删除交易记录失败: ' . $e->getMessage()];
        }
    }
    
    /**
     * 获取用户的交易记录
     * 
     * @input int $user_id 用户ID
     * @input array $filters 过滤条件
     * @process 查询符合条件的交易记录
     * @output 交易记录数组
     */
    public function getByUserId($user_id, $filters = []) {
        try {
            $sql = "
                SELECT t.*, c.name as category_name, c.icon as category_icon
                FROM transactions t
                JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = ?
            ";
            
            $params = [$user_id];
            
            // 添加日期范围过滤
            if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
                $sql .= " AND t.transaction_date BETWEEN ? AND ?";
                $params[] = $filters['start_date'];
                $params[] = $filters['end_date'];
            }
            
            // 添加类型过滤
            if (!empty($filters['type'])) {
                $sql .= " AND t.type = ?";
                $params[] = $filters['type'];
            }
            
            // 添加类别过滤
            if (!empty($filters['category_id'])) {
                $sql .= " AND t.category_id = ?";
                $params[] = $filters['category_id'];
            }
            
            $sql .= " ORDER BY t.transaction_date DESC";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            return ['error' => '获取交易记录失败: ' . $e->getMessage()];
        }
    }
    
    /**
     * 获取用户收支统计
     * 
     * @input int $user_id 用户ID
     * @input string $start_date 开始日期
     * @input string $end_date 结束日期
     * @process 统计指定日期范围内的收支总额
     * @output 统计数据
     */
    public function getStats($user_id, $start_date, $end_date) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    type,
                    SUM(amount) as total
                FROM transactions
                WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
                GROUP BY type
            ");
            
            $stmt->execute([$user_id, $start_date, $end_date]);
            $results = $stmt->fetchAll();
            
            $stats = [
                'income' => 0,
                'expense' => 0,
                'balance' => 0
            ];
            
            foreach ($results as $row) {
                $stats[$row['type']] = floatval($row['total']);
            }
            
            $stats['balance'] = $stats['income'] - $stats['expense'];
            
            return $stats;
        } catch (PDOException $e) {
            return ['error' => '获取统计数据失败: ' . $e->getMessage()];
        }
    }
} 