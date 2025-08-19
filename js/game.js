const COLS = 10, ROWS = 20;

let arena, bagQueue, nextQueue, current, holdPiece, canHold;
let piecesPlaced = 0, linesCleared = 0, startTime = 0, TSpin = 0, PerfectClear = 0;
let gravityTimer = 0, gravityInterval = 1000;
let gameOverFlag = false;
let lastAction = null;

// 발악 시간
let lockDelay = 0;
const LOCK_DELAY_MAX = 500;

// 발악 제한
let addDelay = 0;    // 발악 카운트
const MAX_DELAY = 15; // 무한 발악 방지

// 발악 시도
function tryDelay() {
  if (collideArena(current.matrix, current.pos.x, current.pos.y + 1)) {
    if (addDelay < MAX_DELAY) {
      lockDelay = LOCK_DELAY_MAX;
      addDelay++;
    }
  }
}


// 세팅
function initGameState() {
  arena = Array.from({length: ROWS}, ()=> Array(COLS).fill(null));
  bagQueue = [];
  nextQueue = [];
  holdPiece = null;
  canHold = true;
  piecesPlaced = 0;
  linesCleared = 0;
  TSpin = 0;
  PerfectClear = 0;
  gameOverFlag = false;
  fillNextQueue();
}

// 랜덤 미노 갖고오기
function fillNextQueue() {
  while (nextQueue.length < 14) {
    if (!bagQueue.length) bagQueue = makeBag();
    nextQueue.push(...bagQueue.splice(0));
  }
}

// 다음 블럭 스폰
function spawn_mino() {
  fillNextQueue();
  const type = nextQueue.shift();

  // 블록 객체 생성
  current = {
    type,
    rotationIndex: 0,
    matrix: cloneMatrix(MINOS_ROT[type][0]),
    color: MINOS_COLOR[type],
    pos: { x: Math.floor((COLS - MINOS_ROT[type][0][0].length)/2), y: 0 }
  };
  
  canHold = true;
  lockDelay = 500; // 발악 리셋
  addDelay = 0;
  
  // 충돌 여부
  if (collideArena(current.matrix, current.pos.x, current.pos.y)) {
    gameOverFlag = true;
  }
}

// 블럭 모양 복사
function cloneMatrix(m) { return m.map(row => row.slice()); }

// 해당 좌표에 블록을 놓았을 때 충돌 여부
function collideArena(matrix, px, py) {
  for (let y = 0; y < matrix.length; y++){
    for (let x = 0; x < matrix[y].length; x++){
      if (!matrix[y][x]) continue;

      const ax = px + x, ay = py + y; //실제 위치
      if (ax < 0 || ax >= COLS || ay >= ROWS) return true; // 영역 밖인지
      if (ay >= 0 && arena[ay][ax]) return true; // 블럭과 충돌하는지
    }
  }
  return false;
}

// 블록 설치
function set_mino() {
  if (checkTSpin()) {
    TSpin++;
  }

  current.matrix.forEach((row,y)=>{
    row.forEach((val,x)=>{
      if (val) {
        const ax = current.pos.x + x, ay = current.pos.y + y;
        if (ay >= 0 && ay < ROWS && ax >= 0 && ax < COLS) arena[ay][ax] = current.color;
      }
    });
  });

  piecesPlaced++;
}

// 라인 클리어
function clearLines() {
  let removed = 0;

  // 아래에서 위로 스캔
  outer: for (let y = ROWS-1; y >= 0; y--) {
    for (let x = 0; x < COLS; x++) {
      if (!arena[y][x]) continue outer; // 빈칸 존재시 스킵
    }

    arena.splice(y,1); // 줄 제거
    arena.unshift(new Array(COLS).fill(null)); // 빈줄 추가
    removed++;
    y++;
  }

  if (removed) linesCleared += removed;

  
  if (arena.every(row => row.every(cell => cell === null))) {
    PerfectClear++;
  }
}

// 블럭 중력
function dropOne(delta) {
  current.pos.y++;
  if (collideArena(current.matrix, current.pos.x, current.pos.y)) {
    current.pos.y--;
    if (lockDelay <= 0) {
      lockDelay = LOCK_DELAY_MAX; // 락 딜레이 시작
      addDelay = 0;
    }
  } else {
    gravityTimer = 0;
    lastAction = 'drop';
    tryDelay();
  }
}

// 하드드롭
function hardDrop() {
  while (!collideArena(current.matrix, current.pos.x, current.pos.y+1)) current.pos.y++;
  set_mino();
  clearLines();
  spawn_mino();
  gravityTimer = 0;
  lastAction = 'drop';
}

// 좌우이동
function move_mino(dir) {
  current.pos.x += dir;
  if (collideArena(current.matrix, current.pos.x, current.pos.y)) {
    current.pos.x -= dir;
  } else {
    lastAction = 'move';
    tryDelay();
  }
}

// 블럭 회전
function rotate_mino(dir) {
  const prevRot = current.rotationIndex;
  const len = 4;
  const nextRot = (prevRot + dir + len) % len;

  const type = current.type;
  const kicksTable = (type === 'I') ? SRS_KICKS.I : SRS_KICKS.JLSTZ;
  const kicks = (type === 'O') ? [[0,0]] : (dir === 1 ? kicksTable.CW[prevRot] : kicksTable.CCW[prevRot]);

  const newMatrix = MINOS_ROT[type][nextRot];

  for (let [dx, dy] of kicks) {
    const nx = current.pos.x + dx;
    const ny = current.pos.y + dy;

    if (!collideArena(newMatrix, nx, ny)) {
      current.matrix = newMatrix;
      current.rotationIndex = nextRot;
      current.pos.x = nx;
      current.pos.y = ny;
      lastAction = 'rotate';
      tryDelay();
      return true;
    }
  }

  return false;
}

// 홀드
function hold_mino() {
  if (!canHold) return;
  if (!holdPiece) {
    holdPiece = current.type;
    spawn_mino();
  } else {
    const tmp = holdPiece;
    holdPiece = current.type;
    
    // 현재 -> 홀드
    current.type = tmp;
    current.rotationIndex = 0;
    current.matrix = cloneMatrix(MINOS_ROT[tmp][0]);
    current.color = MINOS_COLOR[tmp];

    // 위치 초기화
    current.pos = { x: Math.floor((COLS - current.matrix[0].length)/2), y: 0 };
  }

  canHold = false;
}

// T스핀 판단
function checkTSpin() {
  if (current.type !== 'T') return false; // 블럭 종류
  if (lastAction !== 'rotate') return false; // 마지막 조작

  const cx = current.pos.x + 1; // 중심 좌표(회전축)
  const cy = current.pos.y + 1;

  const corners = [
    [cx-1, cy-1],
    [cx+1, cy-1],
    [cx-1, cy+1],
    [cx+1, cy+1]
  ];

  let blocked = 0;
  for (const [x,y] of corners) {
    if (y < 0 || y >= ROWS || x < 0 || x >= COLS || arena[y][x]) {
      blocked++;
    }
  }

  return blocked >= 3;
}

// 재시작
function restartGame() {
  initGameState();
  startTime = performance.now();
  spawn_mino();
  gameOverFlag = false;
  gravityTimer = 0;
  piecesPlaced = 0;
  linesCleared = 0;
  TSpin = 0;
  PerfectClear = 0;
}
