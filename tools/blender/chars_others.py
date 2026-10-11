"""chars_others — 수위 이봉구(janitor), 귀신 한나영(naying_hang / naying 기어오기), 머리귀신(head_ghost),
대화창 초상화 5종(portrait_*).

실행:  <venv>/bin/python tools/blender/chars_others.py               # 전부
       <venv>/bin/python tools/blender/chars_others.py -- janitor     # 키 접두어로 일부만

- 캐릭터 스프라이트: common 의 3/4 탑뷰 정사영 카메라, 앵커 = 발 중심 (0,0,0).
  같은 캐릭터(janitor / naying 기어오기)의 모든 프레임은 전 포즈 투영 경계의 합집합(고정 bounds)으로 렌더해
  w/h/ax/ay 가 모두 같다.
- naying 기어오기: 앵커 = 손과 무릎 사이 몸 발자국 중심. naying_hang: 앵커 = 매달린 몸 바로 아래 바닥점.
  밧줄은 위로 z≈2.35 까지. head_ghost: 앵커 = 떠 있는 머리 바로 아래 바닥.
- 초상화: 정면 눈높이 정사영 카메라, 256×320 투명 PNG, 메타 {file,w,h,ax:0,ay:0}.
  학생 4명은 chars_students 의 빌더(build_student/pose)를 그대로 불러 같은 교복·머리 모양을 쓰고,
  대화창 크기에서 읽히도록 눈 하이라이트·눈썹·입·볼터치만 덧붙인다.

캐릭터 빌더(Fig)는 관절 좌표를 월드 공간에서 직접 계산한다(FK 프레임 + 2본 IK).
'L' = 캐릭터의 왼쪽 = 로컬 +X (정면 -Y 를 볼 때), 'R' = -X.
머리 모양·눈은 chars_students 와 같은 방식(턱이 좁은 데포르메 머리, 반쯤 묻힌 짙은 타원 눈).
"""
import json
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import bmesh  # noqa: E402
from mathutils import Vector, Matrix, Euler  # noqa: E402
import common as C  # noqa: E402
import chars_students as CS  # noqa: E402

CAT = 'chars_others'
D2R = math.pi / 180
TAU = math.pi * 2
DIRS = {'down': 0, 'up': 180, 'left': -90, 'right': 90}
SAMPLES = 64


# ---------------------------------------------------------------- 수학 유틸
def E(deg3):
    return Euler(tuple(d * D2R for d in deg3), 'XYZ').to_matrix().to_4x4()


def T(v):
    return Matrix.Translation(Vector(v))


def S(v):
    return Matrix.Diagonal((v[0], v[1], v[2], 1.0))


def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def frame_z(z, up=(0, 0, 1)):
    """로컬 Z 가 z 방향, Y 가 up 쪽을 향하는 회전 행렬(4x4)."""
    z = Vector(z).normalized()
    up = Vector(up)
    if abs(z.dot(up.normalized())) > 0.97:
        up = Vector((0, -1, 0)) if abs(z.y) < 0.9 else Vector((0, 0, 1))
    x = up.cross(z).normalized()
    y = z.cross(x)
    return Matrix((x, y, z)).transposed().to_4x4()


def ik(a, tgt, l1, l2, pole):
    d = tgt - a
    dist = d.length
    dn = d.normalized() if dist > 1e-6 else Vector((0, 0, -1))
    dist = min(max(dist, abs(l1 - l2) + 1e-3), (l1 + l2) * 0.9995)
    ca = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist)
    ca = max(-1.0, min(1.0, ca))
    sa = math.sqrt(1 - ca * ca)
    pp = pole - dn * pole.dot(dn)
    if pp.length < 1e-6:
        pp = dn.orthogonal()
    pp.normalize()
    return a + dn * (l1 * ca) + pp * (l1 * sa), a + dn * dist


# ---------------------------------------------------------------- 재질
_MC = {}


def _lin(c):
    if isinstance(c, str):
        return C.hex_to_linear(c)
    return tuple(c[:3])


def _rgba(c):
    return (*_lin(c), 1.0)


def _scale_col(c, k):
    return tuple(min(1.0, x * k) for x in _lin(c))


class NT:
    """작은 셰이더 노드 빌더."""

    def __init__(self, name):
        self.m = bpy.data.materials.new(name)
        self.m.use_nodes = True
        self.nodes = self.m.node_tree.nodes
        self.links = self.m.node_tree.links
        self.b = self.nodes['Principled BSDF']
        self._co = None

    def co(self, kind='Object'):
        if self._co is None:
            self._co = self.nodes.new('ShaderNodeTexCoord')
        return self._co.outputs[kind]

    def noise(self, scale, detail=3.0, rough=0.55, vec=None, distortion=0.0):
        n = self.nodes.new('ShaderNodeTexNoise')
        n.inputs['Scale'].default_value = scale
        n.inputs['Detail'].default_value = detail
        n.inputs['Roughness'].default_value = rough
        n.inputs['Distortion'].default_value = distortion
        self.links.new(vec if vec is not None else self.co(), n.inputs['Vector'])
        return n.outputs['Factor']

    def wave(self, scale, direction='X', distortion=0.0, detail=0.0, vec=None, profile='SIN'):
        n = self.nodes.new('ShaderNodeTexWave')
        n.wave_type = 'BANDS'
        n.bands_direction = direction
        n.wave_profile = profile
        n.inputs['Scale'].default_value = scale
        n.inputs['Distortion'].default_value = distortion
        n.inputs['Detail'].default_value = detail
        self.links.new(vec if vec is not None else self.co(), n.inputs['Vector'])
        return n.outputs['Factor']

    def ramp(self, fac, stops):
        r = self.nodes.new('ShaderNodeValToRGB')
        self.links.new(fac, r.inputs['Factor'])
        els = r.color_ramp.elements
        stops = sorted(stops, key=lambda s: s[0])
        els[0].position = stops[0][0]
        els[1].position = stops[-1][0]
        for p, _ in stops[1:-1]:
            els.new(p)
        for e, (p, c) in zip(sorted(els, key=lambda e: e.position), stops):
            if isinstance(c, (int, float)):
                e.color = (c, c, c, 1.0)
            else:
                e.color = _rgba(c)
        return r.outputs['Color']

    def mix(self, fac, a, b, blend='MIX'):
        n = self.nodes.new('ShaderNodeMix')
        n.data_type = 'RGBA'
        n.blend_type = blend
        for sock, v in ((n.inputs[0], fac), (n.inputs[6], a), (n.inputs[7], b)):
            if isinstance(v, bpy.types.NodeSocket):
                self.links.new(v, sock)
            elif isinstance(v, (int, float)):
                sock.default_value = v
            else:
                sock.default_value = _rgba(v)
        return n.outputs[2]

    def bump(self, height, strength=0.2, distance=0.01):
        n = self.nodes.new('ShaderNodeBump')
        n.inputs['Strength'].default_value = strength
        n.inputs['Distance'].default_value = distance
        self.links.new(height, n.inputs['Height'])
        self.links.new(n.outputs['Normal'], self.b.inputs['Normal'])

    def set(self, name, v):
        s = self.b.inputs[name]
        if isinstance(v, bpy.types.NodeSocket):
            self.links.new(v, s)
        elif isinstance(v, (int, float)):
            s.default_value = v
        else:
            s.default_value = _rgba(v)


def _cached(key, fn):
    if key not in _MC:
        _MC[key] = fn()
    return _MC[key]


def m_fabric(name, base, var=0.16, scale=7.0, fine=160.0, rough=0.86, bump=0.10,
             stains=None, stain_amt=0.0, stain_scale=None, stains2=None, sheen=0.15):
    def mk():
        t = NT(name)
        light = _scale_col(base, 1 + var * 0.7)
        dark = _scale_col(base, 1 - var)
        col = t.ramp(t.noise(scale, 4, 0.6), [(0.32, light), (0.68, dark)])
        if stains:
            sc = stain_scale or scale * 0.7
            th = 1 - stain_amt
            mask = t.ramp(t.noise(sc, 5, 0.68, distortion=0.6), [(th - 0.03, 0.0), (th + 0.03, 1.0)])
            col = t.mix(mask, col, stains)
        if stains2:
            mask2 = t.ramp(t.noise(sc * 2.3, 4, 0.7, distortion=1.2), [(0.66, 0.0), (0.7, 1.0)])
            col = t.mix(mask2, col, stains2)
        t.set('Base Color', col)
        t.set('Roughness', rough)
        t.set('Sheen Weight', sheen)
        if bump:
            t.bump(t.noise(fine, 2, 0.5), bump, 0.004)
        return t.m
    return _cached(('fab', name), mk)


def m_plaid(name, base, band, line, scale=6.0, rough=0.88, stains=None, stain_amt=0.0):
    """남색/회색 체크(타탄 비슷하게): X·Z 방향 밴드 + 가는 선."""
    def mk():
        t = NT(name)
        wx = t.wave(scale, 'X')
        wz = t.wave(scale, 'Z')
        bx = t.ramp(wx, [(0.5, 0.0), (0.56, 0.5)])
        bz = t.ramp(wz, [(0.5, 0.0), (0.56, 0.5)])
        col = t.mix(bx, base, band)
        col = t.mix(bz, col, band)
        lx = t.ramp(t.wave(scale * 2, 'X'), [(0.9, 0.0), (0.95, 0.8)])
        lz = t.ramp(t.wave(scale * 2, 'Z'), [(0.9, 0.0), (0.95, 0.8)])
        col = t.mix(lx, col, line)
        col = t.mix(lz, col, line)
        n = t.ramp(t.noise(9, 3), [(0.3, 1.0), (0.7, 0.82)])
        col = t.mix(1.0, col, n, 'MULTIPLY')
        if stains:
            th = 1 - stain_amt
            mask = t.ramp(t.noise(5, 5, 0.68, distortion=0.6), [(th - 0.03, 0.0), (th + 0.03, 1.0)])
            col = t.mix(mask, col, stains)
        t.set('Base Color', col)
        t.set('Roughness', rough)
        t.set('Sheen Weight', 0.2)
        t.bump(t.noise(150, 2), 0.1, 0.004)
        return t.m
    return _cached(('plaid', name), mk)


def m_skin(name, base, rough=0.55, sss=0.12, mottle=None, mottle2=None, mottle_amt=0.5):
    def mk():
        t = NT(name)
        col = t.ramp(t.noise(14, 3, 0.5), [(0.3, _scale_col(base, 1.04)), (0.7, _scale_col(base, 0.95))])
        if mottle:
            mk1 = t.ramp(t.noise(9, 6, 0.7, distortion=0.8), [(1 - mottle_amt - 0.08, 0.0), (1 - mottle_amt + 0.12, 0.85)])
            col = t.mix(mk1, col, mottle)
        if mottle2:
            mk2 = t.ramp(t.noise(30, 4, 0.6, distortion=2.0), [(0.62, 0.0), (0.7, 0.7)])
            col = t.mix(mk2, col, mottle2)
        t.set('Base Color', col)
        t.set('Roughness', rough)
        t.set('Subsurface Weight', sss)
        t.set('Subsurface Scale', 0.02)
        t.bump(t.noise(90, 2), 0.05, 0.003)
        return t.m
    return _cached(('skin', name), mk)


