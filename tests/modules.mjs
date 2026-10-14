// 모듈 캐시 버전: 게임이 불러오는 모든 모듈이 index.html의 import map에 같은 ?v=N 으로 있는지 정적 검사
// (GitHub Pages는 10분 캐시 → 버전이 없으면 배포 직후 새 main.js와 옛 ui.js가 섞여 부팅이 깨질 수 있다)
import fs from 'fs';

const ROOT = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', ROOT), 'utf8');
const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)?.[1] ?? '{}').imports ?? {};
const versions = [...new Set([...html.matchAll(/\?v=(\w+)"/g)].map(m => m[1]))];
const [, entry, N] = html.match(/<script type="module" src="([^"?]+)\?v=(\w+)"/) ?? [];
const fails = [];
if (!entry) fails.push('FAIL main.js <script>에 ?v= 가 없음');
if (versions.length !== 1) fails.push(`FAIL index.html의 ?v= 값이 하나가 아님: ${versions.join(', ')}`);
if (!(html.indexOf('type="importmap"') < html.indexOf('type="module"'))) fails.push('FAIL import map이 모듈 <script>보다 앞에 없음');

// 진입 모듈에서 상대 경로 import를 따라가며 게임이 불러오는 모듈을 모은다
const seen = new Set();
const walk = rel => {
  if (seen.has(rel)) return;
  seen.add(rel);
  const src = fs.readFileSync(new URL(rel, ROOT), 'utf8');
  for (const m of src.matchAll(/(?:\bfrom|\bimport\s*\(?)\s*['"](\.\.?\/[^'"]+)['"]/g))
    walk(new URL(m[1], new URL(rel, ROOT)).href.slice(ROOT.href.length));
};
if (entry) walk(entry);

const missing = [...seen].filter(rel => rel !== entry && map['./' + rel] !== `./${rel}?v=${N}`);
console.log(`모듈 ${seen.size}개 / import map ${Object.keys(map).length}개 / 버전 v=${versions.join(',')} / 누락 ${missing.length}개`);
for (const rel of missing) console.log('  누락', `"./${rel}": "./${rel}?v=${N}"`, map['./' + rel] ? `(지금: ${map['./' + rel]})` : '');
for (const f of fails) console.log(f);
process.exit(missing.length || fails.length ? 1 : 0);
