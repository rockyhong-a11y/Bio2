// Playwright 공용 헬퍼: 전역 설치된 playwright 사용, 모바일(iPhone 13) 세로 에뮬레이션
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pw;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright', '/opt/node-tools/node_modules/playwright']) {
  try { pw = require(p); break; } catch {}
}
export const { chromium, devices } = pw;
export const BASE = process.env.BASE_URL || 'http://localhost:8080/index.html';

export async function openMobile({ landscape = false } = {}) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const dev = devices['iPhone 13'];
  const ctx = await browser.newContext({
    ...dev,
    viewport: landscape ? { width: dev.viewport.height, height: dev.viewport.width } : dev.viewport,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE);
  return { browser, ctx, page, errors };
}

// 대사·선택지가 열려 있으면 넘긴다 (선택지는 첫 번째)
export async function skipDialogs(page, max = 200) {
  for (let i = 0; i < max; i++) {
    const st = await page.evaluate(() => {
      const g = window.__game;
      const layer = document.querySelector('#ui .layer');
      return { busy: g.busy, modal: g.ui.modalCount, cls: layer?.className || '' };
    });
    if (!st.modal) {
      if (!st.busy) return true;
      await page.waitForTimeout(120);
      continue;
    }
    if (st.cls.includes('choice-layer')) await page.locator('.choice-opt').first().dispatchEvent('pointerdown');
    else if (st.cls.includes('dialog-layer')) { await page.locator('.dialog-layer').dispatchEvent('pointerdown'); await page.locator('.dialog-layer').dispatchEvent('pointerdown').catch(() => {}); }
    else if (st.cls.includes('doc-layer')) await page.locator('.doc .btn-close').dispatchEvent('pointerdown');
    else if (st.cls.includes('cg-layer')) await page.locator('.cg-layer').dispatchEvent('pointerdown');
    else await page.waitForTimeout(150);
    await page.waitForTimeout(40);
  }
  return false;
}
