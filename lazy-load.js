// ============= Ленивая загрузка компонентов =============
// Загружаем графики и тяжелые компоненты только когда они нужны

class LazyLoader {
    constructor() {
        this.loadedModules = new Set();
        this.observers = new Map();
    }
    
    // Intersection Observer для ленивой загрузки
    observeElement(element, callback, options = {}) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: options.rootMargin || '50px',
            threshold: options.threshold || 0.1
        });
        
        observer.observe(element);
        this.observers.set(element, observer);
        
        return observer;
    }
    
    // Загрузка Chart.js только когда нужно
    async loadChartJS() {
        if (this.loadedModules.has('chartjs')) {
            return window.Chart;
        }
        
        return new Promise((resolve, reject) => {
            if (window.Chart) {
                this.loadedModules.add('chartjs');
                resolve(window.Chart);
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
            script.onload = () => {
                this.loadedModules.add('chartjs');
                console.log('✓ Chart.js loaded');
                resolve(window.Chart);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Ленивая загрузка графика
    async loadChart(container, config) {
        const Chart = await this.loadChartJS();
        const canvas = container.querySelector('canvas') || document.createElement('canvas');
        
        if (!container.querySelector('canvas')) {
            container.appendChild(canvas);
        }
        
        return new Chart(canvas, config);
    }
    
    // Предзагрузка изображений
    preloadImages(urls) {
        return Promise.all(
            urls.map(url => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(url);
                    img.onerror = reject;
                    img.src = url;
                });
            })
        );
    }
    
    // Debounce для оптимизации частых вызовов
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Throttle для ограничения частоты вызовов
    throttle(func, limit = 100) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Очистка наблюдателей
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// Глобальный экземпляр
window.lazyLoader = new LazyLoader();

// Утилита для отложенного выполнения
window.requestIdleCallback = window.requestIdleCallback || function(cb) {
    const start = Date.now();
    return setTimeout(function() {
        cb({
            didTimeout: false,
            timeRemaining: function() {
                return Math.max(0, 50 - (Date.now() - start));
            }
        });
    }, 1);
};

window.cancelIdleCallback = window.cancelIdleCallback || function(id) {
    clearTimeout(id);
};

console.log('✓ Lazy Loader initialized');

