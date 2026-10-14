"""여러 장이 한 줄로 붙은 초상화 시트(단색 배경) → 슬롯별 투명 PNG → hf_import.py 로 게임 등록
사용: python3 tools/hf_sheet.py <시트 이미지> <슬롯1> <슬롯2> ... [--out 폴더] [--scale 2]
  - 슬롯 수만큼 왼쪽부터 차례로 자른다(배경 틈으로 나누고, 틈이 모자라면 같은 폭으로)
  - 배경: 테두리에서 이어진 배경색 영역만 투명(인물 안의 비슷한 색은 남김), 경계는 부드럽게 + 배경색 번짐 제거
  - --scale: 원본이 작을 때 LANCZOS 확대 배율(기본 2)
  - 슬롯 이름 대신 '-' 를 쓰면 그 칸은 건너뛴다"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
T_BG = 26  # 배경색과의 거리(이 안쪽은 배경 후보)


def bg_mask(rgb, bg):
    """테두리와 이어진 배경 후보 영역(True=배경)"""
    dist = np.sqrt(((rgb - bg) ** 2).sum(-1))
    cand = Image.fromarray(np.where(dist < T_BG, 255, 0).astype(np.uint8)).copy()  # fromarray 결과는 쓰기 불가일 수 있음
    h, w = dist.shape
    for x, y in [(x, 0) for x in range(0, w, 7)] + [(x, h - 1) for x in range(0, w, 7)] + [(0, y) for y in range(0, h, 7)] + [(w - 1, y) for y in range(0, h, 7)]:
        if cand.getpixel((x, y)) == 255:
            ImageDraw.floodfill(cand, (x, y), 128)
    return np.array(cand) == 128, dist


def split(fg, n):
    """앞모습(fg) 열 투영으로 n칸 나누기 → [(x0, x1)]"""
    cols = fg.sum(0)
    runs, cur = [], None
    for x, v in enumerate(cols > 2):
        if v and cur is None:
            cur = x
        if not v and cur is not None:
            runs.append((cur, x)); cur = None
    if cur is not None:
        runs.append((cur, len(cols)))
    runs = [r for r in runs if r[1] - r[0] > 20]
    if len(runs) == n:
        return runs
    x0, x1 = runs[0][0], runs[-1][1]  # 틈이 부족: 전체 폭을 같은 폭으로
    step = (x1 - x0) / n
    return [(round(x0 + i * step), round(x0 + (i + 1) * step)) for i in range(n)]


def main(argv):
    out = Path(argv[argv.index('--out') + 1]) if '--out' in argv else ROOT / 'art' / 'out'
    scale = float(argv[argv.index('--scale') + 1]) if '--scale' in argv else 2.0
    args = [a for i, a in enumerate(argv) if not a.startswith('--') and (i == 0 or argv[i - 1] not in ('--out', '--scale'))]
    sheet, slots = args[0], args[1:]
    im = Image.open(sheet).convert('RGB')
    rgb = np.asarray(im).astype(np.float32)
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, 0)
    is_bg, dist = bg_mask(rgb, bg)
    # 경계 부드럽게: 배경 바로 옆 픽셀은 배경색과의 거리로 알파
    hard = np.where(is_bg, 0, 255).astype(np.uint8)
    near = np.array(Image.fromarray(hard).filter(ImageFilter.MinFilter(3))) < 255  # 배경과 맞닿은 테두리
    alpha = hard.astype(np.float32)
    edge = near & ~is_bg
    alpha[edge] = np.clip((dist[edge] - T_BG * 0.5) / (T_BG * 1.5), 0.25, 1) * 255
    a = (alpha / 255)[..., None]
    rgb_un = np.where(a > 0, (rgb - bg * (1 - a)) / np.maximum(a, 1e-3), 0)  # 배경색 번짐 제거
    rgba = np.dstack([np.clip(rgb_un, 0, 255), alpha]).astype(np.uint8)
    fg = ~is_bg
    out.mkdir(parents=True, exist_ok=True)
    made = []
    for (x0, x1), slot in zip(split(fg, len(slots)), slots):
        if slot == '-':
            continue
        ys = np.where(fg[:, x0:x1].any(1))[0]
        y0, y1 = ys[0], ys[-1] + 1
        pad = 6
        crop = Image.fromarray(rgba[max(0, y0 - pad):y1, max(0, x0 - pad):x1 + pad])
        if scale != 1:
            crop = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.LANCZOS)
        p = out / f'{slot}.png'
        crop.save(p)
        made.append(p)
        print(f'{slot}: x{x0}-{x1} y{y0}-{y1} → {crop.width}x{crop.height}')
    print(f'배경색 {tuple(round(c) for c in bg)}, {len(made)}장 → {out}')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1:])
