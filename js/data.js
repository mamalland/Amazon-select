/**
 * Amazon POM Manager - 数据管理层
 * 处理应用状态、数据缓存和计算
 */

// 应用状态
const AppState = {
    products: [],
    categories: [],
    taskStatus: {},
    sales: [],
    currentFilter: 'all',
    currentCategory: 'all',
    searchQuery: '',
    
    // 任务名称映射
    taskNames: {
        mainImage: '首图',
        aPlusImage: 'A+图',
        autoAd: '自动广告',
        manualAd: '手动广告',
        coupon: '优惠券',
        underline: '下划线'
    },

    // 任务顺序
    taskOrder: ['mainImage', 'aPlusImage', 'autoAd', 'manualAd', 'coupon', 'underline']
};

/**
 * 初始化数据
 */
async function initData() {
    await Promise.all([
        loadProducts(),
        loadCategories(),
        loadTaskStatus(),
        loadSales()
    ]);
}

/**
 * 加载商品数据
 */
async function loadProducts() {
    AppState.products = await DB.products.getAll();
}

/**
 * 加载分类数据
 */
async function loadCategories() {
    AppState.categories = await DB.categories.getAll();
    // 如果没有分类，添加默认分类
    if (AppState.categories.length === 0) {
        const defaultCategories = ['电子产品', '家居用品', '服装配饰', '美妆护肤', '运动户外'];
        for (const name of defaultCategories) {
            await DB.categories.add(name);
        }
        AppState.categories = await DB.categories.getAll();
    }
}

/**
 * 加载任务状态
 */
async function loadTaskStatus() {
    console.log('[loadTaskStatus] Loading task statuses from DB...');
    const allStatus = await DB.tasks.getAll();
    console.log(`[loadTaskStatus] Loaded ${allStatus.length} task statuses from DB:`, JSON.parse(JSON.stringify(allStatus)));
    
    AppState.taskStatus = {};
    allStatus.forEach(status => {
        AppState.taskStatus[status.productId] = status;
    });
    console.log('[loadTaskStatus] AppState.taskStatus updated:', Object.keys(AppState.taskStatus));
}

/**
 * 加载销量数据
 */
async function loadSales() {
    AppState.sales = await DB.sales.getAll();
}

/**
 * 获取过滤后的商品列表
 */
