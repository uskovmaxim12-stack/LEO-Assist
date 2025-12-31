// auth-system.js - РАБОЧАЯ СИСТЕМА АВТОРИЗАЦИИ
class AuthSystem {
    constructor() {
        this.initDatabase();
        this.setupEventListeners();
        this.checkSession();
    }
    
    initDatabase() {
        console.log('🔧 Инициализация базы данных...');
        
        // Инициализация базы пользователей
        if (!localStorage.getItem('leo_users')) {
            localStorage.setItem('leo_users', JSON.stringify([]));
            console.log('✅ Создана база пользователей');
        }
        
        // Создаём администратора по умолчанию (только если нет)
        const users = JSON.parse(localStorage.getItem('leo_users'));
        const adminExists = users.some(u => u.username === 'admin');
        
        if (!adminExists) {
            const admin = {
                id: Date.now(),
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
                lastLogin: null,
                email: 'admin@leo-assist.ru'
            };
            
            users.push(admin);
            localStorage.setItem('leo_users', JSON.stringify(users));
            console.log('✅ Создан администратор по умолчанию');
        }
        
        // Логи системы
        if (!localStorage.getItem('leo_system_logs')) {
            localStorage.setItem('leo_system_logs', JSON.stringify([]));
        }
        
        // Загружаем логи
        this.loadLogs();
    }
    
    setupEventListeners() {
        console.log('🔧 Настройка обработчиков событий...');
        
        // Кнопка ВОЙТИ
        document.getElementById('loginBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.login();
        });
        
