/**
 * Amazon POM Manager - 示例数据
 * 首次加载时自动导入这些示例商品
 */

const SAMPLE_PRODUCTS = [
    {
        asin: "B08N5WRWNW",
        category: "电子产品",
        name: "无线蓝牙耳机 Pro",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
        price: 49.99,
        monthlySales: 2500,
        childCount: 3,
        weight: "0.33 pounds (149.69 g)",
        fbaFee: 3.45,
        isFavorite: true
    },
    {
        asin: "B08N5M7S6K",
        category: "电子产品",
        name: "便携充电宝 20000mAh",
        imageUrl: "https://images.unsplash.com/photo-1609592424308-64674c87541e?w=200&h=200&fit=crop",
        price: 35.99,
        monthlySales: 1800,
        childCount: 2,
        weight: "0.88 pounds (399.16 g)",
        fbaFee: 4.12,
        isFavorite: false
    },
    {
        asin: "B08N5L8X9Y",
        category: "家居用品",
        name: "智能LED台灯",
        imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200&h=200&fit=crop",
        price: 29.99,
        monthlySales: 1200,
        childCount: 1,
        weight: "1.21 pounds (548.85 g)",
        fbaFee: 4.95,
        isFavorite: true
    },
    {
        asin: "B08N5K7P4Q",
        category: "家居用品",
        name: "真空收纳袋套装",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
        price: 19.99,
        monthlySales: 3200,
        childCount: 5,
        weight: "0.55 pounds (249.48 g)",
        fbaFee: 3.78,
        isFavorite: false
    },
    {
        asin: "B08N5J6H3W",
        category: "服装配饰",
        name: "运动速干T恤",
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop",
        price: 15.99,
        monthlySales: 4500,
        childCount: 8,
        weight: "0.22 pounds (99.79 g)",
        fbaFee: 2.95,
        isFavorite: true
    },
    {
        asin: "B08N5H5G2R",
        category: "服装配饰",
        name: "防晒渔夫帽",
        imageUrl: "https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=200&h=200&fit=crop",
        price: 12.99,
        monthlySales: 2100,
        childCount: 4,
        weight: "0.15 pounds (68.04 g)",
        fbaFee: 2.65,
        isFavorite: false
    },
    {
        asin: "B08N5G4F1E",
        category: "美妆护肤",
        name: "玻尿酸补水面膜",
        imageUrl: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=200&h=200&fit=crop",
        price: 24.99,
        monthlySales: 3800,
        childCount: 3,
        weight: "0.42 pounds (190.51 g)",
        fbaFee: 3.25,
        isFavorite: true
    },
    {
        asin: "B08N5F3D0S",
        category: "美妆护肤",
        name: "维生素C精华液",
        imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop",
        price: 18.99,
        monthlySales: 1500,
        childCount: 1,
        weight: "0.18 pounds (81.65 g)",
        fbaFee: 2.75,
        isFavorite: false
    },
    {
        asin: "B08N5E2C9A",
        category: "运动户外",
        name: "瑜伽垫防滑加厚",
        imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=200&h=200&fit=crop",
        price: 32.99,
        monthlySales: 900,
        childCount: 2,
        weight: "2.15 pounds (975.22 g)",
        fbaFee: 5.85,
        isFavorite: false
    },
    {
        asin: "B08N5D1B8Z",
        category: "运动户外",
        name: "可调节哑铃套装",
        imageUrl: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=200&h=200&fit=crop",
        price: 89.99,
        monthlySales: 600,
        childCount: 1,
        weight: "15.43 pounds (6,998.93 g)",
        fbaFee: 12.50,
        isFavorite: true
    },
    {
        asin: "B08N5C0A7X",
        category: "电子产品",
        name: "Type-C快充数据线",
        imageUrl: "https://images.unsplash.com/photo-1625153669622-870ee3f21430?w=200&h=200&fit=crop",
        price: 9.99,
        monthlySales: 5600,
        childCount: 6,
        weight: "0.08 pounds (36.29 g)",
        fbaFee: 2.15,
        isFavorite: false
    },
    {
        asin: "B08N5B9Z6W",
        category: "家居用品",
        name: "厨房置物架多层",
        imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop",
        price: 42.99,
        monthlySales: 800,
        childCount: 1,
        weight: "3.25 pounds (1,474.18 g)",
        fbaFee: 7.25,
        isFavorite: false
    }
];

