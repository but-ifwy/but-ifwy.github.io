// Структура данных приложения
class FinanceApp {
    constructor() {
        this.data = {
            banks: [],
            cards: [],
            cash: [],
            deposits: [],
            credits: [],
            transactions: []
        };
        
        this.currentView = 'calendar';
        this.currentTab = 'banks';
        this.currentDate = new Date();
        this.selectedDates = [];
        this.editingItem = null;
        this.historyFilter = 'all';
        this.historyPeriod = 'all';
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.render();
    }

    loadData() {
        const saved = localStorage.getItem('financeAppData');
        if (saved) {
            this.data = JSON.parse(saved);
        }
    }

    saveData() {
        localStorage.setItem('financeAppData', JSON.stringify(this.data));
        this.render();
    }

    setupEventListeners() {
        document.getElementById('menuBtn').addEventListener('click', () => this.openMenu());
        document.getElementById('closeMenu').addEventListener('click', () => this.closeMenu());
        
        document.getElementById('menuCalendar').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('calendar');
            this.closeMenu();
        });
        
        document.getElementById('menuDashboard').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('dashboard');
            this.closeMenu();
        });

        document.getElementById('menuHistory').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('history');
            this.closeMenu();
        });
        
        document.getElementById('menuAssets').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('assets');
            this.closeMenu();
        });

        document.getElementById('menuCalculator').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('depositCalculator');
            this.closeMenu();
        });
        
        document.getElementById('menuExport').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportData();
            this.closeMenu();
        });
        
        document.getElementById('menuImport').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeMenu();
            setTimeout(() => document.getElementById('importFile').click(), 300);
        });
        
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
        document.getElementById('menuReset').addEventListener('click', (e) => {
            e.preventDefault();
            this.confirmReset();
            this.closeMenu();
        });

        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        document.getElementById('closeStats').addEventListener('click', () => this.hideStatsPanel());

        document.getElementById('addIncomeBtn').addEventListener('click', () => this.showTransactionForm('income'));
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.showTransactionForm('expense'));
        document.getElementById('addTransferBtn').addEventListener('click', () => this.showTransferForm());
        document.getElementById('addAssetBtn').addEventListener('click', () => this.showView('assets'));

        document.getElementById('backFromAssets').addEventListener('click', () => this.showView('calendar'));
        document.getElementById('backFromTransaction').addEventListener('click', () => this.showView('calendar'));
        document.getElementById('backFromCalculator').addEventListener('click', () => this.showView('calendar'));
        document.getElementById('backFromHistory').addEventListener('click', () => this.showView('calendar'));
        document.getElementById('backFromTransfer').addEventListener('click', () => this.showView('calendar'));

        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        document.getElementById('transferForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransfer();
        });

        document.getElementById('calculatorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateDeposit();
        });

        document.getElementById('historyFilter').addEventListener('change', (e) => {
            this.historyFilter = e.target.value;
            this.renderHistory();
        });

        document.getElementById('historyPeriod').addEventListener('change', (e) => {
            this.historyPeriod = e.target.value;
            this.renderHistory();
        });

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.getElementById('modalCancel').addEventListener('click', () => this.closeModal());
        document.getElementById('closeFormModal').addEventListener('click', () => this.closeFormModal());
        document.getElementById('formModalCancel').addEventListener('click', () => this.closeFormModal());
        document.getElementById('formModalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(e);
        });

        document.getElementById('menuOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'menuOverlay') this.closeMenu();
        });

        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') this.closeModal();
        });

        document.getElementById('formModal').addEventListener('click', (e) => {
            if (e.target.id === 'formModal') this.closeFormModal();
        });
    }

    showView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${viewName}View`).classList.add('active');
        
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        const menuItem = document.getElementById(`menu${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
        if (menuItem) menuItem.classList.add('active');
        
        this.currentView = viewName;
        
        if (viewName === 'assets') this.renderTabContent();
        else if (viewName === 'calendar') this.renderCalendar();
        else if (viewName === 'history') this.renderHistory();
    }

    openMenu() {
        document.getElementById('menuOverlay').classList.add('active');
    }

    closeMenu() {
        document.getElementById('menuOverlay').classList.remove('active');
    }

    // Форма перевода между активами
    showTransferForm() {
        this.showView('transfer');
        
        const fromSelect = document.getElementById('transferFrom');
        const toSelect = document.getElementById('transferTo');
        
        fromSelect.innerHTML = '<option value="">Выберите источник</option>';
        toSelect.innerHTML = '<option value="">Выберите получателя</option>';
        
        // Заполняем списки активов
        this.data.cards.forEach(card => {
            const optionFrom = document.createElement('option');
            optionFrom.value = `card-${card.id}`;
            optionFrom.textContent = `${card.name} (${card.bank}) - ${this.formatMoney(card.balance)}`;
            fromSelect.appendChild(optionFrom);
            
            const optionTo = document.createElement('option');
            optionTo.value = `card-${card.id}`;
            optionTo.textContent = `${card.name} (${card.bank})`;
            toSelect.appendChild(optionTo);
        });

        this.data.cash.forEach(cash => {
            const optionFrom = document.createElement('option');
            optionFrom.value = `cash-${cash.id}`;
            optionFrom.textContent = `${cash.name} - ${this.formatMoney(cash.amount)}`;
            fromSelect.appendChild(optionFrom);
            
            const optionTo = document.createElement('option');
            optionTo.value = `cash-${cash.id}`;
            optionTo.textContent = cash.name;
            toSelect.appendChild(optionTo);
        });

        document.getElementById('transferDate').valueAsDate = new Date();
        document.getElementById('transferAmount').value = '';
        document.getElementById('transferComment').value = '';
    }

    saveTransfer() {
        const from = document.getElementById('transferFrom').value;
        const to = document.getElementById('transferTo').value;
        const amount = parseFloat(document.getElementById('transferAmount').value);
        const date = document.getElementById('transferDate').value;
        const comment = document.getElementById('transferComment').value;

        if (!from || !to) {
            alert('Выберите источник и получателя');
            return;
        }

        if (from === to) {
            alert('Источник и получатель не могут совпадать');
            return;
        }

        const [fromType, fromId] = from.split('-');
        const [toType, toId] = to.split('-');
        const fromIdNum = parseInt(fromId);
        const toIdNum = parseInt(toId);

        // Получаем названия для истории
        let fromName = '';
        let toName = '';

        if (fromType === 'card') {
            const card = this.data.cards.find(c => c.id === fromIdNum);
            if (card) {
                if (card.balance < amount) {
                    alert('Недостаточно средств на карте');
                    return;
                }
                card.balance -= amount;
                fromName = `${card.name} (${card.bank})`;
            }
        } else if (fromType === 'cash') {
            const cash = this.data.cash.find(c => c.id === fromIdNum);
            if (cash) {
                if (cash.amount < amount) {
                    alert('Недостаточно средств');
                    return;
                }
                cash.amount -= amount;
                fromName = cash.name;
            }
        }

        if (toType === 'card') {
            const card = this.data.cards.find(c => c.id === toIdNum);
            if (card) {
                card.balance += amount;
                toName = `${card.name} (${card.bank})`;
            }
        } else if (toType === 'cash') {
            const cash = this.data.cash.find(c => c.id === toIdNum);
            if (cash) {
                cash.amount += amount;
                toName = cash.name;
            }
        }

        // Создаем запись о переводе
        const transfer = {
            id: Date.now(),
            type: 'transfer',
            amount: amount,
            from: from,
            to: to,
            fromName: fromName,
            toName: toName,
            date: date,
            category: 'Перевод',
            comment: comment || `Перевод: ${fromName} → ${toName}`
        };

        this.data.transactions.push(transfer);
        this.saveData();
        this.showView('calendar');
    }

    deleteTransfer(id) {
        if (!confirm('Отменить перевод? Средства будут возвращены.')) return;

        const transfer = this.data.transactions.find(t => t.id === id);
        if (!transfer || transfer.type !== 'transfer') return;

        const [fromType, fromId] = transfer.from.split('-');
        const [toType, toId] = transfer.to.split('-');
        const fromIdNum = parseInt(fromId);
        const toIdNum = parseInt(toId);

        // Возвращаем средства обратно
        if (fromType === 'card') {
            const card = this.data.cards.find(c => c.id === fromIdNum);
            if (card) card.balance += transfer.amount;
        } else if (fromType === 'cash') {
            const cash = this.data.cash.find(c => c.id === fromIdNum);
            if (cash) cash.amount += transfer.amount;
        }

        if (toType === 'card') {
            const card = this.data.cards.find(c => c.id === toIdNum);
            if (card) card.balance -= transfer.amount;
        } else if (toType === 'cash') {
            const cash = this.data.cash.find(c => c.id === toIdNum);
            if (cash) cash.amount -= transfer.amount;
        }

        this.data.transactions = this.data.transactions.filter(t => t.id !== id);
        this.saveData();
        
        if (this.currentView === 'calendar') {
            this.showStats();
        } else if (this.currentView === 'history') {
            this.renderHistory();
        }
    }

    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                           'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

        const dayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            grid.appendChild(header);
        });

        const firstDay = new Date(year, month, 1);
        let dayOfWeek = firstDay.getDay();
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = dayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            this.createDayCell(grid, day, month - 1, year, true);
        }

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            this.createDayCell(grid, day, month, year, false);
        }

        const totalCells = dayOfWeek + daysInMonth;
        const remainingCells = 42 - totalCells;
        for (let day = 1; day <= remainingCells; day++) {
            this.createDayCell(grid, day, month + 1, year, true);
        }
    }

    createDayCell(grid, day, month, year, otherMonth) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        if (otherMonth) cell.classList.add('other-month');

        const date = new Date(year, month, day);
        const dateStr = this.formatDate(date);

        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            cell.classList.add('today');
        }

        if (this.selectedDates.includes(dateStr)) {
            cell.classList.add('selected');
        }

        if (this.selectedDates.length === 2) {
            const [start, end] = this.selectedDates.sort();
            if (dateStr > start && dateStr < end) {
                cell.classList.add('in-range');
            }
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        cell.appendChild(dayNumber);

        const transactions = this.getTransactionsByDate(dateStr);
        if (transactions.length > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'day-indicator';
            
            const hasIncome = transactions.some(t => t.type === 'income');
            const hasExpense = transactions.some(t => t.type === 'expense');
            const hasTransfer = transactions.some(t => t.type === 'transfer');
            
            if (hasIncome) {
                const dot = document.createElement('div');
                dot.className = 'day-dot income';
                indicator.appendChild(dot);
            }
            if (hasExpense) {
                const dot = document.createElement('div');
                dot.className = 'day-dot expense';
                indicator.appendChild(dot);
            }
            if (hasTransfer) {
                const dot = document.createElement('div');
                dot.className = 'day-dot transfer';
                indicator.appendChild(dot);
            }
            
            cell.appendChild(indicator);
        }

        cell.addEventListener('click', () => {
            if (!otherMonth) this.selectDate(dateStr, cell);
        });

        grid.appendChild(cell);
    }

    selectDate(dateStr, cell) {
        if (this.selectedDates.includes(dateStr)) {
            this.selectedDates = this.selectedDates.filter(d => d !== dateStr);
            cell.classList.remove('selected');
            if (this.selectedDates.length === 0) {
                this.hideStatsPanel();
            } else {
                this.showStats();
            }
        } else {
            if (this.selectedDates.length >= 2) {
                this.selectedDates = [dateStr];
            } else {
                this.selectedDates.push(dateStr);
            }
            this.renderCalendar();
            this.showStats();
        }
    }

    showStats() {
        const panel = document.getElementById('statsPanel');
        let title = '';
        let income = 0;
        let expense = 0;
        let transactions = [];

        if (this.selectedDates.length === 1) {
            const date = new Date(this.selectedDates[0]);
            title = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
            transactions = this.getTransactionsByDate(this.selectedDates[0]);
        } else if (this.selectedDates.length === 2) {
            const [start, end] = this.selectedDates.sort();
            const startDate = new Date(start);
            const endDate = new Date(end);
            title = `${startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
            transactions = this.getTransactionsInRange(start, end);
        }

        transactions.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else if (t.type === 'expense') expense += t.amount;
            // Переводы не учитываем в доходах/расходах
        });

        document.getElementById('statsTitle').textContent = title;
        document.getElementById('statsIncome').textContent = this.formatMoney(income);
        document.getElementById('statsExpense').textContent = this.formatMoney(expense);
        document.getElementById('statsTotal').textContent = this.formatMoney(income - expense);
        
        const totalElement = document.getElementById('statsTotal');
        totalElement.className = 'stat-value';
        if (income - expense > 0) totalElement.classList.add('income');
        else if (income - expense < 0) totalElement.classList.add('expense');

        this.renderStatsTransactions(transactions);
        panel.classList.add('active');
    }

    renderStatsTransactions(transactions) {
        const container = document.getElementById('statsTransactions');
        container.innerHTML = '';

        if (transactions.length === 0) return;

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        transactions.forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'stats-transaction-item';
            
            let amountClass = '';
            let amountSign = '';
            let displayAmount = this.formatMoney(transaction.amount);

            if (transaction.type === 'income') {
                amountClass = 'income';
                amountSign = '+';
            } else if (transaction.type === 'expense') {
                amountClass = 'expense';
                amountSign = '-';
            } else if (transaction.type === 'transfer') {
                amountClass = 'transfer';
                amountSign = '↔';
            }
            
            item.innerHTML = `
                <div class="stats-transaction-header">
                    <div class="stats-transaction-category">${transaction.category}</div>
                    <div class="stats-transaction-amount ${amountClass}">
                        ${amountSign}${displayAmount}
                    </div>
                </div>
                ${transaction.comment ? `<div class="stats-transaction-comment">${transaction.comment}</div>` : ''}
                <div class="stats-transaction-actions">
                    ${transaction.type !== 'transfer' ? '<button class="btn-small edit" data-id="' + transaction.id + '">Изменить</button>' : ''}
                    <button class="btn-small delete" data-id="${transaction.id}">Удалить</button>
                </div>
            `;

            const editBtn = item.querySelector('.edit');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    this.editTransaction(transaction.id);
                });
            }

            item.querySelector('.delete').addEventListener('click', () => {
                if (transaction.type === 'transfer') {
                    this.deleteTransfer(transaction.id);
                } else {
                    this.deleteTransaction(transaction.id);
                }
            });

            container.appendChild(item);
        });
    }

    editTransaction(id) {
        const transaction = this.data.transactions.find(t => t.id === id);
        if (!transaction || transaction.type === 'transfer') return;

        this.editingItem = { type: 'transaction', id: id };
        this.hideStatsPanel();
        
        this.showView('transaction');
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('transactionTitle').textContent = 
            transaction.type === 'income' ? 'Редактировать доход' : 'Редактировать расход';
        
        const sourceSelect = document.getElementById('transactionSource');
        sourceSelect.innerHTML = '<option value="">Выберите</option>';
        
        this.data.cards.forEach(card => {
            const option = document.createElement('option');
            option.value = `card-${card.id}`;
            option.textContent = `${card.name} (${card.bank})`;
            if (transaction.source === option.value) option.selected = true;
            sourceSelect.appendChild(option);
        });

        this.data.cash.forEach(cash => {
            const option = document.createElement('option');
            option.value = `cash-${cash.id}`;
            option.textContent = cash.name;
            if (transaction.source === option.value) option.selected = true;
            sourceSelect.appendChild(option);
        });

        document.getElementById('transactionDate').value = transaction.date;
        document.getElementById('transactionAmount').value = transaction.amount;
        document.getElementById('transactionCategory').value = transaction.category;
        document.getElementById('transactionComment').value = transaction.comment || '';
    }

    deleteTransaction(id) {
        if (!confirm('Удалить операцию?')) return;

        const transaction = this.data.transactions.find(t => t.id === id);
        if (!transaction) return;

        const [sourceType, sourceId] = transaction.source.split('-');
        const srcId = parseInt(sourceId);

        if (sourceType === 'card') {
            const card = this.data.cards.find(c => c.id === srcId);
            if (card) card.balance -= (transaction.type === 'income' ? transaction.amount : -transaction.amount);
        } else if (sourceType === 'cash') {
            const cash = this.data.cash.find(c => c.id === srcId);
            if (cash) cash.amount -= (transaction.type === 'income' ? transaction.amount : -transaction.amount);
        }

        this.data.transactions = this.data.transactions.filter(t => t.id !== id);
        this.saveData();
        
        if (this.currentView === 'calendar') {
            this.showStats();
        } else if (this.currentView === 'history') {
            this.renderHistory();
        }
    }

    hideStatsPanel() {
        document.getElementById('statsPanel').classList.remove('active');
        this.selectedDates = [];
        this.renderCalendar();
    }

    getTransactionsByDate(dateStr) {
        return this.data.transactions.filter(t => t.date === dateStr);
    }

    getTransactionsInRange(start, end) {
        return this.data.transactions.filter(t => t.date >= start && t.date <= end);
    }

    renderHistory() {
        const container = document.getElementById('historyList');
        container.innerHTML = '';

        let transactions = [...this.data.transactions];

        // Фильтр по типу
        if (this.historyFilter !== 'all') {
            transactions = transactions.filter(t => t.type === this.historyFilter);
        }

        // Фильтр по периоду
        if (this.historyPeriod !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            if (this.historyPeriod === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                transactions = transactions.filter(t => new Date(t.date) >= weekAgo);
            } else if (this.historyPeriod === 'month') {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                transactions = transactions.filter(t => new Date(t.date) >= monthStart);
            }
        }

        if (transactions.length === 0) {
            container.innerHTML = '<div class="history-empty"><p>Операций не найдено</p></div>';
            return;
        }

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        transactions.forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('ru-RU', { 
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            let amountClass = '';
            let amountSign = '';
            let sourceName = '';

            if (transaction.type === 'transfer') {
                amountClass = 'transfer';
                amountSign = '↔';
                sourceName = `${transaction.fromName} → ${transaction.toName}`;
            } else {
                amountClass = transaction.type === 'income' ? 'income' : 'expense';
                amountSign = transaction.type === 'income' ? '+' : '-';
                
                const [sourceType, sourceId] = transaction.source.split('-');
                const id = parseInt(sourceId);
                
                if (sourceType === 'card') {
                    const card = this.data.cards.find(c => c.id === id);
                    if (card) sourceName = `${card.name} (${card.bank})`;
                } else if (sourceType === 'cash') {
                    const cash = this.data.cash.find(c => c.id === id);
                    if (cash) sourceName = cash.name;
                }
            }
            
            item.innerHTML = `
                <div class="history-item-header">
                    <div class="history-item-left">
                        <div class="history-item-category">${transaction.category}</div>
                        <div class="history-item-date">${formattedDate}</div>
                    </div>
                    <div class="history-item-amount ${amountClass}">
                        ${amountSign}${this.formatMoney(transaction.amount)}
                    </div>
                </div>
                ${transaction.comment ? `<div class="history-item-comment">${transaction.comment}</div>` : ''}
                <div class="history-item-source">Источник: ${sourceName || 'Неизвестно'}</div>
                <div class="history-item-actions">
                    ${transaction.type !== 'transfer' ? '<button class="btn-small edit">Изменить</button>' : ''}
                    <button class="btn-small delete">Удалить</button>
                </div>
            `;

            const editBtn = item.querySelector('.edit');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    this.editTransaction(transaction.id);
                });
            }

            item.querySelector('.delete').addEventListener('click', () => {
                if (transaction.type === 'transfer') {
                    this.deleteTransfer(transaction.id);
                } else {
                    this.deleteTransaction(transaction.id);
                }
            });

            container.appendChild(item);
        });
    }

    // Остальные методы остаются без изменений...
    // (switchTab, renderTabContent, renderBanks, showBankForm, etc.)
    
    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        this.currentTab = tabName;
        this.renderTabContent();
    }

    renderTabContent() {
        const container = document.getElementById('tabContent');
        container.innerHTML = '';

        switch(this.currentTab) {
            case 'banks': this.renderBanks(container); break;
            case 'cards': this.renderCards(container); break;
            case 'cash': this.renderCash(container); break;
            case 'deposits': this.renderDeposits(container); break;
            case 'credits': this.renderCredits(container); break;
        }
    }

    renderBanks(container) {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-primary mb-2';
        addBtn.textContent = '+ Добавить банк';
        addBtn.onclick = () => this.showBankForm();
        container.appendChild(addBtn);

        if (this.data.banks.length === 0) {
            container.innerHTML += '<div class="empty-state"><p>Банки не добавлены</p></div>';
            container.prepend(addBtn);
            return;
        }

        const list = document.createElement('div');
        list.className = 'items-list';
        
        this.data.banks.forEach((bank, index) => {
            const item = document.createElement('div');
            item.className = 'item';
            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${bank.name}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-small edit">Изменить</button>
                    <button class="btn-small delete">Удалить</button>
                </div>
            `;
            item.querySelector('.edit').onclick = () => this.editBank(index);
            item.querySelector('.delete').onclick = () => this.deleteBank(index);
            list.appendChild(item);
        });

        container.appendChild(list);
    }

    showBankForm(editIndex = null) {
        const bank = editIndex !== null ? this.data.banks[editIndex] : null;
        
        this.showFormModal(bank ? 'Редактировать банк' : 'Добавить банк', `
            <div class="form-group">
                <label>Название банка</label>
                <input type="text" name="name" placeholder="Например: Kapital Bank" value="${bank ? bank.name : ''}" required>
            </div>
        `, (formData) => {
            if (editIndex !== null) {
                this.data.banks[editIndex].name = formData.name;
            } else {
                this.data.banks.push({ id: Date.now(), name: formData.name });
            }
            this.saveData();
        });
    }

    editBank(index) {
        this.showBankForm(index);
    }

    deleteBank(index) {
        if (confirm('Удалить банк?')) {
            this.data.banks.splice(index, 1);
            this.saveData();
        }
    }

    renderCards(container) {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-primary mb-2';
        addBtn.textContent = '+ Добавить карту';
        addBtn.onclick = () => this.showCardForm();
        container.appendChild(addBtn);

        if (this.data.cards.length === 0) {
            container.innerHTML += '<div class="empty-state"><p>Карты не добавлены</p></div>';
            container.prepend(addBtn);
            return;
        }

        const list = document.createElement('div');
        list.className = 'items-list';
        
        this.data.cards.forEach((card, index) => {
            const item = document.createElement('div');
            item.className = 'item';
            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${card.name}</div>
                    <div class="item-meta">${card.bank}</div>
                </div>
                <div class="item-value">${this.formatMoney(card.balance)}</div>
                <div class="item-actions">
                    <button class="btn-small edit">Изменить</button>
                    <button class="btn-small delete">Удалить</button>
                </div>
            `;
            item.querySelector('.edit').onclick = () => this.editCard(index);
            item.querySelector('.delete').onclick = () => this.deleteCard(index);
            list.appendChild(item);
        });

        container.appendChild(list);
    }

    showCardForm(editIndex = null) {
        if (this.data.banks.length === 0) {
            alert('Сначала добавьте банк');
            return;
        }

        const card = editIndex !== null ? this.data.cards[editIndex] : null;
        const bankOptions = this.data.banks.map(b => 
            `<option value="${b.name}" ${card && card.bank === b.name ? 'selected' : ''}>${b.name}</option>`
        ).join('');

        this.showFormModal(card ? 'Редактировать карту' : 'Добавить карту', `
            <div class="form-group">
                <label>Название карты</label>
                <input type="text" name="name" placeholder="Например: Основная карта" value="${card ? card.name : ''}" required>
            </div>
            <div class="form-group">
                <label>Банк</label>
                <select name="bank" required>
                    <option value="">Выберите банк</option>
                    ${bankOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Баланс</label>
                <input type="number" name="balance" placeholder="0" step="0.01" value="${card ? card.balance : 0}" required>
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" name="showOnDashboard" style="width: auto;" ${card && card.showOnDashboard !== false ? 'checked' : ''}>
                    <span>Показывать на дашборде</span>
                </label>
            </div>
        `, (formData) => {
            if (editIndex !== null) {
                this.data.cards[editIndex].name = formData.name;
                this.data.cards[editIndex].bank = formData.bank;
                this.data.cards[editIndex].balance = parseFloat(formData.balance);
                this.data.cards[editIndex].showOnDashboard = formData.showOnDashboard === 'on';
            } else {
                this.data.cards.push({
                    id: Date.now(),
                    name: formData.name,
                    bank: formData.bank,
                    balance: parseFloat(formData.balance),
                    showOnDashboard: formData.showOnDashboard === 'on'
                });
            }
            this.saveData();
        });
    }

    editCard(index) {
        this.showCardForm(index);
    }

    deleteCard(index) {
        if (confirm('Удалить карту?')) {
            this.data.cards.splice(index, 1);
            this.saveData();
        }
    }

    renderCash(container) {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-primary mb-2';
        addBtn.textContent = '+ Добавить наличные';
        addBtn.onclick = () => this.showCashForm();
        container.appendChild(addBtn);

        if (this.data.cash.length === 0) {
            container.innerHTML += '<div class="empty-state"><p>Наличные не добавлены</p></div>';
            container.prepend(addBtn);
            return;
        }

        const list = document.createElement('div');
        list.className = 'items-list';
        
        this.data.cash.forEach((cash, index) => {
            const item = document.createElement('div');
            item.className = 'item';
            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${cash.name}</div>
                </div>
                <div class="item-value">${this.formatMoney(cash.amount)}</div>
                <div class="item-actions">
                    <button class="btn-small edit">Изменить</button>
                    <button class="btn-small delete">Удалить</button>
                </div>
            `;
            item.querySelector('.edit').onclick = () => this.editCash(index);
            item.querySelector('.delete').onclick = () => this.deleteCash(index);
            list.appendChild(item);
        });

        container.appendChild(list);
    }

    showCashForm(editIndex = null) {
        const cash = editIndex !== null ? this.data.cash[editIndex] : null;
        
        this.showFormModal(cash ? 'Редактировать наличные' : 'Добавить наличные', `
            <div class="form-group">
                <label>Название</label>
                <input type="text" name="name" placeholder="Например: Кошелек" value="${cash ? cash.name : ''}" required>
            </div>
            <div class="form-group">
                <label>Сумма</label>
                <input type="number" name="amount" placeholder="0" step="0.01" value="${cash ? cash.amount : 0}" required>
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" name="showOnDashboard" style="width: auto;" ${cash && cash.showOnDashboard !== false ? 'checked' : ''}>
                    <span>Показывать на дашборде</span>
                </label>
            </div>
        `, (formData) => {
            if (editIndex !== null) {
                this.data.cash[editIndex].name = formData.name;
                this.data.cash[editIndex].amount = parseFloat(formData.amount);
                this.data.cash[editIndex].showOnDashboard = formData.showOnDashboard === 'on';
            } else {
                this.data.cash.push({
                    id: Date.now(),
                    name: formData.name,
                    amount: parseFloat(formData.amount),
                    showOnDashboard: formData.showOnDashboard === 'on'
                });
            }
            this.saveData();
        });
    }

    editCash(index) {
        this.showCashForm(index);
    }

    deleteCash(index) {
        if (confirm('Удалить наличные?')) {
            this.data.cash.splice(index, 1);
            this.saveData();
        }
    }

    renderDeposits(container) {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-primary mb-2';
        addBtn.textContent = '+ Добавить вклад';
        addBtn.onclick = () => this.showDepositForm();
        container.appendChild(addBtn);

        if (this.data.deposits.length === 0) {
            container.innerHTML += '<div class="empty-state"><p>Вклады не добавлены</p></div>';
            container.prepend(addBtn);
            return;
        }

        const list = document.createElement('div');
        list.className = 'items-list';
        
        this.data.deposits.forEach((deposit, index) => {
            const currentValue = this.calculateDepositValue(deposit);
            const item = document.createElement('div');
            item.className = 'item';
            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${deposit.name}</div>
                    <div class="item-meta">${deposit.rate}% • ${deposit.term} мес.</div>
                </div>
                <div class="item-value">${this.formatMoney(currentValue)}</div>
                <div class="item-actions">
                    <button class="btn-small edit">Изменить</button>
                    <button class="btn-small delete">Удалить</button>
                </div>
            `;
            item.querySelector('.edit').onclick = () => this.editDeposit(index);
            item.querySelector('.delete').onclick = () => this.deleteDeposit(index);
            list.appendChild(item);
        });

        container.appendChild(list);
    }

    showDepositForm(editIndex = null) {
        if (this.data.banks.length === 0) {
            alert('Сначала добавьте банк');
            return;
        }

        const deposit = editIndex !== null ? this.data.deposits[editIndex] : null;
        const bankOptions = this.data.banks.map(b => 
            `<option value="${b.name}" ${deposit && deposit.bank === b.name ? 'selected' : ''}>${b.name}</option>`
        ).join('');

        this.showFormModal(deposit ? 'Редактировать вклад' : 'Добавить вклад', `
            <div class="form-group">
                <label>Название вклада</label>
                <input type="text" name="name" placeholder="Например: Накопительный" value="${deposit ? deposit.name : ''}" required>
            </div>
            <div class="form-group">
                <label>Банк</label>
                <select name="bank" required>
                    <option value="">Выберите банк</option>
                    ${bankOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Начальная сумма</label>
                <input type="number" name="amount" placeholder="1000000" step="0.01" value="${deposit ? deposit.amount : ''}" required>
            </div>
            <div class="form-group">
                <label>Процентная ставка (годовая %)</label>
                <input type="number" name="rate" placeholder="14" step="0.01" value="${deposit ? deposit.rate : ''}" required>
            </div>
            <div class="form-group">
                <label>Срок (месяцев)</label>
                <input type="number" name="term" placeholder="12" value="${deposit ? deposit.term : ''}" required>
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" name="showOnDashboard" style="width: auto;" ${deposit && deposit.showOnDashboard !== false ? 'checked' : ''}>
                    <span>Показывать на дашборде</span>
                </label>
            </div>
        `, (formData) => {
            if (editIndex !== null) {
                this.data.deposits[editIndex].name = formData.name;
                this.data.deposits[editIndex].bank = formData.bank;
                this.data.deposits[editIndex].amount = parseFloat(formData.amount);
                this.data.deposits[editIndex].rate = parseFloat(formData.rate);
                this.data.deposits[editIndex].term = parseInt(formData.term);
                this.data.deposits[editIndex].showOnDashboard = formData.showOnDashboard === 'on';
            } else {
                this.data.deposits.push({
                    id: Date.now(),
                    name: formData.name,
                    bank: formData.bank,
                    amount: parseFloat(formData.amount),
                    rate: parseFloat(formData.rate),
                    term: parseInt(formData.term),
                    startDate: new Date().toISOString(),
                    showOnDashboard: formData.showOnDashboard === 'on'
                });
            }
            this.saveData();
        });
    }

    editDeposit(index) {
        this.showDepositForm(index);
    }

    deleteDeposit(index) {
        if (confirm('Удалить вклад?')) {
            this.data.deposits.splice(index, 1);
            this.saveData();
        }
    }

    renderCredits(container) {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-primary mb-2';
        addBtn.textContent = '+ Добавить кредит';
        addBtn.onclick = () => this.showCreditForm();
        container.appendChild(addBtn);

        if (this.data.credits.length === 0) {
            container.innerHTML += '<div class="empty-state"><p>Кредиты не добавлены</p></div>';
            container.prepend(addBtn);
            return;
        }

        const list = document.createElement('div');
        list.className = 'items-list';
        
        this.data.credits.forEach((credit, index) => {
            const item = document.createElement('div');
            item.className = 'item';
            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${credit.name}</div>
                    <div class="item-meta">${credit.rate}% • ${credit.term} мес.</div>
                </div>
                <div class="item-value" style="color: var(--expense)">-${this.formatMoney(credit.amount)}</div>
                <div class="item-actions">
                    <button class="btn-small edit">Изменить</button>
                    <button class="btn-small delete">Удалить</button>
                </div>
            `;
            item.querySelector('.edit').onclick = () => this.editCredit(index);
            item.querySelector('.delete').onclick = () => this.deleteCredit(index);
            list.appendChild(item);
        });

        container.appendChild(list);
    }

    showCreditForm(editIndex = null) {
        if (this.data.banks.length === 0) {
            alert('Сначала добавьте банк');
            return;
        }

        const credit = editIndex !== null ? this.data.credits[editIndex] : null;
        const bankOptions = this.data.banks.map(b => 
            `<option value="${b.name}" ${credit && credit.bank === b.name ? 'selected' : ''}>${b.name}</option>`
        ).join('');

        this.showFormModal(credit ? 'Редактировать кредит' : 'Добавить кредит', `
            <div class="form-group">
                <label>Название кредита</label>
                <input type="text" name="name" placeholder="Например: Автокредит" value="${credit ? credit.name : ''}" required>
            </div>
            <div class="form-group">
                <label>Банк</label>
                <select name="bank" required>
                    <option value="">Выберите банк</option>
                    ${bankOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Сумма кредита</label>
                <input type="number" name="totalAmount" placeholder="10000000" step="0.01" value="${credit ? (credit.amount + (credit.downPayment || 0)) : ''}" required>
            </div>
            <div class="form-group">
                <label>Процентная ставка (годовая %)</label>
                <input type="number" name="rate" placeholder="18" step="0.01" value="${credit ? credit.rate : ''}" required>
            </div>
            <div class="form-group">
                <label>Срок (месяцев)</label>
                <input type="number" name="term" placeholder="24" value="${credit ? credit.term : ''}" required>
            </div>
            <div class="form-group">
                <label>Первоначальный взнос</label>
                <input type="number" name="downPayment" placeholder="0" step="0.01" value="${credit ? (credit.downPayment || 0) : 0}">
            </div>
        `, (formData) => {
            const totalAmount = parseFloat(formData.totalAmount);
            const downPayment = parseFloat(formData.downPayment) || 0;
            
            if (editIndex !== null) {
                this.data.credits[editIndex].name = formData.name;
                this.data.credits[editIndex].bank = formData.bank;
                this.data.credits[editIndex].amount = totalAmount - downPayment;
                this.data.credits[editIndex].rate = parseFloat(formData.rate);
                this.data.credits[editIndex].term = parseInt(formData.term);
                this.data.credits[editIndex].downPayment = downPayment;
            } else {
                this.data.credits.push({
                    id: Date.now(),
                    name: formData.name,
                    bank: formData.bank,
                    amount: totalAmount - downPayment,
                    rate: parseFloat(formData.rate),
                    term: parseInt(formData.term),
                    downPayment: downPayment,
                    startDate: new Date().toISOString()
                });
            }
            this.saveData();
        });
    }

    editCredit(index) {
        this.showCreditForm(index);
    }

    deleteCredit(index) {
        if (confirm('Удалить кредит?')) {
            this.data.credits.splice(index, 1);
            this.saveData();
        }
    }

    calculateDepositValue(deposit, targetDate = new Date()) {
        const start = new Date(deposit.startDate);
        const monthsPassed = this.getMonthsDiff(start, targetDate);
        
        if (monthsPassed <= 0) return deposit.amount;

        let currentAmount = deposit.amount;
        const monthlyRate = deposit.rate / 100 / 12;

        for (let month = 0; month < Math.min(monthsPassed, deposit.term); month++) {
            const interest = currentAmount * monthlyRate;
            currentAmount += interest;
        }

        return currentAmount;
    }

    calculateDeposit() {
        const amount = parseFloat(document.getElementById('calcAmount').value);
        const rate = parseFloat(document.getElementById('calcRate').value);
        const term = parseInt(document.getElementById('calcTerm').value);
        const capitalize = document.getElementById('calcCapitalize').checked;
        const topup1 = parseFloat(document.getElementById('calcTopup1').value) || 0;
        const topup2 = parseFloat(document.getElementById('calcTopup2').value) || 0;

        const monthlyRate = rate / 100 / 12;
        const results = [];
        let currentAmount = amount;
        let totalTopups = 0;
        const startDate = new Date();

        for (let month = 0; month <= term; month++) {
            const date = new Date(startDate);
            date.setMonth(date.getMonth() + month);
            
            let monthStart = currentAmount;
            let interest = 0;
            let topups = 0;

            if (month > 0) {
                interest = monthStart * monthlyRate;
                topups = topup1 + topup2;
                totalTopups += topups;
                
                if (capitalize) {
                    currentAmount = monthStart + interest + topups;
                } else {
                    currentAmount = monthStart + topups;
                }
            }

            results.push({
                month: month,
                date: date,
                monthStart: monthStart,
                interest: interest,
                topups: topups,
                monthEnd: currentAmount
            });
        }

        this.renderCalculatorResults(results, amount, currentAmount, capitalize, totalTopups);
    }

    renderCalculatorResults(results, initialAmount, finalAmount, capitalize, totalTopups) {
        const container = document.getElementById('calculatorResult');
        const totalInterest = capitalize ? finalAmount - initialAmount - totalTopups : results.reduce((sum, r) => sum + r.interest, 0);

        container.innerHTML = `
            <div class="result-summary">
                <div class="result-item">
                    <span class="result-label">Начальная сумма</span>
                    <span class="result-value">${this.formatMoney(initialAmount)} сум</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Всего пополнений</span>
                    <span class="result-value">${this.formatMoney(totalTopups)} сум</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Всего процентов</span>
                    <span class="result-value">${this.formatMoney(totalInterest)} сум</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Итоговая сумма</span>
                    <span class="result-value highlight">${this.formatMoney(finalAmount)} сум</span>
                </div>
            </div>

            <div class="result-table">
                <div class="table-header">
                    <div class="table-cell">Месяц</div>
                    <div class="table-cell">Начало</div>
                    <div class="table-cell">%</div>
                    <div class="table-cell">Пополнения</div>
                    <div class="table-cell">Конец</div>
                </div>
                ${results.map(r => `
                    <div class="table-row">
                        <div class="table-cell">${r.date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' })}</div>
                        <div class="table-cell">${this.formatMoney(r.monthStart)}</div>
                        <div class="table-cell">${this.formatMoney(r.interest)}</div>
                        <div class="table-cell">${this.formatMoney(r.topups)}</div>
                        <div class="table-cell">${this.formatMoney(r.monthEnd)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getMonthsDiff(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    }

    showTransactionForm(type) {
        this.editingItem = null;
        this.showView('transaction');
        document.getElementById('transactionType').value = type;
        document.getElementById('transactionTitle').textContent = 
            type === 'income' ? 'Новый доход' : 'Новый расход';
        
        const sourceSelect = document.getElementById('transactionSource');
        sourceSelect.innerHTML = '<option value="">Выберите</option>';
        
        this.data.cards.forEach(card => {
            const option = document.createElement('option');
            option.value = `card-${card.id}`;
            option.textContent = `${card.name} (${card.bank})`;
            sourceSelect.appendChild(option);
        });

        this.data.cash.forEach(cash => {
            const option = document.createElement('option');
            option.value = `cash-${cash.id}`;
            option.textContent = cash.name;
            sourceSelect.appendChild(option);
        });

        document.getElementById('transactionDate').valueAsDate = new Date();
        document.getElementById('transactionAmount').value = '';
        document.getElementById('transactionCategory').value = '';
        document.getElementById('transactionComment').value = '';
    }

    saveTransaction() {
        const type = document.getElementById('transactionType').value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const source = document.getElementById('transactionSource').value;
        const date = document.getElementById('transactionDate').value;
        const category = document.getElementById('transactionCategory').value;
        const comment = document.getElementById('transactionComment').value;

        if (!source) {
            alert('Выберите источник');
            return;
        }

        const [sourceType, sourceId] = source.split('-');
        const id = parseInt(sourceId);

        if (this.editingItem && this.editingItem.type === 'transaction') {
            const transaction = this.data.transactions.find(t => t.id === this.editingItem.id);
            if (transaction) {
                const [oldSourceType, oldSourceId] = transaction.source.split('-');
                const oldId = parseInt(oldSourceId);
                
                if (oldSourceType === 'card') {
                    const card = this.data.cards.find(c => c.id === oldId);
                    if (card) card.balance -= (transaction.type === 'income' ? transaction.amount : -transaction.amount);
                } else if (oldSourceType === 'cash') {
                    const cash = this.data.cash.find(c => c.id === oldId);
                    if (cash) cash.amount -= (transaction.type === 'income' ? transaction.amount : -transaction.amount);
                }

                transaction.type = type;
                transaction.amount = amount;
                transaction.source = source;
                transaction.date = date;
                transaction.category = category || (type === 'income' ? 'Доход' : 'Расход');
                transaction.comment = comment;

                if (sourceType === 'card') {
                    const card = this.data.cards.find(c => c.id === id);
                    if (card) card.balance += (type === 'income' ? amount : -amount);
                } else if (sourceType === 'cash') {
                    const cash = this.data.cash.find(c => c.id === id);
                    if (cash) cash.amount += (type === 'income' ? amount : -amount);
                }
            }
        } else {
            const transaction = {
                id: Date.now(),
                type: type,
                amount: amount,
                source: source,
                date: date,
                category: category || (type === 'income' ? 'Доход' : 'Расход'),
                comment: comment
            };

            this.data.transactions.push(transaction);

            if (sourceType === 'card') {
                const card = this.data.cards.find(c => c.id === id);
                if (card) card.balance += (type === 'income' ? amount : -amount);
            } else if (sourceType === 'cash') {
                const cash = this.data.cash.find(c => c.id === id);
                if (cash) cash.amount += (type === 'income' ? amount : -amount);
            }
        }

        this.saveData();
        this.showView('calendar');
    }

    calculateTotalBalance() {
        let total = 0;
        this.data.cards.forEach(card => total += card.balance);
        this.data.cash.forEach(cash => total += cash.amount);
        this.data.deposits.forEach(deposit => total += this.calculateDepositValue(deposit));
        this.data.credits.forEach(credit => total -= credit.amount);
        return total;
    }

    formatMoney(amount) {
        return new Intl.NumberFormat('uz-UZ', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    renderAssetsList() {
        const container = document.getElementById('assetsList');
        container.innerHTML = '';

        const assets = [
            ...this.data.cards.filter(c => c.showOnDashboard !== false).map(c => ({ type: 'Карта', name: c.name, value: c.balance })),
            ...this.data.cash.filter(c => c.showOnDashboard !== false).map(c => ({ type: 'Наличные', name: c.name, value: c.amount })),
            ...this.data.deposits.filter(d => d.showOnDashboard !== false).map(d => ({ type: 'Вклад', name: d.name, value: this.calculateDepositValue(d) }))
        ];

        if (assets.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Нет активов для отображения</p></div>';
            return;
        }

        assets.slice(0, 5).forEach(asset => {
            const item = document.createElement('div');
            item.className = 'item';
            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${asset.name}</div>
                    <div class="item-meta">${asset.type}</div>
                </div>
                <div class="item-value">${this.formatMoney(asset.value)}</div>
            `;
            container.appendChild(item);
        });
    }

    renderTransactionsList() {
        const container = document.getElementById('transactionsList');
        container.innerHTML = '';

        if (this.data.transactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Нет операций</p></div>';
            return;
        }

        const sorted = [...this.data.transactions].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        sorted.slice(0, 5).forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'transaction';
            
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: 'short' 
            });

            let amountClass = '';
            let amountSign = '';
            
            if (transaction.type === 'income') {
                amountClass = 'income';
                amountSign = '+';
            } else if (transaction.type === 'expense') {
                amountClass = 'expense';
                amountSign = '-';
            } else if (transaction.type === 'transfer') {
                amountClass = 'transfer';
                amountSign = '↔';
            }

            item.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-category">${transaction.category}</div>
                    <div class="transaction-meta">${formattedDate}${transaction.comment ? ' • ' + transaction.comment : ''}</div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${amountSign}${this.formatMoney(transaction.amount)}
                </div>
            `;
            container.appendChild(item);
        });
    }

    render() {
        const totalBalance = this.calculateTotalBalance();
        document.getElementById('totalBalance').textContent = this.formatMoney(totalBalance);

        this.renderAssetsList();
        this.renderTransactionsList();

        if (this.currentView === 'assets') {
            this.renderTabContent();
        } else if (this.currentView === 'calendar') {
            this.renderCalendar();
        } else if (this.currentView === 'history') {
            this.renderHistory();
        }
    }

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `moliya-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        alert('Данные экспортированы');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (confirm('Заменить текущие данные импортированными?')) {
                    this.data = imported;
                    this.saveData();
                    alert('Данные импортированы');
                }
            } catch (error) {
                alert('Ошибка импорта данных');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    confirmReset() {
        this.showModal(
            'Сброс данных',
            'Вы уверены? Все данные будут удалены без возможности восстановления.',
            () => this.resetData()
        );
    }

    resetData() {
        this.data = {
            banks: [],
            cards: [],
            cash: [],
            deposits: [],
            credits: [],
            transactions: []
        };
        this.saveData();
        this.closeModal();
        alert('Данные сброшены');
    }

    showModal(title, body, onConfirm) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').textContent = body;
        document.getElementById('modal').classList.add('active');
        
        const confirmBtn = document.getElementById('modalConfirm');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
        });
    }

    closeModal() {
        document.getElementById('modal').classList.remove('active');
    }

    showFormModal(title, formHtml, onSubmit) {
        document.getElementById('formModalTitle').textContent = title;
        document.getElementById('formModalBody').innerHTML = formHtml;
        document.getElementById('formModal').classList.add('active');
        this.currentFormSubmitHandler = onSubmit;
    }

    closeFormModal() {
        document.getElementById('formModal').classList.remove('active');
        this.currentFormSubmitHandler = null;
    }

    handleFormSubmit(event) {
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        if (this.currentFormSubmitHandler) {
            this.currentFormSubmitHandler(data);
            this.closeFormModal();
        }
    }
}

const app = new FinanceApp();
window.app = app; // Экспортируем для отладки

// Добавляем методы статистики в класс FinanceApp
FinanceApp.prototype.initStatistics = function() {
    this.selectedStatsPeriod = 'month';
    this.charts = {};
};

FinanceApp.prototype.setupStatisticsEventListeners = function() {
    const menuStats = document.getElementById('menuStatistics');
    console.log('Setting up Statistics listeners, element:', menuStats);
    
    menuStats?.addEventListener('click', (e) => {
        console.log('Statistics clicked!');
        e.preventDefault();
        this.showView('statistics');
        this.renderStatistics();
        this.closeMenu();
    });

    document.getElementById('backFromStatistics')?.addEventListener('click', () => {
        this.showView('calendar');
    });

    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            this.selectedStatsPeriod = e.target.dataset.period;
            this.renderStatistics();
        });
    });
};

FinanceApp.prototype.getStatsPeriodDates = function() {
    const end = new Date();
    const start = new Date();
    
    if (this.selectedStatsPeriod === 'month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    } else if (this.selectedStatsPeriod === 'quarter') {
        start.setMonth(start.getMonth() - 3);
        start.setHours(0, 0, 0, 0);
    } else if (this.selectedStatsPeriod === 'year') {
        start.setFullYear(start.getFullYear() - 1);
        start.setHours(0, 0, 0, 0);
    }
    
    return { start, end };
};

FinanceApp.prototype.renderStatistics = function() {
    const { start, end } = this.getStatsPeriodDates();
    const transactions = this.data.transactions.filter(t => {
        const date = new Date(t.date);
        return date >= start && date <= end;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenses = {};
    let maxExpense = 0;

    transactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else if (t.type === 'expense') {
            totalExpense += t.amount;
            categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
            if (t.amount > maxExpense) maxExpense = t.amount;
        }
    });

    // Обновляем сводку
    document.getElementById('summaryIncome').textContent = this.formatMoney(totalIncome);
    document.getElementById('summaryExpense').textContent = this.formatMoney(totalExpense);
    const difference = totalIncome - totalExpense;
    const diffElement = document.getElementById('summaryDifference');
    diffElement.textContent = this.formatMoney(Math.abs(difference));
    diffElement.className = 'summary-value';
    if (difference > 0) diffElement.classList.add('income');
    else if (difference < 0) diffElement.classList.add('expense');

    // Средние показатели
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    document.getElementById('avgDailyIncome').textContent = this.formatMoney(totalIncome / days);
    document.getElementById('avgDailyExpense').textContent = this.formatMoney(totalExpense / days);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;
    document.getElementById('savingsRate').textContent = savingsRate.toFixed(1) + '%';
    document.getElementById('maxExpense').textContent = this.formatMoney(maxExpense);

    // Топ категорий
    this.renderTopCategories(categoryExpenses);

    // Графики
    this.renderBalanceChart(start, end);
    this.renderIncomeExpenseChart(start, end);
    this.renderCategoryChart(categoryExpenses);
};

FinanceApp.prototype.renderTopCategories = function(categoryExpenses) {
    const container = document.getElementById('topCategoriesList');
    container.innerHTML = '';

    const sorted = Object.entries(categoryExpenses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Нет данных</p></div>';
        return;
    }

    const maxAmount = sorted[0][1];

    sorted.forEach(([category, amount], index) => {
        const item = document.createElement('div');
        item.className = 'category-item';
        const percentage = (amount / maxAmount * 100);
        
        item.innerHTML = `
            <div class="category-rank">${index + 1}</div>
            <div class="category-info">
                <div class="category-name">${category}</div>
                <div class="category-bar-container">
                    <div class="category-bar" style="width: ${percentage}%"></div>
                </div>
            </div>
            <div class="category-amount">${this.formatMoney(amount)}</div>
        `;
        container.appendChild(item);
    });
};

FinanceApp.prototype.renderBalanceChart = function(start, end) {
    const canvas = document.getElementById('balanceChart');
    if (!canvas) return;

    // Инициализируем charts если не существует
    if (!this.charts) {
        this.charts = {};
    }

    if (this.charts.balance) {
        this.charts.balance.destroy();
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const step = Math.max(1, Math.floor(days / 30));
    const labels = [];
    const data = [];
    let currentBalance = 0;

    // Получаем начальный баланс
    const beforeStart = this.data.transactions.filter(t => new Date(t.date) < start);
    beforeStart.forEach(t => {
        if (t.type === 'income') currentBalance += t.amount;
        else if (t.type === 'expense') currentBalance -= t.amount;
    });

    for (let i = 0; i <= days; i += step) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        
        labels.push(date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }));
        
        const dayTransactions = this.data.transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= date;
        });
        
        let balance = currentBalance;
        dayTransactions.forEach(t => {
            if (t.type === 'income') balance += t.amount;
            else if (t.type === 'expense') balance -= t.amount;
        });
        
        data.push(balance);
    }

    const ctx = canvas.getContext('2d');
    this.charts.balance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Баланс',
                data: data,
                borderColor: '#00ff88',
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a1a1a',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#252525',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => this.formatMoney(context.parsed.y) + ' сум'
                    }
                }
            },
            scales: {
                y: {
                    ticks: { color: '#888888' },
                    grid: { color: '#252525' }
                },
                x: {
                    ticks: { color: '#888888' },
                    grid: { color: '#252525' }
                }
            }
        }
    });
};

FinanceApp.prototype.renderIncomeExpenseChart = function(start, end) {
    const canvas = document.getElementById('incomeExpenseChart');
    if (!canvas) return;

    // Инициализируем charts если не существует
    if (!this.charts) {
        this.charts = {};
    }

    if (this.charts.incomeExpense) {
        this.charts.incomeExpense.destroy();
    }

    const monthlyData = {};
    this.data.transactions.forEach(t => {
        const date = new Date(t.date);
        if (date >= start && date <= end) {
            const key = date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
            if (!monthlyData[key]) {
                monthlyData[key] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') monthlyData[key].income += t.amount;
            else if (t.type === 'expense') monthlyData[key].expense += t.amount;
        }
    });

    const labels = Object.keys(monthlyData);
    const incomeData = labels.map(l => monthlyData[l].income);
    const expenseData = labels.map(l => monthlyData[l].expense);

    const ctx = canvas.getContext('2d');
    this.charts.incomeExpense = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Доходы',
                    data: incomeData,
                    backgroundColor: '#00ff88',
                },
                {
                    label: 'Расходы',
                    data: expenseData,
                    backgroundColor: '#ff4444',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                },
                tooltip: {
                    backgroundColor: '#1a1a1a',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#252525',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => context.dataset.label + ': ' + this.formatMoney(context.parsed.y) + ' сум'
                    }
                }
            },
            scales: {
                y: {
                    ticks: { color: '#888888' },
                    grid: { color: '#252525' }
                },
                x: {
                    ticks: { color: '#888888' },
                    grid: { color: '#252525' }
                }
            }
        }
    });
};

FinanceApp.prototype.renderCategoryChart = function(categoryExpenses) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;

    // Инициализируем charts если не существует
    if (!this.charts) {
        this.charts = {};
    }

    if (this.charts.category) {
        this.charts.category.destroy();
    }

    const sorted = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1]).slice(0, 6);
    
    if (sorted.length === 0) {
        return;
    }

    const labels = sorted.map(([cat]) => cat);
    const data = sorted.map(([, amount]) => amount);
    const colors = [
        '#ff4444', '#ff8844', '#ffbb44', '#ffee44', '#88ff44', '#44ff88',
    ];

    const ctx = canvas.getContext('2d');
    this.charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ffffff', padding: 10 }
                },
                tooltip: {
                    backgroundColor: '#1a1a1a',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#252525',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => context.label + ': ' + this.formatMoney(context.parsed) + ' сум'
                    }
                }
            }
        }
    });
};

// Инициализируем статистику при создании приложения
const originalInit = FinanceApp.prototype.init;
FinanceApp.prototype.init = function() {
    originalInit.call(this);
    this.initStatistics();
    this.setupStatisticsEventListeners();
};

// ============= БЮДЖЕТЫ =============

FinanceApp.prototype.initBudgets = function() {
    if (!this.data.budgets) {
        this.data.budgets = [];
    }
};

FinanceApp.prototype.setupBudgetsEventListeners = function() {
    const menuBudgets = document.getElementById('menuBudgets');
    console.log('Setting up Budgets listeners, element:', menuBudgets);
    
    menuBudgets?.addEventListener('click', (e) => {
        console.log('Budgets clicked!');
        e.preventDefault();
        this.showView('budgets');
        this.renderBudgets();
        this.closeMenu();
    });

    document.getElementById('backFromBudgets')?.addEventListener('click', () => {
        this.showView('calendar');
    });

    document.getElementById('addBudgetBtn')?.addEventListener('click', () => {
        this.showBudgetForm();
    });
};

FinanceApp.prototype.showBudgetForm = function(editIndex = null) {
    const budget = editIndex !== null ? this.data.budgets[editIndex] : null;
    
    this.showFormModal(budget ? 'Редактировать бюджет' : 'Добавить бюджет', `
        <div class="form-group">
            <label>Категория</label>
            <input type="text" name="category" placeholder="Например: Продукты" value="${budget ? budget.category : ''}" required>
        </div>
        <div class="form-group">
            <label>Лимит расходов (в месяц)</label>
            <input type="number" name="limit" placeholder="1000000" step="0.01" value="${budget ? budget.limit : ''}" required>
        </div>
        <div class="form-group">
            <label>Период</label>
            <select name="period" required>
                <option value="month" ${budget && budget.period === 'month' ? 'selected' : ''}>Месяц</option>
                <option value="week" ${budget && budget.period === 'week' ? 'selected' : ''}>Неделя</option>
            </select>
        </div>
        <div class="form-group">
            <label style="display: flex; align-items: center; gap: 0.5rem;">
                <input type="checkbox" name="rollover" style="width: auto;" ${budget && budget.rollover ? 'checked' : ''}>
                <span>Переносить остаток на следующий период</span>
            </label>
        </div>
    `, (formData) => {
        if (editIndex !== null) {
            this.data.budgets[editIndex].category = formData.category;
            this.data.budgets[editIndex].limit = parseFloat(formData.limit);
            this.data.budgets[editIndex].period = formData.period;
            this.data.budgets[editIndex].rollover = formData.rollover === 'on';
        } else {
            this.data.budgets.push({
                id: Date.now(),
                category: formData.category,
                limit: parseFloat(formData.limit),
                period: formData.period || 'month',
                rollover: formData.rollover === 'on',
                createdAt: new Date().toISOString()
            });
        }
        this.saveData();
        this.renderBudgets();
    });
};

FinanceApp.prototype.editBudget = function(index) {
    this.showBudgetForm(index);
};

FinanceApp.prototype.deleteBudget = function(index) {
    if (confirm('Удалить бюджет?')) {
        this.data.budgets.splice(index, 1);
        this.saveData();
        this.renderBudgets();
    }
};

FinanceApp.prototype.getBudgetPeriodDates = function(budget) {
    const now = new Date();
    const start = new Date();
    
    if (budget.period === 'week') {
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start.setDate(now.getDate() - diff);
        start.setHours(0, 0, 0, 0);
    } else {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    }
    
    return { start, end: now };
};

FinanceApp.prototype.calculateBudgetSpent = function(budget) {
    const { start, end } = this.getBudgetPeriodDates(budget);
    
    const expenses = this.data.transactions.filter(t => {
        const date = new Date(t.date);
        return t.type === 'expense' && 
               t.category === budget.category && 
               date >= start && 
               date <= end;
    });
    
    return expenses.reduce((sum, t) => sum + t.amount, 0);
};

FinanceApp.prototype.renderBudgets = function() {
    const container = document.getElementById('budgetsList');
    
    if (!this.data.budgets || this.data.budgets.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Бюджеты не установлены</p></div>';
        this.updateBudgetSummary(0, 0, 0);
        return;
    }

    container.innerHTML = '';
    let totalBudget = 0;
    let totalSpent = 0;

    this.data.budgets.forEach((budget, index) => {
        const spent = this.calculateBudgetSpent(budget);
        const remaining = budget.limit - spent;
        const percentage = Math.min(100, (spent / budget.limit * 100));
        
        totalBudget += budget.limit;
        totalSpent += spent;

        let statusClass = '';
        let statusText = '';
        
        if (percentage >= 100) {
            statusClass = 'over-budget';
            statusText = 'Превышен';
        } else if (percentage >= 80) {
            statusClass = 'warning';
            statusText = 'Предупреждение';
        } else {
            statusText = 'В норме';
        }

        const item = document.createElement('div');
        item.className = `budget-item ${statusClass}`;
        
        item.innerHTML = `
            <div class="budget-item-header">
                <div class="budget-item-title">${budget.category}</div>
                <div class="budget-item-amount ${percentage >= 100 ? 'over' : ''}">
                    ${this.formatMoney(spent)} / ${this.formatMoney(budget.limit)}
                </div>
            </div>
            <div class="budget-progress-bar">
                <div class="budget-progress-fill ${percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : ''}" 
                     style="width: ${percentage}%"></div>
            </div>
            <div class="budget-item-stats">
                <span>${statusText}</span>
                <span>${remaining > 0 ? 'Осталось: ' + this.formatMoney(remaining) : 'Превышение: ' + this.formatMoney(Math.abs(remaining))}</span>
            </div>
            <div class="budget-item-actions">
                <button class="btn-small edit">Изменить</button>
                <button class="btn-small delete">Удалить</button>
            </div>
        `;

        item.querySelector('.edit').addEventListener('click', () => this.editBudget(index));
        item.querySelector('.delete').addEventListener('click', () => this.deleteBudget(index));

        container.appendChild(item);
    });

    this.updateBudgetSummary(totalBudget, totalSpent, totalBudget - totalSpent);
};

FinanceApp.prototype.updateBudgetSummary = function(total, spent, remaining) {
    document.getElementById('totalBudget').textContent = this.formatMoney(total);
    document.getElementById('totalSpent').textContent = this.formatMoney(spent);
    
    const remainingElement = document.getElementById('totalRemaining');
    remainingElement.textContent = this.formatMoney(Math.abs(remaining));
    
    remainingElement.className = 'budget-summary-value';
    if (remaining > 0) {
        remainingElement.classList.add('accent');
    } else if (remaining < 0) {
        remainingElement.style.color = 'var(--expense)';
    }
};

// Проверка бюджетов при сохранении транзакции
const originalSaveTransaction = FinanceApp.prototype.saveTransaction;
FinanceApp.prototype.saveTransaction = function() {
    const type = document.getElementById('transactionType').value;
    const category = document.getElementById('transactionCategory').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    
    // Вызываем оригинальную функцию
    originalSaveTransaction.call(this);
    
    // Проверяем бюджеты только для расходов
    if (type === 'expense' && category) {
        const budget = this.data.budgets?.find(b => b.category === category);
        if (budget) {
            const spent = this.calculateBudgetSpent(budget);
            const percentage = (spent / budget.limit * 100);
            
            if (percentage >= 100) {
                setTimeout(() => {
                    alert(`⚠️ Превышен бюджет для категории "${category}"!\nЛимит: ${this.formatMoney(budget.limit)}\nПотрачено: ${this.formatMoney(spent)}`);
                }, 300);
            } else if (percentage >= 80) {
                setTimeout(() => {
                    alert(`⚠️ Внимание! Использовано ${percentage.toFixed(0)}% бюджета категории "${category}".\nЛимит: ${this.formatMoney(budget.limit)}\nПотрачено: ${this.formatMoney(spent)}`);
                }, 300);
            }
        }
    }
};

// Инициализация бюджетов при старте приложения
const originalInitBudgetsWrapper = FinanceApp.prototype.init;
FinanceApp.prototype.init = function() {
    originalInitBudgetsWrapper.call(this);
    this.initBudgets();
    this.setupBudgetsEventListeners();
};


// ============= ПОВТОРЯЮЩИЕСЯ ТРАНЗАКЦИИ =============

FinanceApp.prototype.initRecurring = function() {
    if (!this.data.recurring) {
        this.data.recurring = [];
    }
    // Проверяем и создаем транзакции при запуске
    this.processRecurringTransactions();
};

FinanceApp.prototype.processRecurringTransactions = function() {
    if (!this.data.recurring) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.data.recurring.forEach(recurring => {
        const lastExecution = recurring.lastExecuted ? new Date(recurring.lastExecuted) : null;
        
        // Проверяем, нужно ли создать транзакцию
        if (this.shouldExecuteRecurring(recurring, today, lastExecution)) {
            this.executeRecurringTransaction(recurring, today);
        }
    });
    
    this.saveData();
};

FinanceApp.prototype.shouldExecuteRecurring = function(recurring, today, lastExecution) {
    if (!lastExecution) return true;
    
    lastExecution.setHours(0, 0, 0, 0);
    
    if (recurring.frequency === 'daily') {
        return today > lastExecution;
    } else if (recurring.frequency === 'weekly') {
        const daysDiff = Math.floor((today - lastExecution) / (1000 * 60 * 60 * 24));
        return daysDiff >= 7;
    } else if (recurring.frequency === 'monthly') {
        return today.getMonth() !== lastExecution.getMonth() || 
               today.getFullYear() !== lastExecution.getFullYear();
    }
    
    return false;
};

FinanceApp.prototype.executeRecurringTransaction = function(recurring, date) {
    const [sourceType, sourceId] = recurring.source.split('-');
    const id = parseInt(sourceId);
    
    // Создаем транзакцию
    const transaction = {
        id: Date.now() + Math.random(),
        type: recurring.type,
        amount: recurring.amount,
        source: recurring.source,
        date: this.formatDate(date),
        category: recurring.category,
        comment: recurring.comment + ' (авто)'
    };
    
    this.data.transactions.push(transaction);
    
    // Обновляем балансы
    if (sourceType === 'card') {
        const card = this.data.cards.find(c => c.id === id);
        if (card) card.balance += (recurring.type === 'income' ? recurring.amount : -recurring.amount);
    } else if (sourceType === 'cash') {
        const cash = this.data.cash.find(c => c.id === id);
        if (cash) cash.amount += (recurring.type === 'income' ? recurring.amount : -recurring.amount);
    }
    
    // Обновляем дату последнего выполнения
    recurring.lastExecuted = date.toISOString();
};

FinanceApp.prototype.showRecurringForm = function(editIndex = null) {
    const recurring = editIndex !== null ? this.data.recurring[editIndex] : null;
    
    const cardOptions = this.data.cards.map(c => 
        `<option value="card-${c.id}" ${recurring && recurring.source === `card-${c.id}` ? 'selected' : ''}>${c.name} (${c.bank})</option>`
    ).join('');
    
    const cashOptions = this.data.cash.map(c => 
        `<option value="cash-${c.id}" ${recurring && recurring.source === `cash-${c.id}` ? 'selected' : ''}>${c.name}</option>`
    ).join('');
    
    this.showFormModal(recurring ? 'Редактировать повтор' : 'Добавить повторяющуюся операцию', `
        <div class="form-group">
            <label>Тип</label>
            <select name="type" required>
                <option value="income" ${recurring && recurring.type === 'income' ? 'selected' : ''}>Доход</option>
                <option value="expense" ${recurring && recurring.type === 'expense' ? 'selected' : ''}>Расход</option>
            </select>
        </div>
        <div class="form-group">
            <label>Сумма</label>
            <input type="number" name="amount" placeholder="0" step="0.01" value="${recurring ? recurring.amount : ''}" required>
        </div>
        <div class="form-group">
            <label>Источник</label>
            <select name="source" required>
                <option value="">Выберите</option>
                ${cardOptions}
                ${cashOptions}
            </select>
        </div>
        <div class="form-group">
            <label>Категория</label>
            <input type="text" name="category" placeholder="Например: Зарплата" value="${recurring ? recurring.category : ''}" required>
        </div>
        <div class="form-group">
            <label>Частота</label>
            <select name="frequency" required>
                <option value="daily" ${recurring && recurring.frequency === 'daily' ? 'selected' : ''}>Ежедневно</option>
                <option value="weekly" ${recurring && recurring.frequency === 'weekly' ? 'selected' : ''}>Еженедельно</option>
                <option value="monthly" ${recurring && recurring.frequency === 'monthly' ? 'selected' : ''}>Ежемесячно</option>
            </select>
        </div>
        <div class="form-group">
            <label>Комментарий</label>
            <input type="text" name="comment" placeholder="Например: Аренда квартиры" value="${recurring ? recurring.comment : ''}">
        </div>
    `, (formData) => {
        if (editIndex !== null) {
            this.data.recurring[editIndex].type = formData.type;
            this.data.recurring[editIndex].amount = parseFloat(formData.amount);
            this.data.recurring[editIndex].source = formData.source;
            this.data.recurring[editIndex].category = formData.category;
            this.data.recurring[editIndex].frequency = formData.frequency;
            this.data.recurring[editIndex].comment = formData.comment;
        } else {
            this.data.recurring.push({
                id: Date.now(),
                type: formData.type,
                amount: parseFloat(formData.amount),
                source: formData.source,
                category: formData.category,
                frequency: formData.frequency,
                comment: formData.comment,
                createdAt: new Date().toISOString(),
                lastExecuted: null
            });
        }
        this.saveData();
        if (this.currentView === 'history') {
            this.renderHistory();
        }
    });
};


FinanceApp.prototype.showRecurringManagement = function() {
    const modal = document.getElementById('formModal');
    const title = document.getElementById('formModalTitle');
    const body = document.getElementById('formModalBody');
    
    title.textContent = 'Повторяющиеся операции';
    
    let html = `
        <div style="margin-bottom: 1rem;">
            <button class="btn-primary" style="width: 100%;" id="addRecurringModalBtn">+ Добавить повторяющуюся операцию</button>
        </div>
    `;
    
    if (!this.data.recurring || this.data.recurring.length === 0) {
        html += '<div class="empty-state"><p>Нет повторяющихся операций</p></div>';
    } else {
        html += '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';
        
        this.data.recurring.forEach((rec, index) => {
            const frequencyText = {
                'daily': 'Ежедневно',
                'weekly': 'Еженедельно',
                'monthly': 'Ежемесячно'
            }[rec.frequency];
            
            const typeClass = rec.type === 'income' ? 'income' : 'expense';
            const typeSign = rec.type === 'income' ? '+' : '-';
            
            html += `
                <div class="item" style="padding: 1rem;">
                    <div class="item-info" style="flex: 1;">
                        <div class="item-name">${rec.category}</div>
                        <div class="item-meta">${frequencyText} • ${this.formatMoney(rec.amount)}</div>
                        ${rec.comment ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${rec.comment}</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-small edit" data-index="${index}">Изменить</button>
                        <button class="btn-small delete" data-index="${index}">Удалить</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    body.innerHTML = html;
    
    // Скрываем стандартные кнопки модального окна
    document.querySelector('#formModalForm .modal-actions').style.display = 'none';
    
    modal.classList.add('active');
    
    // Обработчики
    document.getElementById('addRecurringModalBtn')?.addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => this.showRecurringForm(), 300);
    });
    
    document.querySelectorAll('.btn-small.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            modal.classList.remove('active');
            setTimeout(() => this.showRecurringForm(index), 300);
        });
    });
    
    document.querySelectorAll('.btn-small.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            if (confirm('Удалить повторяющуюся операцию?')) {
                this.data.recurring.splice(index, 1);
                this.saveData();
                modal.classList.remove('active');
            }
        });
    });
};

