// 조명: 어두운 앰비언트 + 광원을 라이트맵(반해상도)에 그려 화면에 곱하고, 같은 라이트맵을 약하게 '더해' 빛을 발광시킨다.
//   곱하기만 하면 어떤 픽셀도 원본 색보다 밝아질 수 없어서 빛이 '덜 어두운 회색'으로만 보인다. 가산 패스가 빛을 빛으로 만든다.
// 광원은 벽에 가려진다(광선 투사). 벽 남쪽 면에 닿은 광선은 벽 정면 높이만큼 위로 올려 정면이 밝게 보이게 한다.
// shaft(창문에서 비스듬히 떨어지는 사다리꼴 광선)는 광선 투사 없이 사다리꼴 + 선형 그래디언트로 그린다 — 원형 광원만으로는 빛의 방향이 안 보인다.
// 전체 톤(비네트·벽 밑동 그림자)도 여기서 라이트맵에 구워 넣는다. 조명 뒤에 그리는 것들(빗줄기·붉은 눈·표식·조사 말풍선)은 영향을 받지 않는다.
import { TW, TH, WALL_FRONT } from './world.js';

// 화면 전체 톤. 되돌리려면 이 값들을 0으로 두면 된다(맵마다 def.vignette·def.bloom·def.ao 로 덮어쓸 수 있다).
const VIGNETTE = 0.82;        // 화면 가장자리를 떨어뜨리는 세기
const VIG_TINT = '6,8,16';    // 가장자리로 갈수록 섞이는 색(청회색 — 암부를 푸르게 눌러 톤을 묶는다)
const AO = 0.5;               // 벽 밑동 접지 그림자 세기
const AO_H = 7;               // 접지 그림자 높이(게임 px)
const BLOOM = 0.45;           // 가장 센 광원의 심을 더해 빛이 발광처럼 보이게 하는 세기
const BLOOM_N = 3;            // 발광을 얹을 광원 수 상한(전면 합성을 피하려고 가장 센 것만)
const LM = 3;                 // 라이트맵 축소 배수 — 조명은 부드러운 저주파 그림이라 1/3로 그려도 차이가 없고, 전면 합성 비용이 그만큼 싸진다

export class Lighting {
  constructor() {
    this.cv = document.createElement('canvas');
    this.ctx = this.cv.getContext('2d');
    this.ambient = '#0a0c14';
    this.bg = new Map(); // 발광 그래디언트 캐시(색|반지름)
  }

  resize(w, h) {
    this.cv.width = Math.max(1, Math.ceil(w / LM));
    this.cv.height = Math.max(1, Math.ceil(h / LM));
    this.vig = null;
  }

