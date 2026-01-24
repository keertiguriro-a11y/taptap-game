const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const overlay = document.getElementById('overlay');
const scoreDisplay = document.getElementById('score');
const hintText = document.getElementById('hintText');
const timerBar = document.getElementById('timer-bar');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playNote(frequency) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

const colors = {
    red: { normal: '#ff4d4d', bright: '#ffcccc', x: 0, y: 0, note: 329.63 },
    blue: { normal: '#4d94ff', bright: '#cce0ff', x: 200, y: 0, note: 261.63 },
    green: { normal: '#4dff88', bright: '#ccffdd', x: 0, y: 200, note: 392.00 },
    yellow: { normal: '#ffff4d', bright: '#ffffcc', x: 200, y: 200, note: 220.00 }
};

let sequence = [];
let playerSequence = [];
let score = 0;
let acceptingInput = false;
let timeLeft = 100;
let timerInterval;
let gameSpeed = 1000;
let lastTapTime = 0;
let rotationAngle = 0;

function drawBoard(highlightColor = null) {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Board starts rotating slowly at score 10 for "Hard Mode"
    if (score >= 10) {
        rotationAngle += 0.008; 
        ctx.translate(200, 200);
        ctx.rotate(rotationAngle);
        ctx.translate(-200, -200);
    }

    for (let key in colors) {
        const color = colors[key];
        ctx.fillStyle = (highlightColor === key) ? color.bright : color.normal;
        ctx.fillRect(color.x, color.y, 200, 200);
    }
    
    ctx.strokeStyle = '#121212';
    ctx.lineWidth = 15;
    ctx.strokeRect(0,0,400,400);
    ctx.beginPath();
    ctx.moveTo(200, 0); ctx.lineTo(200, 400);
    ctx.moveTo(0, 200); ctx.lineTo(400, 200);
    ctx.stroke();
    ctx.restore();

    // Re-draw if board is rotating to keep animation smooth
    if (rotationAngle > 0 && acceptingInput) {
        requestAnimationFrame(() => drawBoard());
    }
}

function flashColor(colorKey) {
    playNote(colors[colorKey].note);
    drawBoard(colorKey);
    setTimeout(() => drawBoard(), 300); 
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 100;
    // ADJUSTED: Multiplier increased from 10 to 15 for a slower drain
    const timerDifficulty = Math.max(15, gameSpeed / 15); 
    timerInterval = setInterval(() => {
        timeLeft -= 1;
        timerBar.style.width = timeLeft + "%";
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            gameOver("TIME OUT!");
        }
    }, timerDifficulty);
}

function playSequence() {
    acceptingInput = false;
    let i = 0;
    const interval = setInterval(() => {
        flashColor(sequence[i]);
        i++;
        if (i >= sequence.length) {
            clearInterval(interval);
            setTimeout(() => { 
                acceptingInput = true; 
                hintText.innerText = "GO!";
                startTimer();
                lastTapTime = Date.now(); 
            }, 500);
        }
    }, gameSpeed);
}

function getRank(s) {
    if (s < 5) return "Subject 001 👤";
    if (s < 10) return "Survivor 🏃";
    if (s < 15) return "Elite Player 🏅";
    return "The Leader 👑";
}

function nextLevel() {
    playerSequence = [];
    const keys = Object.keys(colors);
    const randomColor = keys[Math.floor(Math.random() * keys.length)];
    sequence.push(randomColor);
    
    const turnDuration = Date.now() - lastTapTime;
    
    if (score > 0) {
        if (turnDuration < 2000) { 
            // Small speed-up for pro players
            gameSpeed = Math.max(400, gameSpeed - 50); 
            hintText.innerText = "NICE PACE! ⚡";
        } else if (turnDuration > 5000) {
            // Help the player if they were slow
            gameSpeed = Math.min(1200, gameSpeed + 50);
            hintText.innerText = "Breathing room... ✨";
        } else {
            // Very subtle difficulty increase
            gameSpeed = Math.max(400, gameSpeed - 10);
            hintText.innerText = `Rank: ${getRank(score)}`;
        }
    }
    setTimeout(playSequence, 800);
}

function gameOver(reason = "ELIMINATED") {
    clearInterval(timerInterval);
    acceptingInput = false;
    overlay.classList.remove('hidden');
    document.getElementById('titleText').innerText = reason;
    document.getElementById('subText').innerText = `Final Rank: ${getRank(score)}`;
    startBtn.innerText = "RESTART MISSION";
}

const handleInput = (e) => {
    if (!acceptingInput) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Detect color quadrant based on click
    let clickedColor = "";
    if (x < 200 && y < 200) clickedColor = "red";
    else if (x >= 200 && y < 200) clickedColor = "blue";
    else if (x < 200 && y >= 200) clickedColor = "green";
    else if (x >= 200 && y >= 200) clickedColor = "yellow";

    flashColor(clickedColor);

    if (clickedColor === sequence[playerSequence.length]) {
        playerSequence.push(clickedColor);
        if (playerSequence.length === sequence.length) {
            score++;
            scoreDisplay.innerText = score;
            clearInterval(timerInterval);
            setTimeout(nextLevel, 600);
        }
    } else {
        gameOver();
    }
};

canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(e); });

startBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    score = 0; sequence = []; gameSpeed = 1000; rotationAngle = 0;
    scoreDisplay.innerText = score;
    overlay.classList.add('hidden');
    nextLevel();
});

drawBoard();