// Добавляем обработчик кнопки управления повторяющимися операциями
const originalSetupEventListeners = FinanceApp.prototype.setupEventListeners;
FinanceApp.prototype.setupEventListeners = function() {
    originalSetupEventListeners.call(this);
    
    document.getElementById('manageRecurringBtn')?.addEventListener('click', () => {
        this.showRecurringManagement();
    });
};

// Инициализация повторяющихся операций
const originalInitRecurring = FinanceApp.prototype.init;
FinanceApp.prototype.init = function() {
    originalInitRecurring.call(this);
    this.initRecurring();
};


// ============= ИКОНКИ КАТЕГОРИЙ =============

FinanceApp.prototype.categoryIcons = {
    // Расходы
    'Продукты': '🛒',
    'Еда': '🍽️',
    'Кафе': '☕',
    'Ресторан': '🍴',
    'Транспорт': '🚗',
    'Такси': '🚕',
    'Бензин': '⛽',
    'Проездной': '🚌',
    'Жилье': '🏠',
    'Аренда': '🏘️',
    'Коммуналка': '💡',
    'Интернет': '📡',
    'Телефон': '📱',
    'Развлечения': '🎉',
    'Кино': '🎬',
    'Игры': '🎮',
    'Спорт': '⚽',
    'Здоровье': '💊',
    'Врач': '👨‍⚕️',
    'Аптека': '💉',
    'Одежда': '👕',
    'Обувь': '👟',
    'Красота': '💄',
    'Образование': '📚',
    'Курсы': '🎓',
    'Книги': '📖',
    'Подарки': '🎁',
    'Путешествия': '✈️',
    'Отель': '🏨',
    'Хобби': '🎨',
    'Питомцы': '🐾',
    'Ремонт': '🔧',
    'Техника': '💻',
    'Подписки': '📺',
    'Налоги': '📋',
    'Штрафы': '⚠️',
    'Благотворительность': '❤️',
    'Другое': '📦',
    'Прочее': '📌',
    
    // Доходы
    'Зарплата': '💰',
    'Доход': '💵',
    'Премия': '🎖️',
    'Подработка': '💼',
    'Фриланс': '💻',
    'Инвестиции': '📈',
    'Дивиденды': '💹',
    'Проценты': '🏦',
    'Продажа': '🤝',
    'Возврат': '↩️',
    'Кэшбэк': '💳',
    'Бонусы': '🎁',
    
    // Переводы
    'Перевод': '↔️',
    'Пополнение': '➕',
    'Снятие': '➖'
};

