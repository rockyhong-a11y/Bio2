"""4장(강당, 火) 소품·하얀 미로·불·쓰러진 인물·아이템 아이콘 → assets/sprites/props_ch4/ + props_ch4.json
사용: python3 tools/pixel_ch4.py [--preview 파일.png]
  - 규칙은 tools/pixel_ch3.py 와 같다(팔레트·Pen·외곽선·2배 확대, 아이콘 4배 = 128px)
  - 바닥 소품(floor): cells 칸 너비 가운데, 아래 끝이 칸 아래선 4px 위
  - 벽 소품(wall): cells 칸 너비 가운데, 위 끝이 벽 아래선에서 top px 위(벽 앞면 32px 안)
  - 바닥 데칼(decal): cells x rows 칸 한가운데
  - 아이콘(icon): 30x30 → 외곽선 32x32 → 4배, 앵커 = 가운데
  - 쓰러진 소영·앉은 지현: chars_students 의 서 있는 도트(1배)에서 외곽선을 벗겨 고쳐 그리고 다시 외곽선"""
import json
import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'sprites' / 'props_ch4'
CHARS = ROOT / 'assets' / 'sprites' / 'chars_students'
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pixel_chars import outline, LINE  # noqa: E402
from pixel_ch3 import C as C3  # noqa: E402  (3장 팔레트를 그대로 이어 쓴다)

C = dict(C3)
C.update({
    # 극장 벨벳(좌석·막)
    'v1': (78, 14, 22), 'v2': (116, 22, 30), 'v3': (152, 34, 42), 'v4': (190, 58, 62),
    # 불
    'fw': (255, 244, 200), 'fg': (255, 120, 40, 70), 'fG': (255, 170, 80, 120),
    # 그을음·연기
    'sm': (150, 150, 158, 150), 'sM': (190, 190, 196, 90), 'sh': (30, 26, 28, 200),
    # 녹슨 배관
    'pp': (112, 86, 72), 'pl': (150, 114, 90), 'pd': (72, 54, 46), 'pr': (156, 82, 44),
    # 황토(土)
    'oc': (190, 150, 70), 'ocl': (226, 190, 104), 'ocd': (130, 96, 40),
    # 붉은 결계패
    'tr': (224, 84, 70), 'tR': (150, 30, 34), 'tg': (255, 80, 60, 70), 'tG': (255, 110, 70, 130),
    # 보랏빛 결계
    'bv': (150, 90, 220, 70), 'bV': (186, 136, 255, 120), 'bW': (232, 214, 255, 200),
    # LED
    'lg': (90, 230, 110), 'la': (250, 180, 50), 'lo': (40, 50, 44),
    # 지현·소영 도트 색(chars_students 와 같음)
    'js': (240, 205, 185), 'jS': (206, 160, 146), 'jk': (27, 35, 70), 'jl': (40, 52, 98),
    'jt': (62, 62, 84), 'ju': (110, 74, 82), 'jv': (36, 40, 66), 'jw': (30, 26, 30), 'jx': (70, 62, 66),
    'jh': (150, 92, 58), 'jH': (108, 62, 40), 'sy': (24, 26, 40), 'sY': (66, 74, 104),
})

SPR = {}  # 키 → (그리기 함수, 종류, 너비, 높이, 옵션)


def sprite(key, kind, w, h, **opt):
    def deco(fn):
        SPR[key] = (fn, kind, w, h, opt)
        return fn
    return deco


def col(c):
    v = C[c]
    return v if len(v) == 4 else v + (255,)


class Pen:
    def __init__(self, w, h):
        self.im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def r(self, x, y, w, h, c):
        if w > 0 and h > 0:
            self.d.rectangle([x, y, x + w - 1, y + h - 1], fill=col(c))

    def box(self, x, y, w, h, c):
        self.d.rectangle([x, y, x + w - 1, y + h - 1], outline=col(c))

    def px(self, x, y, c):
        if 0 <= x < self.im.width and 0 <= y < self.im.height:
            self.im.putpixel((x, y), col(c))

    def ln(self, x0, y0, x1, y1, c, w=1):
        self.d.line([x0, y0, x1, y1], fill=col(c), width=w)

    def el(self, x, y, w, h, c):
        self.d.ellipse([x, y, x + w - 1, y + h - 1], fill=col(c))

    def ring(self, x, y, w, h, c):
        self.d.ellipse([x, y, x + w - 1, y + h - 1], outline=col(c))

    def poly(self, pts, c):
        self.d.polygon(pts, fill=col(c))

    def grid(self, x0, y0, s):
        for y, row in enumerate(s.strip('\n').split('\n')):
            for x, ch in enumerate(row):
                if ch != '.':
                    self.px(x0 + x, y0 + y, ch)


