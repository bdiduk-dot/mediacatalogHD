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
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    bindEvents() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.applyTheme(this.currentTheme === 'light' ? 'dark' : 'light');
            });
        }
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
            return this.getFallbackData();
        }
    }

    getFallbackData() {
        console.log('🔄 Використовуються тестові дані');
        return [
            { 
                id: 1, 
                title: "Форрест Гамп", 
                year: 1994, 
                rating: 8.8, 
                description: "Історія простодушного чоловіка, який стає свідком ключових подій американської історії.", 
                type: "movie",
                views: 156,
                favorite: true,
                watched: true,
                tags: ["драма", "комедія", "класика"]
            },
            { 
                id: 2, 
                title: "Гаррі Поттер і філософський камінь", 
                year: 1997, 
                rating: 4.8, 
                description: "Перша книга про юного чарівника Гаррі Поттера.", 
                type: "book",
                views: 203,
                favorite: true,
                watched: false,
                tags: ["фентезі", "пригоди", "сімейний"]
            }
        ];
    }
}
class ProfileManager {
    constructor() {
        this.apiService = new ApiService();
        this.currentUser = this.getCurrentUser();
        this.currentSection = 'personal';
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.init();
    }

    getCurrentUser() {
        return {
            name: localStorage.getItem('userName') || 'Користувач',
            email: localStorage.getItem('userEmail') || 'user@example.com',
            level: parseInt(localStorage.getItem('userLevel')) || 1,
            joinDate: localStorage.getItem('joinDate') || new Date().toISOString()
        };
    }

    init() {
        this.updateProfileInfo();
        this.setupNavigation();
        this.setupModals();
        this.loadUserData();
        this.showSection(this.currentSection);
    }

    updateProfileInfo() {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const userLevel = document.getElementById('userLevel');
        const profileAvatar = document.getElementById('profileAvatar');

        if (profileName) profileName.textContent = this.currentUser.name;
        if (profileEmail) profileEmail.textContent = this.currentUser.email;
        if (userLevel) userLevel.textContent = this.currentUser.level;
        if (profileAvatar) profileAvatar.textContent = this.currentUser.name.charAt(0).toUpperCase();
    }