function getFilteredProducts() {
    let result = [...AppState.products];

    // 搜索过滤
    if (AppState.searchQuery) {
        const query = AppState.searchQuery.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(query));
    }

    // 分类过滤
    if (AppState.currentCategory !== 'all') {
        result = result.filter(p => p.category === AppState.currentCategory);
    }

    // 状态过滤
    switch (AppState.currentFilter) {
        case 'favorite':
            // 收藏夹不显示归档商品
            result = result.filter(p => p.isFavorite && !p.isArchived);
            break;
        case 'todo':
            // 待办中：只显示收藏夹商品，且至少有一个运维状态为【待办】
            result = result.filter(p => {
                if (!p.isFavorite || p.isArchived) return false;
                const status = AppState.taskStatus[p.id];
                // 如果没有状态记录，显示在待办中
                if (!status) return true;
                // 检查是否有任何任务状态为 pending（待办）
                return AppState.taskOrder.some(task => {
                    const taskState = status[task];
                    return taskState && taskState.status === 'pending';
                });
            });
            break;
        case 'done':
            // 已完成：只显示收藏夹商品，且所有运维状态都为【完成】或【锁定】
            result = result.filter(p => {
                if (!p.isFavorite || p.isArchived) return false;
                const status = AppState.taskStatus[p.id];
                // 如果没有状态记录，不算已完成
                if (!status) return false;
                // 检查所有任务状态是否都为 done（完成）或 locked（锁定）
                return AppState.taskOrder.every(task => {
                    const taskState = status[task];
                    return taskState && (taskState.status === 'done' || taskState.status === 'locked');
                });
            });
            break;
        case 'archived':
            // 只显示归档商品
            result = result.filter(p => p.isArchived);
            break;
        default:
            // 全部商品（不包括归档）
            result = result.filter(p => !p.isArchived);
            break;
    }

    // 排序：收藏商品置顶，然后按创建时间倒序
    result.sort((a, b) => {
        // 首先按收藏状态排序（收藏的在前面）
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        
        // 然后按创建时间倒序
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
}

/**
 * 获取商品的任务状态
 */
function getProductTaskStatus(productId) {
    return AppState.taskStatus[productId] || {
        productId: productId,
        mainImage: { status: 'pending', lastUpdated: null },
        aPlusImage: { status: 'pending', lastUpdated: null },
        autoAd: { status: 'pending', lastUpdated: null },
        manualAd: { status: 'pending', lastUpdated: null },
        coupon: { status: 'pending', lastUpdated: null },
        underline: { status: 'pending', lastUpdated: null }
    };
}

/**
 * 获取商品的整体状态
 */
function getProductOverallStatus(productId) {
    const status = getProductTaskStatus(productId);
    const today = DB.getTodayString();
    
    let pendingCount = 0;
    let doneCount = 0;
    let lockedCount = 0;

    AppState.taskOrder.forEach(task => {
        const taskState = status[task];
        if (!taskState || taskState.status === 'pending') {
            pendingCount++;
        } else if (taskState.status === 'done') {
            // 检查是否是今日完成的
            const lastUpdated = taskState.lastUpdated ? taskState.lastUpdated.split('T')[0] : null;
            // 只有当 lastUpdated 存在且等于今天时，才算作 done
            if (lastUpdated && lastUpdated === today) {
                doneCount++;
            } else {
                pendingCount++; // 隔日或首次设置时，自动重置为待办
            }
        } else if (taskState.status === 'locked') {
            lockedCount++;
        }
    });

    if (lockedCount === AppState.taskOrder.length) {
        return { type: 'locked', label: '已锁定', class: 'locked' };
    } else if (doneCount > 0 && pendingCount === 0) {
        return { type: 'done', label: '已完成', class: 'done' };
    } else if (doneCount > 0) {
        return { type: 'in-progress', label: '进行中', class: 'in-progress' };
    } else {
        return { type: 'todo', label: '待办中', class: 'todo' };
    }
}

/**
 * 获取商品销量统计
 */
function getProductSalesStats(productId) {
    const productSales = AppState.sales.filter(s => s.productId === productId);
    const total = productSales.reduce((sum, s) => sum + s.quantity, 0);
    
    const today = DB.getTodayString();
    const todaySales = productSales.filter(s => s.date === today);
    const todayTotal = todaySales.reduce((sum, s) => sum + s.quantity, 0);

    return { total, today: todayTotal };
}

/**
 * 获取商品当月销量统计
 */
function getProductCurrentMonthSales(productId) {
    const productSales = AppState.sales.filter(s => s.productId === productId);
    
    // 获取当前年月
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // 筛选当月销量
    const monthSales = productSales.filter(s => s.date.startsWith(monthPrefix));
    const monthTotal = monthSales.reduce((sum, s) => sum + s.quantity, 0);
    
    return monthTotal;
}

/**
 * 获取统计数据（排除归档商品）
 */
function getStatistics() {
    const today = DB.getTodayString();
    
    // 获取非归档商品
    const activeProducts = AppState.products.filter(p => !p.isArchived);
    const activeProductIds = new Set(activeProducts.map(p => p.id));
    
    // 总商品数（不包括归档）
    const totalProducts = activeProducts.length;
    
    // 收藏商品数（不包括归档）
    const favoriteCount = activeProducts.filter(p => p.isFavorite).length;
    
    // 获取收藏商品的ID集合
    const favoriteProductIds = new Set(
        activeProducts.filter(p => p.isFavorite).map(p => p.id)
    );
    
    // 今日销量（只统计收藏商品）
    const todaySales = AppState.sales
        .filter(s => s.date === today && favoriteProductIds.has(s.productId))
        .reduce((sum, s) => sum + s.quantity, 0);
    
    // 总销量（只统计收藏商品）
    const totalSales = AppState.sales
        .filter(s => favoriteProductIds.has(s.productId))
        .reduce((sum, s) => sum + s.quantity, 0);

    return {
        totalProducts,
        favoriteCount,
        todaySales,
        totalSales
    };
}

/**
 * 获取分类销量统计
 */
function getCategorySalesStats(category) {
    const categoryProducts = AppState.products.filter(p => p.category === category);
    const productIds = categoryProducts.map(p => p.id);
    
    const categorySales = AppState.sales.filter(s => productIds.includes(s.productId));
    return categorySales.reduce((sum, s) => sum + s.quantity, 0);
}

/**
 * 切换商品收藏状态
 */
async function toggleFavorite(productId) {
    const product = AppState.products.find(p => p.id === productId);
    if (product) {
        product.isFavorite = !product.isFavorite;
        await DB.products.update(product);
        return product.isFavorite;
    }
    return false;
}

/**
 * 更新任务状态（三态循环）
 */
async function cycleTaskStatus(productId, taskName) {
    console.log(`[cycleTaskStatus] Starting for ${productId}.${taskName}`);
    
    const currentStatus = getProductTaskStatus(productId);
    console.log(`[cycleTaskStatus] Current status from AppState:`, JSON.parse(JSON.stringify(currentStatus)));
    
    const taskState = currentStatus[taskName];
    const currentState = taskState ? taskState.status : 'pending';
    console.log(`[cycleTaskStatus] Current state for ${taskName}: ${currentState}`);
    
    let newState;
    switch (currentState) {
        case 'pending':
            newState = 'done';
            break;
        case 'done':
            newState = 'locked';
            break;
        case 'locked':
        default:
            newState = 'pending';
            break;
    }
    console.log(`[cycleTaskStatus] New state: ${newState}`);

    console.log(`[cycleTaskStatus] Calling DB.tasks.update...`);
    await DB.tasks.update(productId, taskName, newState);
    console.log(`[cycleTaskStatus] DB.tasks.update completed`);
    
    // 更新缓存
    if (!AppState.taskStatus[productId]) {
        console.log(`[cycleTaskStatus] Creating new AppState.taskStatus[${productId}]`);
        AppState.taskStatus[productId] = currentStatus;
    }
    // 使用本地时间格式，与数据库保持一致
    const now = new Date();
    const localDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    AppState.taskStatus[productId][taskName] = {
        status: newState,
        lastUpdated: localDateTime
    };
    console.log(`[cycleTaskStatus] Updated AppState cache:`, JSON.parse(JSON.stringify(AppState.taskStatus[productId][taskName])));

    return newState;
}

/**
 * 获取待办看板数据（仅收藏夹商品，按商品分组）
 */
function getTodoBoardData() {
    const today = DB.getTodayString();

    // 只处理收藏夹商品
    const favoriteProducts = AppState.products.filter(p => p.isFavorite);

    // 按商品分组的数据结构
    const productGroups = {
        pending: [],
        done: []
    };

    favoriteProducts.forEach(product => {
        const status = getProductTaskStatus(product.id);
        const productTasks = {
            pending: [],
            done: []
        };

        AppState.taskOrder.forEach(taskName => {
            const taskState = status[taskName];
            const taskStatus = taskState ? taskState.status : 'pending';

            // 如果是done状态，检查是否是今日完成的
            let displayStatus = taskStatus;
            let isTodayDone = false;
            if (taskStatus === 'done') {
                const lastUpdated = taskState.lastUpdated ? taskState.lastUpdated.split('T')[0] : null;
                // 只有当 lastUpdated 存在且等于今天时，才算作今日done
                isTodayDone = lastUpdated && lastUpdated === today;
                if (!isTodayDone) {
                    displayStatus = 'pending'; // 隔日或首次设置时，显示为pending
                }
            }

            if (taskStatus !== 'locked') {
                const taskItem = {
                    taskName: taskName,
                    taskLabel: AppState.taskNames[taskName],
                    status: displayStatus  // 使用显示状态（隔日done显示为pending）
                };

                // 只有今日完成的done才放入done分组
                if (taskStatus === 'done' && isTodayDone) {
                    productTasks.done.push(taskItem);
                } else {
                    productTasks.pending.push(taskItem);
                }
            }
        });

        // 如果该商品有待办或已完成任务，添加到分组
        if (productTasks.pending.length > 0) {
            productGroups.pending.push({
                productId: product.id,
                productName: product.name,
                imageUrl: product.imageUrl,
                tasks: productTasks.pending
            });
        }

        if (productTasks.done.length > 0) {
            productGroups.done.push({
                productId: product.id,
                productName: product.name,
                imageUrl: product.imageUrl,
                tasks: productTasks.done
            });
        }
    });

    return productGroups;
}

/**
 * 检查分类是否可删除
 */
async function canDeleteCategory(categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category) return { canDelete: false, reason: '分类不存在' };

    const productsInCategory = AppState.products.filter(p => p.category === category.name);
    if (productsInCategory.length > 0) {
        return { 
            canDelete: false, 
            reason: `该分类下有 ${productsInCategory.length} 个商品，请先转移或删除这些商品` 
        };
    }

    return { canDelete: true };
}

