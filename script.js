const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const titleText = document.getElementById('titleText');

let score = 0;
let highScore = localStorage.getItem('taptap_best') || 0;
let gameSequence = [];
let userSequence = [];
let canTap = false;
let computerSpeed = 600; // Slower so you can see it easily
let gameMode = 'simon'; 
let ballLocation = 0;

const buttons = [
    { id: 'red', color: '#ff4d4d', light: '#ff9999', x: 50, y: 50 },
    { id: 'blue', color: '#4d94ff', light: '#99c2ff', x: 210, y: 50 },
    { id: 'green', color: '#4dff4d', light: '#99ff99', x: 50, y: 210 },
    { id: 'yellow', color: '#ffff4d', light: '#ffff99', x: 210, y: 210 }
];

// 1. DRAWING FUNCTION
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameMode === 'simon') {
        buttons.forEach(btn => {
            ctx.fillStyle = btn.color;
            ctx.beginPath();
            ctx.roundRect(btn.x, btn.y, 140, 140, 25);
            ctx.fill();
        });
    } else {
        // CUP GAME VISUALS
        [60, 160, 260].forEach((x, i) => {
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.moveTo(x, 250); ctx.lineTo(x + 80, 250);
            ctx.lineTo(x + 70, 150); ctx.lineTo(x + 10, 150);
            ctx.closePath(); ctx.fill();
        });
    }
}

// 2. GLOW EFFECT (Makes screen "glow" when tapped)
function flash(id) {
    const btn = buttons.find(b => b.id === id);
    if (!btn) return;
    ctx.fillStyle = btn.light; // Use the lighter glow color
    ctx.beginPath(); 
    ctx.roundRect(btn.x, btn.y, 140, 140, 25); 
    ctx.fill();
    // Revert to normal after a short time
    setTimeout(draw, 200); 
}

// 3. COMPUTER SEQUENCE (Plays EVERYTHING for that level)
function playSequence(index) {
    canTap = false; 
    if (index >= gameSequence.length) { 
        canTap = true; 
        return; 
    }
    
    flash(gameSequence[index]);
    
    // Time between computer taps
    setTimeout(() => {
        playSequence(index + 1);
    }, computerSpeed);
}

function nextLevel() {
    userSequence = [];
    score++;
    
    // Add one new random button to the sequence
    gameSequence.push(buttons[Math.floor(Math.random() * 4)].id);
    
    // Trigger Cup Bonus every 5 levels
    if (score % 5 === 0) {
        gameMode = 'cups';
        triggerCups();
    } else {
        gameMode = 'simon';
        // Play the WHOLE sequence from the start
        setTimeout(() => playSequence(0), 500);
    }
}

// 4. THE "WEIRD" CUP GAME FIX
function triggerCups() {
    overlay.style.display = 'flex';
    titleText.innerText = "BONUS: CUP GAME";
    startBtn.innerText = "START BONUS";
    startBtn.onclick = () => {
        overlay.style.display = 'none';
        ballLocation = Math.floor(Math.random() * 3);
        draw();
        // Show the ball briefly
        const bx = [60, 160, 260][ballLocation];
        ctx.fillStyle = 'gold'; ctx.beginPath(); ctx.arc(bx + 40, 230, 15, 0, Math.PI*2); ctx.fill();
        setTimeout(() => { draw(); canTap = true; }, 1000);
    };
}

// 5. INPUT HANDLING (Your Taps)
canvas.addEventListener('mousedown', (e) => {
    if (!canTap) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (gameMode === 'simon') {
        buttons.forEach(btn => {
            if (x > btn.x && x < btn.x + 140 && y > btn.y && y < btn.y + 140) {
                flash(btn.id); // MAKE IT GLOW ON YOUR TAP
                userSequence.push(btn.id);
                
                // Check if you tapped the wrong button
                if (userSequence[userSequence.length - 1] !== gameSequence[userSequence.length - 1]) {
                    gameOver();
                } 
                // Check if you finished the sequence for this level
                else if (userSequence.length === gameSequence.length) {
                    canTap = false;
                    setTimeout(nextLevel, 800);
                }
            }
        });
    } else {
        // Cup Game logic
        [60, 160, 260].forEach((cx, i) => {
            if (x > cx && x < cx + 80 && y > 150 && y < 250) {
                if (i === ballLocation) { score += 4; nextLevel(); }
                else gameOver();
            }
        });
    }
});

function gameOver() {
    canTap = false;
    overlay.style.display = 'flex';
    titleText.innerHTML = `ELIMINATED<br><span style="color:gold;">BEST: ${highScore} | LEVEL: ${score}</span>`;
    
    document.querySelectorAll('.new-btn').forEach(b => b.remove());

    const wa = document.createElement('button');
    wa.className = 'new-btn';
    wa.innerText = "SHARE ON WHATSAPP 🚀";
    wa.style.cssText = "display:block; width:220px; margin:10px auto; padding:15px; background:#25D366; color:white; border:none; border-radius:10px; font-weight:bold;";
    wa.onclick = () => window.open(`https://wa.me/?text=I hit Level ${score}! Beat me: ${window.location.href}`);
    overlay.insertBefore(wa, startBtn);

    startBtn.innerText = "RESTART";
    startBtn.onclick = () => location.reload();
    if (score > highScore) localStorage.setItem('taptap_best', score);
}

draw();
overlay.style.display = 'flex';
startBtn.onclick = () => { overlay.style.display = 'none'; nextLevel(); };
