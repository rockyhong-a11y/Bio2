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

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt * (game.timeScale || 1));
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
