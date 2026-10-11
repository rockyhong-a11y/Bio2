// 조명: 어두운 앰비언트 + 손전등/창문 달빛 등 광원을 라이트맵(반해상도)에 그려 곱하기 합성.
// 광원은 벽에 가려진다(광선 투사). 벽 남쪽 면에 닿은 광선은 벽 정면 높이만큼 위로 올려 정면이 밝게 보이게 한다.
import { TW, TH, WALL_FRONT } from './world.js';

export class Lighting {
  constructor() {
    this.cv = document.createElement('canvas');
    this.ctx = this.cv.getContext('2d');
    this.ambient = '#0a0c14';
  }

  resize(w, h) {
    this.cv.width = Math.max(1, Math.ceil(w / 2));
    this.cv.height = Math.max(1, Math.ceil(h / 2));
  }

  // lights: { x, y, r, color, a?(0..1), ang?, spread?, los? }
  render(main, world, cam, scale, lights) {
    const c = this.ctx;
    c.globalCompositeOperation = 'source-over';
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = this.ambient;
    c.fillRect(0, 0, this.cv.width, this.cv.height);
    const s = scale / 2;
    c.setTransform(s, 0, 0, s, -cam.x * s, -cam.y * s);
    c.globalCompositeOperation = 'lighter';
    for (const L of lights) this.drawLight(c, world, L);
    c.globalCompositeOperation = 'source-over';

    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.globalCompositeOperation = 'multiply';
    main.drawImage(this.cv, 0, 0, main.canvas.width, main.canvas.height);
    main.restore();
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
