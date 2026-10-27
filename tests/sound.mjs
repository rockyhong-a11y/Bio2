// 소리 전반을 '귀' 대신 '수치'로 검사한다.
//   1·2부 배경음악(js/music.js): 장면 판정·긴장도 순수 함수 + OfflineAudioContext 로 렌더한 파형
//   3부 데이터의 효과음 이름 교차 검증, 4부 외부 음원·음소거·앱 전환
//   5부 효과음 음색: 실제 AudioContext 에 AnalyserNode 를 물려 스펙트럼을 읽는다.
//      헷갈리면 플레이가 꼬이는 쌍(피격↔레버, 스위치↔잠금해제, 열쇠↔쥐, 문 열기↔닫기)이
//      실제로 다른 소리인지, 심장 박동이 휴대폰 스피커가 내보낼 수 있는 대역에 에너지를 갖는지 본다.
import { openMobile, skipDialogs } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const { browser, page, errors } = await openMobile();
const media = [];
page.on('request', r => { if (/\.(mp3|ogg|wav|m4a|aac|flac)(\?|$)/i.test(r.url())) media.push(r.url()); });
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await skipDialogs(page);

// ---------- 1) 순수 함수: 가짜 g 로 직접 부른다(오디오 없음)
const pure = await page.evaluate(async () => {
  const { sceneOf, tensionOf, SCENES } = await import('./js/music.js');
  const g = (o = {}) => ({ world: { def: {} }, flags: {}, mapId: 'main1f', danger: 0, ...o });
  return {
    scenes: {
      title: sceneOf({ world: null, flags: {} }),
      over: sceneOf(g({ over: true })),
      def: sceneOf(g({ world: { def: { music: 'maze' } } })),
      fire: sceneOf(g({ flags: { fireOn: true } })),
      fireOut: sceneOf(g({ flags: { fireOn: true, fireOut: true } })),
      maze: sceneOf(g({ mapId: 'maze' })),
      vent: sceneOf(g({ mapId: 'vent' })),
      rest: sceneOf(g({ flags: { resting: true } })),
      annex: sceneOf(g({ mapId: 'shingwan_2f' })),
      hall: sceneOf(g({ mapId: 'auditorium_1f' })),
      school: sceneOf(g()),
    },
    tens: {
      calm: tensionOf(g()),
      chase: tensionOf(g({ danger: 1 })),
      timerFar: tensionOf(g({ timer: { left: 400 } })),
      timerNear: tensionOf(g({ timer: { left: 30 } })),
      mirror: tensionOf(g({ mapId: 'shingwan_1f', flags: { mirrorRound: 1 } })),
      pool: tensionOf(g({ mapId: 'shingwan_roof' })),
      baby: tensionOf(g({ mapId: 'main2_4f' })),
      collapse: tensionOf(g({ mapId: 'maze', flags: { collapsed: true } })),
      title: tensionOf({ world: null, flags: {} }),
    },
    keys: Object.keys(SCENES),
  };
});
const S = pure.scenes;
check('장면 판정: 타이틀·게임오버·맵 지정이 먼저', S.title === 'title' && S.over === 'over' && S.def === 'maze', JSON.stringify([S.title, S.over, S.def]));
check('장면 판정: 화재는 끄면 풀린다', S.fire === 'fire' && S.fireOut === 'school', `${S.fire}/${S.fireOut}`);
check('장면 판정: 미궁·환기구·휴식·신관/강당·본관', S.maze === 'maze' && S.vent === 'vent' && S.rest === 'rest' && S.annex === 'annex' && S.hall === 'annex' && S.school === 'school', JSON.stringify(S));
check('프리셋 8종이 모두 있다', pure.keys.length === 8 && pure.keys.every(k => ['title', 'school', 'vent', 'annex', 'rest', 'fire', 'maze', 'over'].includes(k)), pure.keys.join(','));
const T = pure.tens;
check('긴장도: 평시 0, 추격 1, 타이틀 0', T.calm === 0 && T.chase === 1 && T.title === 0, JSON.stringify([T.calm, T.chase, T.title]));
check('긴장도: 제한시간은 남은 시간이 줄수록 오른다', T.timerFar >= 0.35 && T.timerNear >= 0.8 && T.timerNear > T.timerFar, `${T.timerFar} → ${T.timerNear}`);
check('긴장도: 쫓아오지 않는 귀신(거울·인어·아기)도 바닥값을 깐다', T.mirror >= 0.55 && T.pool >= 0.55 && T.baby >= 0.55, JSON.stringify([T.mirror, T.pool, T.baby]));
check('긴장도: 미궁 붕괴', T.collapse >= 0.8, String(T.collapse));

