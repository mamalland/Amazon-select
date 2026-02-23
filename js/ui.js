/**
 * Amazon POM Manager - UI 渲染层
 * 处理界面渲染和交互
 */

// DOM 元素缓存
const DOM = {
    productTableBody: null,
    categoryNav: null,
    filterBtns: null,
    searchInput: null,
    statsElements: {},
    modal: null,
    modalBody: null,
    adminSidebar: null,
    sidebarOverlay: null
};

/**
 * 初始化 DOM 引用
 */
function initDOM() {
    DOM.productTableBody = document.getElementById('product-table-body');
    DOM.categoryNav = document.getElementById('category-nav-bar');
    DOM.filterBtns = document.querySelectorAll('.filter-btn');
    DOM.searchInput = document.getElementById('search-input');
    DOM.statsElements = {
        totalProducts: document.getElementById('stat-total-products'),
        favorite: document.getElementById('stat-favorite'),
        todaySales: document.getElementById('stat-today-sales'),
        totalSales: document.getElementById('stat-total-sales')
    };
    DOM.modal = document.getElementById('modal');
    DOM.modalBody = DOM.modal.querySelector('.modal-body');
    DOM.adminSidebar = document.getElementById('admin-sidebar');
    DOM.sidebarOverlay = document.getElementById('sidebar-overlay');
}

/**
 * 渲染商品表格
 */
