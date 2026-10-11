"""아이템 아이콘 (128×128) — items 카테고리.

실행:  python tools/blender/items.py            # 전부
       python tools/blender/items.py -- item_key item_coin   # 일부만 (기존 items.json 에 병합)

규약(docs/asset-spec.md): 원점 중심, anchor (0,0,0), 고정 bounds 정사각.
- 각 아이템은 ROOT 엠프티 밑에 모델링 → ROOT 를 돌려 보기 좋은 3/4 각도를 만든 뒤
  투영 경계가 프레임의 FILL(75%)을 채우도록 ROOT 의 크기/위치를 자동 조정한다.
- 렌더 후 Pillow 로 은은한 밝은 외곽선(어두운 UI 배경에서 실루엣이 읽히도록)을 덧입힌다.
"""
import json
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

import bmesh  # noqa: E402
import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Matrix, Vector, noise  # noqa: E402
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont  # noqa: E402

CAT = 'items'
FONT = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
BOUNDS = (-1.0, -1.0, 1.0, 1.0)   # 2×2 타일 = 128×128 px (PX=64, pad=0)
FILL = 1.5                        # 투영 최대 변 = 프레임의 75%
ROOT = None
FONT_DATA = None
R = math.radians


# ---------------------------------------------------------------- 씬

def setup():
    global FONT_DATA
    sc = C.reset_scene(samples=64)
    # 뒤쪽 위에서 비추는 약한 림 라이트(실루엣 가장자리 하이라이트)
    rim = bpy.data.lights.new('rim', 'SUN')
    rim.energy = 1.4
    rim.angle = R(10)
    ro = bpy.data.objects.new('rim', rim)
    sc.collection.objects.link(ro)
    ro.rotation_euler = (R(-64), R(24), 0)
    FONT_DATA = bpy.data.fonts.load(FONT)
    return sc


def clear():
    global ROOT
    for o in list(bpy.context.scene.objects):
        if o.type in ('LIGHT', 'CAMERA'):
            continue
        bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.curves):
        for d in list(coll):
            if d.users == 0:
                coll.remove(d)
    ROOT = bpy.data.objects.new('root', None)
    bpy.context.scene.collection.objects.link(ROOT)
    ROOT.rotation_mode = 'ZYX'   # yaw(Z) 먼저 → roll(Y) → tilt(X)


def grp(name, loc=(0, 0, 0), rot=(0, 0, 0), parent=None, scl=(1, 1, 1)):
    o = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(o)
    o.parent = parent if parent is not None else ROOT
    o.location = loc
    o.rotation_euler = [R(a) for a in rot]
    o.scale = scl
    return o


def ob(name, bm, mat=None, loc=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), parent=None, smooth=40):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        me.shade_smooth()
        me.set_sharp_from_angle(angle=R(smooth))
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    o.parent = parent if parent is not None else ROOT
    o.location = loc
    o.rotation_euler = [R(a) for a in rot]
    o.scale = scl
    if mat is not None:
        for m in (mat if isinstance(mat, (list, tuple)) else [mat]):
            me.materials.append(m)
    return o


# ---------------------------------------------------------------- 메시 빌더 (bmesh)

def _bevel(bm, bevel, segs=3):
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=segs, affect='EDGES',
                        clamp_overlap=True, profile=0.5)


