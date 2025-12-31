// core-system.js - ЯДРО СИСТЕМЫ LEO ASSIST
class CoreSystem {
    constructor() {
        this.currentUser = null;
        this.schedule = null;
        this.ai = null;
        this.init();
    }
    
    init() {
        this.loadCurrentUser();
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }
        
        this.loadSchedule();
        this.initAI();
        console.log('✅ Ядро системы инициализировано');
    }
    
    loadCurrentUser() {
        const session = localStorage.getItem('leo_session') || sessionStorage.getItem('leo_session');
        if (session) {
            try {
                this.currentUser = JSON.parse(session);
            } catch (e) {
                console.error('Ошибка загрузки пользователя:', e);
                this.logout();
            }
        }
    }
    
    loadSchedule() {
        // РЕАЛЬНОЕ РАСПИСАНИЕ 7Б КЛАССА (ваше расписание)
        this.schedule = {
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
    }
    
    initAI() {
        // Инициализация AI системы
        this.ai = {
            knowledge: JSON.parse(localStorage.getItem('leo_ai_knowledge') || '{}'),
            
            process: function(question) {
                const q = question.toLowerCase().trim();
                
                // Проверяем точные совпадения
                if (this.knowledge[q]) {
                    const answers = Array.isArray(this.knowledge[q]) ? this.knowledge[q] : [this.knowledge[q]];
                    return answers[Math.floor(Math.random() * answers.length)];
                }
                
                // Проверяем ключевые слова
                const keywords = {
                    'привет': ['Привет! Я Лео, ваш помощник.', 'Здравствуйте! Чем могу помочь?'],
                    'расписание': ['Расписание доступно в соответствующем разделе.', 'Вы можете посмотреть расписание в главном меню.'],
                    'домашнее': ['Домашние задания отображаются в разделе "Задания".', 'Проверьте раздел с заданиями.'],
                    'помощь': ['Я могу помочь с расписанием, заданиями и вопросами по учёбе.', 'Чем конкретно могу помочь?']
                };
                
                for (const [keyword, answers] of Object.entries(keywords)) {
                    if (q.includes(keyword)) {
                        return answers[Math.floor(Math.random() * answers.length)];
                    }
                }
                
                // Если ответ не найден
                return "Интересный вопрос! Я ещё учусь. Можете переформулировать или задать другой вопрос?";
            },
            
            learn: function(question, answer) {
                const q = question.toLowerCase().trim();
                
                if (!this.knowledge[q]) {
                    this.knowledge[q] = [];
                }
                
                if (!this.knowledge[q].includes(answer)) {
                    this.knowledge[q].push(answer);
                    localStorage.setItem('leo_ai_knowledge', JSON.stringify(this.knowledge));
                }
            }
        };
        
        // Загружаем базовые знания
        if (Object.keys(this.ai.knowledge).length === 0) {
            this.initializeAIKnowledge();
        }
    }
    
    initializeAIKnowledge() {
        const baseKnowledge = {
            'привет': ['Привет! Я Лео, помощник для 7Б класса.', 'Здравствуйте! Рад вас видеть.'],
            'как дела': ['Всё отлично! Готов помогать с учёбой.', 'Хорошо, спасибо! А у вас?'],
            'расписание': ['Расписание уроков доступно в соответствующем разделе.', 'Вы можете посмотреть расписание на сегодня и всю неделю.'],
            'домашнее задание': ['Домашние задания отображаются в разделе "Задания".', 'Проверьте список заданий в главном меню.'],
            'помощь': ['Я могу помочь с расписанием, заданиями и вопросами по учёбе.', 'Чем конкретно могу помочь? Задайте вопрос!'],
            'спасибо': ['Всегда рад помочь!', 'Пожалуйста! Обращайтесь ещё.']
        };
        
        Object.entries(baseKnowledge).forEach(([question, answers]) => {
            this.ai.knowledge[question] = answers;
        });
        
        localStorage.setItem('leo_ai_knowledge', JSON.stringify(this.ai.knowledge));
    }
    
    getTodaySchedule() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = new Date().getDay();
        const todayKey = days[today];
        
        return this.schedule[todayKey] || [];
    }
    
    getDayName(dayIndex) {
        const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        return days[dayIndex];
    }
    
    addPoints(points, reason) {
        if (!this.currentUser) return;
        
        // Обновляем очки
        this.currentUser.points = (this.currentUser.points || 0) + points;
        
        // Обновляем в базе
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].points = this.currentUser.points;
            localStorage.setItem('leo_users', JSON.stringify(users));
        }
        
        // Обновляем сессию
        localStorage.setItem('leo_session', JSON.stringify(this.currentUser));
        
        // Логируем
        this.logActivity(`Начислено ${points} очков за: ${reason}`);
        
        return this.currentUser.points;
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
        const container = document.getElementById('notifications') || document.body;
        container.appendChild(notification);
        
        // Автоудаление
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    logout() {
        localStorage.removeItem('leo_session');
        sessionStorage.removeItem('leo_session');
        window.location.href = 'index.html';
    }
}

// Создаём глобальный экземпляр
window.leoCore = new CoreSystem();