FinanceApp.prototype.getCategoryIcon = function(category) {
    return this.categoryIcons[category] || '💰';
};

// ============= ПОИСК =============

FinanceApp.prototype.searchQuery = '';

FinanceApp.prototype.setupSearchListener = function() {
    const searchInput = document.getElementById('searchTransactions');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderHistory();
        });
    }
};

FinanceApp.prototype.filterTransactionsBySearch = function(transactions) {
    if (!this.searchQuery) return transactions;
    
    return transactions.filter(t => {
        const category = t.category?.toLowerCase() || '';
        const comment = t.comment?.toLowerCase() || '';
        const amount = t.amount.toString();
        
        return category.includes(this.searchQuery) || 
               comment.includes(this.searchQuery) || 
               amount.includes(this.searchQuery);
    });
};

// Обновляем renderHistory для поддержки поиска
const originalRenderHistory = FinanceApp.prototype.renderHistory;
FinanceApp.prototype.renderHistory = function() {
    const container = document.getElementById('historyList');
    container.innerHTML = '';

    let transactions = [...this.data.transactions];

    // Фильтр по типу
    if (this.historyFilter !== 'all') {
        transactions = transactions.filter(t => t.type === this.historyFilter);
    }

    // Фильтр по периоду
    if (this.historyPeriod !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (this.historyPeriod === 'week') {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            transactions = transactions.filter(t => new Date(t.date) >= weekAgo);
        } else if (this.historyPeriod === 'month') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            transactions = transactions.filter(t => new Date(t.date) >= monthStart);
        }
    }

    // Поиск
    transactions = this.filterTransactionsBySearch(transactions);

    if (transactions.length === 0) {
        container.innerHTML = '<div class="history-empty"><p>Операций не найдено</p></div>';
        return;
    }

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    transactions.forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('ru-RU', { 
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        let amountClass = '';
        let amountSign = '';
        let sourceName = '';
        const icon = this.getCategoryIcon(transaction.category);

        if (transaction.type === 'transfer') {
            amountClass = 'transfer';
            amountSign = '↔';
            sourceName = `${transaction.fromName} → ${transaction.toName}`;
        } else {
            amountClass = transaction.type === 'income' ? 'income' : 'expense';
            amountSign = transaction.type === 'income' ? '+' : '-';
            
            const [sourceType, sourceId] = transaction.source.split('-');
            const id = parseInt(sourceId);
            
            if (sourceType === 'card') {
                const card = this.data.cards.find(c => c.id === id);
                if (card) sourceName = `${card.name} (${card.bank})`;
            } else if (sourceType === 'cash') {
                const cash = this.data.cash.find(c => c.id === id);
                if (cash) sourceName = cash.name;
            }
        }
        
        item.innerHTML = `
            <div class="history-item-header">
                <div class="history-item-left">
                    <div class="category-with-icon">
                        <span class="category-icon">${icon}</span>
                        <div class="history-item-category">${transaction.category}</div>
                    </div>
                    <div class="history-item-date">${formattedDate}</div>
                </div>
                <div class="history-item-amount ${amountClass}">
                    ${amountSign}${this.formatMoney(transaction.amount)}
                </div>
            </div>
            ${transaction.comment ? `<div class="history-item-comment">${transaction.comment}</div>` : ''}
            <div class="history-item-source">Источник: ${sourceName || 'Неизвестно'}</div>
            <div class="history-item-actions">
                ${transaction.type !== 'transfer' ? '<button class="btn-small edit">Изменить</button>' : ''}
                <button class="btn-small delete">Удалить</button>
            </div>
        `;

        const editBtn = item.querySelector('.edit');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editTransaction(transaction.id);
            });
        }

        item.querySelector('.delete').addEventListener('click', () => {
            if (transaction.type === 'transfer') {
                this.deleteTransfer(transaction.id);
            } else {
                this.deleteTransaction(transaction.id);
            }
        });

        container.appendChild(item);
    });
};

