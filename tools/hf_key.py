"""힉스필드 초상화 배경 제거(크로마키): 단색 배경(초록 #00FF00 권장)을 투명하게 바꿔 같은 이름의 PNG로 저장.
사용: python3 tools/hf_key.py assets/hf/portrait_soyoung.png [다른 파일 ...]   (pip install pillow)
네 모서리 색을 배경색으로 보고 그 색에 가까운 픽셀을 투명하게(경계는 부드럽게) 만든다.
원본이 PNG가 아니면 원본은 <파일명>.orig 로 이름을 바꿔 둔다(manifest에서 빠지도록). 끝나면 build_sprites.py 실행."""
import sys
from pathlib import Path
from PIL import Image

NEAR, FAR = 60, 120  # 배경색과의 RGB 거리: NEAR 이하는 완전 투명, FAR 이상은 그대로


def key_image(im):
    """RGBA 이미지의 단색 배경을 제자리에서 투명하게. 추정한 배경색 반환."""
    w, h = im.size
    px = im.load()
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    bg = [sum(c[i] for c in corners) / 4 for i in range(3)]
    green = bg[1] > bg[0] + 40 and bg[1] > bg[2] + 40
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d = ((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2) ** 0.5
            if d >= FAR:
                continue
            k = max(0.0, (d - NEAR) / (FAR - NEAR))
            if green:
                g = min(g, max(r, b))  # 경계에 묻은 초록빛 제거
            px[x, y] = (r, g, b, int(a * k))
    return bg


def key(path):
    src = Path(path)
    im = Image.open(src).convert('RGBA')
    bg = key_image(im)
    out = src.with_suffix('.png')
    im.save(out)
    if src.suffix.lower() != '.png':
        src.rename(src.with_name(src.name + '.orig'))
    print(f'{src.name} → {out.name} (배경 {tuple(round(c) for c in bg)})')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for p in sys.argv[1:]:
        key(p)
