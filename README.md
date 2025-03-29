# 个人记账本项目

这是一个基于 PHP、MySQL 和前端三件套(HTML、CSS、JavaScript)开发的个人记账本项目。该项目旨在帮助用户方便地管理个人财务，记录日常收支，并提供数据可视化分析。

## 功能特点

- 📝 用户账户管理
  - 用户注册与登录
  - 个人信息管理
  - 安全密码验证

- 💰 交易记录管理
  - 收入/支出记录添加
  - 交易记录编辑和删除
  - 交易类别自定义
  - 交易备注功能

- 📊 数据统计与分析
  - 收支总额统计
  - 类别分布分析
  - 收支趋势图表
  - 自定义日期范围统计

- 🔍 高级筛选功能
  - 按类型筛选（收入/支出）
  - 按类别筛选
  - 按日期范围筛选
  - 组合条件筛选

- 📱 其他特性
  - 响应式界面设计
  - 数据导出功能
  - 直观的操作界面
  - 实时数据更新

## 技术栈

### 前端
- HTML5
- CSS3
- JavaScript
- Chart.js (数据可视化)
- Font Awesome (图标库)

### 后端
- PHP 7+
- MySQL 5.7+
- RESTful API

## 项目结构

## API 接口说明

### 用户相关接口
- POST `/api/user/register.php` - 用户注册
- POST `/api/user/login.php` - 用户登录
- GET `/api/user/info.php` - 获取用户信息
- PUT `/api/user/update.php` - 更新用户信息

### 交易记录接口
- GET `/api/transaction/list.php` - 获取交易记录列表
- POST `/api/transaction/add.php` - 添加交易记录
- PUT `/api/transaction/update.php` - 更新交易记录
- DELETE `/api/transaction/delete.php` - 删除交易记录
- GET `/api/transaction/stats.php` - 获取统计数据
- GET `/api/transaction/export.php` - 导出交易记录

### 类别管理接口
- GET `/api/category/list.php` - 获取类别列表
- POST `/api/category/add.php` - 添加类别
- PUT `/api/category/update.php` - 更新类别
- DELETE `/api/category/delete.php` - 删除类别

## 安装部署

1. **克隆项目**
   ```bash
   git clone https://git.code.tencent.com/gongchi/MoneyRecorder.git
   cd MoneyRecorder
   ```

2. **配置数据库**
   ```bash
   # 创建数据库
   mysql -u root -p
   CREATE DATABASE money_recorder;
   
   # 导入数据库结构
   mysql -u root -p money_recorder < database/init.sql
   ```

3. **配置后端**
   - 复制配置文件模板：
     ```bash
     cp backend/config/config.example.php backend/config/config.php
     ```
   - 修改 `config.php` 中的数据库配置：
     ```php
     define('DB_HOST', 'localhost');
     define('DB_USER', 'your_username');
     define('DB_PASS', 'your_password');
     define('DB_NAME', 'money_recorder');
     ```

4. **配置Web服务器**
   
   Apache配置示例：
   ```apache
   <VirtualHost *:80>
       ServerName money.local
       DocumentRoot "/path/to/MoneyRecorder"
       
       <Directory "/path/to/MoneyRecorder">
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

## 使用说明

1. **注册/登录**
   - 访问首页，点击"注册"按钮创建新账户
   - 使用注册的账号和密码登录系统

2. **添加交易记录**
   - 点击"添加收入"或"添加支出"按钮
   - 填写交易金额
   - 选择交易类别
   - 添加交易描述（可选）
   - 选择交易日期
   - 点击"保存"按钮

3. **查看统计数据**
   - 在顶部统计面板查看总收入、支出和结余
   - 查看收支分类饼图
   - 查看收支趋势折线图

4. **管理交易记录**
   - 使用筛选功能过滤交易记录
   - 点击记录右侧的编辑或删除按钮进行操作
   - 使用导出功能导出交易记录

## 开发计划

### 近期计划
- [ ] 添加多币种支持
- [ ] 实现预算管理功能
- [ ] 添加账单提醒功能

### 长期计划
- [ ] 支持数据导入导出
- [ ] 添加移动端APP
- [ ] 实现多账户管理
- [ ] 添加财务分析报告

## 常见问题

1. **Q: 如何修改密码？**  
   A: 目前需要在个人信息页面进行密码修改。

2. **Q: 如何备份数据？**  
   A: 可以使用导出功能导出交易记录，或直接备份数据库。

3. **Q: 支持哪些浏览器？**  
   A: 支持所有现代浏览器，建议使用 Chrome、Firefox、Edge 等。

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件至：[2022155026@email.szu.edu.cn]

## 致谢

感谢所有为这个项目提供帮助和建议的贡献者。

## 更新日志

### v1.0.0 (2024-03-29)
- 实现基础的记账功能
- 添加用户认证系统
- 实现数据可视化功能
- 添加导出功能