// ============= ФИНАНСОВЫЕ ЦЕЛИ =============

FinanceApp.prototype.initGoals = function() {
    if (!this.data.goals) {
        this.data.goals = [];
    }
};

FinanceApp.prototype.setupGoalsEventListeners = function() {
    const menuGoals = document.getElementById('menuGoals');
    console.log('Setting up Goals listeners, element:', menuGoals);
    
    menuGoals?.addEventListener('click', (e) => {
        console.log('Goals clicked!');
        e.preventDefault();
        this.showView('goals');
        this.renderGoals();
        this.closeMenu();
    });

    document.getElementById('backFromGoals')?.addEventListener('click', () => {
        this.showView('calendar');
    });

    document.getElementById('addGoalBtn')?.addEventListener('click', () => {
        this.showGoalForm();
    });
};

FinanceApp.prototype.showGoalForm = function(editIndex = null) {
    const goal = editIndex !== null ? this.data.goals[editIndex] : null;
    
    const iconOptions = ['🎯', '🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '🏖️', '🎸', '📷', '⌚', '👗', '🎮', '🏋️'];
    const iconSelect = iconOptions.map(icon => 
        `<option value="${icon}" ${goal && goal.icon === icon ? 'selected' : ''}>${icon}</option>`
    ).join('');
    
    this.showFormModal(goal ? 'Редактировать цель' : 'Создать финансовую цель', `
        <div class="form-group">
            <label>Иконка цели</label>
            <select name="icon" required style="font-size: 1.5rem;">
                ${iconSelect}
            </select>
        </div>
        <div class="form-group">
            <label>Название цели</label>
            <input type="text" name="name" placeholder="Например: iPhone 15 Pro" value="${goal ? goal.name : ''}" required>
        </div>
        <div class="form-group">
            <label>Целевая сумма</label>
            <input type="number" name="targetAmount" placeholder="15000000" step="0.01" value="${goal ? goal.targetAmount : ''}" required>
        </div>
        <div class="form-group">
            <label>Уже накоплено</label>
            <input type="number" name="currentAmount" placeholder="0" step="0.01" value="${goal ? goal.currentAmount : 0}">
        </div>
        <div class="form-group">
            <label>Срок достижения (месяцев)</label>
            <input type="number" name="deadline" placeholder="12" value="${goal ? goal.deadline : ''}">
        </div>
    `, (formData) => {
        if (editIndex !== null) {
            this.data.goals[editIndex].icon = formData.icon;
            this.data.goals[editIndex].name = formData.name;
            this.data.goals[editIndex].targetAmount = parseFloat(formData.targetAmount);
            this.data.goals[editIndex].currentAmount = parseFloat(formData.currentAmount || 0);
            this.data.goals[editIndex].deadline = parseInt(formData.deadline) || null;
        } else {
            this.data.goals.push({
                id: Date.now(),
                icon: formData.icon,
                name: formData.name,
                targetAmount: parseFloat(formData.targetAmount),
                currentAmount: parseFloat(formData.currentAmount || 0),
                deadline: parseInt(formData.deadline) || null,
                createdAt: new Date().toISOString()
            });
        }
        this.saveData();
        this.renderGoals();
    });
};

FinanceApp.prototype.contributeToGoal = function(index) {
    const goal = this.data.goals[index];
    const remaining = goal.targetAmount - goal.currentAmount;
    
    this.showFormModal('Пополнить цель', `
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
            ${goal.icon} ${goal.name}
        </p>
        <p style="font-size: 0.875rem; margin-bottom: 1rem;">
            Накоплено: ${this.formatMoney(goal.currentAmount)} из ${this.formatMoney(goal.targetAmount)}
        </p>
        <div class="form-group">
            <label>Сумма пополнения</label>
            <input type="number" name="amount" placeholder="Например: 500000" step="0.01" max="${remaining}" required>
        </div>
    `, (formData) => {
        const amount = parseFloat(formData.amount);
        this.data.goals[index].currentAmount += amount;
        
        // Ограничиваем максимумом
        if (this.data.goals[index].currentAmount > this.data.goals[index].targetAmount) {
            this.data.goals[index].currentAmount = this.data.goals[index].targetAmount;
        }
        
        this.saveData();
        this.renderGoals();
        
        // Проверяем достижение цели
        if (this.data.goals[index].currentAmount >= this.data.goals[index].targetAmount) {
            setTimeout(() => {
                alert(`🎉 Поздравляем! Цель "${goal.name}" достигнута!`);
            }, 300);
        }
    });
};

FinanceApp.prototype.editGoal = function(index) {
    this.showGoalForm(index);
};

FinanceApp.prototype.deleteGoal = function(index) {
    if (confirm('Удалить цель?')) {
        this.data.goals.splice(index, 1);
        this.saveData();
        this.renderGoals();
    }
};

FinanceApp.prototype.renderGoals = function() {
    const container = document.getElementById('goalsList');
    
    if (!this.data.goals || this.data.goals.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Цели не созданы</p></div>';
        return;
    }

    container.innerHTML = '';

    this.data.goals.forEach((goal, index) => {
        const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount * 100));
        const remaining = goal.targetAmount - goal.currentAmount;
        const isCompleted = percentage >= 100;
        
        // Расчет срока
        let timeInfo = '';
        if (goal.deadline && !isCompleted) {
            const created = new Date(goal.createdAt);
            const now = new Date();
            const monthsPassed = this.getMonthsDiff(created, now);
            const monthsLeft = goal.deadline - monthsPassed;
            
            if (monthsLeft > 0) {
                const monthlyNeed = remaining / monthsLeft;
                timeInfo = `Осталось ${monthsLeft} мес. • ${this.formatMoney(monthlyNeed)}/мес`;
            } else {
                timeInfo = 'Срок истек';
            }
        }

        const item = document.createElement('div');
        item.className = `goal-item ${isCompleted ? 'completed' : ''}`;
        
        item.innerHTML = `
            <div class="goal-item-header">
                <div class="goal-item-icon">${goal.icon}</div>
                <div class="goal-item-info">
                    <div class="goal-item-title">${goal.name}</div>
                    <div class="goal-item-subtitle">${timeInfo || 'Без срока'}</div>
                </div>
                <div class="goal-item-amount">
                    <div style="font-size: 1rem; font-weight: 500; color: var(--accent);">${percentage.toFixed(0)}%</div>
                    <div>${this.formatMoney(goal.currentAmount)}</div>
                </div>
            </div>
            <div class="goal-progress-bar">
                <div class="goal-progress-fill ${isCompleted ? 'completed' : ''}" style="width: ${percentage}%"></div>
            </div>
            <div class="goal-item-stats">
                <span>${isCompleted ? '✓ Цель достигнута!' : `Осталось: ${this.formatMoney(remaining)}`}</span>
                <span>Цель: ${this.formatMoney(goal.targetAmount)}</span>
            </div>
            <div class="goal-item-actions">
                ${!isCompleted ? `<button class="goal-contribute-btn">+ Пополнить</button>` : ''}
                <button class="btn-small edit">Изменить</button>
                <button class="btn-small delete">Удалить</button>
            </div>
        `;

        const contributeBtn = item.querySelector('.goal-contribute-btn');
        if (contributeBtn) {
            contributeBtn.addEventListener('click', () => this.contributeToGoal(index));
        }

        item.querySelector('.edit').addEventListener('click', () => this.editGoal(index));
        item.querySelector('.delete').addEventListener('click', () => this.deleteGoal(index));

        container.appendChild(item);
    });
};

