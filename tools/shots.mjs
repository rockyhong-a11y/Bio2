// 화면 스냅샷: 정해진 장면들을 늘 같은 조건으로 찍어 전후 비교에 쓴다(그래픽 작업 검수용).
// 사용: node tools/shots.mjs <출력폴더> [--landscape]
//   예) node tools/shots.mjs shots/before     → shots/before/01_title.png …
//       node tools/shots.mjs shots/after
//   두 폴더를 만든 뒤 `node tools/shots.mjs --diff shots/before shots/after` 로 나란히 붙인 비교 시트를 만든다.
// 정적 서버가 떠 있어야 한다: python3 -m http.server 8080 --bind 127.0.0.1
import { openMobile } from '../tests/helpers.mjs';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);

// --diff: 같은 이름의 파일을 좌(before)/우(after)로 붙인 시트
if (args[0] === '--diff') {
  const [, a, b] = args;
  const names = fs.readdirSync(a).filter(n => n.endsWith('.png') && fs.existsSync(path.join(b, n)));
  const out = path.join(b, '_diff');
  fs.mkdirSync(out, { recursive: true });
  const { execFileSync } = await import('child_process');
  for (const n of names) {
    execFileSync('python3', ['-c', `
from PIL import Image
l=Image.open(${JSON.stringify(path.join(a, n))}).convert('RGB')
r=Image.open(${JSON.stringify(path.join(b, n))}).convert('RGB')
h=max(l.height,r.height); g=16
s=Image.new('RGB',(l.width+r.width+g,h),'#101014')
s.paste(l,(0,0)); s.paste(r,(l.width+g,0))
s.save(${JSON.stringify(path.join(out, n))})
`]);
  }
  console.log(`비교 시트 ${names.length}장 → ${out}`);
  process.exit(0);
}

const OUT = args[0] || 'shots';
const landscape = args.includes('--landscape');
fs.mkdirSync(OUT, { recursive: true });

const { browser, page } = await openMobile({ landscape });
const T0 = Date.now();
const shot = async name => { await page.waitForTimeout(450); await page.screenshot({ path: path.join(OUT, name + '.png') }); console.log(`   ${name}  ${((Date.now() - T0) / 1000).toFixed(0)}s`); };
// ui.say/choice/cg 는 탭을 기다리는 Promise를 돌려준다 → evaluate 안에서 반환하지 않는다(반환하면 거기서 멈춘다)
// 대사·연출이 끝날 때까지 탭해서 넘긴다
const skip = async (n = 50) => {
  for (let i = 0; i < n; i++) {
    if (!(await page.evaluate(() => __game.busy || __game.ui.modalCount))) return;
    await page.evaluate(() => {
      const L = [...document.querySelectorAll('#ui .layer')].pop();
      L?.querySelector('.choice-opt')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      L?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    await page.waitForTimeout(230);
  }
};
// 시간에 따라 흔들리는 연출(깜빡임·먼지·불길)을 고정해 매번 같은 그림이 나오게
const freeze = () => page.evaluate(() => { __game.qaSafe = true; __game.t = 12.5; __game.ambient.t = 12.5; });

console.log(`${OUT} (${landscape ? '가로' : '세로'})`);

// ---------------- 타이틀·메뉴
await page.waitForSelector('.title-btn');
await shot('01_title');
await page.locator('.title-btn', { hasText: '챕터 선택' }).dispatchEvent('pointerdown');
await page.waitForSelector('.chapter-btn');
await shot('02_chapters');

// ---------------- 3장 신관(소영 루트)로 진입
await page.locator('.chapter-btn').nth(2).dispatchEvent('pointerdown');
await page.waitForSelector('.chapter-route');
await page.waitForTimeout(600);
await page.locator('.chapter-route').first().dispatchEvent('pointerdown');
await page.waitForTimeout(1200);
await shot('03_chapter_card');     // 장 카드
await skip();
await freeze();

// ---------------- 월드: 조명 상황별
const at = (x, y, lighter = false) => page.evaluate(([x, y, l]) => {
  const g = __game;
  g.player.x = x; g.player.y = y; g.player.moving = false; g.lighter = l;
  for (const a of g.actors) g.placeFollower?.(a);
  g.snapCamera();
}, [x, y, lighter]);

await at(19.5, 10.5, false);
await shot('04_world_dark');        // 어두운 중앙홀
await at(19.5, 10.5, true);
await shot('05_world_lighter');     // 라이터
await at(10.5, 3.5, false);
await shot('06_world_room');        // 역사관(소품 많은 방)
await at(3.5, 15.5, false);
await shot('07_world_corner');      // 매점 구석

// ---------------- 대사·서술·알림
await page.evaluate(() => { __game.ui.say('소영', '신관… 3학년 교실이랑 도서관이 있는 건물이야. 다음 패는 물, 水.', 'serious'); });
await shot('08_dialog_portrait');   // 이름표 + 초상화
await page.evaluate(() => { document.querySelector('#ui .dialog-layer')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
await page.waitForTimeout(200);
await page.evaluate(() => { __game.ui.say(null, '진열장 유리에 손자국이 잔뜩 묻어 있다… 안쪽에서.', 'scared'); });
await shot('09_narrate');           // 서술(주인공 반응)
await page.evaluate(() => { document.querySelector('#ui .dialog-layer')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
await page.waitForTimeout(200);
await page.evaluate(() => { __game.ui.toast('노란 카드키 획득'); });
await shot('10_toast');             // 아이템 획득 알림
await page.waitForTimeout(1800);

// ---------------- 선택지·휴대폰·지도·CG
await page.evaluate(() => { __game.ui.choice('水의 패를 홈에 끼울까?', ['끼운다', '그만둔다']); });
await shot('11_choice');
await page.evaluate(() => { document.querySelector('#ui .choice-opt:last-child')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
await skip(20);
await page.locator('.btn-menu').dispatchEvent('pointerdown', {}, { timeout: 4000 }).catch(() => console.log('   (메뉴 버튼 없음)'));
await page.waitForSelector('.phone', { timeout: 4000 }).catch(() => console.log('   (휴대폰 안 열림)'));
await shot('12_phone');             // 휴대폰 메뉴
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.locator('.btn-map').dispatchEvent('pointerdown', {}, { timeout: 4000 }).catch(e => console.log('   (지도 버튼 없음)'));
await page.waitForTimeout(600);
await shot('13_map');               // 전체 지도
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.evaluate(() => { __game.ui.cg('cg_mermaid'); });
await page.waitForTimeout(900);
await shot('14_cg');                // 컷신 CG
await page.evaluate(() => { document.querySelector('#ui .cg-layer')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
await page.waitForTimeout(300);

// ---------------- 5장 미궁(흰 화면 연출)
await page.evaluate(async () => {
  const m = await import('./data/chapter5.js');
  __game.flags.mazeStep = 2;
  __game.enterMap('maze', m.TABLETS[2][0] + 0.5, m.TABLETS[2][1] + 1.5, 'up');
  __game.timer = { left: 200, label: '미궁이 하얗게 지워지기까지', onEnd: 'mazeDeath' };
  __game.snapCamera();
});
await skip();
await freeze();
await page.evaluate(() => { document.querySelectorAll('.toast').forEach(t => t.remove()); __game.flags.objective = "오행 패 밝히기 — 다음은 '金'"; __game.ui.objective(__game.flags.objective); });
await shot('15_maze');

await browser.close();
console.log(`끝 — ${OUT}`);
