class MediaCatalog {
    constructor() {
        this.media = [];
        this.filteredMedia = [];
        this.currentFilter = 'all';
        this.currentSort = 'date-added';
        this.currentSortOrder = 'desc';
        this.currentView = 'grid';
        this.selectedTags = new Set();
        this.searchQuery = '';
        this.apiUrl = 'http://localhost:3001/media';
        this.isVoiceSearchActive = false;
        this.recognition = null;
        this.currentApiSearchType = 'movie';
        this.tmdbApiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkMTQ4OGJkZTNjNmRjNzVmZWE3OWU0ZjNjMDJmMTBjNSIsIm5iZiI6MTc1OTEwMzA2MS4zMTIsInN1YiI6IjY4ZDljODU1Njg0OTFkNDg1MmI5YTFmMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Ts1AA0Ggzyjnw-mF_sWjm8bA-EE1uoY75A3s4OgDwH0';
        this.googleBooksApiKey = 'AIzaSyC0HyB8T2nWrMXz45-l9YXwc-MFHU9Q574';
        
        this.init().catch(error => {
            console.error('Failed to initialize catalog:', error);
            this.showNotification('Помилка ініціалізації каталогу', 'error');
        });
    }

    async init() {
        try {
            await this.loadMedia();
            this.setupEventListeners();
            this.setupVoiceSearch();
            this.setupTagsManagement();
            this.setupEnhancedSearch();
            this.applyFiltersAndSort();
            this.updateCounts();
            this.renderCompactTags();
            this.renderActiveFilters();
            this.renderQuickTagsFilter();
            console.log('Catalog initialized successfully');
        } catch (error) {
            console.error('Error during initialization:', error);
            this.showNotification('Помилка завантаження даних', 'error');
        }
    }

    async loadMedia() {
        try {
            console.log('Loading media from:', this.apiUrl);
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.media = Array.isArray(data) ? data : [];
            this.filteredMedia = [...this.media];
            console.log(`Loaded ${this.media.length} media items from server`);
            
        } catch (error) {
            console.error('Error loading media:', error);
            this.media = [];
            this.filteredMedia = [];
            this.showNotification('Помилка завантаження даних з сервера', 'error');
        }
    }

