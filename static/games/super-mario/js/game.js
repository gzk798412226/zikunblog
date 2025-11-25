class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.gravity = 0.5;
        this.friction = 0.8;
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        this.gameRunning = false;
        this.gamePaused = false;
        
        this.keys = {};
        this.platforms = [];
        this.enemies = [];
        this.coins = [];
        this.particles = [];
        
        this.init();
    }
    
    init() {
        this.player = new Player(50, this.height - 150, this);
        this.createLevel();
        this.bindEvents();
        this.updateUI();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Enter') {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    createLevel() {
        this.platforms = [
            { x: 0, y: this.height - 20, width: this.width, height: 20, color: '#8B4513' },
            { x: 200, y: this.height - 100, width: 150, height: 20, color: '#228B22' },
            { x: 400, y: this.height - 180, width: 100, height: 20, color: '#228B22' },
            { x: 550, y: this.height - 120, width: 120, height: 20, color: '#228B22' },
            { x: 700, y: this.height - 200, width: 80, height: 20, color: '#228B22' }
        ];
        
        this.enemies = [
            new Enemy(250, this.height - 150, this),
            new Enemy(450, this.height - 230, this),
            new Enemy(600, this.height - 170, this)
        ];
        
        this.coins = [
            { x: 220, y: this.height - 140, width: 20, height: 20, collected: false },
            { x: 420, y: this.height - 220, width: 20, height: 20, collected: false },
            { x: 570, y: this.height - 160, width: 20, height: 20, collected: false },
            { x: 720, y: this.height - 240, width: 20, height: 20, collected: false }
        ];
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.player.update();
        
        this.enemies.forEach(enemy => {
            enemy.update();
            if (this.checkCollision(this.player, enemy)) {
                this.handlePlayerEnemyCollision(enemy);
            }
        });
        
        this.checkCoinCollection();
        this.updateParticles();
        
        if (this.coins.every(coin => coin.collected)) {
            this.nextLevel();
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        this.drawPlatforms();
        this.drawCoins();
        this.drawEnemies();
        this.player.draw();
        this.drawParticles();
        
        if (this.gamePaused) {
            this.drawPauseScreen();
        }
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#90EE90');
        gradient.addColorStop(1, '#228B22');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawClouds();
        this.drawHills();
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        const clouds = [
            { x: 100, y: 50, size: 30 },
            { x: 300, y: 80, size: 25 },
            { x: 600, y: 40, size: 35 }
        ];
        
        clouds.forEach(cloud => {
            this.drawCloud(cloud.x, cloud.y, cloud.size);
        });
    }
    
    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size, y, size * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.5, y - size * 0.5, size * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawHills() {
        this.ctx.fillStyle = '#32CD32';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height * 0.8);
        this.ctx.quadraticCurveTo(200, this.height * 0.6, 400, this.height * 0.8);
        this.ctx.quadraticCurveTo(600, this.height * 0.7, this.width, this.height * 0.8);
        this.ctx.lineTo(this.width, this.height);
        this.ctx.lineTo(0, this.height);
        this.ctx.fill();
    }
    
    drawPlatforms() {
        this.platforms.forEach(platform => {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            this.ctx.fillStyle = '#006400';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 5);
        });
    }
    
    drawCoins() {
        this.coins.forEach(coin => {
            if (!coin.collected) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#FFA500';
                this.ctx.beginPath();
                this.ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            enemy.draw();
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            particle.draw();
        });
    }
    
    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.width/2, this.height/2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press Enter to continue', this.width/2, this.height/2 + 50);
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    checkCoinCollection() {
        this.coins.forEach(coin => {
            if (!coin.collected && this.checkCollision(this.player, coin)) {
                coin.collected = true;
                this.score += 100;
                this.createCoinParticles(coin.x + coin.width/2, coin.y + coin.height/2);
                this.updateUI();
            }
        });
    }
    
    createCoinParticles(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push(new Particle(x, y, 'gold'));
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
    }
    
    handlePlayerEnemyCollision(enemy) {
        if (this.player.dy > 0 && this.player.y < enemy.y) {
            enemy.defeated = true;
            this.player.dy = -10;
            this.score += 200;
            this.createEnemyParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            this.updateUI();
        } else {
            this.playerHit();
        }
    }
    
    createEnemyParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, 'red'));
        }
    }
    
    playerHit() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.player.x = 50;
            this.player.y = this.height - 150;
            this.player.dx = 0;
            this.player.dy = 0;
        }
    }
    
    nextLevel() {
        this.level++;
        this.score += 500;
        this.createLevel();
        this.player.x = 50;
        this.player.y = this.height - 150;
        this.updateUI();
    }
    
    start() {
        this.gameRunning = true;
        this.gameLoop();
    }
    
    pause() {
        this.gamePaused = true;
    }
    
    resume() {
        this.gamePaused = false;
    }
    
    togglePause() {
        if (this.gameRunning) {
            this.gamePaused = !this.gamePaused;
        }
    }
    
    reset() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.particles = [];
        this.init();
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
    
    gameLoop() {
        if (this.gameRunning) {
            this.update();
            this.render();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}