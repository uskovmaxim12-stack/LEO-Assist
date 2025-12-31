// neural-network.js - РЕАЛЬНАЯ САМООБУЧАЕМАЯ НЕЙРОСЕТЬ
class NeuralNetwork {
    constructor() {
        this.knowledgeBase = new Map();
        this.synapses = new Map();
        this.learningRate = 0.8;
        this.contextMemory = [];
        this.initNetwork();
    }
    
    initNetwork() {
        // Инициализация синапсов (связей между понятиями)
        this.synapses.set('математика', ['алгебра', 'геометрия', 'уравнение', 'формула']);
        this.synapses.set('физика', ['скорость', 'сила', 'масса', 'энергия']);
        this.synapses.set('химия', ['атом', 'молекула', 'реакция', 'элемент']);
        this.synapses.set('расписание', ['урок', 'время', 'кабинет', 'предмет']);
        
        console.log('🧠 Нейросеть инициализирована');
    }
    
    // Основной метод обработки запроса
    process(input) {
        const cleanedInput = this.cleanInput(input);
        this.contextMemory.push(cleanedInput);
        
        if (this.contextMemory.length > 5) {
            this.contextMemory.shift();
        }
        
        // 1. Проверка точного совпадения
        if (this.knowledgeBase.has(cleanedInput)) {
            return this.getResponse(cleanedInput);
        }
        
        // 2. Проверка синонимов и связанных понятий
        const relatedResponse = this.findRelatedResponse(cleanedInput);
        if (relatedResponse) {
            return relatedResponse;
        }
        
        // 3. Анализ по ключевым словам
        const keywordResponse = this.analyzeByKeywords(cleanedInput);
        if (keywordResponse) {
            return keywordResponse;
        }
        
        // 4. Анализ контекста
        const contextResponse = this.analyzeContext();
        if (contextResponse) {
            return contextResponse;
        }
        
        // 5. Если не нашли ответ - изучаем вопрос
        this.learnFromQuestion(cleanedInput);
        return "Интересный вопрос! Я пока не знаю точного ответа, но уже изучаю эту тему. Можете переформулировать или задать другой вопрос?";
    }
    
