// auth-system.js - РАБОЧАЯ СИСТЕМА АВТОРИЗАЦИИ
class AuthSystem {
    constructor() {
        console.log('Инициализация AuthSystem...');
        this.initDatabase();
        this.setupEventListeners();
    }
    
    // ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ
    initDatabase() {
        console.log('Инициализация базы данных...');
        
        // 1. Инициализируем пользователей
        if (!localStorage.getItem('leo_users')) {
            localStorage.setItem('leo_users', JSON.stringify([]));
            console.log('Создана пустая база пользователей');
        }
        
        // 2. Создаём администратора по умолчанию
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
            console.log('Создан администратор по умолчанию');
        }
        
        // 3. Инициализируем логи
        if (!localStorage.getItem('leo_logs')) {
            localStorage.setItem('leo_logs', JSON.stringify([]));
        }
        
        console.log('База данных готова. Пользователей:', users.length);
    }
    
    // ХЭШИРОВАНИЕ ПАРОЛЯ
    hashPassword(password) {
        // Простое хэширование для демо
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36) + 'leo';
    }
    
    // НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ
    setupEventListeners() {
        console.log('Настройка обработчиков событий...');
        
        // 1. КНОПКА ВХОДА
        const loginBtn = document.getElementById('login-submit');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Нажата кнопка входа');
                this.login();
            });
        }
        
        // 2. КНОПКА РЕГИСТРАЦИИ
        const registerBtn = document.getElementById('register-submit');
        if (registerBtn) {
            registerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Нажата кнопка регистрации');
                this.register();
            });
        }
        
        // 3. КНОПКА АДМИНА
        const adminBtn = document.getElementById('admin-submit');
        if (adminBtn) {
            adminBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Нажата кнопка админа');
                this.adminLogin();
            });
        }
        
        console.log('Обработчики событий настроены');
    }
    
    // ВХОД В СИСТЕМУ
    login() {
        console.log('Запуск процесса входа...');
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        console.log('Логин:', username, 'Пароль:', password ? '***' : 'пустой');
        
        // ВАЛИДАЦИЯ
        if (!username || !password) {
            this.showMessage('Заполните все поля', 'error', 'auth-message');
            return;
        }
        
        // ПОИСК ПОЛЬЗОВАТЕЛЯ
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const hashedPassword = this.hashPassword(password);
        const user = users.find(u => u.username === username && u.password === hashedPassword);
        
        console.log('Найден пользователь:', user ? 'да' : 'нет');
        
        if (user) {
            if (user.active) {
                // ОБНОВЛЯЕМ ВРЕМЯ ВХОДА
                user.lastLogin = new Date().toISOString();
                
                // СОХРАНЯЕМ ИЗМЕНЕНИЯ
                const userIndex = users.findIndex(u => u.id === user.id);
                if (userIndex !== -1) {
                    users[userIndex] = user;
                    localStorage.setItem('leo_users', JSON.stringify(users));
                }
                
                // СОХРАНЯЕМ СЕССИЮ
                localStorage.setItem('leo_session', JSON.stringify(user));
                console.log('Сессия сохранена для пользователя:', user.username);
                
                // ПОКАЗЫВАЕМ УСПЕХ
                this.showMessage('Вход выполнен успешно! Перенаправление...', 'success', 'auth-message');
                
                // ЛОГИРУЕМ
                this.logActivity(`${user.fullname} вошёл в систему`, 'login');
                
                // ПЕРЕНАПРАВЛЯЕМ
                setTimeout(() => {
                    const redirectTo = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
                    console.log('Перенаправление на:', redirectTo);
                    window.location.href = redirectTo;
                }, 1000);
                
            } else {
                this.showMessage('Аккаунт не активирован. Обратитесь к администратору.', 'error', 'auth-message');
            }
        } else {
            this.showMessage('Неверный логин или пароль', 'error', 'auth-message');
        }
    }
    
    // РЕГИСТРАЦИЯ
    register() {
        console.log('Запуск процесса регистрации...');
        
        const fullname = document.getElementById('reg-fullname').value.trim();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;
        
        console.log('Регистрация:', { fullname, username });
        
        // ВАЛИДАЦИЯ
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
        
        // ПРОВЕРКА УНИКАЛЬНОСТИ
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        if (users.some(u => u.username === username)) {
            this.showMessage('Этот логин уже занят', 'error', 'reg-message');
            return;
        }
        
        // СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ
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
            active: false, // Требует активации
            registeredAt: new Date().toISOString(),
            lastLogin: null,
            gameStats: {
                totalGames: 0,
                totalScore: 0
            }
        };
        
        // СОХРАНЕНИЕ
        users.push(newUser);
        localStorage.setItem('leo_users', JSON.stringify(users));
        console.log('Пользователь зарегистрирован:', newUser.username);
        
        // УСПЕШНОЕ СООБЩЕНИЕ
        this.showMessage('Регистрация успешна! Обратитесь к администратору для активации.', 'success', 'reg-message');
        
        // ЛОГИРОВАНИЕ
        this.logActivity(`Зарегистрирован новый пользователь: ${fullname}`, 'register');
        
        // ОЧИСТКА ФОРМЫ И ПЕРЕКЛЮЧЕНИЕ
        setTimeout(() => {
            document.getElementById('reg-fullname').value = '';
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-password-confirm').value = '';
            
            // Переключаем на вкладку входа
            document.getElementById('login-tab').click();
        }, 2000);
    }
    
    // ВХОД АДМИНИСТРАТОРА
    adminLogin() {
        console.log('Запуск входа администратора...');
        
        const key = document.getElementById('admin-key').value.trim();
        const password = document.getElementById('admin-password').value;
        
        // ПРОВЕРКА КЛЮЧА (по умолчанию)
        if (key !== 'LEO7B2024') {
            this.showMessage('Неверный административный ключ', 'error', 'admin-message');
            return;
        }
        
        // ПОИСК АДМИНА
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const hashedPassword = this.hashPassword(password);
        const admin = users.find(u => u.username === 'admin' && u.password === hashedPassword);
        
        if (admin) {
            // СОХРАНЯЕМ СЕССИЮ
            localStorage.setItem('leo_session', JSON.stringify(admin));
            console.log('Администратор вошёл в систему');
            
            // ПОКАЗЫВАЕМ УСПЕХ
            this.showMessage('Доступ предоставлен. Перенаправление...', 'success', 'admin-message');
            
            // ЛОГИРУЕМ
            this.logActivity('Вход администратора в систему', 'admin');
            
            // ПЕРЕНАПРАВЛЯЕМ
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            this.showMessage('Неверный пароль администратора', 'error', 'admin-message');
        }
    }
    
    // ГЕНЕРАЦИЯ АВАТАРА
    generateAvatar(fullname) {
        const names = fullname.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return fullname.substring(0, 2).toUpperCase();
    }
    
    // ПОКАЗ СООБЩЕНИЙ
    showMessage(text, type = 'info', elementId = 'auth-message') {
        const messageBox = document.getElementById(elementId);
        if (!messageBox) {
            console.error('Элемент сообщения не найден:', elementId);
            return;
        }
        
        messageBox.textContent = text;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
        
        console.log('Показано сообщение:', type, text);
        
        // АВТОСКРЫТИЕ
        setTimeout(() => {
            messageBox.style.opacity = '0';
            setTimeout(() => {
                messageBox.style.display = 'none';
                messageBox.style.opacity = '1';
            }, 300);
        }, 5000);
    }
    
    // ЛОГИРОВАНИЕ
    logActivity(action, type) {
        const logs = JSON.parse(localStorage.getItem('leo_logs') || '[]');
        
        logs.push({
            timestamp: new Date().toISOString(),
            action: action,
            type: type,
            ip: 'local'
        });
        
        // Храним только последние 100 записей
        if (logs.length > 100) logs.shift();
        
        localStorage.setItem('leo_logs', JSON.stringify(logs));
        console.log('Записано действие в лог:', action);
    }
    
    // ВЫХОД
    logout() {
        localStorage.removeItem('leo_session');
        sessionStorage.removeItem('leo_session');
        window.location.href = 'index.html';
    }
}

// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, запускаем AuthSystem...');
    window.authSystem = new AuthSystem();
});
