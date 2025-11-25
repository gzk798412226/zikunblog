let game;
let levelManager;

document.addEventListener('DOMContentLoaded', function() {
    initGame();
    bindEvents();
});

function initGame() {
    game = new Game();
    levelManager = new Level(game);
    window.game = game;
    
    game.createLevel = function() {
        levelManager.generateLevel(this.level);
    };
    
    game.render();
}

function bindEvents() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const restartBtn = document.getElementById('restartBtn');
    
    startBtn.addEventListener('click', () => {
        if (!game.gameRunning) {
            game.start();
            startBtn.textContent = 'Running...';
            startBtn.disabled = true;
        }
    });
    
    pauseBtn.addEventListener('click', () => {
        if (game.gameRunning) {
            if (game.gamePaused) {
                game.resume();
                pauseBtn.textContent = 'Pause';
            } else {
                game.pause();
                pauseBtn.textContent = 'Resume';
            }
        }
    });
    
    resetBtn.addEventListener('click', () => {
        resetGame();
    });
    
    restartBtn.addEventListener('click', () => {
        document.getElementById('gameOverScreen').classList.add('hidden');
        resetGame();
        game.start();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyR') {
            resetGame();
        }
        
        if (e.code === 'KeyP') {
            if (game.gameRunning) {
                if (game.gamePaused) {
                    game.resume();
                    pauseBtn.textContent = 'Pause';
                } else {
                    game.pause();
                    pauseBtn.textContent = 'Resume';
                }
            }
        }
        
        if (e.code === 'KeyS' && !game.gameRunning) {
            game.start();
            startBtn.textContent = 'Running...';
            startBtn.disabled = true;
        }
    });
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game.gameRunning && !game.gamePaused) {
            game.pause();
            pauseBtn.textContent = 'Resume';
        }
    });
}

function resetGame() {
    game.reset();
    document.getElementById('startBtn').textContent = 'Start Game';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').textContent = 'Pause';
}

function showInstructions() {
    const instructions = `
    🎮 Super Mario HTML5 Game Instructions:
    
    🏃‍♂️ Movement:
    • Use ← → arrow keys or A/D to move left/right
    • Press Space, ↑ arrow, or W to jump
    
    🎯 Objective:
    • Collect all gold coins to complete the level
    • Jump on enemies (Goombas) to defeat them
    • Avoid touching enemies from the side
    
    ⚡ Controls:
    • Enter: Start/Pause game
    • P: Pause/Resume
    • R: Reset game
    • S: Start game (when stopped)
    
    🏆 Scoring:
    • Coin: 100 points
    • Defeated enemy: 200 points
    • Level completion: 500 points
    
    ❤️ Lives:
    • You start with 3 lives
    • Lose a life when hit by enemy or fall off screen
    • Game over when all lives are lost
    
    🎊 Have fun playing!
    `;
    
    alert(instructions);
}

window.addEventListener('load', () => {
    setTimeout(() => {
        showInstructions();
    }, 1000);
});