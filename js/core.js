// core.js - ЯДРО ПРИЛОЖЕНИЯ LEO ASSIST
class LeoCore {
    constructor() {
        this.currentUser = null;
        this.schedule = this.loadRealSchedule();
        this.games = this.createGames();
        this.ai = new NeuralNetwork();
        this.init();
    }
    
    init() {
        // Загрузка текущего пользователя
        const session = localStorage.getItem('leo_session') || sessionStorage.getItem('leo_session');
        if (session) {
            this.currentUser = JSON.parse(session);
        } else {
            window.location.href = 'index.html';
            return;
        }
        
        // Загрузка данных
        this.loadUserData();
        this.initAI();
        
        console.log('✅ LeoCore инициализирован');
    }
    
    loadUserData() {
        // Обновляем данные пользователя из базы
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const freshUser = users.find(u => u.id === this.currentUser.id);
        if (freshUser) {
            this.currentUser = freshUser;
        }
    }
    
    // РЕАЛЬНОЕ РАСПИСАНИЕ 7Б КЛАССА (ваше расписание)
    loadRealSchedule() {
        return {
            monday: [
                { time: "13:10-13:50", subject: "История", room: "16 Каб", teacher: "" },
                { time: "14:00-14:40", subject: "Разговоры о важном", room: "21 Каб", teacher: "" },
                { time: "14:50-15:30", subject: "Биология", room: "21 Каб", teacher: "" },
                { time: "15:40-16:20", subject: "Русский язык", room: "32 Каб", teacher: "" },
                { time: "16:30-17:10", subject: "Труд", room: "6 Каб", teacher: "" },
                { time: "17:15-17:55", subject: "Труд", room: "6 Каб", teacher: "" },
                { time: "18:00-18:40", subject: "Литература", room: "32 Каб", teacher: "" }
            ],
            tuesday: [
                { time: "13:10-13:50", subject: "Информатика-пл", room: "42 Каб", teacher: "" },
                { time: "14:00-14:40", subject: "История", room: "16 Каб", teacher: "" },
                { time: "14:50-15:30", subject: "ИЗО", room: "6 Каб", teacher: "" },
                { time: "15:40-16:20", subject: "Алгебра", room: "34 Каб", teacher: "" },
                { time: "16:30-17:10", subject: "Русский язык", room: "32 Каб", teacher: "" },
                { time: "17:15-17:55", subject: "Физ-ра", room: "СЗ", teacher: "" },
                { time: "18:00-18:40", subject: "Геометрия", room: "34 Каб", teacher: "" }
            ],
            wednesday: [
                { time: "13:10-13:50", subject: "Физика", room: "35 Каб", teacher: "" },
                { time: "14:00-14:40", subject: "История", room: "16 Каб", teacher: "" },
                { time: "14:50-15:30", subject: "Физ-ра", room: "СЗ", teacher: "" },
                { time: "15:40-16:20", subject: "Русский язык", room: "32 Каб", teacher: "" },
                { time: "16:30-17:10", subject: "Физика", room: "35 Каб", teacher: "" },
                { time: "17:15-17:55", subject: "География", room: "22 Каб", teacher: "" },
                { time: "18:00-18:40", subject: "Русский язык-пл", room: "32 Каб", teacher: "" }
            ],
            thursday: [
                { time: "13:10-13:50", subject: "Алгебра", room: "34 Каб", teacher: "" },
                { time: "14:00-14:40", subject: "Вероятность и Статистика", room: "34 Каб", teacher: "" },
                { time: "14:50-15:30", subject: "Английский язык", room: "12 Каб", teacher: "" },
                { time: "15:40-16:20", subject: "География", room: "22 Каб", teacher: "" },
                { time: "16:30-17:10", subject: "Русский язык", room: "32 Каб", teacher: "" },
                { time: "17:15-17:55", subject: "Литература", room: "32 Каб", teacher: "" },
                { time: "18:00-18:40", subject: "Физ-ра", room: "СЗ", teacher: "" }
            ],
            friday: [
                { time: "13:10-13:50", subject: "Алгебра", room: "34 Каб", teacher: "" },
                { time: "14:00-14:40", subject: "Английский язык/Информатика", room: "12 / 42", teacher: "" },
                { time: "14:50-15:30", subject: "Английский язык", room: "12 Каб", teacher: "" },
                { time: "15:40-16:20", subject: "Геометрия", room: "34 Каб", teacher: "" },
                { time: "16:30-17:10", subject: "Биология", room: "21 Каб", teacher: "" },
                { time: "17:15-17:55", subject: "Информатика/Английский язык", room: "42 / 12", teacher: "" },
                { time: "18:00-18:40", subject: "Математика-ВД", room: "34 Каб", teacher: "" }
            ],
            saturday: [
                { time: "12:20-13:00", subject: "Музыка", room: "АЗ", teacher: "" },
                { time: "13:10-13:50", subject: "Математика-пл", room: "34 Каб", teacher: "" },
                { time: "14:00-14:40", subject: "Химия", room: "33 Каб", teacher: "" },
                { time: "14:50-15:30", subject: "Физика", room: "35 Каб", teacher: "" },
                { time: "15:40-16:20", subject: "Математика-ВД", room: "34 Каб", teacher: "" },
                { time: "16:30-17:10", subject: "Физика-пл", room: "35 Каб", teacher: "" }
            ]
        };
    }
    
