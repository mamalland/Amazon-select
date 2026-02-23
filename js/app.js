/**
 * Amazon POM Manager - 主应用入口
 */

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 初始化数据库
        await DB.init();
        console.log('数据库初始化成功');

        // 检查是否是首次加载（数据库是否为空）
        const existingProducts = await DB.products.getAll();
        const isFirstLoad = existingProducts.length === 0;

        if (isFirstLoad) {
            console.log('首次加载，检查 ORIGIN_DATA...');
            // 首次加载：尝试从 0-origin.js 导入数据
            if (typeof ORIGIN_DATA !== 'undefined' && ORIGIN_DATA) {
                console.log('发现 ORIGIN_DATA，正在导入...');
                await loadOriginData();
            }
        } else {
            console.log('使用浏览器缓存数据');
        }

        // 初始化数据
        await DataManager.init();
        console.log('数据加载完成');

        // 加载示例数据（如果数据库为空且没有ORIGIN_DATA）
        if (SampleData && DataManager.state.products.length === 0) {
            await SampleData.load();
            // 重新加载数据（如果示例数据已添加）
            await DataManager.init();
        }

        // 初始化 UI
        UI.init();
        console.log('UI 初始化完成');

        // 渲染界面
        UI.renderCategoryNav();
        UI.renderProductTable();
        UI.updateStatistics();

        // 绑定事件
        bindEvents();

        console.log('应用启动完成');
    } catch (error) {
        console.error('应用启动失败:', error);
        alert('应用启动失败，请刷新页面重试');
    }
});

/**
 * 绑定全局事件
 */
function bindEvents() {
    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // 更新激活状态
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 更新筛选条件
            DataManager.state.currentFilter = btn.dataset.filter;
            UI.renderProductTable();
        });
    });

    // 搜索框
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        DataManager.state.searchQuery = e.target.value.trim();
        UI.renderProductTable();
    });

    // 新增商品按钮
    document.getElementById('add-product-btn').addEventListener('click', () => {
        UI.showAddProductModal();
    });

    // 导出 Excel 按钮
    document.getElementById('export-excel-btn').addEventListener('click', () => {
        ExcelHandler.export();
    });

    // 导入 Excel 按钮
    document.getElementById('import-excel-btn').addEventListener('click', () => {
        ExcelHandler.showImport();
    });

    // 销量月历按钮
    document.getElementById('sales-calendar-btn').addEventListener('click', () => {
        Calendar.show();
    });

    // 待办看板按钮
    document.getElementById('todo-board-btn').addEventListener('click', () => {
        TodoBoard.show();
    });

    // 数据简报按钮
    document.getElementById('stats-btn').addEventListener('click', () => {
        showStatsBriefing();
    });

    // 初始化管理中心事件
    Admin.init();

    // 模态框关闭按钮
    document.querySelector('.modal .close').addEventListener('click', () => {
        UI.closeModal();
    });

    // 点击模态框背景关闭
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') {
            UI.closeModal();
        }
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        // ESC 关闭模态框
        if (e.key === 'Escape') {
            UI.closeModal();
            UI.closeAdminSidebar();
        }
    });
}

/**
 * 显示数据简报
 */
