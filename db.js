// ============= IndexedDB Manager =============
// Обертка для работы с IndexedDB вместо localStorage

class FinanceDB {
    constructor() {
        this.dbName = 'MoliyaFinanceDB';
        this.version = 1;
        this.db = null;
    }

    // Инициализация базы данных
    async init() {
        return new Promise((resolve, reject) => {
            // Проверяем поддержку IndexedDB
            if (!window.indexedDB) {
                console.warn('IndexedDB not supported');
                reject(new Error('IndexedDB not supported'));
                return;
            }
            
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✓ IndexedDB initialized');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Основное хранилище данных
                if (!db.objectStoreNames.contains('appData')) {
                    db.createObjectStore('appData', { keyPath: 'key' });
                }

                // Хранилище транзакций с индексами для быстрого поиска
                if (!db.objectStoreNames.contains('transactions')) {
                    const store = db.createObjectStore('transactions', { keyPath: 'id' });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('category', 'category', { unique: false });
                    store.createIndex('amount', 'amount', { unique: false });
                }

                // Кэш для часто используемых данных
                if (!db.objectStoreNames.contains('cache')) {
                    db.createObjectStore('cache', { keyPath: 'key' });
                }

                console.log('✓ Database structure created');
            };
        });
    }

    // Сохранение данных
    async saveData(key, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['appData'], 'readwrite');
            const store = transaction.objectStore('appData');
            const request = store.put({ key: key, data: data, timestamp: Date.now() });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Загрузка данных
    async loadData(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['appData'], 'readonly');
            const store = transaction.objectStore('appData');
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result ? request.result.data : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Сохранение транзакций (массовое)
    async saveTransactions(transactions) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['transactions'], 'readwrite');
            const store = transaction.objectStore('transactions');

            // Очищаем старые данные
            store.clear();

            // Добавляем новые
            transactions.forEach(t => {
                store.add(t);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Загрузка транзакций с фильтрами
    async loadTransactions(filter = {}) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['transactions'], 'readonly');
            const store = transaction.objectStore('transactions');
            
            let request;
            
            // Используем индексы для быстрого поиска
            if (filter.date) {
                const index = store.index('date');
                request = index.getAll(filter.date);
            } else if (filter.type) {
                const index = store.index('type');
                request = index.getAll(filter.type);
            } else if (filter.category) {
                const index = store.index('category');
                request = index.getAll(filter.category);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => {
                let results = request.result;
                
                // Дополнительная фильтрация
                if (filter.dateRange) {
                    results = results.filter(t => {
                        const date = new Date(t.date);
                        return date >= filter.dateRange.start && date <= filter.dateRange.end;
                    });
                }
                
                if (filter.minAmount !== undefined) {
                    results = results.filter(t => t.amount >= filter.minAmount);
                }
                
                if (filter.maxAmount !== undefined) {
                    results = results.filter(t => t.amount <= filter.maxAmount);
                }
                
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Получение транзакций по диапазону дат (быстро)
    async getTransactionsByDateRange(startDate, endDate) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['transactions'], 'readonly');
            const store = transaction.objectStore('transactions');
            const index = store.index('date');
            
            const range = IDBKeyRange.bound(
                this.formatDate(startDate),
                this.formatDate(endDate)
            );
            
            const request = index.getAll(range);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Кэширование
    async setCache(key, data, ttl = 300000) { // TTL по умолчанию 5 минут
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = store.put({
                key: key,
                data: data,
                expires: Date.now() + ttl
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getCache(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve(null);
                    return;
                }
                
                // Проверяем срок действия
                if (result.expires < Date.now()) {
                    // Кэш устарел
                    this.clearCache(key);
                    resolve(null);
                } else {
                    resolve(result.data);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async clearCache(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const store = transaction.objectStore('cache');
            const request = key ? store.delete(key) : store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Миграция из localStorage
    async migrateFromLocalStorage() {
        const oldData = localStorage.getItem('financeAppData');
        if (!oldData) return false;

        try {
            const data = JSON.parse(oldData);
            
            // Сохраняем основные данные
            await this.saveData('banks', data.banks || []);
            await this.saveData('cards', data.cards || []);
            await this.saveData('cash', data.cash || []);
            await this.saveData('deposits', data.deposits || []);
            await this.saveData('credits', data.credits || []);
            await this.saveData('budgets', data.budgets || []);
            await this.saveData('goals', data.goals || []);
            await this.saveData('recurring', data.recurring || []);
            await this.saveData('templates', data.templates || []);
            
            // Сохраняем транзакции отдельно для оптимизации
            if (data.transactions && data.transactions.length > 0) {
                await this.saveTransactions(data.transactions);
            }
            
            console.log('✓ Data migrated from localStorage to IndexedDB');
            
            // Создаем бэкап в localStorage на всякий случай
            localStorage.setItem('financeAppData_backup', oldData);
            
            return true;
        } catch (error) {
            console.error('Migration error:', error);
            return false;
        }
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Получение статистики базы данных
    async getStats() {
        const transactions = await this.loadTransactions();
        const banks = await this.loadData('banks') || [];
        const cards = await this.loadData('cards') || [];
        
        return {
            transactions: transactions.length,
            banks: banks.length,
            cards: cards.length,
            dbSize: await this.getDatabaseSize()
        };
    }

    async getDatabaseSize() {
        if ('estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                usageInMB: (estimate.usage / (1024 * 1024)).toFixed(2),
                quotaInMB: (estimate.quota / (1024 * 1024)).toFixed(2)
            };
        }
        return null;
    }
}

// Глобальный экземпляр
window.financeDB = new FinanceDB();

