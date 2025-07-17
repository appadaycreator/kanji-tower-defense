import { kanjiDatabase } from './words.js';

// グローバル変数
let canvas, ctx;
let gameState = {
    isPlaying: false,
    isPaused: false,
    wave: 1,
    score: 0,
    gold: 100,
    castleHP: 100,
    maxHP: 100,
    accuracy: 100,
    correctAnswers: 0,
    totalAnswers: 0,
    kills: 0,
    level: 'grade1'
};
let enemies = [];
let towers = [];
let bullets = [];
let particles = [];
let currentEnemy = null;
let gameLoop;
let waveTimer = 0;
let spawnTimer = 0;
const gamePath = [
    {x: 0, y: 300},
    {x: 150, y: 300},
    {x: 150, y: 150},
    {x: 350, y: 150},
    {x: 350, y: 450},
    {x: 550, y: 450},
    {x: 550, y: 300},
    {x: 800, y: 300}
];

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    canvas.addEventListener('click', handleCanvasClick);
    document.getElementById('kanjiInput').addEventListener('keypress', handleKeyPress);
    window.addEventListener('resize', resizeCanvas);
    loadSettings();
    gameLoop = setInterval(update, 1000/60);
    drawGame();
}
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = Math.min(container.offsetWidth - 40, 800);
    const maxHeight = Math.min(window.innerHeight * 0.6, 600);
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    updatePathForSize(maxWidth, maxHeight);
}
function updatePathForSize(width, height) {
    const scaleX = width / 800;
    const scaleY = height / 600;
    gamePath.forEach(point => {
        point.x = Math.min(point.x * scaleX, width - 50);
        point.y = Math.min(point.y * scaleY, height - 50);
    });
}
function startGame() {
    gameState.isPlaying = true;
    gameState.isPaused = false;
    document.getElementById('kanjiInput').disabled = false;
    spawnEnemy();
    showMessage('ゲーム開始！敵を撃退しよう！', 'success');
    updateDisplay();
}
function pauseGame() {
    gameState.isPaused = !gameState.isPaused;
    showMessage(gameState.isPaused ? 'ゲーム一時停止' : 'ゲーム再開', 'info');
}
function resetGame() {
    gameState = {
        isPlaying: false,
        isPaused: false,
        wave: 1,
        score: 0,
        gold: 100,
        castleHP: 100,
        maxHP: 100,
        accuracy: 100,
        correctAnswers: 0,
        totalAnswers: 0,
        kills: 0,
        level: gameState.level
    };
    enemies = [];
    towers = [];
    bullets = [];
    particles = [];
    currentEnemy = null;
    waveTimer = 0;
    spawnTimer = 0;
    document.getElementById('kanjiInput').disabled = true;
    document.getElementById('kanjiInput').value = '';
    document.getElementById('currentKanji').textContent = '準備中...';
    document.getElementById('kanjiInfo').textContent = 'ゲームを開始してください';
    updateDisplay();
    drawGame();
    showMessage('ゲームをリセットしました', 'info');
}
function spawnEnemy() {
    const kanjiData = getRandomKanji();
    const enemy = {
        id: Date.now(),
        x: gamePath[0].x,
        y: gamePath[0].y,
        pathIndex: 0,
        kanji: kanjiData.kanji,
        reading: kanjiData.reading,
        meaning: kanjiData.meaning,
        hp: 100,
        maxHP: 100,
        speed: 1 + (gameState.wave * 0.1),
        color: getRandomColor(),
        size: 30
    };
    enemies.push(enemy);
    if (!currentEnemy) setCurrentEnemy(enemy);
}
function setCurrentEnemy(enemy) {
    currentEnemy = enemy;
    document.getElementById('currentKanji').textContent = enemy.kanji;
    document.getElementById('kanjiInfo').textContent = `${enemy.meaning} の読み方は？`;
    document.getElementById('kanjiInput').value = '';
    document.getElementById('kanjiInput').focus();
}
function getRandomKanji() {
    const levelData = kanjiDatabase[gameState.level];
    return levelData[Math.floor(Math.random() * levelData.length)];
}
function getRandomColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
    return colors[Math.floor(Math.random() * colors.length)];
}
function placeTower(x, y) {
    if (gameState.gold >= 50) {
        const tower = {
            x: x,
            y: y,
            range: 100,
            damage: 25,
            fireRate: 60,
            lastFire: 0,
            color: '#ffd93d'
        };
        towers.push(tower);
        gameState.gold -= 50;
        showMessage('タワーを設置しました！', 'success');
        updateDisplay();
    } else {
        showMessage('ゴールドが足りません！', 'error');
    }
}
function checkAnswer() {
    const input = document.getElementById('kanjiInput').value.trim();
    if (!input || !currentEnemy) return;
    gameState.totalAnswers++;
    if (input === currentEnemy.reading) {
        gameState.correctAnswers++;
        gameState.score += 100;
        gameState.gold += 20;
        gameState.kills++;
        const enemyIndex = enemies.indexOf(currentEnemy);
        if (enemyIndex > -1) enemies.splice(enemyIndex, 1);
        createParticles(currentEnemy.x, currentEnemy.y, '#51cf66');
        if (enemies.length > 0) {
            setCurrentEnemy(enemies[0]);
        } else {
            currentEnemy = null;
            document.getElementById('currentKanji').textContent = '準備中...';
            document.getElementById('kanjiInfo').textContent = '次の敵を待機中...';
        }
        showMessage('正解！敵を倒しました！', 'success');
        document.getElementById('kanjiInput').classList.add('correct-animation');
        setTimeout(() => {
            document.getElementById('kanjiInput').classList.remove('correct-animation');
        }, 500);
    } else {
        currentEnemy.hp -= 25;
        showMessage(`不正解！正解は「${currentEnemy.reading}」です`, 'error');
        document.getElementById('kanjiInput').classList.add('wrong-animation');
        setTimeout(() => {
            document.getElementById('kanjiInput').classList.remove('wrong-animation');
        }, 500);
    }
    gameState.accuracy = Math.round((gameState.correctAnswers / gameState.totalAnswers) * 100);
    document.getElementById('kanjiInput').value = '';
    updateDisplay();
}
function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            color: color,
            life: 30,
            maxLife: 30
        });
    }
}
function update() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    updateEnemies();
    updateTowers();
    updateBullets();
    updateParticles();
    spawnTimer++;
    if (spawnTimer > 120 && enemies.length < 3) {
        spawnEnemy();
        spawnTimer = 0;
    }
    waveTimer++;
    if (waveTimer > 1800) {
        gameState.wave++;
        waveTimer = 0;
        showMessage(`ウェーブ ${gameState.wave} 開始！`, 'info');
    }
    if (gameState.castleHP <= 0) {
        gameOver();
    }
    drawGame();
    updateDisplay();
}
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        if (enemy.pathIndex < gamePath.length - 1) {
            const targetPoint = gamePath[enemy.pathIndex + 1];
            const dx = targetPoint.x - enemy.x;
            const dy = targetPoint.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < enemy.speed) {
                enemy.pathIndex++;
                enemy.x = targetPoint.x;
                enemy.y = targetPoint.y;
            } else {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        } else {
            gameState.castleHP -= 10;
            enemies.splice(index, 1);
            if (enemy === currentEnemy) {
                if (enemies.length > 0) {
                    setCurrentEnemy(enemies[0]);
                } else {
                    currentEnemy = null;
                    document.getElementById('currentKanji').textContent = '準備中...';
                    document.getElementById('kanjiInfo').textContent = '次の敵を待機中...';
                }
            }
            showMessage('敵が城に到達！HPが減少！', 'error');
        }
        if (enemy.hp <= 0) {
            enemies.splice(index, 1);
            gameState.score += 50;
            gameState.kills++;
            if (enemy === currentEnemy) {
                if (enemies.length > 0) {
                    setCurrentEnemy(enemies[0]);
                } else {
                    currentEnemy = null;
                    document.getElementById('currentKanji').textContent = '準備中...';
                    document.getElementById('kanjiInfo').textContent = '次の敵を待機中...';
                }
            }
            createParticles(enemy.x, enemy.y, '#ff6b6b');
        }
    });
}
function updateTowers() {
    towers.forEach(tower => {
        tower.lastFire++;
        if (tower.lastFire >= tower.fireRate) {
            const target = enemies.find(enemy => {
                const dx = enemy.x - tower.x;
                const dy = enemy.y - tower.y;
                return Math.sqrt(dx * dx + dy * dy) <= tower.range;
            });
            if (target) {
                bullets.push({
                    x: tower.x,
                    y: tower.y,
                    targetX: target.x,
                    targetY: target.y,
                    speed: 5,
                    damage: tower.damage,
                    target: target
                });
                tower.lastFire = 0;
                tower.shooting = true;
                setTimeout(() => {
                    tower.shooting = false;
                }, 200);
            }
        }
    });
}
function updateBullets() {
    bullets.forEach((bullet, index) => {
        const dx = bullet.targetX - bullet.x;
        const dy = bullet.targetY - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < bullet.speed || distance < 5) {
            if (bullet.target && enemies.includes(bullet.target)) {
                bullet.target.hp -= bullet.damage;
                createParticles(bullet.target.x, bullet.target.y, '#ffd93d');
            }
            bullets.splice(index, 1);
        } else {
            bullet.x += (dx / distance) * bullet.speed;
            bullet.y += (dy / distance) * bullet.speed;
        }
    });
}
function updateParticles() {
    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}
