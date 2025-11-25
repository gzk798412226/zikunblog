class Level {
    constructor(game) {
        this.game = game;
        this.levels = [
            {
                platforms: [
                    { x: 0, y: 380, width: 800, height: 20, color: '#8B4513' },
                    { x: 200, y: 300, width: 150, height: 20, color: '#228B22' },
                    { x: 400, y: 220, width: 100, height: 20, color: '#228B22' },
                    { x: 550, y: 280, width: 120, height: 20, color: '#228B22' },
                    { x: 700, y: 200, width: 80, height: 20, color: '#228B22' }
                ],
                enemies: [
                    { x: 250, y: 250 },
                    { x: 450, y: 170 },
                    { x: 600, y: 230 }
                ],
                coins: [
                    { x: 220, y: 260 },
                    { x: 420, y: 180 },
                    { x: 570, y: 240 },
                    { x: 720, y: 160 }
                ]
            },
            {
                platforms: [
                    { x: 0, y: 380, width: 800, height: 20, color: '#8B4513' },
                    { x: 100, y: 320, width: 100, height: 20, color: '#228B22' },
                    { x: 250, y: 260, width: 80, height: 20, color: '#228B22' },
                    { x: 380, y: 200, width: 100, height: 20, color: '#228B22' },
                    { x: 530, y: 240, width: 90, height: 20, color: '#228B22' },
                    { x: 670, y: 180, width: 100, height: 20, color: '#228B22' }
                ],
                enemies: [
                    { x: 120, y: 270 },
                    { x: 270, y: 210 },
                    { x: 400, y: 150 },
                    { x: 550, y: 190 },
                    { x: 690, y: 130 }
                ],
                coins: [
                    { x: 120, y: 280 },
                    { x: 270, y: 220 },
                    { x: 420, y: 160 },
                    { x: 550, y: 200 },
                    { x: 690, y: 140 },
                    { x: 750, y: 140 }
                ]
            },
            {
                platforms: [
                    { x: 0, y: 380, width: 800, height: 20, color: '#8B4513' },
                    { x: 80, y: 340, width: 60, height: 20, color: '#228B22' },
                    { x: 180, y: 300, width: 60, height: 20, color: '#228B22' },
                    { x: 280, y: 260, width: 60, height: 20, color: '#228B22' },
                    { x: 380, y: 220, width: 60, height: 20, color: '#228B22' },
                    { x: 480, y: 180, width: 60, height: 20, color: '#228B22' },
                    { x: 580, y: 140, width: 60, height: 20, color: '#228B22' },
                    { x: 680, y: 100, width: 100, height: 20, color: '#228B22' }
                ],
                enemies: [
                    { x: 100, y: 290 },
                    { x: 200, y: 250 },
                    { x: 300, y: 210 },
                    { x: 400, y: 170 },
                    { x: 500, y: 130 },
                    { x: 600, y: 90 }
                ],
                coins: [
                    { x: 100, y: 300 },
                    { x: 200, y: 260 },
                    { x: 300, y: 220 },
                    { x: 400, y: 180 },
                    { x: 500, y: 140 },
                    { x: 600, y: 100 },
                    { x: 700, y: 60 },
                    { x: 730, y: 60 }
                ]
            }
        ];
    }
    
    generateLevel(levelNumber) {
        const levelIndex = (levelNumber - 1) % this.levels.length;
        const levelData = this.levels[levelIndex];
        
        this.game.platforms = levelData.platforms.map(platform => ({...platform}));
        
        this.game.enemies = levelData.enemies.map(enemyData => 
            new Enemy(enemyData.x, enemyData.y, this.game)
        );
        
        this.game.coins = levelData.coins.map(coinData => ({
            x: coinData.x,
            y: coinData.y,
            width: 20,
            height: 20,
            collected: false
        }));
        
        if (levelNumber > 3) {
            this.addExtraDifficulty(levelNumber);
        }
    }
    
    addExtraDifficulty(levelNumber) {
        const extraEnemies = Math.floor((levelNumber - 3) / 2);
        
        for (let i = 0; i < extraEnemies; i++) {
            const platform = this.game.platforms[Math.floor(Math.random() * this.game.platforms.length)];
            if (platform && platform.y > 50) {
                this.game.enemies.push(new Enemy(
                    platform.x + Math.random() * (platform.width - 25),
                    platform.y - 30,
                    this.game
                ));
            }
        }
        
        this.game.enemies.forEach(enemy => {
            enemy.dx *= 1 + (levelNumber - 1) * 0.1;
        });
    }
    
    createRandomLevel() {
        const platforms = [
            { x: 0, y: 380, width: 800, height: 20, color: '#8B4513' }
        ];
        const enemies = [];
        const coins = [];
        
        for (let i = 0; i < 6; i++) {
            const x = 100 + i * 120 + Math.random() * 50;
            const y = 150 + Math.random() * 150;
            const width = 80 + Math.random() * 60;
            
            platforms.push({
                x: x,
                y: y,
                width: width,
                height: 20,
                color: '#228B22'
            });
            
            if (Math.random() < 0.7) {
                enemies.push(new Enemy(x + 10, y - 30, this.game));
            }
            
            if (Math.random() < 0.8) {
                coins.push({
                    x: x + width/2 - 10,
                    y: y - 40,
                    width: 20,
                    height: 20,
                    collected: false
                });
            }
        }
        
        this.game.platforms = platforms;
        this.game.enemies = enemies;
        this.game.coins = coins;
    }
}