/**
 * 导出所有数据（用于Excel导出）
 */
function exportAllData() {
    return AppState.products.map(product => {
        const status = getProductTaskStatus(product.id);
        const salesStats = getProductSalesStats(product.id);
        const currentMonthSales = getProductCurrentMonthSales(product.id);
        
        return {
            id: product.id,
            asin: product.asin || '',
            category: product.category,
            subCategory: product.subCategory || '',
            name: product.name,
            imageUrl: product.imageUrl || '',
            productUrl: product.productUrl || '',
            price: product.price,
            monthlySales: product.monthlySales,
            childCount: product.childCount,
            dimensions: product.dimensions || null,
            weightG: product.weightG || null,
            isFavorite: product.isFavorite ? '是' : '否',
            currentMonthSales: currentMonthSales, // 当月销量（汇总）
            totalSales: salesStats.total,
            // 任务状态
            mainImageStatus: status.mainImage?.status || 'pending',
            aPlusImageStatus: status.aPlusImage?.status || 'pending',
            autoAdStatus: status.autoAd?.status || 'pending',
            manualAdStatus: status.manualAd?.status || 'pending',
            couponStatus: status.coupon?.status || 'pending',
            underlineStatus: status.underline?.status || 'pending',
            createdAt: product.createdAt
        };
    });
}