function renderProductTable() {
    const products = DataManager.getFilteredProducts();
    
    // 判断是否显示运维和状态列（在收藏夹、待办中、已完成页面显示）
    const showTaskColumns = ['favorite', 'todo', 'done'].includes(DataManager.state.currentFilter);
    
    // 更新表头显示/隐藏
    const headerTasks = document.getElementById('header-tasks');
    const headerStatus = document.getElementById('header-status');
    if (headerTasks) headerTasks.style.display = showTaskColumns ? '' : 'none';
    if (headerStatus) headerStatus.style.display = showTaskColumns ? '' : 'none';
    
    if (products.length === 0) {
        const colSpan = showTaskColumns ? 13 : 11;
        DOM.productTableBody.innerHTML = `
            <tr>
                <td colspan="${colSpan}" class="empty-state">
                    暂无商品数据，点击"新增商品"添加第一个商品
                </td>
            </tr>
        `;
        return;
    }

    DOM.productTableBody.innerHTML = products.map(product => {
        const taskStatus = DataManager.getProductTaskStatus(product.id);
        const overallStatus = DataManager.getProductOverallStatus(product.id);
        const salesStats = DataManager.getProductSalesStats(product.id);
        
        // 构建商品链接（优先使用productUrl，否则根据ASIN构建亚马逊链接）
        const productUrl = product.productUrl || (product.asin ? `https://www.amazon.com/dp/${product.asin}` : null);
        
        // 只有收藏商品才显示运维和状态内容
        const taskCell = showTaskColumns ? `
            <td class="col-tasks">
                <div class="task-status-container">
                    ${renderTaskStatusItems(product.id, taskStatus)}
                </div>
            </td>
        ` : '<td class="col-tasks" style="display: none;"></td>';
        
        const statusCell = showTaskColumns ? `
            <td class="col-status">
                <span class="status-badge ${overallStatus.class}">${overallStatus.label}</span>
            </td>
        ` : '<td class="col-status" style="display: none;"></td>';
        
        return `
            <tr data-product-id="${product.id}">
                <td class="col-image product-image-cell">
                    ${renderProductImage(product, productUrl)}
                </td>
                <td class="col-favorite">
                    <button class="favorite-btn ${product.isFavorite ? 'favorited' : ''}" 
                            onclick="handleFavoriteClick('${product.id}', event)">
                        ${product.isFavorite ? '★' : '☆'}
                    </button>
                </td>
                <td class="col-category">${product.category}</td>
                <td class="col-subcategory">${product.subCategory || '-'}</td>
                <td class="col-name">
                    <a href="#" class="product-name-link" onclick="handleProductNameClick('${product.id}', event)">
                        ${product.name}
                    </a>
                </td>
                <td class="col-price">$${product.price.toFixed(2)}</td>
                <td class="col-sales">${product.monthlySales.toLocaleString()}</td>
                <td class="col-revenue">$${calculateRevenue(product).toLocaleString()}</td>
                <td class="col-profit-margin">${product.profitMargin !== null && product.profitMargin !== undefined ? Math.round(product.profitMargin < 1 ? product.profitMargin * 100 : product.profitMargin) + '%' : '-'}</td>
                <td class="col-launch-date">${product.launchDate ? product.launchDate.split(/[T ]/)[0] : '-'}</td>
                <td class="col-rating">${product.rating ? product.rating.toFixed(1) : '-'}</td>
                <td class="col-review-count">${product.reviewCount ? product.reviewCount.toLocaleString() : '-'}</td>
                <td class="col-children">${product.childCount}</td>
                <td class="col-dimensions">${renderDimensions(product)}</td>
                <td class="col-weight">${renderWeight(product)}</td>
                <td class="col-fba">${product.fbaFee ? '$' + product.fbaFee.toFixed(2) : '-'}</td>
                ${taskCell}
                ${statusCell}
                <td class="col-actions">
                    <div class="action-btns">
                        ${product.procurementUrl ? 
                            `<a href="${product.procurementUrl}" target="_blank" class="action-btn procurement">采购</a>` : ''
                        }
                        <button class="action-btn edit" onclick="handleEditClick('${product.id}')">编辑</button>
                        <button class="action-btn sales" onclick="handleSalesClick('${product.id}')">销量</button>
                        ${product.isArchived ? 
                            `<button class="action-btn" style="background-color: var(--status-done);" onclick="handleUnarchiveClick('${product.id}')">取消归档</button>` :
                            `<button class="action-btn" style="background-color: #95a5a6;" onclick="handleArchiveClick('${product.id}')">归档</button>`
                        }
                        <button class="action-btn delete" onclick="handleDeleteClick('${product.id}')">删除</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * 渲染商品图片
 * 优先从本地images文件夹读取，其次使用URL
 */
function renderProductImage(product, productUrl) {
    // 获取图片路径：优先本地images文件夹，其次使用URL
    const imageUrl = getProductImagePath(product);
    
    if (imageUrl) {
        // 生成图片ID用于错误处理
        const imgId = 'img_' + Math.random().toString(36).substr(2, 9);
        
        if (productUrl) {
            return `
                <a href="${productUrl}" target="_blank" class="product-image-link" title="点击打开商品链接">
                    <img id="${imgId}" src="${imageUrl}" alt="${product.name}" class="product-image" 
                         onerror="handleImageError('${imgId}', '${imageUrl}', '${product.name}', this)">
                </a>
            `;
        } else {
            return `
                <div class="product-image-link" style="cursor: default;">
                    <img id="${imgId}" src="${imageUrl}" alt="${product.name}" class="product-image" 
                         onerror="handleImageError('${imgId}', '${imageUrl}', '${product.name}', this)">
                </div>
            `;
        }
    } else {
        // 没有图片时显示占位符
        if (productUrl) {
            return `
                <a href="${productUrl}" target="_blank" class="product-image-placeholder" title="点击打开商品链接">
                    📷
                </a>
            `;
        } else {
            return `<div class="product-image-placeholder">📷</div>`;
        }
    }
}

/**
 * 处理图片加载错误，尝试多种扩展名
 */
function handleImageError(imgId, originalSrc, productName, imgElement) {
    // 获取已尝试的扩展名列表
    let triedExtensions = imgElement.dataset.triedExtensions ? imgElement.dataset.triedExtensions.split(',') : [];
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    
    // 如果原路径没有扩展名，按顺序尝试各种扩展名
    if (!originalSrc.includes('.')) {
        // 找到下一个未尝试的扩展名
        for (let ext of extensions) {
            if (!triedExtensions.includes(ext)) {
                triedExtensions.push(ext);
                imgElement.dataset.triedExtensions = triedExtensions.join(',');
                imgElement.src = originalSrc + ext;
                return;
            }
        }
    } else {
        // 有扩展名但还是失败了，尝试替换为其他扩展名
        const currentExt = originalSrc.substring(originalSrc.lastIndexOf('.')).toLowerCase();
        const basePath = originalSrc.substring(0, originalSrc.lastIndexOf('.'));
        
        for (let ext of extensions) {
            if (ext !== currentExt && !triedExtensions.includes(ext)) {
                triedExtensions.push(ext);
                imgElement.dataset.triedExtensions = triedExtensions.join(',');
                imgElement.src = basePath + ext;
                return;
            }
        }
    }
    
    // 所有扩展名都尝试过了，显示占位符
    imgElement.parentElement.innerHTML = '<div class="product-image-placeholder">📷</div>';
}

/**
 * 获取商品图片路径
 * 优先从本地images文件夹读取，其次使用URL
 */
function getProductImagePath(product) {
    // 如果存在imageUrl，尝试解析图片名称
    if (product.imageUrl) {
        // 从URL中提取图片名称（支持完整URL或仅文件名）
        const imageName = extractImageName(product.imageUrl);
        if (imageName) {
            // 优先使用本地images文件夹
            // 如果文件名没有扩展名，尝试添加常见扩展名
            if (!imageName.includes('.')) {
                // 尝试常见图片扩展名
                const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
                return `images/${imageName}`;
            }
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
function extractImageName(imageUrl) {
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
 * 渲染任务状态项
 */
function renderTaskStatusItems(productId, taskStatus) {
    const taskNames = DataManager.state.taskNames;
    const taskOrder = DataManager.state.taskOrder;
    const today = DB.getTodayString();
    
    // 将6个任务分成2行，每行3个
    const rows = [];
    for (let i = 0; i < taskOrder.length; i += 3) {
        rows.push(taskOrder.slice(i, i + 3));
    }
    
    return rows.map((row, rowIndex) => {
        const rowHtml = row.map(taskName => {
            const taskState = taskStatus[taskName] || { status: 'pending', lastUpdated: null };
            let statusClass = taskState.status;
            let icon = '';
            
            // 如果是done状态，检查是否是今日完成的
            if (taskState.status === 'done') {
                const lastUpdated = taskState.lastUpdated ? taskState.lastUpdated.split('T')[0] : null;
                // 只有当 lastUpdated 存在且不等于今天时，才重置为 pending
                if (lastUpdated && lastUpdated !== today) {
                    statusClass = 'pending'; // 隔日重置为待办显示
                }
                // 如果 lastUpdated 为 null，保持 done 状态（可能是首次设置）
            }
            
            // 设置图标
            switch (statusClass) {
                case 'done':
                    icon = '✓';
                    break;
                case 'locked':
                    icon = '■';
                    break;
                default:
                    icon = '○';
            }
            
            return `
                <div class="task-status-item-with-label" 
                     data-task="${taskName}"
                     data-product-id="${productId}"
                     onclick="handleTaskClick('${productId}', '${taskName}', this.querySelector('.task-status-item'), event)">
                    <div class="task-status-item ${statusClass}">${icon}</div>
                    <span class="task-status-label">${taskNames[taskName]}</span>
                </div>
            `;
        }).join('');
        
        return `<div class="task-status-row">${rowHtml}</div>`;
    }).join('');
}

/**
 * 计算销售额（价格 × 月销量）
 */
function calculateRevenue(product) {
    return product.price * product.monthlySales;
}

/**
 * 厘米转英寸
 */
function cmToInches(cm) {
    return (cm * 0.393701).toFixed(1);
}

/**
 * 克转磅
 */
function gramsToPounds(grams) {
    return (grams * 0.00220462).toFixed(2);
}

/**
 * 渲染包装尺寸（双单位显示）
 */
function renderDimensions(product) {
    if (!product.dimensions) {
        return '-';
    }
    
    const { length, width, height } = product.dimensions;
    if (!length || !width || !height) {
        return '-';
    }
    
    // 厘米显示（保留一位小数）
    const cmDisplay = `${length.toFixed(1)}x${width.toFixed(1)}x${height.toFixed(1)} cm`;
    // 英寸显示（保留一位小数）
    const inchesDisplay = `${cmToInches(length)}x${cmToInches(width)}x${cmToInches(height)} inches`;
    
    return `
        <div class="unit-display">
            <span class="unit-primary">${cmDisplay}</span>
            <span class="unit-secondary">${inchesDisplay}</span>
        </div>
    `;
}

/**
 * 渲染商品重量（双单位显示）
 */
function renderWeight(product) {
    if (!product.weightKg && !product.weightG) {
        return '-';
    }
    
    // 优先使用克，如果没有则使用千克转换
    const grams = product.weightG || (product.weightKg * 1000);
    const kg = grams / 1000;
    const pounds = gramsToPounds(grams);
    
    // 如果小于1kg，显示克；否则显示千克
    let metricDisplay;
    if (grams < 1000) {
        metricDisplay = `${grams}g`;
    } else {
        metricDisplay = `${kg.toFixed(2)}kg`;
    }
    
    return `
        <div class="unit-display">
            <span class="unit-primary">${metricDisplay}</span>
            <span class="unit-secondary">${pounds} lbs</span>
        </div>
    `;
}

/**
 * 获取状态标签
 */
function getStatusLabel(status) {
    switch (status) {
        case 'done': return '当日完成';
        case 'locked': return '长期锁定';
        default: return '待办';
    }
}

/**
 * 渲染分类导航
 * 动态显示有商品的类目（不包括归档商品），并显示商品数量
 */
function renderCategoryNav() {
    const currentCategory = DataManager.state.currentCategory;
    
    // 获取所有非归档商品的类目统计
    const categoryStats = getCategoryProductStats();
    
    // 检测是否为手机端
    const isMobile = window.innerWidth <= 768;
    
    let html = '';
    
    if (isMobile) {
        // 手机端布局：全部和分类按钮放在同一行，横向滚动
        html += '<div class="category-row category-row-scroll">';
        html += `<button class="category-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">全部 (${getTotalActiveProducts()})</button>`;
        
        // 其他分类按钮
        categoryStats.forEach(({ name, count }) => {
            html += `
                <button class="category-btn ${currentCategory === name ? 'active' : ''}" 
                        data-category="${name}">
                    ${name}
                </button>
            `;
        });
        html += '</div>';
    } else {
        // 桌面端布局：横向滚动
        html += `<button class="category-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">全部类目 (${getTotalActiveProducts()})</button>`;
        
        // 只显示有商品的类目
        categoryStats.forEach(({ name, count }) => {
            html += `
                <button class="category-btn ${currentCategory === name ? 'active' : ''}" 
                        data-category="${name}">
                    ${name} (${count})
                </button>
            `;
        });
    }
    
    DOM.categoryNav.innerHTML = html;
    
    // 重新绑定事件
    DOM.categoryNav.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            DataManager.state.currentCategory = category;
            renderCategoryNav();
            renderProductTable();
        });
    });
}

/**
 * 获取类目商品统计（不包括归档商品）
 */
function getCategoryProductStats() {
    const stats = {};
    
    // 统计每个类目的非归档商品数量
    DataManager.state.products.forEach(product => {
        if (!product.isArchived) {
            if (!stats[product.category]) {
                stats[product.category] = 0;
            }
            stats[product.category]++;
        }
    });
    
    // 转换为数组并排序
    return Object.entries(stats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count); // 按商品数量降序
}

/**
 * 获取总商品数（不包括归档商品）
 */
function getTotalActiveProducts() {
    return DataManager.state.products.filter(p => !p.isArchived).length;
}

/**
 * 更新统计数据
 */
function updateStatistics() {
    const stats = DataManager.getStatistics();
    
    DOM.statsElements.totalProducts.textContent = stats.totalProducts;
    DOM.statsElements.favorite.textContent = stats.favoriteCount;
    DOM.statsElements.todaySales.textContent = stats.todaySales.toLocaleString();
    DOM.statsElements.totalSales.textContent = stats.totalSales.toLocaleString();
}

/**
 * 处理收藏点击
 */
async function handleFavoriteClick(productId, event) {
    event.stopPropagation();
    const isFavorite = await DataManager.toggleFavorite(productId);
    
    const btn = event.target;
    btn.classList.toggle('favorited', isFavorite);
    btn.textContent = isFavorite ? '★' : '☆';
    
    updateStatistics();
}

/**
 * 处理商品名称点击（编辑）
 */
function handleProductNameClick(productId, event) {
    event.preventDefault();
    handleEditClick(productId);
}

/**
 * 处理任务点击（三态循环）
 */
async function handleTaskClick(productId, taskName, element, event) {
    event.stopPropagation();
    
    console.log(`[handleTaskClick] Clicked: ${productId}.${taskName}`);
    
    try {
        const newStatus = await DataManager.cycleTaskStatus(productId, taskName);
        console.log(`[handleTaskClick] New status: ${newStatus}`);
        
        // 更新UI
        element.className = `task-status-item ${newStatus}`;
        switch (newStatus) {
            case 'done':
                element.textContent = '✓';
                break;
            case 'locked':
                element.textContent = '■';
                break;
            default:
                element.textContent = '○';
        }
        
        // 更新商品状态标签
        const row = element.closest('tr');
        const statusCell = row.querySelector('.col-status .status-badge');
        const overallStatus = DataManager.getProductOverallStatus(productId);
        statusCell.className = `status-badge ${overallStatus.class}`;
        statusCell.textContent = overallStatus.label;
        
        // 验证数据库更新
        const verifyStatus = await DB.tasks.get(productId);
        console.log(`[handleTaskClick] Verified DB status for ${productId}.${taskName}:`, verifyStatus[taskName]);
    } catch (error) {
        console.error(`[handleTaskClick] Error:`, error);
    }
}

/**
 * 处理编辑点击
 */
async function handleEditClick(productId) {
    const product = await DB.products.getById(productId);
    const taskStatus = DataManager.getProductTaskStatus(productId);
    
    showModal('编辑商品', `
        <form id="edit-product-form">
            <div class="form-row">
                <div class="form-group">
                    <label>ASIN (可选)</label>
                    <input type="text" name="asin" value="${product.asin || ''}" placeholder="如: B08N5WRWNW">
                </div>
                <div class="form-group">
                    <label>类目</label>
                    <select name="category" required>
                        ${renderCategoryOptions(product.category)}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>商品名称</label>
                <input type="text" name="name" value="${product.name}" required>
            </div>
            <div class="form-group">
                <label>商品图片URL (可选)</label>
                <input type="text" name="imageUrl" value="${product.imageUrl || ''}" placeholder="https://example.com/image.jpg 或图片名称如 01">
            </div>
            <div class="form-group">
                <label>商品链接 (可选，留空则根据ASIN自动生成)</label>
                <input type="url" name="productUrl" value="${product.productUrl || ''}" placeholder="https://www.amazon.com/dp/...">
            </div>
            <div class="form-group">
                <label>1688采购链接 (可选)</label>
                <input type="url" name="procurementUrl" value="${product.procurementUrl || ''}" placeholder="https://detail.1688.com/...">
            </div>
            <div class="form-group">
                <label>小类名称 (可选)</label>
                <input type="text" name="subCategory" value="${product.subCategory || ''}" placeholder="如：蓝牙耳机">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>价格 ($)</label>
                    <input type="number" name="price" step="0.01" value="${product.price}" required>
                </div>
                <div class="form-group">
                    <label>月销量</label>
                    <input type="number" name="monthlySales" value="${product.monthlySales}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>子体数量</label>
                    <input type="number" name="childCount" value="${product.childCount}" required>
                </div>
                <div class="form-group">
                    <label>FBA运费 ($)</label>
                    <input type="number" name="fbaFee" step="0.01" value="${product.fbaFee || ''}" placeholder="0.00">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>毛利率 (%)</label>
                    <input type="number" name="profitMargin" step="0.1" value="${product.profitMargin || ''}" placeholder="如: 35.5">
                </div>
                <div class="form-group">
                    <label>上架日期</label>
                    <input type="date" name="launchDate" value="${product.launchDate ? product.launchDate.split(/[T ]/)[0] : ''}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>评分 (1-5)</label>
                    <input type="number" name="rating" step="0.1" min="1" max="5" value="${product.rating || ''}" placeholder="如: 4.5">
                </div>
                <div class="form-group">
                    <label>评论数</label>
                    <input type="number" name="reviewCount" value="${product.reviewCount || ''}" placeholder="如: 128">
                </div>
            </div>
            <div class="form-group">
                <label>包装尺寸 (长×宽×高)</label>
                <div class="unit-toggle" style="margin-bottom: 8px;">
                    <label style="display: inline-flex; align-items: center; margin-right: 15px; cursor: pointer;">
                        <input type="radio" name="dimUnit" value="cm" checked onchange="toggleDimensionUnit('cm')" style="margin-right: 5px;">
                        <span>厘米 (cm)</span>
                    </label>
                    <label style="display: inline-flex; align-items: center; cursor: pointer;">
                        <input type="radio" name="dimUnit" value="inch" onchange="toggleDimensionUnit('inch')" style="margin-right: 5px;">
                        <span>英寸 (inch)</span>
                    </label>
                </div>
                <div class="form-row">
                    <input type="number" name="dimLength" id="dimLength" step="0.1" value="${product.dimensions?.length || ''}" placeholder="长" style="flex: 1;" onchange="convertDimension('length')">
                    <input type="number" name="dimWidth" id="dimWidth" step="0.1" value="${product.dimensions?.width || ''}" placeholder="宽" style="flex: 1;" onchange="convertDimension('width')">
                    <input type="number" name="dimHeight" id="dimHeight" step="0.1" value="${product.dimensions?.height || ''}" placeholder="高" style="flex: 1;" onchange="convertDimension('height')">
                </div>
                <div id="dim-conversion-hint" style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: none;">
                    将自动转换为厘米存储
                </div>
            </div>
            <div class="form-group">
                <label>商品重量 (单位：克g)</label>
                <input type="number" name="weightG" step="0.1" value="${product.weightG || ''}" placeholder="如: 150">
            </div>
            <div class="form-group">
                <label>运维待办项（点击切换状态）</label>
                <div class="task-editor">
                    ${renderTaskEditorItems(productId, taskStatus)}
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn cancel" onclick="closeModal()">取消</button>
                <button type="submit" class="btn submit">保存</button>
            </div>
        </form>
    `, 'large');
    
    // 绑定表单提交
    document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        product.asin = formData.get('asin');
        product.category = formData.get('category');
        product.name = formData.get('name');
        product.imageUrl = formData.get('imageUrl') || null;
        product.productUrl = formData.get('productUrl') || null;
        product.procurementUrl = formData.get('procurementUrl') || null;
        product.subCategory = formData.get('subCategory') || null;
        product.price = parseFloat(formData.get('price'));
        product.monthlySales = parseInt(formData.get('monthlySales'));
        product.childCount = parseInt(formData.get('childCount'));
        product.fbaFee = formData.get('fbaFee') ? parseFloat(formData.get('fbaFee')) : null;
        
        // 新属性
        const profitMargin = formData.get('profitMargin');
        product.profitMargin = profitMargin ? parseFloat(profitMargin) : null;
        product.launchDate = formData.get('launchDate') || null;
        const rating = formData.get('rating');
        product.rating = rating ? parseFloat(rating) : null;
        const reviewCount = formData.get('reviewCount');
        product.reviewCount = reviewCount ? parseInt(reviewCount) : null;
        
        // 包装尺寸
        const dimLength = formData.get('dimLength');
        const dimWidth = formData.get('dimWidth');
        const dimHeight = formData.get('dimHeight');
        if (dimLength && dimWidth && dimHeight) {
            product.dimensions = {
                length: parseFloat(dimLength),
                width: parseFloat(dimWidth),
                height: parseFloat(dimHeight)
            };
        } else {
            product.dimensions = null;
        }
        
        // 商品重量（克）
        const weightG = formData.get('weightG');
        product.weightG = weightG ? parseFloat(weightG) : null;
        
        await DB.products.update(product);
        await DataManager.loadProducts();
        
        closeModal();
        renderProductTable();
        updateStatistics();
    });
    
    // 绑定任务编辑器点击事件
    document.querySelectorAll('.task-editor-item').forEach(item => {
        item.addEventListener('click', async () => {
            const taskName = item.dataset.task;
            const newStatus = await DataManager.cycleTaskStatus(productId, taskName);
            
            item.className = `task-editor-item ${newStatus}`;
            const icon = item.querySelector('.task-icon');
            switch (newStatus) {
                case 'done':
                    icon.textContent = '✓';
                    break;
                case 'locked':
                    icon.textContent = '■';
                    break;
                default:
                    icon.textContent = '○';
            }
        });
    });
}

/**
 * 渲染分类选项
 */
function renderCategoryOptions(selectedCategory) {
    const categories = DataManager.state.categories;
    if (!categories || categories.length === 0) {
        return '<option value="">暂无类目</option>';
    }
    return categories.map(cat => {
        // 处理 name 可能是对象的情况（兼容旧数据）
        let name;
        if (typeof cat.name === 'string') {
            name = cat.name;
        } else if (typeof cat.name === 'object' && cat.name !== null) {
            // 如果 name 是对象，尝试提取 name 属性
            name = cat.name.name || '未知类目';
        } else {
            name = '未知类目';
        }
        return `<option value="${name}" ${name === selectedCategory ? 'selected' : ''}>${name}</option>`;
    }).join('');
}

/**
 * 渲染任务编辑器项
 */
function renderTaskEditorItems(productId, taskStatus) {
    const taskNames = DataManager.state.taskNames;
    const taskOrder = DataManager.state.taskOrder;
    const today = DB.getTodayString();
    
    return taskOrder.map(taskName => {
        const taskState = taskStatus[taskName] || { status: 'pending', lastUpdated: null };
        let statusClass = taskState.status;
        let icon = '';
        
        // 如果是done状态，检查是否是今日完成的
        if (taskState.status === 'done') {
            const lastUpdated = taskState.lastUpdated ? taskState.lastUpdated.split('T')[0] : null;
            if (lastUpdated !== today) {
                statusClass = 'pending';
            }
        }
        
        switch (statusClass) {
            case 'done':
                icon = '✓';
                break;
            case 'locked':
                icon = '■';
                break;
            default:
                icon = '○';
        }
        
        return `
            <div class="task-editor-item ${statusClass}" data-task="${taskName}">
                <div class="task-icon">${icon}</div>
                <div class="task-name">${taskNames[taskName]}</div>
            </div>
        `;
    }).join('');
}

/**
 * 处理销量点击
 */
async function handleSalesClick(productId) {
    const product = await DB.products.getById(productId);
    const salesRecords = await DB.sales.getByProduct(productId);
    
    // 按日期排序
    salesRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const totalSales = salesRecords.reduce((sum, s) => sum + s.quantity, 0);
    
    showModal('销量记录', `
        <div class="form-group">
            <label>商品</label>
            <input type="text" value="${product.name}" readonly>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>累计销量</label>
                <input type="text" value="${totalSales}" readonly>
            </div>
            <div class="form-group">
                <label>记录数</label>
                <input type="text" value="${salesRecords.length} 天" readonly>
            </div>
        </div>
        <div class="form-group">
            <label>添加/修改销量</label>
            <div class="form-row">
                <div class="form-group" style="flex: 2;">
                    <input type="date" id="sales-date" value="${DB.getTodayString()}">
                </div>
                <div class="form-group" style="flex: 1;">
                    <input type="number" id="sales-quantity" placeholder="销量" min="0">
                </div>
                <div class="form-group" style="flex: 1;">
                    <button type="button" class="btn submit" onclick="handleSaveSales('${productId}')">保存</button>
                </div>
            </div>
        </div>
        <div class="form-group">
            <label>最近记录</label>
            <div style="max-height: 200px; overflow-y: auto;">
                ${salesRecords.length > 0 ? `
                    <table class="product-table" style="font-size: 12px;">
                        <thead>
                            <tr>
                                <th>日期</th>
                                <th>销量</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${salesRecords.slice(0, 10).map(record => `
                                <tr>
                                    <td>${record.date}</td>
                                    <td>${record.quantity}</td>
                                    <td>
                                        <button class="action-btn delete" onclick="handleDeleteSales('${record.id}', '${productId}')">删除</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p style="color: var(--text-muted);">暂无销量记录</p>'}
            </div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn cancel" onclick="closeModal()">关闭</button>
        </div>
    `);
}

/**
 * 保存销量记录
 */
async function handleSaveSales(productId) {
    const dateInput = document.getElementById('sales-date');
    const quantityInput = document.getElementById('sales-quantity');
    
    const date = dateInput.value;
    const quantity = parseInt(quantityInput.value);
    
    if (!date || isNaN(quantity) || quantity < 0) {
        alert('请输入有效的日期和销量');
        return;
    }
    
    await DB.sales.set(productId, date, quantity);
    await DataManager.loadSales();
    
    // 刷新弹窗
    handleSalesClick(productId);
    updateStatistics();
}

/**
 * 删除销量记录
 */
async function handleDeleteSales(recordId, productId) {
    if (!confirm('确定要删除这条销量记录吗？')) return;
    
    await DB.sales.delete(recordId);
    await DataManager.loadSales();
    
    // 刷新弹窗
    handleSalesClick(productId);
    updateStatistics();
}

/**
 * 处理删除点击
 */
async function handleDeleteClick(productId) {
    if (!confirm('确定要删除这个商品吗？此操作不可恢复。')) return;
    
    await DB.products.delete(productId);
    await DataManager.loadProducts();
    await DataManager.loadTaskStatus();
    await DataManager.loadSales();
    
    renderProductTable();
    updateStatistics();
}

/**
 * 处理归档点击
 */
async function handleArchiveClick(productId) {
    if (!confirm('确定要归档这个商品吗？归档后商品将在全部和类目页面隐藏。')) return;
    
    const product = await DB.products.getById(productId);
    if (product) {
        product.isArchived = true;
        await DB.products.update(product);
        await DataManager.loadProducts();
        renderProductTable();
        updateStatistics();
    }
}

/**
 * 处理取消归档点击
 */
async function handleUnarchiveClick(productId) {
    const product = await DB.products.getById(productId);
    if (product) {
        product.isArchived = false;
        await DB.products.update(product);
        await DataManager.loadProducts();
        renderProductTable();
        updateStatistics();
    }
}

/**
 * 显示新增商品弹窗
 */
function showAddProductModal() {
    showModal('新增商品', `
        <form id="add-product-form">
            <div class="form-row">
                <div class="form-group">
                    <label>ASIN (可选)</label>
                    <input type="text" name="asin" placeholder="如: B08N5WRWNW">
                </div>
                <div class="form-group">
                    <label>类目</label>
                    <select name="category" required>
                        <option value="">请选择类目</option>
                        ${renderCategoryOptions('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>商品名称</label>
                <input type="text" name="name" required placeholder="输入商品名称">
            </div>
            <div class="form-group">
                <label>商品图片URL (可选)</label>
                <input type="text" name="imageUrl" placeholder="https://example.com/image.jpg 或图片名称如 01">
            </div>
            <div class="form-group">
                <label>商品链接 (可选，留空则根据ASIN自动生成)</label>
                <input type="url" name="productUrl" placeholder="https://www.amazon.com/dp/...">
            </div>
            <div class="form-group">
                <label>1688采购链接 (可选)</label>
                <input type="url" name="procurementUrl" placeholder="https://detail.1688.com/...">
            </div>
            <div class="form-group">
                <label>小类名称 (可选)</label>
                <input type="text" name="subCategory" placeholder="如：蓝牙耳机">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>价格 ($)</label>
                    <input type="number" name="price" step="0.01" required placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>月销量</label>
                    <input type="number" name="monthlySales" required placeholder="0">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>子体数量</label>
                    <input type="number" name="childCount" required placeholder="0">
                </div>
                <div class="form-group">
                    <label>FBA运费 ($)</label>
                    <input type="number" name="fbaFee" step="0.01" placeholder="0.00">
                </div>
            </div>
            <div class="form-group">
                <label>包装尺寸 (长×宽×高，单位：厘米cm)</label>
                <div class="form-row">
                    <input type="number" name="dimLength" step="0.1" placeholder="长" style="flex: 1;">
                    <input type="number" name="dimWidth" step="0.1" placeholder="宽" style="flex: 1;">
                    <input type="number" name="dimHeight" step="0.1" placeholder="高" style="flex: 1;">
                </div>
            </div>
            <div class="form-group">
                <label>商品重量 (单位：克g)</label>
                <input type="number" name="weightG" step="0.1" placeholder="如: 150">
            </div>
            <div class="form-actions">
                <button type="button" class="btn cancel" onclick="closeModal()">取消</button>
                <button type="submit" class="btn submit">添加</button>
            </div>
        </form>
    `);
    
    // 绑定表单提交
    document.getElementById('add-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const product = {
            asin: formData.get('asin'),
            category: formData.get('category'),
            name: formData.get('name'),
            imageUrl: formData.get('imageUrl') || null,
            productUrl: formData.get('productUrl') || null,
            procurementUrl: formData.get('procurementUrl') || null,
            subCategory: formData.get('subCategory') || null,
            price: parseFloat(formData.get('price')),
            monthlySales: parseInt(formData.get('monthlySales')),
            childCount: parseInt(formData.get('childCount')),
            fbaFee: formData.get('fbaFee') ? parseFloat(formData.get('fbaFee')) : null,
            isFavorite: false
        };
        
        // 包装尺寸
        const dimLength = formData.get('dimLength');
        const dimWidth = formData.get('dimWidth');
        const dimHeight = formData.get('dimHeight');
        if (dimLength && dimWidth && dimHeight) {
            product.dimensions = {
                length: parseFloat(dimLength),
                width: parseFloat(dimWidth),
                height: parseFloat(dimHeight)
            };
        }
        
        // 商品重量（克）
        const weightG = formData.get('weightG');
        product.weightG = weightG ? parseFloat(weightG) : null;
        
        await DB.products.add(product);
        await DataManager.loadProducts();
        await DataManager.loadTaskStatus();
        
        closeModal();
        renderProductTable();
        updateStatistics();
    });
}

/**
 * 显示模态框
 */
function showModal(title, content, size = '') {
    DOM.modalBody.innerHTML = `
        <h2>${title}</h2>
        ${content}
    `;
    DOM.modal.querySelector('.modal-content').className = `modal-content ${size}`;
    DOM.modal.style.display = 'flex';
}

/**
 * 关闭模态框
 */
function closeModal() {
    DOM.modal.style.display = 'none';
    DOM.modalBody.innerHTML = '';
}

/**
 * 打开管理中心侧边栏
 */
function openAdminSidebar() {
    renderSidebarCategoryList();
    DOM.adminSidebar.classList.add('open');
    DOM.sidebarOverlay.style.display = 'block';
}

/**
 * 关闭管理中心侧边栏
 */
function closeAdminSidebar() {
    DOM.adminSidebar.classList.remove('open');
    DOM.sidebarOverlay.style.display = 'none';
}

/**
 * 渲染侧边栏分类列表
 * 使用与分类筛选栏相同的逻辑：只显示有商品的类目（不包括归档商品）
 */
function renderSidebarCategoryList() {
    const container = document.getElementById('sidebar-category-list');
    
    // 获取类目商品统计（与分类筛选栏使用相同的逻辑）
    const categoryStats = getCategoryProductStats();
    
    if (categoryStats.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">暂无分类</p>';
        return;
    }
    
    container.innerHTML = categoryStats.map(({ name, count }) => {
        return `
            <div class="category-item" data-category-name="${name}">
                <span>${name} (${count})</span>
                <div class="category-item-actions">
                    <button class="edit-btn" onclick="handleEditCategoryByName('${name}')">编辑</button>
                    <button class="delete-btn" onclick="handleDeleteCategoryByName('${name}')">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 显示添加分类弹窗
 */
function showAddCategoryModal() {
    showModal('添加分类', `
        <form id="add-category-form">
            <div class="form-group">
                <label>分类名称</label>
                <input type="text" name="name" required placeholder="输入分类名称">
            </div>
            <div class="form-actions">
                <button type="button" class="btn cancel" onclick="closeModal()">取消</button>
                <button type="submit" class="btn submit">添加</button>
            </div>
        </form>
    `);
    
    document.getElementById('add-category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name').trim();
        
        if (name) {
            await DB.categories.add(name);
            await DataManager.loadCategories();
            renderCategoryNav();
            renderSidebarCategoryList();
            closeModal();
        }
    });
}

/**
 * 处理编辑分类（通过名称）
 */
async function handleEditCategoryByName(categoryName) {
    showModal('编辑分类', `
        <form id="edit-category-form">
            <div class="form-group">
                <label>分类名称</label>
                <input type="text" name="name" value="${categoryName}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn cancel" onclick="closeModal()">取消</button>
                <button type="submit" class="btn submit">保存</button>
            </div>
        </form>
    `);
    
    document.getElementById('edit-category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newName = formData.get('name').trim();
        
        if (newName && newName !== categoryName) {
            // 更新所有使用该分类的商品
            const productsToUpdate = DataManager.state.products.filter(p => p.category === categoryName);
            for (const product of productsToUpdate) {
                product.category = newName;
                await DB.products.update(product);
            }
            
            // 更新分类数据库中的名称
            const category = DataManager.state.categories.find(c => c.name === categoryName);
            if (category) {
                category.name = newName;
                await DB.categories.update(category);
            }
            
            await DataManager.loadCategories();
            await DataManager.loadProducts();
            renderCategoryNav();
            renderSidebarCategoryList();
            renderProductTable();
        }
        
        closeModal();
    });
}

/**
 * 处理删除分类（通过名称）
 */
async function handleDeleteCategoryByName(categoryName) {
    // 检查该分类下是否有商品
    const productsInCategory = DataManager.state.products.filter(p => p.category === categoryName);
    if (productsInCategory.length > 0) {
        alert(`无法删除分类"${categoryName}"，该分类下还有 ${productsInCategory.length} 个商品。\n请先删除或移动这些商品。`);
        return;
    }
    
    if (!confirm(`确定要删除分类"${categoryName}"吗？`)) return;
    
    // 找到并删除分类
    const category = DataManager.state.categories.find(c => c.name === categoryName);
    if (category) {
        await DB.categories.delete(category.id);
    }
    
    await DataManager.loadCategories();
    renderCategoryNav();
    renderSidebarCategoryList();
}

/**
 * 处理一键删除所有商品
 */
async function handleDeleteAllProducts() {
    if (!confirm('警告：这将删除所有商品数据，包括销量记录和任务状态！\n\n此操作不可恢复，确定要继续吗？')) return;
    
    if (!confirm('再次确认：您真的要删除所有数据吗？')) return;
    
    await DB.clearAll();
    await DataManager.init();
    
    renderProductTable();
    renderCategoryNav();
    updateStatistics();
    closeAdminSidebar();
    
    alert('所有数据已清空');
}

/**
 * 处理清空销量记录
 */
async function handleClearSales() {
    if (!confirm('确定要清空所有销量记录吗？此操作不可恢复。')) return;
    
    await DB.sales.clear();
    await DataManager.loadSales();
    
    updateStatistics();
    alert('销量记录已清空');
}

// 导出UI函数
window.UI = {
    init: initDOM,
    renderProductTable,
    renderCategoryNav,
    updateStatistics,
    showModal,
    closeModal,
    openAdminSidebar,
    closeAdminSidebar,
    showAddProductModal,
    showAddCategoryModal,
    handleEditCategoryByName,
    handleDeleteCategoryByName,
    handleDeleteAllProducts,
    handleClearSales,
    handleSaveSales,
    handleDeleteSales
};

// 导出事件处理函数到全局
window.handleFavoriteClick = handleFavoriteClick;
window.handleProductNameClick = handleProductNameClick;
window.handleTaskClick = handleTaskClick;
window.handleEditClick = handleEditClick;
window.handleSalesClick = handleSalesClick;
window.handleDeleteClick = handleDeleteClick;
window.handleSaveSales = handleSaveSales;
window.handleDeleteSales = handleDeleteSales;

/**
 * 包装尺寸单位切换
 */
let currentDimUnit = 'cm';
const INCH_TO_CM = 2.54;

function toggleDimensionUnit(unit) {
    currentDimUnit = unit;
    const hint = document.getElementById('dim-conversion-hint');
    if (hint) {
        hint.style.display = unit === 'inch' ? 'block' : 'none';
    }
}

/**
 * 转换单个尺寸值
 */
function convertDimension(dimension) {
    if (currentDimUnit !== 'inch') return;
    
    const input = document.getElementById(`dim${dimension.charAt(0).toUpperCase() + dimension.slice(1)}`);
    if (input && input.value) {
        const inchValue = parseFloat(input.value);
        if (!isNaN(inchValue)) {
            const cmValue = (inchValue * INCH_TO_CM).toFixed(1);
            input.value = cmValue;
        }
    }
}

// 导出尺寸转换函数
window.toggleDimensionUnit = toggleDimensionUnit;
window.convertDimension = convertDimension;
