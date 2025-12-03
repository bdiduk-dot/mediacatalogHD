const API_BASE_URL = 'http://localhost:3001';
const MEDIA_ENDPOINT = `${API_BASE_URL}/media`;

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.bindEvents();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);

        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    bindEvents() {
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.applyTheme(this.currentTheme === 'light' ? 'dark' : 'light');
        });
    }
}
class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    async fetchMedia() {
        try {
            console.log('🔄 Запит до API:', MEDIA_ENDPOINT);
            const response = await fetch(MEDIA_ENDPOINT);
            
            if (!response.ok) {
                throw new Error(`HTTP помилка! статус: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Дані отримано:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Помилка отримання даних:', error);
            this.showNotification('Помилка підключення до сервера', 'error');
            return [];
        }
    }

    getDefaultCover(type) {
        return type === 'movie' 
            ? 'https://via.placeholder.com/300x450/3b82f6/ffffff?text=Фільм'
            : 'https://via.placeholder.com/300x450/6366f1/ffffff?text=Книга';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

class MediaShowcase {
    constructor() {
        this.container = document.getElementById('mediaShowcase');
        this.apiService = new ApiService();
        this.currentTab = 'all';
        this.init();
    }

    async init() {
        await this.renderShowcase();
        this.setupTabHandlers();
    }

    setupTabHandlers() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        this.renderShowcase();
    }

    async renderShowcase() {
        try {
            const media = await this.apiService.fetchMedia();
            if (media.length > 0) {
                localStorage.setItem('mediaData', JSON.stringify(media));
            }
            
            if (media.length === 0) {
                this.renderEmptyState();
                return;
            }
            let filteredMedia = [...media];
            if (this.currentTab === 'movies') {
                filteredMedia = filteredMedia.filter(item => item.type === 'movie');
            } else if (this.currentTab === 'books') {
                filteredMedia = filteredMedia.filter(item => item.type === 'book');
            }
            const showcaseMedia = filteredMedia.slice(0, 6);
            
            this.container.innerHTML = showcaseMedia.map((item, index) => `
                <div class="media-item" style="animation-delay: ${index * 0.1}s">
                    <div class="media-image" style="background: ${this.getMediaColor(item.type)}">
                        <img src="${item.cover || this.apiService.getDefaultCover(item.type)}" alt="${item.title}" 
                             onerror="this.src='${this.apiService.getDefaultCover(item.type)}'">
                        <span class="media-rating">
                            <i class="fas fa-star"></i> ${item.rating || 'N/A'}
                        </span>
                    </div>
                    <div class="media-content">
                        <h3 class="media-title">${this.escapeHtml(item.title)}</h3>
                        <div class="media-meta">
                            <span>${item.year || ''}</span>
                            <span><i class="fas fa-eye"></i> ${item.views || 0}</span>
                        </div>
                        <p class="media-description">${this.escapeHtml(item.description || 'Опис відсутній')}</p>
                        <div class="media-tags">
                            ${(item.tags || []).slice(0, 3).map(tag => `<span class="media-tag">${tag}</span>`).join('')}
                        </div>
                        <div class="media-type">${item.type === 'movie' ? '🎬 Фільм' : '📚 Книга'}</div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Помилка відображення медіа:', error);
            this.renderEmptyState();
        }
    }

    getMediaColor(type) {
        return type === 'movie' 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    }

    renderEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <div class="empty-icon" style="font-size: 4rem; margin-bottom: 1rem;">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 style="margin-bottom: 1rem; color: var(--text-secondary);">Медіа не знайдено</h3>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">Додайте перше медіа до каталогу</p>
                <a href="catalog.html" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Додати медіа
                </a>
            </div>
        `;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

class Analytics {
    constructor() {
        this.lastUpdateElement = document.getElementById('lastUpdate');
        this.updateStatusElement = document.getElementById('updateStatus');
        this.apiService = new ApiService();
        this.currentData = {
            movies: 0,
            books: 0,
            total: 0
        };
        this.isFirstLoad = true;
        this.updateStats();
        setInterval(() => this.checkForUpdates(), 5000);
    }

    async checkForUpdates() {
        try {
            const media = await this.apiService.fetchMedia();
            this.processData(media, true);
        } catch (error) {
            console.error('Помилка перевірки оновлень:', error);
            this.updateStatus('Помилка підключення до сервера', 'error');
        }
    }

    async updateStats() {
        try {
            const media = await this.apiService.fetchMedia();
            this.processData(media, false);
        } catch (error) {
            console.error('Помилка оновлення статистики:', error);
            this.updateStatus('Помилка завантаження даних', 'error');
        }
    }

    processData(media, isUpdateCheck) {
        const newData = {
            movies: media.filter(item => item.type === 'movie').length,
            books: media.filter(item => item.type === 'book').length,
            total: media.length
        };

        let changesDetected = false;
        const changes = [];
        if (newData.movies !== this.currentData.movies) {
            changes.push('фільми');
            this.animateValue('totalMovies', this.currentData.movies, newData.movies, 1000);
            this.animateValue('statsMovies', this.currentData.movies, newData.movies, 1000);
            this.currentData.movies = newData.movies;
            changesDetected = true;
        }

        if (newData.books !== this.currentData.books) {
            changes.push('книги');
            this.animateValue('totalBooks', this.currentData.books, newData.books, 1000);
            this.animateValue('statsBooks', this.currentData.books, newData.books, 1000);
            this.currentData.books = newData.books;
            changesDetected = true;
        }

        if (newData.total !== this.currentData.total) {
            changes.push('всього медіа');
            this.animateValue('totalItems', this.currentData.total, newData.total, 1000);
            this.animateValue('statsTotal', this.currentData.total, newData.total, 1000);
            this.currentData.total = newData.total;
            changesDetected = true;
        }
        this.updateLastUpdateTime();
        if (isUpdateCheck) {
            if (changesDetected) {
                this.updateStatus(`Оновлено: ${changes.join(', ')}`, 'success');
            } else {
                this.updateStatus('Змін не виявлено', 'info');
            }
        } else {
            this.updateStatus(`Завантажено ${newData.total} медіа`, 'success');
        }
        
        this.isFirstLoad = false;
    }

    updateStatus(message, type = 'info') {
        const colors = {
            success: '#10b981',
            error: '#ef4444', 
            info: '#6b7280',
            warning: '#f59e0b'
        };
        
        this.updateStatusElement.textContent = `Статус: ${message}`;
        this.updateStatusElement.style.color = colors[type] || colors.info;
        const indicator = this.updateStatusElement.closest('.update-indicator');
        if (indicator) {
            indicator.className = 'update-indicator ' + type;
        }
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('uk-UA');
        this.lastUpdateElement.textContent = `Остання перевірка: ${timeString}`;
    }

    animateValue(id, start, end, duration) {
        const obj = document.getElementById(id);
        if (!obj) return;
        
        const currentValue = parseInt(obj.textContent.replace(/,/g, '')) || start;
        if (currentValue === end) return;

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            obj.innerHTML = value.toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
}
class ScrollEffects {
    constructor() {
        this.init();
    }

    init() {
        this.handleHeaderScroll();
        this.bindEvents();
    }

    handleHeaderScroll() {
        const header = document.getElementById('header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    bindEvents() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}
class ParticleSystem {
    constructor() {
        this.container = document.querySelector('.hero');
        this.init();
    }

    init() {
        this.createParticles();
    }

    createParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        this.container.appendChild(particlesContainer);

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 6 + 2;
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 20 + 10;
            const animationDelay = Math.random() * 5;
            
            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${left}%;
                animation-duration: ${animationDuration}s;
                animation-delay: ${animationDelay}s;
            `;
            
            particlesContainer.appendChild(particle);
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Запуск Медіа-каталогу...');
    
    new ThemeManager();
    new Analytics();
    window.mediaShowcase = new MediaShowcase();
    new ScrollEffects();
    new ParticleSystem();
    document.querySelectorAll('.btn').forEach(btn => {
        if (btn.href && !btn.href.includes('#')) {
            btn.addEventListener('click', function(e) {
                const originalText = this.innerHTML;
                this.innerHTML = '<span class="loading"></span> Завантаження...';
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 1500);
            });
        }
    });
});