// ---------- 2) 실제 합성음: OfflineAudioContext 로 24초를 렌더해 파형을 읽는다
const snd = await page.evaluate(async () => {
  const { Music, SCENES } = await import('./js/music.js');
  const SR = 22050, SEC = 26;
  const ctx = new OfflineAudioContext(1, SR * SEC, SR);
  // 노이즈를 고정 시드로 만든다 — Math.random 으로 채우면 좁은 대역의 세기가 실행마다 몇 dB씩 흔들려
  // '긴장도가 오르면 맥 층이 커진다' 같은 검사가 들쭉날쭉해진다
  const noiseBuf = ctx.createBuffer(1, SR, SR);
  const d = noiseBuf.getChannelData(0);
  let seed = 20261026; // xorshift32 — LCG 의 하위 비트는 주기가 짧아 '노이즈'가 음정처럼 들린다
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
  for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);
  // 여기서부터 노드 생성 횟수를 센다 — 장면이 바뀌어도 새로 만들지 않는 것이 이 설계의 핵심이다
  let made = 0;
  for (const k of ['createOscillator', 'createGain', 'createBiquadFilter', 'createBufferSource']) {
    const f = ctx[k].bind(ctx);
    ctx[k] = (...a) => { made++; return f(...a); };
  }
  const m = new Music({ ctx, master, noiseBuf, muted: false });
  m.onSuspend(); // 단음 스케줄러는 실시간 타이머라 오프라인 렌더와 어긋난다 — 지속 층만 본다
  const built = made;
  // 구간마다 장면·긴장도를 바꾼다. 렌더를 잠깐 멈췄다 이어 가므로 전환이 실제 시간축 위에서 일어난다
  const plan = [[1, 'school', 0], [5, 'school', 0.6], [9, 'school', 1], [13, 'maze', 0], [17, 'over', 0], [21, 'school', 0]];
  for (const [at, scene, ten] of plan) {
    ctx.suspend(at).then(() => {
      const changed = scene !== m.scene;
      m.scene = scene; m.P = SCENES[scene]; m.ten = ten;
      if (changed) m.sweep();
      m.apply(0.3);
      ctx.resume();
    });
  }
  const buf = await ctx.startRendering();
  const x = buf.getChannelData(0);

  // 창 하나의 RMS·최댓값
  const win = (t0, t1) => {
    const a = Math.floor(t0 * SR), b = Math.floor(t1 * SR);
    let s = 0, peak = 0;
    for (let i = a; i < b; i++) { s += x[i] * x[i]; const v = Math.abs(x[i]); if (v > peak) peak = v; }
    return { rms: +Math.sqrt(s / (b - a)).toFixed(5), peak: +peak.toFixed(4) };
  };
  // Goertzel: 한 주파수의 세기(dB)
  const gz = (t0, t1, hz) => {
    const a = Math.floor(t0 * SR), b = Math.floor(t1 * SR), n = b - a;
    const w = 2 * Math.cos(2 * Math.PI * hz / SR);
    let s1 = 0, s2 = 0;
    for (let i = a; i < b; i++) { const s0 = x[i] + w * s1 - s2; s2 = s1; s1 = s0; }
    const p = (s1 * s1 + s2 * s2 - w * s1 * s2) / (n * n);
    return +(10 * Math.log10(p + 1e-20)).toFixed(1);
  };
  // 끊김: 50ms 창 RMS 가 거의 0인 구간이 연속으로 몇 초인가
  let quiet = 0, worst = 0;
  for (let t = 0; t + 0.05 < SEC; t += 0.05) {
    if (win(t, t + 0.05).rms < 3e-4) { quiet += 0.05; if (quiet > worst) worst = quiet; } else quiet = 0;
  }
  // 클릭(불연속): 인접 샘플 차의 최댓값
  let jump = 0;
  for (let i = 1; i < x.length; i++) { const v = Math.abs(x[i] - x[i - 1]); if (v > jump) jump = v; }

  // 좁은 대역의 노이즈는 한 주파수만 보면 들쑥날쑥하다 — 중심 둘레 다섯 점을 평균한다
  const band = (t0, t1, hz) => +(([-0.04, -0.02, 0, 0.02, 0.04].reduce((a, k) => a + Math.pow(10, gz(t0, t1, hz * (1 + k)) / 10), 0) / 5)).toExponential(3);
  const dB = v => +(10 * Math.log10(v)).toFixed(1);
  return {
    built, madeAfter: made - built,
    calm: win(2.5, 4.8), mid: win(6.5, 8.8), chase: win(10.5, 12.8), maze: win(14.5, 16.8), over: win(18.5, 20.8), back: win(22.5, 25.8),
    pulse: [dB(band(2.5, 4.8, 881)), dB(band(6.5, 8.8, 881)), dB(band(10.5, 12.8, 881))],
    droneSchool: [gz(2.5, 4.8, 146.83), gz(2.5, 4.8, 196)],
    droneMaze: [gz(14.5, 16.8, 196), gz(14.5, 16.8, 146.83)],
    airOver: [dB(band(18.5, 20.8, 600)), dB(band(2.5, 4.8, 600))],
    worstQuiet: +worst.toFixed(2), jump: +jump.toFixed(3),
  };
});
check('지속 노드는 12개뿐이고 장면이 바뀌어도 늘지 않는다', snd.built === 12 && snd.madeAfter === 0, `생성 ${snd.built}, 전환 5회 뒤 추가 ${snd.madeAfter}`);
const lv = [snd.calm, snd.mid, snd.chase, snd.maze, snd.over, snd.back];
check('장면마다 소리가 나고 클리핑하지 않는다', lv.every(v => v.rms > 0.004 && v.peak < 0.95), JSON.stringify(lv.map(v => v.rms)));
check('끊김 0초(장면 전환 5회를 포함한 26초 내내)', snd.worstQuiet === 0, `${snd.worstQuiet}초`);
check('전환에 클릭(불연속)이 없다', snd.jump < 0.25, String(snd.jump));
check('긴장도가 오르면 맥 층이 커진다(0 → 0.6 → 1)', snd.pulse[0] < snd.pulse[1] && snd.pulse[1] < snd.pulse[2] && snd.pulse[2] - snd.pulse[0] > 9, snd.pulse.join(' < '));
check('드론 기음이 장면을 따라간다(본관 146.83Hz, 미궁 196Hz)',
  snd.droneSchool[0] > snd.droneSchool[1] && snd.droneMaze[0] > snd.droneMaze[1], JSON.stringify([snd.droneSchool, snd.droneMaze]));
