/**
 * Amazon POM Manager - JSON数据加载器
 * 用于从JSON文件加载初始数据
 */

const JSONDataLoader = {
    /**
     * 检查是否存在JSON数据文件
     */
    async hasJSONData() {
        try {
            const response = await fetch('data/products.json');
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    /**
     * 从JSON文件加载数据
     */
    async load() {
        try {
            console.log('检查JSON数据文件...');
            
            // 检查数据文件是否存在
            if (!await this.hasJSONData()) {
                console.log('未找到JSON数据文件，跳过加载');
                return false;
            }

            console.log('发现JSON数据文件，开始加载...');

            // 先清空所有现有数据
            console.log('清空现有数据...');
            await DB.clearAll();

            // 加载商品数据
            const products = await this.loadJSON('data/products.json');
            if (products && products.length > 0) {
                console.log(`加载 ${products.length} 个商品`);
                for (const product of products) {
                    // 直接使用IndexedDB添加，避免自动生成ID
                    await this.addProductDirectly(product);
                }
            }

            // 加载分类数据
            const categories = await this.loadJSON('data/categories.json');
            if (categories && categories.length > 0) {
                console.log(`加载 ${categories.length} 个分类`);
                for (const category of categories) {
                    await this.addCategoryDirectly(category);
                }
            }

            // 加载任务状态数据
            const taskStatus = await this.loadJSON('data/taskStatus.json');
            if (taskStatus && Object.keys(taskStatus).length > 0) {
                console.log(`加载 ${Object.keys(taskStatus).length} 个任务状态`);
                for (const [productId, status] of Object.entries(taskStatus)) {
                    await this.addTaskStatusDirectly(status);
                }
            }

            // 加载销量数据（如果有）
            const sales = await this.loadJSON('data/sales.json');
            if (sales && sales.length > 0) {
                console.log(`加载 ${sales.length} 条销量记录`);
                for (const sale of sales) {
                    await this.addSaleDirectly(sale);
                }
            }

            console.log('JSON数据加载完成');
            
            // 标记已加载，避免重复加载
            localStorage.setItem('jsonDataLoaded', 'true');
            
            return true;
        } catch (error) {
            console.error('加载JSON数据失败:', error);
            return false;
        }
    },

    /**
     * 直接添加商品到数据库（保留原始ID）
     */
    async addProductDirectly(product) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products', 'taskStatus'], 'readwrite');
            const productStore = transaction.objectStore('products');
            const taskStore = transaction.objectStore('taskStatus');

            // 确保商品有所有必要字段
            const newProduct = {
                ...product,
                isFavorite: product.isFavorite || false,
                isArchived: product.isArchived || false,
                createdAt: product.createdAt || new Date().toISOString()
            };

            const productRequest = productStore.add(newProduct);
            productRequest.onsuccess = () => {
                // 如果商品是收藏状态，初始化任务状态
                if (newProduct.isFavorite) {
                    const taskStatus = {
                        productId: newProduct.id,
                        mainImage: { status: 'pending', lastUpdated: null },
                        aPlusImage: { status: 'pending', lastUpdated: null },
                        autoAd: { status: 'pending', lastUpdated: null },
                        manualAd: { status: 'pending', lastUpdated: null },
                        coupon: { status: 'pending', lastUpdated: null },
                        underline: { status: 'pending', lastUpdated: null }
                    };
                    taskStore.add(taskStatus);
                }
                resolve(newProduct);
            };
            productRequest.onerror = () => reject(productRequest.error);
        });
    },

    /**
     * 直接添加分类到数据库
     */
    async addCategoryDirectly(category) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['categories'], 'readwrite');
            const store = transaction.objectStore('categories');
            
            const newCategory = {
                ...category,
                createdAt: category.createdAt || new Date().toISOString()
            };
            
            const request = store.add(newCategory);
            request.onsuccess = () => resolve(newCategory);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * 直接添加任务状态到数据库
     */
    async addTaskStatusDirectly(status) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['taskStatus'], 'readwrite');
            const store = transaction.objectStore('taskStatus');
            
            const request = store.add(status);
            request.onsuccess = () => resolve(status);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * 直接添加销量记录到数据库
     */
    async addSaleDirectly(sale) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['sales'], 'readwrite');
            const store = transaction.objectStore('sales');
            
            const request = store.add(sale);
            request.onsuccess = () => resolve(sale);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * 加载单个JSON文件
     */
    async loadJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.log(`文件不存在: ${url}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`加载 ${url} 失败:`, error);
            return null;
        }
    },

    /**
     * 重置加载标记（用于重新加载）
     */
    reset() {
        localStorage.removeItem('jsonDataLoaded');
    },

    /**
     * 检查是否已经加载过JSON数据
     */
    isLoaded() {
        return localStorage.getItem('jsonDataLoaded') === 'true';
    }
};

// 导出到全局
window.JSONDataLoader = JSONDataLoader;
