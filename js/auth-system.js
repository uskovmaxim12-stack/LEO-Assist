// auth-system.js - РАБОЧАЯ СИСТЕМА АВТОРИЗАЦИИ
document.addEventListener('DOMContentLoaded', function() {
    // ===== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ =====
    function initDatabase() {
        // Инициализация базы пользователей
        if (!localStorage.getItem('leo_users')) {
            localStorage.setItem('leo_users', JSON.stringify([]));
            
            // Создаём администратора по умолчанию
            const admin = {
                id: 1,
                fullname: 'Администратор системы',
                username: 'admin',
                password: hashPassword('admin123'),
                role: 'admin',
                class: '7Б',
                points: 1000,
                level: 10,
                avatar: 'АД',
                active: true,
                registeredAt: new Date().toISOString(),
                lastLogin: null
            };
            
            localStorage.setItem('leo_users', JSON.stringify([admin]));
            console.log('✅ Создан администратор по умолчанию');
        }
        
        // Инициализация логов
        if (!localStorage.getItem('leo_logs')) {
            localStorage.setItem('leo_logs', JSON.stringify([]));
        }
        
        // Инициализация расписания
        if (!localStorage.getItem('leo_schedule')) {
            const schedule = {
                monday: [
                    { time: "13:10-13:50", subject: "История", room: "16 Каб" },
                    { time: "14:00-14:40", subject: "Разговоры о важном", room: "21 Каб" },
                    { time: "14:50-15:30", subject: "Биология", room: "21 Каб" },
                    { time: "15:40-16:20", subject: "Русский язык", room: "32 Каб" },
                    { time: "16:30-17:10", subject: "Труд", room: "6 Каб" },
                    { time: "17:15-17:55", subject: "Труд", room: "6 Каб" },
                    { time: "18:00-18:40", subject: "Литература", room: "32 Каб" }
                ],
                tuesday: [
                    { time: "13:10-13:50", subject: "Информатика-пл", room: "42 Каб" },
                    { time: "14:00-14:40", subject: "История", room: "16 Каб" },
                    { time: "14:50-15:30", subject: "ИЗО", room: "6 Каб" },
                    { time: "15:40-16:20", subject: "Алгебра", room: "34 Каб" },
                    { time: "16:30-17:10", subject: "Русский язык", room: "32 Каб" },
                    { time: "17:15-17:55", subject: "Физ-ра", room: "СЗ" },
                    { time: "18:00-18:40", subject: "Геометрия", room: "34 Каб" }
                ],
                wednesday: [
                    { time: "13:10-13:50", subject: "Физика", room: "35 Каб" },
                    { time: "14:00-14:40", subject: "История", room: "16 Каб" },
                    { time: "14:50-15:30", subject: "Физ-ра", room: "СЗ" },
                    { time: "15:40-16:20", subject: "Русский язык", room: "32 Каб" },
                    { time: "16:30-17:10", subject: "Физика", room: "35 Каб" },
                    { time: "17:15-17:55", subject: "География", room: "22 Каб" },
                    { time: "18:00-18:40", subject: "Русский язык-пл", room: "32 Каб" }
                ],
                thursday: [
                    { time: "13:10-13:50", subject: "Алгебра", room: "34 Каб" },
                    { time: "14:00-14:40", subject: "Вероятность и Статистика", room: "34 Каб" },
                    { time: "14:50-15:30", subject: "Английский язык", room: "12 Каб" },
                    { time: "15:40-16:20", subject: "География", room: "22 Каб" },
                    { time: "16:30-17:10", subject: "Русский язык", room: "32 Каб" },
                    { time: "17:15-17:55", subject: "Литература", room: "32 Каб" },
                    { time: "18:00-18:40", subject: "Физ-ра", room: "СЗ" }
                ],
                friday: [
                    { time: "13:10-13:50", subject: "Алгебра", room: "34 Каб" },
                    { time: "14:00-14:40", subject: "Английский язык/Информатика", room: "12 / 42" },
                    { time: "14:50-15:30", subject: "Английский язык", room: "12 Каб" },
                    { time: "15:40-16:20", subject: "Геометрия", room: "34 Каб" },
                    { time: "16:30-17:10", subject: "Биология", room: "21 Каб" },
                    { time: "17:15-17:55", subject: "Информатика/Английский язык", room: "42 / 12" },
                    { time: "18:00-18:40", subject: "Математика-ВД", room: "34 Каб" }
                ],
                saturday: [
                    { time: "12:20-13:00", subject: "Музыка", room: "АЗ" },
                    { time: "13:10-13:50", subject: "Математика-пл", room: "34 Каб" },
                    { time: "14:00-14:40", subject: "Химия", room: "33 Каб" },
                    { time: "14:50-15:30", subject: "Физика", room: "35 Каб" },
                    { time: "15:40-16:20", subject: "Математика-ВД", room: "34 Каб" },
                    { time: "16:30-17:10", subject: "Физика-пл", room: "35 Каб" }
                ]
            };
            localStorage.setItem('leo_schedule', JSON.stringify(schedule));
        }
        
        console.log('✅ База данных инициализирована');
    }
    
    // ===== ХЭШИРОВАНИЕ ПАРОЛЯ =====
    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36) + '_leo';
    }
    
    // ===== ПРОВЕРКА СЕССИИ =====
    function checkSession() {
        const session = localStorage.getItem('leo_session');
        
        if (session) {
            try {
                const user = JSON.parse(session);
                console.log('🔍 Найдена активная сессия:', user.username);
                
                if (user && user.active) {
                    console.log('✅ Сессия активна, перенаправляю...');
                    // НЕМЕДЛЕННЫЙ редирект
                    if (user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                    return true;
                }
            } catch (e) {
                console.error('❌ Ошибка чтения сессии:', e);
                localStorage.removeItem('leo_session');
            }
        }
        return false;
    }
    
    // ===== ПОКАЗ СООБЩЕНИЯ =====
    function showMessage(text, type = 'info') {
        const messageBox = document.getElementById('auth-message');
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
    
    // ===== ВХОД В СИСТЕМУ =====
    function login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            showMessage('Заполните все поля', 'error');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const hashedPassword = hashPassword(password);
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
                
                showMessage('Вход выполнен успешно! Перенаправление...', 'success');
                
                // Немедленный редирект
                setTimeout(() => {
                    if (user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 500);
                
            } else {
                showMessage('Аккаунт не активирован. Обратитесь к администратору.', 'warning');
            }
        } else {
            showMessage('Неверный логин или пароль', 'error');
        }
    }
    
    // ===== РЕГИСТРАЦИЯ =====
    function register() {
        const fullname = document.getElementById('reg-fullname').value.trim();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;
        
        // Валидация
        if (!fullname || !username || !password || !confirmPassword) {
            showMessage('Заполните все поля', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Пароли не совпадают', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        // Проверка уникальности логина
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        if (users.some(u => u.username === username)) {
            showMessage('Этот логин уже занят', 'error');
            return;
        }
        
        // Генерация аватара
        function generateAvatar(name) {
            const names = name.split(' ');
            if (names.length >= 2) {
                return (names[0][0] + names[1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        }
        
        // Создание нового пользователя
        const newUser = {
            id: Date.now(),
            fullname: fullname,
            username: username,
            password: hashPassword(password),
            role: 'student',
            class: '7Б',
            points: 0,
            level: 1,
            avatar: generateAvatar(fullname),
            active: false, // Требует активации администратором
            registeredAt: new Date().toISOString(),
            lastLogin: null
        };
        
        // Сохраняем пользователя
        users.push(newUser);
        localStorage.setItem('leo_users', JSON.stringify(users));
        
        showMessage('Регистрация успешна! Обратитесь к администратору для активации.', 'success');
        
        // Очищаем форму и переключаем на вкладку входа
        setTimeout(() => {
            document.getElementById('reg-fullname').value = '';
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-password-confirm').value = '';
            document.getElementById('login-tab').click();
        }, 2000);
    }
    
    // ===== ВХОД АДМИНИСТРАТОРА =====
    function adminLogin() {
        const key = document.getElementById('admin-key').value.trim();
        const password = document.getElementById('admin-password').value;
        
        if (key !== 'LEO7B2024') {
            showMessage('Неверный административный ключ', 'error');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const hashedPassword = hashPassword(password);
        const admin = users.find(u => u.username === 'admin' && u.password === hashedPassword);
        
        if (admin) {
            // Сохраняем сессию
            localStorage.setItem('leo_session', JSON.stringify(admin));
            
            showMessage('Доступ предоставлен. Перенаправление...', 'success');
            
            // Немедленный редирект
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 500);
        } else {
            showMessage('Неверный пароль администратора', 'error');
        }
    }
    
    // ===== НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ =====
    function setupEventListeners() {
        // Вход
        const loginBtn = document.getElementById('login-submit');
        if (loginBtn) {
            loginBtn.addEventListener('click', login);
        }
        
        // Регистрация
        const registerBtn = document.getElementById('register-submit');
        if (registerBtn) {
            registerBtn.addEventListener('click', register);
        }
        
        // Админ вход
        const adminBtn = document.getElementById('admin-submit');
        if (adminBtn) {
            adminBtn.addEventListener('click', adminLogin);
        }
        
        // Enter в формах
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const activeForm = document.querySelector('.auth-form.active');
                if (activeForm && activeForm.id === 'login-form') {
                    login();
                } else if (activeForm && activeForm.id === 'register-form') {
                    register();
                } else if (activeForm && activeForm.id === 'admin-form') {
                    adminLogin();
                }
            }
        });
        
        // Показать/скрыть пароль
        const showPasswordBtn = document.getElementById('show-password-btn');
        if (showPasswordBtn) {
            showPasswordBtn.addEventListener('click', function() {
                const input = document.getElementById('login-password');
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        }
    }
    
    // ===== ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ =====
    function init() {
        initDatabase();
        
        // Проверяем активную сессию
        if (checkSession()) {
            return; // Если есть активная сессия, функция сама сделает редирект
        }
        
        // Настраиваем обработчики событий
        setupEventListeners();
        
        // Переключение вкладок
        const tabs = {
            'login-tab': 'login-form',
            'register-tab': 'register-form',
            'admin-tab': 'admin-form'
        };
        
        Object.keys(tabs).forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) {
                tab.addEventListener('click', function() {
                    // Убираем активный класс у всех
                    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                    
                    // Добавляем активный класс текущему
                    this.classList.add('active');
                    const formId = tabs[tabId];
                    const form = document.getElementById(formId);
                    if (form) form.classList.add('active');
                });
            }
        });
        
        console.log('✅ Система авторизации готова');
    }
    
    // Запуск инициализации
    init();
});
