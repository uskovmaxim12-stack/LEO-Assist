// dashboard.js - ПОЛНОСТЬЮ РАБОЧИЙ ДАШБОРД
class Dashboard {
    constructor() {
        this.core = window.leoCore;
        this.ai = this.core.ai;
        this.currentSection = 'dashboard';
        this.init();
    }
    
    async init() {
        // Проверка авторизации
        if (!this.core.currentUser) {
            window.location.href = 'index.html';
            return;
        }
        
        // Инициализация всех компонентов
        this.loadUserData();
        this.loadSchedule();
        this.initGames();
        this.initAI();
        this.setupEventListeners();
        this.updateLiveClock();
        
        // Автообновление
        setInterval(() => this.updateLiveData(), 60000);
        
        console.log('✅ Дашборд полностью загружен');
    }
    
    loadUserData() {
        const user = this.core.currentUser;
        
        // Основная информация
        document.getElementById('user-name').textContent = user.fullname;
        document.getElementById('user-role').textContent = user.role === 'admin' ? 'Администратор' : `Ученик ${user.class}`;
        document.getElementById('user-avatar').textContent = user.avatar || 'ЛУ';
        
        // Статистика
        document.getElementById('user-points').textContent = user.points.toLocaleString();
        document.getElementById('user-level').textContent = user.level;
        document.getElementById('user-rank').textContent = this.calculateRank();
        
        // Прогресс уровня
        const progress = ((user.points % 1000) / 10) + '%';
        document.getElementById('level-progress').style.width = progress;
        document.getElementById('next-level').textContent = 
            `${1000 - (user.points % 1000)} очков до ${user.level + 1} уровня`;
        
        // Обновление рейтинга
        this.updateRating();
    }
    
    calculateRank() {
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const activeUsers = users.filter(u => u.active && u.role === 'student');
        
        activeUsers.sort((a, b) => b.points - a.points);
        const rank = activeUsers.findIndex(u => u.id === this.core.currentUser.id) + 1;
        
        return rank > 0 ? rank : '-';
    }
    
