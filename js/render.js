const mainCanvas = document.getElementById('mainCanvas');
const mctx = mainCanvas.getContext('2d');
mctx.imageSmoothingEnabled = false;

const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');
holdCtx.imageSmoothingEnabled = false;

const nextCtxs = [0,1,2,3].map(i => document.getElementById('next'+i).getContext('2d'));

// 상수 정의
const CELL = 24; // 블록 크기
const FIELD_X = 8, FIELD_Y = 8; // 필드 시작
const FIELD_W = COLS * CELL, FIELD_H = ROWS * CELL; // 전체 크기

// 메인 초기화
function clearMain() {
  mctx.fillStyle = '#000';
  mctx.fillRect(0,0, mainCanvas.width, mainCanvas.height);
}

// 격자 그리기
function drawGrid() {
  mctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  mctx.lineWidth = 1;

  // 가로줄
  for (let x = 0; x <= COLS; x++) {
    const px = FIELD_X + x * CELL;
    mctx.beginPath();
    mctx.moveTo(px, FIELD_Y);
    mctx.lineTo(px, FIELD_Y + FIELD_H);
    mctx.stroke();
  }

  // 세로줄
  for (let y = 0; y <= ROWS; y++) {
    const py = FIELD_Y + y * CELL;
    mctx.beginPath();
    mctx.moveTo(FIELD_X, py);
    mctx.lineTo(FIELD_X + FIELD_W, py);
    mctx.stroke();
  }
}


// 필드의 미노 그리기
function drawArena() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const color = arena[y][x];
      const px = FIELD_X + x*CELL, py = FIELD_Y + y*CELL;

      mctx.fillStyle = '#000';
      mctx.fillRect(px, py, CELL, CELL);

      if (gameSettings.mode !== "투명" && color) {
        mctx.fillStyle = color;
        mctx.fillRect(px, py, CELL, CELL);

        // 블록 테두리
        mctx.strokeStyle = 'rgba(0,0,0,0.35)';
        mctx.strokeRect(px+1, py+1, CELL-2, CELL-2);        
      }
    }
  }
}

// 특정 위치의 미노
function drawMatrixAt(matrix, tx, ty, color, alpha=1) {
  mctx.globalAlpha = alpha;

  for (let y = 0; y < matrix.length; y++){
    for (let x = 0; x < matrix[y].length; x++){
      if (matrix[y][x]) {
        const px = FIELD_X + (tx + x) * CELL;
        const py = FIELD_Y + (ty + y) * CELL;

        mctx.fillStyle = color;
        mctx.fillRect(px, py, CELL, CELL);
        mctx.strokeStyle = 'rgba(0,0,0,0.35)';
        mctx.strokeRect(px+1, py+1, CELL-2, CELL-2);
      }
    }
  }
  mctx.globalAlpha = 1;
}

// 고스트 블록
function drawCurrentAndGhost() {
  if (!current) return;
  
  // 위치 계산
  let gy = current.pos.y;
  while (!collideArena(current.matrix, current.pos.x, gy+1)) gy++;
  
  // 유령 블록
  if (gameSettings.mode !== "투명") {
    drawMatrixAt(current.matrix, current.pos.x, gy, current.color, 0.28); // 반투명
  }
  // 현재 블록
  drawMatrixAt(current.matrix, current.pos.x, current.pos.y, current.color, 1);
}

// 홀드 UI
function drawHoldCanvas() {
  holdCtx.fillStyle = '#000';
  holdCtx.fillRect(0,0, holdCanvas.width, holdCanvas.height);
  if (!holdPiece) return;

  const mat = MINOS_ROT[holdPiece][0]; // 회전 0
  const w = mat[0].length, h = mat.length;

  // 가운데 정렬
  const offsetX = Math.floor((holdCanvas.width/CELL - w)/2);
  const offsetY = Math.floor((holdCanvas.height/CELL - h)/2);
  holdCtx.fillStyle = MINOS_COLOR[holdPiece];

  // 그리기
  for (let y = 0; y < h; y++){
    for (let x = 0; x < w; x++){
      if (mat[y][x]) holdCtx.fillRect((offsetX+x)*CELL, (offsetY+y)*CELL, CELL, CELL);
    }
  }
}

// 미리보기 UI
function drawNextCanvases() {
  for (let i=0;i<4;i++){
    const ctx = nextCtxs[i];

    ctx.fillStyle = '#000';
    ctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);

    const type = nextQueue[i];
    if (!type) continue;

    const mat = MINOS_ROT[type][0];
    const w = mat[0].length, h = mat.length;

    // 가운데 정렬
    const offX = Math.floor((ctx.canvas.width/CELL - w)/2);
    const offY = Math.floor((ctx.canvas.height/CELL - h)/2);
    ctx.fillStyle = MINOS_COLOR[type];

    // 그리기
    for (let y = 0; y < h; y++){
      for (let x = 0; x < w; x++){
        if (mat[y][x]) ctx.fillRect((offX+x)*CELL, (offY+y)*CELL, CELL, CELL);
      }
    }
  }
}

// 상태 UI 업데이트
function drawStatsDOM() {
  const t = (performance.now() - startTime)/1000;
  document.getElementById('stat-time').textContent = t.toFixed(3);
  document.getElementById('stat-pieces').textContent = piecesPlaced;
  document.getElementById('stat-lines').textContent = linesCleared;
  document.getElementById('stat-t').textContent = TSpin;
  document.getElementById('stat-perfect').textContent = PerfectClear;
  
}

