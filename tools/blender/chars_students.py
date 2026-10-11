"""chars_students — 학생 4명(heemin, soyoung, seonga, jihyeon) × 4방향 × 3프레임 = 48장.

실행: <blender-venv>/bin/python tools/blender/chars_students.py [-- key1 key2 ...]
      --measure 를 붙이면 렌더 없이 전 포즈의 투영 경계만 출력(BOUNDS 갱신용).

구조: build_student(cfg) 하나로 모든 학생을 만든다(파라메트릭).
  root(방향 Z회전) ─ body(걷기 상하 흔들림)
     ├ hip_L/R 피벗(허벅지) ─ knee 피벗(정강이, 신발)
     ├ 골반/치마/바지
     └ spine 피벗(움츠림 기울기) ─ 몸통/셔츠/넥타이·리본
          ├ sh_L/R 피벗(어깨) ─ 소매, 손
          └ neck 피벗 ─ 머리, 눈, 머리카락(헤어 쉘 생성기), 안경
캐릭터 정면 = -Y(카메라 쪽). 캐릭터의 왼쪽 = +X (down 방향 기준).
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import bmesh  # noqa: E402
import common as C  # noqa: E402

CAT = 'chars_students'
# 모든 학생·방향·프레임 공통 고정 경계 (sx0, sy0, sx1, sy1) — `--measure` 로 측정 후 여유를 둔 값
BOUNDS = (-0.36, -1.00, 0.36, 0.22)
SAMPLES = 64
rad = math.radians

DIRS = {'down': 0.0, 'up': 180.0, 'right': 90.0, 'left': -90.0}

# 공통 교복 색 (sRGB)
JACKET = '#34405f'
SHIRT = '#e9e7e0'
TROUSER = '#5c5e64'
TIE = '#6c1f27'
RIBBON = '#a8282f'
CHECK_A = '#2b3249'
CHECK_B = '#5d6170'
SOCK = '#e4e3de'
SHOE = '#2a2321'
EYE = '#151012'

# 신체 치수 (타일 단위, 키 1.25)
HIP_Z = 0.47
THIGH = 0.21
HEAD_R = 0.16
NECK_Z = 0.86
HEAD_DZ = 0.20          # neck 피벗 → 머리 중심
SH_X, SH_Z = 0.163, 0.785

# 정면(down)/뒷모습(up) 걷기 보정: 앞다리 보폭 배율, 뒷다리 보폭(앞다리 대비) 배율,
# 뒷무릎 굽힘 배율·상한(°), 엉덩이 바깥 롤(°)
DU_SWING = 0.42
DU_TRAIL = 0.75
DU_KNEE = 0.2
DU_KNEE_MAX = 6.0
DU_ROLL = 2.5


# ───────────────────────── 재질 ─────────────────────────

def _lin(c):
    return C.hex_to_linear(c) if isinstance(c, str) else tuple(c)


def _shade(c, k):
    return tuple(min(1.0, x * k) for x in _lin(c))


def _new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    return m, nt, nt.nodes['Principled BSDF']


def _ramp(nt, fac_out, c0, c1, p0=0.3, p1=0.7):
    r = nt.nodes.new('ShaderNodeValToRGB')
    e0, e1 = r.color_ramp.elements
    e0.position, e1.position = p0, p1
    e0.color = (*c0, 1)
    e1.color = (*c1, 1)
    nt.links.new(fac_out, r.inputs['Fac'])
    return r


def _bump(nt, b, height_out, strength, dist=0.003):
    bp = nt.nodes.new('ShaderNodeBump')
    bp.inputs['Strength'].default_value = strength
    bp.inputs['Distance'].default_value = dist
    nt.links.new(height_out, bp.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])


def m_fabric(name, color, scale=160.0, var=0.80, rough=0.85, sheen=0.15, bump=0.25):
    """옷감: 미세 노이즈 색 얼룩 + 범프 + 시인(sheen)."""
    m, nt, b = _new_mat(name)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = scale
    nz.inputs['Detail'].default_value = 3.0
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    r = _ramp(nt, nz.outputs['Fac'], _shade(color, var), _lin(color))
    nt.links.new(r.outputs['Color'], b.inputs['Base Color'])
    _bump(nt, b, nz.outputs['Fac'], bump, 0.002)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Sheen Weight'].default_value = sheen
    return m


def m_check(name, c1, c2, scale=34.0, rough=0.85):
    """체크 치마: 체커 + 가는 줄(웨이브 밴드) + 노이즈."""
    m, nt, b = _new_mat(name)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    ck = nt.nodes.new('ShaderNodeTexChecker')
    ck.inputs['Color1'].default_value = (*_lin(c1), 1)
    ck.inputs['Color2'].default_value = (*_lin(c2), 1)
    ck.inputs['Scale'].default_value = scale
    nt.links.new(tc.outputs['Object'], ck.inputs['Vector'])
    wv = nt.nodes.new('ShaderNodeTexWave')
    wv.wave_type = 'BANDS'
    wv.bands_direction = 'Z'
    wv.inputs['Scale'].default_value = scale * 0.5
    nt.links.new(tc.outputs['Object'], wv.inputs['Vector'])
    gt = nt.nodes.new('ShaderNodeMath')
    gt.operation = 'GREATER_THAN'
    gt.inputs[1].default_value = 0.93
    nt.links.new(wv.outputs['Fac'], gt.inputs[0])
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    nt.links.new(gt.outputs[0], mix.inputs['Factor'])
    nt.links.new(ck.outputs['Color'], mix.inputs['A'])
    mix.inputs['B'].default_value = (*_shade('#7a3438', 1.0), 1)
    nt.links.new(mix.outputs['Result'], b.inputs['Base Color'])
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 150
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    _bump(nt, b, nz.outputs['Fac'], 0.2, 0.002)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Sheen Weight'].default_value = 0.25
    return m


def m_hair(name, dark, light, streaks=55.0, rough=0.42):
    """머리카락: 정수리에서 방사형으로 뻗는 1D 노이즈 결(radial gradient → 1D noise)."""
    m, nt, b = _new_mat(name)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    gr = nt.nodes.new('ShaderNodeTexGradient')
    gr.gradient_type = 'RADIAL'
    nt.links.new(tc.outputs['Object'], gr.inputs['Vector'])
    mul = nt.nodes.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = streaks
    nt.links.new(gr.outputs['Fac'], mul.inputs[0])
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.noise_dimensions = '1D'
    nz.inputs['Scale'].default_value = 1.0
    nz.inputs['Detail'].default_value = 5.0
    nt.links.new(mul.outputs[0], nz.inputs['W'])
    r = _ramp(nt, nz.outputs['Fac'], _lin(dark), _lin(light), 0.35, 0.75)
    nt.links.new(r.outputs['Color'], b.inputs['Base Color'])
    _bump(nt, b, nz.outputs['Fac'], 0.35, 0.004)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Specular IOR Level'].default_value = 0.6
    return m


def m_plain(name, color, rough=0.6, metal=0.0, emit=None, emit_strength=0.0):
    m, nt, b = _new_mat(name)
    b.inputs['Base Color'].default_value = (*_lin(color), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*_lin(emit), 1)
        b.inputs['Emission Strength'].default_value = emit_strength
    return m


def m_skin(name, color):
    m, nt, b = _new_mat(name)
    b.inputs['Base Color'].default_value = (*_lin(color), 1)
    b.inputs['Roughness'].default_value = 0.55
    b.inputs['Subsurface Weight'].default_value = 0.08
    b.inputs['Subsurface Radius'].default_value = (0.02, 0.01, 0.006)
    b.inputs['Subsurface Scale'].default_value = 0.2
    return m


def m_leather(name, color):
    m, nt, b = _new_mat(name)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 90
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    r = _ramp(nt, nz.outputs['Fac'], _shade(color, 0.8), _lin(color))
    nt.links.new(r.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.32
    b.inputs['Coat Weight'].default_value = 0.3
    return m


# ───────────────────────── 지오메트리 헬퍼 ─────────────────────────

def _obj(name, bm, material=None, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = smooth
    o = bpy.data.objects.new(name, me)
    o.location = loc
    o.rotation_euler = rot
    o.scale = scale
    bpy.context.scene.collection.objects.link(o)
    if material is not None:
        me.materials.append(material)
    if parent is not None:
        o.parent = parent
    return o


def pivot(name, loc, parent=None):
    return C.empty(name, loc, parent)


def loft(name, rings, segs=28, material=None, parent=None, loc=(0, 0, 0), rot=(0, 0, 0),
         gap=None, pleats=0, pleat_amp=0.0, smooth=True):
    """타원 단면 로프트. rings=[(z, rx, ry), ...] 아래→위 (rx=ry=0 이면 극점).
    gap(z) -> 앞(-Y) 트임 반각(rad). None 이면 닫힌 몸통(+뚜껑)."""
    bm = bmesh.new()
    closed = gap is None
    rows = []
    for (z, rx, ry) in rings:
        if rx == 0 and ry == 0:
            rows.append([bm.verts.new((0, 0, z))])
            continue
        row = []
        n = segs if closed else segs + 1
        g = 0.0 if closed else gap(z)
        for i in range(n):
            a = 2 * math.pi * i / segs if closed else g + (2 * math.pi - 2 * g) * i / segs
            k = 1.0
            if pleats:
                t = (a * pleats / (2 * math.pi)) % 1.0
                k = 1.0 - pleat_amp * abs(t * 2 - 1)
            row.append(bm.verts.new((rx * k * math.sin(a), -ry * k * math.cos(a), z)))
        rows.append(row)
    for r0, r1 in zip(rows, rows[1:]):
        if len(r1) == 1:
            for i in range(len(r0) if closed else len(r0) - 1):
                bm.faces.new((r0[i], r0[(i + 1) % len(r0)], r1[0]))
        elif len(r0) == 1:
            for i in range(len(r1) if closed else len(r1) - 1):
                bm.faces.new((r0[0], r1[(i + 1) % len(r1)], r1[i]))
        else:
            n = len(r0)
            for i in range(n if closed else n - 1):
                j = (i + 1) % n
                bm.faces.new((r0[i], r0[j], r1[j], r1[i]))
    if closed:
        if len(rows[0]) > 1:
            bm.faces.new(list(reversed(rows[0])))
        if len(rows[-1]) > 1:
            bm.faces.new(rows[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return _obj(name, bm, material, parent, loc, rot, smooth=smooth)


def solidify(o, t, offset=0.0, even=True):
    md = o.modifiers.new('solid', 'SOLIDIFY')
    md.thickness = t
    md.offset = offset
    md.use_rim = True
    md.use_even_offset = even   # 머리카락처럼 접힌 면이 있으면 False(가시 방지)
    return o


def ellipsoid(name, r, loc, material=None, parent=None, scale=(1, 1, 1), rot=(0, 0, 0), segs=20):
    return C.sphere(name, r, loc, material, scale=scale, parent=parent, segs=segs, rot=rot)


def rbox(name, size, loc, material=None, parent=None, bevel=0.01, rot=(0, 0, 0)):
    return C.box(name, size, loc, material, bevel=bevel, parent=parent, rot=rot)


def torus(name, R, r, loc, material=None, parent=None, rot=(0, 0, 0), seg=24, rseg=8):
    """XZ 평면의 고리(구멍이 Y축 방향) — 안경테."""
    bm = bmesh.new()
    rows = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        row = []
        for j in range(rseg):
            b = 2 * math.pi * j / rseg
            rr = R + r * math.cos(b)
            row.append(bm.verts.new((rr * math.cos(a), r * math.sin(b), rr * math.sin(a))))
        rows.append(row)
    for i in range(seg):
        for j in range(rseg):
            i2, j2 = (i + 1) % seg, (j + 1) % rseg
            bm.faces.new((rows[i][j], rows[i2][j], rows[i2][j2], rows[i][j2]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return _obj(name, bm, material, parent, loc, rot)


def head_mesh(name, r, material, parent, loc):
    """아래쪽(턱)이 살짝 좁아지는 데포르메 머리."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=16, radius=r)
    for v in bm.verts:
        z = v.co.z / r
        if z < 0:
            k = 1.0 - 0.16 * (-z) ** 1.5
            v.co.x *= k
            v.co.y *= 1.0 - 0.06 * (-z)
        v.co.y *= 0.96
        v.co.z *= 0.98
    return _obj(name, bm, material, parent, loc)


