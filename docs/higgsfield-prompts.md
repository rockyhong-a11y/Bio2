# 힉스필드(Higgsfield) 작업 시트 — 1장

게임 안의 **스프라이트(타일·소품·캐릭터 걷기 프레임·아이템)는 Blender로 렌더**하고,
**컷신 2D 초상화(미소녀·미소년, 표정별)·타이틀 키아트·이벤트 CG는 힉스필드로 생성**해 슬롯에 넣는 구조입니다.
힉스필드 결과물이 없으면 초상화는 Blender 렌더 초상화로 대체되고, CG는 건너뜁니다(게임은 그대로 진행).

## 넣는 방법

1. 아래 표의 **파일명** 그대로 저장 (`.png`, `.jpg`, `.webp` 중 아무거나)
2. `assets/hf/` 폴더에 넣기
3. `python3 tools/build_sprites.py` 실행 → `assets/hf/manifest.json`에 등록되어 자동 적용

## 2D 초상화(컷신) 공통 규칙

대화창 오른쪽에 크게 뜨는 **2D 애니메이션풍 미소녀·미소년 초상화**입니다. 게임이 빨간 외곽선을 자동으로 그리므로 **배경만 비어 있으면** 됩니다.

- **크기**: 세로 4:5, 1024×1280 권장. 허리 위 상반신, 머리 위 여백 약간, 인물이 화면 아래 끝까지 닿게(대화창이 아랫부분을 가림).
- **방향**: 몸은 정면~살짝 왼쪽(화면 안쪽)을 향하게. 오른쪽 끝에 붙어 표시됩니다.
- **배경**: 투명 PNG가 가장 좋고, 안 되면 **단색 초록(#00FF00) 배경**으로 생성 →
  `python3 tools/hf_key.py assets/hf/<파일>` 로 배경 제거(같은 이름의 PNG 생성, 원본은 `.orig`로 보관).
- **일관성**: 인물마다 먼저 `기본` 표정을 만들고, 마음에 드는 결과를 **레퍼런스 이미지(캐릭터 고정)** 로 걸어 나머지 표정을 같은 시드/설정으로 생성.
- **표정이 없으면** 그 인물의 기본 초상화 → 그것도 없으면 Blender 초상화가 대신 나옵니다. 아래 표의 표정 이름은 1장 대사에 이미 연결돼 있습니다.

### 스타일 블록 (초상화 프롬프트 앞에 붙이기)

```
2D anime visual novel character sprite, beautiful bishoujo/bishounen style, clean cel shading,
crisp lineart, soft rim light, Korean high school uniform 2001, horror adventure game,
waist-up, looking at viewer, plain solid #00FF00 green background, no text, no watermark
```

**공통 네거티브**: `background scenery, text, letters, watermark, logo, signature, extra fingers, deformed hands, gore, nudity, chibi, 3d render, photo, blurry`

## 인물 고정 묘사 (Blender 스프라이트와 맞춤)

| 인물 | 고정 묘사 (영문) |
|---|---|
| 이희민 (미소년) | `handsome 17-year-old Korean boy, bishounen, short straight black hair with soft bangs, gentle dark eyes, slim, navy school blazer, white shirt, dark red tie` |
| 한소영 (미소녀) | `beautiful 17-year-old Korean girl, bishoujo, waist-length straight black hair with blunt bangs, pale porcelain skin, cold mysterious dark eyes, navy school blazer, red ribbon` |
| 김성아 (미소녀) | `pretty 17-year-old Korean girl, bishoujo, chin-length dark brown bob with side-swept fringe, small yellow hairpin, sharp cat-like eyes, navy blazer worn open over white shirt` |
| 설지현 (미소녀) | `cute 17-year-old Korean girl, bishoujo, shoulder-length light brown hair half-up with dark red hair tie, round thin-rimmed glasses, soft round eyes, navy blazer` |
| 수위 이봉구 | `bald Korean man around 60, gaunt face, grey-green security guard uniform, flashlight and metal baseball bat, blank possessed eyes, menacing` |
| 한나영(목매단 귀신) | `ghost of a Korean schoolgirl, grey-blue skin, very long black hair covering the face, tattered school uniform` |

## 초상화 파일 목록 (스타일 블록 + 인물 고정 묘사 + 표정)

| 파일명 | 표정 | 표정 프롬프트 | 쓰이는 장면(예) |
|---|---|---|---|
| `portrait_heemin` | 기본 | `calm, slightly nervous gentle expression` | 기본 |
| `portrait_heemin_surprised` | 놀람 | `surprised, eyes wide, mouth slightly open` | 현관문이 잠겼을 때, 소영과 마주침 |
| `portrait_heemin_scared` | 겁먹음 | `frightened, pale, sweat drop, eyes trembling` | 전화벨, 수위 등장 |
| `portrait_heemin_serious` | 결심 | `determined serious look, brows lowered, fist clenched` | 소영 납치 직후 |
| `portrait_soyoung` | 기본 | `calm guarded cold stare, lips closed` | 기본 |
| `portrait_soyoung_surprised` | 놀람 | `startled, eyes wide, hand half raised` | 다이어리·사탕, 귀목 |
| `portrait_soyoung_sad` | 슬픔 | `looking slightly away, eyes glistening with tears` | 언니 이야기 |
| `portrait_soyoung_smile` | 미소 | `faint shy smile, softened eyes, slight blush` | 구해 준 뒤 감사 |
| `portrait_soyoung_angry` | 차가움 | `cold annoyed glare, brows furrowed` | "내가 먼저 물었어" |
| `portrait_seonga` | 기본 | `confident cheerful look, hands in blazer pockets` | 기본 |
| `portrait_seonga_smile` | 웃음 | `bright bold grin, one eye closed` | 인사 |
| `portrait_seonga_smirk` | 비웃음 | `sly smirk, eyes narrowed, faint unnatural shadow behind her` | 수상한 대사 |
| `portrait_seonga_angry` | 짜증 | `irritated pout, arms crossed` | "흥" |
| `portrait_seonga_surprised` | 놀람 | `startled, turning head toward a sound` | 경보, 방송실 소리 |
| `portrait_jihyeon` | 기본 | `timid small smile, clutching bag strap` | 기본 |
| `portrait_jihyeon_scared` | 겁먹음 | `frightened, teary eyes, leaning forward urgently` | 구출, 수위 설명 |
| `portrait_jihyeon_smile` | 안도 | `relieved warm smile, hand on chest` | "휴우", 재회 |
| `portrait_jihyeon_sad` | 슬픔 | `worried sad look, eyes downcast` | 성아와 다툼 |
| `portrait_janitor` | 기본 | `flashlight beam under chin lighting the face from below, expressionless` | (예비) |

## 타이틀·이벤트 CG (세로 9:16, 1080×1920 권장)

CG는 배경이 있는 한 장짜리 그림입니다(투명 불필요). 인물이 나오면 위 **인물 고정 묘사**를 함께 붙이세요.

```
2D anime illustration, visual novel event CG, Korean horror, 2001 Seoul high school at night,
cinematic low-key lighting, deep black and blood-red accents with cold blue moonlight,
clean cel shading, subtle film grain, no text, no watermark, no logo
```

| 파일명 | 나오는 장면 | 프롬프트(CG 스타일 블록 + 아래) |
|---|---|---|
| `title_keyart` | 타이틀 배경 | `vertical key art, old Korean high school building at night seen from the front gate, one lit window on the second floor, silhouette of a long-haired girl in the window, bare trees, empty schoolyard` |
| `cg_prologue` | 오프닝(카드 직후) | `vertical shot, boy in navy school uniform holding a pink diary and a ribboned candy box, standing in a dark school lobby, glass doors behind him just slammed shut, moonlight on terrazzo floor` |
| `cg_sigil_metal` | 기계실습실 金 문양 | `vertical top-down view of a workshop floor, glowing golden pentagram circle with the Chinese character 金 carved in the center, red alarm light, old lathes in shadow` |
| `cg_janitor` | 수위 첫 등장 | `vertical, long dark school corridor, a limping bald security guard approaching from the far end, flashlight beam pointed at the viewer, baseball bat dragging on the floor, 'quiet' sign on the wall` |
| `cg_hanging` | 강당 통로 목매단 귀신 | `vertical, narrow concrete corridor corner, a schoolgirl hanging from the ceiling by a rope, long black hair covering her face, slowly turning her head toward the viewer, faint blue light` |
| `cg_tree` | 소영 납치(귀목) | `vertical, classroom floor bursting open, black twisted tree roots wrapping around a long-haired schoolgirl's ankles and dragging her into darkness, scattered desks, red glow` |
| `cg_recording` | B루트 녹음실 | `vertical, view through the glass window of a small broadcast recording booth, a ghost girl hanging inside looking down at the viewer, reflection of a long-haired schoolgirl on the glass` |
| `cg_seal` | 1장 끝 결계문 | `vertical, old wooden double door in a school corridor glowing with a faint teal light from a carved Chinese character 木, door creaking open into a long dark hallway` |

## 영상(선택)

힉스필드 영상 생성으로 위 CG를 2~4초 루프 영상으로 만들 수도 있지만, 현재 엔진은 **정지 이미지 슬롯만** 지원합니다.
영상 슬롯이 필요하면 말씀 주세요(파일 크기·모바일 자동재생 제약 확인 후 추가).