const SAMPLE_TASK_STATUS = {
    // 无线蓝牙耳机 Pro - 部分完成
    "sample1": {
        mainImage: { status: "locked", lastUpdated: "2026-02-10T10:00:00Z" },
        aPlusImage: { status: "locked", lastUpdated: "2026-02-10T10:00:00Z" },
        autoAd: { status: "done", lastUpdated: "2026-02-14T08:00:00Z" },
        manualAd: { status: "pending", lastUpdated: null },
        coupon: { status: "done", lastUpdated: "2026-02-14T08:00:00Z" },
        underline: { status: "pending", lastUpdated: null }
    },
    // 便携充电宝 - 全部锁定
    "sample2": {
        mainImage: { status: "locked", lastUpdated: "2026-02-08T10:00:00Z" },
        aPlusImage: { status: "locked", lastUpdated: "2026-02-08T10:00:00Z" },
        autoAd: { status: "locked", lastUpdated: "2026-02-09T10:00:00Z" },
        manualAd: { status: "locked", lastUpdated: "2026-02-09T10:00:00Z" },
        coupon: { status: "locked", lastUpdated: "2026-02-10T10:00:00Z" },
        underline: { status: "locked", lastUpdated: "2026-02-10T10:00:00Z" }
    },
    // 智能LED台灯 - 待办中
    "sample3": {
        mainImage: { status: "pending", lastUpdated: null },
        aPlusImage: { status: "pending", lastUpdated: null },
        autoAd: { status: "pending", lastUpdated: null },
        manualAd: { status: "pending", lastUpdated: null },
        coupon: { status: "pending", lastUpdated: null },
        underline: { status: "pending", lastUpdated: null }
    },
    // 真空收纳袋 - 部分完成
    "sample4": {
        mainImage: { status: "locked", lastUpdated: "2026-02-12T10:00:00Z" },
        aPlusImage: { status: "done", lastUpdated: "2026-02-13T10:00:00Z" },
        autoAd: { status: "pending", lastUpdated: null },
        manualAd: { status: "pending", lastUpdated: null },
        coupon: { status: "pending", lastUpdated: null },
        underline: { status: "pending", lastUpdated: null }
    },
    // 运动速干T恤 - 今日完成部分
    "sample5": {
        mainImage: { status: "done", lastUpdated: "2026-02-14T09:00:00Z" },
        aPlusImage: { status: "done", lastUpdated: "2026-02-14T09:00:00Z" },
        autoAd: { status: "done", lastUpdated: "2026-02-14T09:00:00Z" },
        manualAd: { status: "pending", lastUpdated: null },
        coupon: { status: "pending", lastUpdated: null },
        underline: { status: "pending", lastUpdated: null }
    }
};

