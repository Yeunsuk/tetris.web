// 초기 조작키
const DEFAULT_BINDINGS = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  down: 'ArrowDown',
  hard: ' ',
  rotR: 'ArrowUp',
  rotL: 'z',
  rot180: 'x',
  hold: 'c'
};

let bindings = JSON.parse(localStorage.getItem('tetris_bindings') || 'null') || DEFAULT_BINDINGS;
let keysPressed = {};   // 현재 키입력
let waitingBind = null;

let dasTimer = 0;   // das 측정
let arrTimer = 0;   // arr 측정
const DAS = 5;    // 최초 딜레이(ms)
const ARR = 30;     // 반복 딜레이(ms)

// 조작키 설정
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();  // 스크롤 방지
  }

  if (waitingBind) {
    e.preventDefault(); // 스크롤 방지 - 기본 키 방지
    bindings[waitingBind.action] = e.key; // 해당 입력을 설정
    localStorage.setItem('tetris_bindings', JSON.stringify(bindings)); // 로컬 저장
    waitingBind.element.querySelector('.key').textContent = e.key; // ui 표시
    waitingBind = null;
    return;
  }
  keysPressed[e.key] = true;
});

// 키를 떼면 업데이트
window.addEventListener('keyup', (e) => {
  keysPressed[e.key] = false;
});

// 조작키 UI
function renderBindings(container) {
  container.innerHTML = ''; // 기존 내용 초기화
  const order = ['왼쪽','오른쪽','아래','하드드롭','회전R','회전L','회전180','홀드'];

  // 각 기능에 바인딩 UI 생성
  order.forEach(action => {
    // div 영역 생성
    const div = document.createElement('div');
    div.className = 'binding';
    const act = document.createElement('div');
    act.className = 'act';
    act.textContent = action;
    const key = document.createElement('div');
    key.className = 'key';

    // 해당 기능에 키 설정 + div에 추가
    key.textContent = bindings[action] || '';
    div.appendChild(act);
    div.appendChild(key);

    // 클릭시 키 입력 대기
    div.addEventListener('click', () => {
      key.textContent = '[press key]';
      waitingBind = { action, element: div };
    });
    
    container.appendChild(div);
  });
}

// 해당 키가 눌려있는지
function isPressed(action) {
  const k = bindings[action];
  if (!k) return false;
  return !!keysPressed[k];
}
