/**
 * 记账本应用
 * 
 * 实现用户注册、登录、记账、查询等功能
 */

// API地址常量
const API_URL = '../backend/api';

// 全局变量
let currentUser = null; // 当前登录用户
let categories = []; // 类别列表
let transactions = []; // 交易记录列表

// DOM元素
document.addEventListener('DOMContentLoaded', function() {
    // 初始化应用
    initApp();
    
    // 切换登录/注册表单
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签和表单的active类
            document.querySelectorAll('.tab, .form').forEach(el => {
                el.classList.remove('active');
            });
            
            // 激活当前标签和对应表单
            this.classList.add('active');
            const tabName = this.getAttribute('data-tab');
            document.getElementById(`${tabName}-form`).classList.add('active');
        });
    });
    
    // 登录表单提交
    document.getElementById('login-btn').addEventListener('click', function() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        
        if (!username || !password) {
            showError('login-error', '用户名和密码不能为空');
            return;
        }
        
        login(username, password);
    });
    
    // 注册表单提交
    document.getElementById('register-btn').addEventListener('click', function() {
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirm = document.getElementById('register-confirm').value.trim();
        
        // 简单验证
        if (!username || !email || !password || !confirm) {
            showError('register-error', '所有字段都必须填写');
            return;
        }
        
        if (password !== confirm) {
            showError('register-error', '两次输入的密码不一致');
            return;
        }
        
        register(username, email, password);
    });
    
    // 退出登录
    document.getElementById('logout-btn').addEventListener('click', function() {
        logout();
    });
    
    // 日期范围选择
    document.getElementById('date-range').addEventListener('change', function() {
        const customDateContainer = document.getElementById('custom-date-container');
        if (this.value === 'custom') {
            customDateContainer.classList.remove('hide');
        } else {
            customDateContainer.classList.add('hide');
            // 根据选择的时间范围加载数据
            loadTransactionsByDateRange(this.value);
        }
    });
    
    // 自定义日期应用按钮
    document.getElementById('apply-date').addEventListener('click', function() {
        loadTransactionsByCustomDateRange();
    });
    
    // 添加收入按钮
    document.getElementById('add-income-btn').addEventListener('click', function() {
        showTransactionModal('income');
    });
    
    // 添加支出按钮
    document.getElementById('add-expense-btn').addEventListener('click', function() {
        showTransactionModal('expense');
    });
    
    // 关闭弹窗
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            closeModal();
        });
    });
    
    // 交易记录表单提交
    document.getElementById('transaction-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveTransaction();
    });
    
    // 筛选按钮
    document.getElementById('filter-btn').addEventListener('click', function() {
        filterTransactions();
    });
    
    // 重置筛选按钮
    document.getElementById('reset-filter-btn').addEventListener('click', function() {
        resetFilters();
    });
    
    // 设置今天的日期为默认日期
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    document.getElementById('transaction-date').value = formattedDate;
});

/**
 * 初始化应用
 * 
 * @input 无
 * @process 检查本地存储中是否有用户登录信息
 * @output 如果有登录信息，自动登录
 */
function initApp() {
    // 检查本地存储中的用户登录信息
    const savedUser = localStorage.getItem('current_user');
    const savedToken = localStorage.getItem('auth_token');
    
    if (savedUser && savedToken) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
        loadCategories();
        // 默认加载本月数据
        loadTransactionsByDateRange('month');
    }
}

/**
 * 用户登录
 * 
 * @input string username 用户名
 * @input string password 密码
 * @process 发送登录请求
 * @output 登录成功显示主应用，失败显示错误
 */
function login(username, password) {
    fetch(`${API_URL}/user/login.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showError('login-error', data.error);
        } else {
            // 保存用户信息和令牌
            currentUser = data.user;
            localStorage.setItem('current_user', JSON.stringify(data.user));
            localStorage.setItem('auth_token', data.token);
            
            // 显示主应用
            showMainApp();
            loadCategories();
            // 默认加载本月数据
            loadTransactionsByDateRange('month');
        }
    })
    .catch(error => {
        showError('login-error', '登录请求失败: ' + error.message);
    });
}

/**
 * 用户注册
 * 
 * @input string username 用户名
 * @input string email 邮箱
 * @input string password 密码
 * @process 发送注册请求
 * @output 注册成功切换到登录表单，失败显示错误
 */
function register(username, email, password) {
    fetch(`${API_URL}/user/register.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            email,
            password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showError('register-error', data.error);
        } else {
            // 清空注册表单
            document.getElementById('register-username').value = '';
            document.getElementById('register-email').value = '';
            document.getElementById('register-password').value = '';
            document.getElementById('register-confirm').value = '';
            
            // 显示注册成功信息并切换到登录表单
            alert('注册成功，请登录');
            
            // 切换到登录标签
            document.querySelectorAll('.tab, .form').forEach(el => {
                el.classList.remove('active');
            });
            document.querySelector('.tab[data-tab="login"]').classList.add('active');
            document.getElementById('login-form').classList.add('active');
            
            // 自动填充登录用户名
            document.getElementById('login-username').value = username;
        }
    })
    .catch(error => {
        showError('register-error', '注册请求失败: ' + error.message);
    });
}