function drawGame() {
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPath();
    drawCastle();
    drawTowers();
    drawEnemies();
    drawBullets();
    drawParticles();
    drawUI();
}
function drawPath() {
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(gamePath[0].x, gamePath[0].y);
    for (let i = 1; i < gamePath.length; i++) {
        ctx.lineTo(gamePath[i].x, gamePath[i].y);
    }
    ctx.stroke();
}
function drawCastle() {
    const castle = gamePath[gamePath.length - 1];
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(castle.x - 25, castle.y - 25, 50, 50);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(castle.x - 15, castle.y - 35, 30, 20);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(castle.x - 5, castle.y - 40, 10, 15);
    const hpRatio = gameState.castleHP / gameState.maxHP;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(castle.x - 30, castle.y - 45, 60, 8);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(castle.x - 30, castle.y - 45, 60 * hpRatio, 8);
}
function drawTowers() {
    towers.forEach(tower => {
        ctx.strokeStyle = 'rgba(255, 217, 61, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = tower.shooting ? '#f59e0b' : tower.color;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 8, 0, Math.PI * 2);
        ctx.fill();
    });
}
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '20px "Noto Sans JP"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.kanji, enemy.x, enemy.y);
        const hpRatio = enemy.hp / enemy.maxHP;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(enemy.x - 20, enemy.y - 35, 40, 6);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(enemy.x - 20, enemy.y - 35, 40 * hpRatio, 6);
        if (enemy === currentEnemy) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
}
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.x - bullet.speed, bullet.y - bullet.speed);
        ctx.stroke();
    });
}
function drawParticles() {
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}
function drawUI() {
    if (gameState.isPlaying) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
}
function handleCanvasClick(event) {
    if (!gameState.isPlaying) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = Math.floor(x / 40) * 40 + 20;
    const gridY = Math.floor(y / 40) * 40 + 20;
    if (!isOnPath(gridX, gridY)) {
        placeTower(gridX, gridY);
    }
}
function isOnPath(x, y) {
    for (let i = 0; i < gamePath.length - 1; i++) {
        const start = gamePath[i];
        const end = gamePath[i + 1];
        const distance = distanceToLineSegment(x, y, start.x, start.y, end.x, end.y);
        if (distance < 30) return true;
    }
    return false;
}
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projection = {
        x: x1 + t * dx,
        y: y1 + t * dy
    };
    return Math.sqrt((px - projection.x) * (px - projection.x) + (py - projection.y) * (py - projection.y));
}
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        checkAnswer();
    }
}
function updateDisplay() {
    document.getElementById('waveDisplay').textContent = gameState.wave;
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('goldDisplay').textContent = gameState.gold;
    document.getElementById('hpDisplay').textContent = gameState.castleHP;
    document.getElementById('accuracyDisplay').textContent = gameState.accuracy + '%';
}
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('messageDisplay');
    messageDiv.textContent = message;
    messageDiv.className = `message-display ${type}`;
    messageDiv.classList.add('show');
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 3000);
}
function gameOver() {
    gameState.isPlaying = false;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalWave').textContent = gameState.wave;
    document.getElementById('finalAccuracy').textContent = gameState.accuracy + '%';
    document.getElementById('finalKills').textContent = gameState.kills;
    document.getElementById('gameOverModal').classList.add('show');
    saveGameRecord();
}
function restartGame() {
    document.getElementById('gameOverModal').classList.remove('show');
    resetGame();
}
function saveGameRecord() {
    const record = {
        score: gameState.score,
        wave: gameState.wave,
        accuracy: gameState.accuracy,
        kills: gameState.kills,
        level: gameState.level,
        date: new Date().toISOString()
    };
    let records = JSON.parse(localStorage.getItem('kanjiTowerDefenseRecords') || '[]');
    records.push(record);
    records.sort((a, b) => b.score - a.score);
    records = records.slice(0, 10);
    localStorage.setItem('kanjiTowerDefenseRecords', JSON.stringify(records));
}
function loadSettings() {
    const savedSettings = localStorage.getItem('kanjiTowerDefenseSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        gameState.level = settings.level || 'grade1';
        setLevel(gameState.level);
    }
}
function saveSettings() {
    const settings = {
        level: gameState.level
    };
    localStorage.setItem('kanjiTowerDefenseSettings', JSON.stringify(settings));
}
function setLevel(level, event) {
    gameState.level = level;
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        const btn = document.querySelector(`.level-btn[onclick*="setLevel('${level}'"]`);
        if (btn) btn.classList.add('active');
    }
    saveSettings();
}
function showHint() {
    if (currentEnemy) {
        const hint = `ヒント: ${currentEnemy.meaning} (${currentEnemy.kanji})`;
        showMessage(hint, 'info');
    } else {
        showMessage('現在対象の敵がいません', 'info');
    }
}
function shareResult() {
    const text = `🏯 漢字タワーディフェンス「文字城防衛」\n\n📊 結果:\n` +
                 `スコア: ${gameState.score}\n` +
                 `ウェーブ: ${gameState.wave}\n` +
                 `正答率: ${gameState.accuracy}%\n` +
                 `撃破数: ${gameState.kills}\n\n` +
                 `#漢字ゲーム #学習ゲーム #タワーディフェンス\n` +
                 `https://appadaycreator.github.io/kanji-tower-defense/`;
    if (navigator.share) {
        navigator.share({
            title: '漢字タワーディフェンス「文字城防衛」',
            text: text,
            url: 'https://appadaycreator.github.io/kanji-tower-defense/'
        });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showMessage('結果をクリップボードにコピーしました！', 'success');
        }).catch(() => {
            showMessage('共有に失敗しました', 'error');
        });
    }
}
window.setLevel = setLevel;
window.startGame = startGame;
window.pauseGame = pauseGame;
window.resetGame = resetGame;
window.showHint = showHint;
window.shareResult = shareResult;
window.checkAnswer = checkAnswer;
window.restartGame = restartGame;
window.addEventListener('load', init); 