// ============= Virtual Scrolling для больших списков =============
// Рендерит только видимые элементы, остальные виртуальные

class VirtualScroller {
    constructor(container, options = {}) {
        this.container = container;
        this.itemHeight = options.itemHeight || 80; // Высота одного элемента
        this.bufferSize = options.bufferSize || 5; // Сколько элементов рендерить за пределами видимой области
        this.renderItem = options.renderItem; // Функция рендеринга элемента
        
        this.items = [];
        this.scrollTop = 0;
        this.viewportHeight = 0;
        this.totalHeight = 0;
        
        this.wrapper = null;
        this.content = null;
        
        this.init();
    }
    
    init() {
        // Создаем обертку для скроллинга
        this.wrapper = document.createElement('div');
        this.wrapper.style.cssText = `
            position: relative;
            overflow-y: auto;
            height: 100%;
            -webkit-overflow-scrolling: touch;
        `;
        
        this.content = document.createElement('div');
        this.content.style.cssText = `
            position: relative;
            width: 100%;
        `;
        
        this.wrapper.appendChild(this.content);
        this.container.appendChild(this.wrapper);
        
        // Слушаем скролл
        this.wrapper.addEventListener('scroll', () => {
            this.scrollTop = this.wrapper.scrollTop;
            this.render();
        });
        
        // Отслеживаем изменение размера
        const resizeObserver = new ResizeObserver(() => {
            this.viewportHeight = this.wrapper.clientHeight;
            this.render();
        });
        resizeObserver.observe(this.wrapper);
        
        this.viewportHeight = this.wrapper.clientHeight;
    }
    
    setItems(items) {
        this.items = items;
        this.totalHeight = items.length * this.itemHeight;
        this.content.style.height = `${this.totalHeight}px`;
        this.render();
    }
    
    render() {
        if (!this.items || this.items.length === 0) {
            this.content.innerHTML = '';
            return;
        }
        
        // Вычисляем видимый диапазон
        const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.bufferSize);
        const endIndex = Math.min(
            this.items.length - 1,
            Math.ceil((this.scrollTop + this.viewportHeight) / this.itemHeight) + this.bufferSize
        );
        
        // Очищаем контент
        this.content.innerHTML = '';
        
        // Рендерим только видимые элементы
        for (let i = startIndex; i <= endIndex; i++) {
            const item = this.items[i];
            const element = this.renderItem(item, i);
            
            // Позиционируем элемент
            element.style.position = 'absolute';
            element.style.top = `${i * this.itemHeight}px`;
            element.style.width = '100%';
            element.style.height = `${this.itemHeight}px`;
            
            this.content.appendChild(element);
        }
    }
    
    scrollToIndex(index) {
        const scrollTop = index * this.itemHeight;
        this.wrapper.scrollTop = scrollTop;
    }
    
    scrollToTop() {
        this.wrapper.scrollTop = 0;
    }
    
    destroy() {
        this.container.removeChild(this.wrapper);
    }
}

window.VirtualScroller = VirtualScroller;