/**
 * 导入商品数据（用于Excel导入）
 */
async function importProducts(productsData) {
    const results = {
        added: 0,
        updated: 0,
        skipped: 0,
        errors: []
    };

    for (const data of productsData) {
        try {
            // 检查是否已存在同名商品
            const existing = AppState.products.find(p => p.name === data.name);
            
            if (existing) {
                // 更新现有商品
                existing.asin = data.asin || existing.asin;
                existing.category = data.category || existing.category;
                existing.price = data.price !== undefined ? data.price : existing.price;
                existing.monthlySales = data.monthlySales !== undefined ? data.monthlySales : existing.monthlySales;
                existing.childCount = data.childCount !== undefined ? data.childCount : existing.childCount;
                
                await DB.products.update(existing);
                results.updated++;
            } else {
                // 添加新商品
                await DB.products.add({
                    asin: data.asin || '',
                    category: data.category || '未分类',
                    name: data.name,
                    price: data.price || 0,
                    monthlySales: data.monthlySales || 0,
                    childCount: data.childCount || 0,
                    isFavorite: false
                });
                results.added++;
            }
        } catch (error) {
            results.errors.push({ name: data.name, error: error.message });
        }
    }

    // 重新加载数据
    await loadProducts();
    await loadTaskStatus();

    return results;
}

// 导出数据管理函数
window.DataManager = {
    state: AppState,
    init: initData,
    loadProducts,
    loadCategories,
    loadTaskStatus,
    loadSales,
    getFilteredProducts,
    getProductTaskStatus,
    getProductOverallStatus,
    getProductSalesStats,
    getStatistics,
    getCategorySalesStats,
    toggleFavorite,
    cycleTaskStatus,
    getTodoBoardData,
    canDeleteCategory,
    exportAllData,
    importProducts
};
