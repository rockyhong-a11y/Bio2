// 전체 QA 스위트: 정적 서버를 띄우고 모든 테스트를 순서대로 실행해 요약을 출력한다.
// 사용: node tests/run-all.mjs        (Playwright + Chromium 필요)
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const BASE_URL = `http://localhost:${server.address().port}/index.html`;

const suites = [
  ['맵 게이팅·조사 지점', 'gating.mjs'],
  ['에셋 커버리지', 'assets.mjs'],
  ['모바일(롱프레스·확대 금지)', 'mobile.mjs'],
  ['수위 AI', 'janitor.mjs'],
  ['저장/불러오기', 'save.mjs'],
  ['1장 완주 B루트', 'playthrough.mjs', 'B'],
  ['1장 완주 A루트', 'playthrough.mjs', 'A'],
];
const rows = [];
for (const [name, file, arg] of suites) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tests', file), ...(arg ? [arg] : [])], { env: { ...process.env, BASE_URL }, encoding: 'utf8', timeout: 15 * 60 * 1000 });
  const ok = r.status === 0;
  rows.push([ok ? 'PASS' : 'FAIL', name, `${((Date.now() - t0) / 1000).toFixed(0)}s`]);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) console.log((r.stdout + r.stderr).split('\n').filter(l => /FAIL|Error|누락/.test(l)).slice(0, 15).join('\n'));
}
server.close();
console.log('\n' + rows.map(r => r.join('  ')).join('\n'));
process.exit(rows.some(r => r[0] === 'FAIL') ? 1 : 0);
