/**
 * Amazon POM Manager - 待办看板模块
 */

/**
 * 显示待办看板弹窗
 */
function showTodoBoardModal() {
    const todoData = DataManager.getTodoBoardData();
    
    // 计算总任务数
    const totalPending = todoData.pending.reduce((sum, p) => sum + p.tasks.length, 0);
    const totalDone = todoData.done.reduce((sum, p) => sum + p.tasks.length, 0);
    
    UI.showModal('待办看板', `
        <div class="todo-board">
            <div class="stats-bar" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <span class="stat-value">${totalPending}</span>
                    <span class="stat-label">待办任务</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${totalDone}</span>
                    <span class="stat-label">今日已完成</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${todoData.pending.length}</span>
                    <span class="stat-label">待办商品</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${todoData.done.length}</span>
                    <span class="stat-label">已完成商品</span>
                </div>
            </div>
            
            ${todoData.pending.length > 0 ? `
                <div class="todo-section">
                    <h4>待办任务 (${totalPending}个任务，${todoData.pending.length}个商品)</h4>
                    ${todoData.pending.map(product => renderProductTodoRow(product)).join('')}
                </div>
            ` : ''}
            
            ${todoData.done.length > 0 ? `
                <div class="todo-section">
                    <h4>今日已完成 (${totalDone}个任务，${todoData.done.length}个商品)</h4>
                    ${todoData.done.map(product => renderProductTodoRow(product)).join('')}
                </div>
            ` : ''}
            
            ${todoData.pending.length === 0 && todoData.done.length === 0 ? `
                <div class="empty-state">
                    <p>🎉 所有收藏商品的任务已完成并锁定！</p>
                </div>
            ` : ''}
        </div>
        <div class="form-actions">
            <button type="button" class="btn cancel" onclick="closeModal()">关闭</button>
        </div>
    `, 'large');
}

/**
 * 渲染商品待办行（一行显示商品信息和所有待办事项）
 * 支持本地图片读取
 */
function renderProductTodoRow(product) {
    // 获取图片路径：优先本地images文件夹
    const imagePath = getTodoProductImagePath(product);
    
    return `
        <div class="todo-product-row" data-product-id="${product.productId}">
            <div class="todo-product-info">
                <div class="todo-product-image">
                    ${imagePath ? 
                        `<img src="${imagePath}" alt="${product.productName}" onerror="handleTodoImageError(this, '${product.productName}')">` : 
                        '📷'
                    }
                </div>
                <span class="todo-product-name" title="${product.productName}">${product.productName}</span>
            </div>
            <div class="todo-product-tasks">
                ${product.tasks.map(task => renderTaskItem(product.productId, task)).join('')}
            </div>
            <button class="action-btn edit" onclick="handleViewProduct('${product.productId}')">查看</button>
        </div>
    `;
}

/**
 * 获取待办看板商品图片路径
 * 优先从本地images文件夹读取
 */
function getTodoProductImagePath(product) {
    // 如果存在imageUrl，尝试解析图片名称
    if (product.imageUrl) {
        // 从URL中提取图片名称（支持完整URL或仅文件名）
        const imageName = extractTodoImageName(product.imageUrl);
        if (imageName) {
            // 优先使用本地images文件夹
            return `images/${imageName}`;
        }
    }
    
    // 如果没有imageUrl，返回null
    return null;
}

/**
 * 从URL或路径中提取图片名称
 * 支持带扩展名或不带扩展名的图片名称
 */
function extractTodoImageName(imageUrl) {
    if (!imageUrl) return null;
    
    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl) return null;
    
    // 如果是完整URL或路径，提取最后一部分
    let fileName = trimmedUrl;
    if (trimmedUrl.includes('/') || trimmedUrl.includes('\\')) {
        const parts = trimmedUrl.split(/[\\/]/);
        fileName = parts[parts.length - 1];
    }
    
    // 如果文件名不为空，直接返回（支持带扩展名或不带扩展名）
    if (fileName) {
        return fileName;
    }
    
    return null;
}

/**
 * 处理待办看板图片加载错误，尝试添加扩展名
 */
function handleTodoImageError(imgElement, productName) {
    // 如果已经尝试过添加扩展名，显示占位符
    if (imgElement.dataset.retry) {
        imgElement.parentElement.innerHTML = '📷';
        return;
    }
    
    // 标记已重试
    imgElement.dataset.retry = 'true';
    
    // 获取当前src
    const currentSrc = imgElement.src;
    
    // 如果原路径没有扩展名，尝试添加 .jpg
    if (!currentSrc.includes('.')) {
        imgElement.src = currentSrc + '.jpg';
    } else {
        // 有扩展名但还是失败了，显示占位符
        imgElement.parentElement.innerHTML = '📷';
    }
}

