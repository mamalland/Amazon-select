/**
 * Amazon POM Manager - 管理中心模块
 */

/**
 * 初始化管理中心事件
 */
function initAdminEvents() {
    // 打开管理中心
    document.getElementById('admin-center-btn').addEventListener('click', () => {
        UI.openAdminSidebar();
    });

    // 关闭管理中心
    document.querySelector('.close-sidebar').addEventListener('click', () => {
        UI.closeAdminSidebar();
    });

    // 点击遮罩关闭
    document.getElementById('sidebar-overlay').addEventListener('click', () => {
        UI.closeAdminSidebar();
    });

    // 添加分类
    document.getElementById('add-category-btn').addEventListener('click', () => {
        UI.showAddCategoryModal();
    });

    // 删除所有商品
    document.getElementById('delete-all-products-btn').addEventListener('click', () => {
        UI.handleDeleteAllProducts();
    });

    // 清空销量记录
    document.getElementById('clear-sales-btn').addEventListener('click', () => {
        UI.handleClearSales();
    });
}

// 导出管理函数
window.Admin = {
    init: initAdminEvents
};