// Инициализация всех новых функций
const originalInitGoalsWrapper = FinanceApp.prototype.init;
FinanceApp.prototype.init = function() {
    originalInitGoalsWrapper.call(this);
    this.initGoals();
    this.setupGoalsEventListeners();
    this.setupSearchListener();
};


// ============= ШАБЛОНЫ ТРАНЗАКЦИЙ =============

FinanceApp.prototype.initTemplates = function() {
    if (!this.data.templates) {
        this.data.templates = [];
    }
};

FinanceApp.prototype.saveAsTemplate = function() {
    const type = document.getElementById('transactionType').value;
    const amount = document.getElementById('transactionAmount').value;
    const source = document.getElementById('transactionSource').value;
    const category = document.getElementById('transactionCategory').value;
    const comment = document.getElementById('transactionComment').value;
    
    if (!category) {
        alert('Укажите категорию для сохранения шаблона');
        return;
    }
    
    const templateName = prompt('Название шаблона:', category);
    if (!templateName) return;
    
    this.data.templates.push({
        id: Date.now(),
        name: templateName,
        type: type,
        amount: parseFloat(amount) || 0,
        source: source,
        category: category,
        comment: comment,
        createdAt: new Date().toISOString()
    });
    
    this.saveData();
    alert('✓ Шаблон сохранен');
};

