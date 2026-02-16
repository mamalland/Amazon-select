/**
 * Amazon POM Manager - 销量日历模块
 */

// 日历状态
let calendarState = {
    currentDate: new Date(),
    selectedDate: null,
    selectedProductId: null
};

/**
 * 显示销量日历弹窗（只显示收藏商品）
 */
function showSalesCalendarModal() {
    const today = new Date();
    calendarState.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    UI.showModal('销量月历（收藏商品）', `
        <div class="calendar-container">
            <div class="calendar-header">
                <h3 id="calendar-month-title">${formatMonthYear(calendarState.currentDate)}</h3>
                <div class="calendar-nav">
                    <button onclick="changeCalendarMonth(-1)">上月</button>
                    <button onclick="changeCalendarMonth(0)">今天</button>
                    <button onclick="changeCalendarMonth(1)">下月</button>
                </div>
            </div>
            <div class="form-group">
                <label>选择收藏商品查看销量</label>
                <select id="calendar-product-select" onchange="handleCalendarProductChange(this.value)">
                    <option value="">全部收藏商品</option>
                    ${renderFavoriteProductOptions()}
                </select>
            </div>
            <div class="stats-bar" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <span class="stat-value" id="calendar-total-sales">0</span>
                    <span class="stat-label">本月销量</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="calendar-category-sales">0</span>
                    <span class="stat-label">当前筛选销量</span>
                </div>
            </div>
            <div class="calendar-grid" id="calendar-grid">
                ${renderCalendarGrid()}
            </div>
            <div class="form-group" style="margin-top: 20px;">
                <label>快速记录销量（收藏商品）</label>
                <div class="form-row">
                    <div class="form-group" style="flex: 2;">
                        <select id="quick-sales-product">
                            ${renderFavoriteProductOptions()}
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <input type="date" id="quick-sales-date" value="${DB.getTodayString()}">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <input type="number" id="quick-sales-quantity" placeholder="销量" min="0">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <button type="button" class="btn submit" onclick="handleQuickSalesSave()">保存</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn cancel" onclick="closeModal()">关闭</button>
        </div>
    `, 'large');
    
    updateCalendarStats();
}

/**
 * 格式化年月
 */
