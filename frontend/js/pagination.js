/**
 * 翻页功能
 * 
 * 处理交易记录的分页显示
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化翻页功能');
    
    // 确保翻页按钮的事件绑定
    initPaginationEvents();
});

/**
 * 初始化翻页事件
 * 
 * @input 无
 * @process 为翻页按钮添加点击事件
 * @output 无
 */
function initPaginationEvents() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    
    if (!prevButton || !nextButton) {
        console.error('翻页按钮未找到');
        return;
    }
    
    console.log('找到翻页按钮，绑定事件');
    
    // 绑定上一页事件
    prevButton.onclick = function(event) {
        event.preventDefault();
        console.log('点击了上一页按钮');
        if (currentPage > 1) {
            currentPage--;
            displayTransactions(transactions);
            console.log('页码减少到', currentPage);
        }
    };
    
    // 绑定下一页事件
    nextButton.onclick = function(event) {
        event.preventDefault();
        console.log('点击了下一页按钮');
        const totalPages = Math.ceil(transactions.length / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayTransactions(transactions);
            console.log('页码增加到', currentPage);
        }
    };
    
    console.log('翻页事件绑定完成');
} 