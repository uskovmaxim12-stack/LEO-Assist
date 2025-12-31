// auth-system.js - РАБОЧАЯ СИСТЕМА АВТОРИЗАЦИИ (без демо)

class AuthSystem {
    constructor() {
        this.initDatabase();
        this.setupEventListeners();
    }
    
    initDatabase() {
        // Инициализация базы данных
        if (!localStorage.getItem('leo_users')) {
            localStorage.setItem('leo_users', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('leo_system_logs')) {
            localStorage.setItem('leo_system_logs', JSON.stringify([]));
        }
        
        // Автоматически создаём администратора при первом запуске
        const users = JSON.parse(localStorage.getItem('leo_users'));
        const adminExists = users.some(u => u.username === 'admin');
        
        if (!adminExists) {
            // Создаём администратора
            const admin = {
                id: 1,
                fullname: 'Администратор системы',
                username: 'admin',
                password: this.hashPassword('admin123'), // Пароль: admin123
                role: 'admin',
                class: '7Б',
                points: 0,
                level: 10,
                avatar: 'АД',
                active: true,
                registeredAt: new Date().toISOString(),
                lastLogin: null
            };
            
            users.push(admin);
            localStorage.setItem('leo_users', JSON.stringify(users));
            console.log('✅ Администратор создан (логин: admin, пароль: admin123)');
        }
        
        console.log('✅ База данных инициализирована');
    }
    
    // Правильное хэширование пароля
    hashPassword(password) {
        // Простое хэширование для демонстрации
        // В реальном проекте используйте bcrypt или аналоги
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return 'leo_' + Math.abs(hash).toString(36) + '_' + password.length;
    }
    
    setupEventListeners() {
        // Вход
        document.getElementById('login-submit')?.addEventListener('click', () => this.login());
        
        // Регистрация
        document.getElementById('register-submit')?.addEventListener('click', () => this.register());
        
        // Админ
        document.getElementById('admin-submit')?.addEventListener('click', () => this.adminLogin());
        
        // Enter для отправки форм
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeForm = document.querySelector('.auth-form.active');
                if (activeForm) {
                    if (activeForm.id === 'login-form') {
                        this.login();
                    } else if (activeForm.id === 'register-form') {
                        this.register();
                    } else if (activeForm.id === 'admin-form') {
                        this.adminLogin();
                    }
                }
            }
        });
    }
    
    login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const remember = document.getElementById('remember-me')?.checked;
        
        // Валидация
        if (!username || !password) {
            this.showMessage('Заполните все поля', 'error');
            return;
        }
        
        // Получаем пользователей из базы
        const users = JSON.parse(localStorage.getItem('leo_users'));
        
        // Ищем пользователя
        const user = users.find(u => u.username === username);
        
        if (!user) {
            this.showMessage('Пользователь не найден', 'error');
            return;
        }
        
        // Проверяем пароль
        if (user.password !== this.hashPassword(password)) {
            this.showMessage('Неверный пароль', 'error');
            return;
        }
        
        // Проверяем активность аккаунта
        if (!user.active) {
            this.showMessage('Аккаунт не активирован. Обратитесь к администратору.', 'warning');
            return;
        }
        
        // Обновляем время последнего входа
        user.lastLogin = new Date().toISOString();
        localStorage.setItem('leo_users', JSON.stringify(users));
        
        // Сохраняем сессию
        if (remember) {
            localStorage.setItem('leo_session', JSON.stringify(user));
        } else {
            sessionStorage.setItem('leo_session', JSON.stringify(user));
        }
        
        this.showMessage('Вход выполнен успешно!', 'success');
        
        // Логируем вход
        this.logActivity(`${user.fullname} вошёл в систему`, 'login');
        
        // Перенаправляем через 1 секунду
        setTimeout(() => {
            window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
        }, 1000);
    }
    
    register() {
        const fullname = document.getElementById('reg-fullname').value.trim();
        const username = document.getElementById('reg-username').value.trim().toLowerCase();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;
        
        // Валидация
        if (!fullname || !username || !password || !confirmPassword) {
            this.showMessage('Заполните все поля', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Пароли не совпадают', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        if (!/^[a-z0-9_]+$/.test(username)) {
            this.showMessage('Логин может содержать только латинские буквы, цифры и нижнее подчёркивание', 'error');
            return;
        }
        
        // Проверка уникальности логина
        const users = JSON.parse(localStorage.getItem('leo_users'));
        if (users.some(u => u.username === username)) {
            this.showMessage('Этот логин уже занят', 'error');
            return;
        }
        
        // Создаём нового пользователя
        const newUser = {
            id: Date.now(),
            fullname: fullname,
            username: username,
            password: this.hashPassword(password),
            role: 'student',
            class: '7Б',
            points: 0,
            level: 1,
            avatar: this.generateAvatar(fullname),
            active: false, // Требует активации админом
            registeredAt: new Date().toISOString(),
            lastLogin: null,
            achievements: [],
            gameStats: {
                gamesPlayed: 0,
                totalScore: 0,
                averageScore: 0
            }
        };
        
        users.push(newUser);
        localStorage.setItem('leo_users', JSON.stringify(users));
        
        this.showMessage('Регистрация успешна! Обратитесь к администратору для активации аккаунта.', 'success');
        
        // Логируем регистрацию
        this.logActivity(`Зарегистрирован новый пользователь: ${fullname} (${username})`, 'register');
        
        // Очищаем форму
        setTimeout(() => {
            document.getElementById('reg-fullname').value = '';
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-password-confirm').value = '';
            
            // Переключаем на вкладку входа
            document.getElementById('login-tab').click();
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = '';
        }, 2000);
    }
    
    adminLogin() {
        const key = document.getElementById('admin-key').value.trim();
        const password = document.getElementById('admin-password').value;
        
        // Получаем администратора
        const users = JSON.parse(localStorage.getItem('leo_users'));
        const admin = users.find(u => u.username === 'admin' && u.password === this.hashPassword(password));
        
        // Проверяем ключ и пароль
        if (admin && key === 'LEO7B_ADMIN_KEY_2024') {
            // Сохраняем сессию
            sessionStorage.setItem('leo_session', JSON.stringify(admin));
            
            this.showMessage('Доступ администратора предоставлен', 'success');
            
            // Логируем вход администратора
            this.logActivity('Администратор вошёл в систему', 'admin');
            
            // Перенаправляем
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            this.showMessage('Неверные административные данные', 'error');
        }
    }
    
    generateAvatar(fullname) {
        const names = fullname.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return fullname.substring(0, 2).toUpperCase();
    }
    
    showMessage(text, type = 'info') {
        const messageBox = document.getElementById('auth-message');
        messageBox.textContent = text;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
        
        // Автоскрытие через 5 секунд
        setTimeout(() => {
            messageBox.style.opacity = '0';
            setTimeout(() => {
                messageBox.style.display = 'none';
                messageBox.style.opacity = '1';
            }, 300);
        }, 5000);
    }
    
    logActivity(action, type) {
        const logs = JSON.parse(localStorage.getItem('leo_system_logs') || '[]');
        
        logs.push({
            timestamp: new Date().toISOString(),
            action: action,
            type: type,
            ip: 'local'
        });
        
        // Храним только последние 100 записей
        if (logs.length > 100) {
            logs.shift();
        }
        
        localStorage.setItem('leo_system_logs', JSON.stringify(logs));
    }
}

// Инициализация при загрузке страницы
let authSystem = null;
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem();
    
    // Показываем подсказку для администратора
    console.log('Администратор: login: admin, password: admin123');
    console.log('Админ ключ: LEO7B_ADMIN_KEY_2024');
});
