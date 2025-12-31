// auth-system.js - ПОЛНОСТЬЮ РАБОЧАЯ СИСТЕМА АВТОРИЗАЦИИ
class AuthSystem {
    constructor() {
        this.initDatabase();
        this.setupEventListeners();
        this.checkSession();
    }
    
    // Инициализация базы данных
    initDatabase() {
        // Инициализируем базу пользователей
        if (!localStorage.getItem('leo_users')) {
            localStorage.setItem('leo_users', JSON.stringify([]));
        }
        
        // Создаём администратора по умолчанию (скрытый)
        const users = JSON.parse(localStorage.getItem('leo_users'));
        const adminExists = users.some(u => u.username === 'admin');
        
        if (!adminExists) {
            const admin = {
                id: 1,
                fullname: 'Администратор системы',
                username: 'admin',
                password: this.hashPassword('admin123'),
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
        }
        
        // Инициализация логов
        if (!localStorage.getItem('leo_logs')) {
            localStorage.setItem('leo_logs', JSON.stringify([]));
        }
    }
    
    // Хэширование пароля
    hashPassword(password) {
        // Простое хэширование для демонстрации
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Вход
        document.getElementById('login-submit')?.addEventListener('click', () => this.login());
        
        // Регистрация
        document.getElementById('register-submit')?.addEventListener('click', () => this.register());
        
        // Админ вход
        document.getElementById('admin-submit')?.addEventListener('click', () => this.adminLogin());
    }
    
    // Проверка активной сессии
    checkSession() {
        const session = localStorage.getItem('leo_session') || sessionStorage.getItem('leo_session');
        if (session) {
            try {
                const user = JSON.parse(session);
                if (user && user.active) {
                    // Автоматический редирект на соответствующую страницу
                    setTimeout(() => {
                        window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
                    }, 500);
                }
            } catch (e) {
                console.log('Ошибка чтения сессии:', e);
            }
        }
    }
    
    // Вход в систему
    login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            this.showMessage('Заполните все поля', 'error', 'auth-message');
            return;
        }
        
        // Получаем пользователя из базы
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const hashedPassword = this.hashPassword(password);
        const user = users.find(u => u.username === username && u.password === hashedPassword);
        
        if (user) {
            if (user.active) {
                // Обновляем время последнего входа
                user.lastLogin = new Date().toISOString();
                
                // Сохраняем изменения
                const userIndex = users.findIndex(u => u.id === user.id);
                if (userIndex !== -1) {
                    users[userIndex] = user;
                    localStorage.setItem('leo_users', JSON.stringify(users));
                }
                
                // Сохраняем сессию
                localStorage.setItem('leo_session', JSON.stringify(user));
                
                this.showMessage('Вход выполнен успешно!', 'success', 'auth-message');
                
                // Логируем вход
                this.logActivity(`${user.fullname} вошёл в систему`, 'login');
                
                // Перенаправляем через 1 секунду
                setTimeout(() => {
                    window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
                }, 1000);
                
            } else {
                this.showMessage('Аккаунт не активирован. Обратитесь к администратору.', 'error', 'auth-message');
            }
        } else {
            this.showMessage('Неверный логин или пароль', 'error', 'auth-message');
        }
    }
    
    // Регистрация нового пользователя
    register() {
        const fullname = document.getElementById('reg-fullname').value.trim();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;
        
        // Валидация
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
        
        // Проверка уникальности логина
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        if (users.some(u => u.username === username)) {
            this.showMessage('Этот логин уже занят', 'error', 'reg-message');
            return;
        }
        
        // Создание нового пользователя
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
            active: false, // Требует активации администратором
            registeredAt: new Date().toISOString(),
            lastLogin: null,
            gameStats: {
                totalGames: 0,
                totalScore: 0
            }
        };
        
        // Сохраняем пользователя
        users.push(newUser);
        localStorage.setItem('leo_users', JSON.stringify(users));
        
        this.showMessage('Регистрация успешна! Обратитесь к администратору для активации аккаунта.', 'success', 'reg-message');
        
        // Логируем регистрацию
        this.logActivity(`Зарегистрирован новый пользователь: ${fullname}`, 'register');
        
        // Очищаем форму
        setTimeout(() => {
            document.getElementById('reg-fullname').value = '';
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-password-confirm').value = '';
            
            // Переключаем на вкладку входа
            document.getElementById('login-tab').click();
        }, 2000);
    }
    
    // Вход администратора
    adminLogin() {
        const key = document.getElementById('admin-key').value.trim();
        const password = document.getElementById('admin-password').value;
        
        // Проверяем административный ключ (по умолчанию)
        if (key !== 'LEO7B2024') {
            this.showMessage('Неверный административный ключ', 'error', 'admin-message');
            return;
        }
        
        // Ищем администратора
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const hashedPassword = this.hashPassword(password);
        const admin = users.find(u => u.username === 'admin' && u.password === hashedPassword);
        
        if (admin) {
            // Сохраняем сессию
            localStorage.setItem('leo_session', JSON.stringify(admin));
            
            this.showMessage('Доступ предоставлен', 'success', 'admin-message');
            
            // Логируем вход администратора
            this.logActivity('Вход администратора в систему', 'admin');
            
            // Перенаправляем на админ-панель
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            this.showMessage('Неверный пароль администратора', 'error', 'admin-message');
        }
    }
    
    // Генерация аватара из инициалов
    generateAvatar(fullname) {
        const names = fullname.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return fullname.substring(0, 2).toUpperCase();
    }
    
    // Показ сообщений
    showMessage(text, type = 'info', elementId = 'auth-message') {
        const messageBox = document.getElementById(elementId);
        if (!messageBox) return;
        
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
    
    // Логирование действий
    logActivity(action, type) {
        const logs = JSON.parse(localStorage.getItem('leo_logs') || '[]');
        
        logs.push({
            timestamp: new Date().toISOString(),
            action: action,
            type: type,
            ip: 'local'
        });
        
        // Сохраняем только последние 100 записей
        if (logs.length > 100) {
            logs.shift();
        }
        
        localStorage.setItem('leo_logs', JSON.stringify(logs));
    }
    
    // Выход из системы
    logout() {
        localStorage.removeItem('leo_session');
        sessionStorage.removeItem('leo_session');
        window.location.href = 'index.html';
    }
}

// Инициализация при загрузке страницы
window.authSystem = null;
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
    
    // Также делаем функции глобально доступными для onclick
    window.loginUser = () => window.authSystem.login();
    window.registerUser = () => window.authSystem.register();
    window.loginAdmin = () => window.authSystem.adminLogin();
});
