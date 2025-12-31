// auth-system.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
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
        
        // Проверяем существование администратора
        const users = JSON.parse(localStorage.getItem('leo_users'));
        const adminExists = users.some(u => u.username === 'admin');
        
        if (!adminExists) {
            const admin = {
                id: 1,
                fullname: 'Администратор системы',
                username: 'admin',
                password: this.hashPassword('admin123'), // Пароль: admin123
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
        
        console.log('✅ База данных инициализирована');
    }
    
    // ФИКС: Исправляем хэширование пароля
    hashPassword(password) {
        // Простое хэширование, которое будет работать одинаково при входе и регистрации
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        // Всегда возвращаем одинаковый результат для одного и того же пароля
        return 'leo_' + Math.abs(hash).toString(36);
    }
    
    setupEventListeners() {
        // Вход
        document.getElementById('login-submit')?.addEventListener('click', () => this.login());
        
        // Регистрация
        document.getElementById('register-submit')?.addEventListener('click', () => this.register());
        
        // Админ вход
        document.getElementById('admin-submit')?.addEventListener('click', () => this.adminLogin());
    }
    
    checkSession() {
        // Проверяем активную сессию
        const session = localStorage.getItem('leo_session');
        
        if (session) {
            try {
                const user = JSON.parse(session);
                if (user && user.active) {
                    // Автоматический редирект с небольшой задержкой
                    setTimeout(() => {
                        window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
                    }, 100);
                }
            } catch (e) {
                console.error('Ошибка чтения сессии:', e);
                // Удаляем битую сессию
                localStorage.removeItem('leo_session');
            }
        }
    }
    
    login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        console.log('Попытка входа:', username); // Для отладки
        
        if (!username || !password) {
            this.showMessage('Заполните все поля', 'error', 'auth-message');
            return;
        }
        
        // Получаем пользователя из базы
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const hashedPassword = this.hashPassword(password);
        
        console.log('Ищем пользователя:', username);
        console.log('Введенный пароль (хэш):', hashedPassword);
        console.log('Все пользователи:', users);
        
        const user = users.find(u => u.username === username);
        
        if (user) {
            console.log('Найден пользователь:', user.username);
            console.log('Пароль в базе:', user.password);
            console.log('Сравниваем:', hashedPassword, '===', user.password);
            
            if (user.password === hashedPassword) {
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
                    
                    this.showMessage('Вход выполнен успешно! Перенаправляем...', 'success', 'auth-message');
                    
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
                console.log('Пароли не совпадают');
                this.showMessage('Неверный пароль', 'error', 'auth-message');
            }
        } else {
            console.log('Пользователь не найден');
            this.showMessage('Пользователь не найден', 'error', 'auth-message');
        }
    }
    
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
            password: this.hashPassword(password), // Тот же метод хэширования
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
        
        console.log('Создан новый пользователь:', newUser);
        
        // Сохраняем пользователя
        users.push(newUser);
        localStorage.setItem('leo_users', JSON.stringify(users));
        
        this.showMessage('Регистрация успешна! Обратитесь к администратору для активации.', 'success', 'reg-message');
        
        // Логируем регистрацию
        this.logActivity(`Зарегистрирован новый пользователь: ${fullname}`, 'register');
        
        // Очищаем форму и переключаем на вкладку входа
        setTimeout(() => {
            document.getElementById('reg-fullname').value = '';
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-password-confirm').value = '';
            
            // Переключаем на вкладку входа
            document.getElementById('login-tab').click();
        }, 2000);
    }
    
    adminLogin() {
        const key = document.getElementById('admin-key').value.trim();
        const password = document.getElementById('admin-password').value;
        
        console.log('Попытка входа администратора:', key);
        
        // Проверяем административный ключ
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
            
            this.showMessage('Доступ предоставлен. Перенаправляем...', 'success', 'admin-message');
            
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
    
    generateAvatar(fullname) {
        const names = fullname.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return fullname.substring(0, 2).toUpperCase();
    }
    
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
    
    logActivity(action, type) {
        const logs = JSON.parse(localStorage.getItem('leo_logs') || '[]');
        
        logs.push({
            timestamp: new Date().toISOString(),
            action: action,
            type: type
        });
        
        // Сохраняем только последние 100 записей
        if (logs.length > 100) {
            logs.shift();
        }
        
        localStorage.setItem('leo_logs', JSON.stringify(logs));
    }
    
    // Статический метод для выхода из системы
    static logout() {
        localStorage.removeItem('leo_session');
        window.location.href = 'index.html';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
    
    // Добавляем обработчики для демо-входа (для тестирования)
    if (document.getElementById('demo-login-btn')) {
        document.getElementById('demo-login-btn').addEventListener('click', () => {
            document.getElementById('login-username').value = 'admin';
            document.getElementById('login-password').value = 'admin123';
            window.authSystem.login();
        });
    }
});