function formatMonthYear(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}年${month}月`;
}

/**
 * 渲染商品选项
 */
function renderProductOptions() {
    const products = DataManager.state.products;
    return products.map(p => 
        `<option value="${p.id}">${p.name}</option>`
    ).join('');
}

/**
 * 渲染收藏商品选项
 */
function renderFavoriteProductOptions() {
    const favoriteProducts = DataManager.state.products.filter(p => p.isFavorite);
    return favoriteProducts.map(p => 
        `<option value="${p.id}">${p.name}</option>`
    ).join('');
}

/**
 * 渲染日历网格
 */
function renderCalendarGrid() {
    const year = calendarState.currentDate.getFullYear();
    const month = calendarState.currentDate.getMonth();
    
    // 获取该月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 获取第一天是星期几 (0=周日)
    const startDayOfWeek = firstDay.getDay();
    
    // 获取该月天数
    const daysInMonth = lastDay.getDate();
    
    // 获取上月天数（用于填充前面的空白）
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    let html = '';
    
    // 星期标题
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    weekDays.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // 上月日期（灰色显示）
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        html += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
    }
    
    // 当月日期
    const today = DB.getTodayString();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === today;
        
        html += `<div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}" onclick="handleCalendarDayClick('${dateStr}')">
            <span class="day-number">${day}</span>
        </div>`;
    }
    
    // 下月日期（填充剩余格子）
    const totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (startDayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
    }
    
    return html;
}

/**
 * 切换月份
 */
async function changeCalendarMonth(delta) {
    if (delta === 0) {
        calendarState.currentDate = new Date();
    } else {
        calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() + delta);
    }
    
    // 重新渲染日历
    document.getElementById('calendar-month-title').textContent = formatMonthYear(calendarState.currentDate);
    document.getElementById('calendar-grid').innerHTML = renderCalendarGrid();
    
    await updateCalendarStats();
}

/**
 * 处理日历商品选择变化
 */
async function handleCalendarProductChange(productId) {
    calendarState.selectedProductId = productId || null;
    await updateCalendarStats();
}

/**
 * 更新日历统计（只统计收藏商品）
 */
async function updateCalendarStats() {
    const year = calendarState.currentDate.getFullYear();
    const month = calendarState.currentDate.getMonth() + 1;
    
    // 获取收藏商品ID集合
    const favoriteProductIds = new Set(
        DataManager.state.products
            .filter(p => p.isFavorite)
            .map(p => p.id)
    );
    
    // 获取该月所有销量记录
    const monthSales = await DB.sales.getByMonth(year, month);
    
    // 过滤出收藏商品的销量记录
    const favoriteSales = monthSales.filter(record => favoriteProductIds.has(record.productId));
    
    // 计算总销量
    let totalSales = 0;
    let filteredSales = 0;
    
    // 按日期分组统计
    const salesByDate = {};
    
    favoriteSales.forEach(record => {
        totalSales += record.quantity;
        
        if (!calendarState.selectedProductId || record.productId === calendarState.selectedProductId) {
            filteredSales += record.quantity;
        }
        
        if (!salesByDate[record.date]) {
            salesByDate[record.date] = 0;
        }
        salesByDate[record.date] += record.quantity;
    });
    
    // 更新统计显示
    document.getElementById('calendar-total-sales').textContent = totalSales.toLocaleString();
    document.getElementById('calendar-category-sales').textContent = filteredSales.toLocaleString();
    
    // 更新日历格子显示
    document.querySelectorAll('.calendar-day[data-date]').forEach(dayEl => {
        const date = dayEl.dataset.date;
        const sales = salesByDate[date] || 0;

        // 清除之前的销量显示
        const existingBar = dayEl.querySelector('.sales-bar');
        if (existingBar) {
            existingBar.remove();
        }
        dayEl.classList.remove('has-sales');

        if (sales > 0) {
            dayEl.classList.add('has-sales');
            dayEl.innerHTML += `<div class="sales-bar"></div><span class="sales-count">${sales}</span>`;
        }
    });
}

/**
 * 处理日历日期点击
 */
async function handleCalendarDayClick(date) {
    calendarState.selectedDate = date;
    
    // 获取收藏商品ID集合
    const favoriteProductIds = new Set(
        DataManager.state.products
            .filter(p => p.isFavorite)
            .map(p => p.id)
    );
    
    // 获取该日期的销量记录（只包含收藏商品）
    const daySales = await DB.sales.getByDate(date);
    const favoriteDaySales = daySales.filter(record => favoriteProductIds.has(record.productId));
    
    // 获取收藏商品名称映射
    const productMap = {};
    DataManager.state.products
        .filter(p => p.isFavorite)
        .forEach(p => {
            productMap[p.id] = p.name;
        });
    
    // 计算总销量
    const totalDaySales = favoriteDaySales.reduce((sum, s) => sum + s.quantity, 0);
    
    // 显示该日期的销量详情
    UI.showModal(`${date} 销量详情（收藏商品）`, `
        <div class="form-group">
            <label>当日收藏商品总销量</label>
            <input type="text" value="${totalDaySales}" readonly style="font-size: 24px; font-weight: bold; text-align: center;">
        </div>
        <div class="form-group">
            <label>详细记录</label>
            ${favoriteDaySales.length > 0 ? `
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>商品</th>
                            <th>销量</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${favoriteDaySales.map(record => `
                            <tr>
                                <td>${productMap[record.productId] || '未知商品'}</td>
                                <td>${record.quantity}</td>
                                <td>
                                    <button class="action-btn delete" onclick="handleDeleteDaySales('${record.id}', '${date}')">删除</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p style="color: var(--text-muted);">当日暂无收藏商品销量记录</p>'}
        </div>
        <div class="form-group">
            <label>添加销量记录（收藏商品）</label>
            <div class="form-row">
                <div class="form-group" style="flex: 2;">
                    <select id="day-sales-product">
                        ${renderFavoriteProductOptions()}
                    </select>
                </div>
                <div class="form-group" style="flex: 1;">
                    <input type="number" id="day-sales-quantity" placeholder="销量" min="0">
                </div>
                <div class="form-group" style="flex: 1;">
                    <button type="button" class="btn submit" onclick="handleDaySalesSave('${date}')">保存</button>
                </div>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn cancel" onclick="showSalesCalendarModal()">返回日历</button>
        </div>
    `);
}

/**
 * 处理日期销量保存
 */
async function handleDaySalesSave(date) {
    const productSelect = document.getElementById('day-sales-product');
    const quantityInput = document.getElementById('day-sales-quantity');
    
    const productId = productSelect.value;
    const quantity = parseInt(quantityInput.value);
    
    if (!productId || isNaN(quantity) || quantity < 0) {
        alert('请选择商品并输入有效的销量');
        return;
    }
    
    await DB.sales.set(productId, date, quantity);
    await DataManager.loadSales();
    
    // 刷新详情弹窗
    handleCalendarDayClick(date);
    UI.updateStatistics();
}

/**
 * 处理删除日期销量
 */
async function handleDeleteDaySales(recordId, date) {
    if (!confirm('确定要删除这条销量记录吗？')) return;
    
    await DB.sales.delete(recordId);
    await DataManager.loadSales();
    
    // 刷新详情弹窗
    handleCalendarDayClick(date);
    UI.updateStatistics();
}

/**
 * 处理快速销量保存
 */
async function handleQuickSalesSave() {
    const productSelect = document.getElementById('quick-sales-product');
    const dateInput = document.getElementById('quick-sales-date');
    const quantityInput = document.getElementById('quick-sales-quantity');
    
    const productId = productSelect.value;
    const date = dateInput.value;
    const quantity = parseInt(quantityInput.value);
    
    if (!productId || !date || isNaN(quantity) || quantity < 0) {
        alert('请选择商品并输入有效的日期和销量');
        return;
    }
    
    await DB.sales.set(productId, date, quantity);
    await DataManager.loadSales();
    
    // 清空输入
    quantityInput.value = '';
    
    // 更新日历显示
    await updateCalendarStats();
    UI.updateStatistics();
    
    alert('销量记录已保存');
}

// 导出日历函数
window.Calendar = {
    show: showSalesCalendarModal,
    changeMonth: changeCalendarMonth,
    handleProductChange: handleCalendarProductChange,
    handleDayClick: handleCalendarDayClick,
    handleDaySalesSave,
    handleDeleteDaySales,
    handleQuickSalesSave
};
