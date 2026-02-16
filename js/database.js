/**
 * Amazon POM Manager - IndexedDB 数据库层
 */

const DB_NAME = 'AmazonPOMDB';
const DB_VERSION = 1;

// 数据库连接实例
let db = null;

/**
 * 初始化数据库
 */
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // 商品表
            if (!database.objectStoreNames.contains('products')) {
                const productStore = database.createObjectStore('products', { keyPath: 'id' });
                productStore.createIndex('category', 'category', { unique: false });
                productStore.createIndex('isFavorite', 'isFavorite', { unique: false });
                productStore.createIndex('name', 'name', { unique: false });
            }

            // 销量记录表
            if (!database.objectStoreNames.contains('sales')) {
                const salesStore = database.createObjectStore('sales', { keyPath: 'id' });
                salesStore.createIndex('productId', 'productId', { unique: false });
                salesStore.createIndex('date', 'date', { unique: false });
                salesStore.createIndex('productId_date', ['productId', 'date'], { unique: true });
            }

            // 分类表
            if (!database.objectStoreNames.contains('categories')) {
                database.createObjectStore('categories', { keyPath: 'id' });
            }

            // 运维任务状态表
            if (!database.objectStoreNames.contains('taskStatus')) {
                const taskStore = database.createObjectStore('taskStatus', { keyPath: 'productId' });
                taskStore.createIndex('mainImage', 'mainImage', { unique: false });
                taskStore.createIndex('aPlusImage', 'aPlusImage', { unique: false });
            }
        };
    });
}

/**
 * 生成唯一ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 获取当前日期字符串 YYYY-MM-DD
 */
function getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ==================== 商品操作 ====================

/**
 * 添加商品
 */
function addProduct(product) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products', 'taskStatus'], 'readwrite');
        const productStore = transaction.objectStore('products');
        const taskStore = transaction.objectStore('taskStatus');

        const newProduct = {
            id: generateId(),
            ...product,
            isFavorite: product.isFavorite || false,
            createdAt: new Date().toISOString()
        };

        // 初始化任务状态
        const taskStatus = {
            productId: newProduct.id,
            mainImage: { status: 'pending', lastUpdated: null },
            aPlusImage: { status: 'pending', lastUpdated: null },
            autoAd: { status: 'pending', lastUpdated: null },
            manualAd: { status: 'pending', lastUpdated: null },
            coupon: { status: 'pending', lastUpdated: null },
            underline: { status: 'pending', lastUpdated: null }
        };

        const productRequest = productStore.add(newProduct);
        productRequest.onsuccess = () => {
            taskStore.add(taskStatus);
            resolve(newProduct);
        };
        productRequest.onerror = () => reject(productRequest.error);
    });
}

/**
 * 更新商品
 */
function updateProduct(product) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');

        const request = store.put(product);
        request.onsuccess = () => resolve(product);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 删除商品
 */
function deleteProduct(productId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products', 'taskStatus', 'sales'], 'readwrite');
        const productStore = transaction.objectStore('products');
        const taskStore = transaction.objectStore('taskStatus');
        const salesStore = transaction.objectStore('sales');

        // 删除商品
        productStore.delete(productId);

        // 删除任务状态
        taskStore.delete(productId);

        // 删除相关销量记录
        const salesIndex = salesStore.index('productId');
        const salesRequest = salesIndex.openCursor(IDBKeyRange.only(productId));
        salesRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                salesStore.delete(cursor.primaryKey);
                cursor.continue();
            }
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * 获取所有商品
 */
function getAllProducts() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 根据ID获取商品
 */
function getProductById(productId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products'], 'readonly');
        const store = transaction.objectStore('products');
        const request = store.get(productId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ==================== 任务状态操作 ====================

/**
 * 获取任务状态
 */
function getTaskStatus(productId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['taskStatus'], 'readonly');
        const store = transaction.objectStore('taskStatus');
        const request = store.get(productId);

        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result);
            } else {
                // 如果没有找到，创建默认状态
                resolve({
                    productId: productId,
                    mainImage: { status: 'pending', lastUpdated: null },
                    aPlusImage: { status: 'pending', lastUpdated: null },
                    autoAd: { status: 'pending', lastUpdated: null },
                    manualAd: { status: 'pending', lastUpdated: null },
                    coupon: { status: 'pending', lastUpdated: null },
                    underline: { status: 'pending', lastUpdated: null }
                });
            }
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * 更新任务状态
 */
function updateTaskStatus(productId, taskName, status) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['taskStatus'], 'readwrite');
        const store = transaction.objectStore('taskStatus');

        const request = store.get(productId);
        request.onsuccess = () => {
            let taskStatus = request.result;
            if (!taskStatus) {
                taskStatus = {
                    productId: productId,
                    mainImage: { status: 'pending', lastUpdated: null },
                    aPlusImage: { status: 'pending', lastUpdated: null },
                    autoAd: { status: 'pending', lastUpdated: null },
                    manualAd: { status: 'pending', lastUpdated: null },
                    coupon: { status: 'pending', lastUpdated: null },
                    underline: { status: 'pending', lastUpdated: null }
                };
            }

            // 使用本地时间格式 YYYY-MM-DD HH:mm:ss
            const now = new Date();
            const localDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            taskStatus[taskName] = {
                status: status,
                lastUpdated: localDateTime
            };

            const putRequest = store.put(taskStatus);
            putRequest.onsuccess = () => resolve(taskStatus);
            putRequest.onerror = () => reject(putRequest.error);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * 获取所有任务状态
 */
function getAllTaskStatus() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['taskStatus'], 'readonly');
        const store = transaction.objectStore('taskStatus');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 设置任务状态（用于导入）
 */