FinanceApp.prototype.showTemplates = function() {
    if (!this.data.templates || this.data.templates.length === 0) {
        alert('У вас нет сохраненных шаблонов');
        return;
    }
    
    const modal = document.getElementById('formModal');
    const title = document.getElementById('formModalTitle');
    const body = document.getElementById('formModalBody');
    
    title.textContent = 'Выберите шаблон';
    
    let html = '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';
    
    this.data.templates.forEach((template, index) => {
        const icon = this.getCategoryIcon(template.category);
        const typeClass = template.type === 'income' ? 'income' : 'expense';
        
        html += `
            <div class="item" style="padding: 1rem; cursor: pointer;" data-index="${index}">
                <div style="display: flex; align-items: center; flex: 1;">
                    <span class="category-icon">${icon}</span>
                    <div class="item-info" style="flex: 1;">
                        <div class="item-name">${template.name}</div>
                        <div class="item-meta">${template.category} • ${this.formatMoney(template.amount)}</div>
                    </div>
                </div>
                <button class="btn-small delete" data-index="${index}" style="margin-left: 0.5rem;">×</button>
            </div>
        `;
    });
    
    html += '</div>';
    body.innerHTML = html;
    
    document.querySelector('#formModalForm .modal-actions').style.display = 'none';
    modal.classList.add('active');
    
    // Обработчики
    document.querySelectorAll('.item[data-index]').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete')) return;
            const index = parseInt(item.dataset.index);
            this.applyTemplate(index);
            modal.classList.remove('active');
        });
    });
    
    document.querySelectorAll('.btn-small.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.target.dataset.index);
            if (confirm('Удалить шаблон?')) {
                this.data.templates.splice(index, 1);
                this.saveData();
                modal.classList.remove('active');
            }
        });
    });
};