        // Кнопка РЕГИСТРАЦИЯ
        document.getElementById('registerBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.register();
        });
        
        // Кнопка АДМИН
        document.getElementById('adminBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.adminLogin();
        });
        
        // Enter для форм
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeForm = document.querySelector('.auth-form.active');
                if (activeForm.id === 'loginForm') {
                    this.login();
                } else if (activeForm.id === 'registerForm') {
                    this.register();
                } else if (activeForm.id === 'adminForm') {
                    this.adminLogin();
                }
            }
        });
        
        console.log('✅ Все обработчики настроены');
    }
    
    checkSession() {
        const session = localStorage.getItem('leo_session') || sessionStorage.getItem('leo_session');
        if (session) {
            try {
                const user = JSON.parse(session);
                if (user && user.active) {
                    // Автоматический редирект если есть активная сессия
                    setTimeout(() => {
                        window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
                    }, 500);
                }
            } catch (e) {
                console.error('Ошибка чтения сессии:', e);
            }
        }
    }
    
    hashPassword(password) {
        // Простое хэширование для демо (в реальном проекте используйте bcrypt)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36) + 'leo' + Date.now().toString(36);
    }
    
    login() {
        console.log('🔐 Попытка входа...');
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const remember = document.getElementById('rememberMe')?.checked;
        
        // Валидация
        if (!username || !password) {
            this.showMessage('Заполните все поля', 'error');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('leo_users'));
        const hashedPassword = this.hashPassword(password);
        
        console.log('🔍 Поиск пользователя:', username);
        
        // Ищем пользователя
        const user = users.find(u => u.username === username && u.password === hashedPassword);
        
        if (user) {
            console.log('✅ Пользователь найден:', user.fullname);
            
            if (user.active) {
                // Обновляем время последнего входа
                user.lastLogin = new Date().toISOString();
                localStorage.setItem('leo_users', JSON.stringify(users));
                
                // Сохраняем сессию
                if (remember) {
                    localStorage.setItem('leo_session', JSON.stringify(user));
                } else {
                    sessionStorage.setItem('leo_session', JSON.stringify(user));
                }
                
                this.showMessage('✅ Вход выполнен успешно!', 'success');
                this.logActivity(`${user.fullname} вошёл в систему`, 'login');
                
                // Перенаправление
                setTimeout(() => {
                    if (user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 1500);
                
            } else {
                this.showMessage('⚠️ Аккаунт не активирован. Обратитесь к администратору.', 'warning');
            }
        } else {
            console.log('❌ Пользователь не найден или неверный пароль');
            this.showMessage('❌ Неверный логин или пароль', 'error');
        }
    }
    
    register() {
        console.log('📝 Попытка регистрации...');
        
        const fullname = document.getElementById('registerFullName').value.trim();
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirm').value;
        const agreeTerms = document.getElementById('agreeTerms')?.checked;
        
        // Валидация
        if (!fullname || !username || !password || !confirmPassword) {
            this.showMessage('Заполните все поля', 'error');
            return;
        }
        
        if (!agreeTerms) {
            this.showMessage('Необходимо согласиться с правилами системы', 'error');
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
        
        const users = JSON.parse(localStorage.getItem('leo_users'));
        
        // Проверка уникальности логина
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
            },
            settings: {
                theme: 'dark',
                notifications: true
            }
        };
        
        users.push(newUser);
        localStorage.setItem('leo_users', JSON.stringify(users));
        
        console.log('✅ Пользователь зарегистрирован:', newUser);
        
        this.showMessage('✅ Регистрация успешна! Обратитесь к администратору для активации.', 'success');
        this.logActivity(`Зарегистрирован новый пользователь: ${fullname} (${username})`, 'register');
        
        // Очищаем форму
        document.getElementById('registerFullName').value = '';
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerConfirm').value = '';
        document.getElementById('agreeTerms').checked = false;
        
        // Переключаем на вкладку входа
        setTimeout(() => {
            document.getElementById('loginTab').click();
        }, 2000);
    }
    
    adminLogin() {
        console.log('🛡️ Попытка входа администратора...');
        
        const key = document.getElementById('adminKey').value.trim();
        const password = document.getElementById('adminPassword').value;
        
        // Проверка ключа администратора
        if (key !== '7B_LEO_ADMIN_2024') {
            this.showMessage('Неверный административный ключ', 'error');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('leo_users'));
        const admin = users.find(u => u.username === 'admin' && u.password === this.hashPassword(password));
        
        if (admin) {
            console.log('✅ Администратор найден');
            
            // Сохраняем сессию администратора
            sessionStorage.setItem('leo_session', JSON.stringify(admin));
            
            this.showMessage('✅ Доступ предоставлен. Перенаправление...', 'success');
            this.logActivity('Администратор вошёл в систему', 'admin');
            
            // Перенаправление в админ-панель
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
            
        } else {
            console.log('❌ Администратор не найден');
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
        const messageBox = document.getElementById('messageBox');
        if (!messageBox) return;
        
        // Очищаем предыдущие сообщения
        messageBox.innerHTML = '';
        
        // Создаём иконку в зависимости от типа
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        // Создаём сообщение
        messageBox.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${text}</span>
        `;
        
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'flex';
        messageBox.style.alignItems = 'center';
        messageBox.style.gap = '15px';
        
        // Автоскрытие
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
            ip: 'local',
            userAgent: navigator.userAgent
        });
        
        // Храним только последние 100 записей
        if (logs.length > 100) logs.shift();
        
        localStorage.setItem('leo_system_logs', JSON.stringify(logs));
        
        // Обновляем счётчик онлайн
        this.updateOnlineCount();
    }
    
    updateOnlineCount() {
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const activeUsers = users.filter(u => u.active).length;
        
        const onlineCount = document.getElementById('onlineCount');
        if (onlineCount) {
            onlineCount.textContent = activeUsers;
        }
    }
    
    loadLogs() {
        const logs = JSON.parse(localStorage.getItem('leo_system_logs') || '[]');
        console.log('📊 Загружено логов:', logs.length);
        
        // Обновляем счётчик онлайн при загрузке
        this.updateOnlineCount();
    }
    
    // Вспомогательные методы для тестирования
    testSystem() {
        console.log('🧪 Тестирование системы...');
        
        // Проверяем базу данных
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        console.log('👥 Пользователей в базе:', users.length);
        
        // Проверяем администратора
        const admin = users.find(u => u.username === 'admin');
        console.log('🛡️ Администратор:', admin ? '✅ найден' : '❌ не найден');
        
        // Проверяем демо-пользователя
        const demo = users.find(u => u.username === 'demo');
        if (!demo) {
            console.log('👤 Демо-пользователь не найден, создаём...');
            
            const demoUser = {
                id: Date.now(),
                fullname: 'Демо Пользователь',
                username: 'demo',
                password: this.hashPassword('demo123'),
                role: 'student',
                class: '7Б',
                points: 500,
                level: 3,
                avatar: 'ДП',
                active: true,
                registeredAt: new Date().toISOString(),
                lastLogin: null
            };
            
            users.push(demoUser);
            localStorage.setItem('leo_users', JSON.stringify(users));
            console.log('✅ Демо-пользователь создан');
        }
        
        console.log('✅ Тестирование завершено');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Инициализация LEO Assistant...');
    
    window.authSystem = new AuthSystem();
    
    // Запускаем тестирование системы
    setTimeout(() => {
        window.authSystem.testSystem();
    }, 1000);
    
    console.log('✅ LEO Assistant готов к работе');
});