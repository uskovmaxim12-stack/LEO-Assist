// neural-animation.js - АНИМАЦИЯ НЕЙРОСЕТИ НА ФОНЕ
class NeuralAnimation {
    constructor() {
        this.canvas = document.getElementById('neural-canvas');
        if (!this.canvas) {
            console.warn('Canvas для нейросети не найден');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.neurons = [];
        this.connections = [];
        this.mouse = { x: 0, y: 0 };
        
        this.init();
        this.animate();
        
        // Ресайз
        window.addEventListener('resize', () => this.resize());
    }
    
    init() {
        // Устанавливаем размеры канваса
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Создаём нейроны
        this.createNeurons(15);
        this.createConnections();
        
        // Слушаем движение мыши
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        console.log('✅ Анимация нейросети инициализирована');
    }
    
    createNeurons(count) {
        this.neurons = [];
        
        for (let i = 0; i < count; i++) {
            this.neurons.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 3 + Math.random() * 4,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: this.getRandomColor(),
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    getRandomColor() {
        const colors = [
            '#00c6ff', // синий
            '#0072ff', // голубой
            '#ff0080', // розовый
            '#00ff88', // зеленый
            '#ffcc00'  // желтый
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createConnections() {
        this.connections = [];
        
        // Создаём связи между близкими нейронами
        for (let i = 0; i < this.neurons.length; i++) {
            for (let j = i + 1; j < this.neurons.length; j++) {
                const dx = this.neurons[i].x - this.neurons[j].x;
                const dy = this.neurons[i].y - this.neurons[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Создаём связь если нейроны близко
                if (distance < 150) {
                    this.connections.push({
                        neuron1: i,
                        neuron2: j,
                        strength: 1 - (distance / 150),
                        pulse: Math.random() * Math.PI * 2,
                        pulseSpeed: 0.01 + Math.random() * 0.02
                    });
                }
            }
        }
    }
    
    update() {
        // Обновляем нейроны
        for (let neuron of this.neurons) {
            // Двигаем нейроны
            neuron.x += neuron.speedX;
            neuron.y += neuron.speedY;
            
            // Отталкивание от краёв
            if (neuron.x < 0 || neuron.x > this.canvas.width) neuron.speedX *= -1;
            if (neuron.y < 0 || neuron.y > this.canvas.height) neuron.speedY *= -1;
            
            // Пульсация
            neuron.pulse += neuron.pulseSpeed;
            
            // Взаимодействие с мышью
            const dx = neuron.x - this.mouse.x;
            const dy = neuron.y - this.mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                neuron.x += (dx / distance) * force * 2;
                neuron.y += (dy / distance) * force * 2;
            }
        }
        
        // Обновляем связи
        for (let connection of this.connections) {
            connection.pulse += connection.pulseSpeed;
            
            // Проверяем расстояние между нейронами
            const neuron1 = this.neurons[connection.neuron1];
            const neuron2 = this.neurons[connection.neuron2];
            const dx = neuron1.x - neuron2.x;
            const dy = neuron1.y - neuron2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Удаляем связь если нейроны далеко
            if (distance > 200) {
                connection.strength = 0;
            }
        }
        
        // Удаляем слабые связи
        this.connections = this.connections.filter(c => c.strength > 0.1);
        
        // Создаём новые связи
        if (Math.random() < 0.02) {
            this.createNewConnection();
        }
    }
    
    createNewConnection() {
        // Ищем два случайных нейрона
        const i = Math.floor(Math.random() * this.neurons.length);
        const j = Math.floor(Math.random() * this.neurons.length);
        
        if (i !== j) {
            const dx = this.neurons[i].x - this.neurons[j].x;
            const dy = this.neurons[i].y - this.neurons[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 200) {
                this.connections.push({
                    neuron1: i,
                    neuron2: j,
                    strength: 1 - (distance / 200),
                    pulse: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.01 + Math.random() * 0.02
                });
            }
        }
    }
    
    draw() {
        // Очищаем канвас
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем связи
        for (let connection of this.connections) {
            const neuron1 = this.neurons[connection.neuron1];
            const neuron2 = this.neurons[connection.neuron2];
            
            // Пульсация прозрачности
            const alpha = 0.3 + Math.sin(connection.pulse) * 0.2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(neuron1.x, neuron1.y);
            this.ctx.lineTo(neuron2.x, neuron2.y);
            this.ctx.strokeStyle = `rgba(0, 198, 255, ${alpha * connection.strength})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        // Рисуем нейроны
        for (let neuron of this.neurons) {
            // Пульсация размера
            const pulseSize = Math.sin(neuron.pulse) * 1.5;
            
            // Градиент для нейрона
            const gradient = this.ctx.createRadialGradient(
                neuron.x, neuron.y, 0,
                neuron.x, neuron.y, neuron.size + pulseSize
            );
            
            gradient.addColorStop(0, neuron.color);
            gradient.addColorStop(1, neuron.color + '00');
            
            this.ctx.beginPath();
            this.ctx.arc(neuron.x, neuron.y, neuron.size + pulseSize, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Яркое ядро
            this.ctx.beginPath();
            this.ctx.arc(neuron.x, neuron.y, 1.5, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();
        }
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
    
    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.createNeurons(15);
        this.createConnections();
    }
}

// Запуск анимации
let neuralAnimation;
document.addEventListener('DOMContentLoaded', () => {
    neuralAnimation = new NeuralAnimation();
});