/**
 * 用户退出登录
 * 
 * @input 无
 * @process 清除登录信息
 * @output 显示登录/注册界面
 */
function logout() {
    // 清除当前用户和令牌
    currentUser = null;
    localStorage.removeItem('current_user');
    localStorage.removeItem('auth_token');
    
    // 隐藏主应用，显示登录界面
    document.getElementById('app-content').classList.add('hide');
    document.getElementById('auth-container').classList.remove('hide');
    
    // 清空登录表单
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').textContent = '';
}

/**
 * 显示主应用界面
 * 
 * @input 无
 * @process 隐藏登录界面，显示主应用
 * @output 更新用户名显示
 */
function showMainApp() {
    document.getElementById('auth-container').classList.add('hide');
    document.getElementById('app-content').classList.remove('hide');
    
    // 显示用户名
    document.getElementById('username-display').textContent = `欢迎，${currentUser.username}`;
}

/**
 * 显示错误信息
 * 
 * @input string elementId 显示错误的元素ID
 * @input string message 错误信息
 * @process 在指定元素中显示错误信息
 * @output 无
 */
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    
    // 3秒后自动清除错误信息
    setTimeout(() => {
        errorElement.textContent = '';
    }, 3000);
}

/**
 * 加载类别列表
 * 
 * @input 无
 * @process 从API获取类别列表
 * @output 填充类别下拉菜单
 */
function loadCategories() {
    fetch(`${API_URL}/category/list.php`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('加载类别失败:', data.error);
            return;
        }
        
        categories = data;
        
        // 填充筛选类别下拉菜单
        const filterCategorySelect = document.getElementById('filter-category');
        // 清空现有选项
        filterCategorySelect.innerHTML = '<option value="all">全部</option>';
        
        // 添加类别选项
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            filterCategorySelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('加载类别请求失败:', error);
    });
}

/**
 * 根据类型加载类别到交易记录表单
 * 
 * @input string type 交易类型(income/expense)
 * @process 筛选指定类型的类别
 * @output 填充类别下拉菜单
 */
function loadCategoriesByType(type) {
    const categorySelect = document.getElementById('transaction-category');
    // 清空现有选项
    categorySelect.innerHTML = '';
    
    // 过滤并添加对应类型的类别
    const filteredCategories = categories.filter(category => category.type === type);
    
    filteredCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

/**
 * 根据日期范围加载交易记录
 * 
 * @input string range 日期范围类型(month/quarter/year)
 * @process 计算日期范围并获取数据
 * @output 显示交易记录和统计数据
 */
function loadTransactionsByDateRange(range) {
    const today = new Date();
    let startDate, endDate;
    
    switch(range) {
        case 'month':
            // 本月第一天
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            // 下月第一天的前一天（本月最后一天）
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'quarter':
            // 当前季度第一个月
            const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
            // 本季度第一天
            startDate = new Date(today.getFullYear(), quarterStartMonth, 1);
            // 下季度第一天的前一天（本季度最后一天）
            endDate = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
            break;
        case 'year':
            // 本年第一天
            startDate = new Date(today.getFullYear(), 0, 1);
            // 本年最后一天
            endDate = new Date(today.getFullYear(), 11, 31);
            break;
        default:
            return;
    }
    
    // 格式化日期为YYYY-MM-DD
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    // 加载交易记录
    loadTransactions(formattedStartDate, formattedEndDate);
}

/**
 * 加载自定义日期范围的交易记录
 * 
 * @input 无
 * @process 获取输入的日期范围
 * @output 显示交易记录和统计数据
 */
function loadTransactionsByCustomDateRange() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        alert('请选择开始和结束日期');
        return;
    }
    
    if (startDate > endDate) {
        alert('开始日期不能大于结束日期');
        return;
    }
    
    loadTransactions(startDate, endDate);
}

/**
 * 加载交易记录
 * 
 * @input string startDate 开始日期
 * @input string endDate 结束日期
 * @process 从API获取交易记录和统计数据
 * @output 显示交易记录和统计数据
 */