    setupNavigation() {
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        document.querySelectorAll('.view-all').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
                const targetLink = document.querySelector(`[data-section="${section}"]`);
                if (targetLink) targetLink.classList.add('active');
            });
        });
        this.setupCollectionTabs();
        this.setupCalendarNavigation();
    }

    showSection(sectionId) {
        console.log('Перехід до секції:', sectionId);
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            this.loadSectionData(sectionId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            console.error('Секція не знайдена:', sectionId);
        }
    }

    setupCollectionTabs() {
        document.querySelectorAll('.collections-tabs .tab-link').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.collections-tabs .tab-link').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.collections-tabs .tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                const targetContent = document.getElementById(tab);
                if (targetContent) targetContent.classList.add('active');
            });
        });
    }

    setupCalendarNavigation() {
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.currentMonth--;
                if (this.currentMonth < 0) {
                    this.currentMonth = 11;
                    this.currentYear--;
                }
                this.loadCalendar();
            });
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.currentMonth++;
                if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
                this.loadCalendar();
            });
        }
    }

    setupModals() {
        const authModal = document.getElementById('authModal');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const closeAuthModal = document.getElementById('closeAuthModal');
        const switchAuthMode = document.getElementById('switchAuthMode');
        const authForm = document.getElementById('authForm');

        if (loginBtn) loginBtn.addEventListener('click', () => this.showAuthModal('login'));
        if (registerBtn) registerBtn.addEventListener('click', () => this.showAuthModal('register'));
        if (closeAuthModal) closeAuthModal.addEventListener('click', () => this.hideAuthModal());
        if (switchAuthMode) switchAuthMode.addEventListener('click', () => this.switchAuthMode());
        if (authForm) authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));

        const eventModal = document.getElementById('addEventModal');
        const addEventBtn = document.getElementById('addEventBtn');
        const closeEventModal = document.getElementById('closeEventModal');
        const cancelEvent = document.getElementById('cancelEvent');
        const addEventForm = document.getElementById('addEventForm');

        if (addEventBtn) addEventBtn.addEventListener('click', () => this.showEventModal());
        if (closeEventModal) closeEventModal.addEventListener('click', () => this.hideEventModal());
        if (cancelEvent) cancelEvent.addEventListener('click', () => this.hideEventModal());
        if (addEventForm) addEventForm.addEventListener('submit', (e) => this.handleAddEvent(e));
        [authModal, eventModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            }
        });
    }

    showAuthModal(mode) {
        const modal = document.getElementById('authModal');
        const title = document.getElementById('authModalTitle');
        const submitBtn = document.getElementById('authSubmit');
        const switchBtn = document.getElementById('switchAuthMode');
        const registerFields = document.getElementById('registerFields');

        if (!modal || !title) return;

        if (mode === 'login') {
            title.textContent = 'Увійти в систему';
            if (submitBtn) submitBtn.textContent = 'Увійти';
            if (switchBtn) switchBtn.textContent = 'Створити акаунт';
            if (registerFields) registerFields.style.display = 'none';
        } else {
            title.textContent = 'Створити акаунт';
            if (submitBtn) submitBtn.textContent = 'Зареєструватися';
            if (switchBtn) switchBtn.textContent = 'Вже є акаунт?';
            if (registerFields) registerFields.style.display = 'block';
        }

        modal.classList.add('active');
    }

    hideAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) modal.classList.remove('active');
    }

    switchAuthMode() {
        const title = document.getElementById('authModalTitle');
        if (!title) return;
        
        const currentMode = title.textContent.includes('Увійти') ? 'login' : 'register';
        this.showAuthModal(currentMode === 'login' ? 'register' : 'login');
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const email = document.getElementById('authEmail')?.value;
        const password = document.getElementById('authPassword')?.value;
        const isRegister = document.getElementById('authModalTitle')?.textContent.includes('Створити');

        if (!email || !password) {
            this.showNotification('Будь ласка, заповніть всі поля', 'error');
            return;
        }

        if (isRegister) {
            const name = document.getElementById('authName')?.value;
            const confirmPassword = document.getElementById('authConfirmPassword')?.value;

            if (password !== confirmPassword) {
                this.showNotification('Паролі не співпадають', 'error');
                return;
            }
            localStorage.setItem('userName', name || 'Користувач');
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userLevel', '1');
            localStorage.setItem('joinDate', new Date().toISOString());

            this.currentUser = this.getCurrentUser();
            this.updateProfileInfo();
            this.showNotification('Акаунт успішно створено!', 'success');
        } else {
            this.showNotification('Вхід успішний!', 'success');
        }

        this.hideAuthModal();
        this.updateAuthUI();
    }

    updateAuthUI() {
        const authSection = document.getElementById('authSection');
        if (authSection && this.currentUser.name !== 'Користувач') {
            authSection.innerHTML = `
                <div class="auth-buttons">
                    <span style="color: var(--text-secondary);">Вітаємо, ${this.currentUser.name}!</span>
                    <button class="auth-btn auth-btn-outline" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Вийти</span>
                    </button>
                </div>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        }
    }

    logout() {
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userLevel');
        localStorage.removeItem('joinDate');
        
        this.currentUser = this.getCurrentUser();
        this.updateProfileInfo();
        this.updateAuthUI();
        this.showNotification('Ви вийшли з системи', 'info');
    }

    showEventModal() {
        const modal = document.getElementById('addEventModal');
        const eventDateTime = document.getElementById('eventDateTime');
        
        if (modal) modal.classList.add('active');
        if (eventDateTime) eventDateTime.value = new Date().toISOString().slice(0, 16);
    }

    hideEventModal() {
        const modal = document.getElementById('addEventModal');
        if (modal) modal.classList.remove('active');
    }

    handleAddEvent(e) {
        e.preventDefault();
        
        const eventName = document.getElementById('eventName')?.value;
        const eventType = document.getElementById('eventType')?.value;
        const eventDateTime = document.getElementById('eventDateTime')?.value;
        const eventDescription = document.getElementById('eventDescription')?.value;

        if (!eventName || !eventDateTime) {
            this.showNotification('Будь ласка, заповніть обовʼязкові поля', 'error');
            return;
        }
        const events = JSON.parse(localStorage.getItem('userEvents') || '[]');
        events.push({
            id: Date.now(),
            name: eventName,
            type: eventType,
            datetime: eventDateTime,
            description: eventDescription
        });
        localStorage.setItem('userEvents', JSON.stringify(events));

        this.showNotification('Подію додано до календаря!', 'success');
        this.hideEventModal();
        this.loadSectionData('calendar');
    }

    async loadUserData() {
        try {
            const media = await this.apiService.fetchMedia();
            this.updateDashboard(media);
            this.updateCollections(media);
            this.updateRecentMedia(media);
            this.updateAchievements(media);
            this.updateSidebarStats(media);
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
        }
    }

    updateDashboard(media) {
        const movies = media.filter(item => item.type === 'movie');
        const books = media.filter(item => item.type === 'book');
        const favorites = media.filter(item => item.favorite);
        this.updateElementText('totalMedia', media.length);
        this.updateElementText('totalFavorites', favorites.length);
        this.updateElementText('completionRate', '25%');
        this.updateElementText('daysActive', '7');
        this.updateElementText('moviesCount', movies.length);
        this.updateElementText('booksCount', books.length);
        this.updateElementText('achievementsCount', '3 з 10');
        this.updateElementText('activityScore', '85');
        this.updateProgressBar('moviesProgress', '65%');
        this.updateProgressBar('booksProgress', '45%');
        this.updateProgressBar('achievementsProgress', '30%');
        this.updateProgressBar('activityProgress', '85%');
        const avgMovieRating = movies.reduce((sum, item) => sum + item.rating, 0) / movies.length || 0;
        const avgBookRating = books.reduce((sum, item) => sum + item.rating, 0) / books.length || 0;
        this.updateElementText('moviesRating', avgMovieRating.toFixed(1) + '/10');
        this.updateElementText('booksRating', avgBookRating.toFixed(1) + '/10');
    }

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) element.textContent = text;
    }

    updateProgressBar(elementId, width) {
        const element = document.getElementById(elementId);
        if (element) element.style.width = width;
    }

    updateCollections(media) {
        const allMediaGrid = document.getElementById('allMediaGrid');
        const moviesGrid = document.getElementById('moviesGrid');
        const booksGrid = document.getElementById('booksGrid');
        const favoritesGrid = document.getElementById('favoritesGrid');

        if (allMediaGrid) allMediaGrid.innerHTML = this.renderMediaGrid(media);
        if (moviesGrid) moviesGrid.innerHTML = this.renderMediaGrid(media.filter(item => item.type === 'movie'));
        if (booksGrid) booksGrid.innerHTML = this.renderMediaGrid(media.filter(item => item.type === 'book'));
        if (favoritesGrid) favoritesGrid.innerHTML = this.renderMediaGrid(media.filter(item => item.favorite));
    }

    renderMediaGrid(media) {
        if (media.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <h3 class="empty-title">Колекція порожня</h3>
                    <p class="empty-description">Додайте свої перші фільми або книги до колекції</p>
                    <button class="btn btn-primary" onclick="window.location.href='catalog.html'">
                        <i class="fas fa-plus"></i>
                        <span>Додати медіа</span>
                    </button>
                </div>
            `;
        }

        return media.map(item => `
            <div class="collection-item">
                <div class="collection-icon">
                    <i class="fas ${item.type === 'movie' ? 'fa-film' : 'fa-book'}"></i>
                </div>
                <h3 class="collection-title">${this.escapeHtml(item.title)}</h3>
                <div class="collection-meta">
                    <span>${item.year || ''}</span>
                    <span>★ ${item.rating}</span>
                </div>
                <p>${this.escapeHtml(item.description?.substring(0, 100) || '')}...</p>
                <div class="media-tags">
                    ${(item.tags || []).slice(0, 2).map(tag => `<span class="media-tag">${tag}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    updateRecentMedia(media) {
        const recentMedia = document.getElementById('recentMedia');
        const recentItems = media.slice(0, 4);
        
        if (recentMedia) {
            recentMedia.innerHTML = recentItems.map(item => `
                <div class="recent-media-item">
                    <div class="recent-media-icon">
                        <i class="fas ${item.type === 'movie' ? 'fa-film' : 'fa-book'}"></i>
                    </div>
                    <h4 class="recent-media-title">${this.escapeHtml(item.title)}</h4>
                    <div class="recent-media-meta">
                        <span>${item.year}</span>
                        <span>★ ${item.rating}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    updateAchievements(media) {
        const achievementsGrid = document.getElementById('achievementsGrid');
        const achievementsPreview = document.getElementById('achievementsPreview');
        
        const achievements = [
            { id: 1, name: 'Кіноман', description: 'Переглянуто 10 фільмів', progress: 80, total: 10, unlocked: true },
            { id: 2, name: 'Книголюб', description: 'Прочитано 5 книг', progress: 40, total: 5, unlocked: false },
            { id: 3, name: 'Критик', description: 'Оцінено 15 медіа', progress: 60, total: 15, unlocked: false },
            { id: 4, name: 'Колекціонер', description: 'Додано 20 медіа', progress: 30, total: 20, unlocked: false },
            { id: 5, name: 'Досвідчений', description: 'Активність 30 днів', progress: 25, total: 30, unlocked: false },
            { id: 6, name: 'Експерт', description: 'Середній рейтинг 8.0+', progress: 70, total: 10, unlocked: true }
        ];

        if (achievementsGrid) {
            achievementsGrid.innerHTML = achievements.map(achievement => `
                <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <h3 class="achievement-title">${achievement.name}</h3>
                    <p class="achievement-description">${achievement.description}</p>
                    <div class="achievement-progress">
                        <div class="achievement-progress-fill" style="width: ${achievement.progress}%"></div>
                    </div>
                    <div class="achievement-status">
                        ${achievement.unlocked ? 'Розблоковано' : `${achievement.progress}% завершено`}
                    </div>
                </div>
            `).join('');
        }

        if (achievementsPreview) {
            achievementsPreview.innerHTML = achievements.slice(0, 4).map(achievement => `
                <div class="achievement-preview-item">
                    <div class="achievement-preview-badge ${achievement.unlocked ? '' : 'locked'}">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="achievement-preview-name">${achievement.name}</div>
                </div>
            `).join('');
        }
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        this.updateElementText('totalAchievements', achievements.length);
        this.updateElementText('unlockedAchievements', unlockedCount);
        this.updateElementText('achievementProgress', Math.round((unlockedCount / achievements.length) * 100) + '%');
    }

    updateSidebarStats(media) {
        const movies = media.filter(item => item.type === 'movie').length;
        const books = media.filter(item => item.type === 'book').length;
        const favorites = media.filter(item => item.favorite).length;
        const total = media.length;

        this.updateElementText('sidebarMovies', movies);
        this.updateElementText('sidebarBooks', books);
        this.updateElementText('sidebarFavorites', favorites);
        this.updateElementText('sidebarTotal', total);
        const completion = Math.round((media.filter(item => item.watched).length / total) * 100) || 0;
        const activity = Math.min(media.length * 5, 100);

        this.updateElementText('sidebarCompletion', completion + '%');
        this.updateElementText('sidebarActivity', activity);
    }

    loadSectionData(sectionId) {
        console.log('Завантаження даних для секції:', sectionId);
        switch (sectionId) {
            case 'calendar':
                this.loadCalendar();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'groups':
                this.loadGroups();
                break;
            case 'challenges':
                this.loadChallenges();
                break;
            case 'collections':
                this.apiService.fetchMedia().then(media => {
                    this.updateCollections(media);
                });
                break;
        }
    }

    loadCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const currentMonthEl = document.getElementById('currentMonth');
        const selectedDateEl = document.getElementById('selectedDate');

        if (!calendarGrid || !currentMonthEl) return;
        const monthNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
                           'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
        currentMonthEl.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        let calendarHTML = '';

        const dayNames = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        dayNames.forEach(day => {
            calendarHTML += `<div class="calendar-day">${day}</div>`;
        });
        for (let i = 0; i < startingDay; i++) {
            calendarHTML += `<div class="calendar-date other-month"></div>`;
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(this.currentYear, this.currentMonth, day);
            const isToday = currentDate.getTime() === today.getTime();
            const hasEvents = this.hasEventsForDate(currentDate);
            
            calendarHTML += `
                <div class="calendar-date ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}" 
                     data-date="${this.currentYear}-${this.currentMonth + 1}-${day}">
                    ${day}
                </div>
            `;
        }

        calendarGrid.innerHTML = calendarHTML;
        calendarGrid.querySelectorAll('.calendar-date:not(.other-month)').forEach(dateEl => {
            dateEl.addEventListener('click', () => {
                calendarGrid.querySelectorAll('.calendar-date').forEach(el => {
                    el.classList.remove('selected');
                });
                
                dateEl.classList.add('selected');
                
                const dateStr = dateEl.dataset.date;
                const [year, month, day] = dateStr.split('-');
                if (selectedDateEl) selectedDateEl.textContent = `${day}.${month}.${year}`;
                this.showDateEvents(dateStr);
            });
        });
        const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        if (selectedDateEl) selectedDateEl.textContent = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
        const todayElement = calendarGrid.querySelector(`[data-date="${todayStr}"]`);
        if (todayElement) {
            todayElement.classList.add('selected');
        }
        
        this.showDateEvents(todayStr);
    }

    hasEventsForDate(date) {
        const events = JSON.parse(localStorage.getItem('userEvents') || '[]');
        const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        
        return events.some(event => {
            const eventDate = new Date(event.datetime);
            const eventDateStr = `${eventDate.getFullYear()}-${eventDate.getMonth() + 1}-${eventDate.getDate()}`;
            return eventDateStr === dateStr;
        });
    }

    showDateEvents(dateStr) {
        const dateEvents = document.getElementById('dateEvents');
        if (!dateEvents) return;

        const events = JSON.parse(localStorage.getItem('userEvents') || '[]')
            .filter(event => {
                const eventDate = new Date(event.datetime);
                const eventDateStr = `${eventDate.getFullYear()}-${eventDate.getMonth() + 1}-${eventDate.getDate()}`;
                return eventDateStr === dateStr;
            })
            .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

        if (events.length === 0) {
            dateEvents.innerHTML = `
                <div class="empty-state" style="padding: 1rem;">
                    <p>На цей день подій не заплановано</p>
                </div>
            `;
        } else {
            dateEvents.innerHTML = events.map(event => {
                const eventDate = new Date(event.datetime);
                const timeStr = `${eventDate.getHours().toString().padStart(2, '0')}:${eventDate.getMinutes().toString().padStart(2, '0')}`;
                
                return `
                <div class="event-item">
                    <div class="event-time">
                        ${timeStr}
                    </div>
                    <div class="event-details">
                        <div class="event-name">${this.escapeHtml(event.name)}</div>
                        <div class="event-type">${this.getEventTypeName(event.type)}</div>
                    </div>
                </div>
            `}).join('');
        }
    }

    getEventTypeName(type) {
        const types = {
            'watch': 'Перегляд',
            'read': 'Читання',
            'reminder': 'Нагадування'
        };
        return types[type] || type;
    }

    loadAnalytics() {
        this.initCharts();
        this.updateAnalyticsStats();
    }

    updateAnalyticsStats() {
        const media = this.apiService.getFallbackData();
        const totalWatchTime = media.reduce((sum, item) => sum + (item.views || 0), 0);
        const completionRate = Math.round((media.filter(item => item.watched).length / media.length) * 100) || 0;
        const avgRating = (media.reduce((sum, item) => sum + item.rating, 0) / media.length).toFixed(1) || 0;
        const activeDays = Math.min(media.length * 2, 30);
        
        this.updateElementText('totalWatchTime', totalWatchTime + ' год');
        this.updateElementText('completionRate', completionRate + '%');
        this.updateElementText('avgRating', avgRating);
        this.updateElementText('activeDays', activeDays);
    }

    initCharts() {
        const genreCtx = document.getElementById('genreDistributionChart');
        if (genreCtx) {
            new Chart(genreCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Фентезі', 'Драма', 'Фантастика', 'Комедія', 'Трилер'],
                    datasets: [{
                        data: [30, 25, 20, 15, 10],
                        backgroundColor: [
                            '#3b82f6', '#6366f1', '#8b5cf6', '#10b981', '#f59e0b'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        }
        const activityCtx = document.getElementById('monthlyActivityChart');
        if (activityCtx) {
            new Chart(activityCtx, {
                type: 'line',
                data: {
                    labels: ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'],
                    datasets: [{
                        label: 'Активність',
                        data: [12, 19, 8, 15, 22, 18, 25, 12, 19, 23, 15, 20],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
        const ratingsCtx = document.getElementById('ratingsChart');
        if (ratingsCtx) {
            new Chart(ratingsCtx, {
                type: 'bar',
                data: {
                    labels: ['1-2', '3-4', '5-6', '7-8', '9-10'],
                    datasets: [{
                        label: 'Кількість оцінок',
                        data: [2, 5, 8, 12, 7],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.7)',
                            'rgba(59, 130, 246, 0.7)',
                            'rgba(59, 130, 246, 0.7)',
                            'rgba(59, 130, 246, 0.7)',
                            'rgba(59, 130, 246, 0.7)'
                        ],
                        borderColor: '#3b82f6',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
        const yearlyCtx = document.getElementById('yearlyProgressChart');
        if (yearlyCtx) {
            new Chart(yearlyCtx, {
                type: 'radar',
                data: {
                    labels: ['Фільми', 'Книги', 'Активність', 'Досягнення', 'Соціальність'],
                    datasets: [{
                        label: 'Прогрес',
                        data: [85, 60, 75, 45, 30],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3b82f6',
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#3b82f6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: {
                                display: true
                            },
                            suggestedMin: 0,
                            suggestedMax: 100
                        }
                    }
                }
            });
        }
    }

    loadGroups() {
        const groupsGrid = document.getElementById('groupsGrid');
        const groups = [
            { name: 'Кіномани', description: 'Обговорення фільмів та серіалів', members: 124 },
            { name: 'Книголюби', description: 'Спільне читання та рецензії', members: 89 },
            { name: 'Критики', description: 'Професійні огляди та аналіз', members: 45 },
            { name: 'Новачки', description: 'Для тих, хто тільки починає', members: 203 }
        ];

        if (groupsGrid) {
            groupsGrid.innerHTML = groups.map(group => `
                <div class="group-card">
                    <div class="group-header">
                        <div class="group-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <h3 class="group-title">${group.name}</h3>
                    </div>
                    <p class="group-description">${group.description}</p>
                    <div class="group-members">
                        <span>${group.members} учасників</span>
                        <button class="btn btn-outline" style="padding: 0.5rem 1rem;">Приєднатися</button>
                    </div>
                </div>
            `).join('');
        }
    }

    loadChallenges() {
        const challengesGrid = document.getElementById('challengesGrid');
        const media = this.apiService.getFallbackData();
        const movies = media.filter(item => item.type === 'movie');
        const books = media.filter(item => item.type === 'book');
        const watched = media.filter(item => item.watched).length;
        const favorites = media.filter(item => item.favorite).length;
        
        const challenges = [
            { 
                name: 'Марафон читача', 
                description: 'Прочитати 5 книг за місяць', 
                progress: Math.min(books.length, 5),
                total: 5
            },
            { 
                name: 'Кінопоказ', 
                description: 'Переглянути 10 фільмів', 
                progress: Math.min(movies.length, 10),
                total: 10
            },
            { 
                name: 'Жанровий експерт', 
                description: 'Спробувати 5 різних жанрів', 
                progress: 3,
                total: 5
            },
            { 
                name: 'Рекорд активності', 
                description: 'Бути активним 7 днів поспіль', 
                progress: Math.min(watched, 7),
                total: 7
            },
            { 
                name: 'Колекціонер', 
                description: 'Зібрати 20 медіа в колекцію', 
                progress: Math.min(media.length, 20),
                total: 20
            },
            { 
                name: 'Критик', 
                description: 'Оцінити 15 медіа', 
                progress: Math.min(media.length, 15),
                total: 15
            }
        ];

        if (challengesGrid) {
            challengesGrid.innerHTML = challenges.map(challenge => {
                const progressPercent = Math.round((challenge.progress / challenge.total) * 100);
                
                return `
                <div class="challenge-card">
                    <div class="challenge-header">
                        <div class="challenge-icon">
                            <i class="fas fa-gamepad"></i>
                        </div>
                        <h3 class="challenge-title">${challenge.name}</h3>
                    </div>
                    <p class="challenge-description">${challenge.description}</p>
                    <div class="challenge-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="challenge-stats">
                            <span>Прогрес</span>
                            <span>${challenge.progress}/${challenge.total} (${progressPercent}%)</span>
                        </div>
                    </div>
                </div>
            `}).join('');
        }
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

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Запуск Особистого кабінету...');
    
    new ThemeManager();
    window.profileManager = new ProfileManager();
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.href && !this.href.includes('#')) {
                const originalText = this.innerHTML;
                this.innerHTML = '<span class="loading"></span> Завантаження...';
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 1500);
            }
        });
    });
});