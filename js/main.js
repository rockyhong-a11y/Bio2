import { installMobileGuards, requestFullscreen } from './mobile.js';
import { installInput, input } from './input.js';
import { UI } from './ui.js';
import { Game } from './game.js';
import { Audio } from './audio.js';
import { sprites } from './sprites.js';
import * as story from '../data/chapter1.js';

installMobileGuards();

const canvas = document.getElementById('game');
const ui = new UI(document.getElementById('ui'), story);
installInput(ui.controls);
const audio = new Audio();
const game = new Game({ canvas, ui, audio, story });
window.__game = game; // QA 자동화 훅
window.__input = input;
window.__sprites = sprites;

// iOS는 제스처 이벤트 안에서 오디오를 깨워야 한다
for (const t of ['pointerdown', 'touchend', 'keydown']) addEventListener(t, () => audio.unlock(), { capture: true });

const resize = () => game.resize();
addEventListener('resize', resize);
visualViewport?.addEventListener('resize', resize);

// 다른 앱으로 전환했거나 가로로 돌려 안내 화면이 덮였을 때는 게임·제한시간·소리를 멈춘다
const landscape = matchMedia('(orientation: landscape) and (max-height: 600px)');
function syncPause() {
  const p = document.hidden || landscape.matches;
  game.paused = p;
  ui.setPaused(p);
  if (p) audio.suspend(); else audio.resume();
}
document.addEventListener('visibilitychange', syncPause);
landscape.addEventListener?.('change', syncPause);

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.paused) game.update(dt * (game.timeScale || 1));
  game.render(dt);
  requestAnimationFrame(loop);
}

async function boot() {
  await sprites.load().catch(e => console.warn('sprites.json 로드 실패', e));
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
  } else {
    game.restore(pick);
  }
  ui.refreshHud(game);
}

boot();