def m_hair(name, base, hi, rough=0.42, stripes=14.0, spec=0.45, sheen=0.12, gaps=0.0, gap_from=0.4):
    """UV(u = 둘레, v = 길이)를 따라 가닥 줄무늬.
    gaps > 0 이면 끝(v 큼)으로 갈수록 가닥 사이가 비어(알파) 젖어 엉긴 머리처럼 갈라진다."""
    def mk():
        t = NT(name)
        uv = t.co('UV')
        w = t.wave(stripes, 'X', distortion=3.0, detail=2.0, vec=uv)
        col = t.ramp(w, [(0.0, _scale_col(base, 0.7)), (0.55, base), (1.0, hi)])
        t.set('Base Color', col)
        t.set('Roughness', rough)
        t.set('Specular IOR Level', spec)
        t.set('Sheen Weight', sheen)
        t.bump(w, 0.35, 0.006)
        if gaps > 0:
            sep = t.nodes.new('ShaderNodeSeparateXYZ')
            t.links.new(uv, sep.inputs[0])
            vf = t.nodes.new('ShaderNodeMapRange')
            vf.clamp = True
            vf.inputs['From Min'].default_value = gap_from
            vf.inputs['From Max'].default_value = 1.0
            vf.inputs['To Min'].default_value = 0.0
            vf.inputs['To Max'].default_value = gaps
            t.links.new(sep.outputs['Y'], vf.inputs['Value'])
            w2 = t.wave(stripes * 2.6, 'X', distortion=5.0, detail=1.0, vec=uv)
            thr = t.nodes.new('ShaderNodeMath')
            thr.operation = 'SUBTRACT'
            thr.inputs[0].default_value = 1.0
            t.links.new(vf.outputs['Result'], thr.inputs[1])
            gt = t.nodes.new('ShaderNodeMath')
            gt.operation = 'LESS_THAN'
            t.links.new(w2, gt.inputs[0])
            t.links.new(thr.outputs[0], gt.inputs[1])
            t.links.new(gt.outputs[0], t.b.inputs['Alpha'])
        return t.m
    return _cached(('hair', name), mk)


def m_metal(name, base, rough=0.3, scratch=0.12, scale=70.0):
    def mk():
        t = NT(name)
        t.set('Base Color', base)
        t.set('Metallic', 1.0)
        r = t.ramp(t.noise(scale, 4, 0.6, distortion=0.4), [(0.3, rough - scratch), (0.7, rough + scratch)])
        t.set('Roughness', r)
        t.bump(t.noise(scale * 0.4, 3), 0.06, 0.004)
        return t.m
    return _cached(('metal', name), mk)


def m_rope(name, base):
    def mk():
        t = NT(name)
        w = t.wave(14, 'Z', distortion=1.5, detail=2.0)
        col = t.ramp(w, [(0.0, _scale_col(base, 0.65)), (1.0, _scale_col(base, 1.1))])
        n = t.ramp(t.noise(6, 3), [(0.35, 1.0), (0.7, 0.75)])
        t.set('Base Color', t.mix(1.0, col, n, 'MULTIPLY'))
        t.set('Roughness', 0.95)
        t.bump(w, 0.4, 0.01)
        return t.m
    return _cached(('rope', name), mk)


def mat(name, color, rough=0.6, metal=0.0, emit=None, es=1.0, alpha=1.0):
    return C.mat(name, color, rough, metal, emit, es, alpha)


# ---------------------------------------------------------------- 지오메트리
def _link(o, m=None):
    bpy.context.scene.collection.objects.link(o)
    if m is not None:
        o.data.materials.append(m)
    return o


def mesh_from(name, verts, faces, m=None, smooth_=True, face_uvs=None, merge=False):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    if face_uvs is not None:
        layer = me.uv_layers.new(name='UVMap')
        for poly, fu in zip(me.polygons, face_uvs):
            for li, uv in zip(poly.loop_indices, fu):
                layer.data[li].uv = uv
    if merge:
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
        bm.to_mesh(me)
        bm.free()
    me.update()
    for p in me.polygons:
        p.use_smooth = smooth_
    return _link(bpy.data.objects.new(name, me), m)


def solidify(o, th, offset=0.0, even=False):
    """even offset 은 충돌로 찌그러진 면(치마·머리)에서 정점이 폭주하므로 기본 끔."""
    md = o.modifiers.new('solid', 'SOLIDIFY')
    md.thickness = th
    md.offset = offset
    md.use_even_offset = even
    return o


def ell(name, M, m, segs=24):
    """단위 구 → 행렬 M(회전·이동·스케일)."""
    o = C.sphere(name, 1.0, (0, 0, 0), m, segs=segs)
    o.matrix_world = M
    return o


def seg(name, a, b, r1, r2, m, verts=16):
    """a(반지름 r1) → b(반지름 r2) 원뿔대."""
    a, b = Vector(a), Vector(b)
    d = b - a
    L = max(d.length, 1e-4)
    o = C.cyl(name, r1, L, (a + b) / 2, m, verts=verts, r2=r2)
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    return o


def ball(name, r, p, m, segs=16):
    return C.sphere(name, r, tuple(p), m, segs=segs)


def boxm(name, size, M, m, bevel=0.0):
    o = C.box(name, size, (0, 0, 0), m, bevel=bevel)
    o.matrix_world = M
    return o


def loft(name, rows, segs, m, M=None, cap=(True, True), gap=None, rmod=None, zmod=None, solid=0.0):
    """rows: [(z, rx, ry[, ox, oy])] 로컬. 둘레 φ: 방향 (sinφ, -cosφ) — φ=0 정면(-Y), φ=90° = +X.
    gap(z): 정면 트임 반각(rad) → 열린 면. rmod(φ,z): 반지름 배율. zmod(φ,row): z 오프셋."""
    verts, faces = [], []
    open_ = gap is not None
    n = segs + 1 if open_ else segs
    for ri, row in enumerate(rows):
        z, rx, ry = row[:3]
        ox = row[3] if len(row) > 3 else 0.0
        oy = row[4] if len(row) > 4 else 0.0
        g = gap(z) if open_ else 0.0
        for k in range(n):
            ph = (g + (TAU - 2 * g) * k / segs) if open_ else TAU * k / segs
            s = rmod(ph, z) if rmod else 1.0
            zz = z + (zmod(ph, ri) if zmod else 0.0)
            verts.append((ox + rx * s * math.sin(ph), oy - ry * s * math.cos(ph), zz))
    for ri in range(len(rows) - 1):
        for k in range(segs):
            a = ri * n + k
            b = ri * n + (k + 1) % n
            faces.append((a, b, b + n, a + n))
    if not open_:
        if cap[0]:
            z, _, _ = rows[0][:3]
            ox = rows[0][3] if len(rows[0]) > 3 else 0
            oy = rows[0][4] if len(rows[0]) > 4 else 0
            ci = len(verts)
            verts.append((ox, oy, z))
            for k in range(segs):
                faces.append((ci, (k + 1) % n, k))
        if cap[1]:
            z, _, _ = rows[-1][:3]
            ox = rows[-1][3] if len(rows[-1]) > 3 else 0
            oy = rows[-1][4] if len(rows[-1]) > 4 else 0
            ci = len(verts)
            verts.append((ox, oy, z))
            base = (len(rows) - 1) * n
            for k in range(segs):
                faces.append((ci, base + k, base + (k + 1) % n))
    o = mesh_from(name, verts, faces, m)
    if M is not None:
        o.matrix_world = M
    if solid:
        solidify(o, solid)
    return o


def loft_at(rows, z):
    """rows 의 z 높이 (rx, ry, ox, oy) 선형보간."""
    def full(r):
        return (r[0], r[1], r[2], r[3] if len(r) > 3 else 0.0, r[4] if len(r) > 4 else 0.0)
    rr = [full(r) for r in rows]
    if z <= rr[0][0]:
        return rr[0][1:]
    for a, b in zip(rr, rr[1:]):
        if a[0] <= z <= b[0]:
            t = (z - a[0]) / (b[0] - a[0])
            return tuple(lerp(a[i], b[i], t) for i in range(1, 5))
    return rr[-1][1:]


def front_pt(rows, z, x=0.0, out=0.0):
    rx, ry, ox, oy = loft_at(rows, z)
    u = max(-0.97, min(0.97, (x - ox) / rx))
    return Vector((x, oy - ry * math.sqrt(1 - u * u) - out, z))


def strip(name, rows, M, m, x0, x1, z0, z1, out=0.004, nz=6, solid=0.004, taper=None):
    """몸통 loft 앞면에 붙는 얇은 패치(넥타이·주머니·명찰 등). taper(t)->(x0,x1) 선택."""
    verts, faces = [], []
    for i in range(nz + 1):
        t = i / nz
        z = lerp(z1, z0, t)
        a, b = (x0, x1) if taper is None else taper(t)
        verts.append(front_pt(rows, z, a, out))
        verts.append(front_pt(rows, z, b, out))
    for i in range(nz):
        faces.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
    o = mesh_from(name, verts, faces, m)
    o.matrix_world = M
    if solid:
        solidify(o, solid)
    return o


def tube(name, pts, r, m, k=8, closed=False, rfn=None):
    pts = [Vector(p) for p in pts]
    n = len(pts)
    verts, faces = [], []
    nrm = None
    for i, p in enumerate(pts):
        if closed:
            t = pts[(i + 1) % n] - pts[i - 1]
        else:
            t = pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]
        t.normalize()
        if nrm is None:
            nrm = t.orthogonal().normalized()
        nrm = (nrm - t * nrm.dot(t)).normalized()
        bi = t.cross(nrm)
        rr = r * (rfn(i / max(1, n - 1)) if rfn else 1.0)
        for j in range(k):
            a = TAU * j / k
            verts.append(p + (nrm * math.cos(a) + bi * math.sin(a)) * rr)
    rings = n if closed else n - 1
    for i in range(rings):
        i2 = (i + 1) % n
        for j in range(k):
            faces.append((i * k + j, i * k + (j + 1) % k, i2 * k + (j + 1) % k, i2 * k + j))
    if not closed:
        c0 = len(verts)
        verts.append(pts[0])
        c1 = len(verts)
        verts.append(pts[-1])
        for j in range(k):
            faces.append((c0, (j + 1) % k, j))
            faces.append((c1, (n - 1) * k + j, (n - 1) * k + (j + 1) % k))
    return mesh_from(name, verts, faces, m)


