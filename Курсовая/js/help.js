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
        window.addEventListener('scroll', () => {
            const header = document.getElementById('header');
            if (header) {
                if (window.scrollY > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }
        });
    }
}
class FAQAccordion {
    constructor() {
        this.faqItems = document.querySelectorAll('.faq-item');
        this.init();
    }

    init() {
        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (question) {
                question.addEventListener('click', () => {
                    this.toggleItem(item);
                });
            }
        });
    }

    toggleItem(item) {
        const isActive = item.classList.contains('active');
        this.faqItems.forEach(faqItem => {
            faqItem.classList.remove('active');
        });
        if (!isActive) {
            item.classList.add('active');
        }
    }
}
class HelpNavigation {
    constructor() {
        this.navLinks = document.querySelectorAll('.help-nav-link');
        this.sections = document.querySelectorAll('.help-section');
        this.init();
    }

    init() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavClick(link);
            });
        });
        window.addEventListener('scroll', () => {
            this.updateActiveNav();
        });
        this.updateActiveNav();
    }

    handleNavClick(link) {
        const targetId = link.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            this.navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            window.scrollTo({
                top: targetSection.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    }

    updateActiveNav() {
        let currentSection = '';
        
        this.sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
                currentSection = section.getAttribute('id');
            }
        });
        
        if (currentSection) {
            this.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSection}`) {
                    link.classList.add('active');
                }
            });
        }
    }
}
class SmoothScroller {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
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
class ScrollAnimator {
    constructor() {
        this.elements = document.querySelectorAll('.scroll-reveal');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        this.elements.forEach(element => {
            observer.observe(element);
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new FAQAccordion();
    new HelpNavigation();
    new SmoothScroller();
    new ScrollAnimator();
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });
});
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ThemeManager,
        FAQAccordion,
        HelpNavigation,
        SmoothScroller,
        ScrollAnimator
    };
}