function showStatsBriefing() {
    const stats = DataManager.getStatistics();
    const todoData = DataManager.getTodoBoardData();
    
    // 计算收藏夹商品的分类统计
    const favoriteProducts = DataManager.state.products.filter(p => p.isFavorite);
    const categoryStats = {};
    favoriteProducts.forEach(p => {
        if (!categoryStats[p.category]) {
            categoryStats[p.category] = { count: 0, sales: 0 };
        }
        categoryStats[p.category].count++;
    });

    // 添加收藏夹商品的销量数据
    DataManager.state.sales.forEach(s => {
        const product = DataManager.state.products.find(p => p.id === s.productId);
        if (product && product.isFavorite && categoryStats[product.category]) {
            categoryStats[product.category].sales += s.quantity;
        }
    });

    // 排序分类
    const sortedCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

    UI.showModal('数据简报', `
        <div style="padding: 10px;">
            <div class="stats-bar" style="margin-bottom: 24px;">
                <div class="stat-card">
                    <span class="stat-value">${stats.totalProducts}</span>
                    <span class="stat-label">总商品数</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.favoriteCount}</span>
                    <span class="stat-label">收藏商品</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.todaySales}</span>
                    <span class="stat-label">今日销量</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.totalSales}</span>
                    <span class="stat-label">总销量</span>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4 style="margin-bottom: 12px; color: var(--text-primary);">收藏夹待办统计</h4>
                    <div style="background-color: var(--bg-secondary); padding: 16px; border-radius: 12px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: var(--text-secondary);">待办任务</span>
                            <span style="font-weight: 600;">${todoData.pending.reduce((sum, p) => sum + p.tasks.length, 0)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">今日已完成</span>
                            <span style="font-weight: 600; color: var(--status-done);">${todoData.done.reduce((sum, p) => sum + p.tasks.length, 0)}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 style="margin-bottom: 12px; color: var(--text-primary);">收藏夹分类 TOP5</h4>
                    <div style="background-color: var(--bg-secondary); padding: 16px; border-radius: 12px;">
                        ${sortedCategories.length > 0 ? sortedCategories.map(([name, data]) => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                <span style="color: var(--text-secondary);">${name}</span>
                                <span style="font-weight: 600;">${data.count}个 / ${data.sales}销量</span>
                            </div>
                        `).join('') : '<p style="color: var(--text-muted);">暂无收藏商品</p>'}
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                <h4 style="margin-bottom: 12px; color: var(--text-primary);">快捷筛选</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    <button class="filter-btn" onclick="TodoBoard.showQuickFilter('pending-mainImage')">待处理首图</button>
                    <button class="filter-btn" onclick="TodoBoard.showQuickFilter('pending-aPlusImage')">待处理A+图</button>
                    <button class="filter-btn" onclick="TodoBoard.showQuickFilter('pending-autoAd')">待处理自动广告</button>
                    <button class="filter-btn" onclick="TodoBoard.showQuickFilter('pending-manualAd')">待处理手动广告</button>
                    <button class="filter-btn" onclick="TodoBoard.showQuickFilter('pending-coupon')">待处理优惠券</button>
                    <button class="filter-btn" onclick="TodoBoard.showQuickFilter('pending-underline')">待处理下划线</button>
                </div>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn cancel" onclick="closeModal()">关闭</button>
        </div>
    `, 'large');
}

/**
 * 加载 ORIGIN_DATA 到数据库
 * 更新策略：新增商品直接添加，已有商品更新基础属性（保留用户修改的运维数据）
 */
async function loadOriginData() {
    try {
        console.log('Loading ORIGIN_DATA...');

        // 获取现有数据
        const existingProducts = await DB.products.getAll();
        const existingProductMap = new Map(existingProducts.map(p => [p.id, p]));

        let existingCategories = await DB.categories.getAll();
        
        // 检查是否有损坏的类目数据（name 为对象），如果有则清空重新导入
        const hasCorruptedCategories = existingCategories.some(c => typeof c.name === 'object');
        if (hasCorruptedCategories) {
            console.log('Detected corrupted category data, clearing and re-importing...');
            await DB.categories.clear();
            existingCategories = [];
        }
        
        const existingCategoryIds = new Set(existingCategories.map(c => c.id));

        // 加载商品（新增或更新）
        let newProductIds = new Set();
        if (ORIGIN_DATA.products && ORIGIN_DATA.products.length > 0) {
            let addedCount = 0;
            let updatedCount = 0;
            for (const product of ORIGIN_DATA.products) {
                const existing = existingProductMap.get(product.id);
                if (!existing) {
                    // 新增商品
                    await DB.products.add(product);
                    newProductIds.add(product.id);
                    addedCount++;
                } else {
                    // 更新现有商品的基础属性（保留id、isFavorite、isArchived、createdAt等用户数据）
                    const updatedProduct = {
                        ...existing,  // 保留现有数据
                        // 更新基础属性
                        asin: product.asin || existing.asin,
                        category: product.category || existing.category,
                        subCategory: product.subCategory || existing.subCategory,
                        name: product.name || existing.name,
                        imageUrl: product.imageUrl || existing.imageUrl,
                        productUrl: product.productUrl || existing.productUrl,
                        procurementUrl: product.procurementUrl || existing.procurementUrl,
                        price: product.price !== undefined ? product.price : existing.price,
                        monthlySales: product.monthlySales !== undefined ? product.monthlySales : existing.monthlySales,
                        childCount: product.childCount !== undefined ? product.childCount : existing.childCount,
                        fbaFee: product.fbaFee !== undefined ? product.fbaFee : existing.fbaFee,
                        profitMargin: product.profitMargin !== undefined ? product.profitMargin : existing.profitMargin,
                        launchDate: product.launchDate || existing.launchDate,
                        rating: product.rating !== undefined ? product.rating : existing.rating,
                        reviewCount: product.reviewCount !== undefined ? product.reviewCount : existing.reviewCount,
                        dimensions: product.dimensions || existing.dimensions,
                        weightG: product.weightG !== undefined ? product.weightG : existing.weightG,
                        updatedAt: new Date().toISOString()
                    };
                    await DB.products.update(updatedProduct);
                    updatedCount++;
                }
            }
            console.log(`Added ${addedCount} new products, Updated ${updatedCount} existing products`);
        }
        
        // 首次加载：将收藏商品的 monthlySales 作为当月首日的销量记录
        // 检查是否已经从 monthlySales 导入过（通过检查特定日期的销量记录）
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const firstDayOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
        
        // 获取当月首日的销量记录
        const firstDaySales = await DB.sales.getByDate(firstDayOfMonth);
        const monthlySalesImported = firstDaySales.length > 0;
        
        console.log('[Sales Init] First day sales:', firstDaySales.length, 'Already imported:', monthlySalesImported);
        
        if (!monthlySalesImported && ORIGIN_DATA.products) {
            console.log('First load: initializing sales data from monthlySales...');
            console.log('[Sales Init] First day of month:', firstDayOfMonth);
            
            let salesAdded = 0;
            for (const product of ORIGIN_DATA.products) {
                console.log(`[Sales Init] Checking product ${product.id}: isFavorite=${product.isFavorite}, monthlySales=${product.monthlySales}`);
                // 只处理收藏商品且有销量的
                if (product.isFavorite && product.monthlySales > 0) {
                    console.log(`[Sales Init] Adding sales for ${product.id}: ${product.monthlySales}`);
                    try {
                        await DB.sales.set(product.id, firstDayOfMonth, product.monthlySales);
                        salesAdded++;
                        console.log(`[Sales Init] Successfully added sales for ${product.id}`);
                    } catch (err) {
                        console.error(`[Sales Init] Error adding sales for ${product.id}:`, err);
                    }
                }
            }
            console.log(`Initialized ${salesAdded} sales records from monthlySales`);
        } else {
            console.log('[Sales Init] Skipping sales initialization. monthlySalesImported:', monthlySalesImported, 'ORIGIN_DATA.products:', !!ORIGIN_DATA.products);
        }

        // 加载分类（只导入不存在的）
        if (ORIGIN_DATA.categories && ORIGIN_DATA.categories.length > 0) {
            let addedCount = 0;
            for (const category of ORIGIN_DATA.categories) {
                if (!existingCategoryIds.has(category.id)) {
                    // 传递类目名称而不是整个对象
                    await DB.categories.add(category.name);
                    addedCount++;
                }
            }
            console.log(`Added ${addedCount} new categories`);
        }

        // 加载任务状态（首次加载时覆盖，后续保留用户修改）
        if (ORIGIN_DATA.taskStatus) {
            console.log('TaskStatus data found:', Object.keys(ORIGIN_DATA.taskStatus));

            // 首次加载：清空现有任务状态并重新导入
            // 这样可以确保 0-origin.js 中的状态被正确应用
            console.log('First load: clearing and re-importing task statuses from ORIGIN_DATA');
            await DB.tasks.clear();

            let addedCount = 0;
            for (const [productId, status] of Object.entries(ORIGIN_DATA.taskStatus)) {
                console.log(`Importing task status for ${productId}:`, JSON.parse(JSON.stringify(status)));
                await DB.tasks.set(productId, status);
                addedCount++;
            }
            console.log(`Imported ${addedCount} task statuses from ORIGIN_DATA`);

            // 验证导入结果
            const afterImport = await DB.tasks.getAll();
            console.log('Task statuses after import:', afterImport.length, afterImport.map(s => ({ id: s.productId, mainImage: s.mainImage?.status })));
        } else {
            console.log('No taskStatus data found in ORIGIN_DATA');
        }

        // 为所有没有任务状态的商品创建默认任务状态
        const allProducts = await DB.products.getAll();
        const allTaskStatuses = await DB.tasks.getAll();
        const productIdsWithStatus = new Set(allTaskStatuses.map(s => s.productId));

        for (const product of allProducts) {
            if (!productIdsWithStatus.has(product.id)) {
                console.log(`Creating default task status for ${product.id}`);
                const defaultStatus = {
                    productId: product.id,
                    mainImage: { status: 'pending', lastUpdated: null },
                    aPlusImage: { status: 'pending', lastUpdated: null },
                    autoAd: { status: 'pending', lastUpdated: null },
                    manualAd: { status: 'pending', lastUpdated: null },
                    coupon: { status: 'pending', lastUpdated: null },
                    underline: { status: 'pending', lastUpdated: null }
                };
                await DB.tasks.set(product.id, defaultStatus);
            }
        }
        
        // 加载销量（只导入不存在的）
        if (ORIGIN_DATA.sales && ORIGIN_DATA.sales.length > 0) {
            let addedCount = 0;
            for (const sale of ORIGIN_DATA.sales) {
                const existingSales = await DB.sales.getByProduct(sale.productId);
                const exists = existingSales.some(s => s.date === sale.date);
                if (!exists) {
                    await DB.sales.set(sale.productId, sale.date, sale.quantity);
                    addedCount++;
                }
            }
            console.log(`Added ${addedCount} new sales records`);
        }
        
        console.log('ORIGIN_DATA loaded successfully!');
    } catch (error) {
        console.error('Failed to load ORIGIN_DATA:', error);
    }
}
