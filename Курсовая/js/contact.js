document.addEventListener('DOMContentLoaded', function() {
    console.log('Contact page loaded');
    
    initTheme();
    initFAQ();
    initContactForm();
    initMap();
    initScrollEffects();
});

function initTheme() {
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

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            item.classList.toggle('active');
        });
    });
    
    console.log('FAQ initialized');
}

function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            submitForm();
        }
    });
    
    const inputs = contactForm.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
    
    function validateForm() {
        let isValid = true;
        clearAllErrors();

        const name = document.getElementById('name');
        if (!name.value.trim()) {
            showError(name, 'Будь ласка, введіть ваше ім\'я');
            isValid = false;
        }

        const email = document.getElementById('email');
        if (!email.value.trim()) {
            showError(email, 'Будь ласка, введіть вашу електронну пошту');
            isValid = false;
        } else if (!isValidEmail(email.value)) {
            showError(email, 'Будь ласка, введіть коректну електронну пошту');
            isValid = false;
        }

        const message = document.getElementById('message');
        if (!message.value.trim()) {
            showError(message, 'Будь ласка, введіть ваше повідомлення');
            isValid = false;
        } else if (message.value.trim().length < 10) {
            showError(message, 'Повідомлення має містити щонайменше 10 символів');
            isValid = false;
        }
        
        return isValid;
    }
    
    function validateField(field) {
        clearFieldError(field);
        
        if (field.id === 'name' && !field.value.trim()) {
            showError(field, 'Будь ласка, введіть ваше ім\'я');
        } else if (field.id === 'email' && field.value.trim() && !isValidEmail(field.value)) {
            showError(field, 'Будь ласка, введіть коректну електронну пошту');
        } else if (field.id === 'message' && field.value.trim() && field.value.trim().length < 10) {
            showError(field, 'Повідомлення має містити щонайменше 10 символів');
        }
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showError(input, message) {
        input.classList.add('error');
        
        let errorElement = input.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            input.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }
    
    function clearFieldError(input) {
        input.classList.remove('error');
        const errorElement = input.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    function clearAllErrors() {
        const errors = document.querySelectorAll('.error-message');
        errors.forEach(error => error.remove());
        
        const errorInputs = document.querySelectorAll('.error');
        errorInputs.forEach(input => input.classList.remove('error'));
    }
    
    function submitForm() {
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Надсилання...';
        submitButton.disabled = true;

        setTimeout(() => {
            submitButton.innerHTML = '<i class="fas fa-check"></i> Повідомлення надіслано!';
            submitButton.style.background = 'var(--success-color)';
            
            showNotification('Повідомлення успішно надіслано! Ми зв\'яжемося з вами найближчим часом.', 'success');
            
            setTimeout(() => {
                contactForm.reset();
                submitButton.innerHTML = originalText;
                submitButton.style.background = '';
                submitButton.disabled = false;
            }, 2000);
        }, 1500);
    }
    
    console.log('Contact form initialized');
}

function initMap() {
    const mapElement = document.getElementById('mapInteractive');
    
    if (mapElement) {
        mapElement.addEventListener('click', function() {
            const address = encodeURIComponent('Київ, вул. Святошинська, 12');
            window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
        });
        
        mapElement.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
        });
        
        mapElement.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    console.log('Map initialized');
}
function initScrollEffects() {
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
    const animatedElements = document.querySelectorAll('.contact-card, .team-member, .faq-item');
    
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
    
    console.log('Scroll effects initialized');
}
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle', 
        info: 'info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-left: 4px solid var(--${type}-color);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        padding: var(--spacing-md);
        max-width: 400px;
        z-index: 10000;
        transform: translateX(400px);
        opacity: 0;
        transition: all var(--transition-normal);
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
});
try {
    console.log('All systems go!');
} catch (error) {
    console.error('Initialization error:', error);
}