function setTaskStatus(productId, taskStatus) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['taskStatus'], 'readwrite');
        const store = transaction.objectStore('taskStatus');

        // 确保 taskStatus 包含 productId
        const statusToStore = {
            ...taskStatus,
            productId: productId
        };

        const request = store.put(statusToStore);
        request.onsuccess = () => resolve(statusToStore);
        request.onerror = () => reject(request.error);
    });
}

// ==================== 销量记录操作 ====================

/**
 * 添加/更新销量记录
 */
function setSalesRecord(productId, date, quantity) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readwrite');
        const store = transaction.objectStore('sales');
        const index = store.index('productId_date');

        // 检查是否已存在
        const getRequest = index.get([productId, date]);
        getRequest.onsuccess = () => {
            const existing = getRequest.result;
            if (existing) {
                // 更新
                existing.quantity = quantity;
                existing.updatedAt = new Date().toISOString();
                const putRequest = store.put(existing);
                putRequest.onsuccess = () => resolve(existing);
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                // 新增
                const newRecord = {
                    id: generateId(),
                    productId: productId,
                    date: date,
                    quantity: quantity,
                    createdAt: new Date().toISOString()
                };
                const addRequest = store.add(newRecord);
                addRequest.onsuccess = () => resolve(newRecord);
                addRequest.onerror = () => reject(addRequest.error);
            }
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * 获取某商品的销量记录
 */
function getSalesByProduct(productId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readonly');
        const store = transaction.objectStore('sales');
        const index = store.index('productId');
        const request = index.getAll(productId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 获取某天的销量记录
 */
function getSalesByDate(date) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readonly');
        const store = transaction.objectStore('sales');
        const index = store.index('date');
        const request = index.getAll(date);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 获取某月所有销量记录
 */
function getSalesByMonth(year, month) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readonly');
        const store = transaction.objectStore('sales');
        const request = store.openCursor();

        const results = [];
        const prefix = `${year}-${String(month).padStart(2, '0')}`;

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.date.startsWith(prefix)) {
                    results.push(cursor.value);
                }
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * 获取所有销量记录
 */
function getAllSales() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readonly');
        const store = transaction.objectStore('sales');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 删除销量记录
 */
function deleteSalesRecord(recordId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readwrite');
        const store = transaction.objectStore('sales');
        const request = store.delete(recordId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ==================== 分类操作 ====================

/**
 * 添加分类
 */
function addCategory(name) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');

        const category = {
            id: generateId(),
            name: name,
            createdAt: new Date().toISOString()
        };

        const request = store.add(category);
        request.onsuccess = () => resolve(category);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 更新分类
 */
function updateCategory(category) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');

        const request = store.put(category);
        request.onsuccess = () => resolve(category);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 删除分类
 */
function deleteCategory(categoryId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');

        const request = store.delete(categoryId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * 获取所有分类
 */
function getAllCategories() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readonly');
        const store = transaction.objectStore('categories');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * 清空所有分类
 */
function clearAllCategories() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * 清空所有数据
 */
function clearAllData() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['products', 'sales', 'categories', 'taskStatus'], 'readwrite');
        
        transaction.objectStore('products').clear();
        transaction.objectStore('sales').clear();
        transaction.objectStore('categories').clear();
        transaction.objectStore('taskStatus').clear();

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * 清空销量记录
 */
function clearAllSales() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readwrite');
        const store = transaction.objectStore('sales');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * 清空任务状态
 */
function clearAllTaskStatus() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['taskStatus'], 'readwrite');
        const store = transaction.objectStore('taskStatus');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// 导出数据库函数
window.DB = {
    init: initDatabase,
    generateId,
    getTodayString,
    get instance() { return db; }, // 暴露数据库实例
    products: {
        add: addProduct,
        update: updateProduct,
        delete: deleteProduct,
        getAll: getAllProducts,
        getById: getProductById
    },
    tasks: {
        get: getTaskStatus,
        update: updateTaskStatus,
        getAll: getAllTaskStatus,
        set: setTaskStatus,
        clear: clearAllTaskStatus
    },
    sales: {
        set: setSalesRecord,
        getByProduct: getSalesByProduct,
        getByDate: getSalesByDate,
        getByMonth: getSalesByMonth,
        getAll: getAllSales,
        delete: deleteSalesRecord,
        clear: clearAllSales
    },
    categories: {
        add: addCategory,
        update: updateCategory,
        delete: deleteCategory,
        getAll: getAllCategories,
        clear: clearAllCategories
    },
    clearAll: clearAllData
};
