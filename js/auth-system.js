// auth-system.js - 100% РАБОЧАЯ СИСТЕМА АВТОРИЗАЦИИ
class AuthSystem {
    constructor() {
        this.initDatabase();
        this.setupEventListeners();
        this.checkSession();
    }
    
    initDatabase() {
        // Инициализация базы данных
        if (!localStorage.getItem('leo_users')) {
            localStorage.setItem('leo_users', JSON.stringify([]));
        }
        
        // Создаем администратора по умолчанию
        const users = JSON.parse(localStorage.getItem('leo_users'));
        const adminExists = users.some(u => u.username === 'admin');
        
        if (!adminExists) {
            const admin = {
                id: 1,
                fullname: 'Администратор системы',
                username: 'admin',
                password: 'admin123', // Пароль в открытом виде для тестирования
                role: 'admin',
                class: '7Б',
                points: 0,
                level: 1,
                avatar: 'АД',
                active: true,
                registeredAt: new Date().toISOString(),
                lastLogin: null
            };
            
            users.push(admin);
            localStorage.setItem('leo_users', JSON.stringify(users));
            console.log('✅ Администратор создан: admin / admin123');
        }
        
        // Создаем тестового ученика
        const studentExists = users.some(u => u.username === 'ученик');
        if (!studentExists) {
            const student = {
                id: 2,
                fullname: 'Иванов Иван',
                username: 'ученик',
                password: 'ученик123',
                role: 'student',
                class: '7Б',
                points: 500,
                level: 1,
                avatar: 'ИИ',
                active: true,
                registeredAt: new Date().toISOString(),
                lastLogin: null
            };
            
            users.push(student);
            localStorage.setItem('leo_users', JSON.stringify(users));
            console.log('✅ Тестовый ученик создан: ученик / ученик123');
        }
        
        console.log('✅ База данных готова. Пользователи:', users);
    }
    
    setupEventListeners() {
        // Вход
        document.getElementById('login-submit')?.addEventListener('click', () => this.login());
        
        // Регистрация
        document.getElementById('register-submit')?.addEventListener('click', () => this.register());
        
        // Админ вход
        document.getElementById('admin-submit')?.addEventListener('click', () => this.adminLogin());
        
        // Enter для форм
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (document.querySelector('#login-form.active')) {
                    this.login();
                } else if (document.querySelector('#register-form.active')) {
                    this.register();
                } else if (document.querySelector('#admin-form.active')) {
                    this.adminLogin();
                }
            }
        });
    }
    
    checkSession() {
        const session = localStorage.getItem('leo_session');
        if (session) {
            try {
                const user = JSON.parse(session);
                console.log('🔍 Найдена активная сессия для:', user.fullname);
                
                // Немедленный редирект
                setTimeout(() => {
                    window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
                }, 50);
            } catch (e) {
                console.error('Ошибка сессии:', e);
                localStorage.removeItem('leo_session');
            }
        }
    }
    
    login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        console.log('🔐 Попытка входа:', username);
        
        if (!username || !password) {
            this.showMessage('Заполните все поля', 'error');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            if (user.active) {
                // Сохраняем сессию
                localStorage.setItem('leo_session', JSON.stringify(user));
                console.log('✅ Сессия сохранена:', user);
                
                this.showMessage(`Вход выполнен! Добро пожаловать, ${user.fullname}`, 'success');
                
                // Мгновенный редирект
                setTimeout(() => {
                    window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
                }, 500);
                
            } else {
                this.showMessage('Аккаунт не активирован', 'error');
            }
        } else {
            this.showMessage('Неверный логин или пароль', 'error');
        }
    }
    
    register() {
        const fullname = document.getElementById('reg-fullname').value.trim();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;
        
        if (!fullname || !username || !password || !confirmPassword) {
            this.showMessage('Заполните все поля', 'error', 'reg-message');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Пароли не совпадают', 'error', 'reg-message');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('Пароль должен быть не менее 6 символов', 'error', 'reg-message');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        if (users.some(u => u.username === username)) {
            this.showMessage('Этот логин уже занят', 'error', 'reg-message');
            return;
        }
        
        const newUser = {
            id: Date.now(),
            fullname: fullname,
            username: username,
            password: password,
            role: 'student',
            class: '7Б',
            points: 0,
            level: 1,
            avatar: this.generateAvatar(fullname),
            active: false,
            registeredAt: new Date().toISOString(),
            lastLogin: null
        };
        
        users.push(newUser);
        localStorage.setItem('leo_users', JSON.stringify(users));
        
        this.showMessage('Регистрация успешна! Аккаунт ожидает активации.', 'success', 'reg-message');
        
        // Очищаем форму
        setTimeout(() => {
            document.getElementById('reg-fullname').value = '';
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-password-confirm').value = '';
            document.getElementById('login-tab').click();
        }, 2000);
    }
    
    adminLogin() {
        const key = document.getElementById('admin-key').value;
        const password = document.getElementById('admin-password').value;
        
        if (key === 'LEO7B2024') {
            const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
            const admin = users.find(u => u.username === 'admin' && u.password === password);
            
            if (admin) {
                localStorage.setItem('leo_session', JSON.stringify(admin));
                this.showMessage('Доступ предоставлен', 'success', 'admin-message');
                
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 500);
            } else {
                this.showMessage('Неверный пароль', 'error', 'admin-message');
            }
        } else {
            this.showMessage('Неверный ключ', 'error', 'admin-message');
        }
    }
    
    generateAvatar(fullname) {
        const names = fullname.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return fullname.substring(0, 2).toUpperCase();
    }
    
    showMessage(text, type = 'info', elementId = 'auth-message') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.textContent = text;
        element.className = `message-box ${type}`;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.display = 'none';
                element.style.opacity = '1';
            }, 300);
        }, 3000);
    }
}

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
    
    // Добавляем тестовые данные для быстрой проверки
    if (location.search.includes('test')) {
        document.getElementById('login-username').value = 'ученик';
        document.getElementById('login-password').value = 'ученик123';
        console.log('⚠️ Тестовые данные загружены');
    }
});
