class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.dx = 0;
        this.dy = 0;
        this.speed = 5;
        this.jumpPower = 15;
        this.onGround = false;
        this.game = game;
        this.facing = 'right';
        this.animationFrame = 0;
        this.animationTimer = 0;
    }
    
    update() {
        this.handleInput();
        this.applyPhysics();
        this.checkPlatformCollisions();
        this.checkBounds();
        this.updateAnimation();
    }
    
    handleInput() {
        if (this.game.keys['ArrowLeft'] || this.game.keys['KeyA']) {
            this.dx = -this.speed;
            this.facing = 'left';
        } else if (this.game.keys['ArrowRight'] || this.game.keys['KeyD']) {
            this.dx = this.speed;
            this.facing = 'right';
        } else {
            this.dx *= this.game.friction;
        }
        
        if ((this.game.keys['Space'] || this.game.keys['ArrowUp'] || this.game.keys['KeyW']) && this.onGround) {
            this.dy = -this.jumpPower;
            this.onGround = false;
        }
    }
    
    applyPhysics() {
        this.dy += this.game.gravity;
        this.x += this.dx;
        this.y += this.dy;
    }
    
    checkPlatformCollisions() {
        this.onGround = false;
        
        this.game.platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                if (this.dy > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.dy = 0;
                    this.onGround = true;
                } else if (this.dy < 0 && this.y > platform.y) {
                    this.y = platform.y + platform.height;
                    this.dy = 0;
                } else if (this.dx > 0) {
                    this.x = platform.x - this.width;
                    this.dx = 0;
                } else if (this.dx < 0) {
                    this.x = platform.x + platform.width;
                    this.dx = 0;
                }
            }
        });
    }
    
    checkBounds() {
        if (this.x < 0) {
            this.x = 0;
            this.dx = 0;
        }
        if (this.x + this.width > this.game.width) {
            this.x = this.game.width - this.width;
            this.dx = 0;
        }
        
        if (this.y > this.game.height) {
            this.game.playerHit();
        }
    }
    
    updateAnimation() {
        this.animationTimer++;
        if (this.animationTimer > 10) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }
    
    draw() {
        const ctx = this.game.ctx;
        
        ctx.save();
        
        if (this.facing === 'left') {
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.width, 0);
        } else {
            ctx.translate(this.x, 0);
        }
        
        this.drawMario(ctx);
        
        ctx.restore();
    }
    
    drawMario(ctx) {
        const x = this.facing === 'left' ? 0 : 0;
        const y = this.y;
        
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + 8, y + 5, 14, 8);
        
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(x + 6, y + 8, 18, 12);
        
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(x + 4, y + 15, 22, 15);
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 8, y + 30, 6, 10);
        ctx.fillRect(x + 16, y + 30, 6, 10);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 10, y + 10, 2, 2);
        ctx.fillRect(x + 18, y + 10, 2, 2);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 12, y + 12, 6, 2);
        
        if (Math.abs(this.dx) > 0.5 && this.onGround) {
            const offset = this.animationFrame % 2 === 0 ? 0 : 2;
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + 8 + offset, y + 30, 6, 10);
            ctx.fillRect(x + 16 - offset, y + 30, 6, 10);
        }
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 6, y + 20, 4, 4);
        ctx.fillRect(x + 20, y + 20, 4, 4);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 8, y + 25, 4, 3);
        ctx.fillRect(x + 18, y + 25, 4, 3);
    }
}