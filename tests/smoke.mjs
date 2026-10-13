// 스모크: 타이틀 → 새 게임 → 프롤로그 → 조작 가능 상태. 콘솔 오류 0, 스크린샷 저장
import { openMobile, skipDialogs } from './helpers.mjs';
const out = process.argv[2] || '.';
const { browser, page, errors } = await openMobile();
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/smoke_title.png` });
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await page.waitForTimeout(300);
await skipDialogs(page);
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/smoke_play.png` });
const st = await page.evaluate(() => ({ map: window.__game.mapId, x: window.__game.player.x, y: window.__game.player.y, obj: window.__game.flags.objective, missing: [...window.__sprites?.missing || []] }));
console.log(JSON.stringify(st));
console.log('errors', errors.length, errors.slice(0, 5));
await browser.close();
process.exit(errors.length ? 1 : 0);