# ---------------------------------------------------------------- 충돌체(머리카락·치마 드레이프용)
class Coll:
    def __init__(self, kind, **kw):
        self.kind = kind
        self.__dict__.update(kw)
        if kind == 'ell':
            self.Minv = self.M.inverted()

    def push(self, p):
        if self.kind == 'ell':
            q = self.Minv @ p
            rx, ry, rz = self.r
            u = Vector((q.x / rx, q.y / ry, q.z / rz))
            if u.length < 1.0:
                u = u.normalized() if u.length > 1e-6 else Vector((0, -1, 0))
                return self.M @ Vector((u.x * rx, u.y * ry, u.z * rz))
            return p
        a, b, r = self.a, self.b, self.rad
        ab = b - a
        t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-9)))
        c = a + ab * t
        d = p - c
        if d.length < r:
            if d.length < 1e-6:
                d = Vector((0, 0, 1))
            return c + d.normalized() * r
        return p


def push_all(p, colls):
    for c in colls:
        p = c.push(p)
    return p


# ---------------------------------------------------------------- 체형
# 수위(어른, 키 ≈1.28): 학생보다 머리가 조금 작고 배가 나온 체형
JAN = dict(ankle=0.065, shin=0.235, thigh=0.25, hip_x=0.074, torso=0.38, sh_x=0.168, sh_dz=0.05,
           uarm=0.19, farm=0.17, neck=0.06, head=(0.146, 0.14, 0.15), head_up=0.135)
# 귀신(여학생 체형, 팔·목이 비정상적으로 김)
GHOST = dict(ankle=0.055, shin=0.21, thigh=0.215, hip_x=0.06, torso=0.33, sh_x=0.135, sh_dz=0.045,
             uarm=0.225, farm=0.215, neck=0.085, head=(0.148, 0.142, 0.158), head_up=0.13)

JAN_TORSO = [(0.0, 0.136, 0.1, 0, -0.008), (0.06, 0.143, 0.11, 0, -0.018), (0.13, 0.147, 0.112, 0, -0.018),
             (0.2, 0.151, 0.105, 0, -0.008), (0.27, 0.16, 0.097), (0.325, 0.168, 0.092), (0.36, 0.156, 0.085),
             (0.388, 0.112, 0.068), (0.404, 0.05, 0.04)]
GIRL_TORSO = [(-0.02, 0.11, 0.08), (0.05, 0.104, 0.077), (0.12, 0.108, 0.082), (0.2, 0.122, 0.09),
              (0.27, 0.13, 0.086), (0.31, 0.13, 0.078), (0.34, 0.088, 0.058), (0.355, 0.04, 0.032)]


def head_taper(p, r):
    """chars_students.head_mesh 와 같은 턱 좁힘(아래 반구)."""
    z = p.z / r[2]
    if z < 0:
        p = Vector((p.x * (1.0 - 0.16 * (-z) ** 1.5), p.y * (1.0 - 0.06 * (-z)), p.z))
    return p


class Fig:
    """포즈 → 월드 관절 좌표/프레임 (FK + 2본 IK).
    pose 키: facing(도), root(이동), pelvis(골반 오프셋), pelvis_rot/spine/neck(도, XYZ),
    leg{L,R}/arm{L,R}: {'dir'} | {'rel'} | {'at'} | {'mid','end'} (+ 'pole'), foot{L,R}: pitch/roll/yaw/turn."""

    def __init__(self, cfg, pose):
        D = self.D = cfg
        self.pose = pose
        f = pose.get('facing', 0)
        self.Rr = Matrix.Rotation(f * D2R, 4, 'Z')
        self.R3 = self.Rr.to_3x3()
        self.M_root = T(pose.get('root', (0, 0, 0))) @ self.Rr
        self.hip_z = D['ankle'] + D['shin'] + D['thigh']
        self.M_pel = self.M_root @ T(Vector((0, 0, self.hip_z)) + Vector(pose.get('pelvis', (0, 0, 0)))) \
            @ E(pose.get('pelvis_rot', (0, 0, 0)))
        self.M_tor = self.M_pel @ E(pose.get('spine', (0, 0, 0)))
        self.M_nb = self.M_tor @ T((0, 0, D['torso']))
        self.M_neck = self.M_nb @ E(pose.get('neck', (0, 0, 0)))
        self.M_hd = self.M_neck @ T((0, 0, D['neck'] + D['head_up']))
        self.J = {}
        for side, sx in (('L', 1), ('R', -1)):
            hip = self.M_pel @ Vector((sx * D['hip_x'], 0, -0.02))
            sh = self.M_tor @ Vector((sx * D['sh_x'], 0, D['torso'] - D['sh_dz']))
            leg = pose.get('leg' + side, {'dir': (0, 0, -1)})
            arm = pose.get('arm' + side, {'dir': (sx * 0.14, 0.02, -1)})
            knee, ankle = self.limb(hip, leg, D['thigh'], D['shin'], (0, -1, 0))
            el, wr = self.limb(sh, arm, D['uarm'], D['farm'], (sx * 0.4, 1, 0))
            self.J.update({'hip' + side: hip, 'knee' + side: knee, 'ankle' + side: ankle,
                           'sh' + side: sh, 'el' + side: el, 'wr' + side: wr})

    def fw(self, v):
        return self.R3 @ Vector(v)

    def limb(self, root, spec, l1, l2, pole):
        if 'mid' in spec:
            return self.M_root @ Vector(spec['mid']), self.M_root @ Vector(spec['end'])
        if 'rel' in spec:
            tgt = root + self.fw(spec['rel'])
        elif 'at' in spec:
            tgt = self.M_root @ Vector(spec['at'])
        else:
            tgt = root + self.fw(spec['dir']).normalized() * (l1 + l2)
        return ik(root, tgt, l1, l2, self.fw(spec.get('pole', pole)))

    def M_foot(self, side):
        sp = self.pose.get('foot' + side, {})
        sx = 1 if side == 'L' else -1
        return T(self.J['ankle' + side]) @ self.Rr @ E((sp.get('pitch', 0), sp.get('roll', 0) * sx,
                                                          sx * sp.get('yaw', 6) + sp.get('turn', 0)))

    def fdir(self, side):
        return (self.J['wr' + side] - self.J['el' + side]).normalized()

    def M_hand(self, side):
        return T(self.J['wr' + side]) @ frame_z(self.fdir(side), self.fw((0, -1, 0.3)))

    def M_hand_flat(self, side):
        d = self.fdir(side)
        d = Vector((d.x, d.y, 0)).normalized()
        w = self.J['wr' + side]
        return T((w.x, w.y, 0.0)) @ frame_z(d, (0, 0, 1))

    # 머리 표면 점(머리 로컬) — th: 정수리에서 각도, ph: 정면 0, +X(캐릭터 왼쪽) 90
    def head_pt(self, th, ph, out=0.0, R=1.0):
        r = [c * R for c in self.D['head']]
        th, ph = th * D2R, ph * D2R
        p = Vector((r[0] * math.sin(th) * math.sin(ph), -r[1] * math.sin(th) * math.cos(ph), r[2] * math.cos(th)))
        n = Vector((p.x / r[0] ** 2, p.y / r[1] ** 2, p.z / r[2] ** 2)).normalized()
        p = head_taper(p, r)
        return p + n * out, n


class HeadFig(Fig):
    """몸 없는 머리(head_ghost)용: M_hd 와 head 치수만."""

    def __init__(self, head, M_hd):
        self.D = dict(head=head)
        self.pose = {}
        self.Rr = Matrix.Identity(4)
        self.R3 = Matrix.Identity(3)
        self.M_hd = M_hd
        self.J = {}


def ground(cfg, pose, foot_z=None):
    """'dir' 다리(뻣뻣한 다리 등)가 바닥을 뚫거나 떠 있으면 골반 높이를 고쳐 가장 낮은 발목을 ankle 높이에 맞춘다."""
    foot_z = cfg['ankle'] if foot_z is None else foot_z
    for _ in range(4):
        fig = Fig(cfg, pose)
        lo = min(fig.J['ankleL'].z, fig.J['ankleR'].z)
        dz = foot_z - lo
        if abs(dz) < 1e-4:
            break
        px, py, pz = pose.get('pelvis', (0, 0, 0))
        pose['pelvis'] = (px, py, pz + dz)
        # 'at' 다리 목표도 같이 올리면 안 되므로 그대로 둔다(IK 가 닿으면 발은 제자리)
    return pose


def face_ell(fig, name, th, ph, size, m, out=0.0, spin=0.0, segs=16):
    p, n = fig.head_pt(th, ph, out)
    return ell(name, fig.M_hd @ T(p) @ frame_z(n) @ E((0, 0, spin)) @ S(size), m, segs)


def face_arc(fig, name, th0, ph0, th1, ph1, bulge, r, m, out=0.003, n=9, rfn=None):
    pts = []
    for i in range(n):
        t = i / (n - 1)
        th = lerp(th0, th1, t) + bulge * 4 * t * (1 - t)
        ph = lerp(ph0, ph1, t)
        pts.append(fig.M_hd @ fig.head_pt(th, ph, out)[0])
    return tube(name, pts, r, m, k=6, rfn=rfn)


# ---------------------------------------------------------------- 공용 신체 파트
def draw_leg(fig, side, m_thigh, m_shin, rt, rs, rk):
    J = fig.J
    seg('thigh' + side, J['hip' + side], J['knee' + side], rt[0], rt[1], m_thigh)
    ball('knee' + side, rk, J['knee' + side], m_shin)
    seg('shin' + side, J['knee' + side], J['ankle' + side], rs[0], rs[1], m_shin)


def draw_shoe(fig, side, m, size=(0.085, 0.165, 0.06), fwd=0.045, sole=None):
    Mf = fig.M_foot(side)
    boxm('shoe' + side, size, Mf @ T((0, -fwd, -0.032)), m, bevel=0.022)
    if sole is not None:
        boxm('sole' + side, (size[0] * 1.03, size[1] * 1.02, 0.014), Mf @ T((0, -fwd, -0.058)), sole, bevel=0.005)


def draw_barefoot(fig, side, m, m_sole=None):
    Mf = fig.M_foot(side)
    ell('foot' + side, Mf @ T((0, -0.04, -0.026)) @ S((0.032, 0.075, 0.021)), m, 14)
    ell('heel' + side, Mf @ T((0, 0.0, -0.028)) @ S((0.029, 0.035, 0.025)), m, 12)
    if m_sole is not None:   # 더러운 발바닥
        ell('sole' + side, Mf @ T((0, -0.035, -0.04)) @ S((0.028, 0.07, 0.011)), m_sole, 12)
    for i, dx in enumerate((-0.018, -0.006, 0.006, 0.018)):
        ell('toe%s%d' % (side, i), Mf @ T((dx, -0.11, -0.032)) @ S((0.007, 0.013, 0.008)), m, 8)


