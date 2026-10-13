"""힉스필드 결과물 → 게임 슬롯: (초상화) 배경 제거 → 크기 축소 → WebP 변환 → assets/hf/<슬롯>.webp, manifest 갱신.
사용: python3 tools/hf_import.py <원본 이미지 ...>   (pip install pillow)
- 파일 이름(확장자 제외)이 곧 슬롯 이름: 어디 있든 portrait_soyoung_sad.png → assets/hf/portrait_soyoung_sad.webp
- 초상화(portrait_*): 네 모서리가 불투명하면 단색 배경으로 보고 투명하게(hf_key.py), 세로 1280px 이하로
- 타이틀·CG: 긴 변 1920px 이하로
- assets/hf 안의 같은 슬롯 이전 파일(다른 확장자 포함)은 새 WebP로 대체된다.
슬롯 이름 오타·투명 배경 누락은 tests/hf.mjs 가 잡는다."""
import subprocess
import sys
from pathlib import Path
from PIL import Image
from hf_key import key_image

ROOT = Path(__file__).resolve().parent.parent
HF = ROOT / 'assets' / 'hf'
EXTS = ('.png', '.jpg', '.jpeg', '.webp')


def opaque_corners(im):
    w, h = im.size
    return all(im.getpixel(p)[3] == 255 for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)])


def run(path):
    src = Path(path)
    name = src.stem
    im = Image.open(src).convert('RGBA')
    size0 = im.size
    keyed = False
    if name.startswith('portrait_'):
        if opaque_corners(im):
            key_image(im)
            keyed = True
        im.thumbnail((10 ** 5, 1280), Image.LANCZOS)
    else:
        im.thumbnail((1920, 1920), Image.LANCZOS)
    for old in HF.glob(name + '.*'):
        if old.suffix.lower() in EXTS:
            old.unlink()
    out = HF / (name + '.webp')
    im.save(out, 'WEBP', quality=88, method=6)
    print(f'{src.name} {size0[0]}x{size0[1]} → {out.name} {im.size[0]}x{im.size[1]} {out.stat().st_size // 1024}KB' + (' (배경 제거)' if keyed else ''))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    HF.mkdir(parents=True, exist_ok=True)
    for p in sys.argv[1:]:
        run(p)
    subprocess.run([sys.executable, str(ROOT / 'tools' / 'build_sprites.py')], check=True)
