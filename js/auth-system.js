// auth-system.js - ИСПРАВЛЕННАЯ СИСТЕМА АВТОРИЗАЦИИ
class AuthSystem {
    constructor() {
        this.initDatabase();
        this.bindEvents();
        this.checkSession();
    }
    
    initDatabase() {
        console.log('Инициализация базы данных...');
        
        // Создаем базу пользователей если её нет
        if (!localStorage.getItem('leo_users')) {
            localStorage.setItem('leo_users', JSON.stringify([]));
            console.log('Создана пустая база пользователей');
        }
        
        // Создаём администратора по умолчанию
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
                points: 1000,
                level: 10,
                avatar: 'АД',
                active: true,
                registeredAt: new Date().toISOString(),
                lastLogin: null
            };
            
            users.push(admin);
            localStorage.setItem('leo_users', JSON.stringify(users));
            console.log('✅ Создан администратор по умолчанию');
        }
        
        // Инициализация логов
        if (!localStorage.getItem('leo_system_logs')) {
            localStorage.setItem('leo_system_logs', JSON.stringify([]));
        }
    }
    
    hashPassword(password) {
        // Улучшенное хэширование
        let hash = 5381;
        for (let i = 0; i < password.length; i++) {
            hash = (hash * 33) ^ password.charCodeAt(i);
        }
        return (hash >>> 0).toString(36) + 'leo' + Date.now().toString(36).slice(0, 4);
    }
    
    bindEvents() {
        console.log('Привязка событий...');
        
        // Вход
        const loginBtn = document.getElementById('loginSubmit');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.login();
            });
            console.log('✅ Кнопка входа привязана');
        }
        
        // Регистрация
        const registerBtn = document.getElementById('registerSubmit');
        if (registerBtn) {
            registerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.register();
            });
            console.log('✅ Кнопка регистрации привязана');
        }
        
        // Админ
        const adminBtn = document.getElementById('adminSubmit');
        if (adminBtn) {
            adminBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.adminLogin();
            });
            console.log('✅ Кнопка админа привязана');
        }
        
        // Enter для форм
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeForm = document.querySelector('.auth-form.active');
                if (!activeForm) return;
                
                if (activeForm.id === 'loginForm') {
                    this.login();
                } else if (activeForm.id === 'registerForm') {
                    this.register();
                } else if (activeForm.id === 'adminForm') {
                    this.adminLogin();
                }
            }
        });
        
        console.log('✅ Все события привязаны');
    }
    
    checkSession() {
        const session = localStorage.getItem('leo_session') || sessionStorage.getItem('leo_session');
        if (session) {
            try {
                const user = JSON.parse(session);
                if (user && user.active) {
                    // Автоматический редирект если сессия активна
                    setTimeout(() => {
                        window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
                    }, 100);
                }
            } catch(e) {
                console.log('Ошибка проверки сессии:', e);
            }
        }
    }
    
    login() {
        console.log('Попытка входа...');
        
        const username = document.getElementById('loginUsername')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;
        
        if (!username || !password) {
            this.showMessage('Заполните все поля', 'error');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const hashedPassword = this.hashPassword(password);
        const user = users.find(u => u.username === username && u.password === hashedPassword);
        
        if (user) {
            if (user.active) {
                // Обновляем время последнего входа
                user.lastLogin = new Date().toISOString();
                localStorage.setItem('leo_users', JSON.stringify(users));
                
                // Сохраняем сессию
                const remember = document.getElementById('rememberMe')?.checked;
                if (remember) {
                    localStorage.setItem('leo_session', JSON.stringify(user));
                } else {
                    sessionStorage.setItem('leo_session', JSON.stringify(user));
                }
                
                this.showMessage('Вход выполнен успешно! Перенаправление...', 'success');
                
                // Логируем
                this.logActivity(`${user.fullname} вошёл в систему`, 'login');
                
                // Перенаправляем
                setTimeout(() => {
                    window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
                }, 1500);
                
            } else {
                this.showMessage('Аккаунт не активирован. Обратитесь к администратору.', 'warning');
            }
        } else {
            this.showMessage('Неверный логин или пароль', 'error');
        }
    }
    
    register() {
        console.log('Попытка регистрации...');
        
        const fullname = document.getElementById('regFullname')?.value.trim();
        const username = document.getElementById('regUsername')?.value.trim();
        const password = document.getElementById('regPassword')?.value;
        const confirmPassword = document.getElementById('regPasswordConfirm')?.value;
        
        // Валидация
        if (!fullname || !username || !password) {
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
        
        if (username.length < 3) {
            this.showMessage('Логин должен быть не менее 3 символов', 'error');
            return;
        }
        
        // Проверка уникальности логина
        const users = JSON.parse(localStorage.getItem('leo_users'));
        if (users.some(u => u.username === username)) {
            this.showMessage('Этот логин уже занят', 'error');
            return;
        }
        
        // Создаём пользователя
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
            lastLogin: null
        };
        
        users.push(newUser);
        localStorage.setItem('leo_users', JSON.stringify(users));
        
        this.showMessage('✅ Регистрация успешна! Обратитесь к администратору для активации.', 'success');
        
        // Логируем
        this.logActivity(`Зарегистрирован новый пользователь: ${fullname}`, 'register');
        
        // Очищаем форму
        document.getElementById('regFullname').value = '';
        document.getElementById('regUsername').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regPasswordConfirm').value = '';
        
        // Переключаем на вкладку входа через 2 секунды
        setTimeout(() => {
            document.getElementById('loginTab')?.click();
        }, 2000);
    }
    
    adminLogin() {
        console.log('Попытка входа админа...');
        
        const key = document.getElementById('adminKey')?.value.trim();
        const password = document.getElementById('adminPassword')?.value;
        
        if (!key || !password) {
            this.showMessage('Заполните все поля', 'error');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('leo_users'));
        const hashedPassword = this.hashPassword(password);
        const admin = users.find(u => u.username === 'admin' && u.password === hashedPassword);
        
        if (admin && key === '7B_LEO_ADMIN_2024') {
            sessionStorage.setItem('leo_session', JSON.stringify(admin));
            this.showMessage('✅ Доступ предоставлен. Перенаправление...', 'success');
            
            this.logActivity('Администратор вошёл в систему', 'admin');
            
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
        const messageBox = document.getElementById('authMessage');
        if (!messageBox) {
            console.error('Элемент для сообщений не найден');
            return;
        }
        
        messageBox.textContent = text;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
        messageBox.style.opacity = '1';
        
        // Автоскрытие через 5 секунд
        setTimeout(() => {
            messageBox.style.opacity = '0';
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 300);
        }, 5000);
        
        console.log(`Сообщение: ${text} (${type})`);
    }
    
    logActivity(action, type) {
        const logs = JSON.parse(localStorage.getItem('leo_system_logs') || '[]');
        
        logs.push({
            timestamp: new Date().toISOString(),
            action: action,
            type: type,
            ip: 'local'
        });
        
        if (logs.length > 100) {
            logs.shift();
        }
        
        localStorage.setItem('leo_system_logs', JSON.stringify(logs));
    }
}

// Запуск системы при загрузке страницы
let authSystem;
document.addEventListener('DOMContentLoaded', () => {
    console.log('Запуск AuthSystem...');
    authSystem = new AuthSystem();
    console.log('✅ AuthSystem запущен');
});

// Экспорт для глобального доступа
window.AuthSystem = AuthSystem;
