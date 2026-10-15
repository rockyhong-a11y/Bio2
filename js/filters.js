// 그래픽 필터(옵션): 게임 화면(2D 캔버스 #game)을 매 프레임 WebGL 텍스처로 올려 셰이더로 후처리해 #fx 캔버스에 그린다.
// 대사창·메뉴 같은 UI(DOM)에는 걸리지 않는다. 셰이더는 모두 이 프로젝트에서 직접 짠 코드(외부 셰이더·라이선스 없음).
// WebGL이 없거나 컨텍스트를 잃으면 필터 없이(2D 캔버스 그대로) 동작한다.
export const FILTERS = [
  { id: 'off', name: '끄기' },
  { id: 'crt', name: 'CRT' },
  { id: 'sharp', name: '선명' },
  { id: 'vivid', name: '생생' },
  { id: 'smooth', name: '부드럽게' },
  { id: 'lcd', name: 'LCD' },
  { id: 'noir', name: '흑백' },
  { id: 'sepia', name: '세피아' },
  { id: 'vhs', name: 'VHS' },
  { id: 'dmg', name: '게임보이' },
  { id: 'bloom', name: '빛 번짐' },
];

const VERT = 'attribute vec2 p; varying vec2 v_uv; void main() { v_uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }';
// 공통: u_res = 캔버스 크기(기기 px), u_px = 게임 1px의 기기 px 크기, u_off = 게임 픽셀 격자의 시작 위치(기기 px, 위 기준), u_t = 초(600초마다 0으로)
// 정밀도: 고정밀(highp)을 지원하면 그것으로 — 안드로이드 대부분의 GPU는 mediump가 16비트라 큰 좌표·시간에서 줄무늬·검은 화면이 된다
const HEAD = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_tex; uniform vec2 u_res; uniform float u_px; uniform vec2 u_off; uniform float u_t;
varying vec2 v_uv;
vec3 tex(vec2 uv) { return texture2D(u_tex, uv).rgb; }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float rand(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); } // sin 없는 해시(낮은 정밀도 GPU에서도 잡티가 고르게)
vec2 devPx() { return vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y); }
vec2 gamePx() { return (devPx() - u_off) / max(u_px, 1.0); }
float vignette(float k) { vec2 d = v_uv - 0.5; return 1.0 - k * dot(d, d) * 2.2; }
`;
const FRAG = {
  // 브라운관: 볼록한 화면, 게임 픽셀 줄마다 주사선, RGB 섀도 마스크, 살짝 번지는 빛, 가장자리 어둡게
  crt: `void main() {
    vec2 uv = v_uv - 0.5; uv *= 1.0 + 0.09 * dot(uv, uv); uv += 0.5;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    vec2 o = vec2(max(u_px, 2.0) * 0.5 / u_res.x, 0.0);
    vec3 c = tex(uv) * 0.76 + (tex(uv + o) + tex(uv - o)) * 0.12;
    float row = ((1.0 - uv.y) * u_res.y - u_off.y) / max(u_px, 3.0);
    float scan = 0.62 + 0.38 * pow(sin(3.14159 * fract(row)), 0.7);
    float col = mod(floor(uv.x * u_res.x), 3.0);
    vec3 mask = col < 1.0 ? vec3(1.0, 0.78, 0.78) : col < 2.0 ? vec3(0.78, 1.0, 0.78) : vec3(0.78, 0.78, 1.0);
    c = c * scan * mask * 1.38;
    gl_FragColor = vec4(c * vignette(0.9), 1.0);
  }`,
  // 선명: 게임 픽셀 경계를 또렷하게(언샤프 마스크)
  sharp: `void main() {
    vec2 d = vec2(max(1.0, u_px * 0.5)) / u_res;
    vec3 c = tex(v_uv);
    vec3 b = (tex(v_uv + vec2(d.x, 0.0)) + tex(v_uv - vec2(d.x, 0.0)) + tex(v_uv + vec2(0.0, d.y)) + tex(v_uv - vec2(0.0, d.y))) * 0.25;
    c = c + (c - b) * 1.4;
    gl_FragColor = vec4((c - 0.5) * 1.06 + 0.5, 1.0);
  }`,
  // 생생: 채도·대비를 높이고 어두운 곳을 조금 밝게
  vivid: `void main() {
    vec3 c = tex(v_uv); float l = luma(c);
    c = mix(vec3(l), c, 1.55);
    c = (c - 0.5) * 1.18 + 0.5;
    c += 0.05 * (1.0 - smoothstep(0.0, 0.35, l));
    gl_FragColor = vec4(c, 1.0);
  }`,
  // 부드럽게: 도트 계단을 살짝 뭉갬(쌍선형 확대 느낌)
  smooth: `void main() {
    vec2 d = vec2(max(1.0, u_px * 0.45)) / u_res;
    vec3 c = tex(v_uv) * 0.36 + (tex(v_uv + vec2(d.x, 0.0)) + tex(v_uv - vec2(d.x, 0.0)) + tex(v_uv + vec2(0.0, d.y)) + tex(v_uv - vec2(0.0, d.y))) * 0.12
      + (tex(v_uv + d) + tex(v_uv - d) + tex(v_uv + vec2(d.x, -d.y)) + tex(v_uv + vec2(-d.x, d.y))) * 0.04;
    gl_FragColor = vec4(c, 1.0);
  }`,
  // LCD: 게임 픽셀마다 칸이 보이는 휴대용 게임기 액정
  lcd: `void main() {
    vec2 f = fract(gamePx());
    float e = max(0.08, 1.0 / max(u_px, 1.0));
    float g = smoothstep(0.0, e, f.x) * smoothstep(0.0, e, f.y);
    vec3 c = tex(v_uv);
    c = mix(c * 0.5, c * 1.12, g);
    c = mix(c, c * vec3(0.94, 1.02, 0.94) + vec3(0.02, 0.03, 0.02), 0.5);
    gl_FragColor = vec4(c, 1.0);
  }`,
  // 흑백: 대비가 강한 누아르 + 필름 잡티
  noir: `void main() {
    float l = luma(tex(v_uv));
    l = smoothstep(0.02, 0.85, l) * 1.08;
    l += (rand(floor(devPx() / 2.0) + fract(u_t * 7.0) * 61.0) - 0.5) * 0.09;
    gl_FragColor = vec4(vec3(l * vignette(0.8)), 1.0);
  }`,
  // 세피아: 바랜 사진(갈색 톤, 잡티, 가끔 세로 긁힘)
  sepia: `void main() {
    vec3 c = tex(v_uv); float l = luma(c);
    vec3 s = vec3(l * 1.08 + 0.07, l * 0.9 + 0.04, l * 0.68 + 0.01);
    s = mix(s, c, 0.12);
    s += (rand(floor(devPx() / 2.0) + fract(u_t * 5.0) * 37.0) - 0.5) * 0.06;
    float x = floor(v_uv.x * 90.0);
    if (rand(vec2(x, floor(u_t * 6.0))) > 0.985) s *= 0.75;
    gl_FragColor = vec4(s * vignette(0.9), 1.0);
  }`,
  // VHS: 색 번짐, 줄마다 흔들림, 잡음, 위로 흐르는 트래킹 띠
  vhs: `void main() {
    vec2 uv = v_uv;
    float line = floor((1.0 - uv.y) * u_res.y / 3.0);
    uv.x += (rand(vec2(line, floor(u_t * 24.0))) - 0.5) * 0.0025 + sin(uv.y * 30.0 + u_t * 2.0) * 0.0012;
    float band = fract(u_t * 0.12);
    float inBand = 1.0 - smoothstep(0.0, 0.025, abs(uv.y - band));
    uv.x += inBand * 0.01 * (rand(vec2(u_t, line)) - 0.5);
    float ca = 0.0035;
    vec3 c = vec3(tex(uv + vec2(ca, 0.0)).r, tex(uv).g, tex(uv - vec2(ca, 0.0)).b);
    c = mix(vec3(luma(c)), c, 0.82) * 1.05;
    c += (rand(devPx() * 0.5 + u_t * 13.0) - 0.5) * 0.08 + inBand * 0.18 * rand(devPx() + u_t);
    gl_FragColor = vec4(c, 1.0);
  }`,
  // 게임보이: 초록 4단계 + 게임 픽셀 단위 4x4 디더링(밝기는 조금만 끌어올림 — 불빛 밖 어둠은 어둡게 남는다)
  dmg: `float bayer(vec2 p) {
    vec2 q = mod(p, 4.0);
    float a = mod(q.x, 2.0), b = mod(q.y, 2.0), c = floor(q.x / 2.0), d = floor(q.y / 2.0);
    return (8.0 * mod(a + b, 2.0) + 4.0 * b + 2.0 * mod(c + d, 2.0) + d) / 16.0;
  }
  void main() {
    float l = pow(clamp(luma(tex(v_uv)) * 1.3, 0.0, 1.0), 0.75);
    float lv = clamp(floor(l * 3.0 + bayer(floor(gamePx())) * 0.9 - 0.2), 0.0, 3.0);
    vec3 c = lv < 0.5 ? vec3(0.06, 0.22, 0.06) : lv < 1.5 ? vec3(0.19, 0.38, 0.19) : lv < 2.5 ? vec3(0.55, 0.67, 0.06) : vec3(0.61, 0.74, 0.06);
    gl_FragColor = vec4(c, 1.0);
  }`,
  // 빛 번짐: 밝은 곳(라이터·형광등·자판기)이 주변으로 번진다
  bloom: `void main() {
    vec3 c = tex(v_uv);
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 12; i++) {
      float a = float(i) * 0.5236;
      for (int k = 1; k <= 2; k++) {
        vec2 o = vec2(cos(a), sin(a)) * float(k) * 7.0 / u_res;
        acc += max(tex(v_uv + o) - 0.42, 0.0) / float(k);
      }
    }
    gl_FragColor = vec4(c + acc * 0.11, 1.0);
  }`,
};

export class FilterLayer {
  constructor(src) {
    this.src = src;
    this.id = 'off';
    this.cv = document.createElement('canvas');
    this.cv.id = 'fx';
    src.after(this.cv);
    // 컨텍스트를 잃으면(백그라운드·메모리 부족) 필터를 잠시 끄고, 돌아오면 고른 필터로 다시
    this.cv.addEventListener('webglcontextlost', e => { e.preventDefault(); this.want = this.id; this.gl = null; this.set('off'); });
    this.cv.addEventListener('webglcontextrestored', () => { this.init(); this.set(this.want); });
    this.init();
  }

  init() {
    this.progs = {};
    try {
      this.gl = this.cv.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
    } catch { this.gl = null; }
    if (!this.gl) return;
    const gl = this.gl;
    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  }

  get supported() { return !!this.gl; }

  program(id) {
    if (this.progs[id] !== undefined) return this.progs[id];
    const gl = this.gl;
    const sh = (type, code) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`필터 ${id}: ${gl.getShaderInfoLog(s)}`); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, HEAD + FRAG[id]));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`필터 ${id}: ${gl.getProgramInfoLog(p)}`);
    const u = n => gl.getUniformLocation(p, n);
    this.progs[id] = { p, a: gl.getAttribLocation(p, 'p'), res: u('u_res'), px: u('u_px'), off: u('u_off'), t: u('u_t'), tex: u('u_tex') };
    return this.progs[id];
  }

  // id: FILTERS의 id. 없는 id·WebGL 없음이면 끄기
  set(id) {
    this.id = this.gl && FRAG[id] ? id : 'off';
    document.getElementById('app')?.classList.toggle('fx-on', this.id !== 'off');
  }

  resize() {
    this.cv.width = this.src.width;
    this.cv.height = this.src.height;
  }

  // view = { px: 게임 1px의 기기 px, ox/oy: 게임 화면이 그려진 기기 px 오프셋 }
  render(view, t) {
    if (this.id === 'off' || !this.gl) return;
    const gl = this.gl;
    let P;
    try { P = this.program(this.id); } catch (e) { console.error(e); this.set('off'); return; }
    if (this.cv.width !== this.src.width || this.cv.height !== this.src.height) this.resize();
    gl.viewport(0, 0, this.cv.width, this.cv.height);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.src);
    gl.useProgram(P.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(P.a);
    gl.vertexAttribPointer(P.a, 2, gl.FLOAT, false, 0, 0);
    const px = view?.px || 1, mod = v => ((v % px) + px) % px;
    gl.uniform2f(P.res, this.cv.width, this.cv.height);
    gl.uniform1f(P.px, px);
    gl.uniform2f(P.off, mod(view?.ox || 0), mod(view?.oy || 0));
    gl.uniform1f(P.t, t % 600); // 오래 켜 둬도 시간 값이 커지지 않게(셰이더의 시간 배수 0.12·5·7·24와 맞물려 이어짐)
    gl.uniform1i(P.tex, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