    // ИГРЫ для 7 класса (сложные, по возрасту)
    createGames() {
        return [
            {
                id: 1,
                name: "Алгебраический вызов",
                description: "Решайте уравнения 7 класса",
                icon: "🧮",
                difficulty: "medium",
                subject: "Алгебра",
                maxScore: 1000,
                rules: "Решите уравнение за минимальное время",
                questions: [
                    { 
                        question: "Решите уравнение: 3x + 7 = 22", 
                        answer: "5", 
                        points: 100,
                        hint: "Перенесите 7 в правую часть"
                    },
                    { 
                        question: "Решите: 2(x - 3) = 10", 
                        answer: "8", 
                        points: 150,
                        hint: "Раскройте скобки"
                    },
                    { 
                        question: "Найдите x: 5x - 3 = 2x + 12", 
                        answer: "5", 
                        points: 200,
                        hint: "Перенесите 2x влево, -3 вправо"
                    }
                ]
            },
            {
                id: 2,
                name: "Геометрический гений",
                description: "Задачи по геометрии 7 класса",
                icon: "📐",
                difficulty: "hard",
                subject: "Геометрия",
                maxScore: 1200,
                rules: "Решите геометрическую задачу",
                questions: [
                    { 
                        question: "Чему равна сумма углов треугольника?", 
                        answer: "180", 
                        points: 100,
                        hint: "Основная теорема геометрии"
                    },
                    { 
                        question: "Найдите площадь прямоугольника со сторонами 8 и 5", 
                        answer: "40", 
                        points: 150,
                        hint: "Площадь = длина × ширина"
                    },
                    { 
                        question: "Гипотенуза прямоугольного треугольника = 10, катет = 6. Найдите второй катет", 
                        answer: "8", 
                        points: 250,
                        hint: "Теорема Пифагора"
                    }
                ]
            },
            {
                id: 3,
                name: "Физический эксперимент",
                description: "Задачи по физике 7 класса",
                icon: "⚡",
                difficulty: "hard",
                subject: "Физика",
                maxScore: 1500,
                rules: "Решите физическую задачу",
                questions: [
                    { 
                        question: "Какова формула скорости?", 
                        answer: "v = s/t", 
                        points: 100,
                        hint: "Путь делить на время"
                    },
                    { 
                        question: "Сила тяжести вычисляется по формуле...", 
                        answer: "F = mg", 
                        points: 200,
                        hint: "Масса × ускорение свободного падения"
                    },
                    { 
                        question: "Мощность равна 100 Вт, работа 500 Дж. Найдите время", 
                        answer: "5", 
                        points: 300,
                        hint: "Время = Работа / Мощность"
                    }
                ]
            },
            {
                id: 4,
                name: "Химическая реакция",
                description: "Химия 7 класса",
                icon: "🧪",
                difficulty: "medium",
                subject: "Химия",
                maxScore: 1000,
                rules: "Уравняйте химические уравнения",
                questions: [
                    { 
                        question: "Формула воды", 
                        answer: "H2O", 
                        points: 100,
                        hint: "Два атома водорода, один кислорода"
                    },
                    { 
                        question: "Уравнение: H2 + O2 = ?", 
                        answer: "H2O", 
                        points: 200,
                        hint: "Вода образуется при горении водорода"
                    },
                    { 
                        question: "Молекулярная масса CO2", 
                        answer: "44", 
                        points: 300,
                        hint: "C=12, O=16, 12+16+16=44"
                    }
                ]
            }
        ];
    }
    
