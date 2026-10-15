// 브라우저 안에서 도는 QA 봇: 실제 입력(가상 조이스틱 벡터·조사 버튼)으로 캐릭터를 움직인다.
// 컷신/대화가 열리면 'modal'로 즉시 반환 → Node 쪽이 대화를 넘긴 뒤 다시 호출한다.
(() => {
  const g = () => window.__game;
  const inp = () => window.__input;
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const blocked = () => g().busy > 0 || g().ui.modalCount > 0 || g().over;

  async function walkTo(tx, ty, run = true) {
    const G = g(), I = inp();
    let stuckT = 0, last = [G.player.x, G.player.y], replan = 0, path = null;
    const t0 = performance.now();
    while (performance.now() - t0 < 60000) {
      if (blocked()) { I.x = I.y = 0; return { ok: false, reason: 'modal' }; }
      const p = G.player;
      if (Math.hypot(p.x - tx, p.y - ty) < 0.1) { I.x = I.y = 0; await frame(); return { ok: true }; }
      if (!path || replan-- <= 0) {
        G.world.pathDoors = true;
        const raw = G.world.path(p.x, p.y, tx, ty);
        G.world.pathDoors = false;
        if (!raw) { I.x = I.y = 0; return { ok: false, reason: `no path to ${tx},${ty} from ${p.x.toFixed(2)},${p.y.toFixed(2)} map ${G.mapId}` }; }
        path = raw.map(([c, r]) => [c + 0.5, r + 0.5]);
        if (path.length) path[path.length - 1] = [tx, ty]; else path = [[tx, ty]];
        replan = 30;
      }
      // 다음 칸이 닫힌 문이면 열기
      const [nx, ny] = path[0];
      const d = G.world.door(Math.floor(nx), Math.floor(ny));
      if (d && !d.open) {
        // 문 바로 앞 칸 중앙에 정렬한 뒤 문을 바라보고 조사
        let sx = 0, sy = 0;
        if (Math.abs(p.x - nx) > Math.abs(p.y - ny)) sx = p.x < nx ? -1 : 1; else sy = p.y < ny ? -1 : 1;
        const apx = d.x + 0.5 + sx, apy = d.y + 0.5 + sy;
        const ex = apx - p.x, ey = apy - p.y, en = Math.hypot(ex, ey);
        if (en > 0.1) {
          I.x = ex / en * 0.7; I.y = ey / en * 0.7; // 문 앞 정렬은 걷기
          await frame();
          continue;
        }
        I.x = I.y = 0;
        p.dir = sx ? (sx < 0 ? 'right' : 'left') : (sy < 0 ? 'down' : 'up');
        await frame();
        I.pressed.add('action');
        await frame(); await frame();
        if (!d.open && !blocked()) return { ok: false, reason: `door ${d.x},${d.y} won't open (locked=${d.locked})` };
        continue;
      }
      const dx = nx - p.x, dy = ny - p.y, n = Math.hypot(dx, dy);
      if (n < 0.12 && path.length > 1) { path.shift(); continue; }
      const m = run ? 1 : 0.7; // 스틱 세기: 끝까지 = 달리기, 0.7 = 걷기
      I.x = dx / (n || 1) * m; I.y = dy / (n || 1) * m;
      await frame();
      const moved = Math.hypot(p.x - last[0], p.y - last[1]);
      last = [p.x, p.y];
      stuckT = moved < 0.002 ? stuckT + 1 : 0;
      if (stuckT > 40) { path = null; stuckT = 0; I.x = (Math.random() - 0.5); I.y = (Math.random() - 0.5); await frame(); await frame(); }
    }
    I.x = I.y = 0;
    return { ok: false, reason: 'timeout' };
  }

  async function act(dir) {
    const G = g(), I = inp();
    I.x = I.y = 0;
    await frame();
    if (dir) G.player.dir = dir;
    await frame();
    const f = G.focus();
    I.pressed.add('action');
    await frame(); await frame();
    return { focus: f ? (f.ev?.id || f.kind) : null };
  }

  async function idle(ms) {
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      if (blocked()) return { ok: false, reason: 'modal' };
      await frame();
    }
    return { ok: true };
  }

  window.__bot = { walkTo, act, idle };
})();
