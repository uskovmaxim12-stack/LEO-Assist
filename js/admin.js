// АДМИН-ПАНЕЛЬ LEO ASSISTANT - МАКСИМАЛЬНЫЕ ВОЗМОЖНОСТИ
class AdminPanel {
    constructor() {
        this.app = window.leoApp;
        this.ai = window.leoAI;
        this.init();
    }

    async init() {
        // Проверка прав администратора
        if (!this.app.currentUser || this.app.currentUser.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
        
        // Инициализация данных
        await this.app.init();
        
        // Загрузка всех данных
        this.loadDashboardStats();
        this.loadUsersTable();
        this.loadRecentActivity();
        this.initCharts();
        this.setupEventListeners();
        
        console.log('✅ Админ-панель инициализирована');
    }

    // ===== СТАТИСТИКА ДАШБОРДА =====
    loadDashboardStats() {
        // Всего пользователей
        const totalUsers = this.app.allUsers.length;
        document.getElementById('total-users').textContent = totalUsers;
        
        // Активные пользователи
        const activeUsers = this.app.allUsers.filter(u => u.active).length;
        document.getElementById('active-users').textContent = activeUsers;
        
        // Всего заданий
        const totalTasks = this.app.tasks.length;
        document.getElementById('total-tasks').textContent = totalTasks;
        
        // Запросы к AI (из localStorage)
        const aiRequests = localStorage.getItem('leo_ai_requests') || 0;
        document.getElementById('ai-requests').textContent = aiRequests;
        
        // Обновляем бейджи
        document.getElementById('users-count').textContent = totalUsers;
        document.getElementById('tasks-count').textContent = totalTasks;
    }

    // ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ =====
    loadUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.app.allUsers.forEach(user => {
            const row = document.createElement('tr');
            
            // Определяем статус
            let statusBadge = '';
            if (!user.active) {
                statusBadge = '<span class="badge badge-warning">Ожидает</span>';
            } else if (user.role === 'admin') {
                statusBadge = '<span class="badge badge-danger">Админ</span>';
            } else {
                statusBadge = '<span class="badge badge-success">Активен</span>';
            }
            
            // Определяем аватар
            const avatar = user.avatar || this.generateInitials(user.fullname);
            
            row.innerHTML = `
                <td><input type="checkbox" class="user-checkbox" value="${user.id}"></td>
                <td>${user.id}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-small">${avatar}</div>
                        <div class="user-info">
                            <div class="user-name">${user.fullname}</div>
                            <div class="user-email">${user.username}</div>
                        </div>
                    </div>
                </td>
                <td>${user.username}</td>
                <td>${this.getRoleName(user.role)}</td>
                <td>${user.class || '7Б'}</td>
                <td><strong>${user.points || 0}</strong></td>
                <td>${statusBadge}</td>
                <td>${new Date(user.registeredAt).toLocaleDateString('ru-RU')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit-user" data-id="${user.id}" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action toggle-user" data-id="${user.id}" title="${user.active ? 'Деактивировать' : 'Активировать'}">
                            <i class="fas ${user.active ? 'fa-user-slash' : 'fa-user-check'}"></i>
                        </button>
                        <button class="btn-action delete-user" data-id="${user.id}" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Добавляем обработчики событий для кнопок
        this.setupUserActions();
    }

    setupUserActions() {
        // Редактирование пользователя
        document.querySelectorAll('.edit-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = parseInt(e.target.closest('button').dataset.id);
                this.editUser(userId);
            });
        });
        
        // Активация/деактивация
        document.querySelectorAll('.toggle-user').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = parseInt(e.target.closest('button').dataset.id);
                const user = this.app.allUsers.find(u => u.id === userId);
                
                if (user) {
                    user.active = !user.active;
                    this.app.saveUsers();
                    this.loadUsersTable();
                    this.loadDashboardStats();
                    
                    this.showNotification(
                        `Пользователь ${user.fullname} ${user.active ? 'активирован' : 'деактивирован'}`,
                        'success'
                    );
                }
            });
        });
        
        // Удаление пользователя
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = parseInt(e.target.closest('button').dataset.id);
                const user = this.app.allUsers.find(u => u.id === userId);
                
                if (user && confirm(`Вы уверены, что хотите удалить пользователя ${user.fullname}?`)) {
                    this.app.allUsers = this.app.allUsers.filter(u => u.id !== userId);
                    this.app.saveUsers();
                    this.loadUsersTable();
                    this.loadDashboardStats();
                    
                    this.showNotification(
                        `Пользователь ${user.fullname} удалён`,
                        'success'
                    );
                }
            });
        });
        
        // Выделение всех
        document.getElementById('select-all')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.user-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
    }

    editUser(userId) {
        const user = this.app.allUsers.find(u => u.id === userId);
        if (!user) return;
        
        // Открываем модальное окно редактирования
        this.openUserModal(user);
    }

    openUserModal(user = null) {
        // Создаем модальное окно для редактирования/добавления пользователя
        const modal = document.getElementById('user-modal');
        const form = document.getElementById('user-form');
        
        if (user) {
            // Режим редактирования
            form.innerHTML = `
                <input type="hidden" name="id" value="${user.id}">
                <div class="form-group">
                    <label>ФИО</label>
                    <input type="text" name="fullname" value="${user.fullname}" required>
                </div>
                <div class="form-group">
                    <label>Логин</label>
                    <input type="text" name="username" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label>Пароль (оставьте пустым, чтобы не менять)</label>
                    <input type="password" name="password" placeholder="Новый пароль">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Роль</label>
                        <select name="role" required>
                            <option value="student" ${user.role === 'student' ? 'selected' : ''}>Ученик</option>
                            <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Учитель</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Класс</label>
                        <input type="text" name="class" value="${user.class || '7Б'}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Очки</label>
                        <input type="number" name="points" value="${user.points || 0}" required>
                    </div>
                    <div class="form-group">
                        <label>Уровень</label>
                        <input type="number" name="level" value="${user.level || 1}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Статус</label>
                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" name="active" ${user.active ? 'checked' : ''}>
                            Активный аккаунт
                        </label>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Сохранить изменения</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closeModal()">Отмена</button>
                </div>
            `;
        } else {
            // Режим добавления
            form.innerHTML = `
                <div class="form-group">
                    <label>ФИО</label>
                    <input type="text" name="fullname" placeholder="Иванов Иван" required>
                </div>
                <div class="form-group">
                    <label>Логин</label>
                    <input type="text" name="username" placeholder="ivanov.i" required>
                </div>
                <div class="form-group">
                    <label>Пароль</label>
                    <input type="password" name="password" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Роль</label>
                        <select name="role" required>
                            <option value="student">Ученик</option>
                            <option value="teacher">Учитель</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Класс</label>
                        <input type="text" name="class" value="7Б" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Добавить пользователя</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closeModal()">Отмена</button>
                </div>
            `;
        }
        
        // Обработка отправки формы
        form.onsubmit = (e) => {
            e.preventDefault();
            this.saveUser(new FormData(form), user ? 'edit' : 'add');
        };
        
        // Показываем модальное окно
        modal.style.display = 'block';
    }

    saveUser(formData, mode) {
        const userData = {
            fullname: formData.get('fullname'),
            username: formData.get('username'),
            role: formData.get('role'),
            class: formData.get('class'),
            points: parseInt(formData.get('points') || 0),
            level: parseInt(formData.get('level') || 1),
            active: formData.get('active') === 'on'
        };
        
        if (mode === 'add') {
            // Добавление нового пользователя
            const password = formData.get('password');
            if (password) {
                userData.password = btoa(password + 'leo_salt');
            }
            
            userData.id = Date.now();
            userData.avatar = this.generateInitials(userData.fullname);
            userData.registeredAt = new Date().toISOString();
            
            this.app.allUsers.push(userData);
            this.app.saveUsers();
            
            this.showNotification('Пользователь успешно добавлен', 'success');
            
        } else {
            // Редактирование существующего
            const userId = parseInt(formData.get('id'));
            const userIndex = this.app.allUsers.findIndex(u => u.id === userId);
            
            if (userIndex !== -1) {
                const password = formData.get('password');
                if (password) {
                    userData.password = btoa(password + 'leo_salt');
                } else {
                    userData.password = this.app.allUsers[userIndex].password;
                }
                
                this.app.allUsers[userIndex] = {
                    ...this.app.allUsers[userIndex],
                    ...userData
                };
                
                this.app.saveUsers();
                this.showNotification('Изменения сохранены', 'success');
            }
        }
        
        // Обновляем таблицу и закрываем модалку
        this.loadUsersTable();
        this.loadDashboardStats();
        this.closeModal();
    }

    closeModal() {
        document.getElementById('user-modal').style.display = 'none';
    }

    // ===== ОБУЧЕНИЕ AI =====
    initAITraining() {
        // Загрузка текущей базы знаний
        const knowledgeBase = this.ai.exportKnowledge();
        document.getElementById('knowledge-preview').textContent = knowledgeBase;
        
        // Обработка загрузки файла
        document.getElementById('upload-knowledge').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const knowledge = JSON.parse(event.target.result);
                        if (this.ai.importKnowledge(JSON.stringify(knowledge))) {
                            this.showNotification('База знаний успешно загружена', 'success');
                            document.getElementById('knowledge-preview').textContent = 
                                JSON.stringify(knowledge, null, 2);
                        }
                    } catch (error) {
                        this.showNotification('Ошибка загрузки файла', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
        
        // Обучение AI
        document.getElementById('train-ai-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const question = document.getElementById('ai-question').value;
            const answer = document.getElementById('ai-answer').value;
            
            if (question && answer) {
                this.ai.learnFromInteraction(question, answer);
                this.showNotification('AI успешно обучен новому ответу', 'success');
                
                // Очищаем форму
                document.getElementById('ai-question').value = '';
                document.getElementById('ai-answer').value = '';
                
                // Обновляем превью
                document.getElementById('knowledge-preview').textContent = 
                    this.ai.exportKnowledge();
            }
        });
        
        // Экспорт базы знаний
        document.getElementById('export-knowledge').addEventListener('click', () => {
            const knowledge = this.ai.exportKnowledge();
            const blob = new Blob([knowledge], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leo-ai-knowledge-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showNotification('База знаний экспортирована', 'success');
        });
        
        // Сброс AI
        document.getElementById('reset-ai').addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите сбросить AI к начальному состоянию?')) {
                this.ai = new NeuralNetwork();
                this.ai.saveToStorage();
                this.showNotification('AI сброшен к начальному состоянию', 'success');
                document.getElementById('knowledge-preview').textContent = 
                    this.ai.exportKnowledge();
            }
        });
    }

    // ===== ГРАФИКИ =====
    initCharts() {
        const ctx = document.getElementById('activity-chart');
        if (!ctx) return;
        
        // Пример данных для графика
        const data = {
            labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
            datasets: [
                {
                    label: 'Активность пользователей',
                    data: [65, 59, 80, 81, 56, 55, 40],
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        };
        
        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    }

    // ===== СИСТЕМНЫЕ ФУНКЦИИ =====
    loadRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (!container) return;
        
        // Получаем логи из localStorage
        const logs = JSON.parse(localStorage.getItem('leo_system_logs') || '[]');
        
        container.innerHTML = '';
        
        // Показываем последние 5 записей
        logs.slice(-5).reverse().forEach(log => {
            const activity = document.createElement('div');
            activity.className = 'activity-item';
            
            activity.innerHTML = `
                <div class="activity-icon ${log.type}">
                    <i class="fas fa-${log.icon || 'user'}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-user">${log.user}</div>
                    <div class="activity-action">${log.action}</div>
                </div>
                <div class="activity-time">${new Date(log.timestamp).toLocaleTimeString('ru-RU')}</div>
            `;
            
            container.appendChild(activity);
        });
    }

    logActivity(action, type = 'info', icon = 'info-circle') {
        const logs = JSON.parse(localStorage.getItem('leo_system_logs') || '[]');
        
        logs.push({
            user: this.app.currentUser.fullname,
            action: action,
            type: type,
            icon: icon,
            timestamp: new Date().toISOString()
        });
        
        // Храним только последние 100 записей
        if (logs.length > 100) {
            logs.shift();
        }
        
        localStorage.setItem('leo_system_logs', JSON.stringify(logs));
        this.loadRecentActivity();
    }

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    generateInitials(fullname) {
        const names = fullname.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return fullname.substring(0, 2).toUpperCase();
    }

    getRoleName(role) {
        const roles = {
            'student': 'Ученик',
            'teacher': 'Учитель',
            'admin': 'Администратор'
        };
        return roles[role] || role;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.querySelector('.system-notifications').appendChild(notification);
        
        // Удаляем через 5 секунд
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Логируем действие
        this.logActivity(message, type);
    }

    setupEventListeners() {
        // Добавление пользователя
        document.getElementById('add-user-btn')?.addEventListener('click', () => {
            this.openUserModal();
        });
        
        // Обучение AI
        document.getElementById('train-ai-btn')?.addEventListener('click', () => {
            document.querySelector('[data-tab="ai-training"]').click();
        });
        
        // Импорт/экспорт пользователей
        document.getElementById('import-users')?.addEventListener('click', () => {
            this.importUsers();
        });
        
        document.getElementById('export-users')?.addEventListener('click', () => {
            this.exportUsers();
        });
        
        // Поиск пользователей
        document.getElementById('user-search')?.addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });
        
        // Фильтры
        document.getElementById('filter-role')?.addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('filter-status')?.addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('filter-class')?.addEventListener('change', () => {
            this.applyFilters();
        });
        
        // Быстрые действия
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('.quick-action-btn').dataset.action;
                this.handleQuickAction(action);
            });
        });
    }

    handleQuickAction(action) {
        switch(action) {
            case 'add-user':
                this.openUserModal();
                break;
            case 'add-schedule':
                this.showNotification('Добавление расписания', 'info');
                break;
            case 'train-ai':
                document.querySelector('[data-tab="ai-training"]').click();
                break;
            case 'backup':
                this.createBackup();
                break;
            case 'clear-cache':
                this.clearCache();
                break;
            case 'system-check':
                this.systemCheck();
                break;
        }
    }

    createBackup() {
        const backupData = {
            users: this.app.allUsers,
            schedule: this.app.schedule,
            tasks: this.app.tasks,
            knowledge: this.ai.exportKnowledge(),
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leo-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Резервная копия создана', 'success');
        this.logActivity('Создана резервная копия системы', 'info', 'save');
    }

    clearCache() {
        // Очищаем только кэш, оставляя пользователей
        localStorage.removeItem('leo_schedule');
        localStorage.removeItem('leo_tasks');
        localStorage.removeItem('leo_knowledge');
        localStorage.removeItem('leo_system_logs');
        
        // Перезагружаем данные
        this.app.schedule = [];
        this.app.tasks = [];
        this.ai.initBaseKnowledge();
        
        this.showNotification('Кэш системы очищен', 'success');
        this.logActivity('Очистка кэша системы', 'info', 'broom');
    }

    systemCheck() {
        const checks = [];
        
        // Проверка базы пользователей
        if (this.app.allUsers.length > 0) {
            checks.push('✅ База пользователей в порядке');
        } else {
            checks.push('⚠️ База пользователей пуста');
        }
        
        // Проверка AI
        const knowledge = JSON.parse(this.ai.exportKnowledge());
        if (Object.keys(knowledge).length > 0) {
            checks.push('✅ AI система работает');
        } else {
            checks.push('⚠️ AI требует обучения');
        }
        
        // Проверка localStorage
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            checks.push('✅ localStorage работает');
        } catch (e) {
            checks.push('❌ Ошибка localStorage');
        }
        
        // Показываем результаты
        const results = checks.join('\n');
        alert('Результаты проверки системы:\n\n' + results);
        
        this.logActivity('Выполнена проверка системы', 'info', 'stethoscope');
    }

    filterUsers(searchTerm) {
        const rows = document.querySelectorAll('#users-table-body tr');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }

    applyFilters() {
        // Реализация фильтрации
        console.log('Применение фильтров');
    }

    importUsers() {
        // Реализация импорта пользователей
        this.showNotification('Функция импорта в разработке', 'info');
    }

    exportUsers() {
        const usersData = JSON.stringify(this.app.allUsers, null, 2);
        const blob = new Blob([usersData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leo-users-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Список пользователей экспортирован', 'success');
        this.logActivity('Экспорт списка пользователей', 'info', 'file-export');
    }
}

// Инициализация админ-панели при загрузке
window.adminPanel = null;
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});