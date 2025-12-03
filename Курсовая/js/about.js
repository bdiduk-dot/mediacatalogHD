document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ About page loaded successfully!');
    initTheme();
    initStatistics();
    initScrollEffects();
    console.log('✅ All systems initialized!');
});

function initTheme() {
    console.log('🎨 Initializing theme...');
    
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }
    
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        console.log('Theme applied:', theme);
    }
}
function initStatistics() {
    console.log('📊 Loading statistics...');

    loadStatistics();

    setInterval(loadStatistics, 5000);
}

async function loadStatistics() {
    try {
        const response = await fetch('http://localhost:3001/media');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const media = await response.json();
        const movies = media.filter(item => item.type === 'movie').length;
        const books = media.filter(item => item.type === 'book').length;
        const totalMedia = media.length;
        updateStatistic('totalMovies', movies);
        updateStatistic('totalBooks', books);
        updateStatistic('totalMedia', totalMedia);
        
        console.log('Statistics updated:', { movies, books, totalMedia });
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        loadStatisticsFromLocalStorage();
    }
}

function loadStatisticsFromLocalStorage() {
    try {
        const media = JSON.parse(localStorage.getItem('media')) || [];
        
        const movies = media.filter(item => item.type === 'movie').length;
        const books = media.filter(item => item.type === 'book').length;
        const totalMedia = media.length;
        
        updateStatistic('totalMovies', movies);
        updateStatistic('totalBooks', books);
        updateStatistic('totalMedia', totalMedia);
        
        console.log('Statistics loaded from localStorage:', { movies, books, totalMedia });
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

function updateStatistic(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('counting');
        element.textContent = value;
        setTimeout(() => {
            element.classList.remove('counting');
        }, 500);
    }
}

function initScrollEffects() {
    console.log('🌀 Initializing scroll effects...');
    window.addEventListener('scroll', function() {
        const header = document.getElementById('header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const headerHeight = document.getElementById('header').offsetHeight;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    const animatedElements = document.querySelectorAll('.feature-card, .stat-card, .timeline-item, .team-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
});
try {
    console.log('All systems go!');
} catch (error) {
    console.error('Initialization error:', error);
}