function loadTransactions(startDate, endDate) {
    // 构建API URL，包含用户ID和日期范围
    const transactionsUrl = `${API_URL}/transaction/list.php?user_id=${currentUser.id}&start_date=${startDate}&end_date=${endDate}`;
    
    // 获取交易记录
    fetch(transactionsUrl)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('加载交易记录失败:', data.error);
            return;
        }
        
        transactions = data;
        displayTransactions(transactions);
        
        // 获取统计数据
        loadStats(startDate, endDate);
    })
    .catch(error => {
        console.error('加载交易记录请求失败:', error);
    });
}

/**
 * 加载统计数据
 * 
 * @input string startDate 开始日期
 * @input string endDate 结束日期
 * @process 从API获取统计数据
 * @output 显示统计数据
 */
function loadStats(startDate, endDate) {
    const statsUrl = `${API_URL}/transaction/stats.php?user_id=${currentUser.id}&start_date=${startDate}&end_date=${endDate}`;
    
    fetch(statsUrl)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('加载统计数据失败:', data.error);
            return;
        }
        
        // 更新统计面板
        document.getElementById('income-value').textContent = `¥${data.income.toFixed(2)}`;
        document.getElementById('expense-value').textContent = `¥${data.expense.toFixed(2)}`;
        document.getElementById('balance-value').textContent = `¥${data.balance.toFixed(2)}`;
    })
    .catch(error => {
        console.error('加载统计数据请求失败:', error);
    });
}

/**
 * 显示交易记录列表
 * 
 * @input array transactions 交易记录数组
 * @process 创建交易记录DOM元素
 * @output 在页面上显示交易记录
 */
function displayTransactions(transactions) {
    const transactionList = document.getElementById('transaction-list');
    const emptyMessage = document.getElementById('empty-list-message');
    
    // 清空现有记录
    transactionList.innerHTML = '';
    
    if (transactions.length === 0) {
        // 显示空记录提示
        transactionList.classList.add('hide');
        emptyMessage.classList.remove('hide');
        return;
    }
    
    // 隐藏空记录提示
    transactionList.classList.remove('hide');
    emptyMessage.classList.add('hide');
    
    // 显示交易记录
    transactions.forEach(transaction => {
        const transactionItem = createTransactionElement(transaction);
        transactionList.appendChild(transactionItem);
    });
}

/**
 * 创建交易记录DOM元素
 * 
 * @input object transaction 交易记录对象
 * @process 根据交易记录创建DOM元素
 * @output 返回创建的DOM元素
 */
