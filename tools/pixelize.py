"""블렌더 렌더(2배 해상도) → 도트풍 스프라이트. 원본은 art/render_src/<분류>/ 에 보관하고 결과를 assets/sprites/<분류>/ 에 쓴다.
사용: python3 tools/pixelize.py [분류 ...]   (생략 = tiles props_room props_story items)
  1) 게임 픽셀(1배)로 줄이기(BOX)  2) 알파는 반투명 없이 잘라내기  3) 공용 팔레트로 색 줄이기(디더 없음)
  4) 소품·아이템은 바깥쪽 1px 어두운 외곽선  5) 다시 2배로(최근접) — 크기·앵커가 그대로라 sprites.json 은 바뀌지 않는다
공용 팔레트는 모든 원본에서 뽑아 art/render_src/palette.png 로 고정(다시 돌려도 색이 흔들리지 않게)."""
import sys
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC, DST = ROOT / 'art' / 'render_src', ROOT / 'assets' / 'sprites'
CATS = ['tiles', 'props_room', 'props_story', 'items']
OUTLINE = {'props_room', 'props_story', 'items'}
PAL_FILE = SRC / 'palette.png'
COLORS = 64
LINE = (14, 12, 18, 255)


def palette():
    if PAL_FILE.exists():
        return Image.open(PAL_FILE)
    px = []
    for cat in CATS:
        for p in sorted((SRC / cat).glob('*.png')):
            im = Image.open(p).convert('RGBA')
            im = im.resize((im.width // 2, im.height // 2), Image.BOX)
            px += [c[:3] for c in im.get_flattened_data() if c[3] >= 110] if hasattr(im, "get_flattened_data") else [c[:3] for c in im.getdata() if c[3] >= 110]
    side = int(len(px) ** 0.5) + 1
    sheet = Image.new('RGB', (side, side))
    sheet.putdata(px + [(0, 0, 0)] * (side * side - len(px)))
    pal = sheet.quantize(COLORS, method=Image.MEDIANCUT)
    pal.save(PAL_FILE)
    return pal


def pixelize(im, pal, outline):
    w, h = im.size
    small = im.resize((w // 2, h // 2), Image.BOX)
    alpha = small.getchannel('A').point(lambda v: 255 if v >= 110 else 0)
    out = small.convert('RGB').quantize(palette=pal, dither=Image.NONE).convert('RGBA')
    out.putalpha(alpha)
    if outline:
        ring = alpha.filter(ImageFilter.MaxFilter(3))  # 바깥 1px
        edge = Image.new('RGBA', out.size, LINE)
        edge.putalpha(ring)
        edge.alpha_composite(out)
        out = edge
    return out.resize((w, h), Image.NEAREST)


def main(cats):
    pal = palette()
    n = 0
    for cat in cats:
        for p in sorted((SRC / cat).glob('*.png')):
            pixelize(Image.open(p).convert('RGBA'), pal, cat in OUTLINE).save(DST / cat / p.name)
            n += 1
    print(f'{n}장 도트화 ({", ".join(cats)}), 팔레트 {COLORS}색')


if __name__ == '__main__':
    main(sys.argv[1:] or CATS)
