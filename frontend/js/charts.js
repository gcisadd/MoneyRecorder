/**
 * 记账本图表功能
 * 
 * 实现各类统计图表的展示
 */

// 图表实例
let typeChart = null;
let incomeCategoryChart = null;
let expenseCategoryChart = null;
let trendChart = null;

// 图表颜色
const chartColors = {
    income: '#2ecc71',
    expense: '#e74c3c',
    backgroundColor: [
        '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
        '#1abc9c', '#d35400', '#34495e', '#16a085', '#27ae60',
        '#c0392b', '#7f8c8d', '#f1c40f', '#8e44ad', '#2980b9'
    ]
};

/**
 * 初始化图表功能
 * 
 * @input 无
 * @process 添加事件监听，切换图表类型
 * @output 无
 */
function initCharts() {
    // 切换图表类型
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // 切换激活标签
            document.querySelectorAll('.chart-tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // 切换图表面板
            const chartType = this.getAttribute('data-chart');
            document.querySelectorAll('.chart-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            document.getElementById(`${chartType}-chart-panel`).classList.add('active');
        });
    });
    
    // 更新日期范围时重新加载图表数据
    document.getElementById('date-range').addEventListener('change', updateAllCharts);
    document.getElementById('apply-date').addEventListener('click', updateAllCharts);
}

/**
 * 更新所有图表
 * 
 * @input 无
 * @process 根据当前日期范围获取数据并更新所有图表
 * @output 无
 */
function updateAllCharts() {
    // 获取当前日期范围
    const dateRange = document.getElementById('date-range').value;
    let startDate, endDate;
    
    if (dateRange === 'custom') {
        startDate = document.getElementById('start-date').value;
        endDate = document.getElementById('end-date').value;
        
        if (!startDate || !endDate) {
            return;
        }
    } else {
        const dates = getDateRangeFromType(dateRange);
        startDate = dates.startDate;
        endDate = dates.endDate;
    }
    
    // 加载各类图表数据
    loadTypeChartData(startDate, endDate);
    loadCategoryChartData(startDate, endDate);
    loadTrendChartData(startDate, endDate);
}

/**
 * 根据类型获取日期范围
 * 
 * @input string type 日期范围类型
 * @process 计算日期范围
 * @output 开始和结束日期
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
            return {
                startDate: null,
                endDate: null
            };
    }
    
    return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
    };
}

/**
 * 加载收支类型图表数据
 * 
 * @input string startDate 开始日期
 * @input string endDate 结束日期
 * @process 获取数据并渲染收支类型饼图
 * @output 无
 */
function loadTypeChartData(startDate, endDate) {
    if (!currentUser) return;
    
    const url = `${API_URL}/transaction/stats.php?user_id=${currentUser.id}&start_date=${startDate}&end_date=${endDate}`;
    
    fetch(url)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('加载统计数据失败:', data.error);
            return;
        }
        
        renderTypeChart(data);
    })
    .catch(error => {
        console.error('请求统计数据失败:', error);
    });
}

/**
 * 渲染收支类型饼图
 * 
 * @input object data 统计数据
 * @process 创建或更新饼图
 * @output 无
 */
