// dashboard-system.js - ЛОГИКА ПАНЕЛИ УЧЕНИКА
class DashboardSystem {
    constructor() {
        this.core = window.leoCore;
        this.currentUser = this.core.currentUser;
        this.games = this.createGames();
        this.init();
    }
    
    init() {
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }
        
        this.loadUserData();
        this.loadSchedule();
        this.loadRating();
        this.loadGames();
        this.initAI();
        this.setupEventListeners();
        
        console.log('✅ Панель ученика инициализирована');
    }
    
    loadUserData() {
        // Основная информация
        document.getElementById('user-name').textContent = this.currentUser.fullname;
        document.getElementById('user-avatar').textContent = this.currentUser.avatar || 'ЛУ';
        document.getElementById('user-class').textContent = `7Б класс`;
        
        // Статистика
        document.getElementById('user-points').textContent = this.currentUser.points || 0;
        document.getElementById('user-level').textContent = this.currentUser.level || 1;
        document.getElementById('user-rank').textContent = this.calculateRank();
        
        // Прогресс уровня
        const level = this.currentUser.level || 1;
        const points = this.currentUser.points || 0;
        const pointsForLevel = level * 1000;
        const progress = Math.min(100, (points / pointsForLevel) * 100);
        
        document.getElementById('level-progress-bar').style.width = `${progress}%`;
        document.getElementById('next-level-num').textContent = level + 1;
        document.getElementById('points-needed').textContent = `${pointsForLevel - points} очков`;
        
        // Общая статистика
        document.getElementById('stat-completed').textContent = 
            this.currentUser.completedTasks || 0;
        document.getElementById('stat-streak').textContent = 
            this.currentUser.streak || 0;
        document.getElementById('stat-time').textContent = 
            `${Math.floor((this.currentUser.totalTime || 0) / 60)}ч`;
        document.getElementById('stat-achievements').textContent = 
            this.currentUser.achievements?.length || 0;
        
        // Обновляем сегодняшние задачи
        this.loadTodayTasks();
    }
    
    calculateRank() {
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const activeStudents = users
            .filter(u => u.active && u.role === 'student')
            .sort((a, b) => (b.points || 0) - (a.points || 0));
        
        const rank = activeStudents.findIndex(u => u.id === this.currentUser.id) + 1;
        return rank > 0 ? rank : '-';
    }
    
    loadTodayTasks() {
        const container = document.getElementById('today-tasks-list');
        if (!container) return;
        
        const tasks = JSON.parse(localStorage.getItem('leo_tasks') || '[]');
        const today = new Date().toISOString().split('T')[0];
        
        const todayTasks = tasks.filter(task => 
            task.userId === this.currentUser.id && 
            task.dueDate === today && 
            !task.completed
        );
        
        container.innerHTML = '';
        
        if (todayTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>На сегодня задач нет</p>
                </div>
            `;
            return;
        }
        
        todayTasks.slice(0, 3).forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'today-task';
            taskEl.innerHTML = `
                <div class="task-check" data-task-id="${task.id}"></div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-subject">${task.subject}</div>
                </div>
            `;
            
            // Обработчик выполнения задачи
            taskEl.querySelector('.task-check').addEventListener('click', () => {
                this.completeTask(task.id);
            });
            
            container.appendChild(taskEl);
        });
        
        // Обновляем бейдж
        document.getElementById('tasks-badge').textContent = todayTasks.length;
    }
    
    completeTask(taskId) {
        const tasks = JSON.parse(localStorage.getItem('leo_tasks') || '[]');
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1 && !tasks[taskIndex].completed) {
            tasks[taskIndex].completed = true;
            tasks[taskIndex].completedAt = new Date().toISOString();
            
            // Начисляем очки
            const points = tasks[taskIndex].points || 100;
            this.core.addPoints(points, `Выполнение задания: ${tasks[taskIndex].title}`);
            
            localStorage.setItem('leo_tasks', JSON.stringify(tasks));
            
            // Обновляем UI
            this.loadUserData();
            this.loadRating();
            
            // Показываем уведомление
            this.core.showNotification(`Задание выполнено! +${points} очков`, 'success');
        }
    }
    
    loadSchedule() {
        const container = document.getElementById('schedule-days');
        if (!container) return;
        
        const days = [
            { key: 'monday', name: 'Понедельник' },
            { key: 'tuesday', name: 'Вторник' },
            { key: 'wednesday', name: 'Среда' },
            { key: 'thursday', name: 'Четверг' },
            { key: 'friday', name: 'Пятница' },
            { key: 'saturday', name: 'Суббота' }
        ];
        
        const today = new Date().getDay();
        const todayIndex = today === 0 ? 6 : today - 1; // Воскресенье = 0, Понедельник = 1
        
        container.innerHTML = '';
        
        days.forEach((day, index) => {
            const lessons = this.core.schedule[day.key] || [];
            const isToday = index === todayIndex;
            
            const dayEl = document.createElement('div');
            dayEl.className = `day-card ${isToday ? 'current' : ''}`;
            
            let lessonsHTML = '';
            
            if (lessons.length > 0) {
                lessons.forEach((lesson, lessonIndex) => {
                    const isCurrent = this.isCurrentLesson(lesson.time);
                    
                    lessonsHTML += `
                        <div class="lesson-card ${isCurrent ? 'current' : ''}">
                            <div class="lesson-time">${lesson.time}</div>
                            <div class="lesson-subject">${lesson.subject}</div>
                            <div class="lesson-room">${lesson.room}</div>
                        </div>
                    `;
                });
            } else {
                lessonsHTML = `
                    <div class="empty-lessons">
                        <i class="fas fa-coffee"></i>
                        <p>Нет занятий</p>
                    </div>
                `;
            }
            
            dayEl.innerHTML = `
                <div class="day-header">
                    <h3>${day.name}</h3>
                    ${isToday ? '<span class="day-date">Сегодня</span>' : ''}
                </div>
                <div class="lessons-list">
                    ${lessonsHTML}
                </div>
            `;
            
            container.appendChild(dayEl);
        });
        
        // Обновляем текущий урок
        this.updateCurrentLesson();
    }
    
    isCurrentLesson(lessonTime) {
        const now = new Date();
        const [startStr, endStr] = lessonTime.split('-');
        
        const [startHours, startMinutes] = startStr.split(':').map(Number);
        const [endHours, endMinutes] = endStr.split(':').map(Number);
        
        const lessonStart = new Date();
        lessonStart.setHours(startHours, startMinutes, 0);
        
        const lessonEnd = new Date();
        lessonEnd.setHours(endHours, endMinutes, 0);
        
        return now >= lessonStart && now <= lessonEnd;
    }
    
    updateCurrentLesson() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayKey = days[now.getDay()];
        const todayLessons = this.core.schedule[todayKey] || [];
        
        let currentLesson = null;
        let nextLesson = null;
        
        for (const lesson of todayLessons) {
            const [startTime] = lesson.time.split('-');
            const [hours, minutes] = startTime.split(':').map(Number);
            const lessonStart = hours * 60 + minutes;
            
            if (currentTime >= lessonStart && currentTime < lessonStart + 45) {
                currentLesson = lesson;
            } else if (currentTime < lessonStart && !nextLesson) {
                nextLesson = lesson;
            }
        }
        
        // Обновляем виджет "Сегодня"
        const currentEl = document.getElementById('current-lesson');
        const nextEl = document.getElementById('next-lesson');
        
        if (currentLesson) {
            document.getElementById('lesson-status').textContent = 'Сейчас идет';
            document.getElementById('lesson-time').textContent = currentLesson.time;
            document.getElementById('lesson-details').innerHTML = `
                <span class="subject">${currentLesson.subject}</span>
                <span class="room">${currentLesson.room}</span>
            `;
        } else {
            document.getElementById('lesson-status').textContent = 'Нет урока';
            document.getElementById('lesson-time').textContent = '-';
            document.getElementById('lesson-details').innerHTML = `
                <span class="subject">Отдых</span>
                <span class="room">-</span>
            `;
        }
        
        if (nextEl && nextLesson) {
            nextEl.querySelector('.next-details').textContent = 
                `${nextLesson.time} ${nextLesson.subject}`;
        }
    }
    
    loadRating() {
        const container = document.getElementById('rating-list');
        if (!container) return;
        
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const activeStudents = users
            .filter(u => u.active && u.role === 'student')
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .slice(0, 5);
        
        container.innerHTML = '';
        
        if (activeStudents.length === 0) {
            container.innerHTML = `
                <div class="empty-rating">
                    <i class="fas fa-users"></i>
                    <p>Пока нет активных учеников</p>
                </div>
            `;
            return;
        }
        
        activeStudents.forEach((user, index) => {
            const isCurrent = user.id === this.currentUser.id;
            const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
            
            const item = document.createElement('div');
            item.className = `rating-item ${isCurrent ? 'current-user' : ''}`;
            item.innerHTML = `
                <div class="rating-rank">${medal}</div>
                <div class="rating-avatar">${user.avatar}</div>
                <div class="rating-info">
                    <div class="rating-name">${user.fullname}</div>
                    <div class="rating-details">
                        <span class="rating-level">Ур. ${user.level || 1}</span>
                        <span class="rating-points">${user.points || 0} очков</span>
                    </div>
                </div>
                ${isCurrent ? '<div class="you-badge">Вы</div>' : ''}
            `;
            
            container.appendChild(item);
        });
    }
    
    createGames() {
        return [
            {
                id: 1,
                name: "Алгебраический вызов",
                description: "Решайте уравнения 7 класса",
                icon: "🧮",
                difficulty: "medium",
                subject: "Алгебра",
                color: "#00c6ff",
                maxScore: 1000,
                questions: [
                    {
                        question: "Решите: 3x + 7 = 22",
                        answer: "5",
                        points: 100,
                        hint: "Перенесите 7 в правую часть"
                    },
                    {
                        question: "Решите: 2(x - 3) = 10",
                        answer: "8",
                        points: 150,
                        hint: "Раскройте скобки"
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
                color: "#ff6b9d",
                maxScore: 1200,
                questions: [
                    {
                        question: "Сумма углов треугольника?",
                        answer: "180",
                        points: 100,
                        hint: "Основная теорема"
                    },
                    {
                        question: "Площадь прямоугольника 8×5?",
                        answer: "40",
                        points: 150,
                        hint: "Длина × ширина"
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
                color: "#ffcc00",
                maxScore: 1500,
                questions: [
                    {
                        question: "Формула скорости?",
                        answer: "v = s/t",
                        points: 100,
                        hint: "Путь делить на время"
                    },
                    {
                        question: "Сила тяжести?",
                        answer: "F = mg",
                        points: 200,
                        hint: "Масса × ускорение"
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
                color: "#00ff88",
                maxScore: 1000,
                questions: [
                    {
                        question: "Формула воды?",
                        answer: "H2O",
                        points: 100,
                        hint: "Два водорода, один кислород"
                    },
                    {
                        question: "CO2 масса?",
                        answer: "44",
                        points: 200,
                        hint: "C=12, O=16, 12+16+16=44"
                    }
                ]
            }
        ];
    }
    
    loadGames() {
        const container = document.getElementById('games-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.games.forEach(game => {
            const gameEl = document.createElement('div');
            gameEl.className = 'game-card';
            gameEl.style.borderColor = game.color;
            
            gameEl.innerHTML = `
                <div class="game-icon">${game.icon}</div>
                <h3 class="game-title">${game.name}</h3>
                <p class="game-description">${game.description}</p>
                <div class="game-meta">
                    <span class="game-difficulty difficulty-${game.difficulty}">
                        ${game.difficulty === 'easy' ? 'Легко' : 
                          game.difficulty === 'medium' ? 'Средне' : 'Сложно'}
                    </span>
                    <span class="game-subject">${game.subject}</span>
                </div>
                <button class="game-play-btn" data-game-id="${game.id}">
                    <i class="fas fa-play"></i>
                    <span>Играть</span>
                </button>
            `;
            
            // Обработчик запуска игры
            gameEl.querySelector('.game-play-btn').addEventListener('click', () => {
                this.startGame(game);
            });
            
            container.appendChild(gameEl);
        });
    }
    
    startGame(game) {
        // Создаем модальное окно игры
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${game.icon} ${game.name}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="game-modal-body">
                    <div class="game-rules">
                        <p><strong>Правила:</strong> Отвечайте на вопросы, зарабатывайте очки!</p>
                        <p><strong>Максимальный счёт:</strong> ${game.maxScore} очков</p>
                    </div>
                    
                    <div class="game-questions" id="game-questions"></div>
                    
                    <div class="game-controls">
                        <div class="game-score">
                            Счёт: <span id="game-score">0</span> очков
                        </div>
                        <button class="btn-primary" id="next-question-btn">
                            <i class="fas fa-forward"></i> Следующий вопрос
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Закрытие модалки
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        // Запуск игры
        this.runGame(game, modal);
    }
    
    runGame(game, modal) {
        let currentQuestion = 0;
        let score = 0;
        let startTime = Date.now();
        
        const showQuestion = () => {
            const questionsContainer = modal.querySelector('#game-questions');
            const scoreElement = modal.querySelector('#game-score');
            
            if (currentQuestion >= game.questions.length) {
                this.finishGame(game, score, Date.now() - startTime, modal);
                return;
            }
            
            const question = game.questions[currentQuestion];
            
            questionsContainer.innerHTML = `
                <div class="game-question">
                    <div class="question-number">
                        Вопрос ${currentQuestion + 1} из ${game.questions.length}
                    </div>
                    <div class="question-text">${question.question}</div>
                    
                    <div class="answer-input">
                        <input type="text" 
                               id="game-answer" 
                               placeholder="Ваш ответ..."
                               autocomplete="off">
                        <button id="submit-answer">
                            <i class="fas fa-check"></i> Проверить
                        </button>
                    </div>
                    
                    <div class="game-hint">
                        <button class="hint-btn" id="show-hint">
                            <i class="fas fa-lightbulb"></i> Подсказка
                        </button>
                        <div class="hint-text" style="display: none">
                            ${question.hint}
                        </div>
                    </div>
                    
                    <div class="question-points">
                        <i class="fas fa-star"></i> ${question.points} очков за правильный ответ
                    </div>
                </div>
            `;
            
            scoreElement.textContent = score;
            
            // Обработчики
            const answerInput = modal.querySelector('#game-answer');
            const submitBtn = modal.querySelector('#submit-answer');
            const hintBtn = modal.querySelector('#show-hint');
            const hintText = modal.querySelector('.hint-text');
            
            submitBtn.addEventListener('click', () => {
                const userAnswer = answerInput.value.trim().toLowerCase();
                const correctAnswer = question.answer.toLowerCase();
                
                if (userAnswer === correctAnswer) {
                    score += question.points;
                    this.core.showNotification(`Правильно! +${question.points} очков`, 'success');
                    this.core.addPoints(question.points, `Игра "${game.name}"`);
                    
                    currentQuestion++;
                    setTimeout(showQuestion, 1000);
                } else {
                    this.core.showNotification('Неверно. Попробуйте ещё раз!', 'error');
                    answerInput.focus();
                }
            });
            
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitBtn.click();
                }
            });
            
            hintBtn.addEventListener('click', () => {
                hintText.style.display = 'block';
            });
        };
        
        // Кнопка следующего вопроса
        modal.querySelector('#next-question-btn').addEventListener('click', () => {
            currentQuestion++;
            showQuestion();
        });
        
        showQuestion();
    }
    
    finishGame(game, score, timeSpent, modal) {
        const timeBonus = Math.max(0, 100 - Math.floor(timeSpent / 1000));
        const totalScore = score + timeBonus;
        
        modal.querySelector('.game-modal-body').innerHTML = `
            <div class="game-results">
                <div class="result-icon">🏆</div>
                <h3>Игра завершена!</h3>
                
                <div class="result-stats">
                    <div class="stat">
                        <div class="label">Правильных ответов</div>
                        <div class="value">${Math.floor(score / 100)} из ${game.questions.length}</div>
                    </div>
                    <div class="stat">
                        <div class="label">Время</div>
                        <div class="value">${(timeSpent / 1000).toFixed(1)} сек</div>
                    </div>
                    <div class="stat">
                        <div class="label">Бонус за скорость</div>
                        <div class="value">+${timeBonus} очков</div>
                    </div>
                    <div class="stat total">
                        <div class="label">Общий счёт</div>
                        <div class="value">${totalScore} очков</div>
                    </div>
                </div>
                
                <div class="result-actions">
                    <button class="btn-primary" id="play-again">
                        <i class="fas fa-redo"></i> Играть снова
                    </button>
                    <button class="btn-secondary modal-close">
                        <i class="fas fa-check"></i> Завершить
                    </button>
                </div>
            </div>
        `;
        
        // Начисляем очки
        this.core.addPoints(totalScore, `Завершение игры "${game.name}"`);
        
        // Обновляем статистику игрока
        this.updateGameStats(game.id, totalScore);
        
        // Кнопка "Играть снова"
        modal.querySelector('#play-again').addEventListener('click', () => {
            modal.remove();
            this.startGame(game);
        });
        
        // Кнопка "Завершить"
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
    }
    
    updateGameStats(gameId, score) {
        if (!this.currentUser.gameStats) {
            this.currentUser.gameStats = {
                gamesPlayed: 0,
                totalScore: 0,
                games: {}
            };
        }
        
        this.currentUser.gameStats.gamesPlayed++;
        this.currentUser.gameStats.totalScore += score;
        
        if (!this.currentUser.gameStats.games[gameId]) {
            this.currentUser.gameStats.games[gameId] = {
                plays: 0,
                bestScore: 0,
                totalScore: 0
            };
        }
        
        this.currentUser.gameStats.games[gameId].plays++;
        this.currentUser.gameStats.games[gameId].totalScore += score;
        this.currentUser.gameStats.games[gameId].bestScore = 
            Math.max(this.currentUser.gameStats.games[gameId].bestScore, score);
        
        // Сохраняем в базе
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].gameStats = this.currentUser.gameStats;
            localStorage.setItem('leo_users', JSON.stringify(users));
        }
        
        // Обновляем сессию
        localStorage.setItem('leo_session', JSON.stringify(this.currentUser));
        
        // Обновляем UI
        this.loadUserData();
    }
    
    initAI() {
        const chatInput = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send');
        
        if (!chatInput || !sendBtn) return;
        
        const sendMessage = () => {
            const message = chatInput.value.trim();
            if (!message) return;
            
            this.addChatMessage(message, 'user');
            chatInput.value = '';
            
            // Имитация загрузки
            setTimeout(() => {
                const response = this.core.ai.process(message);
                this.addChatMessage(response, 'ai');
                
                // Обучение AI
                this.core.ai.learn(message, response);
            }, 800);
        };
        
        // Обработчики
        sendBtn.addEventListener('click', sendMessage);
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Быстрые вопросы
        document.querySelectorAll('.quick-q').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const question = e.target.dataset.question;
                if (question) {
                    chatInput.value = question;
                    sendMessage();
                }
            });
        });
    }
    
    addChatMessage(text, sender) {
        const container = document.getElementById('chat-messages');
        const messageEl = document.createElement('div');
        
        messageEl.className = `message ${sender}`;
        
        const time = new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageEl.innerHTML = `
            <div class="avatar">${sender === 'user' ? this.currentUser.avatar : '🤖'}</div>
            <div class="content">
                <div class="text">${text}</div>
                <div class="time">${time}</div>
            </div>
        `;
        
        container.appendChild(messageEl);
        container.scrollTop = container.scrollHeight;
    }
    
    setupEventListeners() {
        // Обновление данных
        document.getElementById('refresh-btn')?.addEventListener('click', () => {
            this.loadUserData();
            this.core.showNotification('Данные обновлены', 'info');
        });
        
        // Быстрые действия
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('.quick-action').dataset.action;
                
                switch(action) {
                    case 'add-task':
                        this.showTaskModal();
                        break;
                    case 'view-schedule':
                        document.querySelector('[data-section="schedule"]').click();
                        break;
                    case 'ask-ai':
                        document.querySelector('[data-section="ai"]').click();
                        break;
                    case 'start-game':
                        document.querySelector('[data-section="games"]').click();
                        break;
                }
            });
        });
        
        // Модальное окно задачи
        document.getElementById('add-task-btn')?.addEventListener('click', () => {
            this.showTaskModal();
        });
        
        document.getElementById('quick-task')?.addEventListener('click', () => {
            this.showTaskModal();
        });
    }
    
    showTaskModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Новое задание</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="new-task-form">
                    <div class="form-group">
                        <input type="text" placeholder="Название задания" required>
                    </div>
                    <div class="form-group">
                        <textarea placeholder="Описание" rows="3"></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <select required>
                                <option value="">Предмет</option>
                                <option value="math">Математика</option>
                                <option value="physics">Физика</option>
                                <option value="chemistry">Химия</option>
                                <option value="russian">Русский язык</option>
                                <option value="history">История</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <input type="date" required>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Сохранить</button>
                        <button type="button" class="btn-secondary modal-close">Отмена</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Закрытие модалки
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        // Обработка формы
        modal.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const tasks = JSON.parse(localStorage.getItem('leo_tasks') || '[]');
            
            const newTask = {
                id: Date.now(),
                userId: this.currentUser.id,
                title: modal.querySelector('input[type="text"]').value,
                description: modal.querySelector('textarea').value,
                subject: modal.querySelector('select').value,
                dueDate: modal.querySelector('input[type="date"]').value,
                points: 100,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            tasks.push(newTask);
            localStorage.setItem('leo_tasks', JSON.stringify(tasks));
            
            this.core.showNotification('Задание добавлено', 'success');
            modal.remove();
            
            // Обновляем список задач
            this.loadTodayTasks();
        });
    }
}

// Инициализация
window.dashboard = null;
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardSystem();
});
