const securityCard = document.getElementById("securityCard");
const terminalContainer = document.getElementById("terminalContainer");
const loginContainer = document.getElementById("loginContainer");
const gameContainer = document.getElementById("gameContainer");

let isDragging = false;
let startY = 0;
let pull = 0;
let velocity = 0;
let isUnlocked = false;
let hasTriggered = false;

const maxPull = 120; 
const springStrength = 0.15;
const damping = 0.75;

function startDrag(e) {
  e.preventDefault();
  isDragging = true;
  hasTriggered = false;
  startY = getY(e) - pull;
  document.addEventListener("mousemove", drag);
  document.addEventListener("touchmove", drag, { passive: false });
  document.addEventListener("mouseup", stopDrag);
  document.addEventListener("touchend", stopDrag);
}

function drag(e) {
  if (!isDragging) return;
  const currentY = getY(e);
  pull = Math.max(0, Math.min(maxPull, currentY - startY));

  if (pull > 90 && !hasTriggered) {
    isUnlocked = true;
    hasTriggered = true;
    if (terminalContainer) terminalContainer.classList.add("system-active");
    
    setTimeout(() => {
      loginContainer.classList.add("fade-out");
      setTimeout(() => {
        gameContainer.classList.add("visible");
        initGameEngine(); 
      }, 500);
    }, 600);
  }
}

function stopDrag() { isDragging = false; }
function getY(e) { return e.type.includes("touch") ? e.touches[0].clientY : e.clientY; }

function animate() {
  if (!isDragging) {
    let target = isUnlocked ? maxPull : 0;
    pull += (velocity = (velocity + (target - pull) * springStrength) * damping);
  }
  if (securityCard) securityCard.style.transform = "translateY(" + pull + "px)";
  requestAnimationFrame(animate);
}

if (securityCard) {
  securityCard.addEventListener("mousedown", startDrag);
  securityCard.addEventListener("touchstart", startDrag, { passive: false });
  animate();
}