check('게임오버는 환경음을 끊는다(드론 테일만 남는다)', snd.airOver[0] < snd.airOver[1] - 6, `${snd.airOver[0]}dB vs ${snd.airOver[1]}dB @600Hz`);
check('추격이 평시보다 크다', snd.chase.rms > snd.calm.rms * 1.15, `${snd.calm.rms} → ${snd.chase.rms}`);

// ---------- 3) 데이터의 효과음 이름이 전부 play() 에 있다(오타 = 조용한 무음 방지)
const sfx = await page.evaluate(async () => {
  const files = ['chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5', 'story'];
  const names = new Set();
  for (const f of files) {
    const t = await (await fetch(`./data/${f}.js`)).text();
    for (const m of t.matchAll(/(?:sfx|play)\(\s*'([a-zA-Z_]+)'/g)) names.add(m[1]);
    for (const m of t.matchAll(/sfx:\s*'([a-zA-Z_]+)'/g)) names.add(m[1]);
  }
  const a = __game.audio;
  a.unlock();
  const bad = [];
  const warn = console.warn;
  console.warn = (...x) => { if (String(x[0]).includes('알 수 없는 효과음')) bad.push(x[1]); };
  const was = a.muted;
  if (!was) a.toggle(); // 검사하는 동안은 소리를 내지 않는다
  for (const n of names) a.play(n);
  a.play('__오타검사__');
  if (!was) a.toggle();
  console.warn = warn;
  return { count: names.size, bad };
});
check('데이터의 효과음 이름이 전부 정의되어 있다', sfx.count > 25 && sfx.bad.length === 1 && sfx.bad[0] === '__오타검사__', `${sfx.count}종, 미정의 ${JSON.stringify(sfx.bad)}`);

// ---------- 4) 외부 음원 0건 · 음소거·앱 전환
const ctl = await page.evaluate(async () => {
  const a = __game.audio, m = a.music;
  const on = !!m.iv;
  a.suspend(); const afterSuspend = !!m.iv;
  a.resume(); await new Promise(r => setTimeout(r, 50));
  const afterResume = !!m.iv;
  const was = a.muted;
  a.toggle(); const mutedGain = a.master.gain.value;
  a.toggle();
  return { on, afterSuspend, afterResume, muted: was !== a.muted ? null : 'ok', mutedGain };
});
check('앱 전환: 단음 스케줄러가 멈췄다 돌아온다', ctl.on && !ctl.afterSuspend && ctl.afterResume, JSON.stringify(ctl));
check('외부 음원 파일을 전혀 받지 않는다(전부 합성)', media.length === 0, media.slice(0, 3).join(', '));
check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));