def draw_arm(fig, side, m_up, m_fore, ru, rf, re):
    J = fig.J
    seg('uarm' + side, J['sh' + side], J['el' + side], ru[0], ru[1], m_up)
    ball('elbow' + side, re, J['el' + side], m_fore)
    seg('farm' + side, J['el' + side], J['wr' + side], rf[0], rf[1], m_fore)


def draw_hand(fig, side, m, size=(0.03, 0.025, 0.042)):
    ell('hand' + side, fig.M_hand(side) @ T((0, 0, size[2] * 0.7)) @ S(size), m)


def draw_head(fig, m, segs=28, ears=True, ear_size=(0.022, 0.034, 0.042)):
    """chars_students 와 같은 턱이 살짝 좁은 데포르메 머리."""
    D = fig.D
    r = D['head']
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=segs // 2, radius=1.0)
    for v in bm.verts:
        p = head_taper(Vector((v.co.x * r[0], v.co.y * r[1], v.co.z * r[2])), r)
        v.co = p
    me = bpy.data.meshes.new('head')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    o = _link(bpy.data.objects.new('head', me), m)
    o.matrix_world = fig.M_hd
    if ears:
        for sx in (1, -1):
            ell('ear', fig.M_hd @ T((sx * r[0] * 0.95, 0.008, -0.016)) @ S(ear_size), m, 12)
    return o


def draw_neck(fig, m, r=0.046, top=0.35):
    a = fig.M_tor @ Vector((0, 0, fig.D['torso'] - 0.04))
    b = fig.M_neck @ Vector((0, 0, fig.D['neck'] + fig.D['head_up'] * top))
    seg('neck', a, b, r, r * 0.95, m)


def st_eyes(fig, m, ph=25.0, el=11.0, size=(0.03, 0.0165, 0.045), name='eye', inset=0.93):
    """chars_students 와 같은 방식의 눈(머리 안쪽에 반쯤 묻힌 짙은 타원체)."""
    r = fig.D['head']
    out = []
    for sx in (1, -1):
        a, e = sx * ph * D2R, el * D2R
        p = Vector((r[0] * inset * math.sin(a) * math.cos(e) * 0.97, -r[1] * inset * math.cos(a) * math.cos(e),
                    r[2] * 0.98 * math.sin(e)))
        Me = fig.M_hd @ T(p) @ Euler((-e, 0, a), 'XYZ').to_matrix().to_4x4() @ S(size)
        ell(name, Me, m, 14)
        out.append(Me)
    return out


def eye_glints(Mes, m, big=0.0085, small=0.0045):
    """눈 타원체 앞면에 흰 하이라이트(초상화용). 화면 왼쪽 위 큰 점 + 오른쪽 아래 작은 점."""
    for Me in Mes:
        for (u, v, rr) in ((-0.38, 0.42, big), (0.4, -0.38, small)):
            y = -math.sqrt(max(0.0, 1 - u * u - v * v)) - 0.12
            c = Me @ Vector((u, y, v))
            nrm = (Me.to_3x3() @ Vector((0, -1, 0))).normalized()
            ell('glint', T(c) @ frame_z(nrm) @ S((rr, rr * 1.15, rr * 0.35)), m, 10)


# ---------------------------------------------------------------- 머리카락(중력 커튼)
def hair_curtain(name, fig, m, Lfn, R=1.06, N=80, step=0.01, detach=0.0, colls=(), floor=0.004,
                 thick=0.007, spread=0.18, seed=1, jitter=0.05, floor_dir=None):
    """정수리 극점에서 출발하는 N 개 가닥 열을 두피를 따라 내려보내다(법선 z <= detach 면)
    수직으로 떨어뜨리고(충돌체를 피함), 바닥에 닿으면 바깥으로 끌리게 펼친 커튼 메시.
    Lfn(ph) = 가닥 길이(정수리부터, 타일 단위). ph: 0=정면(-Y), +X 쪽 90°."""
    Mh = fig.M_hd
    R3 = Mh.to_3x3()
    rx, ry, rz = [c * R for c in fig.D['head']]
    center = Mh.translation.copy()
    rnd = random.Random(seed)
    top = Mh @ Vector((0, 0, rz))
    cols = []
    for k in range(N):
        ph = TAU * k / N
        L = max(0.0, Lfn(ph)) * (1 + jitter * (rnd.random() * 2 - 1))
        pts = []
        s, prev, th = 0.0, top, 0.0
        state, drift, dirf = 'scalp', Vector((0, 0, 0)), None
        guard = 0
        while s < L and guard < 3000:
            guard += 1
            if state == 'scalp':
                th += 0.01
                pl = Vector((rx * math.sin(th) * math.sin(ph), -ry * math.sin(th) * math.cos(ph), rz * math.cos(th)))
                nl = Vector((pl.x / rx ** 2, pl.y / ry ** 2, pl.z / rz ** 2)).normalized()
                nw = R3 @ nl
                if nw.z <= detach or th > math.pi * 0.93:
                    state = 'fall'
                    h = prev - center
                    h.z = 0
                    drift = h.normalized() if h.length > 1e-5 else Vector((0, 0, 0))
                    continue
                pw = Mh @ head_taper(pl, (rx, ry, rz))
                dd = (pw - prev).length
                if dd >= step:
                    pts.append(pw)
                    s += dd
                    prev = pw
            elif state == 'fall':
                p = prev + Vector((0, 0, -step)) + drift * (step * spread)
                p = push_all(p, colls)
                s += step
                if p.z <= floor:
                    p.z = floor
                    state = 'floor'
                    base = drift if drift.length > 0.1 else Vector((0, -1, 0))
                    if floor_dir is not None:
                        base = (base * 0.4 + Vector(floor_dir)).normalized()
                    dirf = Matrix.Rotation((rnd.random() * 2 - 1) * 0.3, 3, 'Z') @ base
                pts.append(p)
                prev = p
            else:
                p = prev + dirf * step
                p.z = floor
                s += step
                pts.append(p)
                prev = p
        cols.append(pts)
    verts = [top]
    idx = []
    for c in cols:
        idx.append(list(range(len(verts), len(verts) + len(c))))
        verts.extend(c)
    faces, fuv = [], []
    Jmax = max(1, max(len(c) for c in cols))
    for k in range(N):
        k2 = (k + 1) % N
        a, b = idx[k], idx[k2]
        u0, u1 = k / N, (k + 1) / N
        if a and b:
            faces.append((0, a[0], b[0]))
            fuv.append(((0.5 * (u0 + u1), 0.0), (u0, 1 / Jmax), (u1, 1 / Jmax)))
        n = min(len(a), len(b))
        for j in range(n - 1):
            faces.append((a[j], a[j + 1], b[j + 1], b[j]))
            v0, v1 = (j + 1) / Jmax, (j + 2) / Jmax
            fuv.append(((u0, v0), (u0, v1), (u1, v1), (u1, v0)))
    o = mesh_from(name, verts, faces, m, face_uvs=fuv)
    md = o.modifiers.new('solid', 'SOLIDIFY')
    md.thickness = thick
    md.offset = 0.0
    md.use_even_offset = False
    return o


def strays(name, fig, m, n, seed, th_rng=(20, 100), length=(0.08, 0.2), r=0.0045, R=1.07, droop=0.6, curl=0.5):
    """헝클어진 잔머리 가닥(튜브)."""
    rnd = random.Random(seed)
    for i in range(n):
        th = rnd.uniform(*th_rng)
        ph = rnd.uniform(0, 360)
        p, nrm = fig.head_pt(th, ph, 0.0, R)
        p0 = fig.M_hd @ p
        d = (fig.M_hd.to_3x3() @ nrm).normalized()
        L = rnd.uniform(*length)
        pts = [p0]
        side = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), 0)) * curl
        q = p0.copy()
        for j in range(1, 6):
            t = j / 5
            dd = (d * (1 - droop * t) + Vector((0, 0, -droop * t)) + side * t).normalized()
            q = q + dd * (L / 5)
            pts.append(q.copy())
        tube(name, pts, r, m, k=5, rfn=lambda u: 1.0 - 0.8 * u)


# ---------------------------------------------------------------- 소품
def flashlight(fig, side, d_root, k=1.0):
    """손에 쥔 손전등. d_root = 캐릭터 기준 비추는 방향. 렌즈는 따뜻한 흰색으로 발광."""
    body = m_metal('flash_body', '#8e9298', 0.35, 0.1)
    rub = mat('flash_rubber', '#18181a', 0.8)
    lens = mat('flash_lens', '#fff6dc', 0.1, emit='#fff0c4', es=9.0)
    rim = m_metal('flash_rim', '#9fa3a8', 0.25, 0.08)
    Mh = fig.M_hand(side)
    c = Mh @ Vector((0, 0, 0.03))
    z = fig.fw(d_root).normalized()
    a, b, h = c - z * 0.07 * k, c + z * 0.065 * k, c + z * 0.115 * k
    seg('fl_tail', a - z * 0.014 * k, a, 0.021 * k, 0.023 * k, rub)
    seg('fl_body', a, b, 0.023 * k, 0.023 * k, body)
    seg('fl_head', b, h, 0.024 * k, 0.037 * k, body)
    seg('fl_rim', h - z * 0.004 * k, h + z * 0.004 * k, 0.04 * k, 0.04 * k, rim)
    seg('fl_lens', h, h + z * 0.006 * k, 0.031 * k, 0.031 * k, lens)


def bat(fig, side, d_root, length=0.55):
    metal = m_metal('bat_alu', '#c3c8ce', 0.24, 0.1)
    grip = mat('bat_grip', '#1c1c1e', 0.75)
    Mh = fig.M_hand(side)
    c = Mh @ Vector((0, 0, 0.03))
    d = fig.fw(d_root).normalized()
    k = length / 0.53
    knob = c - d * 0.07 * k
    ell('bat_knob', T(knob) @ frame_z(d) @ S((0.022, 0.022, 0.012)), grip)
    seg('bat_grip', knob, c + d * 0.09 * k, 0.014, 0.015, grip)
    seg('bat_taper', c + d * 0.09 * k, c + d * 0.27 * k, 0.015, 0.031, metal)
    seg('bat_barrel', c + d * 0.27 * k, c + d * 0.46 * k, 0.031, 0.033, metal)
    ell('bat_cap', T(c + d * 0.46 * k) @ frame_z(d) @ S((0.033, 0.033, 0.014)), metal)