def bm_box(sx, sy, sz, bevel=0.0, segs=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz
    _bevel(bm, bevel, segs)
    return bm


def rbox(name, size, loc, mat, bevel=0.0, rot=(0, 0, 0), parent=None):
    return ob(name, bm_box(*size, bevel=bevel), mat, loc, rot, parent=parent)


def bm_prism(pts, z0, z1, bevel=0.0, segs=3):
    bm = bmesh.new()
    bot = [bm.verts.new((x, y, z0)) for x, y in pts]
    top = [bm.verts.new((x, y, z1)) for x, y in pts]
    n = len(pts)
    bm.faces.new(list(reversed(bot)))
    bm.faces.new(top)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((bot[i], bot[j], top[j], top[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    _bevel(bm, bevel, segs)
    return bm


def bm_ring_prism(outer, inner, z0, z1, bevel=0.0, segs=2):
    """outer/inner 같은 개수의 닫힌 다각형 사이의 고리 판."""
    bm = bmesh.new()
    n = len(outer)
    ob_ = [bm.verts.new((x, y, z0)) for x, y in outer]
    ot = [bm.verts.new((x, y, z1)) for x, y in outer]
    ib = [bm.verts.new((x, y, z0)) for x, y in inner]
    it = [bm.verts.new((x, y, z1)) for x, y in inner]
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((ot[i], ot[j], it[j], it[i]))
        bm.faces.new((ob_[j], ob_[i], ib[i], ib[j]))
        bm.faces.new((ob_[i], ob_[j], ot[j], ot[i]))
        bm.faces.new((ib[j], ib[i], it[i], it[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    _bevel(bm, bevel, segs)
    return bm


def bm_lathe(profile, segs=48, a0=0.0, a1=2 * math.pi):
    """profile=[(r,z),...] 를 Z축 둘레로 회전. r=0 점은 극점."""
    bm = bmesh.new()
    full = (a1 - a0) >= 2 * math.pi - 1e-6
    na = segs if full else segs + 1
    angs = [a0 + (a1 - a0) * i / segs for i in range(na)]
    rings = []
    for r, z in profile:
        if r < 1e-6:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for a in angs])
    nseg = na if full else na - 1
    for a, b in zip(rings[:-1], rings[1:]):
        for i in range(nseg):
            j = (i + 1) % na
            if len(a) == 1 and len(b) == 1:
                continue
            if len(a) == 1:
                bm.faces.new((a[0], b[i], b[j]))
            elif len(b) == 1:
                bm.faces.new((a[i], a[j], b[0]))
            else:
                bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def bm_cyl(r, z0, z1, segs=32, bevel=0.0, r2=None):
    rr = r if r2 is None else r2
    if bevel > 0:
        b = bevel
        prof = [(0, z0), (r - b, z0), (r - b * 0.3, z0 + b * 0.3), (r, z0 + b),
                (rr, z1 - b), (rr - b * 0.3, z1 - b * 0.3), (rr - b, z1), (0, z1)]
    else:
        prof = [(0, z0), (r, z0), (rr, z1), (0, z1)]
    return bm_lathe(prof, segs)


def bm_sweep(pts, wdir, width, thick, closed=False):
    """사각 단면(width×thick)을 경로 pts 를 따라 쓸기. wdir = 폭 방향(벡터 또는 점별 리스트)."""
    P = [Vector(p) for p in pts]
    n = len(P)
    bm = bmesh.new()
    rings = []
    for i in range(n):
        if closed:
            t = P[(i + 1) % n] - P[i - 1]
        else:
            t = P[min(i + 1, n - 1)] - P[max(i - 1, 0)]
        t.normalize()
        w = Vector(wdir[i] if isinstance(wdir, list) else wdir)
        w = (w - t * w.dot(t)).normalized()
        nr = t.cross(w).normalized()
        wi = width[i] if isinstance(width, list) else width
        rings.append([bm.verts.new(P[i] + w * (sx * wi / 2) + nr * (sy * thick / 2))
                      for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    for i in range(n if closed else n - 1):
        a, b = rings[i], rings[(i + 1) % n]
        for k in range(4):
            bm.faces.new((a[k], a[(k + 1) % 4], b[(k + 1) % 4], b[k]))
    if not closed:
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def bm_grid(W, D, nx, ny, zfun=None, xyfun=None):
    bm = bmesh.new()
    vs = []
    for j in range(ny + 1):
        row = []
        for i in range(nx + 1):
            x = -W / 2 + W * i / nx
            y = -D / 2 + D * j / ny
            if xyfun:
                x, y = xyfun(x, y, i, j)
            z = zfun(x, y) if zfun else 0.0
            row.append(bm.verts.new((x, y, z)))
        vs.append(row)
    for j in range(ny):
        for i in range(nx):
            bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
    return bm


def tube(name, pts, radius, mat, parent=None, cyclic=False, radii=None, res=10, loc=(0, 0, 0), rot=(0, 0, 0)):
    """베지어(AUTO 핸들) 곡선 + 원형 단면 → 메시 오브젝트."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = 3
    cu.resolution_u = res
    cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(len(pts) - 1)
    for k, (bp, p) in enumerate(zip(sp.bezier_points, pts)):
        bp.co = p
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'
        bp.radius = radii[k] if radii else 1.0
    sp.use_cyclic_u = cyclic
    co = bpy.data.objects.new(name + '_crv', cu)
    bpy.context.scene.collection.objects.link(co)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(co.evaluated_get(dg))
    bpy.data.objects.remove(co, do_unlink=True)
    bpy.data.curves.remove(cu)
    me.shade_smooth()
    me.set_sharp_from_angle(angle=R(50))
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    o.parent = parent if parent is not None else ROOT
    o.location = loc
    o.rotation_euler = [R(a) for a in rot]
    if mat is not None:
        me.materials.append(mat)
    return o


def circle_pts(r, n=24, cx=0.0, cy=0.0, z=0.0, plane='XY', a0=0.0):
    out = []
    for i in range(n):
        a = a0 + 2 * math.pi * i / n
        c, s = r * math.cos(a), r * math.sin(a)
        if plane == 'XY':
            out.append((cx + c, cy + s, z))
        elif plane == 'XZ':
            out.append((cx + c, z, cy + s))
        else:  # YZ
            out.append((z, cx + c, cy + s))
    return out


def poly_circle(r, n=32, cx=0.0, cy=0.0, a0=0.0):
    return [(cx + r * math.cos(a0 + 2 * math.pi * i / n), cy + r * math.sin(a0 + 2 * math.pi * i / n)) for i in range(n)]


def poly_rrect(w, h, rad, n=6, cx=0.0, cy=0.0):
    """둥근 사각형(반시계)."""
    pts = []
    for (qx, qy, a0) in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        ccx, ccy = cx + qx * (w / 2 - rad), cy + qy * (h / 2 - rad)
        for k in range(n + 1):
            a = R(a0 + 90 * k / n)
            pts.append((ccx + rad * math.cos(a), ccy + rad * math.sin(a)))
    return pts


def text_mesh(name, s, size, depth, mat=None, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), center=True):
    """WenQuanYi 폰트 텍스트 오브젝트 → 메시. depth = 전체 두께(z 대칭)."""
    cu = bpy.data.curves.new(name, 'FONT')
    cu.body = s
    cu.font = FONT_DATA
    cu.size = size
    cu.extrude = depth / 2
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    cu.resolution_u = 5
    to = bpy.data.objects.new(name + '_txt', cu)
    bpy.context.scene.collection.objects.link(to)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(to.evaluated_get(dg))
    bpy.data.objects.remove(to, do_unlink=True)
    bpy.data.curves.remove(cu)
    if center and len(me.vertices):
        xs = [v.co.x for v in me.vertices]
        ys = [v.co.y for v in me.vertices]
        cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
        for v in me.vertices:
            v.co.x -= cx
            v.co.y -= cy
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    o.parent = parent if parent is not None else ROOT
    o.location = loc
    o.rotation_euler = [R(a) for a in rot]
    if mat is not None:
        me.materials.append(mat)
    return o


def flat_faces(o, axis=(0, 0, 1), thr=0.995):
    """축을 향한 평평한 면을 플랫 셰이딩으로(불리언 음각 경계에서 스무스 노멀이 번져 얼룩지는 것 방지)."""
    ax = Vector(axis)
    for p in o.data.polygons:
        if p.normal.dot(ax) > thr:
            p.use_smooth = False


def cut(target, cutter, inside_mat=None):
    """target - cutter (EXACT). inside_mat 이 있으면 잘린 면에 그 재질을 입힌다(음각 먹칠)."""
    if inside_mat is not None:
        cutter.data.materials.clear()
        cutter.data.materials.append(inside_mat)
    m = target.modifiers.new('cut_' + cutter.name, 'BOOLEAN')
    m.operation = 'DIFFERENCE'
    m.solver = 'EXACT'
    m.object = cutter
    m.material_mode = 'TRANSFER'
    cutter.hide_render = True
    cutter.display_type = 'WIRE'
    return m


# ---------------------------------------------------------------- 재질

def col4(c):
    if isinstance(c, str):
        return (*C.hex_to_linear(c), 1.0)
    if isinstance(c, (int, float)):
        return (c, c, c, 1.0)
    return (*c[:3], 1.0)


def shade(hexcol, f):
    h = hexcol.lstrip('#')
    rgb = [min(255, max(0, int(int(h[i:i + 2], 16) * f))) for i in (0, 2, 4)]
    return '#%02x%02x%02x' % tuple(rgb)


class Mat:
    def __init__(self, name, color='#888888', rough=0.5, metal=0.0):
        self.m = bpy.data.materials.new(name)
        self.m.use_nodes = True
        self.nt = self.m.node_tree
        self.b = self.nt.nodes['Principled BSDF']
        self.inp('Base Color', col4(color))
        self.inp('Roughness', rough)
        self.inp('Metallic', metal)
        self._co = None

    def node(self, t, **kw):
        n = self.nt.nodes.new(t)
        for k, v in kw.items():
            setattr(n, k, v)
        return n

    def L(self, a, b):
        self.nt.links.new(a, b)

    def _set(self, sock, val):
        if isinstance(val, bpy.types.NodeSocket):
            self.L(val, sock)
        else:
            sock.default_value = val

    def inp(self, name, val):
        self._set(self.b.inputs[name], val)

    def co(self):
        if self._co is None:
            self._co = self.node('ShaderNodeTexCoord').outputs['Object']
        return self._co

    def mapv(self, vec, scale=(1, 1, 1), loc=(0, 0, 0), rot=(0, 0, 0)):
        n = self.node('ShaderNodeMapping')
        n.inputs['Scale'].default_value = scale
        n.inputs['Location'].default_value = loc
        n.inputs['Rotation'].default_value = [R(a) for a in rot]
        self.L(vec, n.inputs['Vector'])
        return n.outputs['Vector']

    def noise(self, vec, scale=5.0, detail=3.0, rough=0.5, distortion=0.0):
        n = self.node('ShaderNodeTexNoise')
        n.inputs['Scale'].default_value = scale
        n.inputs['Detail'].default_value = detail
        n.inputs['Roughness'].default_value = rough
        n.inputs['Distortion'].default_value = distortion
        self.L(vec, n.inputs['Vector'])
        return n.outputs['Fac']

    def wave(self, vec, scale=5.0, kind='BANDS', direction='X', profile='SIN', distortion=0.0, detail=2.0, dscale=1.0):
        n = self.node('ShaderNodeTexWave', wave_type=kind, wave_profile=profile)
        if kind == 'BANDS':
            n.bands_direction = direction
        else:
            n.rings_direction = direction
        n.inputs['Scale'].default_value = scale
        n.inputs['Distortion'].default_value = distortion
        n.inputs['Detail'].default_value = detail
        n.inputs['Detail Scale'].default_value = dscale
        self.L(vec, n.inputs['Vector'])
        return n.outputs['Fac']

    def voronoi(self, vec, scale=5.0, rand=1.0):
        n = self.node('ShaderNodeTexVoronoi')
        n.inputs['Scale'].default_value = scale
        n.inputs['Randomness'].default_value = rand
        self.L(vec, n.inputs['Vector'])
        return n.outputs['Distance']

    def ramp(self, fac, stops, interp='LINEAR'):
        n = self.node('ShaderNodeValToRGB')
        els = n.color_ramp.elements
        n.color_ramp.interpolation = interp
        els[0].position = stops[0][0]
        els[0].color = col4(stops[0][1])
        els[1].position = stops[-1][0]
        els[1].color = col4(stops[-1][1])
        for p, c in stops[1:-1]:
            e = els.new(p)
            e.color = col4(c)
        self.L(fac, n.inputs['Fac'])
        return n.outputs['Color']

    def op(self, op, a, b=0.0, clamp=False):
        n = self.node('ShaderNodeMath', operation=op, use_clamp=clamp)
        self._set(n.inputs[0], a)
        self._set(n.inputs[1], b)
        return n.outputs[0]

    def sep(self, vec):
        n = self.node('ShaderNodeSeparateXYZ')
        self.L(vec, n.inputs[0])
        return n.outputs

    def comb(self, x, y, z=0.0):
        n = self.node('ShaderNodeCombineXYZ')
        self._set(n.inputs[0], x)
        self._set(n.inputs[1], y)
        self._set(n.inputs[2], z)
        return n.outputs[0]

    def bump(self, height, strength=0.3, dist=0.02):
        n = self.node('ShaderNodeBump')
        n.inputs['Strength'].default_value = strength
        n.inputs['Distance'].default_value = dist
        self.L(height, n.inputs['Height'])
        return n.outputs['Normal']

    def mix(self, fac, a, b):
        n = self.node('ShaderNodeMix', data_type='RGBA')
        self._set(n.inputs[0], fac)
        self._set(n.inputs[6], col4(a) if not isinstance(a, bpy.types.NodeSocket) else a)
        self._set(n.inputs[7], col4(b) if not isinstance(b, bpy.types.NodeSocket) else b)
        return n.outputs[2]

    def image(self, img, vec, extension='EXTEND'):
        n = self.node('ShaderNodeTexImage')
        n.image = img
        n.extension = extension
        n.interpolation = 'Linear'
        self.L(vec, n.inputs['Vector'])
        return n

    def angle_u(self, a0=-math.pi, a1=math.pi, offset=0.0):
        """오브젝트 좌표 atan2(y,x) → [0,1] (a0..a1 구간)."""
        x, y, z = self.sep(self.co())[:3]
        at = self.op('ARCTAN2', y, x)
        u = self.op('DIVIDE', self.op('SUBTRACT', at, a0), a1 - a0)
        if offset:
            u = self.op('FRACT', self.op('ADD', u, offset))
        return u, z


def m_basic(name, col, rough=0.5, metal=0.0, var=0.05, vs=6.0, bump=0.0, bs=80.0, stretch=None,
            rough_var=0.0, coat=0.0, emit=None, estr=0.0, trans=0.0, ior=1.45, sheen=0.0, alpha=1.0):
    M = Mat(name, col, rough, metal)
    co = M.mapv(M.co(), scale=stretch) if stretch else M.co()
    if var > 0:
        n = M.noise(co, vs, 4, 0.55)
        M.inp('Base Color', M.ramp(n, [(0.3, shade(col, 1 - var)), (0.7, shade(col, 1 + var))]))
    if rough_var > 0:
        n = M.noise(co, vs * 2.1, 3, 0.5)
        M.inp('Roughness', M.ramp(n, [(0.3, rough - rough_var), (0.7, rough + rough_var)]))
    if bump > 0:
        n = M.noise(co, bs, 6, 0.6)
        M.inp('Normal', M.bump(n, bump, 0.02))
    if coat:
        M.inp('Coat Weight', coat)
        M.inp('Coat Roughness', 0.15)
    if emit:
        M.inp('Emission Color', col4(emit))
        M.inp('Emission Strength', estr)
    if trans:
        M.inp('Transmission Weight', trans)
        M.inp('IOR', ior)
    if sheen:
        M.inp('Sheen Weight', sheen)
    if alpha < 1:
        M.inp('Alpha', alpha)
    return M.m


def m_metal(name, col, rough=0.3, brushed='Z', var=0.06, tarnish=None, tarnish_amt=0.35, bump=0.0, bs=60):
    M = Mat(name, col, rough, 1.0)
    st = {'X': (1, 50, 50), 'Y': (50, 1, 50), 'Z': (50, 50, 1), None: (1, 1, 1)}[brushed]
    co = M.co()
    b = M.noise(M.mapv(co, scale=st), 3.0, 5, 0.6)
    M.inp('Roughness', M.ramp(b, [(0.35, max(0.05, rough - 0.08)), (0.65, rough + 0.08)]))
    n = M.noise(co, 5.0, 4, 0.55)
    base = M.ramp(n, [(0.3, shade(col, 1 - var)), (0.7, shade(col, 1 + var))])
    if tarnish:
        t = M.noise(co, 3.5, 5, 0.65, distortion=0.3)
        f = M.ramp(t, [(0.5 - tarnish_amt * 0.5, 0.0), (0.62, 1.0)])
        base = M.mix(f, tarnish, base)
    M.inp('Base Color', base)
    if bump > 0:
        M.inp('Normal', M.bump(M.noise(co, bs, 6, 0.6), bump, 0.02))
    return M.m


def m_wood(name, light, dark, scale=5.0, axis='X', rough=0.55, coat=0.0, bump=0.12):
    M = Mat(name, light, rough)
    co = M.co()
    w = M.wave(co, scale=scale, kind='BANDS', direction=('Y' if axis == 'X' else 'X'),
               distortion=7.0, detail=3.0, dscale=1.2)
    fst = (1.5, 40, 40) if axis == 'X' else (40, 1.5, 40)
    f = M.noise(M.mapv(co, scale=fst), 1.0, 6, 0.6)
    fac = M.op('ADD', M.op('MULTIPLY', w, 0.65), M.op('MULTIPLY', f, 0.35))
    mid = '#%02x%02x%02x' % tuple((int(light[i:i + 2], 16) + int(dark[i:i + 2], 16)) // 2 for i in (1, 3, 5))
    M.inp('Base Color', M.ramp(fac, [(0.2, dark), (0.5, mid), (0.85, light)]))
    M.inp('Normal', M.bump(fac, bump, 0.01))
    if coat:
        M.inp('Coat Weight', coat)
        M.inp('Coat Roughness', 0.25)
    return M.m


def pil_to_img(name, im):
    im = im.convert('RGBA')
    w, h = im.size
    arr = (np.asarray(im, dtype=np.float32) / 255.0)[::-1].ravel()
    img = bpy.data.images.new(name, w, h, alpha=True)
    img.pixels.foreach_set(arr)
    img.pack()
    return img


def m_img_planar(name, im, x0, x1, y0, y1, rough=0.5, metal=0.0, bump=0.0, bs=90, coat=0.0, base=None):
    """오브젝트 XY 평면 투영(Z 방향) 이미지. base 가 있으면 이미지 알파로 base 위에 합성."""
    M = Mat(name, '#ffffff', rough, metal)
    v = M.mapv(M.co(), scale=(1 / (x1 - x0), 1 / (y1 - y0), 1), loc=(-x0 / (x1 - x0), -y0 / (y1 - y0), 0))
    tn = M.image(pil_to_img(name + '_img', im), v)
    c = tn.outputs['Color']
    if base is not None:
        c = M.mix(tn.outputs['Alpha'], base, c)
    M.inp('Base Color', c)
    if bump:
        M.inp('Normal', M.bump(M.noise(M.co(), bs, 6, 0.6), bump, 0.02))
    if coat:
        M.inp('Coat Weight', coat)
        M.inp('Coat Roughness', 0.2)
    return M.m


def m_img_cyl(name, im, z0, z1, a0=-math.pi, a1=math.pi, offset=0.0, rough=0.4, metal=0.0, coat=0.0):
    """오브젝트 Z축 원통 투영 이미지. u = 각도(a0..a1), v = z(z0..z1)."""
    M = Mat(name, '#ffffff', rough, metal)
    u, z = M.angle_u(a0, a1, offset)
    v = M.op('DIVIDE', M.op('SUBTRACT', z, z0), z1 - z0)
    tn = M.image(pil_to_img(name + '_img', im), M.comb(u, v, 0.0))
    M.inp('Base Color', tn.outputs['Color'])
    if coat:
        M.inp('Coat Weight', coat)
        M.inp('Coat Roughness', 0.15)
    return M.m


def front_u(angle_deg):
    """원통 매핑에서 각도 → u (a0=-pi..a1=pi)."""
    return (R(angle_deg) + math.pi) / (2 * math.pi)


# ---------------------------------------------------------------- Pillow 텍스처

def pfont(sz):
    return ImageFont.truetype(FONT, sz, index=0)


def heart_poly(cx, cy, s, n=40):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * s, cy - y * s))
    return pts


def grain(im, amt=10, seed=1):
    """미세한 얼룩/노이즈로 인쇄물의 '새것' 느낌 줄이기."""
    rng = np.random.default_rng(seed)
    a = np.asarray(im.convert('RGBA')).astype(np.int16)
    n = rng.normal(0, amt, a.shape[:2])[..., None]
    a[..., :3] = np.clip(a[..., :3] + n, 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def tex_diary_cover():
    W, H = 400, 544
    im = Image.new('RGBA', (W, H), '#c48896')
    d = ImageDraw.Draw(im)
    # 스티치 테두리
    m = 22
    for x in range(m, W - m, 14):
        d.line([(x, m), (x + 7, m)], fill='#ecc6cd', width=3)
        d.line([(x, H - m), (x + 7, H - m)], fill='#ecc6cd', width=3)
    for y in range(m, H - m, 14):
        d.line([(m, y), (m, y + 7)], fill='#ecc6cd', width=3)
        d.line([(W - m, y), (W - m, y + 7)], fill='#ecc6cd', width=3)
    # 라벨
    d.rounded_rectangle([90, 120, W - 70, 250], radius=18, fill='#efe3cf', outline='#a86a78', width=4)
    d.text(((90 + W - 70) / 2, 172), 'Diary', font=pfont(54), fill='#8a4a5a', anchor='mm')
    d.text(((90 + W - 70) / 2, 222), '2001', font=pfont(24), fill='#a46a78', anchor='mm')
    d.polygon(heart_poly((90 + W - 70) / 2, 360, 4.2), fill='#a84c62')
    d.polygon(heart_poly((90 + W - 70) / 2 - 3, 354, 1.4), fill='#d7848f')
    return grain(im, 5)


def tex_magazine_cover():
    W, H = 512, 704
    im = Image.new('RGBA', (W, H), '#e3dccb')
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 170], fill='#34506e')
    d.text((34, 92), '교지', font=pfont(124), fill='#efe8d6', anchor='lm')
    d.text((W - 34, 64), '제27호', font=pfont(40), fill='#d8cfb8', anchor='rm')
    d.text((W - 34, 120), '2001', font=pfont(40), fill='#d8cfb8', anchor='rm')
    # 사진: 하늘, 학교 건물, 나무
    x0, y0, x1, y1 = 34, 200, W - 34, 560
    for y in range(y0, y1):
        t = (y - y0) / (y1 - y0)
        c = tuple(int(a + (b - a) * t) for a, b in zip((150, 172, 190), (214, 218, 214)))
        d.line([(x0, y), (x1, y)], fill=c)
    gy = 470
    d.rectangle([x0, gy, x1, y1], fill='#7c8a5c')
    d.rectangle([x0 + 20, 330, x1 - 20, gy], fill='#cbbfa4', outline='#8f846c', width=2)
    d.rectangle([W / 2 - 46, 268, W / 2 + 46, gy], fill='#c3b598', outline='#8f846c', width=2)
    d.ellipse([W / 2 - 24, 284, W / 2 + 24, 332], fill='#f2efe6', outline='#5c5a54', width=3)
    for row in range(3):
        for col in range(14):
            wx = x0 + 34 + col * 30
            if abs(wx + 8 - W / 2) < 56:
                continue
            wy = 348 + row * 38
            d.rectangle([wx, wy, wx + 16, wy + 22], fill='#4f5d6b')
    for tx in (x0 + 26, x0 + 80, x1 - 70, x1 - 22):
        d.ellipse([tx - 30, gy - 40, tx + 30, gy + 30], fill='#4f6a40')
    d.rectangle([x0, y0, x1, y1], outline='#5a5a58', width=3)
    d.text((W / 2, 610), '학생회 발행', font=pfont(40), fill='#34506e', anchor='mm')
    d.rectangle([0, H - 40, W, H], fill='#a8473e')
    return grain(im, 6, 2)


def tex_can_label():
    W, H = 1024, 470
    im = Image.new('RGBA', (W, H), '#2f6a52')
    d = ImageDraw.Draw(im)
    for off in (0, W // 2):
        pts = [(x, H * 0.62 + 34 * math.sin((x + off) / W * 4 * math.pi)) for x in range(0, W + 8, 8)]
        d.polygon(pts + [(W, H), (0, H)], fill='#e8e4d6')
        pts2 = [(x, H * 0.70 + 30 * math.sin((x + off) / W * 4 * math.pi + 0.6)) for x in range(0, W + 8, 8)]
        d.polygon(pts2 + [(W, H), (0, H)], fill='#9ec4a6')
    rng = random.Random(3)
    for _ in range(40):
        x, y, r = rng.uniform(0, W), rng.uniform(20, H * 0.55), rng.uniform(4, 13)
        d.ellipse([x - r, y - r, x + r, y + r], outline='#7fb69a', width=3)
    for cx in (W * 0.25, W * 0.75):
        d.text((cx, H * 0.36), '사이다', font=pfont(120), fill='#f3f0e4', anchor='mm',
               stroke_width=5, stroke_fill='#1f4a39')
        d.text((cx, H * 0.86), 'CIDER  250ml', font=pfont(34), fill='#2f6a52', anchor='mm')
    return grain(im, 5, 3)


def tex_spray_label():
    W, H = 1024, 512
    im = Image.new('RGBA', (W, H), '#d3b041')
    d = ImageDraw.Draw(im)
    d.rectangle([0, H * 0.78, W, H], fill='#3d6a3a')
    d.rectangle([0, H * 0.74, W, H * 0.78], fill='#e9e1c4')
    d.rectangle([0, 0, W, H * 0.07], fill='#3d6a3a')
    for cx in (W * 0.25, W * 0.75):
        # 벌레 금지 표시
        bx, by, br = cx, H * 0.30, 82
        d.ellipse([bx - br, by - br, bx + br, by + br], fill='#f1ead2', outline='#b1352c', width=16)
        d.ellipse([bx - 14, by - 40, bx + 14, by + 34], fill='#2a2522')
        d.ellipse([bx - 12, by - 56, bx + 12, by - 32], fill='#2a2522')
        for k in (-1, 1):
            for dy in (-14, 4, 22):
                d.line([(bx + k * 8, by + dy), (bx + k * 44, by + dy - 18 + (dy * 0.5))], fill='#2a2522', width=5)
            d.line([(bx + k * 6, by - 52), (bx + k * 30, by - 84)], fill='#2a2522', width=4)
        d.line([(bx - br * 0.7, by - br * 0.7), (bx + br * 0.7, by + br * 0.7)], fill='#b1352c', width=16)
        d.text((cx, H * 0.60), '살충제', font=pfont(92), fill='#2c4a2a', anchor='mm')
        d.text((cx, H * 0.89), '에어로졸', font=pfont(42), fill='#efe7c8', anchor='mm')
    return grain(im, 5, 4)


def tex_solvent_label():
    W, H = 640, 400
    im = Image.new('RGBA', (W, H), '#e4dcc3')
    d = ImageDraw.Draw(im)
    d.rectangle([10, 10, W - 10, H - 10], outline='#5a4a36', width=6)
    d.rectangle([10, 10, W - 10, 70], fill='#5a4a36')
    d.text((W / 2, 41), 'SOLVENT', font=pfont(40), fill='#e4dcc3', anchor='mm')
    d.text((W / 2 + 60, 150), '유기용제', font=pfont(84), fill='#2b231b', anchor='mm')
    # 위험 표시(주황 사각 + 불꽃)
    hx, hy = 110, 230
    d.rectangle([hx - 70, hy - 70, hx + 70, hy + 70], fill='#d47a26', outline='#2b231b', width=6)
    d.polygon([(hx, hy - 50), (hx + 30, hy + 10), (hx + 22, hy + 46), (hx - 22, hy + 46), (hx - 30, hy + 10)], fill='#2b231b')
    d.polygon([(hx, hy - 6), (hx + 12, hy + 20), (hx, hy + 40), (hx - 12, hy + 20)], fill='#d47a26')
    d.text((W / 2 + 70, 250), '화기엄금', font=pfont(64), fill='#a8302a', anchor='mm')
    for i, ln in enumerate((300, 240, 280)):
        d.rectangle([200, 310 + i * 22, 200 + ln, 320 + i * 22], fill='#8e8270')
    return grain(im, 6, 5)


NOTE_W, NOTE_D = 1.0, 1.25


def note_folds(seed=5, n=16):
    """구김 접힘선: (px, py, nx, ny, amp, width) — 텍스처의 주름 음영과 지오메트리가 같은 선을 쓴다."""
    rng = random.Random(seed)
    out = []
    for _ in range(n):
        a = rng.uniform(0, math.pi)
        out.append((rng.uniform(-0.38, 0.38), rng.uniform(-0.5, 0.5), math.cos(a), math.sin(a),
                    rng.choice((-1, 1)) * rng.uniform(0.05, 0.1), rng.uniform(0.12, 0.28)))
    return out


def tex_note(folds=()):
    """누런 노트 낱장(파란 줄, 빨간 여백선) + 굵고 진한 연필/볼펜 낙서 + 접힘선 음영."""
    W, H = 512, 640
    im = Image.new('RGBA', (W, H), '#ddd0a4')
    d = ImageDraw.Draw(im)
    for y in range(64, H, 40):
        d.line([(0, y), (W, y)], fill='#8ea0b8', width=3)
    d.line([(64, 0), (64, H)], fill='#c98680', width=4)
    rng = random.Random(7)
    # 누렇게 바랜 얼룩
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for _ in range(7):
        x, y, r = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(40, 130)
        od.ellipse([x - r, y - r, x + r, y + r], fill=(140, 105, 50, 40))
    im = Image.alpha_composite(im, ov.filter(ImageFilter.GaussianBlur(18)))
    # 접힘선: 한쪽은 어둡고 한쪽은 밝은 가는 선(구김 자국)
    def to_px(x, y):
        return ((x + NOTE_W / 2) / NOTE_W * W, (NOTE_D / 2 - y) / NOTE_D * H)
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for px, py, nx, ny, amp, wd in folds:
        tx, ty = -ny, nx
        p0, p1 = to_px(px - tx * 2, py - ty * 2), to_px(px + tx * 2, py + ty * 2)
        off = 2.5
        od.line([(p0[0] + nx * off, p0[1] - ny * off), (p1[0] + nx * off, p1[1] - ny * off)], fill=(90, 70, 40, 70), width=3)
        od.line([(p0[0] - nx * off, p0[1] + ny * off), (p1[0] - nx * off, p1[1] + ny * off)], fill=(255, 250, 235, 60), width=3)
    im = Image.alpha_composite(im, ov.filter(ImageFilter.GaussianBlur(1.2)))
    d = ImageDraw.Draw(im)
    ink = '#1f1f2a'
    # 휘갈긴 손글씨: 고리 모양 필기체 줄(굵게)
    for li, y in enumerate(range(100, 380, 40)):
        x = 84 + rng.uniform(0, 16)
        end = W - 34 - rng.uniform(0, 150)
        pts = []
        t = 0.0
        while x < end:
            r = rng.uniform(7, 12)
            pts.append((x + r * 0.6 * math.sin(t), y - 12 + r * math.cos(t) + rng.uniform(-1.5, 1.5)))
            t += 0.9
            x += 3.2
            if rng.random() < 0.025 and x < end - 40:   # 단어 사이 띄움
                d.line(pts, fill=ink, width=7, joint='curve')
                pts = []
                x += 18
        if len(pts) > 1:
            d.line(pts, fill=ink, width=7, joint='curve')
    # 아래쪽: 연필로 거칠게 덧칠한 낙서 덩어리 + 빨간 동그라미 X + 화살표
    pts = []
    cx, cy = 150, 520
    for k in range(70):
        a = k * 0.55
        r = 34 + 22 * math.sin(k * 0.37) + rng.uniform(-6, 6)
        pts.append((cx + r * math.cos(a) * 1.4, cy + r * math.sin(a)))
    d.line(pts, fill='#3a3a40', width=6, joint='curve')
    cx, cy = 360, 500
    for k in range(3):
        r = 74 + k * 5
        d.arc([cx - r - k * 4, cy - r * 0.82, cx + r, cy + r * 0.82 + k * 3], 0, 360, fill='#9a2424', width=9)
    d.line([(cx - 44, cy - 44), (cx + 44, cy + 44)], fill='#9a2424', width=12)
    d.line([(cx + 44, cy - 44), (cx - 44, cy + 44)], fill='#9a2424', width=12)
    d.line([(222, 600), (282, 556)], fill=ink, width=8)
    d.polygon([(298, 544), (264, 548), (284, 574)], fill=ink)
    return grain(im, 5, 9)


def tex_doc():
    W, H = 512, 724
    im = Image.new('RGBA', (W, H), '#eeeadf')
    d = ImageDraw.Draw(im)
    d.text((W / 2, 70), '학 교 일 지', font=pfont(54), fill='#26262a', anchor='mm')
    d.line([(50, 112), (W - 50, 112)], fill='#26262a', width=4)
    # 표
    d.rectangle([50, 132, W - 50, 220], outline='#3a3a3e', width=3)
    d.line([(50, 176), (W - 50, 176)], fill='#3a3a3e', width=2)
    for x in (160, 290, 380):
        d.line([(x, 132), (x, 220)], fill='#3a3a3e', width=2)
    rng = random.Random(11)
    for y in range(256, 620, 30):
        x = 60 if (y - 256) % 150 else 50
        ln = rng.uniform(260, 400)
        d.rectangle([x, y, x + ln, y + 11], fill='#7a7a80')
    d.ellipse([W - 170, H - 150, W - 70, H - 50], outline='#b0352e', width=8)
    d.text((W - 120, H - 100), '印', font=pfont(56), fill='#b0352e', anchor='mm')
    return grain(im, 5, 6)


def tex_tag(text, flip=False):
    W, H = 400, 190
    im = Image.new('RGBA', (W, H), '#a8343a')
    d = ImageDraw.Draw(im)
    box = (130, 42, W - 34, H - 42)
    d.rounded_rectangle(box, radius=10, fill='#ece4d2')
    d.text(((box[0] + box[2]) / 2, H / 2), text, font=pfont(64), fill='#2a2a2e', anchor='mm')
    if flip:   # 라벨 영역만 180° 회전(레이아웃은 그대로)
        im.paste(im.crop(box).rotate(180), box[:2])
    return grain(im, 5, 8)


def tex_pen_barrel():
    # 가로 = 펜 길이 방향(v), 세로 = 둘레(u). 뒤에서 transpose.
    L, Cc = 600, 220
    im = Image.new('RGBA', (L, Cc), '#e2ded2')
    d = ImageDraw.Draw(im)
    d.rectangle([L - 70, 0, L - 52, Cc], fill='#2a2a2e')
    d.rectangle([0, 0, 30, Cc], fill='#2a2a2e')
    for cy in (Cc * 0.5,):
        d.text((L * 0.48, cy), '사인펜', font=pfont(70), fill='#2a2a2e', anchor='mm')
        d.text((L * 0.82, cy), '0.5', font=pfont(40), fill='#5a5a60', anchor='mm')
    return im


# ---------------------------------------------------------------- 아이템

def item_diary():
    W, D, T, ct = 1.0, 1.36, 0.15, 0.04
    pink = m_basic('dia_pink', '#b97a89', rough=0.6, var=0.06, bump=0.12, bs=120)
    pink_d = m_basic('dia_pink_d', '#9e6372', rough=0.6, var=0.05, bump=0.1, bs=120)
    cover = m_img_planar('dia_cover', tex_diary_cover(), -W / 2, W / 2, -D / 2, D / 2, rough=0.6, bump=0.1, bs=120)
    M = Mat('dia_pages', '#e9e1cc', 0.8)
    M.inp('Base Color', M.ramp(M.wave(M.co(), 140, 'BANDS', 'Z'), [(0, '#d2c8af'), (1, '#efe8d5')]))
    pages = M.m
    gold = m_metal('dia_gold', '#b89a52', rough=0.3, brushed=None)
    dark = m_basic('dia_dark', '#2a2222', rough=0.5, var=0)

    rbox('back', (W, D, ct), (0, 0, ct / 2), pink_d, bevel=0.012)
    rbox('pages', (W - 0.07, D - 0.06, T), (0.015, 0, ct + T / 2), pages, bevel=0.004)
    rbox('front', (W, D, ct), (0, 0, ct + T + ct / 2), cover, bevel=0.012)
    hz = (T + 2 * ct) / 2
    ob('spine', bm_cyl(hz, -D / 2, D / 2, 24), pink_d, (-W / 2 + 0.015, 0, hz), (90, 0, 0), scl=(0.7, 1, 1))
    # 걸쇠 끈
    sw = 0.17
    top = 2 * ct + T
    rbox('strap_t', (0.34, sw, 0.016), (W / 2 - 0.15, 0, top + 0.008), pink_d, bevel=0.005)
    rbox('strap_e', (0.018, sw, top + 0.03), (W / 2 + 0.009, 0, top / 2), pink_d, bevel=0.005)
    rbox('strap_b', (0.3, sw, 0.016), (W / 2 - 0.13, 0, -0.008), pink_d, bevel=0.005)
    rbox('clasp', (0.15, 0.22, 0.04), (W / 2 - 0.27, 0, top + 0.03), gold, bevel=0.012)
    ob('keyhole', bm_cyl(0.022, 0, 0.01, 12), dark, (W / 2 - 0.27, 0.01, top + 0.047))
    rbox('keyslot', (0.012, 0.04, 0.01), (W / 2 - 0.27, -0.02, top + 0.047), dark)
    return dict(rot=(26, 0, -14))


def item_candy():
    BW, BD, BH = 1.3, 0.95, 0.40
    base = m_basic('cb_base', '#c58e9a', rough=0.55, var=0.04)
    M = Mat('cb_lid', '#eadfca', 0.55)
    dots = M.voronoi(M.co(), 7.0, 0.85)
    M.inp('Base Color', M.ramp(dots, [(0.0, '#cf8796'), (0.2, '#cf8796'), (0.24, '#ece2cf'), (1.0, '#ece2cf')]))
    lid = M.m
    rib = m_basic('cb_ribbon', '#b0343f', rough=0.32, var=0.06, sheen=0.4, coat=0.2)
    rbox('base', (BW, BD, BH), (0, 0, BH / 2), base, bevel=0.02)
    LH = 0.16
    top = BH + 0.04
    rbox('lid', (BW + 0.04, BD + 0.04, LH), (0, 0, top - LH / 2), lid, bevel=0.02)
    rw, rt = 0.13, 0.014
    rbox('rx', (BW + 0.07, rw, rt), (0, 0, top + rt / 2), rib, bevel=0.004)
    rbox('ry', (rw, BD + 0.07, rt), (0, 0, top + rt), rib, bevel=0.004)
    for s in (-1, 1):
        rbox('rxs', (rt, rw, top + 0.01), (s * (BW / 2 + 0.028), 0, top / 2), rib, bevel=0.004)
        rbox('rys', (rw, rt, top + 0.01), (0, s * (BD / 2 + 0.028), top / 2), rib, bevel=0.004)
    # 리본 고리 두 개
    z0 = top + 0.03
    for s, yaw in ((-1, -18), (1, 22)):
        pts = []
        for i in range(28):
            t = 2 * math.pi * i / 28
            x = s * 0.2 * (1 - math.cos(t))
            st = math.sin(t)
            z = z0 + (0.15 * st if st > 0 else 0.015 * st)
            pts.append((x, 0, z))
        g = grp('loop', rot=(0, 0, yaw))
        ob('loop', bm_sweep(pts, (0, 1, 0), 0.12, 0.016, closed=True), rib, parent=g)
    # 꼬리
    for s, yaw in ((-1, 30), (1, -35)):
        pts = [(s * 0.02 * k, -0.08 * k, top + 0.03 - 0.004 * k + 0.012 * math.sin(k)) for k in range(6)]
        g = grp('tail', rot=(0, 0, yaw))
        ob('tail', bm_sweep(pts, (1, 0, 0), 0.11, 0.014), rib, parent=g)
    rbox('knot', (0.13, 0.15, 0.09), (0, 0, top + 0.06), rib, bevel=0.035)
    return dict(rot=(14, 0, 26))


def item_magazine():
    W, D = 1.0, 1.38
    paper = m_basic('mg_paper', '#e6dfcd', rough=0.8, var=0.03)
    M = Mat('mg_pages', '#e9e1cc', 0.8)
    M.inp('Base Color', M.ramp(M.wave(M.co(), 260, 'BANDS', 'Z'), [(0, '#cfc6ad'), (1, '#efe9d8')]))
    pages = M.m
    cover = m_img_planar('mg_cover', tex_magazine_cover(), -W / 2, W / 2, -D / 2, D / 2, rough=0.45, coat=0.15)
    steel = m_metal('mg_staple', '#b5b8bc', 0.3, brushed=None)
    rbox('back', (W, D, 0.01), (0, 0, 0.005), paper)
    rbox('pages', (W - 0.012, D - 0.016, 0.05), (0.004, 0, 0.035), pages, bevel=0.003)

    def curl(x, y):
        # 오른쪽 아래 모서리가 살짝 들림
        u = max(0.0, (x - 0.05) / 0.45) * max(0.0, (-y - 0.15) / 0.54)
        return 0.062 + 0.10 * u * u
    ob('cover', bm_grid(W, D, 24, 32, curl), cover, smooth=60)
    for y in (-0.33, 0.33):
        rbox('staple', (0.025, 0.12, 0.008), (-W / 2 + 0.05, y, 0.066), steel)
    return dict(rot=(28, 0, 10))


def item_wirecutter():
    steel = m_metal('wc_steel', '#8e959c', 0.32, brushed='X')
    dark = m_basic('wc_dark', '#24272b', 0.5, var=0)
    grip = m_basic('wc_grip', '#a23b33', rough=0.6, var=0.07, bump=0.15, bs=160)
    gripd = m_basic('wc_gripd', '#2e2e32', rough=0.6, var=0.05)
    head = [(-0.17, -0.14), (0.05, -0.17), (0.36, -0.11), (0.62, -0.02), (0.64, 0.0), (0.62, 0.02),
            (0.36, 0.11), (0.05, 0.17), (-0.17, 0.14), (-0.22, 0.0)]
    ob('head', bm_prism(head, -0.055, 0.055, bevel=0.018), steel)
    rbox('slit', (0.5, 0.014, 0.03), (0.38, 0.0, 0.05), dark)
    # 날 경사면 하이라이트
    ob('pivot', bm_cyl(0.085, 0.05, 0.08, 24, bevel=0.012), steel, (0.0, 0, 0))
    ob('pivot_s', bm_cyl(0.05, 0.075, 0.085, 16), dark, (0.0, 0, 0))
    for s in (-1, 1):
        tube('arm', [(-0.12, s * 0.06, 0), (-0.3, s * 0.1, 0), (-0.45, s * 0.13, 0)], 0.045, steel)
        pts = [(-0.4, s * 0.12, 0), (-0.7, s * 0.175, 0), (-1.0, s * 0.215, 0), (-1.3, s * 0.235, 0)]
        tube('grip', pts, 0.075, grip, radii=[0.85, 1.0, 1.05, 1.15])
        tube('cap', [(-1.29, s * 0.235, 0), (-1.38, s * 0.24, 0)], 0.09, gripd, radii=[1.0, 0.8])
    return dict(rot=(20, 0, 38))


def item_ladder():
    alu = m_metal('ld_alu', '#b6bbc0', 0.38, brushed='Y')
    alu_d = m_metal('ld_alu_d', '#9aa0a6', 0.42, brushed='Y')
    M = Mat('ld_tread', '#a9aeb3', 0.45, 1.0)
    rid = M.wave(M.co(), 60, 'BANDS', 'Y', profile='SIN')
    M.inp('Normal', M.bump(rid, 0.5, 0.01))
    tread = M.m
    cap = m_basic('ld_cap', '#3f4954', rough=0.5, var=0.04)
    rub = m_basic('ld_rub', '#1f1f22', rough=0.8, var=0.03)
    Lr, w = 2.2, 0.66
    for s in (-1, 1):
        rbox('rail', (0.07, Lr, 0.13), (s * w / 2, 0, 0), alu, bevel=0.012)
        rbox('rail2', (0.06, Lr - 0.1, 0.1), (s * (w / 2 - 0.09), 0.02, -0.15), alu_d, bevel=0.01)
        rbox('foot', (0.1, 0.12, 0.16), (s * w / 2, -Lr / 2 - 0.04, -0.01), rub, bevel=0.02)
        rbox('foot2', (0.09, 0.1, 0.13), (s * (w / 2 - 0.09), -Lr / 2 + 0.0, -0.15), rub, bevel=0.02)
    for i in range(5):
        y = -0.82 + i * 0.4
        rbox('step', (w - 0.06, 0.13, 0.035), (0, y, 0.035), tread, bevel=0.008)
    for i in range(4):
        y = -0.7 + i * 0.4
        tube('brace', [(-(w / 2 - 0.09), y, -0.15), (w / 2 - 0.09, y + 0.3, -0.15)], 0.017, alu_d)
    rbox('cap', (w + 0.14, 0.24, 0.34), (0, Lr / 2 + 0.06, -0.06), cap, bevel=0.03)
    for s in (-1, 1):
        ob('bolt', bm_cyl(0.035, -0.03, 0.03, 16), alu, (s * (w / 2 + 0.075), Lr / 2 + 0.03, 0.0), (0, 90, 0))
    return dict(rot=(16, 0, -34))


def _tablet(kind, char):
    Rr, T = 0.9, 0.16
    pent = [(Rr * math.cos(R(90 + 72 * k)), Rr * math.sin(R(90 + 72 * k))) for k in range(5)]
    if kind == 'metal':
        # 거울 반사로 글자가 뭉개지지 않도록 거칠기 ≈0.4 의 무광 청동 + 홈에는 검은 상감(inlay)
        M = Mat('tb_metal', '#a08954', 0.42, 1.0)
        n = M.noise(M.co(), 4.0, 5, 0.6)
        base = M.ramp(n, [(0.32, '#8a6c3e'), (0.68, '#ad8e58')])
        t = M.noise(M.co(), 2.6, 6, 0.65, distortion=0.4)
        f = M.ramp(t, [(0.52, 0.0), (0.66, 0.8)])
        M.inp('Base Color', M.mix(f, base, '#66563a'))
        M.inp('Roughness', M.ramp(M.noise(M.co(), 9.0, 4), [(0.3, 0.38), (0.7, 0.48)]))
        M.inp('Normal', M.bump(M.noise(M.co(), 60, 6, 0.6), 0.06, 0.02))
        body_m = M.m
        inside = m_basic('tb_metal_in', '#1d1810', rough=0.9, metal=0.0, var=0.04)
    else:
        body_m = m_wood('tb_wood', '#9a6a40', '#5e3a20', scale=4.0, axis='Y', rough=0.5, coat=0.2, bump=0.15)
        inside = m_basic('tb_wood_in', '#26170e', rough=0.85, var=0.05)
    body = ob('tablet', bm_prism(pent, 0, T, bevel=0.035), body_m)
    if kind == 'metal':
        flat_faces(body)   # 윗면을 플랫으로: 음각 경계의 스무스 노멀 번짐(얼룩 반사) 제거
    outer = [(0.74 * math.cos(R(90 + 72 * k)), 0.74 * math.sin(R(90 + 72 * k))) for k in range(5)]
    inner = [(0.68 * math.cos(R(90 + 72 * k)), 0.68 * math.sin(R(90 + 72 * k))) for k in range(5)]
    ring = ob('groove', bm_ring_prism(outer, inner, T - 0.03, T + 0.1), None, smooth=0)
    cut(body, ring, inside)
    txt = text_mesh('glyph', char, 1.02, 0.15, None, loc=(0, -0.05, T + 0.03))
    cut(body, txt, inside)
    return body


def item_tablet_metal():
    _tablet('metal', '金')
    return dict(rot=(36, 0, -8))


def item_tablet_wood():
    _tablet('wood', '木')
    return dict(rot=(36, 0, 8))


def make_key(parent, L, mat, seed, bow_r=0.2, th=0.045, groove_mat=None):
    rng = random.Random(seed)
    n = 36
    outer = []
    for i in range(n):
        a = 2 * math.pi * i / n
        c, s = math.cos(a), math.sin(a)
        outer.append((bow_r * math.copysign(abs(c) ** 0.7, c), bow_r * 0.92 * math.copysign(abs(s) ** 0.7, s)))
    inner = [(0.065 * math.cos(2 * math.pi * i / n), 0.065 * math.sin(2 * math.pi * i / n)) for i in range(n)]
    ob('bow', bm_ring_prism(outer, inner, -th / 2, th / 2, bevel=0.01), mat, parent=parent)
    rbox('shoulder', (0.07, bow_r * 1.05, th * 1.1), (bow_r + 0.02, 0, 0), mat, bevel=0.01, parent=parent)
    x0, x1 = bow_r + 0.05, L
    pts = [(x0, 0.075), (x1 - 0.07, 0.075), (x1, 0.03), (x1, -0.03)]
    x = x1 - 0.04
    while x > x0 + 0.08:
        dep = rng.uniform(0.02, 0.075)
        pts.append((x, -0.055))
        pts.append((x - 0.03, -0.055 - dep))
        x -= 0.07
    pts.append((x0 + 0.04, -0.055))
    pts.append((x0, -0.055))
    ob('blade', bm_prism(pts, -th * 0.4, th * 0.4, bevel=0.008), mat, parent=parent, smooth=35)
    if groove_mat is not None:
        rbox('groove', (x1 - x0 - 0.12, 0.022, 0.01), ((x0 + x1) / 2 - 0.03, 0.018, th * 0.4), groove_mat, parent=parent)


def item_key():
    brass = m_metal('k_brass', '#b8964f', 0.3, brushed='X', tarnish='#6d5a35', tarnish_amt=0.25)
    nickel = m_metal('k_nickel', '#a9adb1', 0.28, brushed='X')
    brass2 = m_metal('k_brass2', '#a37f45', 0.34, brushed='X')
    steel = m_metal('k_ring', '#9da2a7', 0.25, brushed=None)
    groove = m_basic('k_groove', '#3b3a36', 0.6, var=0, metal=0.5)
    tagm = m_basic('k_tag', '#4f6f8f', rough=0.45, var=0.04)
    rr = 0.3
    tube('ring', [p for p in circle_pts(rr, 16)], 0.024, steel, cyclic=True)
    for k, (ang, L, mat, z) in enumerate(((-28, 1.3, brass, 0.03), (-68, 1.12, nickel, 0.075), (-108, 0.95, brass2, 0.12))):
        a = R(ang)
        g = grp('key%d' % k, loc=(rr * math.cos(a), rr * math.sin(a), z), rot=(0, 4 * (k - 1), ang))
        make_key(g, L, mat, k + 3, bow_r=0.2 if k < 2 else 0.17, groove_mat=groove)
    # 번호 꼬리표
    a = R(120)
    g = grp('tag', loc=(rr * math.cos(a), rr * math.sin(a), 0.02), rot=(0, 0, 120))
    ob('tag', bm_ring_prism(poly_circle(0.23, 32, 0.23, 0), poly_circle(0.05, 32, 0.0, 0), -0.02, 0.02, bevel=0.008), tagm, parent=g)
    return dict(rot=(28, 0, 24))


def item_key_red():
    nickel = m_metal('kr_nickel', '#b0b3b6', 0.28, brushed='X')
    steel = m_metal('kr_ring', '#9da2a7', 0.25, brushed=None)
    groove = m_basic('kr_groove', '#3b3a36', 0.6, var=0, metal=0.5)
    # 꼬리표 그룹이 rot=150 으로 돌아가 있어 평면 투영의 +X 가 화면 오른쪽→왼쪽, +Y 가 아래를 향한다
    # → 라벨 글자만 제자리에서 180° 돌려야 'No.13' 이 바로 읽힌다(구멍 쪽 빨간 여백 위치는 유지).
    redm = m_img_planar('kr_tag', tex_tag('No.13', flip=True), 0.0, 0.95, -0.225, 0.225, rough=0.4, coat=0.3)
    rr = 0.13
    tube('ring', circle_pts(rr, 12), 0.02, steel, cyclic=True)
    a = R(-40)
    g = grp('key', loc=(rr * math.cos(a), rr * math.sin(a), 0.03), rot=(0, 0, -40))
    make_key(g, 0.95, nickel, 11, bow_r=0.17, groove_mat=groove)
    a = R(150)
    g = grp('tag', loc=(rr * math.cos(a), rr * math.sin(a), -0.01), rot=(0, 0, 150))
    tag = ob('tag', bm_prism(poly_rrect(0.95, 0.45, 0.1, 6, 0.475, 0), -0.025, 0.025, bevel=0.01), redm, parent=g, loc=(-0.08, 0, 0))
    hole = ob('hole', bm_cyl(0.05, -0.1, 0.1, 20), None, parent=g, loc=(0.0, 0, 0))
    cut(tag, hole)
    ob('eyelet', bm_ring_prism(poly_circle(0.075, 20), poly_circle(0.05, 20), -0.032, 0.032, bevel=0.006), steel, parent=g)
    return dict(rot=(30, 0, 12))


def item_lighter():
    chrome = m_metal('zp_chrome', '#c6c8ca', 0.22, brushed='Z')
    chrome_d = m_metal('zp_chrome_d', '#9fa3a7', 0.3, brushed='Z')
    inside = m_basic('zp_in', '#3a3a3c', 0.5, metal=0.5, var=0)
    knurl = Mat('zp_wheel', '#7d8084', 0.35, 1.0)
    u, z = knurl.angle_u()
    knurl.inp('Normal', knurl.bump(knurl.op('SINE', knurl.op('MULTIPLY', u, 2 * math.pi * 30)), 0.6, 0.01))
    knurl = knurl.m
    wick = m_basic('zp_wick', '#d9c9a0', 0.9, var=0.05)
    flame = m_basic('zp_flame', '#ffcf7a', rough=0.5, var=0, emit='#ff9a3c', estr=7.0)
    core = m_basic('zp_core', '#fff2c8', rough=0.5, var=0, emit='#ffe2a0', estr=9.0)
    W, Dp, Hb, Hl = 0.76, 0.36, 0.72, 0.36
    ob('body', bm_box(W, Dp, Hb, bevel=0.05), chrome, (0, 0, Hb / 2))
    rbox('rim', (W - 0.06, Dp - 0.05, 0.02), (0, 0, Hb + 0.005), chrome_d)
    # 침니 + 구멍
    cw = 0.44
    ch = ob('chimney', bm_box(cw, Dp - 0.1, 0.34), chrome_d, (-0.11, 0, Hb + 0.17))
    bm = bmesh.new()
    for x in (-0.27, -0.16, -0.05, 0.06):
        for zz in (Hb + 0.1, Hb + 0.22):
            bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.032, radius2=0.032, depth=0.6,
                                  matrix=Matrix.Translation((x, 0, zz)) @ Matrix.Rotation(R(90), 4, 'X'))
    holes = ob('holes', bm, None, smooth=0)   # 불리언은 월드 좌표 기준이라 ROOT 기준 위치 그대로 둔다
    cut(ch, holes, inside)
    ob('wick', bm_cyl(0.035, Hb + 0.2, Hb + 0.4, 12, bevel=0.01), wick, (-0.11, 0, 0))
    # 휠
    for s in (-1, 1):
        rbox('plate', (0.18, 0.02, 0.36), (0.2, s * 0.085, Hb + 0.18), chrome_d, bevel=0.006)
    ob('wheel', bm_cyl(0.075, -0.07, 0.07, 32), knurl, (0.2, 0, Hb + 0.33), (90, 0, 0))
    # 뚜껑(힌지 오른쪽, 열림)
    piv = grp('lidpiv', loc=(W / 2, 0, Hb), rot=(0, 118, 0))
    lid = ob('lid', bm_box(W, Dp, Hl, bevel=0.05), chrome, (-W / 2, 0, Hl / 2), parent=piv)
    inner = ob('lid_in', bm_box(W - 0.05, Dp - 0.05, Hl), None, (-W / 2, 0, Hl / 2 - 0.025), parent=piv, smooth=0)
    cut(lid, inner, inside)
    ob('hinge', bm_cyl(0.035, -0.1, 0.1, 16), chrome_d, (W / 2 + 0.005, Dp / 2 - 0.01, Hb), (90, 0, 0))
    # 불꽃
    fz = Hb + 0.39
    ob('flame', bm_lathe([(0, 0), (0.06, 0.03), (0.085, 0.1), (0.07, 0.19), (0.035, 0.28), (0, 0.36)], 24),
       flame, (-0.11, 0, fz))
    ob('fcore', bm_lathe([(0, 0), (0.035, 0.03), (0.045, 0.08), (0.03, 0.14), (0, 0.19)], 16),
       core, (-0.11, -0.03, fz + 0.01))
    return dict(rot=(0, 0, -22))


def item_weight():
    M = Mat('wt_iron', '#4a4c4f', 0.6, 0.7)
    co = M.co()
    n = M.noise(co, 5.0, 4, 0.6)
    base = M.ramp(n, [(0.3, '#3d3f42'), (0.7, '#5a5c5f')])
    t = M.noise(co, 3.2, 6, 0.7, distortion=0.5)
    f = M.ramp(t, [(0.55, 0.0), (0.68, 1.0)])
    M.inp('Base Color', M.mix(f, base, '#6e4a30'))
    M.inp('Roughness', M.ramp(t, [(0.55, 0.55), (0.68, 0.85)]))
    M.inp('Metallic', M.ramp(t, [(0.55, 0.7), (0.68, 0.1)]))
    M.inp('Normal', M.bump(M.noise(co, 45, 6, 0.65), 0.25, 0.02))
    iron = M.m
    prof = [(0, 0), (0.56, 0), (0.6, 0.015), (0.62, 0.05), (0.615, 0.1), (0.5, 0.5), (0.47, 0.56),
            (0.42, 0.61), (0.3, 0.655), (0.15, 0.67), (0.13, 0.69), (0.12, 0.8), (0, 0.8)]
    ob('body', bm_lathe(prof, 48), iron)
    pts = circle_pts(0.21, 16, 0, 0.98, 0, plane='XZ')
    tube('ring', pts, 0.055, iron, cyclic=True, rot=(0, 0, 30))
    txt = text_mesh('mark', '1kg', 0.2, 0.04, iron, loc=(0, -0.53, 0.31), rot=(81, 0, 0))
    return dict(rot=(0, 0, 10))


def item_coin():
    """학교 기념 동전: 무광에 가까운 황동 + 바닥면(필드)은 어둡게 삭은 색, '校' 와 점 테두리는 어두운 음각."""
    Rr, T = 0.6, 0.1
    # 황동: 베이스 명도·반사를 낮추고 거칠기를 올려 정면 광택에 하얗게 날아가지 않게
    M = Mat('cn_brass', '#8a6a3c', 0.45, 1.0)
    co = M.co()
    n = M.noise(co, 5.0, 4, 0.55)
    base = M.ramp(n, [(0.3, '#6c522e'), (0.7, '#80643a')])
    t = M.noise(co, 3.0, 5, 0.6, distortion=0.3)
    f = M.ramp(t, [(0.5, 0.0), (0.7, 0.6)])
    M.inp('Base Color', M.mix(f, base, '#55422a'))
    M.inp('Roughness', M.ramp(M.noise(co, 9.0, 4), [(0.3, 0.44), (0.7, 0.56)]))
    M.inp('Normal', M.bump(M.noise(co, 70, 6, 0.6), 0.12, 0.02))
    brass = M.m
    rim_m = m_metal('cn_rim', '#8a6c40', 0.42, brushed=None, tarnish='#6a4f2e', tarnish_amt=0.2)
    groove = m_basic('cn_groove', '#2a1f14', rough=0.85, metal=0.2, var=0.05)
    M = Mat('cn_edge', '#8a6a3c', 0.42, 1.0)
    u, z = M.angle_u()
    M.inp('Normal', M.bump(M.op('SINE', M.op('MULTIPLY', u, 2 * math.pi * 90)), 0.7, 0.01))
    edge = M.m
    h = T / 2
    fz = h - 0.02   # 필드(안쪽 바닥면) 높이
    prof = [(0, fz), (Rr - 0.085, fz), (Rr - 0.075, h - 0.005), (Rr - 0.06, h), (Rr - 0.012, h),
            (Rr, h - 0.012), (Rr, -h + 0.012), (Rr - 0.012, -h), (Rr - 0.06, -h), (Rr - 0.075, -h + 0.005),
            (Rr - 0.085, -h + 0.02), (0, -h + 0.02)]
    coin = ob('coin', bm_lathe(prof, 64), [brass, rim_m])
    # 테두리 둑(바깥 고리)은 밝은 rim 재질
    for p in coin.data.polygons:
        c = sum((coin.data.vertices[i].co for i in p.vertices), Vector()) / len(p.vertices)
        if math.hypot(c.x, c.y) > Rr - 0.09:
            p.material_index = 1
    flat_faces(coin)
    ob('edge', bm_lathe([(Rr + 0.002, -h + 0.014), (Rr + 0.002, h - 0.014)], 96), edge)
    # 음각 '校'(굵게) + 점 테두리 → 어두운 홈 재질
    txt = text_mesh('mark', '校', 0.66, 0.06, None, loc=(0, -0.01, fz))
    cut(coin, txt, groove)
    bm = bmesh.new()
    for i in range(20):
        a = 2 * math.pi * i / 20
        bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.026, radius2=0.026, depth=0.06,
                              matrix=Matrix.Translation((0.44 * math.cos(a), 0.44 * math.sin(a), fz)))
    dots = ob('dots', bm, None, smooth=0)
    cut(coin, dots, groove)
    # 안쪽 가는 원(음각 선)
    ring = ob('ring', bm_ring_prism(poly_circle(0.385, 64), poly_circle(0.37, 64), fz - 0.012, fz + 0.03), None, smooth=0)
    cut(coin, ring, groove)
    return dict(rot=(30, -18, 0))


def item_drink():
    alu = m_metal('dk_alu', '#c3c6c9', 0.3, brushed=None)
    alu_d = m_metal('dk_alu_d', '#a6aaae', 0.35, brushed=None)
    Rr = 0.33
    prof = [(0, 0.05), (0.2, 0.025), (0.25, 0.0), (0.29, 0.012), (0.315, 0.05), (Rr, 0.1),
            (Rr, 1.04), (0.3, 1.13), (0.275, 1.18), (0.272, 1.205), (0.262, 1.212), (0.252, 1.2),
            (0.248, 1.17), (0, 1.17)]
    ob('can', bm_lathe(prof, 64), alu)
    lab = m_img_cyl('dk_label', tex_can_label(), 0.1, 1.04, coat=0.3, rough=0.35, metal=0.15)
    ob('label', bm_lathe([(Rr + 0.002, 0.1), (Rr + 0.002, 1.04)], 64), lab)
    g = grp('tab', loc=(0, 0.04, 1.175), rot=(0, 0, 90))
    ob('tab', bm_ring_prism(poly_rrect(0.2, 0.11, 0.05, 5, 0.03, 0), poly_rrect(0.09, 0.05, 0.02, 5, 0.06, 0),
                             0, 0.012, bevel=0.004), alu_d, parent=g)
    ob('rivet', bm_cyl(0.018, 0, 0.02, 12), alu_d, (0, 0.04, 1.175))
    ob('mouth', bm_prism(poly_rrect(0.15, 0.1, 0.045, 5), 0, 0.004), m_basic('dk_score', '#8e9296', 0.35, metal=1.0, var=0),
       (0, -0.12, 1.172))
    return dict(rot=(0, 0, 0))


def item_pen():
    barrel_img = tex_pen_barrel().transpose(Image.Transpose.ROTATE_90)
    a_cam = -125  # 카메라를 향하는 둘레 각
    bar = m_img_cyl('pn_barrel', barrel_img, -0.55, 0.6, offset=0.5 - front_u(a_cam) + 0.25, rough=0.35, coat=0.2)
    grey = m_basic('pn_grey', '#9a9ca0', 0.4, var=0.03)
    blk = m_basic('pn_black', '#25262a', 0.4, var=0.03, coat=0.2)
    tip = m_basic('pn_tip', '#141416', 0.9, var=0.02, bump=0.2, bs=200)
    g = grp('pen', rot=(0, 90, 0))
    ob('barrel', bm_lathe([(0, -0.55), (0.11, -0.55), (0.11, 0.6), (0, 0.6)], 40), bar, parent=g)
    ob('front', bm_lathe([(0, 0.58), (0.108, 0.58), (0.1, 0.66), (0.06, 0.78), (0.042, 0.8), (0, 0.8)], 32), grey, parent=g)
    ob('tip', bm_lathe([(0, 0.78), (0.03, 0.78), (0.03, 0.9), (0.02, 0.94), (0, 0.95)], 16), tip, parent=g)
    # 뒤에 꽂은 뚜껑
    ob('cap', bm_lathe([(0, -1.02), (0.09, -1.02), (0.115, -1.0), (0.125, -0.96), (0.125, -0.48), (0.118, -0.46), (0, -0.46)], 40),
       blk, parent=g)
    cl = grp('clip', parent=g, rot=(0, 0, 180 + 0))
    rbox('clip', (0.035, 0.05, 0.42), (0.14, 0, -0.7), blk, bevel=0.012, parent=cl)
    ob('clipb', bm_cyl(0.035, 0, 0.05, 12), blk, (0.16, 0, -0.52), (90, 0, 0), parent=cl)
    return dict(rot=(16, 0, 38))


def item_toolbelt():
    """공구벨트: 허리에 찬 모양의 닫힌 가죽 벨트 고리 + 정면 황동 버클 + 오른쪽 큰 공구 주머니
    + 왼쪽 가죽 고리에 꽂힌 드라이버(손잡이·강철 축·일자 날 끝이 다 보이게)."""
    def leather_mat(name, c0, c1, stitch=None, zs=()):
        M = Mat(name, c0, 0.62)
        co = M.co()
        n = M.noise(co, 6.0, 5, 0.6)
        col = M.ramp(n, [(0.3, c0), (0.7, c1)])
        if stitch:
            # 위/아래 가장자리 스티치(점선): 각도 방향 점선 × z 띠
            u, z = M.angle_u()
            dash = M.op('GREATER_THAN', M.op('SINE', M.op('MULTIPLY', u, 2 * math.pi * 70)), 0.1)
            band = 0.0
            for zz in zs:
                band = M.op('MAXIMUM', band, M.op('LESS_THAN', M.op('ABSOLUTE', M.op('SUBTRACT', z, zz)), 0.008))
            col = M.mix(M.op('MULTIPLY', dash, band), col, stitch)
        M.inp('Base Color', col)
        M.inp('Normal', M.bump(M.voronoi(co, 140, 1.0), 0.2, 0.01))
        return M.m

    Z0, Z1 = 0.55, 0.81            # 벨트 띠 높이
    belt = leather_mat('tl_belt', '#5c3b22', '#6e4a2c', stitch='#c9b48a', zs=(Z0 + 0.03, Z1 - 0.03))
    belt_in = leather_mat('tl_belt_in', '#8c6a48', '#9c7a56')       # 안쪽(살쪽) 밝은 스웨이드
    pouch_m = leather_mat('tl_pouch', '#8a5a34', '#9c6a40')
    pocket_m = leather_mat('tl_pocket', '#74492a', '#845634')
    stitch = m_basic('tl_stitch', '#d6c39a', 0.7, var=0)
    brass = m_basic('tl_brass', '#c9a457', rough=0.3, metal=0.65, var=0.06, coat=0.2)
    steel = m_metal('tl_steel', '#c3c8cd', 0.22, brushed='Z')
    red = Mat('tl_red', '#b0412f', 0.3)
    u, z = red.angle_u()
    red.inp('Normal', red.bump(red.op('SINE', red.op('MULTIPLY', u, 2 * math.pi * 8)), 0.5, 0.02))
    red.inp('Coat Weight', 0.4)
    red = red.m
    blk = m_basic('tl_black', '#232326', 0.5, var=0.03)
    grip = m_basic('tl_grip', '#9e3a2e', rough=0.55, var=0.06)

    rx, ry = 0.7, 0.54
    zc = (Z0 + Z1) / 2
    TH = 0.05

    def E(t):
        return Vector((rx * math.cos(t), ry * math.sin(t), 0))

    def frame(tdeg, off):
        t = R(tdeg)
        nrm = Vector((math.cos(t) / rx, math.sin(t) / ry, 0)).normalized()
        tan = Vector((-rx * math.sin(t), ry * math.cos(t), 0)).normalized()
        return E(t) + nrm * off, math.degrees(math.atan2(tan.y, tan.x))

    # 벨트 고리(닫힘)
    N = 72
    pts = [(rx * math.cos(2 * math.pi * i / N), ry * math.sin(2 * math.pi * i / N), zc) for i in range(N)]
    bo = ob('belt', bm_sweep(pts, (0, 0, 1), Z1 - Z0, TH, closed=True), [belt, belt_in], smooth=50)
    for p in bo.data.polygons:
        c = p.center
        inward = Vector((-c.x, -c.y, 0))
        if p.normal.dot(inward) > 0.3:
            p.material_index = 1
    # 버클 앞쪽으로 넘어온 벨트 끝(겹친 띠, 끝이 뾰족) + 구멍
    tail = []
    widths = []
    for k in range(9):
        td = -95 - 4 * k
        loc, _ = frame(td, TH * 0.5 + 0.018)
        tail.append((loc.x, loc.y, zc))
        widths.append(0.21 if k < 7 else (0.13 if k == 7 else 0.03))
    ob('tail', bm_sweep(tail, (0, 0, 1), widths, 0.03), belt, smooth=50)
    for td in (-107, -117):
        loc, yaw = frame(td, TH * 0.5 + 0.034)
        g = grp('hole', loc=(loc.x, loc.y, zc), rot=(0, 0, yaw))
        ob('hole', bm_cyl(0.022, -0.008, 0.008, 12), blk, parent=g, rot=(90, 0, 0))
    # 황동 버클(정면): 둥근 단면 프레임이라 하이라이트가 잘 잡힌다
    loc, yaw = frame(-92, TH * 0.5 + 0.04)
    gb = grp('buckle', loc=(loc.x, loc.y, zc), rot=(0, 0, yaw))
    fr = [(x, 0, z) for x, z in poly_rrect(0.36, 0.44, 0.09, 4)]
    tube('bk', fr, 0.036, brass, parent=gb, cyclic=True)
    tube('bk_bar', [(-0.02, 0, -0.2), (-0.02, 0, 0.2)], 0.026, brass, parent=gb)
    tube('bk_prong', [(-0.02, -0.02, 0.0), (0.12, -0.045, 0.0), (0.19, -0.03, 0.0)], 0.02, brass, parent=gb)
    # 키퍼(벨트 끝을 잡는 가죽 고리)
    loc, yaw = frame(-127, TH * 0.5 + 0.02)
    gk = grp('keeper', loc=(loc.x, loc.y, zc), rot=(0, 0, yaw))
    rbox('keeper', (0.07, 0.07, Z1 - Z0 + 0.04), (0, 0, 0), pocket_m, bevel=0.02, parent=gk)

    # 공구 주머니(오른쪽 앞)
    loc, yaw = frame(-36, TH * 0.5)
    gp = grp('pouch', loc=(loc.x, loc.y, 0), rot=(0, 0, yaw))
    PW, PD = 0.72, 0.28
    rbox('pouch', (PW, PD, 0.9), (0, -PD / 2 - 0.01, 0.4), pouch_m, bevel=0.06, parent=gp)
    rbox('pocket', (PW - 0.1, 0.1, 0.56), (0, -PD - 0.05, 0.26), pocket_m, bevel=0.04, parent=gp)
    for i in range(13):
        rbox('st', (0.032, 0.01, 0.014), (-0.27 + i * 0.045, -PD - 0.103, 0.49), stitch, parent=gp)
    for sx in (-1, 1):
        ob('rivet', bm_cyl(0.034, 0, 0.02, 12, bevel=0.008), brass, (sx * 0.26, -PD - 0.1, 0.45), (90, 0, 0), parent=gp)
    # 주머니에 꽂힌 펜치 손잡이
    for sx in (-1, 1):
        tube('pl', [(0.08 + sx * 0.035, -0.14, 0.62), (0.1 + sx * 0.08, -0.14, 0.92), (0.11 + sx * 0.14, -0.13, 1.12)],
             0.05, grip, parent=gp)
    tube('pl_j', [(0.08, -0.14, 0.56), (0.08, -0.14, 0.68)], 0.06, steel, parent=gp)

    # 드라이버(왼쪽 앞, 가죽 고리에 꽂힘): 손잡이는 벨트 위로, 강철 축과 일자 날은 벨트 아래로
    loc, yaw = frame(-134, TH * 0.5)
    gl = grp('holster', loc=(loc.x, loc.y, 0), rot=(0, 0, yaw))
    rbox('loop', (0.26, 0.11, 0.15), (0, -0.065, Z0 + 0.04), pocket_m, bevel=0.035, parent=gl)
    gd = grp('drv', loc=(0, -0.13, Z0 + 0.04), rot=(-4, -34, 0), parent=gl)
    ob('shaft', bm_cyl(0.042, -0.66, 0.1, 16), steel, parent=gd)
    tip = ob('tip', bm_lathe([(0, -0.64), (0.042, -0.64), (0.036, -0.72), (0.026, -0.77), (0, -0.77)], 16), steel, parent=gd)
    tip.scale = (1.6, 0.45, 1)
    ob('ferrule', bm_cyl(0.06, 0.08, 0.15, 20, bevel=0.012), steel, parent=gd)
    ob('handle', bm_lathe([(0, 0.13), (0.09, 0.13), (0.12, 0.2), (0.12, 0.58), (0.106, 0.65), (0, 0.66)], 32), red, parent=gd)
    ob('hend', bm_lathe([(0, 0.63), (0.108, 0.63), (0.095, 0.7), (0, 0.715)], 24), blk, parent=gd)
    return dict(rot=(10, 0, -8))


def item_note():
    """구겨졌다 펴진 노트 낱장: 여러 접힘선(V자 능선/골) + 가장자리 말림 + 찢긴 윗변."""
    rng = random.Random(5)
    folds = note_folds()

    def z(x, y):
        h = 0.035 * noise.noise(Vector((x * 2.2, y * 2.2, 0.3))) + 0.012 * noise.noise(Vector((x * 8, y * 8, 1.7)))
        for px, py, nx, ny, amp, wd in folds:
            d = abs((x - px) * nx + (y - py) * ny)
            h += amp * max(0.0, wd - d) / wd       # 날카로운 V 단면 → 접힘선 음영
        r = math.hypot(x / 0.5, y / 0.62)
        h += 0.16 * max(0.0, r - 0.7) ** 2
        # 모서리 두 곳이 말려 올라감
        h += 0.5 * max(0.0, x - 0.3) ** 2 * max(0.0, -y - 0.35) * 6
        h += 0.35 * max(0.0, -x - 0.3) ** 2 * max(0.0, y - 0.4) * 6
        return h

    W, D = NOTE_W, NOTE_D

    def xy(x, y, i, j):
        # 노트에서 찢어낸 윗변 + 구겨져 줄어든 울퉁불퉁한 가장자리
        if j == 60:
            y += 0.014 * math.sin(i * 2.7) + rng.uniform(-0.01, 0.01)
        sx = 0.035 * noise.noise(Vector((x * 2.5, y * 2.5, 5.0)))
        sy = 0.035 * noise.noise(Vector((x * 2.5, y * 2.5, 9.0)))
        return x + sx, y + sy

    pm = m_img_planar('nt_paper', tex_note(folds), -W / 2, W / 2, -D / 2, D / 2, rough=0.85, bump=0.1, bs=150)
    ob('note', bm_grid(W, D, 50, 60, z, xy), pm, smooth=15)
    return dict(rot=(30, 0, 16))


def item_solvent():
    glass = m_basic('sv_glass', '#5b2a0c', rough=0.1, var=0.0, trans=0.55, ior=1.45, coat=0.5)
    M = Mat('sv_cap', '#262628', 0.45)
    u, z = M.angle_u()
    M.inp('Normal', M.bump(M.op('SINE', M.op('MULTIPLY', u, 2 * math.pi * 36)), 0.5, 0.01))
    cap = M.m
    prof = [(0, 0.02), (0.34, 0.0), (0.39, 0.012), (0.415, 0.05), (0.42, 0.1), (0.42, 0.8), (0.41, 0.86),
            (0.37, 0.93), (0.29, 0.99), (0.2, 1.03), (0.17, 1.06), (0.17, 1.16), (0, 1.16)]
    ob('bottle', bm_lathe(prof, 48), glass)
    ob('cap', bm_lathe([(0, 1.1), (0.195, 1.1), (0.2, 1.12), (0.2, 1.33), (0.19, 1.355), (0.17, 1.36), (0, 1.36)], 48), cap)
    a0, a1 = R(-90 - 72), R(-90 + 72)
    lab = Mat('sv_label', '#e4dcc3', 0.65)
    uu, zz = lab.angle_u(a0, a1)
    vv = lab.op('DIVIDE', lab.op('SUBTRACT', zz, 0.2), 0.5)
    tn = lab.image(pil_to_img('sv_label_img', tex_solvent_label()), lab.comb(uu, vv, 0.0))
    lab.inp('Base Color', tn.outputs['Color'])
    ob('label', bm_lathe([(0.423, 0.2), (0.423, 0.7)], 40, a0, a1), lab.m)
    return dict(rot=(0, 0, 0))


def item_spray():
    alu = m_metal('sp_alu', '#b9bcc0', 0.3, brushed=None)
    capm = m_basic('sp_cap', '#9e3a31', rough=0.35, var=0.04, coat=0.3)
    blk = m_basic('sp_noz', '#262628', 0.5, var=0)
    Rr = 0.36
    prof = [(0, 0.04), (0.25, 0.015), (0.3, 0.0), (0.34, 0.015), (Rr, 0.06), (Rr, 1.1), (0.345, 1.15),
            (0.29, 1.22), (0.18, 1.28), (0.14, 1.3), (0, 1.3)]
    ob('can', bm_lathe(prof, 64), alu)
    lab = m_img_cyl('sp_label', tex_spray_label(), 0.08, 1.09, coat=0.3, rough=0.35)
    ob('label', bm_lathe([(Rr + 0.002, 0.08), (Rr + 0.002, 1.09)], 64), lab)
    ob('cap', bm_lathe([(0, 1.16), (0.3, 1.16), (0.31, 1.2), (0.31, 1.4), (0.29, 1.46), (0.24, 1.49), (0, 1.5)], 48), capm)
    rbox('nozzle', (0.12, 0.08, 0.1), (0, -0.28, 1.4), blk, bevel=0.02)
    ob('hole', bm_cyl(0.018, 0, 0.02, 10), m_basic('sp_hole', '#0e0e0e', 0.9, var=0), (0, -0.32, 1.405), (90, 0, 0))
    return dict(rot=(0, 0, 0))


def item_doc():
    W, D = 1.0, 1.4
    paper = m_basic('dc_paper', '#e8e3d6', rough=0.8, var=0.03)
    paper2 = m_basic('dc_paper2', '#ded8c8', rough=0.8, var=0.03)
    top = m_img_planar('dc_top', tex_doc(), -W / 2, W / 2, -D / 2, D / 2, rough=0.75, bump=0.05, bs=150)
    clip = m_metal('dc_clip', '#b9bdc2', 0.25, brushed=None)
    rbox('s1', (W, D, 0.006), (0.05, 0.04, 0.003), paper2, rot=(0, 0, 7))
    rbox('s2', (W, D, 0.006), (-0.04, 0.02, 0.012), paper, rot=(0, 0, -5))

    def bend(x, y):
        return 0.03 + 0.04 * ((x / 0.5) ** 2) * 0.5 + 0.03 * max(0.0, (-y - 0.3)) ** 2
    ob('s3', bm_grid(W, D, 20, 28, bend), top, smooth=60)
    # 클립
    pts = [(-0.36, 0.55, 0.06), (-0.36, 0.78, 0.06), (-0.30, 0.82, 0.06), (-0.24, 0.78, 0.06), (-0.24, 0.6, 0.06),
           (-0.28, 0.56, 0.05), (-0.32, 0.6, 0.04), (-0.32, 0.74, 0.04)]
    tube('clip', pts, 0.011, clip)
    return dict(rot=(30, 0, -8))


ITEMS = [
    ('item_diary', item_diary), ('item_candy', item_candy), ('item_magazine', item_magazine),
    ('item_wirecutter', item_wirecutter), ('item_ladder', item_ladder),
    ('item_tablet_metal', item_tablet_metal), ('item_tablet_wood', item_tablet_wood),
    ('item_key', item_key), ('item_key_red', item_key_red), ('item_lighter', item_lighter),
    ('item_weight', item_weight), ('item_coin', item_coin), ('item_drink', item_drink),
    ('item_pen', item_pen), ('item_toolbelt', item_toolbelt), ('item_note', item_note),
    ('item_solvent', item_solvent), ('item_spray', item_spray), ('item_doc', item_doc),
]


# ---------------------------------------------------------------- 맞춤 + 렌더 + 외곽선

def fit(fill):
    bpy.context.view_layer.update()
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.hide_render]
    pts = [C.project(p) for p in C._world_verts(objs)]
    x0 = min(p[0] for p in pts)
    x1 = max(p[0] for p in pts)
    y0 = min(p[1] for p in pts)
    y1 = max(p[1] for p in pts)
    s = fill / max(x1 - x0, y1 - y0)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    ROOT.scale = (s, s, s)
    ROOT.location = (-cx * s, cy * s / C.SIN_E, 0)
    bpy.context.view_layer.update()


def outline(path, color=(222, 214, 196), alpha=0.5, radius=2):
    im = Image.open(path).convert('RGBA')
    a = im.getchannel('A')
    m = a.point(lambda v: 255 if v > 24 else 0)
    d = m.filter(ImageFilter.MaxFilter(radius * 2 + 1)).filter(ImageFilter.GaussianBlur(0.7))
    ring = ImageChops.subtract(d, a)
    lay = Image.new('RGBA', im.size, color + (0,))
    lay.putalpha(ring.point(lambda v: int(v * alpha)))
    out = Image.alpha_composite(lay, im)
    out.save(path)


def main():
    sel = C.only(None)
    setup()
    meta_path = os.path.join(C.OUT, CAT + '.json')
    meta = {}
    if sel and os.path.exists(meta_path):
        with open(meta_path, encoding='utf-8') as f:
            meta = json.load(f)
    for key, fn in ITEMS:
        if sel and key not in sel:
            continue
        clear()
        spec = fn() or {}
        ROOT.rotation_euler = [R(a) for a in spec.get('rot', (0, 0, 0))]
        fit(spec.get('fill', FILL))
        m = C.render_sprite(CAT + '/' + key, anchor=(0, 0, 0), pad=0, bounds=BOUNDS)
        outline(os.path.join(C.OUT, m['file']))
        meta[key] = m
        print('rendered', key, m)
    meta = {k: meta[k] for k, _ in ITEMS if k in meta}
    C.write_meta(CAT, meta)


if __name__ == '__main__':
    main()