    // Инициализация AI
    initAI() {
        this.ai = new NeuralNetwork();
        
        // Загружаем сохранённые знания
        const savedKnowledge = localStorage.getItem('leo_ai_knowledge');
        if (savedKnowledge) {
            this.ai.loadKnowledge(JSON.parse(savedKnowledge));
        } else {
            // Базовая инициализация для 7 класса
            this.initializeBaseKnowledge();
        }
    }
    
    initializeBaseKnowledge() {
        // Базовые знания для 7 класса
        const baseKnowledge = {
            // Математика
            "алгебра": "Алгебра — раздел математики, изучающий алгебраические структуры, отношения и величины.",
            "геометрия": "Геометрия — раздел математики, изучающий пространственные отношения и формы.",
            "уравнение": "Уравнение — равенство, содержащее неизвестную величину, значение которой нужно найти.",
            "формула квадратного уравнения": "ax² + bx + c = 0",
            
            // Физика
            "физика": "Физика — наука о природе, изучающая материю, энергию и их взаимодействие.",
            "скорость": "Скорость — физическая величина, равная отношению пути ко времени: v = s/t",
            "сила": "Сила — векторная физическая величина, мера воздействия на тело.",
            "масса": "Масса — физическая величина, мера инертности тела.",
            
            // Химия
            "химия": "Химия — наука о веществах, их строении, свойствах и превращениях.",
            "атом": "Атом — наименьшая частица химического элемента, носитель его свойств.",
            "молекула": "Молекула — наименьшая частица вещества, сохраняющая его химические свойства.",
            "периодическая система": "Периодическая система химических элементов — таблица, классифицирующая элементы.",
            
            // Общее
            "привет": "Привет! Я Лео, ваш помощник по учёбе в 7Б классе.",
            "помощь": "Я могу помочь с расписанием, заданиями, объяснить тему или поиграть в обучающие игры.",
            "расписание": "Расписание доступно в разделе 'Расписание'. Сегодня у вас: " + this.getTodaySchedule(),
            "как дела": "Отлично! Готов помогать с учебой. Чем могу помочь?",
            "спасибо": "Всегда рад помочь! Удачи в учёбе!"
        };
        
        Object.entries(baseKnowledge).forEach(([question, answer]) => {
            this.ai.learn(question, answer);
        });
        
        this.saveAIKnowledge();
    }
    
    getTodaySchedule() {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = new Date().getDay();
        const todayKey = days[today];
        
        if (this.schedule[todayKey]) {
            return this.schedule[todayKey].map(lesson => 
                `${lesson.time} ${lesson.subject} (${lesson.room})`
            ).join(', ');
        }
        
        return "Сегодня занятий нет";
    }
    
    saveAIKnowledge() {
        localStorage.setItem('leo_ai_knowledge', JSON.stringify(this.ai.exportKnowledge()));
    }
    
    // Работа с очками (защита от накрутки)
    addPoints(points, reason) {
        if (!this.currentUser) return;
        
        // Проверяем лимит очков в день (макс 1000)
        const today = new Date().toISOString().split('T')[0];
        const dailyPoints = localStorage.getItem(`points_${today}_${this.currentUser.id}`) || 0;
        
        if (parseInt(dailyPoints) + points > 1000) {
            this.showNotification('Достигнут дневной лимит очков', 'warning');
            return;
        }
        
        // Обновляем очки
        this.currentUser.points += points;
        
        // Обновляем в базе
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].points = this.currentUser.points;
            localStorage.setItem('leo_users', JSON.stringify(users));
        }
        
        // Сохраняем сессию
        localStorage.setItem('leo_session', JSON.stringify(this.currentUser));
        
        // Записываем дневные очки
        localStorage.setItem(`points_${today}_${this.currentUser.id}`, 
            parseInt(dailyPoints) + points);
        
        // Логируем
        this.logActivity(`Получено ${points} очков за: ${reason}`, 'points');
        
        return this.currentUser.points;
    }
    
    logActivity(action, type) {
        const logs = JSON.parse(localStorage.getItem('leo_user_logs') || '[]');
        
        logs.push({
            userId: this.currentUser.id,
            timestamp: new Date().toISOString(),
            action: action,
            type: type
        });
        
        if (logs.length > 50) logs.shift();
        localStorage.setItem('leo_user_logs', JSON.stringify(logs));
    }
    
    showNotification(message, type = 'info') {
        // Создаём уведомление в UI
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'exclamation-circle' : 
                            type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Добавляем в контейнер уведомлений или в body
        const container = document.getElementById('notifications-container') || document.body;
        container.appendChild(notification);
        
        // Автоудаление
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

// Глобальный экземпляр
window.leoCore = new LeoCore();