const SAMPLE_SALES = [
    // 无线蓝牙耳机 Pro
    { productIndex: 0, date: "2026-02-10", quantity: 85 },
    { productIndex: 0, date: "2026-02-11", quantity: 92 },
    { productIndex: 0, date: "2026-02-12", quantity: 78 },
    { productIndex: 0, date: "2026-02-13", quantity: 105 },
    { productIndex: 0, date: "2026-02-14", quantity: 88 },
    
    // 便携充电宝
    { productIndex: 1, date: "2026-02-10", quantity: 62 },
    { productIndex: 1, date: "2026-02-11", quantity: 58 },
    { productIndex: 1, date: "2026-02-12", quantity: 71 },
    { productIndex: 1, date: "2026-02-13", quantity: 65 },
    { productIndex: 1, date: "2026-02-14", quantity: 54 },
    
    // 智能LED台灯
    { productIndex: 2, date: "2026-02-10", quantity: 42 },
    { productIndex: 2, date: "2026-02-11", quantity: 38 },
    { productIndex: 2, date: "2026-02-12", quantity: 45 },
    { productIndex: 2, date: "2026-02-13", quantity: 51 },
    { productIndex: 2, date: "2026-02-14", quantity: 39 },
    
    // 真空收纳袋
    { productIndex: 3, date: "2026-02-10", quantity: 112 },
    { productIndex: 3, date: "2026-02-11", quantity: 98 },
    { productIndex: 3, date: "2026-02-12", quantity: 125 },
    { productIndex: 3, date: "2026-02-13", quantity: 108 },
    { productIndex: 3, date: "2026-02-14", quantity: 95 },
    
    // 运动速干T恤
    { productIndex: 4, date: "2026-02-10", quantity: 156 },
    { productIndex: 4, date: "2026-02-11", quantity: 142 },
    { productIndex: 4, date: "2026-02-12", quantity: 168 },
    { productIndex: 4, date: "2026-02-13", quantity: 175 },
    { productIndex: 4, date: "2026-02-14", quantity: 148 },
    
    // 防晒渔夫帽
    { productIndex: 5, date: "2026-02-10", quantity: 68 },
    { productIndex: 5, date: "2026-02-11", quantity: 72 },
    { productIndex: 5, date: "2026-02-12", quantity: 65 },
    { productIndex: 5, date: "2026-02-13", quantity: 81 },
    { productIndex: 5, date: "2026-02-14", quantity: 58 },
    
    // 玻尿酸补水面膜
    { productIndex: 6, date: "2026-02-10", quantity: 134 },
    { productIndex: 6, date: "2026-02-11", quantity: 128 },
    { productIndex: 6, date: "2026-02-12", quantity: 145 },
    { productIndex: 6, date: "2026-02-13", quantity: 152 },
    { productIndex: 6, date: "2026-02-14", quantity: 138 },
    
    // 维生素C精华液
    { productIndex: 7, date: "2026-02-10", quantity: 52 },
    { productIndex: 7, date: "2026-02-11", quantity: 48 },
    { productIndex: 7, date: "2026-02-12", quantity: 61 },
    { productIndex: 7, date: "2026-02-13", quantity: 55 },
    { productIndex: 7, date: "2026-02-14", quantity: 49 },
    
    // 瑜伽垫
    { productIndex: 8, date: "2026-02-10", quantity: 32 },
    { productIndex: 8, date: "2026-02-11", quantity: 28 },
    { productIndex: 8, date: "2026-02-12", quantity: 35 },
    { productIndex: 8, date: "2026-02-13", quantity: 31 },
    { productIndex: 8, date: "2026-02-14", quantity: 29 },
    
    // 可调节哑铃套装
    { productIndex: 9, date: "2026-02-10", quantity: 18 },
    { productIndex: 9, date: "2026-02-11", quantity: 22 },
    { productIndex: 9, date: "2026-02-12", quantity: 19 },
    { productIndex: 9, date: "2026-02-13", quantity: 25 },
    { productIndex: 9, date: "2026-02-14", quantity: 21 },
    
    // Type-C快充数据线
    { productIndex: 10, date: "2026-02-10", quantity: 198 },
    { productIndex: 10, date: "2026-02-11", quantity: 215 },
    { productIndex: 10, date: "2026-02-12", quantity: 188 },
    { productIndex: 10, date: "2026-02-13", quantity: 224 },
    { productIndex: 10, date: "2026-02-14", quantity: 201 },
    
    // 厨房置物架
    { productIndex: 11, date: "2026-02-10", quantity: 25 },
    { productIndex: 11, date: "2026-02-11", quantity: 31 },
    { productIndex: 11, date: "2026-02-12", quantity: 28 },
    { productIndex: 11, date: "2026-02-13", quantity: 35 },
    { productIndex: 11, date: "2026-02-14", quantity: 29 }
];

/**
 * 加载示例数据
 */
async function loadSampleData() {
    // 检查是否已有数据
    const existingProducts = await DB.products.getAll();
    if (existingProducts.length > 0) {
        console.log('已有数据，跳过示例数据加载');
        return;
    }

    console.log('正在加载示例数据...');

    // 添加商品
    const productIds = [];
    for (const product of SAMPLE_PRODUCTS) {
        const newProduct = await DB.products.add(product);
        productIds.push(newProduct.id);
    }

    // 添加任务状态（只为前5个商品设置特定状态，其余使用默认）
    const taskStatusKeys = Object.keys(SAMPLE_TASK_STATUS);
    for (let i = 0; i < Math.min(taskStatusKeys.length, productIds.length); i++) {
        const productId = productIds[i];
        const statusKey = taskStatusKeys[i];
        const statusData = SAMPLE_TASK_STATUS[statusKey];
        
        // 更新任务状态
        for (const [taskName, taskState] of Object.entries(statusData)) {
            await DB.tasks.update(productId, taskName, taskState.status);
        }
    }

    // 添加销量记录
    for (const sale of SAMPLE_SALES) {
        if (sale.productIndex < productIds.length) {
            const productId = productIds[sale.productIndex];
            await DB.sales.set(productId, sale.date, sale.quantity);
        }
    }

    console.log('示例数据加载完成');
}

// 导出示例数据函数
window.SampleData = {
    load: loadSampleData,
    products: SAMPLE_PRODUCTS
};