function renderTypeChart(data) {
    const ctx = document.getElementById('type-chart').getContext('2d');
    
    // 准备数据
    const chartData = {
        labels: ['收入', '支出'],  // 修改标签名称
        datasets: [{
            data: [data.income, data.expense],
            backgroundColor: [chartColors.income, chartColors.expense],
            hoverOffset: 4
        }]
    };
    
    // 配置选项
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: {
                        size: 14
                    },
                    generateLabels: function(chart) {
                        const data = chart.data;
                        const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                        return data.labels.map((label, i) => {
                            const value = data.datasets[0].data[i];
                            const percentage = ((value / total) * 100).toFixed(1);
                            return {
                                text: `${label}: ${percentage}%`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                hidden: isNaN(data.datasets[0].data[i]),
                                index: i
                            };
                        });
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${value}元 (${percentage}%)`;
                    }
                }
            }
        }
    };
    
    // 创建或更新图表
    if (typeChart) {
        typeChart.data = chartData;
        typeChart.options = options;  // 更新配置
        typeChart.update();
    } else {
        typeChart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: options
        });
    }
}

/**
 * 加载类别分布图表数据
 * 
 * @input string startDate 开始日期
 * @input string endDate 结束日期
 * @process 获取数据并渲染类别分布饼图
 * @output 无
 */
function loadCategoryChartData(startDate, endDate) {
    if (!currentUser) return;
    
    const url = `${API_URL}/transaction/category_stats.php?user_id=${currentUser.id}&start_date=${startDate}&end_date=${endDate}`;
    
    fetch(url)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('加载类别统计数据失败:', data.error);
            return;
        }
        
        renderCategoryCharts(data);
    })
    .catch(error => {
        console.error('请求类别统计数据失败:', error);
    });
}

/**
 * 渲染类别分布饼图
 * 
 * @input object data 类别统计数据
 * @process 创建或更新收入和支出类别饼图
 * @output 无
 */
function renderCategoryCharts(data) {
    // 渲染收入类别图表
    renderSingleCategoryChart('income', data.income, 'income-category-chart');
    
    // 渲染支出类别图表
    renderSingleCategoryChart('expense', data.expense, 'expense-category-chart');
}

/**
 * 渲染单个类别饼图
 * 
 * @input string type 类型（收入/支出）
 * @input array categoryData 类别数据
 * @input string canvasId Canvas元素ID
 * @process 创建或更新饼图
 * @output 无
 */
function renderSingleCategoryChart(type, categoryData, canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // 准备数据
    const labels = categoryData.map(item => item.category_name);
    const values = categoryData.map(item => parseFloat(item.total)); // 确保转换为数字
    
    // 计算总额
    const total = values.reduce((sum, value) => sum + value, 0);
    
    // 使用背景色数组，确保有足够的颜色
    const backgroundColors = [];
    for (let i = 0; i < categoryData.length; i++) {
        backgroundColors.push(chartColors.backgroundColor[i % chartColors.backgroundColor.length]);
    }
    
    const chartData = {
        labels: labels,
        datasets: [{
            data: values,
            backgroundColor: backgroundColors,
            hoverOffset: 4
        }]
    };
    
    // 配置选项
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    boxWidth: 15,
                    font: {
                        size: 14
                    },
                    // 在图例中显示百分比
                    generateLabels: function(chart) {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            return data.labels.map((label, i) => {
                                const value = data.datasets[0].data[i];
                                const percentage = ((value / total) * 100).toFixed(1);
                                return {
                                    text: `${label}: ${percentage}%`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: isNaN(data.datasets[0].data[i]),
                                    index: i,
                                    strokeStyle: '#fff',
                                    lineWidth: 2
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.raw;
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ¥${value.toFixed(2)} (${percentage}%)`;
                    }
                }
            }
        }
    };
    
    // 创建或更新图表
    const chartInstance = type === 'income' ? incomeCategoryChart : expenseCategoryChart;
    
    if (chartInstance) {
        chartInstance.data = chartData;
        chartInstance.options = options;
        chartInstance.update();
    } else {
        const newChart = new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: options
        });
        
        if (type === 'income') {
            incomeCategoryChart = newChart;
        } else {
            expenseCategoryChart = newChart;
        }
    }
}

/**
 * 加载收支趋势图表数据
 * 
 * @input string startDate 开始日期
 * @input string endDate 结束日期
 * @process 获取数据并渲染趋势线图
 * @output 无
 */
function loadTrendChartData(startDate, endDate) {
    if (!currentUser) return;
    
    const url = `${API_URL}/transaction/trend_stats.php?user_id=${currentUser.id}&start_date=${startDate}&end_date=${endDate}`;
    
    fetch(url)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('加载趋势统计数据失败:', data.error);
            return;
        }
        
        renderTrendChart(data);
    })
    .catch(error => {
        console.error('请求趋势统计数据失败:', error);
    });
}

/**
 * 渲染收支趋势线图
 * 
 * @input object data 趋势统计数据
 * @process 创建或更新趋势线图
 * @output 无
 */
function renderTrendChart(data) {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    
    // 准备数据
    const chartData = {
        labels: data.dates,
        datasets: [
            {
                label: '收入',
                data: data.income,
                borderColor: chartColors.income,
                backgroundColor: `${chartColors.income}20`,
                fill: true,
                tension: 0.4,
            },
            {
                label: '支出',
                data: data.expense,
                borderColor: chartColors.expense,
                backgroundColor: `${chartColors.expense}20`,
                fill: true,
                tension: 0.4,
            }
        ]
    };
    
    // 配置选项
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            },
            title: {
                display: true,
                font: {
                    size: 18
                }
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: '日期',
                    font: {
                        size: 18
                    }
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: '金额',
                    font: {
                        size: 18
                    }
                }
            }
        }
    };
    
    // 创建或更新图表
    if (trendChart) {
        trendChart.data = chartData;
        trendChart.update();
    } else {
        trendChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: options
        });
    }
}

// 将函数导出，供主应用使用
window.chartUtils = {
    initCharts,
    updateAllCharts
}; 