"""assets/sprites/*.json(카테고리별 메타) → assets/sprites/sprites.json 병합(키 중복 시 실패),
assets/hf/ 의 이미지 목록 → assets/hf/manifest.json (힉스필드 결과물 자동 인식)."""
import glob, json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
D = os.path.join(ROOT, 'assets', 'sprites')
out, src = {}, {}
for p in sorted(glob.glob(os.path.join(D, '*.json'))):
    if p.endswith('sprites.json'):
        continue
    cat = os.path.basename(p)[:-5]
    for k, m in json.load(open(p, encoding='utf-8')).items():
        if k in out:
            raise SystemExit(f'중복 스프라이트 키 {k}: {src[k]} / {cat}')
        if not os.path.exists(os.path.join(D, m['file'])):
            raise SystemExit(f'파일 없음: {m["file"]} ({cat})')
        out[k], src[k] = m, cat
json.dump({'scale': 2, 'sprites': out}, open(os.path.join(D, 'sprites.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'sprites')

HF = os.path.join(ROOT, 'assets', 'hf')
os.makedirs(HF, exist_ok=True)
hf = sorted(f for f in os.listdir(HF) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))
json.dump(hf, open(os.path.join(HF, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print(len(hf), 'hf images')