def _sstep(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def interp(pts, x):
    """(x, y) 제어점 사이 smoothstep 보간."""
    if x <= pts[0][0]:
        return pts[0][1]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x <= x1:
            return y0 + (y1 - y0) * _sstep(x0, x1, x)
    return pts[-1][1]


def hair_shell(name, r, bottom, radius=None, drape=1.0, crown=1.07, thick=0.02,
               material=None, parent=None, loc=(0, 0, 0), nth=80, n_cap=12, n_low=16):
    """머리카락 껍질 생성기.
    theta: 0 = 정면(-Y), +90° = 캐릭터 왼쪽(+X), ±180° = 뒤.
    bottom(theta_deg) -> 머리카락 끝 높이 (머리 중심 기준, r 단위; -1 미만이면 아래로 늘어뜨림).
    radius(theta_deg, z) -> 수평 반경 배수. drape: 적도 아래에서 0=두피를 따라감, 1=수직으로 늘어짐.
    정수리 부분(s < S0)은 모든 열이 같은 간격으로 샘플돼 가르마 없이 매끈하다."""
    def s_end_of(b):
        if b >= 0:
            return math.acos(min(b, 0.999))
        s_hug = math.acos(max(b, -0.995))
        s_drp = math.pi / 2 - b
        return s_hug + (s_drp - s_hug) * drape

    ths = [-180.0 + 360.0 * i / nth for i in range(nth)]
    ends = [s_end_of(bottom(t)) for t in ths]
    S0 = min(ends) * 0.85
    bm = bmesh.new()
    pole = bm.verts.new((0, 0, r * crown))
    cols = []
    for th, se in zip(ths, ends):
        a = math.radians(th)
        col = []
        ss = [S0 * k / n_cap for k in range(1, n_cap + 1)] + \
             [S0 + (se - S0) * k / n_low for k in range(1, n_low + 1)]
        for s in ss:
            if s <= math.pi / 2:
                z, rho = math.cos(s), math.sin(s)
            else:
                zh, rh = math.cos(min(s, math.pi)), math.sin(min(s, math.pi))
                zd, rd = -(s - math.pi / 2), 1.0
                z = zh + (zd - zh) * drape
                rho = rh + (rd - rh) * drape
            zz = z * crown if z > 0 else z
            mlt = radius(th, z) if radius else 1.0
            col.append(bm.verts.new((r * rho * mlt * math.sin(a), -r * rho * mlt * math.cos(a), r * zz)))
        cols.append(col)
    n = len(cols[0])
    for i in range(nth):
        j = (i + 1) % nth
        bm.faces.new((pole, cols[j][0], cols[i][0]))
        for k in range(n - 1):
            bm.faces.new((cols[i][k], cols[j][k], cols[j][k + 1], cols[i][k + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = _obj(name, bm, material, parent, loc)
    return solidify(o, thick, 0.0, even=False)


# ───────────────────────── 학생 설정 ─────────────────────────

def _tri(x):
    """주기 1 삼각파 0..1."""
    return abs((x % 1.0) * 2 - 1)


def hair_heemin(th, z=None):
    a = abs(th)
    b = interp([(0, 0.66), (36, 0.60), (60, 0.42), (80, 0.14), (100, -0.10), (125, -0.42), (160, -0.62), (180, -0.66)], a)
    if a < 70:   # 짧은 삐침 앞머리
        b -= 0.12 * _tri(th / 14.0) * (1 - a / 70)
    return b


def rad_heemin(th, z):
    return 1.0 + 0.04 * max(0.0, z)


def hair_soyoung(th):
    a = abs(th)
    # 일자 앞머리 → 얼굴 옆 머리(어깨) → 등 뒤 긴 생머리(허리)
    return interp([(0, 0.52), (38, 0.50), (48, -0.55), (62, -1.55), (110, -1.70), (132, -3.15), (180, -3.25)], a)


def rad_soyoung(th, z):
    k = 1.0
    if z < -1.4:     # 등 위로 흘러내리며 살짝 벌어짐
        k += 0.10 * _sstep(-1.4, -3.0, z) * _sstep(100, 150, abs(th))
    if abs(th) < 45 and z > 0:   # 앞머리 볼륨
        k += 0.03
    return k


def hair_seonga(th):
    # 비대칭 옆으로 넘긴 앞머리(캐릭터 왼쪽으로 쓸림) + 턱선 위 단발
    return interp([(-180, -0.62), (-80, -0.70), (-62, -0.55), (-50, 0.70), (-15, 0.66), (12, 0.58),
                   (34, 0.44), (48, -0.10), (62, -0.72), (110, -0.70), (180, -0.62)], th)


def rad_seonga(th, z):
    k = 1.0 + 0.04 * max(0.0, z)
    if z < 0:   # 단발 볼륨: 아래로 갈수록 바깥으로 부풀다가 끝이 살짝 안으로
        k += 0.13 * _sstep(0.0, -0.45, z) - 0.05 * _sstep(-0.5, -0.75, z)
    return k


def hair_jihyeon(th):
    a = abs(th)
    return interp([(0, 0.66), (30, 0.60), (46, 0.30), (60, -0.95), (75, -1.50), (110, -1.62), (180, -1.80)], a)


def rad_jihyeon(th, z):
    k = 1.0 + 0.03 * max(0.0, z)
    if z < -1.1:   # 어깨에 닿아 끝이 살짝 뻗침
        k += 0.10 * _sstep(-1.1, -1.75, z)
    return k


STUDENTS = {
    'heemin': dict(
        boy=True, skin='#e2bc9c', hair=('#18161a', '#46424a'), hair_bottom=hair_heemin, hair_rad=rad_heemin,
        drape=0.0, crown=1.10, ears=True, leg_swing=24, arm_swing=22, knee=30, hunch=0, head_tilt=0, arm_out=7),
    'soyoung': dict(
        boy=False, skin='#f1e0d5', hair=('#141218', '#403c48'), hair_bottom=hair_soyoung, hair_rad=rad_soyoung,
        drape=1.0, crown=1.07, ears=False, leg_swing=18, arm_swing=14, knee=24, hunch=0, head_tilt=0, arm_out=5),
    'seonga': dict(
        boy=False, skin='#e6bc98', hair=('#2c1d17', '#5a3d2e'), hair_bottom=hair_seonga, hair_rad=rad_seonga,
        drape=0.8, crown=1.09, ears=False, leg_swing=26, arm_swing=28, knee=32, hunch=-3, head_tilt=-4, arm_out=9,
        open_jacket=True, hairpin=True),
    'jihyeon': dict(
        boy=False, skin='#eccbb0', hair=('#5e3d28', '#8f6647'), hair_bottom=hair_jihyeon, hair_rad=rad_jihyeon,
        drape=1.0, crown=1.07, ears=False, leg_swing=16, arm_swing=12, knee=22, hunch=6, head_tilt=-4, arm_out=4,
        glasses=True, half_up=True, arm_fwd=8),
}


# ───────────────────────── 빌더 ─────────────────────────

def build_student(name, cfg):
    M = dict(
        jacket=m_fabric(name + '_jacket', JACKET, scale=170, var=0.78),
        shirt=m_fabric(name + '_shirt', SHIRT, scale=200, var=0.90, rough=0.75, sheen=0.1, bump=0.1),
        trouser=m_fabric(name + '_trouser', TROUSER, scale=150, var=0.80),
        skirt=m_check(name + '_skirt', CHECK_A, CHECK_B),
        tie=m_fabric(name + '_tie', TIE if cfg['boy'] else RIBBON, scale=120, var=0.8, rough=0.6),
        sock=m_fabric(name + '_sock', SOCK, scale=220, var=0.9, bump=0.1),
        shoe=m_leather(name + '_shoe', SHOE),
        skin=m_skin(name + '_skin', cfg['skin']),
        eye=m_plain(name + '_eye', EYE, rough=0.25),
        hair=m_hair(name + '_hair', *cfg['hair']),
        brass=m_plain(name + '_brass', '#a88f55', rough=0.35, metal=0.8),
        tag=m_plain(name + '_tag', '#dedbd0', rough=0.5),
    )
    rig = {}
    root = pivot(name + '_root', (0, 0, 0))
    body = pivot(name + '_body', (0, 0, 0), root)
    rig['root'], rig['body'] = root, body

    # ── 다리 (엉덩이 피벗 → 무릎 피벗) ──
    leg_x = 0.068
    shin_len = HIP_Z - THIGH          # 무릎→발바닥
    for side, sx in (('L', 1), ('R', -1)):
        hp = pivot(f'{name}_hip{side}', (sx * leg_x, 0, HIP_Z), body)
        kn = pivot(f'{name}_knee{side}', (0, 0, -THIGH), hp)
        rig['hip' + side], rig['knee' + side] = hp, kn
        if cfg['boy']:
            loft(f'{name}_thigh{side}', [(-THIGH - 0.02, 0.054, 0.056), (-0.1, 0.060, 0.062), (0.04, 0.064, 0.066), (0.06, 0, 0)],
                 16, M['trouser'], hp)
            loft(f'{name}_shin{side}', [(-shin_len + 0.05, 0.053, 0.055), (-0.1, 0.054, 0.056), (0.02, 0.055, 0.057), (0.04, 0, 0)],
                 16, M['trouser'], kn)
        else:
            loft(f'{name}_thigh{side}', [(-THIGH - 0.02, 0.040, 0.042), (-0.1, 0.046, 0.048), (0.04, 0.052, 0.054), (0.06, 0, 0)],
                 16, M['skin'], hp)
            loft(f'{name}_shin{side}', [(-shin_len + 0.04, 0.032, 0.034), (-0.12, 0.040, 0.044), (0.0, 0.040, 0.042), (0.02, 0, 0)],
                 16, M['skin'], kn)
            loft(f'{name}_sock{side}', [(-shin_len + 0.035, 0.037, 0.039), (-shin_len + 0.115, 0.036, 0.038)],
                 16, M['sock'], kn)
        # 구두 (발바닥 z=0, 앞코가 -Y)
        rbox(f'{name}_shoe{side}', (0.082, 0.150, 0.058), (0, -0.026, -shin_len + 0.029), M['shoe'], kn, bevel=0.022)
        rbox(f'{name}_sole{side}', (0.084, 0.152, 0.014), (0, -0.026, -shin_len + 0.007), M['eye'], kn, bevel=0.005)

    # ── 골반: 바지 / 치마 ──
    if cfg['boy']:
        loft(name + '_pelvis', [(0.38, 0.0, 0.0), (0.40, 0.125, 0.09), (0.47, 0.135, 0.098), (0.52, 0.13, 0.095), (0.53, 0, 0)],
             24, M['trouser'], body)
    else:
        loft(name + '_skirt', [(0.300, 0.192, 0.152), (0.40, 0.170, 0.128), (0.50, 0.148, 0.108), (0.565, 0.134, 0.097)],
             40, M['skirt'], body, pleats=16, pleat_amp=0.055)

    # ── 상체 (척추 피벗: 움츠림 기울기) ──
    spine = pivot(name + '_spine', (0, 0, HIP_Z), body)
    rig['spine'] = spine
    z0 = HIP_Z
    if cfg['boy']:
        prof = [(0.42, 0.156, 0.112), (0.50, 0.150, 0.106), (0.62, 0.153, 0.106), (0.73, 0.166, 0.108),
                (0.79, 0.168, 0.100), (0.83, 0.146, 0.090), (0.855, 0.095, 0.072), (0.868, 0, 0)]
    else:
        prof = [(0.495, 0.160, 0.114), (0.56, 0.143, 0.100), (0.66, 0.147, 0.102), (0.74, 0.158, 0.104),
                (0.79, 0.160, 0.098), (0.83, 0.140, 0.088), (0.855, 0.090, 0.070), (0.868, 0, 0)]
    prof_l = [(z - z0, rx, ry) for z, rx, ry in prof]

    def front_y(zw, x=0.0):
        """몸통 앞면 y (월드 z 기준, 척추 로컬)."""
        for (za, ax, ay), (zb, bx, by) in zip(prof, prof[1:]):
            if za <= zw <= zb:
                t = (zw - za) / (zb - za)
                rx, ry = ax + (bx - ax) * t, ay + (by - ay) * t
                return -ry * math.sqrt(max(0.0, 1 - (x / rx) ** 2)) if rx > 0 else 0.0
        return -0.1

    if cfg.get('open_jacket'):
        # 셔츠(안) + 앞이 트인 재킷(밖)
        loft(name + '_shirtcore', [(z, rx * 0.96, ry * 0.96) for z, rx, ry in prof_l], 28, M['shirt'], spine)
        jk = loft(name + '_jacket', [(z, rx * 1.02, ry * 1.04) for z, rx, ry in prof_l[:-1]], 28, M['jacket'], spine,
                  gap=lambda z: rad(interp([(0.03, 40), (0.30, 30), (0.38, 26)], z)))
        solidify(jk, 0.012)
        # 단추(열린 재킷 가장자리)
        for zz in (0.58, 0.66):
            ellipsoid(f'{name}_btn{zz}', 0.010, (0.145 * math.sin(rad(36)) - 0.005, front_y(zz) * 1.04 * math.cos(rad(36)) - 0.006, zz - z0),
                      M['brass'], spine, segs=10)
    else:
        loft(name + '_jacket', prof_l, 28, M['jacket'], spine)
        # 셔츠 V(목 아래 흰 셔츠가 보이는 삼각형)
        bm = bmesh.new()
        zt, zb = 0.856, 0.70
        yt, yb = front_y(0.83) - 0.006, front_y(zb) - 0.004
        vs = [bm.verts.new(p) for p in ((-0.058, yt, zt - z0), (0.058, yt, zt - z0), (0, yb, zb - z0),
                                         (-0.058, yt + 0.03, zt - z0), (0.058, yt + 0.03, zt - z0), (0, yb + 0.03, zb - z0))]
        bm.faces.new(vs[:3]); bm.faces.new(vs[3:][::-1])
        for a, b2 in ((0, 1), (1, 2), (2, 0)):
            bm.faces.new((vs[a], vs[b2], vs[b2 + 3], vs[a + 3]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        _obj(name + '_shirtv', bm, M['shirt'], spine)
        bz = (0.55, 0.65) if cfg['boy'] else (0.58, 0.66)
        for zz in bz:
            ellipsoid(f'{name}_btn{zz}', 0.011, (0, front_y(zz) - 0.004, zz - z0), M['brass'], spine, segs=10)
    # 명찰 (캐릭터 왼쪽 가슴)
    rbox(name + '_tag', (0.050, 0.006, 0.016), (0.078, front_y(0.74, 0.078) - 0.004, 0.74 - z0), M['tag'], spine, bevel=0.002)
    # 셔츠 깃
    solidify(loft(name + '_collar', [(0.835 - z0, 0.058, 0.054), (0.885 - z0, 0.052, 0.048)], 20, M['shirt'], spine,
                  gap=lambda z: rad(14)), 0.01)
    # 넥타이 / 리본
    ty = front_y(0.80) - 0.022
    if cfg['boy']:
        ellipsoid(name + '_knot', 0.018, (0, ty + 0.012, 0.835 - z0), M['tie'], spine, scale=(1.0, 0.7, 0.9))
        rbox(name + '_tie', (0.032, 0.012, 0.15), (0, ty + 0.002, 0.75 - z0), M['tie'], spine, bevel=0.004, rot=(rad(-8), 0, 0))
        rbox(name + '_tietip', (0.026, 0.012, 0.026), (0, ty - 0.007, 0.672 - z0), M['tie'], spine, bevel=0.004, rot=(rad(-8), rad(45), 0))
    else:
        yy = front_y(0.82) - 0.018
        for sx in (1, -1):
            ellipsoid(f'{name}_bow{sx}', 0.026, (sx * 0.030, yy, 0.822 - z0), M['tie'], spine, scale=(1.2, 0.5, 0.75),
                      rot=(0, rad(sx * 12), 0))
            rbox(f'{name}_tail{sx}', (0.018, 0.008, 0.06), (sx * 0.016, yy + 0.002, 0.785 - z0), M['tie'], spine,
                 bevel=0.003, rot=(0, rad(-sx * 18), 0))
        ellipsoid(name + '_bowknot', 0.014, (0, yy - 0.006, 0.822 - z0), M['tie'], spine)

    # ── 팔 (어깨 피벗) ──
    for side, sx in (('L', 1), ('R', -1)):
        sh = pivot(f'{name}_sh{side}', (sx * SH_X, 0, SH_Z - z0), spine)
        rig['sh' + side] = sh
        arm = pivot(f'{name}_arm{side}', (0, 0, 0), sh)
        arm.rotation_euler = (0, rad(-sx * cfg['arm_out']), 0)
        ellipsoid(f'{name}_shcap{side}', 0.054, (0, 0, -0.005), M['jacket'], arm, scale=(1.0, 1.0, 0.92))
        loft(f'{name}_sleeve{side}', [(-0.300, 0.042, 0.044), (-0.18, 0.046, 0.048), (-0.02, 0.052, 0.054)], 16, M['jacket'], arm)
        loft(f'{name}_cuff{side}', [(-0.312, 0.034, 0.036), (-0.296, 0.036, 0.038)], 14, M['shirt'], arm)
        ellipsoid(f'{name}_hand{side}', 0.036, (0, -0.004, -0.338), M['skin'], arm, scale=(0.78, 0.95, 1.2))

    # ── 목, 머리 ──
    neck = pivot(name + '_neck', (0, 0, NECK_Z - z0), spine)
    rig['neck'] = neck
    C.cyl(name + '_neckc', 0.042, 0.12, (0, 0.004, 0.02), M['skin'], parent=neck, verts=16)
    hc = (0, 0, HEAD_DZ)
    head_mesh(name + '_head', HEAD_R, M['skin'], neck, hc)
    # 눈 (단순한 짙은 타원 두 개)
    ea, ee = rad(25), rad(11)
    for sx in (1, -1):
        a = sx * ea
        p = (HEAD_R * 0.93 * math.sin(a) * math.cos(ee) * 0.97, -HEAD_R * 0.96 * 0.93 * math.cos(a) * math.cos(ee),
             HEAD_DZ + HEAD_R * 0.98 * math.sin(ee))
        ellipsoid(f'{name}_eye{sx}', 0.030, p, M['eye'], neck, scale=(1.0, 0.55, 1.5), rot=(-ee, 0, a), segs=14)
    if cfg.get('ears'):
        for sx in (1, -1):
            ellipsoid(f'{name}_ear{sx}', 0.034, (sx * HEAD_R * 0.96, 0.01, HEAD_DZ - 0.02), M['skin'], neck,
                      scale=(0.45, 0.8, 1.15))
    # 머리카락
    hair_shell(name + '_hair', HEAD_R * 1.06, cfg['hair_bottom'], cfg['hair_rad'], drape=cfg['drape'],
               crown=cfg['crown'], material=M['hair'], parent=neck, loc=hc)
    if cfg.get('hairpin'):
        pin = m_plain(name + '_pin', '#d9b23e', rough=0.35, metal=0.3)
        th, zr = rad(-58), 0.42
        rr = HEAD_R * 1.06 * 1.08
        rbox(name + '_hairpin', (0.056, 0.016, 0.017),
             (rr * math.sin(th) * math.cos(math.asin(zr)), -rr * math.cos(th) * math.cos(math.asin(zr)), HEAD_DZ + HEAD_R * zr * 1.1),
             pin, neck, bevel=0.005, rot=(0, rad(-30), th))
    if cfg.get('half_up'):
        # 반묶음: 뒤통수 위쪽 작은 매듭 + 머리끈 + 늘어진 꽁지
        band = m_plain(name + '_band', '#7b2c34', rough=0.5)
        rr = HEAD_R * 1.06
        ellipsoid(name + '_knot', 0.05, (0, rr * 1.02, HEAD_DZ + HEAD_R * 0.30), M['hair'], neck, scale=(1.0, 0.75, 0.85))
        torus(name + '_tie', 0.026, 0.009, (0, rr * 1.08, HEAD_DZ + HEAD_R * 0.30), band, neck, rot=(0, 0, 0), seg=16, rseg=6)
        loft(name + '_tail', [(-0.14, 0.012, 0.010), (-0.06, 0.03, 0.02), (0.0, 0.032, 0.022)], 12, M['hair'], neck,
             loc=(0, rr * 1.13, HEAD_DZ + HEAD_R * 0.26), rot=(rad(14), 0, 0))
    if cfg.get('glasses'):
        frame = m_plain(name + '_frame', '#a58e66', rough=0.3, metal=0.7)
        for sx in (1, -1):
            a = sx * ea
            d = HEAD_R * 1.04
            p = (d * math.sin(a) * 0.97, -d * math.cos(a) * 0.96, HEAD_DZ + HEAD_R * math.sin(ee) * 0.95)
            torus(f'{name}_rim{sx}', 0.042, 0.0055, p, frame, neck, rot=(-ee, 0, a), seg=24, rseg=6)
            # 안경다리
            rbox(f'{name}_temple{sx}', (0.006, 0.13, 0.006), (sx * HEAD_R * 0.99, -0.03, p[2] + 0.004), frame, neck, bevel=0.002)
        C.cyl(name + '_bridge', 0.006, 0.05, (0, -HEAD_R * 1.03, HEAD_DZ + HEAD_R * math.sin(ee) * 0.95 + 0.012), frame,
              parent=neck, verts=8, rot=(0, rad(90), 0))

    # 기본 자세 (움츠림/고개)
    spine.rotation_euler.x = rad(cfg.get('hunch', 0))
    neck.rotation_euler.x = rad(cfg.get('head_tilt', 0))
    return rig


def pose(rig, cfg, frame, direction):
    """frame 0: 서기, 1: 왼발 앞 + 오른팔 앞, 2: 반대. 정면은 로컬 -Y (회전 x<0 이면 발이 앞으로)."""
    s = {0: 0, 1: 1, 2: -1}[frame]
    L, A, K = rad(cfg['leg_swing']), rad(cfg['arm_swing']), rad(cfg['knee'])
    fwd = rad(cfg.get('arm_fwd', 0))
    roll = 0.0
    lead = trail = L
    if direction in ('down', 'up'):
        # 정면/뒷모습: 다리가 카메라 축으로 흔들리므로 보폭을 크게 하면 뒷발이 재킷·치마 단 뒤로 숨고
        # 앞발은 길어 보인다 → 보폭을 줄이고(뒷다리는 조금 더) 뒷무릎은 거의 펴서 두 발이 모두 단 아래로
        # 보이게, 엉덩이를 바깥으로 살짝 돌려(roll) 정강이 사이를 벌린다.
        L = lead = L * DU_SWING
        trail = lead * DU_TRAIL
        K = min(K * DU_KNEE, rad(DU_KNEE_MAX))
        roll = rad(DU_ROLL) if s else 0.0
    # s=1: 왼발 앞(x<0), 오른발 뒤 / s=-1: 반대
    rig['hipL'].rotation_euler.x = -lead if s == 1 else (trail if s == -1 else 0.0)
    rig['hipR'].rotation_euler.x = -lead if s == -1 else (trail if s == 1 else 0.0)
    rig['hipL'].rotation_euler.y = -roll
    rig['hipR'].rotation_euler.y = roll
    # 뒤로 간 다리는 무릎을 굽혀 발뒤꿈치를 든다
    rig['kneeL'].rotation_euler.x = K if s == -1 else 0.0
    rig['kneeR'].rotation_euler.x = K if s == 1 else 0.0
    rig['shR'].rotation_euler.x = -A * s - fwd
    rig['shL'].rotation_euler.x = A * s - fwd
    rig['body'].location.z = -HIP_Z * (1 - math.cos(L)) if s else 0.0
    rig['root'].rotation_euler.z = rad(DIRS[direction])
    # 옆모습은 상체·고개를 카메라 쪽으로 살짝 돌려 얼굴(눈)이 보이게(3/4 치팅)
    yaw = {'right': -1, 'left': 1}.get(direction, 0)
    rig['spine'].rotation_euler.z = rad(10) * yaw
    rig['neck'].rotation_euler.z = rad(18) * yaw


def projected_bounds():
    pts = [C.project(p) for p in C._world_verts([o for o in bpy.context.scene.objects if o.type == 'MESH'])]
    return (min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts))


def main():
    sel = C.only(None)
    measure = '--measure' in sys.argv
    if sel:
        sel.discard('--measure')
    meta = {}
    union = [9, 9, -9, -9]
    meta_path = os.path.join(C.OUT, CAT + '.json')
    if sel and os.path.exists(meta_path):   # 부분 렌더: 기존 메타 유지
        import json
        meta = json.load(open(meta_path, encoding='utf-8'))
    for skin, cfg in STUDENTS.items():
        keys = [f'{skin}_{d}_{f}' for d in DIRS for f in range(3)]
        if sel and not (sel & set(keys)) and skin not in sel:
            continue
        C.reset_scene(SAMPLES)
        C._mat_cache.clear()
        rig = build_student(skin, cfg)
        for d in DIRS:
            for f in range(3):
                key = f'{skin}_{d}_{f}'
                pose(rig, cfg, f, d)
                bpy.context.view_layer.update()
                b = projected_bounds()
                union = [min(union[0], b[0]), min(union[1], b[1]), max(union[2], b[2]), max(union[3], b[3])]
                if b[0] < BOUNDS[0] or b[1] < BOUNDS[1] or b[2] > BOUNDS[2] or b[3] > BOUNDS[3]:
                    print(f'WARN {key} exceeds BOUNDS: {tuple(round(x, 3) for x in b)}')
                if measure or (sel and key not in sel and skin not in sel):
                    continue
                m = C.render_sprite(f'{CAT}/{key}', anchor=(0, 0, 0), bounds=BOUNDS)
                m['file'] = f'{CAT}/{key}.png'
                meta[key] = m
    print('union projected bounds:', tuple(round(x, 3) for x in union))
    if not measure:
        C.write_meta(CAT, meta)


if __name__ == '__main__':
    main()