    setupEnhancedSearch() {
        const searchInput = document.getElementById('searchInput');
        const quickSearchBtn = document.getElementById('quickSearchBtn');
        const searchCategoryInfo = document.getElementById('searchCategoryInfo');
        const searchCategoryText = document.getElementById('searchCategoryText');

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performQuickSearch();
                }
            });
        }

        if (quickSearchBtn) {
            quickSearchBtn.addEventListener('click', () => {
                this.performQuickSearch();
            });
        }

        this.updateSearchCategoryInfo();
    }

    updateSearchCategoryInfo() {
        const searchCategoryInfo = document.getElementById('searchCategoryInfo');
        const searchCategoryText = document.getElementById('searchCategoryText');
        
        if (!searchCategoryInfo || !searchCategoryText) return;

        let categoryText = '';
        let isActive = false;

        switch (this.currentFilter) {
            case 'movie':
                categoryText = 'Пошук фільмів через TMDB API';
                isActive = true;
                break;
            case 'book':
                categoryText = 'Пошук книг через Google Books API';
                isActive = true;
                break;
            case 'all':
                categoryText = 'Пошук фільмів та книг через API';
                isActive = true;
                break;
            case 'favorites':
                categoryText = 'Пошук серед улюблених медіа';
                break;
            case 'high-rating':
                categoryText = 'Пошук серед медіа з високим рейтингом';
                break;
            case 'watched':
                categoryText = 'Пошук серед переглянутих медіа';
                break;
            default:
                categoryText = 'Пошук у всій колекції';
        }

        searchCategoryText.textContent = categoryText;
        
        if (isActive) {
            searchCategoryInfo.classList.add('active');
        } else {
            searchCategoryInfo.classList.remove('active');
        }
    }

    performQuickSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const query = searchInput.value.trim();
        if (!query) {
            this.showNotification('Введіть запит для пошуку', 'warning');
            return;
        }

        let searchType = 'all';
        switch (this.currentFilter) {
            case 'movie':
                searchType = 'movie';
                break;
            case 'book':
                searchType = 'book';
                break;
            case 'all':
                searchType = 'all';
                break;
            default:

                this.searchQuery = query.toLowerCase();
                this.applyFiltersAndSort();
                this.showNotification(`Знайдено ${this.filteredMedia.length} медіа`, 'success');
                return;
        }

        this.openApiSearchModal(searchType);
        
        setTimeout(() => {
            const apiSearchInput = document.getElementById('apiSearchInput');
            if (apiSearchInput) {
                apiSearchInput.value = query;
                this.performApiSearch(query, searchType);
            }
        }, 100);
    }

    setupVoiceSearch() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'uk-UA';

            this.recognition.onstart = () => {
                this.isVoiceSearchActive = true;
                this.updateVoiceSearchUI();
                this.showNotification('Слухаю... Говоріть now', 'info');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = transcript;
                }
                this.searchQuery = transcript.toLowerCase();
                this.applyFiltersAndSort();
                this.showNotification(`Пошук: ${transcript}`, 'success');
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showNotification('Помилка розпізнавання мови', 'error');
                this.isVoiceSearchActive = false;
                this.updateVoiceSearchUI();
            };

            this.recognition.onend = () => {
                this.isVoiceSearchActive = false;
                this.updateVoiceSearchUI();
            };
        } else {
            console.warn('Speech recognition not supported');
            const voiceBtn = document.getElementById('voiceSearchBtn');
            if (voiceBtn) {
                voiceBtn.style.display = 'none';
            }
        }
    }

    updateVoiceSearchUI() {
        const voiceBtn = document.getElementById('voiceSearchBtn');
        if (voiceBtn) {
            if (this.isVoiceSearchActive) {
                voiceBtn.classList.add('listening');
                voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                voiceBtn.style.background = 'var(--danger)';
            } else {
                voiceBtn.classList.remove('listening');
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceBtn.style.background = '';
            }
        }
    }

    toggleVoiceSearch() {
        if (!this.recognition) {
            this.showNotification('Голосовий пошук не підтримується вашим браузером', 'warning');
            return;
        }

        if (this.isVoiceSearchActive) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting voice recognition:', error);
                this.showNotification('Помилка запуску голосового пошуку', 'error');
            }
        }
    }

    setupEventListeners() {
        setTimeout(() => {
            this.setupAllEventListeners();
        }, 100);
    }

    setupAllEventListeners() {
        const safeAddEventListener = (elementId, event, handler) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener(event, handler);
                console.log(`✅ Added event listener to ${elementId}`);
            } else {
                console.warn(`❌ Element with id '${elementId}' not found`);
            }
        };

        const safeQuerySelectorAll = (selector, event, handler) => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                elements.forEach(element => {
                    element.addEventListener(event, handler);
                });
                console.log(`✅ Added event listeners to ${selector}`);
            } else {
                console.warn(`❌ Elements with selector '${selector}' not found`);
            }
        };

        safeAddEventListener('themeToggle', 'click', () => this.toggleTheme());

        safeQuerySelectorAll('.sidebar-link[data-filter]', 'click', (e) => {
            e.preventDefault();
            this.handleFilterChange(e.currentTarget.dataset.filter);
        });

        safeAddEventListener('sortBy', 'change', (e) => {
            this.currentSort = e.target.value;
            this.applyFiltersAndSort();
        });

        safeAddEventListener('sortOrder', 'change', (e) => {
            this.currentSortOrder = e.target.value;
            this.applyFiltersAndSort();
        });

        safeAddEventListener('sortingHeader', 'click', () => {
            const content = document.getElementById('sortingContent');
            const header = document.getElementById('sortingHeader');
            if (content && header) {
                content.classList.toggle('active');
                header.classList.toggle('active');
            }
        });

        safeAddEventListener('searchInput', 'input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.applyFiltersAndSort();
        });

        safeAddEventListener('voiceSearchBtn', 'click', () => {
            this.toggleVoiceSearch();
        });

        safeAddEventListener('advancedSearchBtn', 'click', () => {
            this.toggleAdvancedSearch();
        });

        safeAddEventListener('searchMoviesBtn', 'click', () => {
            this.openApiSearchModal('movie');
        });

        safeAddEventListener('searchBooksBtn', 'click', () => {
            this.openApiSearchModal('book');
        });

        safeQuerySelectorAll('.view-toggle', 'click', (e) => {
            this.switchView(e.currentTarget.dataset.view);
        });

        safeAddEventListener('addMediaBtn', 'click', () => {
            this.openAddModal();
        });

        const emptyAddBtn = document.getElementById('emptyAddBtn');
        if (emptyAddBtn) {
            emptyAddBtn.addEventListener('click', () => {
                this.openAddModal();
            });
        }

        safeAddEventListener('closeAddModal', 'click', () => {
            this.closeAddModal();
        });

        safeAddEventListener('cancelAdd', 'click', () => {
            this.closeAddModal();
        });

        safeAddEventListener('mediaType', 'change', (e) => {
            this.toggleMediaFields(e.target.value);
        });

        safeAddEventListener('uploadCoverBtn', 'click', () => {
            this.openImageUploadModal();
        });

        safeAddEventListener('coverUrl', 'input', (e) => {
            this.updateCoverPreview(e.target.value);
        });

        const addMediaForm = document.getElementById('addMediaForm');
        if (addMediaForm) {
            addMediaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewMedia();
            });
        }

        safeAddEventListener('exportBtn', 'click', (e) => {
            e.preventDefault();
            this.exportData();
        });

        safeAddEventListener('importBtn', 'click', (e) => {
            e.preventDefault();
            this.importData();
        });

        safeAddEventListener('importExportBtn', 'click', () => {
            const dropdown = document.querySelector('.dropdown');
            if (dropdown) {
                dropdown.classList.toggle('show');
            }
        });

        safeAddEventListener('viewAllBtn', 'click', (e) => {
            e.preventDefault();
            this.openViewAllModal();
        });

        safeAddEventListener('closeViewAllModal', 'click', () => {
            this.closeViewAllModal();
        });

        safeAddEventListener('closeDetailsModal', 'click', () => {
            this.closeMediaDetailsModal();
        });

        this.setupImageUploadModal();

        this.setupApiSearchModal();

        this.setupModalCloseHandlers();

        this.setupAdvancedSearch();

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelector('.dropdown')?.classList.remove('show');
            }
        });
        this.initializeTheme();
    }

    setupTagsManagement() {
        const manageTagsBtn = document.getElementById('manageTagsBtn');
        if (manageTagsBtn) {
            manageTagsBtn.addEventListener('click', () => {
                this.openTagsManagementModal();
            });
        }
        const openTagsModalBtn = document.getElementById('openTagsModalBtn');
        if (openTagsModalBtn) {
            openTagsModalBtn.addEventListener('click', () => {
                this.openTagsManagementModal();
            });
        }
        const closeTagsModal = document.getElementById('closeTagsModal');
        if (closeTagsModal) {
            closeTagsModal.addEventListener('click', () => {
                this.closeTagsManagementModal();
            });
        }
        const addNewTagBtn = document.getElementById('addNewTagBtn');
        const newTagInput = document.getElementById('newTagInput');
        if (addNewTagBtn && newTagInput) {
            addNewTagBtn.addEventListener('click', () => {
                this.addNewTag();
            });
            newTagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addNewTag();
                }
            });
        }

        const clearAllTagsBtn = document.getElementById('clearAllTagsBtn');
        if (clearAllTagsBtn) {
            clearAllTagsBtn.addEventListener('click', () => {
                this.selectedTags.clear();
                this.renderCompactTags();
                this.renderTagsManagement();
                this.renderQuickTagsFilter();
                this.applyFiltersAndSort();
            });
        }

        const applyTagsBtn = document.getElementById('applyTagsBtn');
        if (applyTagsBtn) {
            applyTagsBtn.addEventListener('click', () => {
                this.closeTagsManagementModal();
                this.applyFiltersAndSort();
            });
        }

        const showMoreTagsBtn = document.getElementById('showMoreTagsBtn');
        if (showMoreTagsBtn) {
            showMoreTagsBtn.addEventListener('click', () => {
                this.openTagsManagementModal();
            });
        }

        const clearQuickTagsBtn = document.getElementById('clearQuickTagsBtn');
        if (clearQuickTagsBtn) {
            clearQuickTagsBtn.addEventListener('click', () => {
                this.selectedTags.clear();
                this.renderCompactTags();
                this.renderQuickTagsFilter();
                this.applyFiltersAndSort();
            });
        }

        const tagsInputCompact = document.getElementById('tagsInputCompact');
        if (tagsInputCompact) {
            tagsInputCompact.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const tag = tagsInputCompact.value.trim();
                    if (tag && !this.selectedTags.has(tag)) {
                        this.selectedTags.add(tag);
                        this.renderSelectedTagsForm();
                        tagsInputCompact.value = '';
                    }
                }
            });
        }
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    openTagsManagementModal() {
        const modal = document.getElementById('tagsManagementModal');
        if (modal) {
            modal.classList.add('active');
            this.renderTagsManagement();
        }
    }

    closeTagsManagementModal() {
        const modal = document.getElementById('tagsManagementModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    addNewTag() {
        const newTagInput = document.getElementById('newTagInput');
        if (!newTagInput) return;

        const tag = newTagInput.value.trim();
        if (!tag) {
            this.showNotification('Введіть назву тега', 'warning');
            return;
        }

        if (this.selectedTags.has(tag)) {
            this.showNotification('Цей тег вже додано', 'warning');
            return;
        }

        this.selectedTags.add(tag);
        newTagInput.value = '';
        this.renderTagsManagement();
        this.renderCompactTags();
        this.renderQuickTagsFilter();
        this.showNotification('Тег додано', 'success');
    }

    removeTagFromManagement(tag) {
        this.selectedTags.delete(tag);
        this.renderTagsManagement();
        this.renderCompactTags();
        this.renderQuickTagsFilter();
        this.applyFiltersAndSort();
    }

    toggleTagInManagement(tag) {
        if (this.selectedTags.has(tag)) {
            this.selectedTags.delete(tag);
        } else {
            this.selectedTags.add(tag);
        }
        this.renderTagsManagement();
        this.renderCompactTags();
        this.renderQuickTagsFilter();
    }

    renderTagsManagement() {
        this.renderPopularTags();
        this.renderAllTags();
        this.renderSelectedTagsCompact();
        this.updateTagsCounts();
    }

    renderPopularTags() {
        const popularTagsGrid = document.getElementById('popularTagsGrid');
        if (!popularTagsGrid) return;

        const popularTags = this.getPopularTags(10); // Top 10 popular tags
        if (popularTags.length === 0) {
            popularTagsGrid.innerHTML = '<div class="no-tags">Немає популярних тегів</div>';
            return;
        }

        popularTagsGrid.innerHTML = popularTags.map(({ tag, count }) => {
            const isActive = this.selectedTags.has(tag);
            return `
                <div class="compact-tag-management ${isActive ? 'active' : ''}" 
                     onclick="catalog.toggleTagInManagement('${this.escapeHtml(tag)}')">
                    <div class="tag-management-content">
                        <span class="tag-management-name">${tag}</span>
                        <span class="tag-management-count">${count}</span>
                    </div>
                    <div class="tag-management-actions">
                        <button class="btn-tag-action" onclick="event.stopPropagation(); catalog.toggleTagInManagement('${this.escapeHtml(tag)}')">
                            <i class="fas fa-${isActive ? 'check' : 'plus'}"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderAllTags() {
        const allTagsGrid = document.getElementById('allTagsGrid');
        if (!allTagsGrid) return;

        const allTags = this.getAllTags();
        if (allTags.length === 0) {
            allTagsGrid.innerHTML = '<div class="no-tags">Теги відсутні</div>';
            return;
        }

        const tagCounts = this.getTagCounts();
        allTagsGrid.innerHTML = allTags.map(tag => {
            const isActive = this.selectedTags.has(tag);
            const count = tagCounts[tag] || 0;
            return `
                <div class="compact-tag-management ${isActive ? 'active' : ''}" 
                     onclick="catalog.toggleTagInManagement('${this.escapeHtml(tag)}')">
                    <div class="tag-management-content">
                        <span class="tag-management-name">${tag}</span>
                        <span class="tag-management-count">${count}</span>
                    </div>
                    <div class="tag-management-actions">
                        <button class="btn-tag-action" onclick="event.stopPropagation(); catalog.toggleTagInManagement('${this.escapeHtml(tag)}')">
                            <i class="fas fa-${isActive ? 'check' : 'plus'}"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderSelectedTagsCompact() {
        const selectedTagsCompact = document.getElementById('selectedTagsCompact');
        if (!selectedTagsCompact) return;

        if (this.selectedTags.size === 0) {
            selectedTagsCompact.innerHTML = '<div class="no-tags">Оберіть теги для фільтрації</div>';
            return;
        }

        selectedTagsCompact.innerHTML = Array.from(this.selectedTags).map(tag => `
            <div class="selected-tag-compact">
                <span>${tag}</span>
                <button class="btn-remove-selected-tag" onclick="catalog.removeTagFromManagement('${this.escapeHtml(tag)}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderSelectedTagsForm() {
        const selectedTagsForm = document.getElementById('selectedTagsForm');
        if (!selectedTagsForm) return;

        selectedTagsForm.innerHTML = Array.from(this.selectedTags).map(tag => `
            <div class="selected-tag-form">
                <span>${tag}</span>
                <button class="btn-remove-form-tag" onclick="catalog.removeTagFromForm('${this.escapeHtml(tag)}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeTagFromForm(tag) {
        this.selectedTags.delete(tag);
        this.renderSelectedTagsForm();
    }

    updateTagsCounts() {
        const allTagsCount = document.getElementById('allTagsCount');
        const selectedTagsCount = document.getElementById('selectedTagsCount');
        
        if (allTagsCount) {
            const allTags = this.getAllTags();
            allTagsCount.textContent = `(${allTags.length})`;
        }
        
        if (selectedTagsCount) {
            selectedTagsCount.textContent = `(${this.selectedTags.size})`;
        }
    }

    renderCompactTags() {
        const compactTagsScroll = document.getElementById('compactTagsScroll');
        if (!compactTagsScroll) return;

        const popularTags = this.getPopularTags(15); // Show top 15 tags in compact view
        if (popularTags.length === 0) {
            compactTagsScroll.innerHTML = '<div class="no-tags">Теги відсутні</div>';
            return;
        }

        compactTagsScroll.innerHTML = popularTags.map(({ tag, count }) => {
            const isActive = this.selectedTags.has(tag);
            return `
                <span class="compact-tag ${isActive ? 'active' : ''}" 
                      onclick="catalog.toggleCompactTag('${this.escapeHtml(tag)}')">
                    <span class="compact-tag-name">${tag}</span>
                    <span class="compact-tag-count">${count}</span>
                </span>
            `;
        }).join('');
    }

    toggleCompactTag(tag) {
        if (this.selectedTags.has(tag)) {
            this.selectedTags.delete(tag);
        } else {
            this.selectedTags.add(tag);
        }
        this.renderCompactTags();
        this.renderQuickTagsFilter();
        this.applyFiltersAndSort();
    }

    renderQuickTagsFilter() {
        const quickTagsFilter = document.getElementById('quickTagsFilter');
        const quickTagsList = document.getElementById('quickTagsList');
        
        if (!quickTagsFilter || !quickTagsList) return;

        if (this.selectedTags.size === 0) {
            quickTagsFilter.style.display = 'none';
            return;
        }

        quickTagsFilter.style.display = 'block';
        quickTagsList.innerHTML = Array.from(this.selectedTags).map(tag => `
            <div class="quick-tag">
                <span>${tag}</span>
                <button class="btn-remove-quick-tag" onclick="catalog.removeQuickTag('${this.escapeHtml(tag)}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeQuickTag(tag) {
        this.selectedTags.delete(tag);
        this.renderCompactTags();
        this.renderQuickTagsFilter();
        this.applyFiltersAndSort();
    }

    getPopularTags(limit = 10) {
        const tagCounts = this.getTagCounts();
        return Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([tag, count]) => ({ tag, count }));
    }

    getTagCounts() {
        const tagCounts = {};
        this.media.forEach(media => {
            (media.tags || []).forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        return tagCounts;
    }

    getAllTags() {
        const allTags = this.media.flatMap(media => media.tags || []);
        const uniqueTags = [...new Set(allTags)];
        return uniqueTags.sort();
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;', 
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }


    setupApiSearchModal() {
        const searchBtn = document.getElementById('apiSearchBtn');
        const searchInput = document.getElementById('apiSearchInput');
        const closeBtn = document.getElementById('closeApiSearchModal');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput.value.trim();
                if (query) {
                    this.performApiSearch(query, this.currentApiSearchType);
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        this.performApiSearch(query, this.currentApiSearchType);
                    }
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeApiSearchModal();
            });
        }
    }

    openApiSearchModal(type) {
        const modal = document.getElementById('apiSearchModal');
        const searchInput = document.getElementById('apiSearchInput');
        const modalTitle = document.getElementById('apiSearchModalTitle');

        if (!modal || !searchInput || !modalTitle) return;

        this.currentApiSearchType = type;
        
        if (type === 'movie') {
            modalTitle.textContent = 'Пошук фільмів в TMDB';
            searchInput.placeholder = 'Введіть назву фільму...';
        } else if (type === 'book') {
            modalTitle.textContent = 'Пошук книг в Google Books';
            searchInput.placeholder = 'Введіть назву книги...';
        } else {
            modalTitle.textContent = 'Пошук фільмів та книг';
            searchInput.placeholder = 'Введіть назву фільму або книги...';
        }
        
        searchInput.value = '';
        document.getElementById('apiSearchResults').innerHTML = `
            <div class="search-initial-state">
                <i class="fas fa-search"></i>
                <span>Введіть запит для пошуку ${type === 'movie' ? 'фільмів' : type === 'book' ? 'книг' : 'фільмів та книг'}</span>
            </div>
        `;
        
        modal.classList.add('active');
        searchInput.focus();
    }

    async performApiSearch(query, type) {
        const resultsContainer = document.getElementById('apiSearchResults');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading"></div>
                <p>Пошук...</p>
            </div>
        `;

        try {
            let results = [];
            if (type === 'movie' || type === 'all') {
                results = results.concat(await this.searchMovies(query));
            }
            if (type === 'book' || type === 'all') {
                results = results.concat(await this.searchBooks(query));
            }

            this.renderApiSearchResults(results, type);
        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Помилка пошуку: ${error.message}</p>
                </div>
            `;
        }
    }

    async searchMovies(query) {
        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=uk-UA&page=1`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.tmdbApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`TMDB API error: ${response.status}`);
            }

            const data = await response.json();
            return data.results ? data.results.map(item => ({ ...item, _type: 'movie' })) : [];
        } catch (error) {
            console.error('Error searching movies:', error);
            this.showNotification('Помилка пошуку фільмів', 'error');
            return [];
        }
    }

    async searchBooks(query) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=uk&maxResults=20&key=${this.googleBooksApiKey}`
            );

            if (!response.ok) {
                throw new Error(`Google Books API error: ${response.status}`);
            }

            const data = await response.json();
            return data.items ? data.items.map(item => ({ ...item, _type: 'book' })) : [];
        } catch (error) {
            console.error('Error searching books:', error);
            this.showNotification('Помилка пошуку книг', 'error');
            return [];
        }
    }

    renderApiSearchResults(results, type) {
        const resultsContainer = document.getElementById('apiSearchResults');
        if (!resultsContainer) return;

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>Нічого не знайдено</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = results.map((item, index) => {
            if (item._type === 'movie') {
                return `
                    <div class="api-search-result">
                        <div class="result-image">
                            <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : this.getDefaultCover('movie')}" 
                                 alt="${item.title}"
                                 onerror="this.src='${this.getDefaultCover('movie')}'">
                        </div>
                        <div class="result-info">
                            <div class="result-type movie">Фільм</div>
                            <h4>${item.title}</h4>
                            <p>${item.release_date ? new Date(item.release_date).getFullYear() : 'Рік невідомий'}</p>
                            <p class="result-overview">${item.overview || 'Опис відсутній'}</p>
                            <div class="result-rating">
                                <i class="fas fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'Н/Д'}
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="catalog.addMovieFromApi(${item.id})">
                                <i class="fas fa-plus"></i> Додати фільм
                            </button>
                        </div>
                    </div>
                `;
            } else {
                const volumeInfo = item.volumeInfo;
                const imageUrl = volumeInfo.imageLinks ? 
                    volumeInfo.imageLinks.thumbnail.replace('http://', 'https://') : 
                    this.getDefaultCover('book');
                
                return `
                    <div class="api-search-result">
                        <div class="result-image">
                            <img src="${imageUrl}" 
                                 alt="${volumeInfo.title}"
                                 onerror="this.src='${this.getDefaultCover('book')}'">
                        </div>
                        <div class="result-info">
                            <div class="result-type book">Книга</div>
                            <h4>${volumeInfo.title}</h4>
                            <p>${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Автор невідомий'}</p>
                            <p>${volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear() : 'Рік невідомий'}</p>
                            <p class="result-overview">${volumeInfo.description ? 
                                (volumeInfo.description.length > 150 ? 
                                 volumeInfo.description.substring(0, 150) + '...' : 
                                 volumeInfo.description) : 
                                'Опис відсутній'}</p>
                            <button class="btn btn-primary btn-sm" onclick="catalog.addBookFromApi('${item.id}')">
                                <i class="fas fa-plus"></i> Додати книгу
                            </button>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }

    async addMovieFromApi(movieId) {
        try {
            this.showNotification('Завантаження деталей фільму...', 'info');
            
            const response = await fetch(
                `https://api.themoviedb.org/3/movie/${movieId}?language=uk-UA&append_to_response=credits`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.tmdbApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch movie details');
            }

            const movieDetails = await response.json();
            
            const director = movieDetails.credits?.crew?.find(person => 
                person.job === 'Director'
            );

            const actors = movieDetails.credits?.cast?.slice(0, 5).map(actor => actor.name) || [];

            const media = {
                type: 'movie',
                title: movieDetails.title,
                year: movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : new Date().getFullYear(),
                rating: movieDetails.vote_average ? (movieDetails.vote_average / 2).toFixed(1) : 7.0,
                description: movieDetails.overview || 'Опис відсутній',
                cover: movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : this.getDefaultCover('movie'),
                tags: movieDetails.genres ? movieDetails.genres.map(genre => genre.name) : [],
                dateAdded: new Date().toISOString(),
                views: 0,
                favorite: false,
                watched: false,
                director: director ? director.name : 'Невідомий режисер',
                duration: movieDetails.runtime || null,
                trailer: '',
                actors: actors,
                tmdb_id: movieId
            };

            const savedMedia = await this.saveMediaToServer(media);
            this.media.unshift(savedMedia);
            this.closeApiSearchModal();
            this.applyFiltersAndSort();
            this.updateCounts();
            this.renderCompactTags();
            this.renderActiveFilters();
            this.showNotification('Фільм успішно додано до колекції!', 'success');

        } catch (error) {
            console.error('Error adding movie from API:', error);
            this.showNotification('Помилка додавання фільму', 'error');
        }
    }

    async addBookFromApi(bookId) {
        try {
            this.showNotification('Завантаження деталей книги...', 'info');
            
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${this.googleBooksApiKey}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch book details');
            }

            const book = await response.json();
            const volumeInfo = book.volumeInfo;

            const media = {
                type: 'book',
                title: volumeInfo.title,
                year: volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear() : new Date().getFullYear(),
                rating: volumeInfo.averageRating ? volumeInfo.averageRating : 7.0,
                description: volumeInfo.description || 'Опис відсутній',
                cover: volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail.replace('http://', 'https://') : this.getDefaultCover('book'),
                tags: volumeInfo.categories || [],
                dateAdded: new Date().toISOString(),
                views: 0,
                favorite: false,
                watched: false,
                author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Невідомий автор',
                pages: volumeInfo.pageCount || null,
                genre: volumeInfo.categories ? volumeInfo.categories[0] : '',
                isbn: volumeInfo.industryIdentifiers ? volumeInfo.industryIdentifiers[0].identifier : '',
                google_books_id: bookId
            };

            const savedMedia = await this.saveMediaToServer(media);
            this.media.unshift(savedMedia);
            this.closeApiSearchModal();
            this.applyFiltersAndSort();
            this.updateCounts();
            this.renderCompactTags();
            this.renderActiveFilters();
            this.showNotification('Книгу успішно додано до колекції!', 'success');

        } catch (error) {
            console.error('Error adding book from API:', error);
            this.showNotification('Помилка додавання книги', 'error');
        }
    }

    closeApiSearchModal() {
        const modal = document.getElementById('apiSearchModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    getDefaultCover(type) {
        if (type === 'movie') {
            return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect width="300" height="450" fill="%233b82f6"/><text x="150" y="225" font-family="Arial" font-size="24" fill="white" text-anchor="middle">Фільм</text></svg>';
        } else {
            return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect width="300" height="450" fill="%236366f1"/><text x="150" y="225" font-family="Arial" font-size="24" fill="white" text-anchor="middle">Книга</text></svg>';
        }
    }


    applyFiltersAndSort() {
        let filtered = [...this.media];

        if (this.currentFilter === 'movie') {
            filtered = filtered.filter(item => item.type === 'movie');
        } else if (this.currentFilter === 'book') {
            filtered = filtered.filter(item => item.type === 'book');
        } else if (this.currentFilter === 'favorites') {
            filtered = filtered.filter(item => item.favorite);
        } else if (this.currentFilter === 'high-rating') {
            filtered = filtered.filter(item => item.rating >= 8);
        } else if (this.currentFilter === 'watched') {
            filtered = filtered.filter(item => item.watched);
        }

        if (this.searchQuery) {
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(this.searchQuery) ||
                (item.director || item.author || '').toLowerCase().includes(this.searchQuery) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(this.searchQuery))) ||
                (item.description && item.description.toLowerCase().includes(this.searchQuery))
            );
        }

        filtered = this.applyAdvancedFilters(filtered);

        if (this.selectedTags.size > 0) {
            filtered = filtered.filter(item => 
                item.tags && Array.from(this.selectedTags).every(tag => 
                    item.tags.some(itemTag => itemTag.toLowerCase() === tag.toLowerCase())
                )
            );
        }

        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (this.currentSort) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'year':
                    aValue = a.year;
                    bValue = b.year;
                    break;
                case 'rating':
                    aValue = a.rating;
                    bValue = b.rating;
                    break;
                case 'views':
                    aValue = a.views;
                    bValue = b.views;
                    break;
                case 'date-added':
                default:
                    aValue = new Date(a.dateAdded);
                    bValue = new Date(b.dateAdded);
            }

            if (this.currentSortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        this.filteredMedia = filtered;
        this.renderMedia();
        this.updateCounts();
    }

    applyAdvancedFilters(media) {
        const yearFrom = document.getElementById('yearFrom')?.value;
        const yearTo = document.getElementById('yearTo')?.value;
        const ratingFrom = document.getElementById('ratingFrom')?.value;
        const searchTags = document.getElementById('searchTags')?.value;

        let filtered = [...media];

        if (yearFrom) {
            filtered = filtered.filter(item => item.year >= parseInt(yearFrom));
        }

        if (yearTo) {
            filtered = filtered.filter(item => item.year <= parseInt(yearTo));
        }

        if (ratingFrom) {
            filtered = filtered.filter(item => item.rating >= parseFloat(ratingFrom));
        }

        if (searchTags) {
            const tags = searchTags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag);
            filtered = filtered.filter(item => 
                item.tags && tags.some(tag => item.tags.some(itemTag => 
                    itemTag.toLowerCase().includes(tag)
                ))
            );
        }

        return filtered;
    }

    handleFilterChange(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-filter="${filter}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        this.applyFiltersAndSort();
        this.updatePageTitle(filter);
        this.updateSearchCategoryInfo();
    }

    updatePageTitle(filter) {
        const titleMap = {
            'all': 'Вся колекція',
            'movie': 'Фільми',
            'book': 'Книги',
            'favorites': 'Улюблені',
            'high-rating': 'Високий рейтинг',
            'watched': 'Переглянуті'
        };

        const subtitleMap = {
            'all': 'Всі ваші улюблені фільми та книги в одному місці',
            'movie': 'Ваша колекція фільмів',
            'book': 'Ваша бібліотека книг',
            'favorites': 'Медіа, які ви особливо полюбляєте',
            'high-rating': 'Найкраще з вашої колекції',
            'watched': 'Медіа, які ви вже переглянули'
        };

        const safeUpdate = (elementId, value) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
            }
        };

        safeUpdate('pageTitle', titleMap[filter] || 'Медіа-каталог');
        safeUpdate('pageSubtitle', subtitleMap[filter] || 'Всі ваші улюблені фільми та книги в одному місці');
        
        const collectionTitle = document.getElementById('collectionTitle');
        if (collectionTitle) {
            const span = collectionTitle.querySelector('span');
            if (span) {
                span.textContent = titleMap[filter] || 'Моя колекція';
            }
        }
    }


    renderMedia() {
        const gridContainer = document.getElementById('mediaGrid');
        const listContainer = document.getElementById('mediaList');
        
        if (!gridContainer || !listContainer) {
            console.error('Media containers not found');
            return;
        }

        gridContainer.innerHTML = '';
        listContainer.innerHTML = '';

        if (this.filteredMedia.length === 0) {
            this.renderEmptyState(gridContainer);
            return;
        }

        if (this.currentView === 'grid') {
            this.filteredMedia.forEach(media => {
                const card = this.createMediaCard(media);
                gridContainer.appendChild(card);
            });
            listContainer.style.display = 'none';
            gridContainer.style.display = 'grid';
        } else {
            this.filteredMedia.forEach(media => {
                const item = this.createMediaListItem(media);
                listContainer.appendChild(item);
            });
            gridContainer.style.display = 'none';
            listContainer.style.display = 'block';
        }
    }

    createMediaCard(media) {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.setAttribute('data-id', media.id);
        
        const tagsHtml = (media.tags || []).map(tag => 
            `<span class="media-tag">${tag}</span>`
        ).join('');

        card.innerHTML = `
            <div class="media-image">
                <img src="${media.cover}" alt="${media.title}" onerror="this.src='${this.getDefaultCover(media.type)}'">
                <div class="media-overlay">
                    <button class="media-btn media-btn-primary" onclick="catalog.viewMediaDetails('${media.id}')">
                        <i class="fas fa-eye"></i> Деталі
                    </button>
                    ${media.trailer ? `
                    <button class="media-btn media-btn-watch" onclick="catalog.openTrailerPlayer('${media.trailer}')">
                        <i class="fab fa-youtube"></i> Трейлер
                    </button>` : ''}
                </div>
                <span class="media-type ${media.type}">
                    <i class="fas ${media.type === 'movie' ? 'fa-film' : 'fa-book'}"></i>
                    ${media.type === 'movie' ? 'Фільм' : 'Книга'}
                </span>
                <span class="media-rating">
                    <i class="fas fa-star"></i> ${media.rating}
                </span>
                <span class="media-views ${media.watched ? 'watched' : ''}">
                    <i class="fas fa-eye"></i> ${media.views}
                </span>
            </div>
            <div class="media-content">
                <h3 class="media-title">${media.title}</h3>
                <div class="media-meta">
                    <span class="media-year">${media.year}</span>
                    ${media.duration ? `<span class="media-duration">${media.duration} хв</span>` : ''}
                    ${media.pages ? `<span class="media-duration">${media.pages} стр.</span>` : ''}
                </div>
                <p class="media-description">${media.description}</p>
                <div class="media-tags">${tagsHtml}</div>
                <div class="media-actions">
                    <button class="favorite-btn ${media.favorite ? 'active' : ''}" onclick="catalog.toggleFavorite('${media.id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="watch-btn ${media.watched ? 'watched' : ''}" onclick="catalog.toggleWatched('${media.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="media-btn media-btn-outline" onclick="catalog.incrementViews('${media.id}')">
                        <i class="fas fa-plus"></i> Перегляд
                    </button>
                    <button class="media-btn media-btn-danger" onclick="catalog.deleteMedia('${media.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    createMediaListItem(media) {
        const item = document.createElement('div');
        item.className = 'media-list-item';
        item.setAttribute('data-id', media.id);
        
        const tagsHtml = (media.tags || []).map(tag => 
            `<span class="list-tag">${tag}</span>`
        ).join('');

        item.innerHTML = `
            <div class="list-image">
                <img src="${media.cover}" alt="${media.title}" onerror="this.src='${this.getDefaultCover(media.type)}'">
            </div>
            <div class="list-content">
                <h3 class="list-title">${media.title}</h3>
                <div class="list-meta">
                    <span class="list-type ${media.type}">
                        ${media.type === 'movie' ? 'Фільм' : 'Книга'}
                    </span>
                    <span>${media.year}</span>
                    ${media.director ? `<span>Режисер: ${media.director}</span>` : ''}
                    ${media.author ? `<span>Автор: ${media.author}</span>` : ''}
                    <span><i class="fas fa-star"></i> ${media.rating}</span>
                    <span><i class="fas fa-eye"></i> ${media.views}</span>
                </div>
                <p class="list-description">${media.description}</p>
                <div class="list-tags">${tagsHtml}</div>
            </div>
            <div class="list-actions">
                <button class="favorite-btn ${media.favorite ? 'active' : ''}" onclick="catalog.toggleFavorite('${media.id}')">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="watch-btn ${media.watched ? 'watched' : ''}" onclick="catalog.toggleWatched('${media.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline" onclick="catalog.incrementViews('${media.id}')">
                    <i class="fas fa-plus"></i>
                </button>
                ${media.trailer ? `
                <button class="btn btn-sm btn-outline" onclick="catalog.openTrailerPlayer('${media.trailer}')">
                    <i class="fab fa-youtube"></i>
                </button>` : ''}
                <button class="btn btn-sm btn-outline" onclick="catalog.viewMediaDetails('${media.id}')">
                    <i class="fas fa-info"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="catalog.deleteMedia('${media.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        return item;
    }

    renderEmptyState(container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 class="empty-title">Медіа не знайдено</h3>
                <p class="empty-description">Спробуйте змінити фільтри або додати нове медіа</p>
                <button class="btn btn-primary" onclick="catalog.openAddModal()">
                    <i class="fas fa-plus"></i> Додати медіа
                </button>
            </div>
        `;
    }

    renderActiveFilters() {
        const activeFilters = document.getElementById('activeFilters');
        if (!activeFilters) return;

        if (this.selectedTags.size === 0) {
            activeFilters.innerHTML = '<div class="no-filters">Немає активних фільтрів</div>';
            return;
        }

        activeFilters.innerHTML = Array.from(this.selectedTags).map(tag => `
            <span class="active-tag">
                ${tag}
                <button class="remove-filter" onclick="catalog.removeTagFromManagement('${this.escapeHtml(tag)}')">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
    }


    async saveMediaToServer(media) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(media)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving media:', error);
            throw error;
        }
    }

    async updateMediaOnServer(id, updates) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating media:', error);
            throw error;
        }
    }

    async deleteMediaFromServer(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting media:', error);
            throw error;
        }
    }

    async toggleFavorite(id) {
        const mediaIndex = this.media.findIndex(item => item.id === id);
        if (mediaIndex !== -1) {
            const newFavoriteState = !this.media[mediaIndex].favorite;
            try {
                await this.updateMedia(id, { favorite: newFavoriteState });
                this.showNotification(newFavoriteState ? 'Додано до улюблених' : 'Видалено з улюблених', 'success');
            } catch (error) {
                this.showNotification('Помилка при оновленні', 'error');
            }
        }
    }

    async toggleWatched(id) {
        const mediaIndex = this.media.findIndex(item => item.id === id);
        if (mediaIndex !== -1) {
            const newWatchedState = !this.media[mediaIndex].watched;
            const updates = { watched: newWatchedState };
            
            if (newWatchedState && this.media[mediaIndex].views === 0) {
                updates.views = 1;
            }
            
            try {
                await this.updateMedia(id, updates);
                this.showNotification(newWatchedState ? 'Позначено як переглянуте' : 'Позначено як непереглянуте', 'success');
            } catch (error) {
                this.showNotification('Помилка при оновленні', 'error');
            }
        }
    }

    async incrementViews(id) {
        const mediaIndex = this.media.findIndex(item => item.id === id);
        if (mediaIndex !== -1) {
            try {
                await this.updateMedia(id, { views: this.media[mediaIndex].views + 1 });
                this.showNotification('Перегляд додано', 'success');
            } catch (error) {
                this.showNotification('Помилка при оновленні', 'error');
            }
        }
    }

    async updateMedia(id, updates) {
        try {
            const updatedMedia = await this.updateMediaOnServer(id, updates);
            const index = this.media.findIndex(item => item.id === id);
            if (index !== -1) {
                this.media[index] = { ...this.media[index], ...updatedMedia };
                this.applyFiltersAndSort();
            }
        } catch (error) {
            console.error('Error updating media:', error);
            throw error;
        }
    }

    async deleteMedia(id) {
        if (confirm('Ви впевнені, що хочете видалити це медіа?')) {
            try {
                await this.deleteMediaFromServer(id);
                this.media = this.media.filter(item => item.id !== id);
                this.applyFiltersAndSort();
                this.updateCounts();
                this.renderCompactTags();
                this.renderActiveFilters();
                this.showNotification('Медіа видалено', 'success');
            } catch (error) {
                console.error('Error deleting media:', error);
                this.showNotification('Помилка при видаленні медіа', 'error');
            }
        }
    }

    viewMediaDetails(id) {
        const media = this.media.find(item => item.id === id);
        if (media) {
            this.renderMediaDetails(media);
            const modal = document.getElementById('mediaDetailsModal');
            if (modal) {
                modal.classList.add('active');
            }
        }
    }

    closeMediaDetailsModal() {
        const modal = document.getElementById('mediaDetailsModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    renderMediaDetails(media) {
        const detailsContent = document.getElementById('mediaDetailsContent');
        if (!detailsContent) return;
        
        let specificFields = '';
        if (media.type === 'movie') {
            specificFields = `
                <div class="preview-meta-item">
                    <span class="preview-meta-label">Режисер</span>
                    <span class="preview-meta-value">${media.director || 'Не вказано'}</span>
                </div>
                <div class="preview-meta-item">
                    <span class="preview-meta-label">Тривалість</span>
                    <span class="preview-meta-value">${media.duration ? media.duration + ' хв' : 'Не вказано'}</span>
                </div>
                <div class="preview-meta-item">
                    <span class="preview-meta-label">Актори</span>
                    <span class="preview-meta-value">${media.actors?.join(', ') || 'Не вказано'}</span>
                </div>
                ${media.trailer ? `
                <div class="preview-meta-item full-width">
                    <span class="preview-meta-label">Трейлер</span>
                    <div class="trailer-container">
                        <button class="btn-watch-trailer" onclick="catalog.openTrailerPlayer('${media.trailer}')">
                            <i class="fab fa-youtube"></i> Дивитись трейлер
                        </button>
                    </div>
                </div>` : ''}
            `;
        } else {
            specificFields = `
                <div class="preview-meta-item">
                    <span class="preview-meta-label">Автор</span>
                    <span class="preview-meta-value">${media.author || 'Не вказано'}</span>
                </div>
                <div class="preview-meta-item">
                    <span class="preview-meta-label">Сторінок</span>
                    <span class="preview-meta-value">${media.pages || 'Не вказано'}</span>
                </div>
                <div class="preview-meta-item">
                    <span class="preview-meta-label">Жанр</span>
                    <span class="preview-meta-value">${media.genre || 'Не вказано'}</span>
                </div>
                <div class="preview-meta-item">
                    <span class="preview-meta-label">ISBN</span>
                    <span class="preview-meta-value">${media.isbn || 'Не вказано'}</span>
                </div>
            `;
        }

        detailsContent.innerHTML = `
            <div class="preview-container">
                <div class="preview-image">
                    <img src="${media.cover}" alt="${media.title}" onerror="this.src='${this.getDefaultCover(media.type)}'">
                </div>
                <div class="preview-info">
                    <h1 class="preview-title">${media.title}</h1>
                    
                    <div class="preview-meta-grid">
                        <div class="preview-meta-item">
                            <span class="preview-meta-label">Тип</span>
                            <span class="preview-meta-value ${media.type}">
                                <i class="fas ${media.type === 'movie' ? 'fa-film' : 'fa-book'}"></i>
                                ${media.type === 'movie' ? 'Фільм' : 'Книга'}
                            </span>
                        </div>
                        <div class="preview-meta-item">
                            <span class="preview-meta-label">Рік</span>
                            <span class="preview-meta-value">${media.year}</span>
                        </div>
                        <div class="preview-meta-item">
                            <span class="preview-meta-label">Рейтинг</span>
                            <span class="preview-meta-value rating">
                                <i class="fas fa-star"></i> ${media.rating}/10
                            </span>
                        </div>
                        <div class="preview-meta-item">
                            <span class="preview-meta-label">Перегляди</span>
                            <span class="preview-meta-value">
                                <i class="fas fa-eye"></i> ${media.views}
                            </span>
                        </div>
                        ${specificFields}
                    </div>

                    <div class="preview-description">
                        <h4>Опис</h4>
                        <p>${media.description}</p>
                    </div>

                    <div class="preview-actions">
                        <button class="btn ${media.favorite ? 'btn-danger' : 'btn-outline'} favorite-details-btn" onclick="catalog.toggleFavorite('${media.id}')">
                            <i class="fas fa-heart"></i>
                            ${media.favorite ? 'Видалити з улюблених' : 'Додати в улюблені'}
                        </button>
                        <button class="btn ${media.watched ? 'btn-success' : 'btn-outline'}" onclick="catalog.toggleWatched('${media.id}')">
                            <i class="fas fa-eye"></i>
                            ${media.watched ? 'Позначити як непереглянуте' : 'Позначити як переглянуте'}
                        </button>
                        <button class="btn btn-primary" onclick="catalog.incrementViews('${media.id}')">
                            <i class="fas fa-plus"></i> Додати перегляд
                        </button>
                        <button class="btn btn-danger" onclick="catalog.deleteMedia('${media.id}')">
                            <i class="fas fa-trash"></i> Видалити
                        </button>
                    </div>
                </div>
            </div>
        `;

        const detailsTitle = document.getElementById('detailsTitle');
        if (detailsTitle) {
            detailsTitle.textContent = media.title;
        }
    }

    openTrailerPlayer(trailerUrl) {
        if (!trailerUrl) {
            this.showNotification('Трейлер недоступний', 'warning');
            return;
        }

        const videoId = this.extractYouTubeId(trailerUrl);
        if (!videoId) {
            window.open(trailerUrl, '_blank');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.zIndex = '4000';
        modal.innerHTML = `
            <div class="modal-content xlarge" style="max-width: 900px;">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fab fa-youtube"></i> Перегляд трейлера
                    </h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <div class="video-container">
                        <iframe 
                            width="100%" 
                            height="500" 
                            src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    extractYouTubeId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }
    updateCounts() {
        const safeUpdate = (elementId, value) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
            }
        };

        const all = this.media.length;
        const movies = this.media.filter(m => m.type === 'movie').length;
        const books = this.media.filter(m => m.type === 'book').length;
        const favorites = this.media.filter(m => m.favorite).length;
        const highRating = this.media.filter(m => m.rating >= 8).length;
        const watched = this.media.filter(m => m.watched).length;

        safeUpdate('countAll', all);
        safeUpdate('countMovies', movies);
        safeUpdate('countBooks', books);
        safeUpdate('countFavorites', favorites);
        safeUpdate('countHighRating', highRating);
        safeUpdate('countWatched', watched);
    }

    switchView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.view-toggle').forEach(toggle => {
            toggle.classList.toggle('active', toggle.dataset.view === view);
        });

        this.renderMedia();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    openAddModal() {
        const modal = document.getElementById('addMediaModal');
        if (modal) {
            modal.classList.add('active');
        }
        const form = document.getElementById('addMediaForm');
        if (form) {
            form.reset();
        }
        this.selectedTags.clear();
        this.renderSelectedTagsForm();
        const coverPreview = document.getElementById('coverPreview');
        if (coverPreview) {
            coverPreview.innerHTML = '<i class="fas fa-image"></i><span>Попередній перегляд</span>';
        }
        const movieFields = document.getElementById('movieFields');
        const bookFields = document.getElementById('bookFields');
        if (movieFields) movieFields.style.display = 'none';
        if (bookFields) bookFields.style.display = 'none';
    }

    closeAddModal() {
        const modal = document.getElementById('addMediaModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    toggleMediaFields(type) {
        const movieFields = document.getElementById('movieFields');
        const bookFields = document.getElementById('bookFields');
        
        if (movieFields) {
            movieFields.style.display = type === 'movie' ? 'block' : 'none';
        }
        if (bookFields) {
            bookFields.style.display = type === 'book' ? 'block' : 'none';
        }
    }

    async addNewMedia() {
        const form = document.getElementById('addMediaForm');
        if (!form) return;

        const formData = new FormData(form);
        const mediaType = formData.get('type');
        
        if (!mediaType) {
            this.showNotification('Оберіть тип медіа', 'error');
            return;
        }

        const title = mediaType === 'movie' ? formData.get('movieTitle') : formData.get('bookTitle');
        const year = formData.get('year');
        const rating = formData.get('rating');
        const description = formData.get('description');

        if (!title || !year || !rating || !description) {
            this.showNotification('Заповніть обов\'язкові поля', 'error');
            return;
        }

        const media = {
            type: mediaType,
            title: title,
            year: parseInt(year),
            rating: parseFloat(rating),
            description: description,
            cover: formData.get('cover') || this.getDefaultCover(mediaType),
            tags: Array.from(this.selectedTags),
            dateAdded: new Date().toISOString(),
            views: 0,
            favorite: false,
            watched: false
        };

        if (mediaType === 'movie') {
            media.director = formData.get('director') || '';
            media.duration = formData.get('duration') ? parseInt(formData.get('duration')) : null;
            media.trailer = formData.get('trailer') || '';
            media.actors = formData.get('actors')?.split(',').map(actor => actor.trim()).filter(actor => actor) || [];
        } else {
            media.author = formData.get('author') || '';
            media.pages = formData.get('pages') ? parseInt(formData.get('pages')) : null;
            media.genre = formData.get('genre') || '';
            media.isbn = formData.get('isbn') || '';
        }

        try {
            const savedMedia = await this.saveMediaToServer(media);
            this.media.unshift(savedMedia);
            this.closeAddModal();
            this.applyFiltersAndSort();
            this.updateCounts();
            this.renderCompactTags();
            this.renderActiveFilters();
            this.showNotification('Медіа успішно додано!', 'success');
        } catch (error) {
            this.showNotification('Помилка при додаванні медіа', 'error');
        }
    }

    setupImageUploadModal() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        const selectImageBtn = document.getElementById('selectImageBtn');
        const previewImage = document.getElementById('previewImage');
        const uploadPreview = document.getElementById('uploadPreview');
        const cancelUpload = document.getElementById('cancelUpload');
        const confirmUpload = document.getElementById('confirmUpload');
        const closeImageUploadModal = document.getElementById('closeImageUploadModal');

        if (selectImageBtn && imageInput) {
            selectImageBtn.addEventListener('click', () => {
                imageInput.click();
            });
        }

        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (previewImage) {
                            previewImage.src = event.target.result;
                        }
                        if (uploadPreview) {
                            uploadPreview.style.display = 'block';
                        }
                        if (uploadArea) {
                            uploadArea.style.display = 'none';
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (previewImage) {
                            previewImage.src = event.target.result;
                        }
                        if (uploadPreview) {
                            uploadPreview.style.display = 'block';
                        }
                        if (uploadArea) {
                            uploadArea.style.display = 'none';
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (cancelUpload) {
            cancelUpload.addEventListener('click', () => {
                if (uploadPreview) uploadPreview.style.display = 'none';
                if (uploadArea) uploadArea.style.display = 'block';
                if (imageInput) imageInput.value = '';
            });
        }

        if (confirmUpload) {
            confirmUpload.addEventListener('click', () => {
                const coverUrl = document.getElementById('coverUrl');
                const coverPreview = document.getElementById('coverPreview');
                if (coverUrl && previewImage && coverPreview) {
                    coverUrl.value = previewImage.src;
                    coverPreview.innerHTML = `<img src="${previewImage.src}" alt="Preview">`;
                }
                this.closeImageUploadModal();
            });
        }

        if (closeImageUploadModal) {
            closeImageUploadModal.addEventListener('click', () => {
                this.closeImageUploadModal();
            });
        }
    }

    closeImageUploadModal() {
        const modal = document.getElementById('imageUploadModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    openImageUploadModal() {
        const modal = document.getElementById('imageUploadModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    setupAdvancedSearch() {
        const advancedFilters = ['yearFrom', 'yearTo', 'ratingFrom', 'searchTags'];
        
        advancedFilters.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('input', () => {
                    this.applyFiltersAndSort();
                });
            }
        });
    }

    toggleAdvancedSearch() {
        const advancedSearch = document.getElementById('advancedSearch');
        if (advancedSearch) {
            const isVisible = advancedSearch.style.display !== 'none';
            advancedSearch.style.display = isVisible ? 'none' : 'block';
        }
    }

    setupModalCloseHandlers() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    openViewAllModal() {
        const grid = document.getElementById('viewAllGrid');
        if (grid) {
            grid.innerHTML = '';
            
            this.media.forEach(media => {
                const card = this.createMediaCard(media);
                grid.appendChild(card);
            });
        }
        
        const modal = document.getElementById('viewAllModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeViewAllModal() {
        const modal = document.getElementById('viewAllModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    updateCoverPreview(url) {
        const preview = document.getElementById('coverPreview');
        if (preview) {
            if (url) {
                preview.innerHTML = `<img src="${url}" alt="Preview">`;
            } else {
                preview.innerHTML = '<i class="fas fa-image"></i><span>Попередній перегляд</span>';
            }
        }
    }

    exportData() {
        const data = {
            media: this.media,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `media-catalog-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Дані експортовано успішно!', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        if (data.media && Array.isArray(data.media)) {
                            this.media = data.media;
                            this.applyFiltersAndSort();
                            this.updateCounts();
                            this.renderCompactTags();
                            this.renderActiveFilters();
                            this.showNotification('Дані імпортовано успішно!', 'success');
                        } else {
                            this.showNotification('Невірний формат файлу', 'error');
                        }
                    } catch (error) {
                        this.showNotification('Помилка читання файлу', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

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

document.addEventListener('DOMContentLoaded', () => {
    window.catalog = new MediaCatalog();
});