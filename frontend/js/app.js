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
    
    // 点击×关闭弹窗
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            closeModal();
        });
    });
    
    // 点击取消关闭弹窗
    document.querySelectorAll('.btn-cancel').forEach(button => {
        button.addEventListener('click', function() {
            closeModal();
        });
    });

    // 交易记录表单提交
    document.getElementById('transaction-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveTransaction();
    });
    
    // 打开筛选弹窗按钮
    document.getElementById('filter-btn').addEventListener('click', function() {
        showFilterModal();
    });
    
    // 关闭筛选弹窗
    document.getElementById('close-filter-modal').addEventListener('click', function() {
        document.getElementById('filter-modal').classList.add('hide');
    });
    
    // 筛选类型按钮点击
    document.querySelectorAll('.filter-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有按钮的active类
            document.querySelectorAll('.filter-type-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // 设置当前按钮为active
            this.classList.add('active');
            
            // 更新类别列表
            const selectedType = this.getAttribute('data-type');
            updateFilterCategoriesView(selectedType);
        });
    });
    
    // 应用筛选按钮
    document.getElementById('apply-filter-modal-btn').addEventListener('click', function() {
        applyFilters();
    });
    
    // 重置筛选按钮
    document.getElementById('reset-filter-modal-btn').addEventListener('click', function() {
        resetFilterModal();
    });
    
    // 设置今天的日期为默认日期
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    document.getElementById('transaction-date').value = formattedDate;
    
    // 导出按钮事件监听
    document.getElementById('export-btn').addEventListener('click', function() {
        exportTransactions();
    });

    // 在DOMContentLoaded事件监听器中添加
    // 大约在第87行附近，其他事件监听之后
    document.getElementById('alert-confirm').addEventListener('click', function() {
        document.getElementById('custom-alert').classList.add('hide');
    });

    // 类型选择框事件监听
    document.getElementById('filter-type').addEventListener('change', function() {
        const selectedType = this.value;
        updateCategoriesByType(selectedType);
    });

    document.getElementById('reset-filter-btn').addEventListener('click', function() {
        resetFilters();
    });
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
        
        // 初始化图表功能
        if (window.chartUtils) {
            window.chartUtils.initCharts();
            // 延迟一点时间，确保交易数据已加载
            setTimeout(() => {
                window.chartUtils.updateAllCharts();
            }, 500);
        }
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
            showAlert('注册成功，请登录');
            
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
 * 根据所选类型更新类别选择框
 * 
 * @input string type 交易类型(income/expense/all)
 * @process 根据类型过滤类别选项
 * @output 更新类别选择框
 */
function updateCategoriesByType(type) {
    const categorySelect = document.getElementById('filter-category');
    // 清空现有选项
    categorySelect.innerHTML = '<option value="all">全部</option>';
    
    // 显示调试信息
    console.log('当前选择的类型:', type);
    console.log('所有类别:', categories);
    
    // 如果选择了"全部"，显示所有类别
    if (type === 'all') {
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            option.dataset.type = category.type; // 添加数据属性方便调试
            categorySelect.appendChild(option);
        });
        return;
    }
    
    // 过滤类别
    // 确保使用正确的类型值进行比较
    const filteredCategories = categories.filter(category => {
        return category.type === type;
    });
    
    console.log('过滤后的类别:', filteredCategories);
    
    // 添加过滤后的类别选项
    filteredCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        option.dataset.type = category.type; // 添加数据属性方便调试
        categorySelect.appendChild(option);
    });
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
        
        console.log('API返回的原始类别数据:', data);
        
        // 确保类别数据格式正确
        categories = data.map(category => {
            // 如果类别数据缺少type字段，尝试根据name判断
            if (!category.type) {
                // 这里根据类别名称判断类型，你可能需要根据实际情况调整
                if (category.name.includes('收入') || 
                    category.name === '工资' || 
                    category.name === '奖金' || 
                    category.name === '投资收益' || 
                    category.name === '其他收入') {
                    category.type = 'income';
                } else {
                    category.type = 'expense';
                }
                console.log(`为类别 ${category.name} 设置类型: ${category.type}`);
            }
            return category;
        });
        
        // 初始时根据当前选择的类型过滤类别
        const currentType = document.getElementById('filter-type').value;
        updateCategoriesByType(currentType);
        
        console.log('处理后的类别数据:', categories);
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
        showAlert('请选择开始和结束日期');
        return;
    }
    
    if (startDate > endDate) {
        showAlert('开始日期不能大于结束日期');
        return;
    }
    
    loadTransactions(startDate, endDate);
}

