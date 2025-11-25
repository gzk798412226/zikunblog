class Enemy {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.dx = -1;
        this.dy = 0;
        this.game = game;
        this.defeated = false;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.patrolDistance = 100;
        this.startX = x;
    }
    
    update() {
        if (this.defeated) return;
        
        this.move();
        this.applyPhysics();
        this.checkPlatformCollisions();
        this.checkPatrolBounds();
        this.updateAnimation();
    }
    
    move() {
        this.x += this.dx;
    }
    
    applyPhysics() {
        this.dy += this.game.gravity;
        this.y += this.dy;
    }
    
    checkPlatformCollisions() {
        let onGround = false;
        
        this.game.platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                if (this.dy > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.dy = 0;
                    onGround = true;
                } else if (this.dy < 0 && this.y > platform.y) {
                    this.y = platform.y + platform.height;
                    this.dy = 0;
                } else if (this.dx > 0) {
                    this.x = platform.x - this.width;
                    this.dx = -Math.abs(this.dx);
                } else if (this.dx < 0) {
                    this.x = platform.x + platform.width;
                    this.dx = Math.abs(this.dx);
                }
            }
        });
        
        if (!onGround && this.y > this.game.height) {
            this.defeated = true;
        }
    }
    
    checkPatrolBounds() {
        if (this.x <= this.startX - this.patrolDistance) {
            this.dx = Math.abs(this.dx);
        } else if (this.x >= this.startX + this.patrolDistance) {
            this.dx = -Math.abs(this.dx);
        }
        
        if (this.x < 0) {
            this.x = 0;
            this.dx = Math.abs(this.dx);
        }
        if (this.x + this.width > this.game.width) {
            this.x = this.game.width - this.width;
            this.dx = -Math.abs(this.dx);
        }
    }
    
    updateAnimation() {
        this.animationTimer++;
        if (this.animationTimer > 15) {
            this.animationFrame = (this.animationFrame + 1) % 2;
            this.animationTimer = 0;
        }
    }
    
    draw() {
        if (this.defeated) return;
        
        const ctx = this.game.ctx;
        
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        this.drawGoomba(ctx);
        
        ctx.restore();
    }
    
    drawGoomba(ctx) {
        const size = this.width / 2;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-size, -size, size * 2, size * 1.5);
        
        ctx.fillStyle = '#654321';
        ctx.fillRect(-size * 0.8, -size * 0.8, size * 1.6, size);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(-size * 0.6, -size * 0.6, size * 0.3, size * 0.3);
        ctx.fillRect(size * 0.3, -size * 0.6, size * 0.3, size * 0.3);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-size * 0.5, -size * 0.3, size, size * 0.2);
        
        const eyeOffset = this.animationFrame === 0 ? 0 : 2;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-size * 0.3 + eyeOffset, -size * 0.2, size * 0.2, size * 0.1);
        ctx.fillRect(size * 0.1 - eyeOffset, -size * 0.2, size * 0.2, size * 0.1);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(-size * 0.9, size * 0.3, size * 0.4, size * 0.4);
        ctx.fillRect(size * 0.5, size * 0.3, size * 0.4, size * 0.4);
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.dx = (Math.random() - 0.5) * 8;
        this.dy = Math.random() * -8 - 2;
        this.life = 60;
        this.maxLife = 60;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }
    
    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.dy += 0.3;
        this.life--;
        this.dx *= 0.98;
    }
    
    draw() {
        const game = window.game;
        const ctx = game.ctx;
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (this.color === 'gold') {
            ctx.fillStyle = '#FFD700';
        } else if (this.color === 'red') {
            ctx.fillStyle = '#FF4444';
        } else {
            ctx.fillStyle = this.color;
        }
        
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        
        ctx.restore();
    }
}