// =========================================================
// محرك لعبة الـ Elite Neon Breaker (مستويات وهدايا وشاشات متطورة)
// =========================================================
function initGameEngine() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  
  let currentLevel = 1;
  let ballRadius = 7;
  let x = canvas.width / 2;
  let y = canvas.height - 30;
  let dx = 4;
  let dy = -4;
  
  let paddleHeight = 12;
  let paddleWidth = 100;
  let paddleX = (canvas.width - paddleWidth) / 2;
  
  let rightPressed = false;
  let leftPressed = false;
  
  let brickRowCount = 4;
  let brickColumnCount = 7;
  let brickWidth = 60;
  let brickHeight = 16;
  let brickPadding = 8;
  let brickOffsetTop = 40;
  let brickOffsetLeft = 25;
  
  let score = 0;
  let lives = 3;
  let gameStarted = false;
  let powerUps = []; // مصفوفة لحفظ الجوائز الساقطة

  const levelColors = [
    ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"], // ألوان ممتصة للمستوى 1
    ["#ec4899", "#f472b6", "#fbcfe8", "#fce7f3"]  // ألوان مشعة للمستوى 2
  ];

  let bricks = [];
  function createBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        // في المستوى الثاني، نجعل بعض الطوب يحتاج لضربتين أو نضعه بشكل عشوائي
        bricks[c][r] = { x: 0, y: 0, status: 1, hasPowerUp: Math.random() < 0.25 };
      }
    }
  }
  createBricks();

  document.addEventListener("keydown", keyDownHandler, false);
  document.addEventListener("keyup", keyUpHandler, false);
  document.addEventListener("mousemove", mouseMoveHandler, false);

  function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
  }
  function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
  }
  function mouseMoveHandler(e) {
    let relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if (relativeX > 0 && relativeX < canvas.width) {
      paddleX = relativeX - paddleWidth / 2;
    }
  }

  // إدارة الجوائز الهابطة
  function handlePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
      let p = powerUps[i];
      p.y += 2; // سرعة سقوط الجائزة
      
      // رسم الجائزة كدائرة متوهجة صغيرة
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#10b981";
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;

      // فحص الالتقاط بالمضرب
      if (p.y > canvas.height - paddleHeight - 15 && p.x > paddleX && p.x < paddleX + paddleWidth) {
        // تفعيل المكافأة: توسيع المضرب مؤقتاً لسهولة اللعب
        paddleWidth = 140;
        setTimeout(() => { paddleWidth = currentLevel === 1 ? 100 : 80; }, 7000);
        powerUps.splice(i, 1);
      } else if (p.y > canvas.height) {
        powerUps.splice(i, 1); // حذفها إذا سقطت خارج الشاشة
      }
    }
  }

  function collisionDetection() {
    let activeBricks = 0;
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        let b = bricks[c][r];
        if (b.status === 1) {
          activeBricks++;
          if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
            dy = -dy;
            b.status = 0;
            score += 10;
            document.getElementById("scoreVal").innerText = score;
            
            // إسقاط مكافأة إذا كانت الطوبة تحتوي عليها
            if (b.hasPowerUp) {
              powerUps.push({ x: b.x + brickWidth/2, y: b.y + brickHeight });
            }
          }
        }
      }
    }
    
    // الانتقال للمستوى الثاني أو إعلان الفوز التام
    if (activeBricks === 0) {
      if (currentLevel === 1) {
        currentLevel = 2;
        document.getElementById("levelText").innerText = "LVL 2";
        // زيادة الصعوبة وتغيير الإعدادات
        paddleWidth = 80; 
        dx = (dx > 0 ? 5.5 : -5.5);
        dy = (dy > 0 ? 5.5 : -5.5);
        x = canvas.width / 2;
        y = canvas.height - 30;
        createBricks();
      } else {
        gameStarted = false;
        document.getElementById("gameWinScreen").style.display = "flex";
      }
    }
  }

  function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 12;
    ctx.shadowColor = currentLevel === 1 ? "#3b82f6" : "#ec4899";
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  }

  function drawPaddle() {
    ctx.beginPath();
    ctx.roundRect(paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight, 6);
    let gradient = ctx.createLinearGradient(paddleX, 0, paddleX + paddleWidth, 0);
    gradient.addColorStop(0, currentLevel === 1 ? '#3b82f6' : '#ec4899');
    gradient.addColorStop(1, '#6366f1');
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 15;
    ctx.shadowColor = currentLevel === 1 ? '#3b82f6' : '#ec4899';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  }

  function drawBricks() {
    const colors = levelColors[currentLevel - 1];
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        if (bricks[c][r].status === 1) {
          let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
          let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
          bricks[c][r].x = brickX;
          bricks[c][r].y = brickY;
          
          ctx.beginPath();
          ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 5);
          ctx.fillStyle = colors[r] || colors[0];
          ctx.shadowBlur = 6;
          ctx.shadowColor = ctx.fillStyle;
          ctx.fill();
          ctx.closePath();
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  function draw() {
    if (!gameStarted) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBricks();
    drawBall();
    drawPaddle();
    handlePowerUps();
    collisionDetection();

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
    if (y + dy < ballRadius) dy = -dy;
    else if (y + dy > canvas.height - ballRadius - 10) {
      if (x > paddleX && x < paddleX + paddleWidth) {
        let hitPos = (x - paddleX) / paddleWidth;
        dx = 7 * (hitPos - 0.5);
        dy = -dy;
      } else {
        lives--;
        document.getElementById("livesVal").innerText = lives;
        if (!lives) {
          gameStarted = false;
          document.getElementById("gameOverScreen").style.display = "flex";
        } else {
          x = canvas.width / 2;
          y = canvas.height - 30;
          dx = currentLevel === 1 ? 4 : 5.5;
          dy = currentLevel === 1 ? -4 : -5.5;
          paddleX = (canvas.width - paddleWidth) / 2;
        }
      }
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 6;
    else if (leftPressed && paddleX > 0) paddleX -= 6;

    x += dx;
    y += dy;
    requestAnimationFrame(draw);
  }

  document.getElementById("startBtn").addEventListener("click", function() {
    if(!gameStarted) {
      gameStarted = true;
      this.innerText = "SIMULATION LIVE";
      this.style.pointerEvents = "none";
      this.style.opacity = "0.6";
      draw();
    }
  });

  document.getElementById("resetBtn").addEventListener("click", function() {
    document.location.reload();
  });
}