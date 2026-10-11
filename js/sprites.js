// 블렌더 렌더 스프라이트 로더. assets/sprites/sprites.json = { scale, sprites: { key: {file,w,h,ax,ay} } }
// 좌표는 2배 해상도 픽셀 → 그릴 때 1/scale. 누락 스프라이트는 자홍색 박스로 표시(QA에서 바로 보이게).

const BASE = 'assets/sprites/';

export const sprites = {
  meta: {},
  img: {},
  scale: 2,
  missing: new Set(),

  async load() {
    const res = await fetch(BASE + 'sprites.json', { cache: 'no-cache' });
    const j = await res.json();
    this.scale = j.scale;
    this.meta = j.sprites;
    await Promise.all(Object.entries(this.meta).map(([k, m]) => new Promise(ok => {
      const im = new Image();
      im.onload = () => { this.img[k] = im; ok(); };
      im.onerror = () => { this.missing.add(k); ok(); };
      im.src = BASE + m.file;
    })));
  },

  has(k) { return !!this.img[k]; },

  // (x, y) = 앵커의 화면 좌표(논리 px)
  draw(ctx, k, x, y, flip = false) {
    const im = this.img[k], m = this.meta[k];
    if (!im) {
      this.missing.add(k);
      ctx.fillStyle = '#f0f';
      ctx.fillRect(x, y - 24, 32, 24);
      return;
    }
    const s = this.scale;
    if (flip) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.drawImage(im, -m.ax / s, -m.ay / s, m.w / s, m.h / s);
      ctx.restore();
    } else {
      ctx.drawImage(im, x - m.ax / s, y - m.ay / s, m.w / s, m.h / s);
    }
  },
};

// 힉스필드 결과물 슬롯: assets/hf/ 에 파일을 넣고 `python3 tools/build_sprites.py` 를 실행하면
// assets/hf/manifest.json 에 등록되어 자동 사용된다(없는 파일을 요청해 404를 내지 않도록 목록으로 확인).
let hfList = null;
export async function hfImage(name) {
  hfList ??= fetch('assets/hf/manifest.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : [])).catch(() => []);
  const files = await hfList;
  const f = files.find(n => n.replace(/\.(webp|png|jpe?g)$/i, '') === name);
  return f ? 'assets/hf/' + f : null;
}
