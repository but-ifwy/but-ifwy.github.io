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
        document.getElementById('addAssetBtn').addEventListener('click', () => this.showView('assets'));

        document.getElementById('backFromAssets').addEventListener('click', () => this.showView('calendar'));
        document.getElementById('backFromTransaction').addEventListener('click', () => this.showView('calendar'));
        document.getElementById('backFromCalculator').addEventListener('click', () => this.showView('calendar'));
        document.getElementById('backFromHistory').addEventListener('click', () => this.showView('calendar'));

        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        document.getElementById('calculatorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateDeposit();
        });

        // История операций - фильтры
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
            else expense += t.amount;
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
            
            const amountClass = transaction.type === 'income' ? 'income' : 'expense';
            const amountSign = transaction.type === 'income' ? '+' : '-';
            
            item.innerHTML = `
                <div class="stats-transaction-header">
                    <div class="stats-transaction-category">${transaction.category}</div>
                    <div class="stats-transaction-amount ${amountClass}">
                        ${amountSign}${this.formatMoney(transaction.amount)}
                    </div>
                </div>
                ${transaction.comment ? `<div class="stats-transaction-comment">${transaction.comment}</div>` : ''}
                <div class="stats-transaction-actions">
                    <button class="btn-small edit" data-id="${transaction.id}">Изменить</button>
                    <button class="btn-small delete" data-id="${transaction.id}">Удалить</button>
                </div>
            `;

            item.querySelector('.edit').addEventListener('click', () => {
                this.editTransaction(transaction.id);
            });

            item.querySelector('.delete').addEventListener('click', () => {
                this.deleteTransaction(transaction.id);
            });

            container.appendChild(item);
        });
    }

    editTransaction(id) {
        const transaction = this.data.transactions.find(t => t.id === id);
        if (!transaction) return;

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

            const amountClass = transaction.type === 'income' ? 'income' : 'expense';
            const amountSign = transaction.type === 'income' ? '+' : '-';

            // Получаем название источника
            const [sourceType, sourceId] = transaction.source.split('-');
            const id = parseInt(sourceId);
            let sourceName = 'Неизвестно';
            
            if (sourceType === 'card') {
                const card = this.data.cards.find(c => c.id === id);
                if (card) sourceName = `${card.name} (${card.bank})`;
            } else if (sourceType === 'cash') {
                const cash = this.data.cash.find(c => c.id === id);
                if (cash) sourceName = cash.name;
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
                <div class="history-item-source">Источник: ${sourceName}</div>
                <div class="history-item-actions">
                    <button class="btn-small edit">Изменить</button>
                    <button class="btn-small delete">Удалить</button>
                </div>
            `;

            item.querySelector('.edit').addEventListener('click', () => {
                this.editTransaction(transaction.id);
            });

            item.querySelector('.delete').addEventListener('click', () => {
                this.deleteTransaction(transaction.id);
            });

            container.appendChild(item);
        });
    }

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

            item.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-category">${transaction.category}</div>
                    <div class="transaction-meta">${formattedDate}${transaction.comment ? ' • ' + transaction.comment : ''}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatMoney(transaction.amount)}
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