# ---------------------------------------------------------------- 수위 이봉구
def janitor_mats():
    return dict(
        skin=m_skin('jan_skin', '#b8937c', rough=0.38, sss=0.06),
        shirt=m_fabric('jan_shirt', '#6a7562', var=0.14),
        shirt2=m_fabric('jan_collar', '#737e6a', var=0.1),
        trim=m_fabric('jan_trim', '#3f4739', var=0.1),
        pants=m_fabric('jan_pants', '#4d5647', var=0.14),
        belt=mat('jan_belt', '#2a231e', 0.45),
        buckle=m_metal('jan_buckle', '#b8a470', 0.3),
        badge=m_metal('jan_badge', '#d0b260', 0.28),
        patch=mat('jan_patch', '#2f3a52', 0.7),
        btn=mat('jan_btn', '#2a2e27', 0.5),
        shoe=mat('jan_shoe', '#1d1c1d', 0.3),
        sole=mat('jan_sole', '#121212', 0.8),
        hair=m_hair('jan_hair', '#8e8c86', '#cdcac2', rough=0.6, stripes=26),
        eye=mat('jan_eye', '#151110', 0.25),
        brow=mat('jan_brow', '#8d8a84', 0.85),
        lip=mat('jan_lip', '#7b4a40', 0.6),
        wrinkle=mat('jan_wrinkle', '#9c7059', 0.7),
        white=mat('eye_hi', '#ffffff', 0.2, emit='#ffffff', es=0.6),
    )


def jan_fringe(fig, m, R=1.05, seed=3):
    """대머리 둘레(귀 위 ~ 뒤통수)의 회색 머리 띠."""
    rnd = random.Random(seed)
    n_ph, n_th = 44, 5
    ph0, ph1 = 62.0, 298.0
    verts, faces, fuv = [], [], []
    for i in range(n_ph + 1):
        u = i / n_ph
        ph = lerp(ph0, ph1, u)
        e = min(1.0, min(i, n_ph - i) / (n_ph * 0.16))
        tt = lerp(96.0, 64.0, smooth(0, 1, e))          # 끝(구레나룻 쪽)은 위가 낮다
        tb = lerp(112.0, 116.0, 0.5 + 0.5 * math.cos((ph - 180) * D2R)) + rnd.uniform(-3, 3)
        for j in range(n_th + 1):
            th = lerp(tt, tb, j / n_th)
            rr = R + 0.015 * math.sin(j / n_th * math.pi)
            verts.append(fig.M_hd @ fig.head_pt(th, ph, 0.0, rr)[0])
    W = n_th + 1
    for i in range(n_ph):
        for j in range(n_th):
            faces.append((i * W + j, i * W + j + 1, (i + 1) * W + j + 1, (i + 1) * W + j))
            fuv.append(((i / n_ph, j / n_th), (i / n_ph, (j + 1) / n_th), ((i + 1) / n_ph, (j + 1) / n_th),
                        ((i + 1) / n_ph, j / n_th)))
    o = mesh_from('jan_fringe', verts, faces, m, face_uvs=fuv)
    solidify(o, 0.012)
    return o


def build_janitor(pose, detail=False):
    D = JAN
    fig = Fig(D, pose)
    M = janitor_mats()
    t = D['torso']
    segs = 40 if detail else 28
    loft('jan_torso', JAN_TORSO, segs, M['shirt'], fig.M_tor)
    loft('jan_collar', [(t - 0.012, 0.08, 0.068), (t + 0.04, 0.068, 0.059)], 24, M['shirt2'], fig.M_tor,
         gap=lambda z: 0.55, solid=0.009)
    # 단추·주머니·견장·배지
    for z in (0.07, 0.15, 0.23, 0.31):
        p = front_pt(JAN_TORSO, z, 0.0, 0.004)
        ball('jan_btn', 0.0085, fig.M_tor @ p, M['btn'], 10)
    strip('jan_placket', JAN_TORSO, fig.M_tor, M['shirt2'], -0.011, 0.011, 0.02, t - 0.005, out=0.001, solid=0.003)
    for sx in (1, -1):
        x0, x1 = sorted((sx * 0.04, sx * 0.108))
        strip('jan_pocket', JAN_TORSO, fig.M_tor, M['shirt2'], x0, x1, 0.2, 0.275, out=0.004, solid=0.006)
        strip('jan_flap', JAN_TORSO, fig.M_tor, M['trim'], x0 - 0.003, x1 + 0.003, 0.262, 0.29, out=0.009, nz=2,
              solid=0.006)
        boxm('jan_epaulet', (0.1, 0.052, 0.016), fig.M_tor @ T((sx * 0.108, 0.0, t + 0.002)) @ E((0, -sx * 14, 0)),
             M['trim'], bevel=0.006)
    bp = front_pt(JAN_TORSO, 0.318, 0.074, 0.012)
    ell('jan_badge', fig.M_tor @ T(bp) @ E((90, 0, 0)) @ S((0.022, 0.027, 0.006)), M['badge'], 12)
    # 벨트·바지
    loft('jan_belt', [(-0.006, 0.142, 0.111, 0, -0.009), (0.044, 0.149, 0.119, 0, -0.016)], 28, M['belt'],
         fig.M_tor, cap=(False, False), solid=0.006)
    boxm('jan_buckle', (0.046, 0.012, 0.034), fig.M_tor @ T(front_pt(JAN_TORSO, 0.019, 0.0, 0.034)), M['buckle'], 0.004)
    loft('jan_pants', [(-0.11, 0.126, 0.094), (-0.04, 0.134, 0.1), (0.02, 0.138, 0.104, 0, -0.006),
                       (0.05, 0.138, 0.104, 0, -0.008)], 24, M['pants'], fig.M_pel)
    for side in 'LR':
        sx = 1 if side == 'L' else -1
        draw_leg(fig, side, M['pants'], M['pants'], (0.07, 0.058), (0.058, 0.054), 0.058)
        draw_shoe(fig, side, M['shoe'], sole=M['sole'])
        ball('jan_shoulder', 0.062, fig.J['sh' + side], M['shirt'])
        draw_arm(fig, side, M['shirt'], M['shirt'], (0.054, 0.048), (0.048, 0.043), 0.048)
        w = fig.J['wr' + side]
        fd = fig.fdir(side)
        seg('jan_cuff', w - fd * 0.035, w - fd * 0.002, 0.046, 0.046, M['trim'])
        draw_hand(fig, side, M['skin'], (0.034, 0.029, 0.045))
        # 왼팔 어깨 아래 경비 완장 패치
        a, b = fig.J['sh' + side], fig.J['el' + side]
        if side == 'L':
            q = a.lerp(b, 0.42)
            seg('jan_armpatch', q - (b - a).normalized() * 0.022, q + (b - a).normalized() * 0.022, 0.056, 0.053,
                M['patch'])
    draw_neck(fig, M['skin'], 0.052)
    draw_head(fig, M['skin'], 64 if detail else 32, ear_size=(0.024, 0.036, 0.046))
    jan_face(fig, M, detail)
    jan_fringe(fig, M['hair'])
    # 소품: 오른손 손전등(앞으로), 왼손 금속 방망이
    flashlight(fig, 'R', pose.get('flash', (0.06, -1, -0.22)))
    bat(fig, 'L', pose.get('bat', (0.3, -0.5, -0.8)))
    return fig


def jan_face(fig, M, detail):
    # 학생들과 같은 방식의 짙은 타원 눈 — 가늘고 처진 노인 눈
    Mes = st_eyes(fig, M['eye'], ph=25, el=7, size=(0.026, 0.016, 0.022) if not detail else (0.022, 0.016, 0.019),
                  name='jan_eye')
    if detail:
        eye_glints(Mes, M['white'], big=0.0055, small=0.003)
    for sx in (1, -1):
        # 짙은 회색 눈썹(안쪽이 내려간 무뚝뚝한 인상)
        face_ell(fig, 'jan_brow', 71, sx * 27, (0.036, 0.011, 0.012), M['brow'], out=0.002, spin=sx * 13)
        if detail:
            face_arc(fig, 'jan_bag', 96, sx * 17, 96, sx * 33, 2.0, 0.0024, M['wrinkle'], out=0.001)
            face_arc(fig, 'jan_crow', 84, sx * 41, 90, sx * 46, 0, 0.0018, M['wrinkle'], out=0.001, n=4)
            face_arc(fig, 'jan_nl', 101, sx * 13, 114, sx * 19, 0, 0.0022, M['wrinkle'], out=0.0012, n=5)
    face_ell(fig, 'jan_nose', 95, 0, (0.022, 0.026, 0.026), M['skin'], out=-0.01, segs=16)
    face_ell(fig, 'jan_mous', 106, 0, (0.046, 0.013, 0.013), M['brow'], out=0.002)
    if detail:
        face_arc(fig, 'jan_mouth', 115, -9, 115, 9, -1.0, 0.0034, M['lip'], out=0.001)
        for i, th in enumerate((48, 54, 60)):
            face_arc(fig, 'jan_fw%d' % i, th, -22, th, 22, -1.0, 0.0017, M['wrinkle'], out=0.0012, n=11)


def janitor_pose(d, f):
    """f0 서기(성한 왼다리에 체중), f1 왼발(성한 다리) 크게 앞으로·오른다리 뻣뻣하게 끌림,
    f2 오른다리(저는 다리)를 편 채 바깥으로 휘둘러 앞으로·몸이 왼쪽으로 크게 기울어짐."""
    yaw = {'right': -1, 'left': 1}.get(d, 0)
    p = dict(facing=DIRS[d])
    if f == 0:
        p.update(pelvis=(0.008, 0.0, -0.012), pelvis_rot=(0, -3, 0), spine=(9, 3, 0), neck=(-12, -2, 0),
                 legL={'at': (0.078, -0.01, 0.065)}, legR={'at': (-0.098, 0.01, 0.065)},
                 footL={'yaw': 10}, footR={'yaw': 18},
                 armR={'rel': (0.035, -0.235, -0.13), 'pole': (-0.4, 0.5, -1)},
                 armL={'rel': (0.05, -0.02, -0.355), 'pole': (0.4, 1, 0)},
                 bat=(0.32, -0.36, -0.88), flash=(0.06, -1, -0.2))
    elif f == 1:
        p.update(pelvis=(0.0, -0.035, -0.04), pelvis_rot=(4, 3, -6), spine=(17, 5, 4), neck=(-18, -3, -3),
                 legL={'at': (0.074, -0.2, 0.065)}, legR={'dir': (-0.02, 0.5, -1)},
                 footL={'yaw': 6, 'pitch': -4}, footR={'yaw': 16, 'pitch': 34},
                 armR={'rel': (0.035, -0.24, -0.12), 'pole': (-0.4, 0.5, -1)},
                 armL={'rel': (0.06, 0.11, -0.335), 'pole': (0.4, 1, 0)},
                 bat=(0.3, -0.12, -0.95), flash=(0.08, -1, -0.26))
    else:
        p.update(pelvis=(0.03, -0.01, -0.02), pelvis_rot=(0, 9, 8), spine=(10, 10, -5), neck=(-12, -9, 4),
                 legL={'at': (0.064, 0.09, 0.065)}, legR={'dir': (-0.36, -0.42, -1)},
                 footL={'yaw': 8, 'pitch': 10}, footR={'yaw': 24, 'pitch': -12},
                 armR={'rel': (0.01, -0.23, -0.14), 'pole': (-0.4, 0.5, -1)},
                 armL={'rel': (0.08, -0.1, -0.335), 'pole': (0.4, 1, 0)},
                 bat=(0.34, -0.42, -0.84), flash=(0.02, -1, -0.16))
    # 옆모습: 상체·고개를 카메라 쪽으로 살짝 돌려 얼굴이 보이게(학생 스프라이트와 같은 3/4 치팅)
    sx, sy, sz = p['spine']
    p['spine'] = (sx, sy, sz + 10 * yaw)
    nx, ny, nz = p['neck']
    p['neck'] = (nx, ny, nz + 18 * yaw)
    return ground(JAN, p)