FinanceApp.prototype.applyTemplate = function(index) {
    const template = this.data.templates[index];
    
    document.getElementById('transactionAmount').value = template.amount || '';
    document.getElementById('transactionSource').value = template.source || '';
    document.getElementById('transactionCategory').value = template.category || '';
    document.getElementById('transactionComment').value = template.comment || '';
};

FinanceApp.prototype.populateCategoryDatalist = function() {
    const datalist = document.getElementById('categoryList');
    if (!datalist) return;
    
    const categories = new Set();
    
    // Из транзакций
    this.data.transactions.forEach(t => {
        if (t.category) categories.add(t.category);
    });
    
    // Из бюджетов
    if (this.data.budgets) {
        this.data.budgets.forEach(b => categories.add(b.category));
    }
    
    // Популярные категории
    Object.keys(this.categoryIcons).forEach(cat => categories.add(cat));
    
    datalist.innerHTML = '';
    [...categories].sort().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        datalist.appendChild(option);
    });
};

// ============= ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ =============

FinanceApp.prototype.initTheme = function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.setTheme(savedTheme);
};

FinanceApp.prototype.setTheme = function(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });
};

FinanceApp.prototype.setupThemeSwitcher = function() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    console.log('Setting up Theme switcher, buttons found:', themeButtons.length);
    
    themeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            console.log('Theme button clicked:', e.target.dataset.theme);
            const theme = e.target.dataset.theme;
            this.setTheme(theme);
        });
    });
};

// Обновляем showTransactionForm для заполнения datalist
const originalShowTransactionForm = FinanceApp.prototype.showTransactionForm;
FinanceApp.prototype.showTransactionForm = function(type) {
    originalShowTransactionForm.call(this, type);
    this.populateCategoryDatalist();
    
    // Добавляем обработчики для новых кнопок
    document.getElementById('useTemplateBtn')?.addEventListener('click', () => {
        this.showTemplates();
    });
    
    document.getElementById('saveAsTemplateBtn')?.addEventListener('click', () => {
        this.saveAsTemplate();
    });
};

// Инициализация всех новых функций
const originalInitTemplatesWrapper = FinanceApp.prototype.init;
FinanceApp.prototype.init = function() {
    originalInitTemplatesWrapper.call(this);
    this.initTemplates();
    this.initTheme();
    this.setupThemeSwitcher();
};


// ============= СРАВНЕНИЕ ПЕРИОДОВ =============

FinanceApp.prototype.renderComparison = function() {
    const container = document.getElementById('comparisonSection');
    if (!container) return;
    
    const { start: currentStart, end: currentEnd } = this.getStatsPeriodDates();
    
    // Получаем предыдущий период
    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    
    const prevStart = new Date(prevEnd);
    if (this.selectedStatsPeriod === 'month') {
        prevStart.setMonth(prevStart.getMonth(), 1);
    } else if (this.selectedStatsPeriod === 'quarter') {
        prevStart.setMonth(prevStart.getMonth() - 3);
    } else if (this.selectedStatsPeriod === 'year') {
        prevStart.setFullYear(prevStart.getFullYear() - 1);
    }
    
    // Текущий период
    const currentTransactions = this.data.transactions.filter(t => {
        const date = new Date(t.date);
        return date >= currentStart && date <= currentEnd;
    });
    
    // Предыдущий период
    const prevTransactions = this.data.transactions.filter(t => {
        const date = new Date(t.date);
        return date >= prevStart && date <= prevEnd;
    });
    
    const currentIncome = currentTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const currentExpense = currentTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const prevIncome = prevTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const prevExpense = prevTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    const incomeChange = currentIncome - prevIncome;
    const expenseChange = currentExpense - prevExpense;
    const incomeChangePercent = prevIncome > 0 ? (incomeChange / prevIncome * 100) : 0;
    const expenseChangePercent = prevExpense > 0 ? (expenseChange / prevExpense * 100) : 0;
    
    const periodNames = {
        'month': 'месяцем',
        'quarter': 'кварталом',
        'year': 'годом'
    };
    
    container.innerHTML = `
        <!-- Доходы -->
        <div class="comparison-card">
            <div class="comparison-header">
                <div class="comparison-title">💰 Доходы</div>
                <div class="trend-indicator ${incomeChange > 0 ? 'up' : incomeChange < 0 ? 'down' : 'same'}">
                    ${incomeChange > 0 ? '↑' : incomeChange < 0 ? '↓' : '→'} ${Math.abs(incomeChangePercent).toFixed(0)}%
                </div>
            </div>
            <div class="comparison-values">
                <div class="comparison-value">
                    <div class="comparison-label">Прошлый период</div>
                    <div class="comparison-amount">${this.formatMoney(prevIncome)}</div>
                </div>
                <div class="comparison-arrow ${incomeChange > 0 ? 'up' : incomeChange < 0 ? 'down' : 'same'}">
                    ${incomeChange > 0 ? '→' : incomeChange < 0 ? '→' : '→'}
                </div>
                <div class="comparison-value">
                    <div class="comparison-label">Текущий период</div>
                    <div class="comparison-amount">${this.formatMoney(currentIncome)}</div>
                </div>
            </div>
            <div class="comparison-change">
                <div class="comparison-change-value ${incomeChange > 0 ? 'positive' : incomeChange < 0 ? 'negative' : ''}">
                    ${incomeChange > 0 ? '+' : ''}${this.formatMoney(incomeChange)} 
                    (${incomeChange > 0 ? '+' : ''}${incomeChangePercent.toFixed(1)}%)
                </div>
            </div>
        </div>
        
        <!-- Расходы -->
        <div class="comparison-card">
            <div class="comparison-header">
                <div class="comparison-title">💸 Расходы</div>
                <div class="trend-indicator ${expenseChange < 0 ? 'up' : expenseChange > 0 ? 'down' : 'same'}">
                    ${expenseChange > 0 ? '↑' : expenseChange < 0 ? '↓' : '→'} ${Math.abs(expenseChangePercent).toFixed(0)}%
                </div>
            </div>
            <div class="comparison-values">
                <div class="comparison-value">
                    <div class="comparison-label">Прошлый период</div>
                    <div class="comparison-amount">${this.formatMoney(prevExpense)}</div>
                </div>
                <div class="comparison-arrow ${expenseChange > 0 ? 'down' : expenseChange < 0 ? 'up' : 'same'}">
                    →
                </div>
                <div class="comparison-value">
                    <div class="comparison-label">Текущий период</div>
                    <div class="comparison-amount">${this.formatMoney(currentExpense)}</div>
                </div>
            </div>
            <div class="comparison-change">
                <div class="comparison-change-value ${expenseChange < 0 ? 'positive' : expenseChange > 0 ? 'negative' : ''}">
                    ${expenseChange > 0 ? '+' : ''}${this.formatMoney(expenseChange)} 
                    (${expenseChange > 0 ? '+' : ''}${expenseChangePercent.toFixed(1)}%)
                </div>
            </div>
        </div>
        
        <!-- Инсайты -->
        ${this.generateInsights(incomeChange, expenseChange, incomeChangePercent, expenseChangePercent)}
    `;
};

FinanceApp.prototype.generateInsights = function(incomeChange, expenseChange, incomeChangePercent, expenseChangePercent) {
    const insights = [];
    
    // Инсайты по доходам
    if (incomeChange > 0 && incomeChangePercent > 20) {
        insights.push({
            icon: '📈',
            title: 'Отличный рост доходов!',
            description: `Ваши доходы выросли на ${incomeChangePercent.toFixed(0)}%. Продолжайте в том же духе!`
        });
    } else if (incomeChange < 0 && Math.abs(incomeChangePercent) > 20) {
        insights.push({
            icon: '⚠️',
            title: 'Снижение доходов',
            description: `Доходы снизились на ${Math.abs(incomeChangePercent).toFixed(0)}%. Возможно, стоит поискать дополнительные источники.`
        });
    }
    
    // Инсайты по расходам
    if (expenseChange < 0 && Math.abs(expenseChangePercent) > 15) {
        insights.push({
            icon: '🎉',
            title: 'Экономия работает!',
            description: `Вы сократили расходы на ${Math.abs(expenseChangePercent).toFixed(0)}%. Отличная работа!`
        });
    } else if (expenseChange > 0 && expenseChangePercent > 20) {
        insights.push({
            icon: '💡',
            title: 'Расходы растут',
            description: `Траты увеличились на ${expenseChangePercent.toFixed(0)}%. Проверьте категории расходов.`
        });
    }
    
    // Инсайт по балансу
    const currentNet = incomeChange - expenseChange;
    if (currentNet > 0) {
        insights.push({
            icon: '✅',
            title: 'Положительная динамика',
            description: `В этом периоде вы сберегли на ${this.formatMoney(Math.abs(currentNet))} больше, чем в прошлом.`
        });
    }
    
    if (insights.length === 0) return '';
    
    return insights.map(insight => `
        <div class="insight-card">
            <div class="insight-icon">${insight.icon}</div>
            <div class="insight-title">${insight.title}</div>
            <div class="insight-description">${insight.description}</div>
        </div>
    `).join('');
};

// Обновляем renderStatistics для включения сравнения
const originalRenderStatisticsComparison = FinanceApp.prototype.renderStatistics;
FinanceApp.prototype.renderStatistics = function() {
    originalRenderStatisticsComparison.call(this);
    this.renderComparison();
};

// ============= СВАЙПЫ ДЛЯ УДАЛЕНИЯ =============

FinanceApp.prototype.setupSwipeGestures = function() {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let swipeTarget = null;
    
    document.addEventListener('touchstart', (e) => {
        const item = e.target.closest('.transaction, .history-item');
        if (!item) return;
        
        swipeTarget = item;
        startX = e.touches[0].clientX;
        isDragging = true;
        item.classList.add('swiping');
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging || !swipeTarget) return;
        
        currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        // Только свайп влево
        if (deltaX < 0) {
            swipeTarget.style.transform = `translateX(${Math.max(deltaX, -100)}px)`;
        }
    });
    
    document.addEventListener('touchend', () => {
        if (!isDragging || !swipeTarget) return;
        
        const deltaX = currentX - startX;
        
        if (deltaX < -50) {
            // Свайп достаточно длинный - показываем кнопки
            swipeTarget.style.transform = 'translateX(-80px)';
            swipeTarget.classList.add('swiped');
        } else {
            // Возвращаем обратно
            swipeTarget.style.transform = '';
            swipeTarget.classList.remove('swiped');
        }
        
        swipeTarget.classList.remove('swiping');
        isDragging = false;
        swipeTarget = null;
    });
};

// ============= УМНОЕ ОПРЕДЕЛЕНИЕ КАТЕГОРИИ =============

