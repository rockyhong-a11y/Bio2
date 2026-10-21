// 에셋 커버리지: 1·2장에서 실제로 그려질 수 있는 모든 스프라이트 키가 sprites.json에 있는지 정적 검사
import fs from 'fs';
import { World } from '../js/world.js';
import * as story from '../data/story.js';

const meta = JSON.parse(fs.readFileSync(new URL('../assets/sprites/sprites.json', import.meta.url))).sprites;
const need = new Map(); // key → 사용처
const add = (k, where) => { if (!need.has(k)) need.set(k, where); };

const allTrue = new Proxy({}, { get: () => true });
const states = [{ flags: {}, has: () => false, t: 0 }, { flags: allTrue, has: () => true, t: 0.3 }]; // t: 시간에 따라 바뀌는 그림(불길·흰 빛)의 두 프레임
for (const [id, def] of Object.entries(story.maps)) {
  for (const st of states) {
    const w = new World(def, { ...st, doorState: () => ({ open: false, locked: null }) });
    for (let r = 0; r < w.rows; r++) for (let c = 0; c < w.cols; c++) {
      if (w.isWall(c, r)) add(w.wallSprite(c, r), `${id} 벽 ${c},${r}`);
      const fs = w.floorStyle(c, r);
      if (fs && !w.isWall(c, r)) add('floor_' + fs, `${id} 바닥 ${c},${r}`);
      if (w.ch(c, r) === 'D') {
        const d = w.door(c, r);
        d.open = false; add(w.doorSprite(c, r), `${id} 문 ${c},${r}`);
        d.open = true; add(w.doorSprite(c, r), `${id} 문(열림) ${c},${r}`);
      }
    }
    for (const p of def.props || []) add(typeof p.s === 'function' ? p.s(st) : p.s, `${id} 소품 ${p.x},${p.y}`);
  }
}
for (const skin of ['heemin', 'soyoung', 'seonga', 'jihyeon', 'janitor', 'naying'])
  for (const dir of ['down', 'up', 'left', 'right']) for (const f of [0, 1, 2]) add(`${skin}_${dir}_${f}`, '캐릭터');
add('naying_hang', '목매단 귀신'); add(story.headGhost.sprite, '머리귀신');
for (const k of ['baby_ghost', 'piano_ghost', 'jihyeon_faint']) add(k, '2장 귀신·쓰러진 지현');
for (const [id, it] of Object.entries(story.items)) add('item_' + (it.icon || id), '아이템 ' + id);
for (const id of Object.values(story.speakers)) add('portrait_' + id, '초상화(폴백)');

const missing = [...need].filter(([k]) => !meta[k]);
const unused = Object.keys(meta).filter(k => !need.has(k));
console.log(`필요 ${need.size}개 / 등록 ${Object.keys(meta).length}개 / 누락 ${missing.length}개`);
for (const [k, w] of missing) console.log('  누락', k, '←', w);
if (unused.length) console.log('  (미사용 등록 키)', unused.join(', '));
process.exit(missing.length ? 1 : 0);
