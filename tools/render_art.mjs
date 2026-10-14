// 2D 컷신 그림(art/ 의 SVG 생성 코드) → PNG 렌더
// 사용: node tools/render_art.mjs [슬롯 ...] [--out 폴더] [--import]
//   슬롯 생략 = 타이틀·CG 전체. 초상화는 이제 힉스필드 그림(art/ref 시트 → tools/hf_sheet.py)을 쓰므로 기본으로 렌더하지 않는다.
//   portrait_<id>[_<표정>] 을 직접 적으면 art/chars/<id>.js 벡터 그림을 렌더(--import 하면 힉스필드 초상화를 덮어씀 — 주의)
//   title_keyart, cg_* → art/cg/<슬롯>.js draw()
//   초상화는 투명 배경 1024x1536, CG는 1024x1536, 타이틀은 1080x1920.
//   --import: 렌더 결과를 tools/hf_import.py 로 assets/hf 에 등록(WebP 변환·manifest 갱신)
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
import { chromium } from '../tests/helpers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SLOTS = {
  heemin: ['default', 'surprised', 'scared', 'serious'],
  soyoung: ['default', 'surprised', 'sad', 'smile', 'angry'],
  seonga: ['default', 'smile', 'smirk', 'angry', 'surprised'],
  jihyeon: ['default', 'scared', 'smile', 'sad'],
};
export const SCENES = ['title_keyart', 'cg_prologue', 'cg_sigil_metal', 'cg_janitor', 'cg_hanging', 'cg_tree', 'cg_recording', 'cg_seal'];
const ALL = [...Object.entries(SLOTS).flatMap(([id, faces]) => faces.map(f => (f === 'default' ? `portrait_${id}` : `portrait_${id}_${f}`))), ...SCENES];

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : path.join(ROOT, 'art', 'out');
const doImport = args.includes('--import');
const want = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
const slots = want.length ? want : SCENES;
for (const s of slots) if (!ALL.includes(s)) throw new Error(`알 수 없는 슬롯: ${s}`);
fs.mkdirSync(OUT, { recursive: true });

async function svgFor(slot) {
  const bust = `?t=${Date.now()}`;
  if (slot.startsWith('portrait_')) {
    const [id, ...rest] = slot.slice(9).split('_');
    const mod = await import(pathToFileURL(path.join(ROOT, 'art', 'chars', id + '.js')).href + bust);
    return { svg: mod.draw(rest.join('_') || 'default'), w: 1024, h: 1536, transparent: true };
  }
  const mod = await import(pathToFileURL(path.join(ROOT, 'art', 'cg', slot + '.js')).href + bust);
  return slot === 'title_keyart' ? { svg: mod.draw(), w: 1080, h: 1920 } : { svg: mod.draw(), w: 1024, h: 1536 };
}

const browser = await chromium.launch();
const page = await browser.newPage();
const done = [];
for (const slot of slots) {
  const { svg, w, h, transparent } = await svgFor(slot);
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:${transparent ? 'transparent' : '#000'}}svg{display:block}</style></head><body>${svg}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(OUT, slot + '.png');
  await page.screenshot({ path: file, omitBackground: !!transparent, clip: { x: 0, y: 0, width: w, height: h } });
  done.push(file);
  console.log('렌더', slot, `${w}x${h}`);
}
await browser.close();
if (doImport) execFileSync('python3', [path.join(ROOT, 'tools', 'hf_import.py'), ...done], { stdio: 'inherit' });
