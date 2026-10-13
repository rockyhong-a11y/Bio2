// 힉스필드 이미지 슬롯 검사: assets/hf/manifest.json 의 파일이
//  - 게임이 실제로 찾는 슬롯 이름인지(오타면 게임에서 조용히 무시되므로 실패 처리 + 가장 비슷한 이름 제안)
//  - 같은 슬롯이 두 번 들어 있지 않은지, 브라우저에서 열리는지
//  - 초상화는 배경이 투명한지(네 모서리 알파 0), 게임이 그 파일을 실제로 대사창에 쓰는지
// 를 확인하고, 슬롯별 납품 현황을 출력한다.
import fs from 'fs';
import { openMobile } from './helpers.mjs';
import * as story from '../data/chapter1.js';

const src = fs.readFileSync(new URL('../data/chapter1.js', import.meta.url), 'utf8');
const uiSrc = fs.readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const portraits = new Map(); // 슬롯 → [화자, 표정]
for (const [who, id] of Object.entries(story.speakers)) portraits.set(`portrait_${id}`, [who, null]);
for (const m of src.matchAll(/s\.say\('([^']+)', '(?:[^'\\]|\\.)*', '([a-z]+)'\)/g)) {
  const id = story.speakers[m[1]];
  if (id) portraits.set(`portrait_${id}_${m[2]}`, [m[1], m[2]]);
}
const scenes = new Set([...src.matchAll(/s\.cg\('([a-z_]+)'/g), ...uiSrc.matchAll(/hfImage\('([a-z_]+)'\)/g)].map(m => m[1]));
const valid = new Set([...portraits.keys(), ...scenes]);

const dist = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
const nearest = s => [...valid].sort((a, b) => dist(s, a) - dist(s, b))[0];

const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const files = JSON.parse(fs.readFileSync(new URL('../assets/hf/manifest.json', import.meta.url), 'utf8'));
const stem = f => f.replace(/\.(webp|png|jpe?g)$/i, '');
const unknown = files.filter(f => !valid.has(stem(f)));
check('파일 이름이 모두 게임 슬롯과 일치', !unknown.length, unknown.map(f => `${f} → ${nearest(stem(f))}?`).join(', '));
const dup = files.filter((f, i) => files.findIndex(g => stem(g) === stem(f)) !== i);
check('같은 슬롯 중복 없음', !dup.length, dup.join(', '));

const { browser, page, errors } = await openMobile();
await page.waitForSelector('.title-btn');
const info = await page.evaluate(async files => Promise.all(files.map(f => new Promise(ok => {
  const im = new Image();
  im.onload = () => {
    const c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(im, 0, 0);
    const a = [[0, 0], [c.width - 1, 0], [0, c.height - 1], [c.width - 1, c.height - 1]].map(([px, py]) => x.getImageData(px, py, 1, 1).data[3]);
    ok({ f, w: im.naturalWidth, h: im.naturalHeight, corners: a });
  };
  im.onerror = () => ok({ f, error: true });
  im.src = 'assets/hf/' + f;
}))), files);
const broken = info.filter(i => i.error).map(i => i.f);
check('모든 이미지가 브라우저에서 열림', !broken.length, broken.join(', '));
const opaque = info.filter(i => !i.error && i.f.startsWith('portrait_') && i.corners.some(a => a > 0)).map(i => i.f);
check('초상화 배경 투명(네 모서리)', !opaque.length, opaque.length ? opaque.join(', ') + ' — python3 tools/hf_import.py 로 배경 제거' : '');
const small = info.filter(i => !i.error && i.f.startsWith('portrait_') && i.h < 800).map(i => `${i.f} ${i.w}x${i.h}`);
check('초상화 세로 800px 이상(고해상도 화면에서 흐려지지 않게)', !small.length, small.join(', '));

// 게임이 대사창에서 실제로 그 파일을 쓰는지 (표정 → 기본 → Blender 대체 순서 포함)
const present = new Set(files.map(stem));
const wrong = [];
for (const [slot, [who, face]] of portraits) {
  const id = story.speakers[who];
  const want = present.has(slot) ? slot : present.has(`portrait_${id}`) ? `portrait_${id}` : null;
  const url = await page.evaluate(([w, f]) => __game.ui.portrait(w, f), [who, face]);
  const got = url?.startsWith('assets/hf/') ? stem(url.slice(10)) : null;
  if (got !== want) wrong.push(`${slot}: 기대 ${want || 'Blender'}, 실제 ${got || url}`);
}
check('대사창이 납품된 초상화를 사용(없으면 기본→Blender 대체)', !wrong.length, wrong.slice(0, 5).join(' | '));
check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();

const need = [...valid].filter(s => s !== 'portrait_janitor'); // 수위는 1장 대사가 없어 선택
const done = need.filter(s => present.has(s));
console.log(`\n납품 현황: ${done.length}/${need.length} (초상화 ${done.filter(s => s.startsWith('portrait_')).length}/${need.filter(s => s.startsWith('portrait_')).length}, 타이틀·CG ${done.filter(s => !s.startsWith('portrait_')).length}/${need.filter(s => !s.startsWith('portrait_')).length})`);
const todo = need.filter(s => !present.has(s));
if (todo.length) console.log('  아직 없음:', todo.join(', '));
const bad = results.filter(r => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