# ---------------------------------------------------------------- 귀신 한나영
def ghost_mats():
    return dict(
        skin=m_skin('gh_skin', '#a9aeab', rough=0.6, sss=0.04, mottle='#7c7e88', mottle2='#5e6068', mottle_amt=0.42),
        dark=m_skin('gh_dead', '#80808a', rough=0.62, sss=0.02, mottle='#55545e', mottle_amt=0.5),
        sole=mat('gh_sole', '#34302e', 0.9),
        blouse=m_fabric('gh_blouse', '#a7a597', var=0.18, stains='#6b6352', stain_amt=0.44, stains2='#40211f'),
        blouse2=m_fabric('gh_collar', '#9d9b8e', var=0.15, stains='#5f594a', stain_amt=0.4),
        skirt=m_plaid('gh_skirt', '#262c40', '#4f5463', '#3a3f4f', scale=5.0, stains='#1f1d1b', stain_amt=0.45),
        ribbon=m_fabric('gh_ribbon', '#6e2629', var=0.2, stains='#3a1c1c', stain_amt=0.4),
        hair=m_hair('gh_hair', '#050506', '#1d1f25', rough=0.5, stripes=26, spec=0.3, sheen=0.04, gaps=0.5,
                    gap_from=0.35),
        socket=mat('gh_socket', '#1a1416', 0.7),
        sclera=mat('gh_sclera', '#dcdcd2', 0.25, emit='#e4e4da', es=0.9),
        pupil=mat('gh_pupil', '#050405', 0.2),
        nail=mat('gh_nail', '#3b3640', 0.5),
        bruise=mat('gh_bruise', '#4e3442', 0.7),
    )


def ghost_eyes(fig, M, ph=26, th=84, look=(0.0, 0.0), sizes=(0.026, 0.02)):
    """움푹 꺼진 눈두덩 + 흰자 + 아주 작은 동공(멍하게 크게 뜬 눈)."""
    for sx in (1, -1):
        face_ell(fig, 'gh_sock', th, sx * ph, (sizes[0] * 1.35, sizes[1] * 1.45, 0.016), M['socket'], out=-0.008)
        p, n = fig.head_pt(th, sx * ph, -0.006)
        Me = fig.M_hd @ T(p) @ frame_z(n) @ S((sizes[0], sizes[1], 0.014))
        ell('gh_sclera', Me, M['sclera'], 16)
        q = Me @ Vector((look[0], look[1], 0.97))
        nn = (fig.M_hd.to_3x3() @ n).normalized()
        ell('gh_pupil', T(q) @ frame_z(nn) @ S((0.0055, 0.0055, 0.003)), M['pupil'], 10)


def ghost_hands(fig, M, flat=False):
    for side in 'LR':
        Mh = fig.M_hand_flat(side) if flat else fig.M_hand(side)
        if flat:
            hand = Mh @ T((0, 0.0, 0.018)) @ T((0, 0.0, 0.0))
            ell('gh_hand', hand @ T((0, 0, 0.02)) @ S((0.03, 0.011, 0.038)), M['skin'], 12)
        else:
            hand = Mh @ T((0, 0, 0.03))
            ell('gh_hand', hand @ S((0.027, 0.016, 0.04)), M['skin'], 12)
        for i, a in enumerate((-30, -10, 10, 30)):
            pts = []
            L = 0.085 if i in (1, 2) else 0.07
            for u in range(5):
                s = u / 4
                if flat:   # 바닥을 움켜쥐듯 손끝이 굽음
                    q = Vector((math.sin(a * D2R) * (0.02 + L * s), 0.012 - 0.016 * s * s,
                                0.04 + math.cos(a * D2R) * L * s))
                else:      # 힘없이 늘어져 살짝 굽은 손가락
                    q = Vector((math.sin(a * D2R) * (0.016 + L * 0.4 * s), -0.016 * s * s,
                                0.055 + math.cos(a * D2R) * L * s))
                pts.append(hand @ q)
            tube('gh_finger', pts, 0.0062, M['skin'], k=6, rfn=lambda u: 1.0 - 0.45 * u)
            ball('gh_nail', 0.0042, pts[-1], M['nail'], 6)


def sleeve(fig, side, m, frac, r0, r1, seed=1, jag=0.03):
    a, b = fig.J['sh' + side], fig.J['el' + side]
    L = (b - a).length
    Mf = T(a) @ frame_z(b - a)
    rnd = random.Random(seed)
    jags = [rnd.random() for _ in range(20)]
    rows = [(-0.03, r0, r0), (L * frac * 0.5, lerp(r0, r1, 0.5), lerp(r0, r1, 0.5)), (L * frac, r1, r1)]

    def zm(ph, ri):
        if ri != 2:
            return 0.0
        k = int(ph / TAU * 20) % 20
        return -jag * jags[k]
    loft('gh_sleeve', rows, 20, m, Mf, cap=(False, False), zmod=zm, solid=0.006)


def skirt(fig, m, colls, g=0.0, seed=1, top_z=0.04, rx=0.116, ry=0.086, length=0.2, flare=0.075, rows=7, segs=48,
          jag=0.07, floor=0.012):
    """허리 링에서 아래로(골반축과 중력을 g 로 섞어) 늘어지는 주름치마, 찢어진 단."""
    Mp = fig.M_pel
    Rp = Mp.to_3x3()
    down = (Rp @ Vector((0, 0, -1))) * (1 - g) + Vector((0, 0, -1)) * g
    down.normalize()
    rnd = random.Random(seed)
    cut = [rnd.random() for _ in range(segs)]
    cut = [max(c, cut[(i + 1) % segs] * 0.8) for i, c in enumerate(cut)]
    verts, faces = [], []
    for r in range(rows + 1):
        t = r / rows
        for k in range(segs):
            ph = TAU * k / segs
            pl = 1 + 0.06 * abs(math.sin(ph * 8)) * t
            ex = (rx + flare * t) * pl
            ey = (ry + flare * t) * pl
            ring = Mp @ Vector((ex * math.sin(ph), -ey * math.cos(ph), top_z))
            L = length * t
            if r == rows:
                L -= jag * cut[k] ** 1.5
            elif r == rows - 1:
                L -= jag * 0.25 * cut[k]
            p = ring + down * L
            p = push_all(p, colls)
            p.z = max(p.z, floor)
            verts.append(p)
    for r in range(rows):
        for k in range(segs):
            a = r * segs + k
            b = r * segs + (k + 1) % segs
            faces.append((a, a + segs, b + segs, b))
    o = mesh_from('gh_skirtm', verts, faces, m)
    solidify(o, 0.008)
    return o


def build_ghost(pose, cfg=GHOST, hair_L=(0.78, 0.62, 0.3), N=84, eye_gap=-24.0, gap_w=7.0, crawl=False):
    """한나영: 얼룩진 하복 블라우스 + 체크 치마, 맨발, 잿빛 피부, 얼굴을 덮은 긴 검은 머리.
    eye_gap: 이 방위(도)의 앞머리만 짧게 끊어 한쪽 눈이 머리카락 틈으로 보이게."""
    fig = Fig(cfg, pose)
    M = ghost_mats()
    t = cfg['torso']
    J = fig.J
    loft('gh_torso', GIRL_TORSO, 28, M['blouse'], fig.M_tor)
    loft('gh_collar', [(t - 0.012, 0.07, 0.06), (t + 0.035, 0.058, 0.05)], 24, M['blouse2'], fig.M_tor,
         gap=lambda z: 0.5, solid=0.008)
    rp = front_pt(GIRL_TORSO, t - 0.03, 0.0, 0.016)
    Mr = fig.M_tor @ T(rp)
    ell('gh_knot', Mr @ S((0.014, 0.01, 0.013)), M['ribbon'], 10)
    for sx in (1, -1):
        ell('gh_loop', Mr @ T((sx * 0.026, 0.004, 0.002)) @ E((0, sx * 18, 0)) @ S((0.026, 0.012, 0.016)),
            M['ribbon'], 12)
        ell('gh_tail', Mr @ T((sx * 0.012, 0.0, -0.035)) @ E((0, -sx * 12, 0)) @ S((0.01, 0.006, 0.03)),
            M['ribbon'], 8)
    # 엉덩이·허리 + 찢어진 치마
    ell('gh_hips', fig.M_pel @ T((0, 0.005, -0.03)) @ S((0.105, 0.085, 0.075)), M['skirt'], 16)
    loft('gh_waist', [(0.015, 0.114, 0.084), (0.06, 0.111, 0.082)], 28, M['skirt'], fig.M_pel, cap=(False, False),
         solid=0.006)
    colls = [Coll('cap', a=J['hip' + s], b=J['knee' + s], rad=0.056) for s in 'LR']
    skirt(fig, M['skirt'], colls, g=pose.get('skirt_g', 0.0), seed=11, length=0.21)
    # 다리·맨발 (발끝 쪽은 피가 몰려 거무죽죽)
    for side in 'LR':
        draw_leg(fig, side, M['skin'], M['skin'], (0.047, 0.039), (0.039, 0.028), 0.039)
        draw_barefoot(fig, side, M['dark'], M['sole'])
    # 팔: 찢어진 반소매 + 앙상하고 긴 팔, 긴 손가락
    for side in 'LR':
        sx = 1 if side == 'L' else -1
        ball('gh_shoulder', 0.05, J['sh' + side], M['blouse'])
        draw_arm(fig, side, M['skin'], M['skin'], (0.032, 0.027), (0.027, 0.021), 0.027)
        sleeve(fig, side, M['blouse'], 0.55, 0.049, 0.043, seed=3 + sx)
    ghost_hands(fig, M, flat=pose.get('flat_hands', False))
    draw_neck(fig, M['skin'], 0.036, top=0.2)
    if pose.get('neck_bruise'):
        a = fig.M_neck @ Vector((0, 0, cfg['neck'] * 0.75))
        b = fig.M_neck @ Vector((0, 0, cfg['neck'] * 1.05))
        seg('gh_bruise', a, b, 0.0375, 0.037, M['bruise'])
    draw_head(fig, M['skin'], 32, ears=False)
    ghost_eyes(fig, M, look=pose.get('look', (0.0, 0.0)))
    face_ell(fig, 'gh_mouth', 112, 0, (0.022, 0.016, 0.01), M['socket'], out=-0.004)
    # 길고 젖은 듯한 검은 머리 — 얼굴을 덮고 아래로 늘어지거나 바닥에 끌림
    hc = [Coll('ell', M=fig.M_hd, r=tuple(c * 1.07 for c in cfg['head']))]
    hc += [Coll('ell', M=fig.M_tor @ T((0, 0.0, t * 0.55)), r=(0.15, 0.11, t * 0.62))]
    hc += [Coll('cap', a=J['sh' + s], b=J['el' + s], rad=0.05) for s in 'LR']
    Lf, Ls, Lb = hair_L   # 앞(얼굴)·옆·뒤 가닥 길이

    def L(ph):
        dph = ((ph / D2R - eye_gap + 180) % 360) - 180
        if abs(dph) < gap_w:
            return 0.2      # 눈 위에서 끊긴 앞머리(틈)
        c = math.cos(ph)
        base = lerp(Ls, Lf, smooth(0.2, 0.8, c)) if c > 0 else lerp(Ls, Lb, smooth(-0.1, -0.7, c))
        return base + 0.04 * math.sin(ph * 3)
    hair_curtain('gh_hair', fig, M['hair'], L, R=1.065, N=N, step=0.01, detach=pose.get('hair_detach', 0.15),
                 colls=hc, spread=0.22, seed=21, jitter=0.12, thick=0.008,
                 floor_dir=fig.fw((0, -1, 0)) if crawl else None)
    strays('gh_stray', fig, M['hair'], 10, 5, th_rng=(30, 80), length=(0.1, 0.22), r=0.005, droop=0.9, curl=0.3)
    return fig


