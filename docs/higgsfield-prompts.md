# 힉스필드(Higgsfield) 작업 시트 — 1장

게임 안의 **스프라이트(타일·소품·캐릭터 걷기 프레임·아이템)는 Blender로 렌더**하고,
**대화창 초상화·타이틀 키아트·이벤트 CG는 힉스필드로 생성**해 슬롯에 넣는 구조입니다.
힉스필드 결과물이 없으면 초상화는 Blender 렌더 초상화로 대체되고, CG는 건너뜁니다(게임은 그대로 진행).

## 넣는 방법

1. 아래 표의 **파일명** 그대로 저장 (`.png`, `.jpg`, `.webp` 중 아무거나)
2. `assets/hf/` 폴더에 넣기
3. `python3 tools/build_sprites.py` 실행 → `assets/hf/manifest.json`에 등록되어 자동 적용

## 공통 스타일 블록 (모든 프롬프트 앞에 붙이기)

> 캐릭터·톤 일관성을 위해 같은 문장을 그대로 반복해서 씁니다. 첫 결과물 중 마음에 드는 초상화를 레퍼런스 이미지로 고정해 두고 나머지를 생성하는 것을 권장합니다.

```
Korean horror adventure game art, 2001 Seoul high school at night, cinematic low-key lighting,
cold moonlight blue and sodium-yellow accents, film grain, semi-realistic anime illustration,
muted desaturated palette, subtle analog noise, no text, no watermark, no logo
```

**공통 네거티브**: `text, letters, watermark, logo, signature, extra fingers, deformed hands, gore, nudity, bright daylight, chibi, 3d render`

## 인물 고정 묘사 (Blender 스프라이트와 맞춤)

| 인물 | 고정 묘사 (영문) |
|---|---|
| 이희민 | `17-year-old Korean boy, short straight black hair, shy quiet expression, navy school blazer, white shirt, dark red tie, grey trousers` |
| 한소영 | `17-year-old Korean girl, waist-length straight black hair with straight bangs, pale skin, calm cold expression, navy school blazer, red ribbon, grey pleated skirt` |
| 김성아 | `17-year-old Korean girl, chin-length dark brown bob with side-swept fringe, small yellow hairpin, confident teasing smile, navy blazer worn open over white shirt` |
| 설지현 | `17-year-old Korean girl, shoulder-length light brown hair half-up with dark red hair tie, round thin-rimmed glasses, timid nervous expression, navy blazer` |
| 수위 이봉구 | `bald Korean man around 60, gaunt face, grey-green security guard uniform, holding a flashlight and a metal baseball bat, blank possessed eyes` |
| 한나영(목매단 귀신) | `ghost of a Korean schoolgirl, grey-blue skin, very long black hair covering the face, tattered school uniform, barefoot` |

## 초상화 (대화창, 세로 4:5, 1024×1280 권장, 배경 투명 또는 단색 어두운 배경)

허리 위 상반신, 정면에 가깝게, 인물이 화면 아래쪽 2/3를 채우도록.

| 파일명 | 표정 | 프롬프트(스타일 블록 + 인물 고정 묘사 + 아래) |
|---|---|---|
| `portrait_heemin` | 기본 | `waist-up portrait, facing viewer, nervous but determined, dark empty classroom behind, rim light from window` |
| `portrait_soyoung` | 기본 | `waist-up portrait, facing viewer, calm guarded stare, dark corridor behind, moonlight on one side of face` |
| `portrait_soyoung_surprised` | 놀람 | `waist-up portrait, startled, eyes wide, hand half raised, debris and dark roots blurred behind` |
| `portrait_soyoung_sad` | 슬픔 | `waist-up portrait, looking slightly away, eyes glistening, whispering, cold blue light` |
| `portrait_seonga` | 기본 | `waist-up portrait, facing viewer, cheerful bold grin, hands in blazer pockets` |
| `portrait_seonga_smirk` | 비웃음 | `waist-up portrait, sly smirk, eyes narrowed, faint unnatural shadow behind her` |
| `portrait_jihyeon` | 기본 | `waist-up portrait, facing viewer, timid small smile, clutching bag strap` |
| `portrait_jihyeon_scared` | 겁먹음 | `waist-up portrait, frightened, leaning forward urgently, reaching out a hand` |
| `portrait_janitor` | 기본 | `waist-up portrait, flashlight beam under chin lighting the face from below, expressionless` |

## 타이틀·이벤트 CG (세로 9:16, 1080×1920 권장)

| 파일명 | 나오는 장면 | 프롬프트(스타일 블록 + 아래) |
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