// 게임종료 UI
function showGameOverOverlay() {
  if (document.getElementById('game-over')) return;

  // 생성
  const overlay = document.createElement('div');
  overlay.id = 'game-over';
  overlay.innerHTML = `<div class="box">
    <h2>Game Over</h2>
    <div>Time: ${((performance.now()-startTime)/1000).toFixed(3)}</div>
    <div>Lines: ${linesCleared}</div>
    <div>T-spin: ${TSpin}</div>
    <div>Perfect Clear: ${PerfectClear}</div>
    <div style="margin-top:12px;"><button id="btn-restart">Restart</button></div>
  </div>`;

  // 화면에 추가
  document.getElementById('game-screen').appendChild(overlay);

  // 재시작시 제거하고 재시작 호출
  document.getElementById('btn-restart').addEventListener('click', ()=>{
    document.getElementById('game-screen').removeChild(overlay);
    restartGame();
  });
}

// input.js에서 가져옴
let prevEdgeState = {}; // 상태 저장용

// 상태 감지 및 연속 동작
function handleContinuousAndEdges(dt) {
  const checkEdge = (action) => {
    const pressed = isPressed(action);
    const prev = !!prevEdgeState[action];
    prevEdgeState[action] = pressed;
    return pressed && !prev;
  };

  // 좌우 이동 처리
  if (isPressed('left') && !isPressed('right')) {
    if (checkEdge('left')) {
      move_mino(-1);
      dasTimer = 0; // 처음 누른 순간 타이머 리셋
      arrTimer = 0;
    } else {
      dasTimer += dt;
      if (dasTimer >= DAS) {
        arrTimer += dt;
        if (arrTimer >= ARR) {
          move_mino(-1);
          arrTimer = 0;
        }
      }
    }
  } else if (isPressed('right') && !isPressed('left')) {
    if (checkEdge('right')) {
      move_mino(1);
      dasTimer = 0;
      arrTimer = 0;
    } else {
      dasTimer += dt;
      if (dasTimer >= DAS) {
        arrTimer += dt;
        if (arrTimer >= ARR) {
          move_mino(1);
          arrTimer = 0;
        }
      }
    }
  } else {
    // 양쪽 다 안 누르면 타이머 초기화
    dasTimer = 0;
    arrTimer = 0;
  }

  // 소프트 드롭
  if (isPressed('down')) {
    if (checkEdge('down')) {
      playSound('soft');
      dropOne();
    }
  }

  // 회전 / 하드드롭 / 홀드
  if (checkEdge('rotR')) rotate_mino(1);
  if (checkEdge('rotL')) rotate_mino(-1);
  if (checkEdge('rot180')) {
    rotate_mino(1);
    rotate_mino(1);
  }
  if (checkEdge('hard')) {
    hardDrop();
    if (gameSettings["gravityAccel"] && gravityInterval > 10) gravityInterval--; 
  }
  if (checkEdge('hold')) hold_mino();
}

// gameSettings["ShowHold"]에 따라 홀드 패널 보이기/숨기기
const holdPanel = document.querySelector('#left-panel .panel'); // HOLD 패널 선택
if (gameSettings["ShowHold"]) {
  holdPanel.style.display = 'block'; // 보이기
} else {
  holdPanel.style.display = 'none';  // 숨기기
}

const nextPanel = document.querySelector('#right-panel .panel'); // NEXT 패널 선택
if (gameSettings["ShowNext"]) {
  nextPanel.style.display = 'block';
} else {
  nextPanel.style.display = 'none';
}

// 메인 루프
let lastTime = performance.now();
function loop(now) {
  const dt = now - lastTime;
  lastTime = now;

  if (!gameOverFlag) {
    gravityTimer += dt;

    // 아래 누를시 소프트 드롭 간격 적용
    if (isPressed('down')) {
      const softInterval = 40;
      if (gravityTimer >= softInterval) { dropOne(); gravityTimer = 0; }
    } else {
      if (gravityTimer >= gravityInterval) { dropOne(); gravityTimer = 0; }
    }

    // 발악시간
    if (collideArena(current.matrix, current.pos.x, current.pos.y + 1)) {
      // 이미 바닥에 닿은 상태
      if (lockDelay > 0) {
        lockDelay -= dt;
        if (lockDelay <= 0) {
          set_mino();
          clearLines();
          spawn_mino();
        }
      }
    } else {
      // 공중에 있으면 락 딜레이 초기화
      lockDelay = LOCK_DELAY_MAX;
    }

    handleContinuousAndEdges(dt);
  }


  
  // 화면 그리기
  clearMain();
  drawArena();
  drawGrid();
  drawCurrentAndGhost();

  holdPanel.style.display = gameSettings["ShowHold"] ? 'block' : 'none';
  nextPanel.style.display = gameSettings["ShowNext"] ? 'block' : 'none';
  if (gameSettings["ShowHold"]) drawHoldCanvas();
  if (gameSettings["ShowNext"]) drawNextCanvases();
  drawStatsDOM();

  // 게임 오버
  if (gameOverFlag) showGameOverOverlay();

  requestAnimationFrame(loop);
}