def crawl_pose(d, f):
    """네 발로 기는 자세. 원점 = 몸 발자국 중심(손과 무릎 사이). 거미처럼 팔꿈치가 바깥·위로 꺾임."""
    h = 0.255
    hy = 0.19
    hand = {0: (0.0, 0.0), 1: (-0.085, 0.05), 2: (0.05, -0.085)}[f]   # (왼손, 오른손) y
    kn = {0: (0.0, 0.0), 1: (0.05, -0.05), 2: (-0.05, 0.05)}[f]      # (왼무릎, 오른무릎) y
    twist = {0: 0, 1: 6, 2: -6}[f]
    sway = {0: 0.0, 1: 0.012, 2: -0.012}[f]
    head_roll = {0: -22, 1: -30, 2: -14}[f]
    pose = dict(facing=DIRS[d], pelvis=(sway, hy, h - GHOST['ankle'] - GHOST['shin'] - GHOST['thigh']),
                pelvis_rot=(80, 0, twist), spine=(8, 0, -twist * 1.4), neck=(-62, head_roll, twist * 2),
                skirt_g=0.7, flat_hands=True, hair_detach=0.05, look=(0.15, -0.1))
    for side, sx, dy_h, dy_k in (('L', 1, hand[0], kn[0]), ('R', -1, hand[1], kn[1])):
        ky = hy - 0.01 + dy_k
        knee = (sx * 0.1 + sway, ky, 0.042)
        ankle = (sx * 0.115 + sway, ky + GHOST['shin'] * 0.97, 0.048)
        pose['leg' + side] = {'mid': knee, 'end': ankle}
        pose['foot' + side] = {'turn': 180, 'yaw': -12, 'pitch': -10}
        pose['arm' + side] = {'at': (sx * 0.27 + sway, -0.36 + dy_h, 0.03), 'pole': (sx * 1.0, 0.1, 1.1)}
    return pose


def hang_pose():
    return dict(facing=8, root=(0, 0, 0.34), pelvis=(0.0, 0.0, 0.0), pelvis_rot=(3, -4, 5), spine=(-3, 3, 3),
                neck=(12, -32, 8), legL={'dir': (0.05, -0.02, -1)}, legR={'rel': (-0.02, 0.06, -0.41), 'pole': (0, -1, 0)},
                footL={'pitch': 64, 'yaw': 10}, footR={'pitch': 72, 'yaw': -8},
                armL={'dir': (0.2, -0.03, -1)}, armR={'dir': (-0.16, 0.06, -1)},
                hair_detach=0.2, look=(0.0, 0.4), neck_bruise=True)


def build_hang():
    cfg = dict(GHOST, neck=0.125)
    pose = hang_pose()
    fig = build_ghost(pose, cfg, hair_L=(0.6, 0.5, 0.46), N=88, eye_gap=27.0, gap_w=11.0)
    rope = m_rope('rope', '#8a7752')
    # 올가미: 목을 감고 왼쪽(+X) 귀 뒤로 매듭, 밧줄은 수직으로 화면 위까지
    Mn = fig.M_neck @ T((0, 0.004, cfg['neck'] * 0.9)) @ E((0, 0, 0))
    pts = [Mn @ Vector((0.046 * math.sin(a), -0.044 * math.cos(a), 0.012 * math.sin(a))) for a in
           [TAU * i / 28 for i in range(28)]]
    tube('noose', pts, 0.011, rope, k=8, closed=True)
    knot = Mn @ Vector((0.05, 0.012, 0.016))
    ell('knot', T(knot + Vector((0.004, 0, 0.03))) @ S((0.022, 0.022, 0.045)), rope, 12)
    top = Vector((knot.x + 0.02, knot.y + 0.01, 2.35))
    tube('rope', [knot + Vector((0.004, 0, 0.07)), knot.lerp(top, 0.3) + Vector((0.01, 0, 0)), top], 0.012, rope, k=8)
    return fig


# ---------------------------------------------------------------- 머리귀신
def build_head_ghost():
    """바닥 위 ≈0.3 에 떠 있는 머리. 시멘트 가루 묻은 잿빛 피부, 헝클어진 검은 머리, 감기지 않은 흰 눈.
    카메라를 올려다보도록 고개를 들고 살짝 갸웃."""
    head = (0.16, 0.152, 0.172)
    Mhd = T((0, 0, 0.47)) @ E((-24, 9, 5))
    fig = HeadFig(head, Mhd)
    M = dict(
        skin=m_skin('hg_skin', '#8f908a', rough=0.75, sss=0.03, mottle='#c9c6bc', mottle2='#55554f', mottle_amt=0.45),
        hair=m_hair('hg_hair', '#070708', '#24262c', rough=0.6, stripes=18, spec=0.3, sheen=0.05, gaps=0.45,
                    gap_from=0.5),
        dust=m_fabric('hg_dust', '#b9b6ac', var=0.2, rough=0.95, bump=0.3),
        socket=mat('hg_socket', '#1c1717', 0.7),
        sclera=mat('hg_sclera', '#e6e5dc', 0.2, emit='#e6e5dc', es=0.35),
        pupil=mat('hg_pupil', '#060505', 0.2),
        mouth=mat('hg_mouth', '#120c0c', 0.8),
        lip=mat('hg_lip', '#5b5452', 0.7),
        stump=m_skin('hg_stump', '#4a3434', rough=0.8, sss=0.02, mottle='#241818', mottle_amt=0.5),
    )
    draw_head(fig, M['skin'], 40, ears=True, ear_size=(0.024, 0.036, 0.046))
    # 크게 뜬 흰 눈(동공이 아주 작아 초점이 없다) — 한쪽은 살짝 어긋남
    for sx, look in ((1, (0.1, 0.05)), (-1, (-0.05, -0.08))):
        face_ell(fig, 'hg_sock', 84, sx * 25, (0.042, 0.036, 0.018), M['socket'], out=-0.01)
        p, n = fig.head_pt(84, sx * 25, -0.006)
        Me = fig.M_hd @ T(p) @ frame_z(n) @ S((0.032, 0.027, 0.016))
        ell('hg_sclera', Me, M['sclera'], 18)
        q = Me @ Vector((look[0], look[1], 0.97))
        nn = (fig.M_hd.to_3x3() @ n).normalized()
        ell('hg_pupil', T(q) @ frame_z(nn) @ S((0.0065, 0.0065, 0.003)), M['pupil'], 10)
    face_ell(fig, 'hg_nose', 98, 0, (0.018, 0.024, 0.024), M['skin'], out=-0.008)
    # 반쯤 벌어진 입
    face_ell(fig, 'hg_mouth', 116, 2, (0.03, 0.024, 0.012), M['mouth'], out=-0.004)
    face_arc(fig, 'hg_lipU', 111, -22, 111, 24, -2.0, 0.0045, M['lip'], out=0.0)
    face_arc(fig, 'hg_lipL', 123, -18, 123, 20, 2.5, 0.005, M['lip'], out=0.0)
    # 잘린 목: 짧고 거칠게, 끝은 검붉게
    a = fig.M_hd @ Vector((0, 0.03, -0.1))
    b = fig.M_hd @ Vector((0, 0.045, -0.2))
    seg('hg_neck', a, b, 0.06, 0.058, M['skin'])
    rnd = random.Random(4)
    for i in range(9):
        ang = TAU * i / 9
        off = fig.M_hd.to_3x3() @ Vector((0.045 * math.cos(ang), 0.04 * math.sin(ang), 0))
        ell('hg_rag', T(b + off + Vector((0, 0, -rnd.uniform(0.0, 0.025)))) @ S((0.022, 0.022, 0.03)), M['stump'], 8)
    ell('hg_stump', T(b + Vector((0, 0, -0.006))) @ S((0.058, 0.054, 0.02)), M['stump'], 14)
    # 헝클어진 검은 머리: 앞머리는 이마에서 들쭉날쭉, 옆·뒤는 턱 아래까지 늘어지고 바깥으로 뻗침
    rj = random.Random(9)
    jag = [rj.uniform(-1, 1) for _ in range(72)]

    def L(ph):
        c = math.cos(ph)
        k = int(ph / TAU * 72) % 72
        if c > 0.55:     # 이마: 들쭉날쭉한 앞머리(일부 가닥은 눈가까지)
            return 0.16 + 0.05 * jag[k] + (0.09 if jag[k] > 0.75 else 0.0)
        return 0.36 + 0.09 * jag[k] - 0.08 * smooth(0.2, 0.55, c)
    colls = [Coll('ell', M=fig.M_hd, r=tuple(c * 1.06 for c in head))]
    hair_curtain('hg_hair', fig, M['hair'], L, R=1.075, N=72, step=0.01, detach=0.35, colls=colls, spread=0.75,
                 seed=13, jitter=0.25, thick=0.009, floor=0.02)
    strays('hg_stray', fig, M['hair'], 26, 31, th_rng=(15, 105), length=(0.07, 0.17), r=0.0055, R=1.08,
           droop=0.35, curl=0.9)
    # 시멘트 가루: 머리·이마에 붙은 회백색 얼룩 덩어리
    rd = random.Random(17)
    for i in range(16):
        th, ph = rd.uniform(10, 75), rd.uniform(-150, 150)
        p, n = fig.head_pt(th, ph, 0.012, 1.075)
        ell('hg_dustb', fig.M_hd @ T(p) @ frame_z(n) @ E((0, 0, rd.uniform(0, 180))) @
            S((rd.uniform(0.012, 0.026), rd.uniform(0.008, 0.016), 0.006)), M['dust'], 8)
    return fig