/**
 * 加载交易记录
 * 
 * @input string startDate 开始日期
 * @input string endDate 结束日期
 * @process 从API获取交易记录
 * @output 显示交易记录
 */
function loadTransactions(startDate, endDate) {
    const transactionsUrl = `${API_URL}/transaction/list.php?user_id=${currentUser.id}&start_date=${startDate}&end_date=${endDate}`;
    
    fetch(transactionsUrl)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('加载交易记录失败:', data.error);
            return;
        }
        
        transactions = data;
        displayTransactions(transactions);
        
        // 更新统计数据和图表
        loadStats(startDate, endDate);
        if (window.chartUtils) {
            window.chartUtils.updateAllCharts();
        }
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
 * 显示交易记录
 * 
 * @input array transactions 交易记录数组
 * @process 创建交易记录DOM元素并插入到页面
 * @output 显示交易记录
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
                <div class="category-date">${formatDateForDisplay(transaction.transaction_date)}</div>
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
    modalTitle.textContent = transaction ? '编辑交易记录' : (type === 'income' ? '添加收入记录' : '添加支出记录');
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
 * 显示提示信息
 * 
 * @input string message 提示信息
 * @input string type 提示类型 (success/error)
 * @process 显示提示弹窗并自动消失
 * @output 无
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-alert');
    const messageEl = toast.querySelector('.toast-message');
    const iconEl = toast.querySelector('.toast-icon i');
    
    // 设置消息
    messageEl.textContent = message;
    
    // 设置图标和样式
    toast.className = `toast-alert ${type}`;
    iconEl.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-times-circle';
    
    // 显示提示
    toast.classList.add('show');
    
    // 2秒后自动消失
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
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
        showAlert('请输入有效金额');
        return;
    }
    
    if (!data.category_id) {
        showAlert('请选择类别');
        return;
    }
    
    if (!data.transaction_date) {
        showAlert('请选择日期');
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
            showToast(result.error, 'error');
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
        
        // 显示成功提示
        showToast(transactionId ? '记录更新成功' : '记录添加成功', 'success');
    })
    .catch(error => {
        showToast(error.message, 'error');
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
 * 显示确认弹窗
 * 
 * @input function onConfirm 确认回调函数
 * @process 显示确认弹窗并绑定事件
 * @output 用户确认或取消的结果
 */
function showConfirmDialog(onConfirm) {
    const dialog = document.getElementById('confirm-dialog');
    const confirmBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');
    
    dialog.classList.remove('hide');
    
    // 确认按钮事件
    const handleConfirm = () => {
        dialog.classList.add('hide');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        onConfirm();
    };
    
    // 取消按钮事件
    const handleCancel = () => {
        dialog.classList.add('hide');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
}

/**
 * 删除交易记录
 * 
 * @input int id 交易记录ID
 * @process 确认后发送删除请求
 * @output 成功刷新数据
 */
function deleteTransaction(id) {
    showConfirmDialog(() => {
        fetch(`${API_URL}/transaction/delete.php?user_id=${currentUser.id}&id=${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                showToast(result.error, 'error');
                return;
            }
            
            // 刷新数据
            const dateRange = document.getElementById('date-range').value;
            if (dateRange === 'custom') {
                loadTransactionsByCustomDateRange();
            } else {
                loadTransactionsByDateRange(dateRange);
            }
            
            // 显示成功提示
            showToast('记录删除成功', 'success');
        })
        .catch(error => {
            showToast(error.message, 'error');
        });
    });
}

/**
 * 显示筛选弹窗
 * 
 * @input 无
 * @process 显示筛选弹窗并初始化选项
 * @output 无
 */
function showFilterModal() {
    const modal = document.getElementById('filter-modal');
    
    // 初始化类型选择（默认全部）
    document.querySelectorAll('.filter-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.filter-type-btn[data-type="all"]').classList.add('active');
    
    // 初始化类别选择
    updateFilterCategoriesView('all');
    
    // 显示弹窗
    modal.classList.remove('hide');
}

/**
 * 更新筛选弹窗中的类别显示
 * 
 * @input string type 交易类型(income/expense/all)
 * @process 根据类型更新可选类别
 * @output 无
 */
function updateFilterCategoriesView(type) {
    const categoriesContainer = document.getElementById('filter-categories-container');
    categoriesContainer.innerHTML = '';
    
    // 添加"全部"选项
    const allCategoryLabel = document.createElement('label');
    allCategoryLabel.className = 'category-checkbox all selected';
    allCategoryLabel.innerHTML = `
        <input type="checkbox" value="all" checked>
        <span>全部</span>
    `;
    
    // 确保事件正确绑定
    allCategoryLabel.addEventListener('click', function(e) {
        toggleCategorySelection(e);
    });
    
    categoriesContainer.appendChild(allCategoryLabel);
    
    // 过滤并添加类别选项
    let filteredCategories = categories;
    if (type !== 'all') {
        filteredCategories = categories.filter(category => category.type === type);
    }
    
    filteredCategories.forEach(category => {
        const label = document.createElement('label');
        label.className = `category-checkbox ${category.type}`;
        label.innerHTML = `
            <input type="checkbox" value="${category.id}">
            <span>${category.name}</span>
        `;
        
        // 确保事件正确绑定
        label.addEventListener('click', function(e) {
            toggleCategorySelection(e);
        });
        
        categoriesContainer.appendChild(label);
    });
}

/**
 * 切换类别选择状态
 * 
 * @input Event event 点击事件
 * @process 切换类别的选中状态
 * @output 无
 */
function toggleCategorySelection(event) {
    event.preventDefault(); // 防止默认行为
    
    const checkbox = event.currentTarget;
    const input = checkbox.querySelector('input');
    const isAll = input.value === 'all';
    
    // 如果点击的是"全部"选项
    if (isAll) {
        // 取消所有其他选项
        document.querySelectorAll('.category-checkbox').forEach(cb => {
            cb.classList.remove('selected');
            cb.querySelector('input').checked = false;
        });
        
        // 选中"全部"选项
        checkbox.classList.add('selected');
        input.checked = true;
    } else {
        // 取消"全部"选项
        const allCheckbox = document.querySelector('.category-checkbox.all');
        allCheckbox.classList.remove('selected');
        allCheckbox.querySelector('input').checked = false;
        
        // 切换当前选项的选中状态
        const isSelected = checkbox.classList.contains('selected');
        if (isSelected) {
            checkbox.classList.remove('selected');
            input.checked = false;
        } else {
            checkbox.classList.add('selected');
            input.checked = true;
        }
        
        // 如果没有选中项，则自动选中"全部"
        const hasSelected = document.querySelector('.category-checkbox.selected');
        if (!hasSelected) {
            allCheckbox.classList.add('selected');
            allCheckbox.querySelector('input').checked = true;
        }
    }
}

/**
 * 应用筛选条件
 * 
 * @input 无
 * @process 获取选中的筛选条件并筛选数据
 * @output 显示筛选后的交易记录
 */
function applyFilters() {
    // 获取选中的类型
    const selectedType = document.querySelector('.filter-type-btn.active').getAttribute('data-type');
    
    // 获取选中的类别
    const selectedCategories = [];
    document.querySelectorAll('.category-checkbox.selected input').forEach(input => {
        selectedCategories.push(input.value);
    });
    
    // 筛选记录
    let filtered = [...transactions];
    
    // 按类型筛选
    if (selectedType !== 'all') {
        filtered = filtered.filter(t => t.type === selectedType);
    }
    
    // 按类别筛选
    if (!selectedCategories.includes('all')) {
        filtered = filtered.filter(t => selectedCategories.includes(t.category_id.toString()));
    }
    
    // 显示筛选结果
    displayTransactions(filtered);
    
    // 关闭弹窗
    document.getElementById('filter-modal').classList.add('hide');
    
    // 显示筛选提示
    showFilterIndicator(selectedType, selectedCategories);
}

/**
 * 显示筛选指示器
 * 
 * @input string type 选中的类型
 * @input array categories 选中的类别ID数组
 * @process 更新界面上的筛选指示
 * @output 无
 */
function showFilterIndicator(type, categoryIds) {
    const filterBtn = document.getElementById('filter-btn');
    
    // 如果是全部类型且全部类别，则不显示指示器
    if (type === 'all' && categoryIds.includes('all')) {
        filterBtn.textContent = '筛选';
        filterBtn.classList.remove('active');
    } else {
        filterBtn.textContent = '已筛选';
        filterBtn.classList.add('active');
    }
}

/**
 * 重置筛选弹窗
 * 
 * @input 无
 * @process 重置筛选选项到默认状态并重置筛选结果
 * @output 无
 */
function resetFilterModal() {
    try {
        // 重置类型选择
        document.querySelectorAll('.filter-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.filter-type-btn[data-type="all"]').classList.add('active');
        
        // 重置类别选择
        updateFilterCategoriesView('all');
        
        // 关闭弹窗
        document.getElementById('filter-modal').classList.add('hide');
        
        // 重置筛选指示器
        const filterBtn = document.getElementById('filter-btn');
        filterBtn.textContent = '筛选';
        filterBtn.classList.remove('active');
        
        // 重新加载数据
        const dateRange = document.getElementById('date-range').value;
        if (dateRange === 'custom') {
            loadTransactionsByCustomDateRange();
        } else {
            loadTransactionsByDateRange(dateRange);
        }
        
        // 显示重置成功提示
        showToast('筛选条件已重置', 'success');
    } catch (error) {
        console.error('重置筛选时发生错误:', error);
        showToast('重置失败: ' + error.message, 'error');
    }
}
function applyFilterModal() {
    showToast('筛选条件已应用', 'success');
}
/**
 * 重置所有筛选条件
 * 
 * @input 无
 * @process 重置筛选条件并显示所有记录
 * @output 无
 */
function resetFilters() {
    try {
        console.log('重置所有筛选条件被调用');
        
        // 重置筛选指示器
        const filterBtn = document.getElementById('filter-btn');
        filterBtn.textContent = '筛选';
        filterBtn.classList.remove('active');
        
        // 重新加载数据（显示所有记录）
        const dateRange = document.getElementById('date-range').value;
        if (dateRange === 'custom') {
            loadTransactionsByCustomDateRange();
        } else {
            loadTransactionsByDateRange(dateRange);
        }
        
        showToast('筛选条件已重置', 'success');
    } catch (error) {
        console.error('重置筛选条件时发生错误:', error);
        showToast('重置失败: ' + error.message, 'error');
    }
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

/**
 * 导出交易记录
 * 
 * @input 无
 * @process 获取当前筛选条件并导出数据
 * @output 下载CSV文件
 */
function exportTransactions() {
    if (!currentUser) return;
    
    // 获取当前日期范围
    const dateRange = document.getElementById('date-range').value;
    let startDate, endDate;
    
    if (dateRange === 'custom') {
        startDate = document.getElementById('start-date').value;
        endDate = document.getElementById('end-date').value;
        
        if (!startDate || !endDate) {
            showAlert('请选择开始和结束日期');
            return;
        }
    } else {
        const dates = getDateRangeFromType(dateRange);
        startDate = dates.startDate;
        endDate = dates.endDate;
    }
    
    // 获取筛选条件
    const type = document.getElementById('filter-type').value;
    const categoryId = document.getElementById('filter-category').value;
    
    // 构建导出URL
    let exportUrl = `${API_URL}/transaction/export.php?user_id=${currentUser.id}&start_date=${startDate}&end_date=${endDate}`;
    
    if (type !== 'all') {
        exportUrl += `&type=${type}`;
    }
    
    if (categoryId !== 'all') {
        exportUrl += `&category_id=${categoryId}`;
    }
    
    // 在新窗口中打开导出URL以触发下载
    window.open(exportUrl, '_blank');
}

/**
 * 显示自定义提示弹窗
 * 
 * @input string message 提示信息
 * @input string title 可选，标题
 * @process 显示居中弹窗
 * @output 无
 */
function showAlert(message, title = '提示') {
    // 设置弹窗内容
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = message;
    
    // 显示弹窗
    const alertModal = document.getElementById('custom-alert');
    alertModal.classList.remove('hide');
    
    // 添加确定按钮事件监听
    const confirmBtn = document.getElementById('alert-confirm');
    const handleConfirm = function() {
        alertModal.classList.add('hide');
        confirmBtn.removeEventListener('click', handleConfirm);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
}

/**
 * 获取日期范围
 * 
 * @input string type 日期范围类型(month/quarter/year)
 * @process 根据类型计算日期范围
 * @output object 包含开始日期和结束日期的对象
 */
function getDateRangeFromType(type) {
    const today = new Date();
    let startDate, endDate;
    
    switch(type) {
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
            // 默认本月
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    
    return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
    };
} 