// ---------- 5) 효과음 음색: 헷갈리는 쌍이 실제로 다른 소리인가
const sfxTone = await page.evaluate(async () => {
  const a = __game.audio;
  a.unlock(); await a.ctx.resume?.();
  a.music.onSuspend(); a.music.bus.disconnect(); a.music = null; // 음악을 떼고 효과음만 본다
  const an = a.ctx.createAnalyser();
  an.fftSize = 2048; an.smoothingTimeConstant = 0;
  a.master.connect(an);
  const f = new Float32Array(an.frequencyBinCount), x = new Float32Array(an.fftSize);
  const band = (b, lo, hi) => { let s = 0, n = 0; for (let i = 0; i < b.length; i++) { const hz = i * a.ctx.sampleRate / an.fftSize; if (hz >= lo && hz < hi) { s += Math.pow(10, b[i] / 10); n++; } } return +(10 * Math.log10(s / n)).toFixed(1); };
  const measure = async (fn, ms = 350) => {
    await new Promise(r => setTimeout(r, 1200)); // 앞 소리의 꼬리가 죽은 뒤에 잰다
    fn();
    let rms = 0, best = null;
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      await new Promise(r => requestAnimationFrame(r));
      an.getFloatTimeDomainData(x);
      let s = 0; for (const v of x) s += v * v;
      const r = Math.sqrt(s / x.length);
      if (r > rms) { rms = r; an.getFloatFrequencyData(f); best = Array.from(f); }
    }
    let bi = 0; for (let i = 1; i < best.length; i++) if (best[i] > best[bi]) bi = i;
    return { rms: +rms.toFixed(4), pk: Math.round(bi * a.ctx.sampleRate / an.fftSize), body: band(best, 150, 500), hi: band(best, 2000, 9000) };
  };
  const r = {};
  for (const n of ['hit', 'lever', 'switch', 'unlock', 'squeak']) r[n] = await measure(() => a.play(n));
  r.keys = await measure(() => a.keys({ skin: 'janitor', moving: true }, 1));
  r.beat = await measure(() => { a.beatT = 0; a.heartbeat(1, false); });
  // 문은 450ms 쓸림이다. 한 프레임만 집으면 어느 프레임이 가장 센지에 따라 값이 크게 튄다(측정값이 매번 달랐다) —
  // 같은 소리 안에서 이른 때와 늦은 때의 피크를 재서 **쓸리는 방향**을 본다(여는 쪽은 올라가고, 닫는 쪽은 내려간다)
  // 문은 450ms 쓸림이다. setTimeout 으로 '70ms 뒤·300ms 뒤'를 집으면 안 된다 — 헤드리스 브라우저는
  // 배경 탭처럼 타이머를 1초 단위로 늦춰서, 재려던 때에는 소리가 이미 끝나 있다(실제로 -98dB 침묵을 재고 있었다).
  // 소리가 나는 동안 rAF 로 계속 받아 적고, 소리가 실제로 들어온 프레임만 앞뒤 절반으로 갈라 가운뎃값을 본다.
  // 문 쓸림은 '가장 센 칸'으로 재면 안 된다 — 광대역 노이즈라 그 칸이 프레임마다 크게 튄다(측정값이 매번 달랐다).
  // 대신 **스펙트럼 중심**(에너지의 무게중심)을 쓴다. 밴드패스가 쓸려 가는 걸 매끄럽게 따라간다.
  // 창은 340ms 까지만: 닫는 소리에는 400ms 지점에 2600Hz 걸쇠 '탁'(audio.js door)이 따로 있어 그 뒤는 쓸림이 아니다.
  // setTimeout 으로 '몇 ms 뒤'를 집는 것도 안 된다 — 헤드리스 브라우저는 타이머를 1초 단위로 늦춰
  // 재려던 때에는 소리가 끝나 있다(실제로 -98dB 침묵을 재고 있었다). rAF 로 나는 동안 계속 받아 적는다.
  const sweep = async (fn, ms = 340) => {
    await new Promise(r => setTimeout(r, 1200)); // 앞 소리의 꼬리가 죽은 뒤에 잰다
    const centroid = () => {
      an.getFloatFrequencyData(f);
      let peak = -200, pi = 0;
      for (let i = 1; i < f.length; i++) { const hz = i * a.ctx.sampleRate / an.fftSize; if (hz >= 150 && hz <= 5000 && f[i] > peak) { peak = f[i]; pi = i; } }
      if (peak < -90) return null;
      let num = 0, den = 0;
      for (let i = 1; i < f.length; i++) {
        const hz = i * a.ctx.sampleRate / an.fftSize;
        if (hz < 150 || hz > 5000 || f[i] < peak - 25) continue; // 바닥 잡음은 빼고 실제 에너지만
        const m = 10 ** (f[i] / 20);
        num += hz * m; den += m;
      }
      return den ? { hz: num / den, db: peak } : null;
    };
    fn();
    const t0 = performance.now(), got = [];
    while (performance.now() - t0 < ms) {
      await new Promise(r => requestAnimationFrame(r));
      const c = centroid();
      if (c) got.push(c);
    }
    if (got.length < 4) return { a: 0, b: 0, db: -100, n: got.length };
    const k = Math.max(1, Math.round(got.length / 3));
    const avg = arr => Math.round(arr.reduce((s2, c) => s2 + c.hz, 0) / arr.length);
    return { a: avg(got.slice(0, k)), b: avg(got.slice(-k)), db: Math.max(...got.map(c => c.db)), n: got.length };
  };
  r.dOpen = await sweep(() => a.door(true));
  r.dClose = await sweep(() => a.door(false));
  const steps = [];
  for (let i = 0; i < 4; i++) { a.stepT = 0; steps.push((await measure(() => a.footstep(null, true), 200)).rms); }
  r.steps = steps;
  return r;
});
const F = sfxTone;
check('피격 ↔ 레버: 고역 어택으로 구분된다', F.hit.hi - F.lever.hi > 8 && F.hit.rms > F.lever.rms * 1.8, `고역 ${F.hit.hi} vs ${F.lever.hi}, 세기 ${F.hit.rms} vs ${F.lever.rms}`);
check('스위치 ↔ 잠금 해제: 피크 대역이 다르다', Math.abs(F.switch.pk - F.unlock.pk) > 800, `${F.switch.pk}Hz vs ${F.unlock.pk}Hz`);
check('수위 열쇠 ↔ 쥐 울음: 피크 대역이 다르다', Math.abs(F.keys.pk - F.squeak.pk) > 700, `${F.keys.pk}Hz vs ${F.squeak.pk}Hz`);
// 두 소리가 **반대로** 쓸리는지가 요점이다. 한쪽 폭에 각각 문턱을 두면 부하에 따라 간당간당해지므로,
// 방향(부호)은 각각 보고 크기는 둘의 차이 하나로 본다 — 같은 부하를 둘 다 똑같이 받으므로 훨씬 안정적이다
check('문 소리가 실제로 잡혔다(침묵을 재고 통과하지 않게)', F.dOpen.n >= 4 && F.dClose.n >= 4 && F.dOpen.db > -90 && F.dClose.db > -90,
  `열기 ${F.dOpen.n}프레임 ${F.dOpen.db.toFixed(0)}dB, 닫기 ${F.dClose.n}프레임 ${F.dClose.db.toFixed(0)}dB`);
const dOpenRise = F.dOpen.b - F.dOpen.a, dCloseRise = F.dClose.b - F.dClose.a;
check('문 열기 ↔ 닫기: 쓸리는 방향이 반대다', dOpenRise > 0 && dCloseRise < 0 && dOpenRise - dCloseRise > 250,
  `열기 ${F.dOpen.a}→${F.dOpen.b}Hz(${dOpenRise >= 0 ? '+' : ''}${dOpenRise}), 닫기 ${F.dClose.a}→${F.dClose.b}Hz(${dCloseRise}), 벌어짐 ${dOpenRise - dCloseRise}`);
check('심장 박동이 휴대폰 스피커 대역(150~500Hz)에도 실린다', F.beat.body > -60, `${F.beat.body}dB`);
check('발소리가 매번 조금씩 다르다(같은 파형 반복 금지)', new Set(F.steps).size >= 3 && Math.max(...F.steps) > Math.min(...F.steps) * 1.05, F.steps.join(', '));

await browser.close();
const bad = results.filter(r => !r).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