# ---------------------------------------------------------------- 초상화(대화창 폴백)
P_FACE = {
    # brow: (높이 el°, 안쪽 끝 기울기°, 굵기), mouth: (el°, 반폭 ph°, 휨(+면 웃음)), blush
    'heemin': dict(brow=(31, -5, 0.0062), mouth=(-24, 9, 0.6), blush=False, turn=-8, tilt=0, nod=0),
    'soyoung': dict(brow=(31, 5, 0.0048), mouth=(-24, 7, -0.4), blush=True, turn=6, tilt=3, nod=2),
    'seonga': dict(brow=(33, -2, 0.0052), mouth=(-23, 11, 2.2), blush=True, turn=-10, tilt=-5, nod=-3, open=True),
    'jihyeon': dict(brow=(31, 10, 0.0048), mouth=(-24, 6, -0.8), blush=True, turn=8, tilt=-4, nod=5),
}


def build_student_portrait(who):
    """chars_students 의 빌더를 그대로 써서(같은 교복·머리 모양·색) 정면 상반신을 만들고
    대화창 크기에서 읽히도록 눈 하이라이트·눈썹·입·볼터치를 덧붙인다."""
    cfg = CS.STUDENTS[who]
    rig = CS.build_student(who, cfg)
    CS.pose(rig, cfg, 0, 'down')
    pf = P_FACE[who]
    rig['root'].rotation_euler.z = pf['turn'] * D2R
    rig['neck'].rotation_euler.y = pf['tilt'] * D2R
    rig['neck'].rotation_euler.x += pf['nod'] * D2R
    bpy.context.view_layer.update()
    Mn = rig['neck'].matrix_world.copy()
    r = CS.HEAD_R
    hc = Vector((0, 0, CS.HEAD_DZ))

    def sp(ph, el, out=0.0):
        a, e = ph * D2R, el * D2R
        u = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
        p = Vector((u.x * r, u.y * r, u.z * r))
        if p.z < 0:
            z = p.z / r
            p.x *= 1.0 - 0.16 * (-z) ** 1.5
            p.y *= 1.0 - 0.06 * (-z)
        p.y *= 0.96
        p.z *= 0.98
        return Mn @ (hc + p + u * out)

    white = mat('pt_white', '#ffffff', 0.2, emit='#ffffff', es=0.8)
    brow_m = mat(who + '_pbrow', cfg['hair'][0], 0.7)
    lip = mat(who + '_plip', '#a65552', 0.55)
    mouth_in = mat(who + '_pmouth', '#5e2328', 0.6)
    blush = mat(who + '_pblush', '#e79b90', 0.7, alpha=0.5)
    # 눈 하이라이트(CS 눈 타원체와 같은 변환)
    ea, ee = 25 * D2R, 11 * D2R
    Mes = []
    for sx in (1, -1):
        a = sx * ea
        p = Vector((r * 0.93 * math.sin(a) * math.cos(ee) * 0.97, -r * 0.96 * 0.93 * math.cos(a) * math.cos(ee),
                    CS.HEAD_DZ + r * 0.98 * math.sin(ee)))
        Mes.append(Mn @ T(p) @ Euler((-ee, 0, a), 'XYZ').to_matrix().to_4x4() @ S((0.03, 0.0165, 0.045)))
    eye_glints(Mes, white, big=0.0095, small=0.005)
    # 눈썹
    bel, btilt, bw = pf['brow']
    for sx in (1, -1):
        pts = []
        for i in range(9):
            u = i / 8
            ph = sx * lerp(12, 38, u)
            el = bel + btilt * (0.5 - u) + 2.0 * 4 * u * (1 - u)
            pts.append(sp(ph, el, 0.006))
        tube(who + '_brow', pts, bw, brow_m, k=6, rfn=lambda u: 0.75 + 0.45 * math.sin(u * math.pi))
    # 입
    mel, mw, curve = pf['mouth']
    pts = [sp(lerp(-mw, mw, i / 8), mel - curve * 4 * (i / 8) * (1 - i / 8), 0.003) for i in range(9)]
    if pf.get('open'):
        c = sp(0, mel - curve * 0.9, -0.002)
        nrm = (c - Mn @ hc).normalized()
        ell(who + '_mopen', T(c) @ frame_z(nrm, (0, 0, 1)) @ S((0.02, 0.011, 0.006)), mouth_in, 16)
    tube(who + '_mouth', pts, 0.0034, lip, k=6, rfn=lambda u: 0.7 + 0.5 * math.sin(u * math.pi))
    # 코(아주 작은 음영)
    c = sp(0, -8, -0.004)
    ell(who + '_nose', T(c) @ S((0.008, 0.007, 0.006)), mat(who + '_pnose', cfg['skin'], 0.55), 10)
    if pf['blush']:
        for sx in (1, -1):
            c = sp(sx * 40, -10, 0.001)
            nrm = (c - Mn @ hc).normalized()
            ell(who + '_blush', T(c) @ frame_z(nrm, (0, 0, 1)) @ S((0.028, 0.013, 0.004)), blush, 14)
    return rig


def janitor_portrait():
    pose = dict(facing=-10, spine=(3, 0, 0), neck=(-3, 2, 6),
                armR={'rel': (0.06, -0.24, -0.15), 'pole': (-0.6, 0.3, -1)},
                armL={'rel': (-0.04, -0.12, -0.2), 'pole': (0.6, 0.6, -1)},
                bat=(0.15, 0.45, 0.88), flash=(-0.35, -0.55, -0.75))
    return build_janitor(pose, detail=True)


PORTRAITS = {
    'portrait_heemin': lambda: build_student_portrait('heemin'),
    'portrait_soyoung': lambda: build_student_portrait('soyoung'),
    'portrait_seonga': lambda: build_student_portrait('seonga'),
    'portrait_jihyeon': lambda: build_student_portrait('jihyeon'),
    'portrait_janitor': janitor_portrait,
}


# ---------------------------------------------------------------- 렌더
def proj_bounds():
    dg = bpy.context.evaluated_depsgraph_get()
    bpy.context.view_layer.update()
    x0 = y0 = 1e9
    x1 = y1 = -1e9
    for o in bpy.context.scene.objects:
        if o.type != 'MESH' or o.hide_render:
            continue
        oe = o.evaluated_get(dg)
        me = oe.to_mesh()
        mw = oe.matrix_world
        for v in me.vertices:
            sx, sy = C.project(mw @ v.co)
            x0, x1, y0, y1 = min(x0, sx), max(x1, sx), min(y0, sy), max(y1, sy)
        oe.to_mesh_clear()
    return x0, y0, x1, y1


def world_bounds():
    dg = bpy.context.evaluated_depsgraph_get()
    bpy.context.view_layer.update()
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for o in bpy.context.scene.objects:
        if o.type != 'MESH':
            continue
        oe = o.evaluated_get(dg)
        me = oe.to_mesh()
        mw = oe.matrix_world
        for v in me.vertices:
            p = mw @ v.co
            for i in range(3):
                lo[i] = min(lo[i], p[i])
                hi[i] = max(hi[i], p[i])
        oe.to_mesh_clear()
    return lo, hi


def union(a, b):
    if a is None:
        return b
    return (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))


def render_set(prefix, builder, want):
    """한 캐릭터의 4방향×3프레임을 모든 포즈의 투영 경계 합집합(고정 bounds)으로 렌더."""
    keys = [(d, f) for d in DIRS for f in (0, 1, 2)]
    if not any(want(f'{prefix}_{d}_{f}') for d, f in keys):
        return {}
    bb = None
    for d, f in keys:
        C.clear_meshes()
        builder(d, f)
        bb = union(bb, proj_bounds())
    print(prefix, 'bounds', tuple(round(x, 3) for x in bb))
    assert max(abs(x) for x in bb) < 4.0, f'{prefix}: 투영 경계가 비정상(정점 폭주): {bb}'
    meta = {}
    for d, f in keys:
        key = f'{prefix}_{d}_{f}'
        if not want(key):
            continue
        C.clear_meshes()
        builder(d, f)
        meta[key] = C.render_sprite(f'{CAT}/{key}', (0, 0, 0), bounds=bb)
        print('rendered', key, meta[key]['w'], meta[key]['h'])
    return meta


def render_portrait(key):
    sc = bpy.context.scene
    C.clear_meshes()
    PORTRAITS[key]()
    lo, hi = world_bounds()
    W, H = 256, 320
    hu = 0.74
    top = hi.z + 0.03
    cam = sc.camera
    sc.render.resolution_x, sc.render.resolution_y = W, H
    cam.data.ortho_scale = hu
    cam.rotation_euler = (math.pi / 2, 0, 0)
    cam.location = (0.0, -20.0, top - hu / 2)
    cam.data.clip_end = 200
    old = sc.cycles.samples
    sc.cycles.samples = 128
    path = os.path.join(C.OUT, CAT, key + '.png')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    sc.cycles.samples = old
    cam.rotation_euler = (math.pi / 2 - C.ELEV, 0, 0)
    print('rendered', key)
    return {'file': f'{CAT}/{key}.png', 'w': W, 'h': H, 'ax': 0, 'ay': 0}


def main():
    sel = C.only(None)

    def want(k):
        return sel is None or any(k.startswith(s) for s in sel)

    C.reset_scene(SAMPLES)
    meta = {}
    meta.update(render_set('janitor', lambda d, f: build_janitor(janitor_pose(d, f)), want))
    meta.update(render_set('naying', lambda d, f: build_ghost(crawl_pose(d, f), crawl=True), want))
    if want('naying_hang'):
        C.clear_meshes()
        build_hang()
        meta['naying_hang'] = C.render_sprite(f'{CAT}/naying_hang', (0, 0, 0))
        print('rendered naying_hang')
    if want('head_ghost'):
        C.clear_meshes()
        build_head_ghost()
        meta['head_ghost'] = C.render_sprite(f'{CAT}/head_ghost', (0, 0, 0))
        print('rendered head_ghost')
    for key in PORTRAITS:
        if want(key):
            meta[key] = render_portrait(key)
    path = os.path.join(C.OUT, CAT + '.json')
    if sel is not None and os.path.exists(path):
        old = json.load(open(path, encoding='utf-8'))
        old.update(meta)
        meta = old
    order = [f'janitor_{d}_{f}' for d in DIRS for f in (0, 1, 2)] + ['naying_hang'] + \
            [f'naying_{d}_{f}' for d in DIRS for f in (0, 1, 2)] + ['head_ghost'] + list(PORTRAITS)
    meta = {k: meta[k] for k in order if k in meta}
    C.write_meta(CAT, meta)


if __name__ == '__main__':
    main()