FinanceApp.prototype.suggestCategory = function(comment) {
    if (!comment) return null;
    
    const commentLower = comment.toLowerCase();
    
    // Словарь ключевых слов
    const keywords = {
        'Продукты': ['продукт', 'магазин', 'супермаркет', 'макро', 'корзинка', 'bazar'],
        'Кафе': ['кафе', 'coffee', 'кофе', 'cafe', 'старбакс'],
        'Ресторан': ['ресторан', 'restaurant', 'пиццерия', 'суши'],
        'Такси': ['такси', 'uber', 'yandex', 'яндекс', 'bolt'],
        'Бензин': ['бензин', 'азс', 'заправка', 'газ', 'топливо'],
        'Транспорт': ['автобус', 'метро', 'маршрутка', 'транспорт'],
        'Аренда': ['аренда', 'квартира', 'rent', 'жилье'],
        'Коммуналка': ['коммунал', 'свет', 'газ', 'вода', 'электричество'],
        'Интернет': ['интернет', 'wi-fi', 'wifi', 'провайдер', 'beeline', 'ucell'],
        'Телефон': ['телефон', 'связь', 'мобильный', 'тариф'],
        'Кино': ['кино', 'cinema', 'билет', 'фильм'],
        'Спорт': ['спорт', 'зал', 'фитнес', 'тренажер', 'gym'],
        'Врач': ['врач', 'клиника', 'доктор', 'hospital', 'больница'],
        'Аптека': ['аптека', 'лекарство', 'pharmacy', 'таблетка'],
        'Одежда': ['одежда', 'магазин одежды', 'zara', 'h&m'],
        'Техника': ['техника', 'компьютер', 'телефон', 'laptop', 'phone'],
        'Подписки': ['подписка', 'subscription', 'netflix', 'spotify', 'premium'],
        'Книги': ['книга', 'book', 'литература'],
        'Образование': ['курс', 'учеба', 'обучение', 'образование'],
    };
    
    for (const [category, words] of Object.entries(keywords)) {
        if (words.some(word => commentLower.includes(word))) {
            return category;
        }
    }
    
    return null;
};

FinanceApp.prototype.showCategorySuggestions = function() {
    const comment = document.getElementById('transactionComment').value;
    const suggested = this.suggestCategory(comment);
    
    if (suggested) {
        // Автоматически предлагаем категорию
        const categoryInput = document.getElementById('transactionCategory');
        if (!categoryInput.value) {
            categoryInput.value = suggested;
            // Визуальная подсказка
            categoryInput.style.borderColor = 'var(--accent)';
            setTimeout(() => {
                categoryInput.style.borderColor = '';
            }, 1000);
        }
    }
};

// Добавляем слушатель на комментарий для автоопределения категории
const originalShowTransactionFormSuggestions = FinanceApp.prototype.showTransactionForm;
FinanceApp.prototype.showTransactionForm = function(type) {
    originalShowTransactionFormSuggestions.call(this, type);
    
    const commentInput = document.getElementById('transactionComment');
    if (commentInput) {
        commentInput.addEventListener('input', () => {
            this.showCategorySuggestions();
        });
    }
};

// ============= ДОСТИЖЕНИЯ =============

FinanceApp.prototype.checkAchievements = function() {
    const achievements = [];
    
    // 10 транзакций
    if (this.data.transactions.length === 10) {
        achievements.push({ icon: '🎯', title: 'Первые 10 операций!' });
    }
    
    // 100 транзакций
    if (this.data.transactions.length === 100) {
        achievements.push({ icon: '💯', title: 'Сотня операций!' });
    }
    
    // Месяц использования
    const firstTransaction = this.data.transactions.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    if (firstTransaction) {
        const monthsPassed = this.getMonthsDiff(new Date(firstTransaction.date), new Date());
        if (monthsPassed === 1 && this.data.transactions.length > 0) {
            achievements.push({ icon: '📅', title: 'Месяц с приложением!' });
        }
    }
    
    // Достигнута цель
    const completedGoals = this.data.goals?.filter(g => g.currentAmount >= g.targetAmount).length || 0;
    if (completedGoals > 0) {
        achievements.push({ icon: '🎉', title: `Достигнуто целей: ${completedGoals}` });
    }
    
    return achievements;
};

// Инициализация
const originalInitComparison = FinanceApp.prototype.init;
FinanceApp.prototype.init = function() {
    originalInitComparison.call(this);
    this.setupSwipeGestures();
};


// ============= ЭКСПОРТ В CSV =============

FinanceApp.prototype.exportToCSV = function() {
    const transactions = [...this.data.transactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    if (transactions.length === 0) {
        alert('Нет транзакций для экспорта');
        return;
    }
    
    // Заголовки
    let csv = 'Дата,Тип,Категория,Сумма,Источник,Комментарий\n';
    
    // Данные
    transactions.forEach(t => {
        const date = t.date;
        const type = t.type === 'income' ? 'Доход' : t.type === 'expense' ? 'Расход' : 'Перевод';
        const category = t.category || '';
        const amount = t.amount;
        
        let source = '';
        if (t.type === 'transfer') {
            source = `${t.fromName} → ${t.toName}`;
        } else {
            const [sourceType, sourceId] = t.source.split('-');
            const id = parseInt(sourceId);
            
            if (sourceType === 'card') {
                const card = this.data.cards.find(c => c.id === id);
                if (card) source = `${card.name} (${card.bank})`;
            } else if (sourceType === 'cash') {
                const cash = this.data.cash.find(c => c.id === id);
                if (cash) source = cash.name;
            }
        }
        
        const comment = (t.comment || '').replace(/"/g, '""'); // Экранируем кавычки
        
        csv += `${date},${type},"${category}",${amount},"${source}","${comment}"\n`;
    });
    
    // Скачивание
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM для правильной кодировки
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moliya-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('✓ Транзакции экспортированы в CSV');
};

// Добавляем обработчик
const originalSetupEventListenersCSV = FinanceApp.prototype.setupEventListeners;
FinanceApp.prototype.setupEventListeners = function() {
    originalSetupEventListenersCSV.call(this);
    
    document.getElementById('menuExportCSV')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.exportToCSV();
        this.closeMenu();
    });
};

// ============= ДЕТАЛЬНАЯ АНАЛИТИКА =============

FinanceApp.prototype.getDetailedAnalytics = function() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthTransactions = this.data.transactions.filter(t => {
        const date = new Date(t.date);
        return date >= monthStart;
    });
    
    const analytics = {
        totalTransactions: this.data.transactions.length,
        thisMonthTransactions: thisMonthTransactions.length,
        totalIncome: 0,
        totalExpense: 0,
        averageTransaction: 0,
        mostExpensiveDay: null,
        mostActiveDay: null,
        topCategory: null,
        savingsRate: 0
    };
    
    // Считаем доходы и расходы
    this.data.transactions.forEach(t => {
        if (t.type === 'income') analytics.totalIncome += t.amount;
        else if (t.type === 'expense') analytics.totalExpense += t.amount;
    });
    
    // Средняя транзакция
    if (this.data.transactions.length > 0) {
        analytics.averageTransaction = (analytics.totalIncome + analytics.totalExpense) / this.data.transactions.length;
    }
    
    // Коэффициент сбережений
    if (analytics.totalIncome > 0) {
        analytics.savingsRate = ((analytics.totalIncome - analytics.totalExpense) / analytics.totalIncome * 100);
    }
    
    // Самый дорогой день
    const dayTotals = {};
    this.data.transactions.filter(t => t.type === 'expense').forEach(t => {
        if (!dayTotals[t.date]) dayTotals[t.date] = 0;
        dayTotals[t.date] += t.amount;
    });
    
    if (Object.keys(dayTotals).length > 0) {
        analytics.mostExpensiveDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];
    }
    
    // Самый активный день
    const dayCounts = {};
    this.data.transactions.forEach(t => {
        if (!dayCounts[t.date]) dayCounts[t.date] = 0;
        dayCounts[t.date]++;
    });
    
    if (Object.keys(dayCounts).length > 0) {
        analytics.mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    }
    
    // Топ категория
    const categoryTotals = {};
    this.data.transactions.filter(t => t.type === 'expense').forEach(t => {
        if (!categoryTotals[t.category]) categoryTotals[t.category] = 0;
        categoryTotals[t.category] += t.amount;
    });
    
    if (Object.keys(categoryTotals).length > 0) {
        analytics.topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    }
    
    return analytics;
};

// ============= БЫСТРАЯ СТАТИСТИКА НА ДАШБОРДЕ =============

FinanceApp.prototype.renderQuickStats = function() {
    const analytics = this.getDetailedAnalytics();
    
    // Можно добавить карточку быстрой статистики на дашборд
    console.log('Analytics:', analytics);
};

// ============= УЛУЧШЕНИЕ ПРОИЗВОДИТЕЛЬНОСТИ =============

FinanceApp.prototype.optimizeTransactions = function() {
    // Кэширование частых запросов
    if (!this._transactionCache) {
        this._transactionCache = {};
    }
    
    // Кэш сбрасывается при изменении данных
};

// Обновляем saveData для сброса кэша
const originalSaveDataCache = FinanceApp.prototype.saveData;
FinanceApp.prototype.saveData = function() {
    this._transactionCache = {};
    originalSaveDataCache.call(this);
};

// ============= СОВЕТЫ ПО ЭКОНОМИИ =============

FinanceApp.prototype.getSavingsTips = function() {
    const tips = [];
    const analytics = this.getDetailedAnalytics();
    
    // Совет 1: Коэффициент сбережений
    if (analytics.savingsRate < 10) {
        tips.push({
            icon: '💡',
            title: 'Попробуйте правило 50/30/20',
            description: '50% на необходимое, 30% на желаемое, 20% на сбережения'
        });
    }
    
    // Совет 2: Частые мелкие траты
    const smallTransactions = this.data.transactions.filter(t => 
        t.type === 'expense' && t.amount < 50000
    );
    
    if (smallTransactions.length > 20) {
        const total = smallTransactions.reduce((sum, t) => sum + t.amount, 0);
        tips.push({
            icon: '🔍',
            title: 'Контролируйте мелкие траты',
            description: `${smallTransactions.length} мелких покупок на ${this.formatMoney(total)} в месяц`
        });
    }
    
    // Совет 3: Дорогие категории
    if (analytics.topCategory) {
        tips.push({
            icon: '📊',
            title: `Больше всего тратите на: ${analytics.topCategory[0]}`,
            description: `${this.formatMoney(analytics.topCategory[1])} за все время`
        });
    }
    
    return tips;
};

// ============= KEYBOARD SHORTCUTS =============

FinanceApp.prototype.setupKeyboardShortcuts = function() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + I = добавить доход
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            this.showTransactionForm('income');
        }
        
        // Ctrl/Cmd + E = добавить расход
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.showTransactionForm('expense');
        }
        
        // Escape = закрыть модальные окна
        if (e.key === 'Escape') {
            this.closeMenu();
            this.closeModal();
            this.closeFormModal();
        }
    });
};

// Инициализация финальных функций
const originalInitFinal = FinanceApp.prototype.init;
FinanceApp.prototype.init = function() {
    originalInitFinal.call(this);
    
    // Убедимся что все модули инициализированы
    if (!this.data.budgets) this.initBudgets();
    if (!this.data.goals) this.initGoals();
    if (!this.data.recurring) this.initRecurring();
    if (!this.data.templates) this.initTemplates();
    
    // Вызываем все setup функции явно
    this.setupStatisticsEventListeners();
    this.setupBudgetsEventListeners();
    this.setupGoalsEventListeners();
    this.setupThemeSwitcher();
    this.setupKeyboardShortcuts();
    this.setupSearchListener();
    
    console.log('✓ All modules initialized');
};

console.log('🎉 Молия Finance App loaded successfully!');
console.log('📊 Version: 3.0.0');
console.log('✨ Full-featured personal finance manager');

// ПРИНУДИТЕЛЬНАЯ ИНИЦИАЛИЗАЦИЯ ВСЕХ SETUP ФУНКЦИЙ
console.log('🔧 Force initializing all setup functions...');

// Даем время для полной загрузки DOM
setTimeout(() => {
    console.log('🔧 Running setup functions now...');
    
    // Инициализируем модули данных
    if (app.initStatistics) {
        app.initStatistics();
    }
    if (app.initBudgets) {
        app.initBudgets();
    }
    if (app.initGoals) {
        app.initGoals();
    }
    if (app.initRecurring) {
        app.initRecurring();
    }
    if (app.initTemplates) {
        app.initTemplates();
    }
    if (app.initTheme) {
        app.initTheme();
    }
    
    // Инициализируем обработчики событий
    if (app.setupStatisticsEventListeners) {
        app.setupStatisticsEventListeners();
    }
    if (app.setupBudgetsEventListeners) {
        app.setupBudgetsEventListeners();
    }
    if (app.setupGoalsEventListeners) {
        app.setupGoalsEventListeners();
    }
    if (app.setupThemeSwitcher) {
        app.setupThemeSwitcher();
    }
    if (app.setupSearchListener) {
        app.setupSearchListener();
    }
    
    console.log('✅ All setup functions executed!');
}, 200);



// === DEBUG LOGGING ===
console.log('=== CHECKING SETUP ===');
console.log('Goals setup:', typeof app.setupGoalsEventListeners);
console.log('Budgets setup:', typeof app.setupBudgetsEventListeners);
console.log('Statistics setup:', typeof app.setupStatisticsEventListeners);
console.log('Theme setup:', typeof app.setupThemeSwitcher);

console.log('=== CHECKING ELEMENTS ===');
setTimeout(() => {
    console.log('menuGoals:', document.getElementById('menuGoals'));
    console.log('menuBudgets:', document.getElementById('menuBudgets'));
    console.log('menuStatistics:', document.getElementById('menuStatistics'));
    console.log('goalsView:', document.getElementById('goalsView'));
    console.log('budgetsView:', document.getElementById('budgetsView'));
    console.log('statisticsView:', document.getElementById('statisticsView'));
    console.log('theme-btn:', document.querySelectorAll('.theme-btn').length);
}, 100);