/**
 * 渲染单个待办事项
 */
function renderTaskItem(productId, task) {
    const statusClass = task.status;
    // 根据状态显示不同图标
    let icon;
    switch (statusClass) {
        case 'done':
            icon = '✓';
            break;
        case 'locked':
            icon = '■';
            break;
        case 'pending':
        default:
            icon = '○';
            break;
    }
    
    return `
        <div class="todo-task-item" 
             data-task="${task.taskName}"
             onclick="handleTodoItemClick('${productId}', '${task.taskName}', this)">
            <div class="task-status-item ${statusClass}" style="width: 24px; height: 24px; font-size: 12px;">
                ${icon}
            </div>
            <span class="todo-task-label">${task.taskLabel}</span>
        </div>
    `;
}

/**
 * 处理待办项点击
 */
async function handleTodoItemClick(productId, taskName, element) {
    const newStatus = await DataManager.cycleTaskStatus(productId, taskName);
    
    // 更新UI
    const statusItem = element.querySelector('.task-status-item');
    statusItem.className = `task-status-item ${newStatus}`;
    switch (newStatus) {
        case 'done':
            statusItem.textContent = '✓';
            break;
        case 'locked':
            statusItem.textContent = '■';
            break;
        default:
            statusItem.textContent = '○';
    }
    
    // 刷新看板
    setTimeout(() => {
        showTodoBoardModal();
        UI.renderProductTable();
        UI.updateStatistics();
    }, 300);
}

/**
 * 查看商品详情
 */
function handleViewProduct(productId) {
    closeModal();
    handleEditClick(productId);
}

/**
 * 显示快捷筛选弹窗
 */
function showQuickFilterModal(filterType) {
    let title = '';
    let filteredProducts = [];
    
    switch (filterType) {
        case 'pending-mainImage':
            title = '待处理首图的商品';
            filteredProducts = getProductsByTaskStatus('mainImage', 'pending');
            break;
        case 'pending-aPlusImage':
            title = '待处理A+图的商品';
            filteredProducts = getProductsByTaskStatus('aPlusImage', 'pending');
            break;
        case 'pending-autoAd':
            title = '待处理自动广告的商品';
            filteredProducts = getProductsByTaskStatus('autoAd', 'pending');
            break;
        case 'pending-manualAd':
            title = '待处理手动广告的商品';
            filteredProducts = getProductsByTaskStatus('manualAd', 'pending');
            break;
        case 'pending-coupon':
            title = '待处理优惠券的商品';
            filteredProducts = getProductsByTaskStatus('coupon', 'pending');
            break;
        case 'pending-underline':
            title = '待处理下划线的商品';
            filteredProducts = getProductsByTaskStatus('underline', 'pending');
            break;
        default:
            title = '筛选结果';
            filteredProducts = [];
    }
    
    if (filteredProducts.length === 0) {
        UI.showModal(title, `
            <div class="empty-state">
                <p>暂无符合条件的商品</p>
            </div>
            <div class="form-actions">
                <button type="button" class="btn cancel" onclick="closeModal()">关闭</button>
            </div>
        `);
        return;
    }
    
    UI.showModal(title, `
        <div class="form-group">
            <p style="color: var(--text-muted); margin-bottom: 16px;">共找到 ${filteredProducts.length} 个商品</p>
            <div style="max-height: 400px; overflow-y: auto;">
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>类目</th>
                            <th>商品名称</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredProducts.map(product => `
                            <tr>
                                <td>${product.category}</td>
                                <td>${product.name}</td>
                                <td>
                                    <button class="action-btn edit" onclick="handleViewProduct('${product.id}')">查看</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn cancel" onclick="closeModal()">关闭</button>
        </div>
    `, 'large');
}

/**
 * 根据任务状态获取商品（只返回收藏夹商品）
 */
function getProductsByTaskStatus(taskName, status) {
    const today = DB.getTodayString();
    
    return DataManager.state.products.filter(product => {
        // 只筛选收藏夹商品
        if (!product.isFavorite) return false;
        
        const taskStatus = DataManager.getProductTaskStatus(product.id);
        const taskState = taskStatus[taskName];
        
        if (!taskState) return status === 'pending';
        
        // 如果是done状态，检查是否是今日完成的
        let effectiveStatus = taskState.status;
        if (taskState.status === 'done') {
            const lastUpdated = taskState.lastUpdated ? taskState.lastUpdated.split('T')[0] : null;
            if (lastUpdated !== today) {
                effectiveStatus = 'pending';
            }
        }
        
        return effectiveStatus === status;
    });
}

// 导出待办看板函数
window.TodoBoard = {
    show: showTodoBoardModal,
    handleItemClick: handleTodoItemClick,
    showQuickFilter: showQuickFilterModal
};