def strip_line(im):
    """도트 캐릭터의 바깥 외곽선(투명과 맞닿은 LINE 색)을 벗긴다 → 고쳐 그린 뒤 outline 으로 다시 입힌다"""
    im = im.copy()
    w, h = im.size
    src = im.load()
    a = im.getchannel('A').load()
    kill = []
    for y in range(h):
        for x in range(w):
            if a[x, y] and src[x, y][:3] == LINE and any(
                    not (0 <= x + dx < w and 0 <= y + dy < h) or not a[x + dx, y + dy]
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                kill.append((x, y))
    for xy in kill:
        src[xy] = (0, 0, 0, 0)
    return im


def char1x(name):
    im = Image.open(CHARS / f'{name}.png').convert('RGBA')
    return im.resize((im.width // 2, im.height // 2), Image.NEAREST)


# ================================================================ 강당
@sprite('audience_seats', 'floor', 92, 30, cells=3)
def audience_seats(p):
    # 뒤에서 내려다본 극장 의자 세 개: 붉은 벨벳 등받이 + 나무 팔걸이
    for i in range(3):
        x = 3 + i * 30
        p.r(x + 1, 24, 3, 6, 'k'); p.r(x + 23, 24, 3, 6, 'k')  # 다리
        p.r(x, 4, 27, 16, 'v2'); p.r(x + 1, 2, 25, 2, 'v2'); p.r(x + 3, 1, 21, 1, 'v2')  # 둥근 등받이
        p.r(x + 3, 1, 21, 1, 'v4'); p.r(x + 1, 2, 25, 1, 'v3'); p.r(x, 4, 1, 16, 'v3')
        p.r(x + 25, 3, 2, 17, 'v1'); p.r(x + 13, 4, 1, 14, 'v1')  # 가운데 박음질
        for y in (8, 13):
            p.px(x + 6, y, 'v1'); p.px(x + 20, y, 'v1')
        p.r(x, 18, 27, 6, 'N'); p.r(x, 18, 27, 1, 'M'); p.r(x, 23, 27, 1, 'n')  # 등받이 아래 나무 판
        p.r(x + 10, 20, 7, 2, 'A'); p.r(x + 11, 20, 1, 2, 'a')  # 좌석 번호판
    for x in (0, 30, 60, 89):  # 팔걸이(위에서 본 나무 막대 + 쇠 받침)
        p.r(x, 6, 3, 19, 'M'); p.r(x, 6, 3, 1, 'L'); p.r(x + 2, 7, 1, 18, 'n')
        p.r(x, 25, 3, 5, 't')


@sprite('stage_curtain', 'wall', 60, 30, cells=2, top=32)
def stage_curtain(p):
    # 벽 앞면을 덮은 짙은 붉은 벨벳 막: 세로 주름 + 위 주름 장식 + 금빛 술
    for x in range(60):
        m = x % 8
        c = 'v1' if m < 2 else 'v3' if m in (4, 5) else 'v2'
        p.r(x, 6, 1, 23 + (1 if m in (3, 4, 5) else 0), c)
        if m == 4:
            p.r(x, 8, 1, 18, 'v4')
    p.r(0, 0, 60, 5, 'v2')  # 윗단 주름 장식
    for x in range(0, 60, 10):
        p.el(x, 2, 11, 6, 'v3'); p.r(x + 2, 3, 6, 1, 'v4')
    p.r(0, 0, 60, 2, 'v1')
    for x in range(1, 60, 2):
        p.px(x, 7 + (x // 2) % 2, 'Z')
    p.ln(0, 7, 59, 7, 'z')
    p.ln(41, 14, 59, 11, 'Y'); p.ln(41, 15, 59, 12, 'z')  # 묶은 끈
    p.el(39, 13, 5, 5, 'Y'); p.px(40, 14, 'W')  # 매듭
    p.r(40, 18, 3, 3, 'Z'); p.poly([(39, 21), (43, 21), (44, 27), (38, 27)], 'Y')  # 술
    for x in (39, 41, 43):
        p.r(x, 22, 1, 5, 'z')
    p.r(38, 27, 7, 1, 'z')


@sprite('projector', 'floor', 26, 36)
def projector(p):
    # 삼각대 위의 옛 영사기: 필름 릴 두 개, 왼쪽을 보는 렌즈
    p.ln(13, 24, 4, 35, 't', 2); p.ln(13, 24, 22, 35, 't', 2); p.r(12, 22, 3, 13, 's')  # 삼각대
    p.r(11, 21, 5, 2, 'k')
    p.r(5, 12, 17, 10, 'k'); p.r(5, 12, 17, 1, 'j'); p.r(20, 13, 2, 9, 'K')  # 몸체
    p.r(8, 15, 7, 3, 'j'); p.px(17, 16, 'R')
    p.r(0, 14, 6, 6, 'S'); p.r(0, 14, 6, 1, 'T'); p.r(0, 15, 2, 4, 'I'); p.px(0, 16, 'W')  # 렌즈
    for x, y, d in ((3, 0, 11), (13, 2, 10)):  # 필름 릴
        p.el(x, y, d, d, 's'); p.ring(x, y, d, d, 't'); p.el(x + d // 2 - 1, y + d // 2 - 1, 3, 3, 'K')
        p.ln(x + 2, y + d // 2, x + d - 3, y + d // 2, 'T'); p.ln(x + d // 2, y + 2, x + d // 2, y + d - 3, 'T')
    p.r(8, 10, 2, 3, 'E'); p.r(18, 11, 2, 2, 'E')  # 필름 띠


def mixer(p, on):
    p.r(2, 22, 3, 8, 'n'); p.r(55, 22, 3, 8, 'n')  # 다리
    p.r(0, 2, 60, 15, 'k'); p.r(0, 2, 60, 1, 'j'); p.r(0, 16, 60, 1, 'K')  # 기울어진 조작판
    p.r(0, 17, 60, 6, 'N'); p.r(0, 17, 60, 1, 'M'); p.r(0, 22, 60, 1, 'n')  # 나무 앞판
    for i in range(8):  # 채널 슬라이더
        x = 4 + i * 5
        p.r(x, 4, 2, 1, ('lg' if i % 3 else 'la') if on else 'lo')  # LED
        p.r(x + 1 - 1, 6, 1, 9, 'E'); p.px(x + 1, 6, 'j')
        ky = (7 + (i * 3) % 6) if on else 12 + (i % 2)
        p.r(x - 1, ky, 3, 2, 'T'); p.r(x - 1, ky, 3, 1, 'W')
    p.r(43, 3, 2, 12, 'j')
    for j, c in enumerate(('R', 'la', 'la', 'lg', 'lg')):  # 출력 계기
        p.r(46, 4 + j * 2, 2, 1, c if on else 'lo')
    p.r(51, 4, 4, 11, 'E'); p.r(52, 5, 2, 9, 'K')  # 마스터 레버 홈
    ky = 2 if on else 11
    p.r(50, ky, 6, 4, 'R'); p.r(50, ky, 6, 1, 'vr'); p.r(50, ky + 3, 6, 1, 'r')
    for x in (8, 18, 28):
        p.r(x, 19, 6, 2, 'A')  # 채널 이름표


@sprite('mixer_board', 'floor', 60, 30, cells=2)
def mixer_board(p):
    mixer(p, False)


@sprite('mixer_board_on', 'floor', 60, 30, cells=2)
def mixer_board_on(p):
    mixer(p, True)


def control(p, opened):
    p.r(0, 0, 56, 28, 'S'); p.r(0, 0, 56, 1, 'T'); p.r(55, 1, 1, 27, 's'); p.r(0, 27, 56, 1, 's')  # 함
    for x, y in ((2, 2), (53, 2), (2, 25), (53, 25)):
        p.px(x, y, 't')
    p.r(3, 4, 34, 15, 'p'); p.box(3, 4, 34, 15, 's')
    for i in range(5):  # 토글 스위치
        x = 6 + i * 6
        p.r(x, 9, 4, 6, 't'); p.r(x + 1, 10, 2, 4, 'K')
        up = opened or i in (0, 2)
        p.r(x + 1, 7 if up else 13, 2, 4, 'T'); p.px(x + 1, 7 if up else 16, 'W')
        p.r(x, 5, 4, 1, 'w')
    p.r(4, 21, 18, 4, 't'); p.r(5, 22, 16, 1, 'q'); p.r(5, 23, 10, 1, 'q')  # 경고판
    p.el(26, 20, 6, 6, 'K'); p.el(27, 21, 4, 4, 'lg' if opened else 'g')  # 램프
    if opened:
        p.px(28, 22, 'W')
    p.r(42, 3, 6, 22, 'E'); p.r(43, 4, 4, 20, 'K')  # 레버 홈
    p.poly([(39, 12), (41, 8), (43, 12)], 'Y'); p.px(41, 10, 'K')
    if opened:
        p.r(43, 14, 4, 12, 'r'); p.r(43, 14, 2, 12, 'R'); p.r(40, 24, 10, 4, 'R'); p.r(40, 24, 10, 1, 'vr'); p.r(40, 27, 10, 1, 'r')
    else:
        p.r(43, 2, 4, 12, 'r'); p.r(43, 2, 2, 12, 'R'); p.r(40, 0, 10, 4, 'R'); p.r(40, 0, 10, 1, 'vr'); p.r(40, 3, 10, 1, 'r')


@sprite('control_panel', 'wall', 56, 28, cells=2, top=30)
def control_panel(p):
    control(p, False)


@sprite('control_panel_open', 'wall', 56, 28, cells=2, top=30)
def control_panel_open(p):
    control(p, True)


# ---------------------------------------------------------------- 불
FLAME = {
    0: [(2, 31), (1, 24), (4, 16), (6, 20), (8, 8), (11, 14), (13, 0), (16, 11), (18, 5), (20, 15), (23, 22), (22, 31)],
    1: [(2, 31), (2, 21), (5, 13), (7, 18), (10, 4), (12, 12), (15, 2), (17, 13), (20, 8), (21, 18), (23, 25), (22, 31)],
}


def fire_glow(p, f):
    p.el(0, 22 - f, 24, 14 + f, 'fg'); p.el(3, 26, 18, 8, 'fG')


def fire(p, f):
    cx, cy = 12, 32
    for s, c in ((1.0, 'r'), (0.86, 'y'), (0.66, 'O'), (0.46, 'Y'), (0.24, 'fw')):
        p.poly([(cx + (x - cx) * s, cy + (y - cy) * s) for x, y in FLAME[f]], c)
    p.el(2, 28, 20, 6, 'r'); p.el(5, 29, 14, 3, 'y'); p.r(8, 29, 8, 1, 'Y')  # 타는 밑동
    for x, y in (((4, 6), (20, 3)) if f == 0 else ((6, 2), (21, 7))):  # 불티
        p.px(x, y, 'Y')


@sprite('fire_0', 'floor', 24, 35, line=False, under=lambda p: fire_glow(p, 0))
def fire_0(p):
    fire(p, 0)


@sprite('fire_1', 'floor', 24, 35, line=False, under=lambda p: fire_glow(p, 1))
def fire_1(p):
    fire(p, 1)


@sprite('fire_out', 'floor', 28, 24, line=False)
def fire_out(p):
    p.el(0, 13, 28, 11, 'sh'); p.el(3, 14, 22, 9, 'E'); p.el(7, 16, 12, 5, 'k')  # 그을린 자국
    for x, y in ((5, 17), (11, 19), (19, 18), (15, 16), (22, 19), (9, 21)):
        p.px(x, y, 'j')
    p.px(13, 18, 'r'); p.px(17, 20, 'u')  # 남은 불씨
    for y in range(0, 16):  # 가는 연기
        x = 13 + round(2.5 * math.sin(y / 2.6))
        p.px(x, y, 'sm' if y > 4 else 'sM'); p.px(x + 1, y, 'sM')


@sprite('fire_extinguisher', 'floor', 12, 15)  # 'extinguisher' 는 props_room 에 이미 있음
def extinguisher(p):
    p.r(2, 4, 7, 11, 'R'); p.r(3, 3, 5, 1, 'R'); p.r(2, 4, 1, 11, 'vr'); p.r(7, 4, 2, 11, 'r')  # 통
    p.r(2, 8, 7, 3, 'W'); p.r(3, 9, 3, 1, 'q')  # 표지
    p.r(4, 1, 3, 2, 'S'); p.r(3, 0, 5, 1, 'K'); p.ln(7, 0, 9, 1, 'K')  # 꼭지·손잡이
    p.ln(7, 2, 10, 4, 'K'); p.r(10, 4, 1, 8, 'K')  # 호스


def big_pipe(p, wheel):
    p.r(0, 13, 60, 10, 'pp'); p.r(0, 13, 60, 2, 'pl'); p.r(0, 21, 60, 2, 'pd')  # 가로 배관
    p.r(6, 0, 9, 14, 'pp'); p.r(6, 0, 2, 14, 'pl'); p.r(13, 0, 2, 14, 'pd')  # 위로 꺾인 배관
    p.r(5, 4, 11, 3, 'pd'); p.r(5, 4, 11, 1, 'pl')  # 이음 고리
    for x in (0, 54):  # 플랜지
        p.r(x, 11, 6, 14, 'pd'); p.r(x, 11, 6, 1, 'pl')
        p.px(x + 2, 13, 'T'); p.px(x + 2, 22, 'T')
    for x, y in ((20, 16), (22, 19), (45, 15), (48, 20), (9, 9), (11, 2), (38, 21), (3, 18)):  # 녹
        p.px(x, y, 'pr'); p.px(x + 1, y, 'u')
    p.r(24, 8, 14, 20, 'pd'); p.r(25, 9, 12, 18, 'pp'); p.r(25, 9, 12, 2, 'pl')  # 밸브 몸통
    p.px(26, 25, 'pr'); p.px(35, 12, 'pr')
    p.r(29, 15, 4, 4, 'T'); p.r(29, 15, 4, 1, 'W'); p.r(32, 16, 1, 3, 'S')  # 네모 축(빈 자리)
    if wheel:  # 끼운 붉은 핸들
        p.ring(19, 6, 24, 24, 'r'); p.ring(20, 7, 22, 22, 'R'); p.ring(21, 8, 20, 20, 'R')
        p.ln(23, 10, 39, 26, 'R', 2); p.ln(39, 10, 23, 26, 'R', 2)
        p.el(27, 14, 8, 8, 'r'); p.el(28, 15, 6, 6, 'R'); p.r(30, 17, 2, 2, 'T')
        p.ln(22, 12, 25, 9, 'vr')


@sprite('big_pipe', 'wall', 60, 30, cells=2, top=32)
def big_pipe_s(p):
    big_pipe(p, False)


@sprite('big_pipe_valve', 'wall', 60, 30, cells=2, top=32)
def big_pipe_valve(p):
    big_pipe(p, True)


@sprite('first_aid_kit', 'wall', 18, 16, top=24)
def first_aid_kit(p):
    p.r(6, 0, 6, 2, 's')  # 손잡이
    p.r(0, 2, 18, 14, 'W'); p.r(0, 2, 18, 1, 'P'); p.r(16, 3, 2, 13, 'w'); p.r(0, 14, 18, 2, 'w')
    p.r(0, 6, 18, 1, 'p')  # 뚜껑 이음선
    p.r(7, 5, 4, 9, 'R'); p.r(4, 8, 10, 3, 'R'); p.r(10, 5, 1, 9, 'r'); p.r(4, 10, 10, 1, 'r')


def tablet_glow(p):
    p.el(0, 0, 24, 16, 'tg'); p.el(3, 2, 18, 12, 'tG')


@sprite('tablet_fire_stage', 'floor', 24, 16, under=tablet_glow)
def tablet_fire_stage(p):
    # 무대 바닥에 누운 붉은 오각패(납작한 원근) + 작은 火 무늬
    pts = [(12, 2), (21, 6), (18, 13), (6, 13), (3, 6)]
    p.poly(pts, 'R')
    p.ln(3, 6, 12, 2, 'tr'); p.ln(12, 2, 21, 6, 'tr'); p.ln(6, 13, 18, 13, 'tR'); p.ln(18, 13, 21, 6, 'tR')
    p.grid(10, 5, '''
..Y..
Y.Y.Y
..Y..
.YOY.
Y...Y
''')


@sprite('dressing_mirror', 'wall', 52, 28, cells=2, top=30)
def dressing_mirror(p):
    p.r(0, 0, 52, 23, 'N'); p.r(0, 0, 52, 1, 'M'); p.r(50, 1, 2, 22, 'n')  # 나무 틀
    p.r(5, 4, 42, 17, 'c'); p.r(5, 4, 42, 2, 'C'); p.r(5, 18, 42, 3, 'x')  # 거울
    p.ln(10, 19, 22, 5, 'I'); p.ln(13, 19, 25, 5, 'C'); p.ln(30, 19, 36, 11, 'C')  # 반사
    for x in range(4, 50, 6):  # 위 전구
        p.r(x, 1, 2, 2, 'fw'); p.px(x + 1, 2, 'Y')
    for y in (7, 13, 19):  # 양옆 전구
        for x in (1, 48):
            p.r(x, y, 2, 2, 'fw'); p.px(x + 1, y + 1, 'Y')
    p.px(26, 1, 'j'); p.r(26, 1, 2, 2, 'q')  # 나간 전구 하나
    p.r(0, 23, 52, 5, 'M'); p.r(0, 23, 52, 1, 'L'); p.r(0, 27, 52, 1, 'n')  # 선반
    p.r(8, 20, 2, 4, 'R'); p.r(8, 20, 2, 1, 'W')  # 립스틱
    p.r(14, 19, 4, 5, 'D'); p.r(15, 18, 2, 1, 'k')  # 병
    p.el(36, 21, 7, 3, 'A'); p.px(38, 21, 'W')  # 분첩


@sprite('costume_rack', 'floor', 60, 44, cells=2)
def costume_rack(p):
    for x in (2, 56):  # 기둥·발·바퀴
        p.r(x, 2, 2, 38, 'S'); p.r(x, 2, 1, 38, 'T')
        p.r(x - 2, 39, 6, 2, 's'); p.r(x - 2, 41, 2, 3, 'K'); p.r(x + 2, 41, 2, 3, 'K')
    p.r(1, 1, 58, 2, 'T'); p.r(1, 2, 58, 1, 'S')  # 봉
    # 걸린 옷: (x, 너비, 길이, 색, 그림자색)
    for x, w, l, c, d in ((6, 10, 30, 'R', 'r'), (16, 9, 24, 'V', 'v'), (25, 9, 20, 'W', 'w'), (34, 11, 33, 'Z', 'z'), (45, 9, 26, 'G', 'g')):
        cx = x + w // 2
        p.ln(cx, 2, cx, 4, 'K'); p.ln(x + 1, 6, cx, 4, 'K'); p.ln(x + w - 2, 6, cx, 4, 'K')  # 옷걸이
        p.poly([(x + 1, 6), (x + w - 2, 6), (x + w, 6 + l), (x - 1, 6 + l)], c)  # 몸판(아래로 퍼짐)
        p.r(x - 1, 6, 2, 8, c); p.r(x + w - 1, 6, 2, 8, c)  # 소매
        p.ln(x + w, 7, x + w, 6 + l, d); p.ln(cx, 9, cx + 1, 6 + l, d)
        p.r(cx - 1, 6, 3, 2, d)  # 목둘레
    for y in (14, 20, 26):
        p.px(39, y, 'Y')  # 금빛 단추
    p.r(6, 32, 11, 1, 'v4'); p.r(16, 26, 9, 1, 'Y')  # 장식 단


@sprite('bench', 'floor', 60, 18, cells=2)
def bench(p):
    for x in (4, 52):
        p.r(x, 9, 4, 9, 'n'); p.r(x, 9, 1, 9, 'N')  # 다리
    p.r(8, 14, 44, 2, 'm')  # 가로대
    p.r(0, 1, 60, 7, 'M'); p.r(0, 1, 60, 1, 'L'); p.r(0, 4, 60, 1, 'N')  # 앉는 판(두 장)
    p.r(0, 8, 60, 3, 'N'); p.r(0, 10, 60, 1, 'n')  # 앞 모서리
    for x in (14, 31, 47):
        p.px(x, 2, 'N'); p.px(x + 3, 6, 'N')  # 나뭇결


# ================================================================ 하얀 미로(B 루트)
PENTA = [(11, 0), (21, 7), (18, 20), (4, 20), (1, 7)]
GLYPH = {
    'fire': '''
...#...
..##...
..###..
.#####.
.##.##.
.#...#.
..###..
''',
    'earth': '''
.......
...#...
..###..
.#####.
.......
#######
.......
''',
    'metal': '''
...#...
..#.#..
.#...#.
#..#..#
.#...#.
..#.#..
...#...
''',
    'water': '''
.......
.##..##
#..##..
.......
.##..##
#..##..
.......
''',
    'wood': '''
...#...
.#.#.#.
..###..
...#...
.#.#.#.
..###..
...#...
''',
}
TONE = {  # 면, 밝은 테, 어두운 테, 무늬
    'fire': ('R', 'tr', 'r', 'Y'), 'earth': ('oc', 'ocl', 'ocd', 'm'), 'metal': ('S', 'P', 's', 't'),
    'water': ('X', 'C', 'x', 'I'), 'wood': ('G', 'D', 'g', 'W'),
}


def socket(p):
    p.poly([(x + 1, y + 1) for x, y in PENTA], 'j')  # 벽에 판 홈 그림자


def maze_tablet(p, el):
    socket(p)
    if el is None:  # 빈 홈
        p.poly(PENTA, 'k')
        p.poly([(11, 3), (18, 8), (16, 18), (6, 18), (4, 8)], 'E')
        p.ln(4, 8, 11, 3, 'K'); p.ln(16, 18, 18, 8, 'j'); p.ln(6, 18, 16, 18, 'j')
        return
    face, hi, dk, mk = TONE[el]
    p.poly(PENTA, face)
    p.ln(1, 7, 11, 0, hi); p.ln(11, 0, 21, 7, hi); p.ln(2, 8, 11, 1, hi)
    p.ln(4, 20, 18, 20, dk); p.ln(18, 20, 21, 7, dk); p.ln(5, 19, 17, 19, dk)
    for y, row in enumerate(GLYPH[el].strip('\n').split('\n')):
        for x, ch in enumerate(row):
            if ch == '#':
                p.px(8 + x, 7 + y, mk)


for _el in ('fire', 'earth', 'metal', 'water', 'wood', None):
    sprite(f'maze_tablet_{_el or "empty"}', 'wall', 23, 22, top=27)(lambda p, e=_el: maze_tablet(p, e))


@sprite('barrier', 'decal', 32, 24, line=False)
def barrier(p):
    p.r(0, 0, 32, 24, 'bv')
    for k in range(-24, 32, 7):  # 사선 일렁임
        p.ln(k, 23, k + 23, 0, 'bV')
    p.r(0, 0, 1, 24, 'bV'); p.r(31, 0, 1, 24, 'bV'); p.r(0, 0, 32, 1, 'bV'); p.r(0, 23, 32, 1, 'bV')
    for x, y in ((5, 4), (20, 7), (11, 15), (27, 19), (16, 2), (3, 20), (25, 12)):
        p.px(x, y, 'bW')
    for x, y in ((20, 7), (11, 15)):
        p.px(x - 1, y, 'bV'); p.px(x + 1, y, 'bV'); p.px(x, y - 1, 'bV'); p.px(x, y + 1, 'bV')


def light_pillar(p, f):
    w, h = 24, 50
    px = p.im.load()
    for y in range(h - 6):
        fade = min(1.0, (y + 4) / 18)  # 위로 갈수록 흐려짐
        for x in range(w):
            d = abs(x - 11.5)
            core = 3 + f
            if d <= core:
                a = 230
            elif d <= 7 + f:
                a = 130
            elif d <= 10 + f:
                a = 55
            else:
                continue
            px[x, y] = (255, 252, 236 if d <= core else 230, int(a * fade))
    p.el(0, h - 10, 24, 10, 'sM'); p.el(3, h - 8, 18, 6, 'Q'); p.el(7, h - 7, 10, 4, 'W')  # 바닥에 고인 빛
    for x, y in (((3, 10), (19, 22), (5, 32)) if f == 0 else ((20, 8), (4, 20), (18, 34))):
        px[x, y] = (255, 255, 255, 200)


@sprite('white_light_0', 'floor', 24, 50, line=False)
def white_light_0(p):
    light_pillar(p, 0)


@sprite('white_light_1', 'floor', 24, 50, line=False)
def white_light_1(p):
    light_pillar(p, 1)


# ================================================================ 쓰러진 소영·앉은 지현
def _soyoung_lying():
    im = strip_line(char1x('soyoung_left_0'))
    px = im.load()
    px[11, 22] = C['js'] + (255,); px[11, 23] = C['js'] + (255,)  # 감은 눈
    px[10, 23] = LINE + (255,); px[11, 23] = C['jS'] + (255,); px[11, 24] = C['js'] + (255,)
    im = im.rotate(90, expand=True)  # 머리 왼쪽, 얼굴이 아래(앞)를 보도록 옆으로 누움
    return im.crop(im.getbbox())


SOY = _soyoung_lying()


@sprite('soyoung_lying', 'floor', SOY.width + 8, SOY.height + 3, cells=2)
def soyoung_lying(p):
    ox, oy = 7, 2
    p.poly([(10, 1), (3, 0), (0, 4), (1, 10), (0, 15), (4, 18), (11, 15)], 'sy')  # 바닥에 부채처럼 퍼진 긴 머리
    for x0, y0, x1, y1 in ((9, 4, 2, 2), (9, 8, 1, 8), (9, 12, 2, 15)):
        p.ln(x0, y0, x1, y1, 'sY')
    p.im.alpha_composite(SOY, (ox, oy))


def _jihyeon_top():
    im = strip_line(char1x('jihyeon_down_0'))
    return im.crop((0, 14, 32, 38))  # 머리 ~ 허리


JIH = _jihyeon_top()


@sprite('jihyeon_sitting', 'floor', 32, 35)
def jihyeon_sitting(p):
    # 바닥에 앉아 오른쪽 발목을 감싸 쥔 지현(앞모습): 왼다리는 옆으로 뻗고 오른 무릎은 세움
    p.im.alpha_composite(JIH, (0, 0))
    p.r(6, 23, 20, 6, 'jt'); p.r(5, 25, 22, 4, 'jt')  # 바닥에 퍼진 치마
    for x in (8, 12, 16, 20, 24):
        p.r(x, 23, 1, 6, 'ju')
    p.r(5, 26, 22, 1, 'jv')
    p.r(0, 29, 9, 2, 'js'); p.r(0, 30, 9, 1, 'jS')  # 왼다리(옆으로 뻗음)
    p.r(0, 28, 2, 3, 'jv'); p.r(0, 31, 2, 1, 'jw')
    p.el(17, 23, 6, 5, 'js'); p.px(18, 24, 'W'); p.r(21, 25, 1, 2, 'jS')  # 세운 오른 무릎
    p.r(18, 27, 4, 4, 'js'); p.r(21, 27, 1, 4, 'jS')  # 정강이
    p.r(18, 31, 4, 2, 'jv'); p.r(17, 33, 6, 2, 'jw'); p.r(18, 33, 2, 1, 'jx')  # 양말·구두
    # 원래 양손을 소매로 덮고, 팔을 발목 쪽으로 뻗어 감싸 쥠
    p.r(9, 21, 3, 3, 'jk'); p.r(20, 21, 3, 3, 'jk')
    p.ln(10, 22, 16, 29, 'jl', 2); p.ln(23, 22, 23, 28, 'jl', 2)
    p.r(16, 29, 3, 2, 'js'); p.r(22, 29, 2, 2, 'js'); p.px(17, 31, 'jS')  # 발목을 쥔 손
    p.px(14, 9, 'jS'); p.px(17, 9, 'jS')  # 아파서 찡그린 눈썹


# ================================================================ 아이템 아이콘(30x30 → 외곽선 32x32 → 4배 128)
@sprite('item_extinguisher', 'icon', 30, 30)
def item_extinguisher(p):
    p.r(9, 9, 12, 20, 'R'); p.r(10, 8, 10, 1, 'R'); p.r(11, 7, 8, 1, 'R')  # 통
    p.r(10, 9, 2, 19, 'vr'); p.r(18, 9, 3, 20, 'r'); p.r(9, 28, 12, 1, 'r')
    p.r(9, 15, 12, 6, 'W'); p.r(18, 15, 3, 6, 'w'); p.r(11, 16, 6, 1, 'q'); p.r(11, 18, 4, 1, 'q')  # 표지
    p.r(13, 3, 4, 4, 'S'); p.r(13, 3, 1, 4, 'T'); p.r(12, 2, 6, 1, 'K')  # 꼭지
    p.ln(17, 2, 23, 0, 'K', 2); p.ln(12, 4, 8, 4, 'K', 2)  # 손잡이 레버
    p.px(14, 4, 'Y')  # 안전핀
    p.ln(17, 5, 24, 9, 'K', 2); p.ln(24, 9, 25, 22, 'K', 2); p.r(24, 22, 3, 4, 'k')  # 호스·노즐


@sprite('item_valve_wheel', 'icon', 30, 30)
def item_valve_wheel(p):
    p.el(1, 1, 28, 28, 'r'); p.el(2, 2, 26, 26, 'R'); p.el(6, 6, 18, 18, 'r'); p.el(7, 7, 16, 16, '_')  # 바퀴 테
    for a in (90, 210, 330):  # 바큇살 셋
        x = 15 + 10 * math.cos(math.radians(a)); y = 15 - 10 * math.sin(math.radians(a))
        p.ln(15, 15, x, y, 'R', 3)
    p.el(10, 10, 10, 10, 'r'); p.el(11, 11, 8, 8, 'R'); p.r(13, 13, 4, 4, 'E'); p.r(13, 13, 4, 1, 'K')  # 네모 구멍 허브
    p.ln(5, 8, 9, 4, 'vr'); p.ln(4, 10, 4, 12, 'vr'); p.px(12, 12, 'vr')
    p.el(23, 20, 6, 6, 'k'); p.el(24, 21, 3, 3, 'j')  # 손잡이 혹


@sprite('item_first_aid', 'icon', 30, 30)
def item_first_aid(p):
    p.r(11, 3, 8, 2, 's'); p.r(11, 3, 2, 5, 's'); p.r(17, 3, 2, 5, 's')  # 손잡이
    p.r(2, 7, 26, 21, 'W'); p.r(2, 7, 26, 2, 'P'); p.r(25, 9, 3, 19, 'w'); p.r(2, 25, 26, 3, 'w')
    p.r(2, 12, 26, 1, 'p')  # 뚜껑 이음
    p.r(12, 13, 6, 12, 'R'); p.r(9, 16, 12, 6, 'R'); p.r(16, 13, 2, 12, 'r'); p.r(9, 20, 12, 2, 'r')
    p.r(12, 13, 6, 1, 'vr'); p.r(9, 16, 3, 1, 'vr')
    p.r(4, 9, 2, 2, 'S'); p.r(24, 9, 2, 2, 'S')  # 걸쇠


@sprite('item_tablet_fire', 'icon', 30, 30)
def item_tablet_fire(p):
    # item_tablet_water/earth 와 같은 오각형, 붉은 면 + 주황 테, '火'
    p.grid(0, 4, '''
..............rr..............
............rrttrr............
..........rrttOOttrr..........
........rrttOOttttttrr........
......rrttOOttttttttttrr......
....rrtttttRRRRRRRRtttttrr....
..rrtttttRRRRRRRRRRRRtttttrr..
.rttttttRRRRRRRRRRRRRRttttttr.
.rOttttRRRRRRRRRRRRRRRRtttttr.
.rOtttRRRRRRRRRRRRRRRRRRttttr.
..rtttRRRRRRRRRRRRRRRRRRtttr..
..rOttRRRRRRRRRRRRRRRRRRtttr..
..rOttRRRRRRRRRRRRRRRRRRtttr..
..rtttRRRRRRRRRRRRRRRRRRtttr..
...rttRRRRRRRRRRRRRRRRRRttr...
...rttRRRRRRRRRRRRRRRRRRttr...
...rttRRRRRRRRRRRRRRRRRRttr...
...rttRRRRRRRRRRRRRRRRRRttr...
....rttDDDDDDDDDDDDDDDDttr....
....rtttDDDDDDDDDDDDDDtttr....
....rdttttttttttttttttttdr....
.....rrrrrrrrrrrrrrrrrrrr.....
'''.replace('t', '%').replace('D', '&').replace('d', '@'))
    p.grid(7, 9, '''
.......YY......
.......YY......
.YY....YY....YY
..YY...YY...YY.
...Y...YY...Y..
.......YY......
......YYYY.....
.....YY..YY....
....YY....YY...
...YY......YY..
.YYY........YYY
YY............Y
''')


C.update({'%': C['tr'], '&': C['tR'], '@': C['r']})


# ================================================================ 저장
def render(key):
    """외곽선까지 입힌 1배 이미지"""
    fn, kind, w, h, opt = SPR[key]
    p = Pen(w, h)
    fn(p)
    if opt.get('line', True):
        img = Image.new('RGBA', (w + 2, h + 2), (0, 0, 0, 0))
        img.alpha_composite(p.im, (1, 1))
        img, off = outline(img), 1
    else:
        img, off = p.im, 0
    for layer in ('under', 'over'):
        if layer in opt:
            q = Pen(w, h)
            opt[layer](q)
            base = Image.new('RGBA', img.size, (0, 0, 0, 0))
            if layer == 'under':
                base.alpha_composite(q.im, (off, off)); base.alpha_composite(img)
            else:
                base.alpha_composite(img); base.alpha_composite(q.im, (off, off))
            img = base
    return img


def meta_for(key, img):
    """2배(아이콘 4배) 크기·앵커 (pixel_ch3.py 와 같은 규칙)"""
    _, kind, _, _, opt = SPR[key]
    k = 4 if kind == 'icon' else 2
    w, h = img.width * k, img.height * k
    cells = opt.get('cells', 1)
    ax = -((32 * cells - img.width) // 2) * 2
    if kind == 'icon':
        ax, ay = w // 2, h // 2
    elif kind == 'char':
        ax, ay = w // 2, h - (2 if opt.get('line', True) else 0)
    elif kind == 'wall':
        ay = opt.get('top', 28) * 2
    elif kind == 'decal':
        ay = (img.height + (24 * opt.get('rows', 1) - img.height) // 2) * 2
    else:
        ay = (img.height + 4) * 2
    return k, {'file': f'props_ch4/{key}.png', 'w': w, 'h': h, 'ax': ax, 'ay': ay}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for key in SPR:
        img = render(key)
        k, m = meta_for(key, img)
        img.resize((img.width * k, img.height * k), Image.NEAREST).save(OUT / f'{key}.png')
        meta[key] = m
    json.dump(meta, open(OUT.parent / 'props_ch4.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(meta), '4장 소품·불·미로·인물·아이콘')


def preview(path):
    """도감(어두운 바탕) + 아래에 실제 칸(32x24 격자·벽 앞면) 위에 놓은 모습"""
    imgs = [render(k) for k in SPR]
    cols, x, y, rh, pos = 900, 2, 2, 0, []
    for i in imgs:
        if x + i.width + 3 > cols:
            x, y, rh = 2, y + rh + 3, 0
        pos.append((x, y))
        x += i.width + 3
        rh = max(rh, i.height)
    top = y + rh + 6
    # 게임 배치 미리보기: 벽 줄(32px) + 바닥 줄 두 개
    sheet = Image.new('RGBA', (cols, top + 200), (70, 72, 84, 255))
    for i, xy in zip(imgs, pos):
        sheet.alpha_composite(i, xy)
    d = ImageDraw.Draw(sheet)
    wall_y, row_h = top + 40, 24
    d.rectangle([0, wall_y - 32, cols, wall_y - 1], fill=(206, 200, 186, 255))  # 하얀 미로 같은 밝은 벽
    d.rectangle([0, wall_y, cols, top + 200], fill=(26, 24, 30, 255))  # 어두운 강당 바닥
    for gx in range(0, cols, 32):
        d.line([gx, wall_y, gx, top + 200], fill=(40, 38, 46, 255))
    for gy in range(wall_y, top + 200, row_h):
        d.line([0, gy, cols, gy], fill=(40, 38, 46, 255))
    cx_wall, cx_floor = 0, 0
    floor_base = wall_y + 24 * 3
    for k, i in zip(SPR, imgs):
        kind, opt = SPR[k][1], SPR[k][4]
        if kind == 'icon':
            continue
        _, m = meta_for(k, i)
        cells = opt.get('cells', 1)
        if kind == 'wall':
            ox = cx_wall * 32 - m['ax'] // 2
            sheet.alpha_composite(i, (ox, wall_y - m['ay'] // 2))
            cx_wall += cells
        else:
            if (cx_floor + cells) * 32 > cols:
                cx_floor, floor_base = 0, floor_base + 24 * 3
            ox = cx_floor * 32 - m['ax'] // 2
            sheet.alpha_composite(i, (ox, floor_base - m['ay'] // 2))
            cx_floor += cells
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save(path)


if __name__ == '__main__':
    if '--preview' in sys.argv:
        preview(sys.argv[sys.argv.index('--preview') + 1])
    else:
        main()