  // lights: { x, y, r, color, a?(0..1), ang?, spread?, los? } 또는 사다리꼴 광선 { shaft:true, x, y, w, len, skew?, color?, a? }
  render(main, world, cam, scale, lights) {
    const c = this.ctx, def = world.def;
    const worldT = main.getTransform(); // 발광을 월드 좌표로 그릴 때 그대로 되돌린다(화면 흔들림까지 같은 변환)
    c.globalCompositeOperation = 'source-over';
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = this.ambient;
    c.fillRect(0, 0, this.cv.width, this.cv.height);
    const s = scale / LM;
    c.setTransform(s, 0, 0, s, -cam.x * s, -cam.y * s);
    c.globalCompositeOperation = 'lighter';
    // 빛이 닿는 범위를 모아 둔다 — 가산 합성을 화면 전체가 아니라 그 범위에만 걸어 비용을 아낀다
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    for (const L of lights) {
      let x0, y0, x1, y1;
      if (L.shaft) {
        x0 = L.x * TW - 8; x1 = L.x * TW + (L.w || 2) * TW + 8 + (L.skew ?? 1.6) * TW;
        y0 = L.y * TH; y1 = L.y * TH + (L.len || 6) * TH;
        this.drawShaft(c, L);
      } else {
        x0 = (L.x - L.r) * TW; x1 = (L.x + L.r) * TW;
        y0 = (L.y - L.r) * TH - WALL_FRONT; y1 = (L.y + L.r) * TH;
        this.drawLight(c, world, L);
      }
      if (x0 < bx0) bx0 = x0;
      if (y0 < by0) by0 = y0;
      if (x1 > bx1) bx1 = x1;
      if (y1 > by1) by1 = y1;
    }
    const ao = def.ao ?? AO;
    if (ao > 0) {
      c.globalCompositeOperation = 'multiply';
      this.drawAO(c, world, cam, ao);
    }
    const vig = def.vignette ?? VIGNETTE;
    if (vig > 0) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'multiply';
      this.drawVignette(c, vig);
    }
    c.globalCompositeOperation = 'source-over';

    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    const W = main.canvas.width, H = main.canvas.height;
    main.globalCompositeOperation = 'multiply';
    main.drawImage(this.cv, 0, 0, W, H);
    // 곱하기만 쓰면 어떤 픽셀도 원본 색보다 밝아질 수 없어 빛이 '덜 어두운 회색'으로만 보인다.
    // 전면 합성을 한 번 더 얹는 건 모바일에서 너무 비싸므로, 가장 센 광원 몇 개의 '심'에만 작게 더한다(실제 블룸처럼 밝은 것만 번진다).
    const bloom = def.bloom ?? BLOOM;
    if (bloom > 0) {
      const strong = lights.filter(L => !L.shaft && (L.a ?? 1) >= 0.45)
        .sort((a, b) => (b.a ?? 1) * b.r - (a.a ?? 1) * a.r).slice(0, BLOOM_N);
      if (strong.length) {
        main.setTransform(worldT);
        main.globalCompositeOperation = 'lighter';
        for (const L of strong) {
          const r = L.r * TW * 0.45, col = L.color || '255,244,220';
          let g = this.bg.get(col + '|' + r.toFixed(1));
          if (!g) {
            g = main.createRadialGradient(0, 0, 0, 0, 0, r);
            g.addColorStop(0, `rgba(${col},0.75)`);
            g.addColorStop(0.5, `rgba(${col},0.2)`);
            g.addColorStop(1, `rgba(${col},0)`);
            this.bg.set(col + '|' + r.toFixed(1), g);
          }
          main.globalAlpha = bloom * (L.a ?? 1);
          main.save();
          main.translate(L.x * TW, L.y * TH);
          main.fillStyle = g;
          main.fillRect(-r, -r, r * 2, r * 2);
          main.restore();
        }
      }
    }
    main.restore();
  }

  // 화면 가장자리를 청회색으로 떨어뜨린다. 그래디언트를 매 프레임 평가하면 비싸서, 크기·세기가 바뀔 때 한 번만 구워 두고 그 그림을 덮는다
  drawVignette(c, k) {
    const w = this.cv.width, h = this.cv.height;
    if (!this.vig || this.vigK !== k || this.vig.width !== w || this.vig.height !== h) {
      this.vig = document.createElement('canvas');
      this.vig.width = w; this.vig.height = h;
      const vc = this.vig.getContext('2d');
      const g = vc.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.24, w / 2, h / 2, Math.hypot(w, h) * 0.56);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(${VIG_TINT},${(0.26 * k).toFixed(3)})`);
      g.addColorStop(1, `rgba(${VIG_TINT},${k.toFixed(3)})`);
      vc.fillStyle = g;
      vc.fillRect(0, 0, w, h);
      this.vigK = k;
    }
    c.drawImage(this.vig, 0, 0);
  }

  // 벽 바로 아래 칸 위쪽에 어두운 띠 — 벽이 바닥에 닿아 있는 것처럼 보이게 한다(그리기 목록에 끼지 않아 정렬에 영향 없음)
  drawAO(c, world, cam, k) {
    const c0 = Math.max(0, Math.floor(cam.x / TW)), c1 = Math.min(world.cols - 1, Math.ceil((cam.x + cam.w) / TW));
    const r0 = Math.max(0, Math.floor(cam.y / TH)), r1 = Math.min(world.rows - 1, Math.ceil((cam.y + cam.h) / TH));
    const near = `rgba(${VIG_TINT},${(0.9 * k).toFixed(3)})`, far = `rgba(${VIG_TINT},${(0.45 * k).toFixed(3)})`;
    for (let r = r0; r <= r1; r++) for (let x = c0; x <= c1; x++) {
      if (world.isWall(x, r) || !world.isWall(x, r - 1)) continue;
      c.fillStyle = near;
      c.fillRect(x * TW, r * TH, TW, AO_H * 0.45);
      c.fillStyle = far;
      c.fillRect(x * TW, r * TH + AO_H * 0.45, TW, AO_H * 0.55);
    }
  }

  // 창문에서 비스듬히 떨어지는 사다리꼴 광선. 바깥쪽에 넓고 옅은 한 장을 깔아 가장자리를 부드럽게 한다
  drawShaft(c, L) {
    const col = L.color || '198,214,250', a = L.a ?? 0.42;
    const len = (L.len || 6) * TH, sk = (L.skew ?? 1.6) * TW;
    // 광선은 월드에 고정이라 그래디언트 좌표도 고정 — 광원 객체에 캐시해 매 프레임 다시 만들지 않는다
    const grad = L.g || (L.g = []);
    const quad = (i, pad, al) => {
      const x = L.x * TW - pad, w = (L.w || 2) * TW + pad * 2;
      let g = grad[i];
      if (!g) {
        g = grad[i] = c.createLinearGradient(L.x * TW, L.y * TH, L.x * TW + sk, L.y * TH + len);
        g.addColorStop(0, `rgba(${col},${al})`);
        g.addColorStop(0.45, `rgba(${col},${(al * 0.5).toFixed(3)})`);
        g.addColorStop(1, `rgba(${col},0)`);
      }
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(x, L.y * TH);
      c.lineTo(x + w, L.y * TH);
      c.lineTo(x + w + sk, L.y * TH + len);
      c.lineTo(x + sk, L.y * TH + len);
      c.closePath();
      c.fill();
    };
    quad(0, 7, a * 0.4); // 번지는 가장자리
    quad(1, 0, a);       // 또렷한 심
  }

  drawLight(c, world, L) {
    const cx = L.x * TW, cy = L.y * TH;
    const cone = L.spread != null;
    const a0 = cone ? L.ang - L.spread : 0;
    const a1 = cone ? L.ang + L.spread : Math.PI * 2;
    const n = Math.max(12, Math.ceil((a1 - a0) / 0.035));
    c.beginPath();
    if (cone) c.moveTo(cx, cy);
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * i / n;
      let d = L.r, lift = 0;
      if (L.los !== false) {
        const h = world.ray(L.x, L.y, a, L.r);
        d = h.d;
        if (h.southFace) lift = WALL_FRONT;
      }
      const px = (L.x + Math.cos(a) * d) * TW, py = (L.y + Math.sin(a) * d) * TH - lift;
      if (i === 0 && !cone) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, L.r * TW);
    const col = L.color || '255,244,220';
    const a = L.a ?? 1;
    g.addColorStop(0, `rgba(${col},${a})`);
    g.addColorStop(0.55, `rgba(${col},${a * 0.55})`);
    g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g;
    c.fill();
  }
}