function createTransactionElement(transaction) {
    const item = document.createElement('div');
    item.className = `transaction-item ${transaction.type}`;
    item.dataset.id = transaction.id;
    
    // 格式化金额
    const formattedAmount = parseFloat(transaction.amount).toFixed(2);
    
    // 构建HTML
    item.innerHTML = `
        <div class="transaction-info">
            <div class="category-icon">
                <i class="fas fa-${transaction.category_icon || (transaction.type === 'income' ? 'arrow-down' : 'arrow-up')}"></i>
            </div>
            <div class="transaction-details">
                <div class="description">${transaction.description || transaction.category_name}</div>
                <div class="category-date">${transaction.category_name} · ${formatDateForDisplay(transaction.transaction_date)}</div>
            </div>
        </div>
        <div class="transaction-amount">
            ${transaction.type === 'income' ? '+' : '-'}¥${formattedAmount}
        </div>
        <div class="transaction-actions">
            <button class="edit-transaction" title="编辑"><i class="fas fa-edit"></i></button>
            <button class="delete-transaction" title="删除"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    // 添加编辑和删除事件
    item.querySelector('.edit-transaction').addEventListener('click', () => {
        editTransaction(transaction);
    });
    
    item.querySelector('.delete-transaction').addEventListener('click', () => {
        deleteTransaction(transaction.id);
    });
    
    return item;
}

/**
 * 显示交易记录弹窗
 * 
 * @input string type 交易类型(income/expense)
 * @input object transaction 可选，要编辑的交易记录
 * @process 准备并显示弹窗
 * @output 无
 */
function showTransactionModal(type, transaction = null) {
    const modal = document.getElementById('transaction-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('transaction-form');
    
    // 设置标题和类型
    modalTitle.textContent = transaction ? '编辑交易记录' : (type === 'income' ? '添加收入' : '添加支出');
    document.getElementById('transaction-type').value = type;
    
    // 加载对应类型的类别
    loadCategoriesByType(type);
    
    // 如果是编辑模式，填充表单数据
    if (transaction) {
        document.getElementById('transaction-amount').value = transaction.amount;
        document.getElementById('transaction-category').value = transaction.category_id;
        document.getElementById('transaction-date').value = transaction.transaction_date;
        document.getElementById('transaction-description').value = transaction.description || '';
        
        // 存储交易ID用于更新
        form.dataset.transactionId = transaction.id;
    } else {
        // 清空表单
        form.reset();
        // 设置当前日期
        const today = new Date();
        document.getElementById('transaction-date').value = formatDate(today);
        // 移除可能存在的交易ID
        delete form.dataset.transactionId;
    }
    
    // 显示弹窗
    modal.classList.remove('hide');
}

/**
 * 关闭交易记录弹窗
 * 
 * @input 无
 * @process 隐藏弹窗
 * @output 无
 */
function closeModal() {
    document.getElementById('transaction-modal').classList.add('hide');
}

/**
 * 保存交易记录
 * 
 * @input 无
 * @process 获取表单数据并保存
 * @output 成功关闭弹窗并刷新数据
 */
function saveTransaction() {
    const form = document.getElementById('transaction-form');
    const transactionId = form.dataset.transactionId;
    
    // 获取表单数据
    const data = {
        type: document.getElementById('transaction-type').value,
        amount: parseFloat(document.getElementById('transaction-amount').value),
        category_id: parseInt(document.getElementById('transaction-category').value),
        transaction_date: document.getElementById('transaction-date').value,
        description: document.getElementById('transaction-description').value
    };
    
    // 验证数据
    if (!data.amount || data.amount <= 0) {
        alert('请输入有效金额');
        return;
    }
    
    if (!data.category_id) {
        alert('请选择类别');
        return;
    }
    
    if (!data.transaction_date) {
        alert('请选择日期');
        return;
    }
    
    // 确定API端点和方法
    let url = `${API_URL}/transaction/`;
    let method;
    
    if (transactionId) {
        // 更新现有记录
        url += `update.php?user_id=${currentUser.id}`;
        method = 'PUT';
        data.id = transactionId;
    } else {
        // 添加新记录
        url += `add.php?user_id=${currentUser.id}`;
        method = 'POST';
    }
    
    // 发送请求
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            alert(`保存失败: ${result.error}`);
            return;
        }
        
        // 关闭弹窗
        closeModal();
        
        // 刷新数据
        const dateRange = document.getElementById('date-range').value;
        if (dateRange === 'custom') {
            loadTransactionsByCustomDateRange();
        } else {
            loadTransactionsByDateRange(dateRange);
        }
        
        // 提示成功
        alert(transactionId ? '更新成功' : '添加成功');
    })
    .catch(error => {
        alert(`请求失败: ${error.message}`);
    });
}

/**
 * 编辑交易记录
 * 
 * @input object transaction 要编辑的交易记录
 * @process 显示编辑弹窗
 * @output 无
 */
function editTransaction(transaction) {
    showTransactionModal(transaction.type, transaction);
}

/**
 * 删除交易记录
 * 
 * @input int id 交易记录ID
 * @process 发送删除请求
 * @output 成功刷新数据
 */
function deleteTransaction(id) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }
    
    fetch(`${API_URL}/transaction/delete.php?user_id=${currentUser.id}&id=${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            alert(`删除失败: ${result.error}`);
            return;
        }
        
        // 刷新数据
        const dateRange = document.getElementById('date-range').value;
        if (dateRange === 'custom') {
            loadTransactionsByCustomDateRange();
        } else {
            loadTransactionsByDateRange(dateRange);
        }
        
        // 提示成功
        alert('删除成功');
    })
    .catch(error => {
        alert(`请求失败: ${error.message}`);
    });
}

/**
 * 筛选交易记录
 * 
 * @input 无
 * @process 获取筛选条件并筛选数据
 * @output 显示筛选后的交易记录
 */
function filterTransactions() {
    const type = document.getElementById('filter-type').value;
    const categoryId = document.getElementById('filter-category').value;
    
    // 构建筛选条件
    let filtered = [...transactions];
    
    if (type !== 'all') {
        filtered = filtered.filter(t => t.type === type);
    }
    
    if (categoryId !== 'all') {
        filtered = filtered.filter(t => t.category_id == categoryId);
    }
    
    // 显示筛选结果
    displayTransactions(filtered);
}

/**
 * 重置筛选条件
 * 
 * @input 无
 * @process 重置筛选表单并显示所有记录
 * @output 无
 */
function resetFilters() {
    document.getElementById('filter-type').value = 'all';
    document.getElementById('filter-category').value = 'all';
    
    // 显示所有记录
    displayTransactions(transactions);
}

/**
 * 日期格式化工具
 * 
 * @input Date date 日期对象
 * @process 将日期格式化为YYYY-MM-DD
 * @output 格式化后的日期字符串
 */
function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * 日期显示格式化工具
 * 
 * @input string dateString 日期字符串
 * @process 将YYYY-MM-DD格式化为更友好的显示格式
 * @output 格式化后的日期字符串
 */
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
} 