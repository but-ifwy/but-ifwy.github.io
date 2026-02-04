// ============= Web Worker для тяжелых вычислений =============
// Выполняет расчеты в фоновом потоке, не блокируя UI

self.addEventListener('message', function(e) {
    const { type, data } = e.data;
    
    try {
        let result;
        
        switch(type) {
            case 'calculateStatistics':
                result = calculateStatistics(data);
                break;
                
            case 'generateReport':
                result = generateReport(data);
                break;
                
            case 'analyzeTransactions':
                result = analyzeTransactions(data);
                break;
                
            case 'calculateBudgets':
                result = calculateBudgets(data);
                break;
                
            case 'searchTransactions':
                result = searchTransactions(data.transactions, data.query);
                break;
                
            case 'sortTransactions':
                result = sortTransactions(data.transactions, data.sortBy, data.order);
                break;
                
            default:
                result = { error: 'Unknown task type' };
        }
        
        self.postMessage({ type: type, result: result, success: true });
    } catch (error) {
        self.postMessage({ 
            type: type, 
            error: error.message, 
            success: false 
        });
    }
});

// Расчет статистики
function calculateStatistics(data) {
    const { transactions, period } = data;
    
    const now = new Date();
    const periodStart = getPeriodStart(period, now);
    
    const filtered = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= periodStart && date <= now;
    });
    
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};
    const dailyTotals = {};
    
    filtered.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else if (t.type === 'expense') {
            totalExpense += t.amount;
            
            // По категориям
            if (!categoryTotals[t.category]) {
                categoryTotals[t.category] = 0;
            }
            categoryTotals[t.category] += t.amount;
        }
        
        // По дням
        if (!dailyTotals[t.date]) {
            dailyTotals[t.date] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            dailyTotals[t.date].income += t.amount;
        } else if (t.type === 'expense') {
            dailyTotals[t.date].expense += t.amount;
        }
    });
    
    // Топ категорий
    const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const days = Math.max(1, Math.ceil((now - periodStart) / (1000 * 60 * 60 * 24)));
    
    return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        avgDailyIncome: totalIncome / days,
        avgDailyExpense: totalExpense / days,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0,
        topCategories,
        dailyTotals,
        transactionCount: filtered.length
    };
}

// Генерация отчета
function generateReport(data) {
    const { transactions, startDate, endDate } = data;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filtered = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= start && date <= end;
    });
    
    const stats = calculateStatistics({ 
        transactions: filtered, 
        period: 'custom' 
    });
    
    // Группировка по месяцам
    const monthlyData = {};
    
    filtered.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expense: 0, count: 0 };
        }
        
        if (t.type === 'income') {
            monthlyData[monthKey].income += t.amount;
        } else if (t.type === 'expense') {
            monthlyData[monthKey].expense += t.amount;
        }
        monthlyData[monthKey].count++;
    });
    
    return {
        period: { startDate, endDate },
        summary: stats,
        monthlyData: monthlyData,
        transactions: filtered
    };
}

// Анализ транзакций
function analyzeTransactions(data) {
    const { transactions } = data;
    
    // Находим паттерны
    const patterns = {
        mostExpensiveDay: null,
        mostActiveDay: null,
        averageTransactionSize: 0,
        largestTransaction: null,
        smallestTransaction: null,
        frequentCategories: [],
        timePatterns: {}
    };
    
    if (transactions.length === 0) return patterns;
    
    // Самый дорогой день
    const dayTotals = {};
    transactions.forEach(t => {
        if (t.type === 'expense') {
            if (!dayTotals[t.date]) dayTotals[t.date] = 0;
            dayTotals[t.date] += t.amount;
        }
    });
    
    if (Object.keys(dayTotals).length > 0) {
        const sorted = Object.entries(dayTotals).sort((a, b) => b[1] - a[1]);
        patterns.mostExpensiveDay = { date: sorted[0][0], amount: sorted[0][1] };
    }
    
    // Самый активный день
    const dayCounts = {};
    transactions.forEach(t => {
        if (!dayCounts[t.date]) dayCounts[t.date] = 0;
        dayCounts[t.date]++;
    });
    
    if (Object.keys(dayCounts).length > 0) {
        const sorted = Object.entries(dayCounts).sort((a, b) => b[1] - a[1]);
        patterns.mostActiveDay = { date: sorted[0][0], count: sorted[0][1] };
    }
    
    // Средний размер транзакции
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    patterns.averageTransactionSize = total / transactions.length;
    
    // Самая большая и маленькая транзакция
    const amounts = transactions.map(t => t.amount).sort((a, b) => b - a);
    patterns.largestTransaction = amounts[0];
    patterns.smallestTransaction = amounts[amounts.length - 1];
    
    // Частые категории
    const categoryCounts = {};
    transactions.forEach(t => {
        if (!categoryCounts[t.category]) categoryCounts[t.category] = 0;
        categoryCounts[t.category]++;
    });
    
    patterns.frequentCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));
    
    return patterns;
}

// Расчет бюджетов
function calculateBudgets(data) {
    const { budgets, transactions } = data;
    const now = new Date();
    
    return budgets.map(budget => {
        const periodStart = getPeriodStart(budget.period || 'month', now);
        
        const spent = transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'expense' && 
                       t.category === budget.category && 
                       date >= periodStart && 
                       date <= now;
            })
            .reduce((sum, t) => sum + t.amount, 0);
        
        const remaining = budget.limit - spent;
        const percentage = (spent / budget.limit * 100);
        
        return {
            ...budget,
            spent,
            remaining,
            percentage,
            status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok'
        };
    });
}

// Поиск транзакций
function searchTransactions(transactions, query) {
    if (!query || query.length < 2) return transactions;
    
    const lowerQuery = query.toLowerCase();
    
    return transactions.filter(t => {
        return (
            (t.category && t.category.toLowerCase().includes(lowerQuery)) ||
            (t.comment && t.comment.toLowerCase().includes(lowerQuery)) ||
            (t.amount && t.amount.toString().includes(query))
        );
    });
}

// Сортировка транзакций
function sortTransactions(transactions, sortBy, order = 'desc') {
    const sorted = [...transactions];
    
    sorted.sort((a, b) => {
        let aVal, bVal;
        
        switch(sortBy) {
            case 'date':
                aVal = new Date(a.date);
                bVal = new Date(b.date);
                break;
            case 'amount':
                aVal = a.amount;
                bVal = b.amount;
                break;
            case 'category':
                aVal = a.category || '';
                bVal = b.category || '';
                break;
            default:
                return 0;
        }
        
        if (order === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });
    
    return sorted;
}

// Вспомогательная функция для определения начала периода
function getPeriodStart(period, now) {
    const start = new Date(now);
    
    switch(period) {
        case 'week':
            const dayOfWeek = start.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            start.setDate(start.getDate() - diff);
            break;
        case 'month':
            start.setDate(1);
            break;
        case 'quarter':
            start.setMonth(start.getMonth() - 3);
            break;
        case 'year':
            start.setFullYear(start.getFullYear() - 1);
            break;
    }
    
    start.setHours(0, 0, 0, 0);
    return start;
}

console.log('✓ Web Worker initialized');

