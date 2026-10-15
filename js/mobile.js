// 모바일 웹앱 가드: 롱프레스 팝업(텍스트 선택/복사/돋보기/컨텍스트 메뉴)과 화면 확대·축소를 막는다.
// CSS(touch-action, user-select, -webkit-touch-callout)와 viewport 메타가 1차 방어, 여기 JS가 2차 방어.

const block = e => { if (e.cancelable) e.preventDefault(); };
const opt = { passive: false, capture: true };

export function installMobileGuards() {
  // 롱프레스/우클릭 컨텍스트 메뉴, 텍스트 선택, 이미지 드래그
  document.addEventListener('contextmenu', block, opt);
  document.addEventListener('selectstart', block, opt);
  document.addEventListener('dragstart', block, opt);

  // iOS Safari는 user-scalable=no를 무시하므로 제스처 이벤트로 핀치 확대를 막는다.
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(t, block, opt);

  // 멀티터치 이동(핀치)과 당겨서 새로고침/바운스 스크롤. 한 손가락 스크롤은 .scroll 영역(문서 읽기 등)과
  // 낮은 가로 화면에서 스크롤되는 패널(선택지·저장/챕터 목록·키패드)만 허용
  document.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && e.target.closest?.('.scroll, .choice, .save, .keypad')) return;
    block(e);
  }, opt);
  document.addEventListener('touchstart', e => { if (e.touches.length > 1) block(e); }, opt);

  // 더블탭 확대 (touch-action으로 대부분 막히지만 구형 WebView 대비)
  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = e.timeStamp;
    if (now - lastTouchEnd < 350) block(e);
    lastTouchEnd = now;
  }, opt);
  document.addEventListener('dblclick', block, opt);

  // 데스크톱 브라우저: Ctrl+휠, Ctrl +/-/0 확대
  document.addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey) block(e); }, opt);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(e.key)) block(e);
  }, opt);
}

// 오디오 해제/전체화면은 사용자 제스처 안에서만 가능
export function requestFullscreen() {
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!fn || document.fullscreenElement) return;
  try {
    const p = fn.call(el, { navigationUI: 'hide' });
    p?.catch?.(() => {}); // 세로·가로 자동 회전(화면 고정 없음)
  } catch {}
}
