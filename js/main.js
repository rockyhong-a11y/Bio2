import { installMobileGuards, requestFullscreen } from './mobile.js';
import { installInput, input } from './input.js';
import { installNav } from './nav.js';
import { pollGamepad } from './gamepad.js';
import { UI } from './ui.js';
import { Game } from './game.js';
import { Audio } from './audio.js';
import { sprites } from './sprites.js';
import { FilterLayer } from './filters.js';
import { settings } from './settings.js';
import { haptics } from './haptics.js';
import * as story from '../data/story.js';

installMobileGuards();

const canvas = document.getElementById('game');
const ui = new UI(document.getElementById('ui'), story);
installInput(ui.controls);
installNav(document.getElementById('ui'));
const audio = new Audio();
const game = new Game({ canvas, ui, audio, story });
const fx = new FilterLayer(canvas); // 그래픽 필터(옵션): 게임 화면만 후처리
ui.fx = fx;
fx.set(settings.filter);
window.__game = game; // QA 자동화 훅
window.__fx = fx;
window.__haptics = haptics;
window.__input = input;
window.__sprites = sprites;

// iOS는 제스처 이벤트 안에서 오디오를 깨워야 한다
for (const t of ['pointerdown', 'touchend', 'keydown']) addEventListener(t, () => audio.unlock(), { capture: true });

const resize = () => { game.resize(); fx.resize(); };
addEventListener('resize', resize);
visualViewport?.addEventListener('resize', resize);

// 다른 앱으로 전환하면 게임·제한시간·소리를 멈춘다(세로·가로는 자동 회전, 회전해도 계속)
function syncPause() {
  const p = document.hidden;
  game.paused = p;
  ui.setPaused(p);
  if (p) audio.suspend(); else audio.resume();
}
document.addEventListener('visibilitychange', syncPause);

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.paused) pollGamepad(now);
  if (!game.paused) game.update(dt * (game.timeScale || 1));
  else input.endFrame(); // 멈춘 동안 누른 키(Esc·Q 등)가 복귀 때 메뉴·지도를 열지 않게
  game.render(dt);
  fx.render(game.view, now / 1000);
  requestAnimationFrame(loop);
}

async function boot() {
  await Promise.all([
    sprites.load().catch(e => console.warn('sprites.json 로드 실패', e)),
    document.fonts?.load('12px Galmuri11').catch(() => {}), // 캔버스 말풍선 글꼴
  ]);
  resize();
  requestAnimationFrame(loop);
  ui.showControls(false);
  const pick = await ui.title();
  requestFullscreen();
  syncPause();
  // 실수로 뒤로 가기(가장자리 스와이프)를 해도 게임을 벗어나지 않게
  history.pushState({ game: 1 }, '', location.href);
  addEventListener('popstate', () => history.pushState({ game: 1 }, '', location.href));
  ui.showControls(true);
  if (pick === 'new') {
    game.reset();
    story.newGame(game);
  } else if (pick.chapter) {
    game.reset();
    story.startChapter(game, pick.chapter, pick.route);
  } else {
    game.restore(pick);
  }
  ui.refreshHud(game);
}

boot();