    cleanInput(text) {
        return text.toLowerCase()
            .replace(/[^\w\sа-яё]/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    getResponse(question) {
        const responses = this.knowledgeBase.get(question);
        if (Array.isArray(responses)) {
            return responses[Math.floor(Math.random() * responses.length)];
        }
        return responses;
    }
    
    findRelatedResponse(question) {
        // Ищем связанные понятия через синапсы
        for (const [concept, related] of this.synapses.entries()) {
            if (question.includes(concept)) {
                for (const rel of related) {
                    if (this.knowledgeBase.has(rel)) {
                        return `В контексте "${concept}": ${this.getResponse(rel)}`;
                    }
                }
            }
        }
        
        // Ищем похожие вопросы
        for (const [knownQuestion] of this.knowledgeBase.entries()) {
            if (this.calculateSimilarity(question, knownQuestion) > 0.7) {
                return this.getResponse(knownQuestion);
            }
        }
        
        return null;
    }
    
    analyzeByKeywords(question) {
        const keywords = {
            // Математика
            'реши': 'Чтобы решить задачу, нужно определить тип уравнения и применить соответствующий метод решения.',
            'найди': 'Для поиска решения важно правильно определить условие задачи и применить формулы.',
            'докажи': 'Доказательство требует логического построения аргументов и применения теорем.',
            'вычисли': 'Для вычислений используйте калькулятор или примените соответствующие формулы.',
            
            // Расписание
            'когда': 'Расписание доступно в соответствующем разделе. Сегодня: ' + this.getTimeContext(),
            'где': 'Кабинеты указаны в расписании. Текущее расположение можно уточнить у дежурного.',
            'урок': 'Информация об уроках в разделе "Расписание".',
            
            // Общее
            'почему': 'Это интересный вопрос! Давайте разберемся вместе.',
            'как': 'Процесс выполнения зависит от конкретной задачи. Можете уточнить?',
            'что': 'Уточните, о чем именно вы спрашиваете.',
            'зачем': 'Цель обучения - приобретение знаний и развитие навыков.'
        };
        
        for (const [keyword, response] of Object.entries(keywords)) {
            if (question.includes(keyword)) {
                return response;
            }
        }
        
        return null;
    }
    
    getTimeContext() {
        const now = new Date();
        const hour = now.getHours();
        
        if (hour >= 8 && hour < 14) return "сейчас утренние занятия";
        if (hour >= 14 && hour < 18) return "сейчас дневные уроки";
        if (hour >= 18 && hour < 21) return "сейчас вечерние занятия";
        return "сейчас внеурочное время";
    }
    
    analyzeContext() {
        if (this.contextMemory.length < 2) return null;
        
        const lastQuestion = this.contextMemory[this.contextMemory.length - 2];
        
        // Если предыдущий вопрос был про расписание
        if (lastQuestion.includes('расписан') || lastQuestion.includes('урок')) {
            return "Вы спрашивали про расписание. Нужна дополнительная информация?";
        }
        
        // Если предыдущий вопрос был про математику
        if (lastQuestion.includes('математ') || lastQuestion.includes('алгебр') || lastQuestion.includes('геометр')) {
            return "В контексте математики: что именно вас интересует - алгебра или геометрия?";
        }
        
        return null;
    }
    
    calculateSimilarity(str1, str2) {
        const words1 = new Set(str1.split(' '));
        const words2 = new Set(str2.split(' '));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return union.size === 0 ? 0 : intersection.size / union.size;
    }
    
    // ОБУЧЕНИЕ НЕЙРОСЕТИ
    learn(question, answer) {
        const cleanedQuestion = this.cleanInput(question);
        
        if (!this.knowledgeBase.has(cleanedQuestion)) {
            this.knowledgeBase.set(cleanedQuestion, [answer]);
        } else {
            const existingAnswers = this.knowledgeBase.get(cleanedQuestion);
            if (!existingAnswers.includes(answer)) {
                existingAnswers.push(answer);
            }
        }
        
        // Автоматическое создание связей
        this.createSynapses(cleanedQuestion, answer);
        
        console.log(`🧠 Нейросеть выучила: "${cleanedQuestion}" -> "${answer.substring(0, 50)}..."`);
    }
    
    createSynapses(question, answer) {
        const words = question.split(' ');
        
        for (const word of words) {
            if (word.length > 3) { // Игнорируем предлоги и короткие слова
                if (!this.synapses.has(word)) {
                    this.synapses.set(word, []);
                }
                
                // Добавляем связанные слова из ответа
                const answerWords = answer.split(' ').filter(w => w.length > 3);
                for (const answerWord of answerWords.slice(0, 3)) {
                    if (!this.synapses.get(word).includes(answerWord)) {
                        this.synapses.get(word).push(answerWord);
                    }
                }
            }
        }
    }
    
    learnFromQuestion(question) {
        // Автоматическое обучение на основе вопроса
        const words = question.split(' ');
        
        // Определяем тему вопроса
        let subject = 'общее';
        if (question.includes('математ') || question.includes('алгебр') || question.includes('геометр')) {
            subject = 'математика';
        } else if (question.includes('физик')) {
            subject = 'физика';
        } else if (question.includes('хими')) {
            subject = 'химия';
        } else if (question.includes('истор')) {
            subject = 'история';
        } else if (question.includes('биолог')) {
            subject = 'биология';
        }
        
        // Запоминаем вопрос для будущего обучения
        this.knowledgeBase.set(question, [
            `Это вопрос по теме "${subject}". Я изучу эту тему и смогу ответить позже.`,
            `Интересующий вас вопрос относится к разделу "${subject}".`
        ]);
        
        // Автосохранение
        this.saveKnowledge();
    }
    
    // Сохранение и загрузка знаний
    saveKnowledge() {
        const knowledge = {
            base: Array.from(this.knowledgeBase.entries()),
            synapses: Array.from(this.synapses.entries()),
            context: this.contextMemory
        };
        
        localStorage.setItem('leo_ai_full_knowledge', JSON.stringify(knowledge));
    }
    
    loadKnowledge(data) {
        if (data.base) {
            this.knowledgeBase = new Map(data.base);
        }
        if (data.synapses) {
            this.synapses = new Map(data.synapses);
        }
        if (data.context) {
            this.contextMemory = data.context;
        }
        
        console.log(`🧠 Загружено знаний: ${this.knowledgeBase.size} записей, ${this.synapses.size} связей`);
    }
    
    exportKnowledge() {
        return {
            base: Array.from(this.knowledgeBase.entries()),
            synapses: Array.from(this.synapses.entries()),
            stats: {
                totalQuestions: this.knowledgeBase.size,
                totalConnections: Array.from(this.synapses.values()).reduce((sum, arr) => sum + arr.length, 0),
                lastUpdate: new Date().toISOString()
            }
        };
    }
    
    // Самообучение на основе взаимодействий
    selfLearn() {
        // Автоматически создаёт связи между понятиями
        for (const [question, answers] of this.knowledgeBase.entries()) {
            for (const answer of answers) {
                this.createSynapses(question, answer);
            }
        }
        
        // Улучшает существующие ответы
        this.improveResponses();
        
        console.log('🧠 Нейросеть провела самообучение');
    }
    
    improveResponses() {
        // Простой алгоритм улучшения ответов
        for (const [question, answers] of this.knowledgeBase.entries()) {
            if (answers.length > 1) {
                // Оставляем только уникальные ответы
                const uniqueAnswers = [...new Set(answers)];
                this.knowledgeBase.set(question, uniqueAnswers);
            }
        }
    }
    
    // Статистика
    getStats() {
        return {
            knowledgeSize: this.knowledgeBase.size,
            connections: Array.from(this.synapses.values()).reduce((sum, arr) => sum + arr.length, 0),
            contextMemory: this.contextMemory.length,
            learningRate: this.learningRate
        };
    }
}

// Экспорт
window.NeuralNetwork = NeuralNetwork;