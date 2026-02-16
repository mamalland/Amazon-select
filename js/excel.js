/**
 * Amazon POM Manager - Excel 导入导出模块
 */

/**
 * 导出数据到 Excel
 */
function exportToExcel() {
    const data = DataManager.exportAllData();
    
    if (data.length === 0) {
        alert('没有数据可导出');
        return;
    }

    // 准备导出数据
    const exportData = data.map(item => ({
        'ASIN': item.asin,
        '类目': item.category,
        '小类名称': item.subCategory || '',
        '商品名称': item.name,
        '商品图片URL': item.imageUrl || '',
        '商品链接': item.productUrl || '',
        '价格': item.price,
        '月销量': item.monthlySales,
        '销售额': item.price * item.monthlySales,
        '毛利率(%)': item.profitMargin || '',
        '上架日期': item.launchDate || '',
        '评分': item.rating || '',
        '评论数': item.reviewCount || '',
        '子体数量': item.childCount,
        '包装尺寸长(cm)': item.dimensions?.length || '',
        '包装尺寸宽(cm)': item.dimensions?.width || '',
        '包装尺寸高(cm)': item.dimensions?.height || '',
        '商品重量(g)': item.weightG || '',
        'FBA运费': item.fbaFee || '',
        '收藏': item.isFavorite,
        '当月销量': item.currentMonthSales || 0, // 汇总当月所有销量
        '累计销量': item.totalSales,
        '首图状态': formatStatus(item.mainImageStatus),
        'A+图状态': formatStatus(item.aPlusImageStatus),
        '自动广告状态': formatStatus(item.autoAdStatus),
        '手动广告状态': formatStatus(item.manualAdStatus),
        '优惠券状态': formatStatus(item.couponStatus),
        '下划线状态': formatStatus(item.underlineStatus),
        '创建时间': item.createdAt
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // 设置列宽
    const colWidths = [
        { wch: 15 }, // ASIN
        { wch: 12 }, // 类目
        { wch: 40 }, // 商品名称
        { wch: 50 }, // 商品图片URL
        { wch: 50 }, // 商品链接
        { wch: 10 }, // 价格
        { wch: 10 }, // 月销量
        { wch: 12 }, // 销售额
        { wch: 10 }, // 毛利率(%)
        { wch: 12 }, // 上架日期
        { wch: 8 },  // 评分
        { wch: 10 }, // 评论数
        { wch: 10 }, // 子体数量
        { wch: 12 }, // 包装尺寸长
        { wch: 12 }, // 包装尺寸宽
        { wch: 12 }, // 包装尺寸高
        { wch: 12 }, // 商品重量(g)
        { wch: 10 }, // FBA运费
        { wch: 8 },  // 收藏
        { wch: 10 }, // 当月销量
        { wch: 10 }, // 累计销量
        { wch: 10 }, // 首图状态
        { wch: 10 }, // A+图状态
        { wch: 12 }, // 自动广告状态
        { wch: 12 }, // 手动广告状态
        { wch: 12 }, // 优惠券状态
        { wch: 12 }, // 下划线状态
        { wch: 20 }  // 创建时间
    ];
    ws['!cols'] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '商品数据');

    // 生成文件名
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Amazon_POM_商品数据_${dateStr}.xlsx`;

    // 下载文件
    XLSX.writeFile(wb, fileName);
}

/**
 * 格式化状态
 */
function formatStatus(status) {
    switch (status) {
        case 'done': return '当日完成';
        case 'locked': return '长期锁定';
        default: return '待办';
    }
}

/**
 * 显示导入弹窗
 */
function showImportModal() {
    UI.showModal('导入 Excel', `
        <div class="form-group">
            <label>选择 Excel 文件</label>
            <input type="file" id="import-file" accept=".xlsx,.xls,.csv" style="padding: 10px;">
            <p style="color: var(--text-muted); font-size: 12px; margin-top: 8px;">
                支持 .xlsx, .xls, .csv 格式
            </p>
        </div>
        <div class="form-group">
            <label>导入说明</label>
            <div style="background-color: var(--bg-secondary); padding: 16px; border-radius: 8px; font-size: 13px;">
                <p style="margin-bottom: 8px;">Excel 文件需包含以下列：</p>
                <ul style="margin-left: 20px; color: var(--text-secondary);">
                    <li>类目 - 商品分类</li>
                    <li>商品名称 - 商品名称（必填）</li>
                    <li>商品图片URL - 商品图片链接（可选）</li>
                    <li>商品链接 - 商品详情页链接（可选）</li>
                    <li>价格 - 商品价格</li>
                    <li>月销量 - 月销量数据</li>
                    <li>毛利率(%) - 毛利率百分比（可选）</li>
                    <li>上架日期 - 格式：YYYY-MM-DD（可选）</li>
                    <li>评分 - 1-5分（可选）</li>
                    <li>评论数 - 评论数量（可选）</li>
                    <li>子体数量 - 子体数量</li>
                    <li>包装尺寸长(cm)/宽(cm)/高(cm) - 厘米单位（可选）</li>
                    <li>商品重量(g) - 克单位（可选）</li>
                </ul>
                <p style="margin-top: 8px; color: var(--text-secondary);">
                    如果商品名称已存在，将更新现有商品数据。
                </p>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn cancel" onclick="closeModal()">取消</button>
            <button type="button" class="btn submit" onclick="handleImport()">导入</button>
        </div>
    `);
}

/**
 * 处理导入
 */
async function handleImport() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];

    if (!file) {
        alert('请选择要导入的文件');
        return;
    }

    try {
        const data = await readExcelFile(file);
        const results = await processImportData(data);

        // 显示导入结果
        UI.showModal('导入结果', `
            <div style="text-align: center; padding: 20px;">
                <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: bold; color: var(--status-done);">${results.added}</div>
                        <div style="color: var(--text-muted);">新增商品</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: bold; color: var(--status-locked);">${results.updated}</div>
                        <div style="color: var(--text-muted);">更新商品</div>
                    </div>
                </div>
                ${results.errors.length > 0 ? `
                    <div style="text-align: left; margin-top: 20px;">
                        <p style="color: var(--status-todo); margin-bottom: 8px;">导入失败的记录：</p>
                        <ul style="font-size: 12px; color: var(--text-secondary); max-height: 150px; overflow-y: auto;">
                            ${results.errors.map(e => `<li>${e.name}: ${e.error}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            <div class="form-actions">
                <button type="button" class="btn submit" onclick="closeModal(); UI.renderProductTable(); UI.renderCategoryNav(); UI.updateStatistics();">确定</button>
            </div>
        `);

    } catch (error) {
        alert('导入失败：' + error.message);
    }
}

/**
 * 读取 Excel 文件
 */
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // 读取第一个工作表
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // 转换为 JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * 处理导入数据
 */
async function processImportData(data) {
    if (data.length < 2) {
        return { added: 0, updated: 0, skipped: 0, errors: [] };
    }

    // 解析表头
    const headers = data[0].map(h => String(h).trim());
    
    // 查找列索引
    const getColumnIndex = (name) => headers.findIndex(h => h.includes(name));
    
    const colIndex = {
        asin: getColumnIndex('ASIN'),
        category: getColumnIndex('类目'),
        name: getColumnIndex('商品名称'),
        imageUrl: getColumnIndex('图片') !== -1 ? getColumnIndex('图片') : getColumnIndex('商品图片URL'),
        productUrl: getColumnIndex('链接') !== -1 ? getColumnIndex('链接') : getColumnIndex('商品链接'),
        subCategory: getColumnIndex('小类') !== -1 ? getColumnIndex('小类') : getColumnIndex('小类名称'),
        price: getColumnIndex('价格'),
        monthlySales: getColumnIndex('月销量'),
        profitMargin: getColumnIndex('毛利率') !== -1 ? getColumnIndex('毛利率') : getColumnIndex('毛利率(%)'),
        launchDate: getColumnIndex('上架日期'),
        rating: getColumnIndex('评分'),
        reviewCount: getColumnIndex('评论数'),
        childCount: getColumnIndex('子体数量'),
        dimLength: getColumnIndex('长') !== -1 ? getColumnIndex('长') : getColumnIndex('包装尺寸长'),
        dimWidth: getColumnIndex('宽') !== -1 ? getColumnIndex('宽') : getColumnIndex('包装尺寸宽'),
        dimHeight: getColumnIndex('高') !== -1 ? getColumnIndex('高') : getColumnIndex('包装尺寸高'),
        weightG: getColumnIndex('重量(g)') !== -1 ? getColumnIndex('重量(g)') : getColumnIndex('商品重量(g)'),
        fbaFee: getColumnIndex('FBA') !== -1 ? getColumnIndex('FBA') : getColumnIndex('FBA运费'),
        isFavorite: getColumnIndex('收藏'),
        currentMonthSales: getColumnIndex('当月销量'),
        isArchived: getColumnIndex('归档'),
        mainImage: getColumnIndex('首图'),
        aPlusImage: getColumnIndex('A+图'),
        autoAd: getColumnIndex('自动广告'),
        manualAd: getColumnIndex('手动广告'),
        coupon: getColumnIndex('优惠券'),
        underline: getColumnIndex('下划线')
    };

    // 验证必填列
    if (colIndex.name === -1) {
        throw new Error('找不到"商品名称"列');
    }

    const results = {
        added: 0,
        updated: 0,
        skipped: 0,
        errors: []
    };

    // 处理数据行
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        try {
            const productData = {
                asin: colIndex.asin >= 0 ? String(row[colIndex.asin] || '') : '',
                category: colIndex.category >= 0 ? String(row[colIndex.category] || '未分类') : '未分类',
                name: String(row[colIndex.name] || '').trim(),
                imageUrl: colIndex.imageUrl >= 0 ? String(row[colIndex.imageUrl] || '') : '',
                productUrl: colIndex.productUrl >= 0 ? String(row[colIndex.productUrl] || '') : '',
                subCategory: colIndex.subCategory >= 0 ? String(row[colIndex.subCategory] || '') : '',
                price: colIndex.price >= 0 ? parseFloat(row[colIndex.price]) || 0 : 0,
                monthlySales: colIndex.monthlySales >= 0 ? parseInt(row[colIndex.monthlySales]) || 0 : 0,
                childCount: colIndex.childCount >= 0 ? parseInt(row[colIndex.childCount]) || 0 : 0,
                fbaFee: colIndex.fbaFee >= 0 ? parseFloat(row[colIndex.fbaFee]) || null : null,
                profitMargin: colIndex.profitMargin >= 0 ? parseFloat(row[colIndex.profitMargin]) || null : null,
                launchDate: colIndex.launchDate >= 0 ? String(row[colIndex.launchDate] || '') : '',
                rating: colIndex.rating >= 0 ? parseFloat(row[colIndex.rating]) || null : null,
                reviewCount: colIndex.reviewCount >= 0 ? parseInt(row[colIndex.reviewCount]) || null : null
            };
            
            // 包装尺寸
            const dimLength = colIndex.dimLength >= 0 ? parseFloat(row[colIndex.dimLength]) : null;
            const dimWidth = colIndex.dimWidth >= 0 ? parseFloat(row[colIndex.dimWidth]) : null;
            const dimHeight = colIndex.dimHeight >= 0 ? parseFloat(row[colIndex.dimHeight]) : null;
            if (dimLength && dimWidth && dimHeight) {
                productData.dimensions = { length: dimLength, width: dimWidth, height: dimHeight };
            }
            
            // 商品重量（克）
            const weightG = colIndex.weightG >= 0 ? parseFloat(row[colIndex.weightG]) : null;
            productData.weightG = weightG;
            
            // 收藏状态
            const isFavorite = colIndex.isFavorite >= 0 ? String(row[colIndex.isFavorite] || '').trim() : '';
            productData.isFavorite = isFavorite === '是';
            
            // 归档状态
            const isArchived = colIndex.isArchived >= 0 ? String(row[colIndex.isArchived] || '').trim() : '';
            productData.isArchived = isArchived === '是';

            if (!productData.name) {
                results.errors.push({ name: `第${i + 1}行`, error: '商品名称为空' });
                continue;
            }

            // 检查是否已存在
            const existing = DataManager.state.products.find(p => p.name === productData.name);
            let productId;

            if (existing) {
                // 更新现有商品
                existing.asin = productData.asin || existing.asin;
                existing.category = productData.category;
                existing.subCategory = productData.subCategory || existing.subCategory;
                existing.imageUrl = productData.imageUrl || existing.imageUrl;
                existing.productUrl = productData.productUrl || existing.productUrl;
                existing.price = productData.price;
                existing.monthlySales = productData.monthlySales;
                existing.childCount = productData.childCount;
                existing.fbaFee = productData.fbaFee || existing.fbaFee;
                existing.isFavorite = productData.isFavorite;
                existing.isArchived = productData.isArchived;
                
                // 更新新属性
                if (productData.profitMargin !== null) existing.profitMargin = productData.profitMargin;
                if (productData.launchDate) existing.launchDate = productData.launchDate;
                if (productData.rating !== null) existing.rating = productData.rating;
                if (productData.reviewCount !== null) existing.reviewCount = productData.reviewCount;
                
                // 更新包装尺寸
                if (productData.dimensions) {
                    existing.dimensions = productData.dimensions;
                }
                
                // 更新重量
                if (productData.weightG) {
                    existing.weightG = productData.weightG;
                }
                
                await DB.products.update(existing);
                productId = existing.id;
                results.updated++;
            } else {
                // 添加新商品
                productId = await DB.products.add(productData);
                results.added++;
            }
            
            // 处理运维状态（只有收藏商品才处理）
            if (productData.isFavorite) {
                const taskStatus = {
                    productId: productId,
                    mainImage: parseTaskStatus(row[colIndex.mainImage]),
                    aPlusImage: parseTaskStatus(row[colIndex.aPlusImage]),
                    autoAd: parseTaskStatus(row[colIndex.autoAd]),
                    manualAd: parseTaskStatus(row[colIndex.manualAd]),
                    coupon: parseTaskStatus(row[colIndex.coupon]),
                    underline: parseTaskStatus(row[colIndex.underline])
                };
                
                // 保存任务状态
                await DB.tasks.set(productId, taskStatus);
                
                // 处理当月销量（只有收藏商品才处理）
                const currentMonthSales = colIndex.currentMonthSales >= 0 ? 
                    parseInt(row[colIndex.currentMonthSales]) : null;
                
                if (currentMonthSales && currentMonthSales > 0) {
                    // 获取当月第一天
                    const today = new Date();
                    const firstDayOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
                    
                    // 保存销量记录到当月第一天
                    await DB.sales.set(productId, firstDayOfMonth, currentMonthSales);
                }
            }

        } catch (error) {
            results.errors.push({ name: `第${i + 1}行`, error: error.message });
        }
    }

    // 重新加载数据
    await DataManager.loadProducts();
    await DataManager.loadCategories();
    await DataManager.loadTaskStatus();

    return results;
}

/**
 * 解析运维状态（将中文状态转换为系统状态）
 */
function parseTaskStatus(value) {
    if (value === undefined || value === null) {
        return { status: 'pending', lastUpdated: new Date().toISOString() };
    }
    
    const statusStr = String(value).trim();
    
    // 映射中文状态到系统状态
    const statusMap = {
        '待办': 'pending',
        '完成': 'done',
        '锁定': 'locked',
        '是': 'done',      // 兼容旧版"是"
        '否': 'pending'    // 兼容旧版"否"
    };
    
    const status = statusMap[statusStr] || 'pending';
    
    return {
        status: status,
        lastUpdated: new Date().toISOString()
    };
}

/**
 * 下载导入模板
 */
function downloadTemplate() {
    const templateData = [
        {
            'ASIN': 'B08N5WRWNW',
            '类目': '电子产品',
            '小类名称': '蓝牙耳机',
            '商品名称': '示例商品名称',
            '商品图片URL': 'https://example.com/image.jpg',
            '商品链接': 'https://www.amazon.com/dp/B08N5WRWNW',
            '价格': 29.99,
            '月销量': 1000,
            '毛利率(%)': 35.5,
            '上架日期': '2025-01-15',
            '评分': 4.5,
            '评论数': 128,
            '子体数量': 5,
            '包装尺寸长(cm)': 10,
            '包装尺寸宽(cm)': 8,
            '包装尺寸高(cm)': 5,
            '商品重量(g)': 150,
            'FBA运费': 3.5
        }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // 设置列宽
    ws['!cols'] = [
        { wch: 15 }, // ASIN
        { wch: 12 }, // 类目
        { wch: 15 }, // 小类名称
        { wch: 40 }, // 商品名称
        { wch: 50 }, // 商品图片URL
        { wch: 50 }, // 商品链接
        { wch: 10 }, // 价格
        { wch: 10 }, // 月销量
        { wch: 12 }, // 毛利率(%)
        { wch: 12 }, // 上架日期
        { wch: 8 },  // 评分
        { wch: 10 }, // 评论数
        { wch: 10 }, // 子体数量
        { wch: 15 }, // 包装尺寸长
        { wch: 15 }, // 包装尺寸宽
        { wch: 15 }, // 包装尺寸高
        { wch: 12 }, // 商品重量
        { wch: 10 }  // FBA运费
    ];

    XLSX.utils.book_append_sheet(wb, ws, '导入模板');
    XLSX.writeFile(wb, 'Amazon_POM_导入模板.xlsx');
}

// 导出 Excel 函数
window.ExcelHandler = {
    export: exportToExcel,
    showImport: showImportModal,
    handleImport,
    downloadTemplate
};