    updateRating() {
        const container = document.getElementById('rating-list');
        if (!container) return;
        
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const activeUsers = users
            .filter(u => u.active && u.role === 'student')
            .sort((a, b) => b.points - a.points)
            .slice(0, 10);
        
        container.innerHTML = '';
        
        if (activeUsers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p>Пока нет активных учеников</p>
                </div>
            `;
            return;
        }
        
        activeUsers.forEach((user, index) => {
            const isCurrent = user.id === this.core.currentUser.id;
            const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
            
            const item = document.createElement('div');
            item.className = `rating-item ${isCurrent ? 'current-user' : ''}`;
            item.innerHTML = `
                <div class="rating-rank">${medal}</div>
                <div class="rating-avatar">${user.avatar}</div>
                <div class="rating-info">
                    <div class="rating-name">${user.fullname}</div>
                    <div class="rating-details">
                        <span class="rating-level">Ур. ${user.level}</span>
                        <span class="rating-points">${user.points} очков</span>
                    </div>
                </div>
                ${isCurrent ? '<div class="you-badge">Вы</div>' : ''}
            `;
            
            container.appendChild(item);
        });
    }
    
    // РАБОЧЕЕ РАСПИСАНИЕ
    loadSchedule() {
        const scheduleContainer = document.getElementById('schedule-container');
        if (!scheduleContainer) return;
        
        const days = [
            { key: 'monday', name: 'Понедельник' },
            { key: 'tuesday', name: 'Вторник' },
            { key: 'wednesday', name: 'Среда' },
            { key: 'thursday', name: 'Четверг' },
            { key: 'friday', name: 'Пятница' },
            { key: 'saturday', name: 'Суббота' }
        ];
        
        let scheduleHTML = '<div class="schedule-week">';
        
        days.forEach(day => {
            const lessons = this.core.schedule[day.key];
            
            scheduleHTML += `
                <div class="day-schedule">
                    <div class="day-header">
                        <h3>${day.name}</h3>
                    </div>
                    <div class="lessons-list">
            `;
            
            if (lessons && lessons.length > 0) {
                lessons.forEach((lesson, index) => {
                    scheduleHTML += `
                        <div class="lesson-item ${index % 2 === 0 ? 'even' : 'odd'}">
                            <div class="lesson-time">${lesson.time}</div>
                            <div class="lesson-details">
                                <div class="lesson-subject">${lesson.subject}</div>
                                <div class="lesson-room">${lesson.room}</div>
                            </div>
                        </div>
                    `;
                });
            } else {
                scheduleHTML += `
                    <div class="empty-lessons">
                        <i class="fas fa-calendar-times"></i>
                        <p>Нет занятий</p>
                    </div>
                `;
            }
            
            scheduleHTML += `
                    </div>
                </div>
            `;
        });
        
        scheduleHTML += '</div>';
        scheduleContainer.innerHTML = scheduleHTML;
        
        // Показываем сегодняшний день
        this.showTodaySchedule();
    }
    
    showTodaySchedule() {
        const todayContainer = document.getElementById('today-schedule');
        if (!todayContainer) return;
        
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = new Date().getDay();
        const todayKey = days[today];
        const todayLessons = this.core.schedule[todayKey];
        
        if (!todayLessons || todayLessons.length === 0) {
            todayContainer.innerHTML = `
                <div class="today-empty">
                    <i class="fas fa-coffee"></i>
                    <p>Сегодня занятий нет</p>
                    <small>Можно отдохнуть или заняться домашкой</small>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="today-header">
                <h3>Сегодня (${this.getDayName(today)})</h3>
                <span class="today-date">${new Date().toLocaleDateString('ru-RU')}</span>
            </div>
            <div class="today-lessons">
        `;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        todayLessons.forEach(lesson => {
            const [startTime] = lesson.time.split('-');
            const [hours, minutes] = startTime.split(':').map(Number);
            const lessonStart = hours * 60 + minutes;
            
            const status = lessonStart > currentTime ? 'upcoming' : 
                          lessonStart + 45 > currentTime ? 'current' : 'passed';
            
            html += `
                <div class="today-lesson ${status}">
                    <div class="lesson-status"></div>
                    <div class="lesson-time">${lesson.time}</div>
                    <div class="lesson-info">
                        <div class="lesson-subject">${lesson.subject}</div>
                        <div class="lesson-room">${lesson.room}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        todayContainer.innerHTML = html;
    }
    
    getDayName(dayIndex) {
        const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        return days[dayIndex];
    }
    
    // ИГРЫ для 7 класса
    initGames() {
        const gamesContainer = document.getElementById('games-container');
        if (!gamesContainer) return;
        
        const games = this.core.games;
        
        let gamesHTML = '<div class="games-grid">';
        
        games.forEach(game => {
            gamesHTML += `
                <div class="game-card" data-game-id="${game.id}">
                    <div class="game-icon">${game.icon}</div>
                    <div class="game-info">
                        <h4>${game.name}</h4>
                        <p class="game-desc">${game.description}</p>
                        <div class="game-meta">
                            <span class="game-subject">${game.subject}</span>
                            <span class="game-difficulty ${game.difficulty}">${this.getDifficultyName(game.difficulty)}</span>
                        </div>
                        <div class="game-stats">
                            <span><i class="fas fa-star"></i> До ${game.maxScore} очков</span>
                        </div>
                    </div>
                    <button class="play-btn" onclick="dashboard.startGame(${game.id})">
                        <i class="fas fa-play"></i> Играть
                    </button>
                </div>
            `;
        });
        
        gamesHTML += '</div>';
        gamesContainer.innerHTML = gamesHTML;
    }
    
    getDifficultyName(difficulty) {
        const names = {
            'easy': 'Легко',
            'medium': 'Средне',
            'hard': 'Сложно'
        };
        return names[difficulty] || difficulty;
    }
    
    startGame(gameId) {
        const game = this.core.games.find(g => g.id === gameId);
        if (!game) return;
        
        // Показываем модальное окно с игрой
        this.showGameModal(game);
    }
    
    showGameModal(game) {
        const modal = document.createElement('div');
        modal.className = 'game-modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${game.icon} ${game.name}</h3>
                    <button class="close-modal" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="game-rules">${game.rules}</p>
                    
                    <div id="game-content"></div>
                    
                    <div class="game-controls">
                        <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">
                            <i class="fas fa-times"></i> Выйти
                        </button>
                        <button class="btn btn-primary" id="next-question">
                            <i class="fas fa-forward"></i> Следующий вопрос
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Запускаем игру
        this.runGame(game, modal.querySelector('#game-content'));
    }
    
    runGame(game, container) {
        let currentQuestion = 0;
        let score = 0;
        let startTime = Date.now();
        
        const showQuestion = () => {
            if (currentQuestion >= game.questions.length) {
                this.finishGame(game, score, Date.now() - startTime);
                return;
            }
            
            const question = game.questions[currentQuestion];
            
            container.innerHTML = `
                <div class="game-question">
                    <div class="question-number">Вопрос ${currentQuestion + 1} из ${game.questions.length}</div>
                    <div class="question-text">${question.question}</div>
                    
                    <div class="answer-input">
                        <input type="text" id="game-answer" placeholder="Ваш ответ...">
                        <button id="submit-answer">
                            <i class="fas fa-check"></i> Проверить
                        </button>
                    </div>
                    
                    <div class="game-hint">
                        <button class="hint-btn" onclick="this.nextElementSibling.style.display='block'">
                            <i class="fas fa-lightbulb"></i> Подсказка
                        </button>
                        <div class="hint-text" style="display:none">
                            ${question.hint}
                        </div>
                    </div>
                    
                    <div class="question-points">
                        <i class="fas fa-star"></i> ${question.points} очков за правильный ответ
                    </div>
                </div>
            `;
            
            // Обработчик ответа
            document.getElementById('submit-answer').addEventListener('click', () => {
                const userAnswer = document.getElementById('game-answer').value.trim();
                const correctAnswer = question.answer.toString().toLowerCase();
                
                if (userAnswer.toLowerCase() === correctAnswer) {
                    score += question.points;
                    this.core.showNotification(`Правильно! +${question.points} очков`, 'success');
                    this.core.addPoints(question.points, `Правильный ответ в игре "${game.name}"`);
                    currentQuestion++;
                    setTimeout(showQuestion, 1000);
                } else {
                    this.core.showNotification('Неверно. Попробуйте ещё раз!', 'error');
                }
            });
            
            // Enter для отправки
            document.getElementById('game-answer').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('submit-answer').click();
                }
            });
        };
        
        // Кнопка "Следующий вопрос"
        document.getElementById('next-question')?.addEventListener('click', () => {
            currentQuestion++;
            showQuestion();
        });
        
        showQuestion();
    }
    
    finishGame(game, score, timeSpent) {
        const modal = document.querySelector('.game-modal .modal-body');
        if (!modal) return;
        
        // Вычисляем бонус за скорость
        const timeBonus = Math.max(0, 100 - Math.floor(timeSpent / 1000));
        const totalScore = score + timeBonus;
        
        modal.innerHTML = `
            <div class="game-results">
                <div class="result-icon">🏆</div>
                <h3>Игра завершена!</h3>
                
                <div class="result-stats">
                    <div class="stat">
                        <div class="stat-label">Правильных ответов</div>
                        <div class="stat-value">${score / 100} из ${game.questions.length}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Время</div>
                        <div class="stat-value">${(timeSpent / 1000).toFixed(1)} сек</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Бонус за скорость</div>
                        <div class="stat-value">+${timeBonus} очков</div>
                    </div>
                    <div class="stat total">
                        <div class="stat-label">Общий счёт</div>
                        <div class="stat-value">${totalScore} очков</div>
                    </div>
                </div>
                
                <div class="result-actions">
                    <button class="btn btn-primary" onclick="dashboard.startGame(${game.id})">
                        <i class="fas fa-redo"></i> Играть снова
                    </button>
                    <button class="btn btn-secondary" onclick="document.querySelector('.game-modal').remove()">
                        <i class="fas fa-check"></i> Завершить
                    </button>
                </div>
            </div>
        `;
        
        // Начисляем очки
        this.core.addPoints(totalScore, `Завершение игры "${game.name}"`);
        
        // Обновляем статистику игрока
        this.updateGameStats(game.id, totalScore);
    }
    
    updateGameStats(gameId, score) {
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const userIndex = users.findIndex(u => u.id === this.core.currentUser.id);
        
        if (userIndex !== -1) {
            if (!users[userIndex].gameStats) {
                users[userIndex].gameStats = {
                    gamesPlayed: 0,
                    totalScore: 0,
                    averageScore: 0,
                    games: {}
                };
            }
            
            users[userIndex].gameStats.gamesPlayed++;
            users[userIndex].gameStats.totalScore += score;
            users[userIndex].gameStats.averageScore = 
                Math.round(users[userIndex].gameStats.totalScore / users[userIndex].gameStats.gamesPlayed);
            
            if (!users[userIndex].gameStats.games[gameId]) {
                users[userIndex].gameStats.games[gameId] = {
                    plays: 0,
                    bestScore: 0,
                    totalScore: 0
                };
            }
            
            users[userIndex].gameStats.games[gameId].plays++;
            users[userIndex].gameStats.games[gameId].totalScore += score;
            users[userIndex].gameStats.games[gameId].bestScore = 
                Math.max(users[userIndex].gameStats.games[gameId].bestScore, score);
            
            localStorage.setItem('leo_users', JSON.stringify(users));
            
            // Обновляем текущего пользователя
            this.core.currentUser = users[userIndex];
            localStorage.setItem('leo_session', JSON.stringify(users[userIndex]));
            
            // Обновляем UI
            this.loadUserData();
        }
    }
    
    // AI ПОМОЩНИК
    initAI() {
        const chatInput = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send');
        const chatMessages = document.getElementById('chat-messages');
        
        if (!chatInput || !sendBtn) return;
        
        const sendMessage = () => {
            const message = chatInput.value.trim();
            if (!message) return;
            
            // Добавляем сообщение пользователя
            this.addChatMessage(message, 'user');
            chatInput.value = '';
            
            // Показываем индикатор загрузки
            const loadingMsg = this.addChatMessage('Думаю...', 'ai', true);
            
            // Имитация задержки для реалистичности
            setTimeout(() => {
                // Убираем индикатор загрузки
                loadingMsg.remove();
                
                // Получаем ответ от AI
                const response = this.ai.process(message);
                this.addChatMessage(response, 'ai');
                
                // Автообучение AI
                if (message.length > 3 && !message.includes('привет') && !message.includes('спасибо')) {
                    this.ai.learn(message, response);
                    this.core.saveAIKnowledge();
                }
                
                // Прокрутка вниз
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 800 + Math.random() * 1200);
        };
        
        // Кнопка отправки
        sendBtn.addEventListener('click', sendMessage);
        
        // Enter для отправки
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Примеры вопросов
        document.querySelectorAll('.ai-example').forEach(example => {
            example.addEventListener('click', (e) => {
                chatInput.value = e.target.textContent;
                chatInput.focus();
            });
        });
    }
    
    addChatMessage(text, sender, isLoading = false) {
        const chatMessages = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        
        if (isLoading) {
            messageElement.className = 'chat-message ai loading';
            messageElement.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-text">
                        <span class="loading-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </div>
                </div>
            `;
        } else {
            messageElement.className = `chat-message ${sender}`;
            
            const time = new Date().toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            messageElement.innerHTML = `
                <div class="message-avatar">${sender === 'user' ? this.core.currentUser.avatar : '🤖'}</div>
                <div class="message-content">
                    <div class="message-text">${this.formatMessage(text)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        }
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageElement;
    }
    
    formatMessage(text) {
        // Простая форматировка сообщений
        return text
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }
    
    // ОБНОВЛЕНИЕ ДАННЫХ В РЕАЛЬНОМ ВРЕМЕНИ
    updateLiveClock() {
        const updateTime = () => {
            const now = new Date();
            
            // Время
            document.getElementById('current-time')?.textContent = 
                now.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
            
            // Дата
            document.getElementById('current-date')?.textContent = 
                now.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'});
            
            // Обновляем текущий урок
            this.updateCurrentLesson();
        };
        
        updateTime();
        setInterval(updateTime, 60000); // Каждую минуту
    }
    
    updateCurrentLesson() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const todayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
        const todayLessons = this.core.schedule[todayKey];
        
        if (!todayLessons) return;
        
        let currentLesson = null;
        let nextLesson = null;
        
        for (const lesson of todayLessons) {
            const [startTime, endTime] = lesson.time.split('-');
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            
            const lessonStart = startHour * 60 + startMinute;
            const lessonEnd = endHour * 60 + endMinute;
            
            if (currentTime >= lessonStart && currentTime <= lessonEnd) {
                currentLesson = lesson;
            } else if (currentTime < lessonStart && !nextLesson) {
                nextLesson = lesson;
            }
        }
        
        // Обновляем UI
        const currentEl = document.getElementById('current-lesson');
        const nextEl = document.getElementById('next-lesson');
        
        if (currentEl) {
            currentEl.textContent = currentLesson 
                ? `${currentLesson.subject} (${currentLesson.room})`
                : "Нет урока";
        }
        
        if (nextEl) {
            nextEl.textContent = nextLesson 
                ? `${nextLesson.time} ${nextLesson.subject}`
                : "—";
        }
    }
    
    updateLiveData() {
        // Обновление статистики
        this.loadUserData();
        this.updateRating();
        this.showTodaySchedule();
        this.updateCurrentLesson();
    }
    
    // НАСТРОЙКА СОБЫТИЙ
    setupEventListeners() {
        // Выход
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите выйти?')) {
                this.core.logout();
            }
        });
        
        // Обновление
        document.getElementById('refresh-btn')?.addEventListener('click', () => {
            this.updateLiveData();
            this.core.showNotification('Данные обновлены', 'info');
        });
        
        // Переключение секций
        document.querySelectorAll('[data-section]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.dataset.section;
                this.switchSection(section);
            });
        });
        
        // Быстрые действия
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]').dataset.action;
                this.handleQuickAction(action);
            });
        });
    }
    
    switchSection(section) {
        // Скрываем все секции
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Показываем выбранную
        const targetSection = document.getElementById(`section-${section}`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = section;
            
            // Обновляем активную кнопку навигации
            document.querySelectorAll('[data-section]').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.section === section) {
                    btn.classList.add('active');
                }
            });
            
            // Обновляем заголовок
            const titleMap = {
                'dashboard': 'Главная панель',
                'schedule': 'Расписание',
                'tasks': 'Задания',
                'ai': 'AI Помощник',
                'rating': 'Рейтинг класса',
                'games': 'Образовательные игры',
                'progress': 'Прогресс обучения'
            };
            
            document.getElementById('dashboard-title').textContent = 
                titleMap[section] || section;
        }
    }
    
    handleQuickAction(action) {
        switch(action) {
            case 'add-task':
                this.showTaskModal();
                break;
            case 'ask-ai':
                this.switchSection('ai');
                document.getElementById('ai-input').focus();
                break;
            case 'view-schedule':
                this.switchSection('schedule');
                break;
            case 'check-homework':
                this.switchSection('tasks');
                break;
        }
    }
    
    showTaskModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Новая задача</h3>
                <form id="task-form">
                    <input type="text" placeholder="Название задачи" required>
                    <textarea placeholder="Описание" rows="3"></textarea>
                    <select required>
                        <option value="">Выберите предмет</option>
                        <option value="math">Математика</option>
                        <option value="physics">Физика</option>
                        <option value="chemistry">Химия</option>
                        <option value="russian">Русский язык</option>
                        <option value="history">История</option>
                        <option value="other">Другое</option>
                    </select>
                    <input type="date" required>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Сохранить</button>
                        <button type="button" class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">Отмена</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчик формы
        modal.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.core.showNotification('Задача добавлена', 'success');
            modal.remove();
        });
    }
}

// Инициализация дашборда
window.dashboard = null;
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});