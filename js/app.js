// ЯДРО LEO ASSISTANT - БЕЗ ВЫДУМАННЫХ ДАННЫХ
class LeoApp {
    constructor() {
        this.currentUser = null;
        this.allUsers = [];
        this.schedule = [];
        this.tasks = [];
        this.knowledgeBase = {};
    }

    async init() {
        try {
            // Загружаем текущего пользователя
            const userData = localStorage.getItem('leo_current_user');
            if (!userData) {
                window.location.href = 'index.html';
                return;
            }
            
            this.currentUser = JSON.parse(userData);
            
            // Загружаем ВСЕХ пользователей (только зарегистрированных)
            this.allUsers = JSON.parse(localStorage.getItem('leo_users') || '[]');
            
            // Загружаем расписание (только то, что загружено админом)
            this.schedule = JSON.parse(localStorage.getItem('leo_schedule') || '[]');
            
            // Загружаем задания
            this.tasks = JSON.parse(localStorage.getItem('leo_tasks') || '[]');
            
            // Загружаем базу знаний AI
            this.knowledgeBase = JSON.parse(localStorage.getItem('leo_knowledge') || '{}');
            
            // Если база знаний пустая - инициализируем минимальную
            if (Object.keys(this.knowledgeBase).length === 0) {
                this.knowledgeBase = {
                    "привет": ["Привет! Я Лео, ваш помощник.", "Здравствуйте!"],
                    "помощь": "Я могу помочь с расписанием, заданиями и ответить на вопросы.",
                    "расписание": "Расписание можно посмотреть в соответствующем разделе."
                };
                this.saveKnowledge();
            }
            
            console.log('✅ LeoApp инициализирован с реальными данными');
            return true;
            
        } catch (error) {
            console.error('Ошибка инициализации LeoApp:', error);
            return false;
        }
    }

    // Получаем ТОЛЬКО активных пользователей для рейтинга
    getActiveUsers() {
        return this.allUsers
            .filter(user => user.active === true)
            .sort((a, b) => b.points - a.points);
    }

    // Получаем расписание на текущий день
    getTodaySchedule() {
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const today = new Date().getDay();
        const todayName = days[today];
        
        return this.schedule.find(day => day.day === todayName) || { day: todayName, lessons: [] };
    }

    // Добавляем нового пользователя (только через админку)
    addUser(userData) {
        const newUser = {
            id: Date.now(),
            ...userData,
            points: 0,
            level: 1,
            active: true,
            registeredAt: new Date().toISOString()
        };
        
        this.allUsers.push(newUser);
        this.saveUsers();
        return newUser;
    }

    // Обновляем очки пользователя
    updateUserPoints(userId, points) {
        const user = this.allUsers.find(u => u.id === userId);
        if (user) {
            user.points += points;
            
            // Проверяем повышение уровня (каждые 1000 очков)
            const newLevel = Math.floor(user.points / 1000) + 1;
            if (newLevel > user.level) {
                user.level = newLevel;
            }
            
            this.saveUsers();
            
            // Если это текущий пользователь, обновляем и его
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser.points = user.points;
                this.currentUser.level = user.level;
                localStorage.setItem('leo_current_user', JSON.stringify(this.currentUser));
            }
            
            return user;
        }
        return null;
    }

    // AI-ассистент - учится на вопросах
    askAI(question) {
        const lowerQ = question.toLowerCase().trim();
        
        // Ищем точный ответ в базе знаний
        if (this.knowledgeBase[lowerQ]) {
            const answers = this.knowledgeBase[lowerQ];
            return Array.isArray(answers) 
                ? answers[Math.floor(Math.random() * answers.length)]
                : answers;
        }
        
        // Ищем по ключевым словам
        for (const [key, answers] of Object.entries(this.knowledgeBase)) {
            if (lowerQ.includes(key)) {
                return Array.isArray(answers) 
                    ? answers[Math.floor(Math.random() * answers.length)]
                    : answers;
            }
        }
        
        // Если ответ не найден - запоминаем вопрос для обучения
        if (!this.knowledgeBase[lowerQ]) {
            this.knowledgeBase[lowerQ] = [
                "Я пока не знаю ответ на этот вопрос. Администратор добавит ответ позже."
            ];
            this.saveKnowledge();
        }
        
        return "Извините, я ещё учусь. Задайте этот вопрос администратору.";
    }

    // Сохранение данных
    saveUsers() {
        localStorage.setItem('leo_users', JSON.stringify(this.allUsers));
    }
    
    saveSchedule() {
        localStorage.setItem('leo_schedule', JSON.stringify(this.schedule));
    }
    
    saveTasks() {
        localStorage.setItem('leo_tasks', JSON.stringify(this.tasks));
    }
    
    saveKnowledge() {
        localStorage.setItem('leo_knowledge', JSON.stringify(this.knowledgeBase));
    }

    // Выход из системы
    logout() {
        localStorage.removeItem('leo_current_user');
        window.location.href = 'index.html';
    }
}

// Глобальный экземпляр приложения
window.leoApp = new LeoApp();