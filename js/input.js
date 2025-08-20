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
const ARR = 40;     // 반복 딜레이(ms)

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
  const bindingsContainer = document.getElementById('bindings-list');
  const settingsContainer = document.getElementById('settings-list');
  bindingsContainer.innerHTML = '';
  settingsContainer.innerHTML = ''; // 기존 내용 초기화

  const order = ['left','right','down','hard','rotR','rotL','rot180','hold'];

  // UI용 한글 매핑
const displayorder = {
  left: '왼쪽',
  right: '오른쪽',
  down: '아래',
  hard: '하드드롭',
  rotR: '회전R',
  rotL: '회전L',
  rot180: '회전180',
  hold: '홀드'
};

  // 각 기능에 바인딩 UI 생성
  order.forEach(action => {
    // div 영역 생성
    const div = document.createElement('div');
    div.className = 'binding';
    const act = document.createElement('div');
    act.className = 'act';
    act.textContent = displayorder[action];
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
    
    bindingsContainer.appendChild(div);
  });

  // --- 추가 설정 영역 ---
  const settingsDiv = document.createElement('div');
  settingsDiv.className = 'settings';

  // Helper 함수: 토글
  function addToggle(label, key) {
    const div = document.createElement('div');
    div.className = 'setting';

    const lbl = document.createElement('div');
    lbl.textContent = label;

    const btn = document.createElement('button');
    btn.textContent = gameSettings[key] ? 'ON' : 'OFF';
    btn.addEventListener('click', () => {
      gameSettings[key] = !gameSettings[key];
      btn.textContent = gameSettings[key] ? 'ON' : 'OFF';
    });

    div.appendChild(lbl);
    div.appendChild(btn);
    settingsDiv.appendChild(div);
  }

  // Helper 함수: 다중 값 선택 (좌/우 버튼)
  function addSelector(label, key, values) {
    const div = document.createElement('div');
    div.className = 'setting';

    const lbl = document.createElement('div');
    lbl.textContent = label;

    const left = document.createElement('button');
    left.textContent = '◀';

    const val = document.createElement('span');
    val.textContent = gameSettings[key];

    const right = document.createElement('button');
    right.textContent = '▶';

    function updateValue(delta) {
      let idx = values.indexOf(gameSettings[key]);
      idx = (idx + delta + values.length) % values.length;
      gameSettings[key] = values[idx];
      val.textContent = gameSettings[key];
    }

    left.addEventListener('click', () => updateValue(-1));
    right.addEventListener('click', () => updateValue(1));

    div.appendChild(lbl);
    div.appendChild(left);
    div.appendChild(val);
    div.appendChild(right);
    settingsDiv.appendChild(div);
  }

  // 옵션 추가
  addToggle('중력 가속', 'gravityAccel');
  addSelector('초기 중력', 'initGravity', [1,2,3,4,5]);
  addToggle('미리보기', 'ShowNext');
  addToggle('홀드', 'ShowHold');
  addSelector('모드', 'mode', modes);

  settingsContainer.appendChild(settingsDiv);
}

// 해당 키가 눌려있는지
function isPressed(action) {
  const k = bindings[action];
  if (!k) return false;
  return !!keysPressed[k];
}
