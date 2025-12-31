// core.js - ЯДРО СИСТЕМЫ LEO ASSIST

class LeoCore {
    constructor() {
        this.currentUser = null;
        this.init();
    }
    
    init() {
        // Проверяем сессию
        const session = localStorage.getItem('leo_session') || sessionStorage.getItem('leo_session');
        
        if (session) {
            try {
                this.currentUser = JSON.parse(session);
                
                // Проверяем валидность пользователя
                const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
                const freshUser = users.find(u => u.id === this.currentUser.id);
                
                if (freshUser && freshUser.active) {
                    this.currentUser = freshUser;
                    console.log('✅ Пользователь авторизован:', this.currentUser.fullname);
                } else {
                    this.logout();
                }
            } catch (e) {
                console.error('Ошибка загрузки сессии:', e);
                this.logout();
            }
        } else {
            // Если нет сессии, но мы на странице дашборда - редирект
            if (window.location.pathname.includes('dashboard.html') || 
                window.location.pathname.includes('admin.html')) {
                window.location.href = 'index.html';
            }
        }
    }
    
    // Получение расписания (ваше реальное расписание)
    getSchedule(day = null) {
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
        
        if (day) {
            return schedule[day.toLowerCase()] || [];
        }
        
        // Если день не указан, возвращаем расписание на текущий день
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = new Date().getDay();
        return schedule[days[today]] || [];
    }
    
    // Получение списка всех пользователей для рейтинга
    getUsersForRating() {
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        return users
            .filter(user => user.active && user.role === 'student')
            .sort((a, b) => b.points - a.points)
            .map((user, index) => ({
                ...user,
                rank: index + 1
            }));
    }
    
    // Добавление очков пользователю
    addPoints(points, reason) {
        if (!this.currentUser || points <= 0) return false;
        
        // Обновляем в базе
        const users = JSON.parse(localStorage.getItem('leo_users'));
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].points += points;
            localStorage.setItem('leo_users', JSON.stringify(users));
            
            // Обновляем текущего пользователя
            this.currentUser = users[userIndex];
            localStorage.setItem('leo_session', JSON.stringify(this.currentUser));
            
            // Логируем действие
            this.logActivity(`Начислено ${points} очков за: ${reason}`);
            
            return true;
        }
        
        return false;
    }
    
    logActivity(action) {
        const logs = JSON.parse(localStorage.getItem('leo_user_logs') || '[]');
        logs.push({
            userId: this.currentUser.id,
            timestamp: new Date().toISOString(),
            action: action
        });
        
        if (logs.length > 50) logs.shift();
        localStorage.setItem('leo_user_logs', JSON.stringify(logs));
    }
    
    showNotification(message, type = 'info') {
        // Создаём уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'exclamation-circle' : 
                            type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Добавляем на страницу
        document.body.appendChild(notification);
        
        // Автоудаление через 5 секунд
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    logout() {
        localStorage.removeItem('leo_session');
        sessionStorage.removeItem('leo_session');
        window.location.href = 'index.html';
    }
}

// Создаём глобальный экземпляр
window.leoCore = new LeoCore();
