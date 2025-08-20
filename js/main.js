
(function(){
  // 시작 버튼 클릭시
  document.getElementById('btn-play').addEventListener('click', ()=>{
    // 메뉴, 설정 숨기고 게임 켜기
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('settings-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    initGameState();
    startTime = performance.now();
    spawn_mino();
    requestAnimationFrame(loop);
  });

  // 설정 버튼 클릭시
  document.getElementById('btn-settings').addEventListener('click', ()=>{
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('settings-screen').style.display = 'block';
    document.getElementById('game-screen').style.display = 'none';
    renderBindings(document.getElementById('bindings-list'));
  });

  // 뒤로가기 누를시
  document.getElementById('btn-settings-back').addEventListener('click', ()=>{
    document.getElementById('menu-screen').style.display = 'block';
    document.getElementById('settings-screen').style.display = 'none';
  });

  // 게임에서 메뉴 복귀
  document.getElementById('btn-back-menu').addEventListener('click', ()=>{
    document.getElementById('menu-screen').style.display = 'block';
    document.getElementById('settings-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
  });

  window.restartGame = restartGame;
  window.spawn_mino = spawn_mino;
})();
console.log('bindings:', bindings);
window.addEventListener('keydown', (e) => {
  console.log('key down:', e.key, 'pressed:', keysPressed[e.key]);
});
console.log('isPressed left:', isPressed('left'));
