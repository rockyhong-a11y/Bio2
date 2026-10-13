# 힉스필드(Higgsfield) 작업 시트 — 1장 2D 초상화·CG

## 한눈에

- 힉스필드 웹사이트에서 직접 그림을 만들어 보내 주실 때 보는 시트입니다. 프롬프트(영어)는 회색 상자마다 **완성된 한 덩어리**라서 통째로 복사해 붙여 넣으면 됩니다. 이어 붙이거나 고칠 필요가 없습니다. 비율은 화면의 비율 설정에서만 고르고, 프롬프트에는 비율 숫자를 넣지 않았으니 비율을 바꿔도 프롬프트는 그대로 씁니다.
- **만들 것: 필수 26장** = 대사창 초상화 18장 + 타이틀·이벤트 CG 8장
  - `portrait_janitor`(수위)는 **선택**입니다. 1장에서 수위는 대사가 없어서 게임에 나오지 않습니다.
  - 그 밖에 **캐릭터 기준 시트 4장**을 먼저 만듭니다. 게임에는 들어가지 않는 작업용(얼굴 고정용) 그림입니다.
- **순서(중요한 것부터)**
  1. 기준 시트 4장 (희민 → 소영·성아·지현)
  2. **기본 초상화 4장**: `portrait_heemin`, `portrait_soyoung`, `portrait_seonga`, `portrait_jihyeon`
     - 게임은 표정 그림이 없으면 그 인물의 기본 초상화를 대신 보여 주고, 기본도 없으면 기존 3D 초상화를 보여 줍니다. 그래서 기본 4장만 있어도 모든 대사가 2D로 나옵니다.
  3. 표정 초상화 14장
  4. 타이틀·CG 8장
- **보내는 방법**
  - 채팅에 그대로 올리거나, 저장소의 `assets/hf/` 폴더에 넣어 주세요.
  - **파일 이름 = 아래 슬롯 이름 그대로** (예: `portrait_soyoung_smile.png`). 확장자는 `.png` `.jpg` `.webp` 중 아무거나 되지만 **PNG를 권장**합니다(JPG는 초록 배경 경계가 지저분해집니다).
  - **채팅으로 보낼 때는 이미지마다 메시지에 슬롯 이름을 함께 적어 주세요**(예: "portrait_seonga_smirk"). 채팅에 붙여 넣으면 파일 이름이 사라질 수 있습니다. 한 메시지에 여러 장이면 순서대로 이름을 적어 주세요.
  - 크기를 줄이거나 배경을 지우지 말고 **원본 그대로** 보내 주세요. 초상화는 초록 배경 그대로가 원칙입니다(4단계 참고).
  - **원본 파일은 본인 컴퓨터에도 꼭 보관해 주세요.** 게임용으로 변환할 때 저장소 안의 원본은 WebP로 바뀝니다.
  - 그다음은 개발자가 처리합니다: 초록 배경 제거 → 크기 조정·WebP 변환 → 게임에 등록 → 자동 검사와 게임 화면에서 확인 (문서 끝 '개발자용' 참고).
- **나이 설정**: 원작·게임과 같이 연두고등학교 2학년(고등학생)으로 적었습니다. 학생은 미성년자이므로 단정한 교복과 평범한 자세로만 그립니다.
- **프롬프트 속 인물 이름**: 영어 프롬프트에는 원작 인물 이름 대신 역할 이름(주인공 소년, 긴 생머리 소녀, 금색 머리핀의 단발 소녀, 둥근 안경 소녀, 야간 수위, 귀신 소녀)을 씁니다. 그림이 원작 공식 그림 쪽으로 쏠리거나 명찰에 이름이 적히는 것을 막기 위해서입니다. 한국어 제목과 설명에는 이름을 그대로 적었습니다.

### 슬롯 이름 목록 (27개, ★ = 먼저)

| 구분 | 파일 이름 |
|---|---|
| ★ 기본 초상화 | `portrait_heemin` `portrait_soyoung` `portrait_seonga` `portrait_jihyeon` |
| 희민 표정 | `portrait_heemin_surprised` `portrait_heemin_scared` `portrait_heemin_serious` |
| 소영 표정 | `portrait_soyoung_surprised` `portrait_soyoung_sad` `portrait_soyoung_smile` `portrait_soyoung_angry` |
| 성아 표정 | `portrait_seonga_smile` `portrait_seonga_smirk` `portrait_seonga_angry` `portrait_seonga_surprised` |
| 지현 표정 | `portrait_jihyeon_scared` `portrait_jihyeon_smile` `portrait_jihyeon_sad` |
| 타이틀·CG | `title_keyart` `cg_prologue` `cg_sigil_metal` `cg_janitor` `cg_hanging` `cg_tree` `cg_recording` `cg_seal` |
| 선택 | `portrait_janitor` |

## 그림 규칙 요약

- **그림체**: 2D 애니메이션 비주얼노벨풍 미소녀·미소년, 깔끔한 선, 셀 채색. 실사나 3D는 안 됩니다.
- **학생 묘사**: 2001년 3월 한국 고등학교의 단정한 겨울 교복(남색 블레이저)을 입힙니다. 노출이나 선정적인 자세는 넣지 않습니다. 일본식 세일러복이 나오면 다시 만듭니다.
- **초상화**
  - 세로 2:3, 허리 위 상반신으로 잡고, 허리 아래는 그림 아래쪽에서 잘리게 합니다.
  - 몸은 **그림 왼쪽**(게임 화면의 가운데 쪽)으로 살짝 돌립니다. 게임에서 초상화가 화면 오른쪽 끝에 붙기 때문입니다.
  - 배경은 **단색 초록 #00FF00**으로 하고, 인물에는 초록을 쓰지 않습니다. 인물 가장자리의 초록 반사광(림라이트)도 넣지 않습니다.
  - 글자는 넣지 않습니다. 명찰도 흰색 무지로 둡니다.
  - 흩날리는 잔머리, 빛 번짐, 연기, 반짝이, 그리고 머리 주변에 떠 있는 **땀방울·분노 마크·느낌표·효과선 같은 만화 기호**는 넣지 않습니다. 게임이 투명한 가장자리마다 빨간 외곽선을 그려서, 이런 것들이 빨간 얼룩으로 보입니다.
  - 대화창이 그림 아래쪽 약 7~9%를 가립니다. 손은 그보다 위에 둡니다.
- **표정끼리 똑같이**: 같은 사람이 이어서 말하면 게임은 애니메이션 없이 그림만 바로 바꿉니다. 그래서 한 인물의 표정 그림들은 머리 위치·크기, 옷, 몸 각도가 모두 같아야 화면이 튀지 않습니다. 표정 그림에서는 **머리·목·어깨는 그대로 두고 얼굴과 손만** 바꿉니다.
- **CG**
  - 이벤트 CG 7장은 **세로 2:3**, `title_keyart`만 **세로 9:16**으로 만듭니다. 글자는 넣지 않습니다. 金·木 한 글자만 예외입니다.
  - 게임에서 폭 약 350px로 작게 보이므로 큰 주제 하나와 강한 명암으로 잡고, 가장자리는 어둡게 둡니다.
  - 공포는 으스스하게 표현하고 잔인하게 그리지 않습니다.
- **타이틀**
  - 게임이 화면 세로 약 28~72% 구간에 제목과 버튼을 겹쳐 그립니다. 이 띠는 어둡고 단순하게 둡니다.
  - 긴 휴대폰에서는 양옆이 약 10%씩 잘리므로 중요한 것은 가운데 80% 폭 안에 둡니다.

## 힉스필드 작업 순서

> 개발 환경에서는 힉스필드 사이트에 직접 접속할 수 없었습니다. 그래서 공식 도움말·변경 기록·공식 CLI 문서를 검색해 확인한 내용으로 작성했습니다(2026-10-13 기준). 메뉴 이름이 조금 다를 수 있습니다.

### 0단계: 모델 고르기 (처음 한 번)

1. 이미지(Image) 생성 화면의 모델 선택에서 아래 순서로 **보이는 것 하나**를 고릅니다. 그리고 **26장 모두 같은 모델**로 만듭니다. 모델마다 그림체가 달라 섞이면 티가 납니다. 차단될 때도 초상화는 모델을 바꾸지 않습니다(6단계).
   1. **Nano Banana 2.1** 또는 **Nano Banana Pro**: 레퍼런스 이미지를 여러 장(최대 14장) 붙일 수 있고, 2:3·9:16 비율과 2K 출력, 문장으로 고치기·부분 수정을 지원합니다.
   2. 없으면 **Nano Banana 2** (이름에 **Lite**가 붙은 것은 고르지 마세요)
   3. 그것도 없으면 **GPT Image 2.5**: 레퍼런스 최대 16장, 2:3·9:16을 지원합니다.
   4. 그것도 없으면 **Seedream**(5.0 Pro 또는 4.5): 애니 셀 채색에 강합니다. 2:3 비율이 없으면 **3:4**로 만들어도 됩니다.
2. **쓰지 말 것**
   - **Soul ID**: 실제 인물 사진 20장 이상으로 학습하는 실사 전용 기능이라 만화 캐릭터에는 맞지 않습니다.
   - **Soul Cast**: 가로 16:9 전용인 실사 배우 기능입니다.
   - **Soul 2.0**: 레퍼런스 이미지를 붙이면 프롬프트 칸이 꺼집니다. 그래서 '같은 인물, 표정만 다르게'를 할 수 없습니다.
   - **Nano Banana 2 Lite**(이름에 Lite가 붙은 모델): 1K 전용이라 해상도 선택이 없고, 게임에 쓰기에는 해상도가 모자랍니다.
3. **해상도**: 해상도 선택이 있으면 2K를 고릅니다. 4K는 필요 없습니다.
4. **네거티브(제외) 프롬프트 칸**: 공식 문서에는 없습니다. 각 프롬프트 안에 제외 문구가 이미 들어 있으니 그대로 쓰시면 됩니다. 칸이 보이면 문서 끝의 공통 네거티브 블록을 넣어 주세요(1단계 기준 시트에는 넣지 않습니다).
5. **여러 장 뽑기**: 한 번에 여러 장 만드는 옵션이 보이면 2~4장으로 설정합니다. 없으면 Generate를 여러 번 눌러 그중 가장 좋은 것을 고릅니다.
6. **프롬프트 길이**: 인물 묘사를 빠짐없이 넣느라 프롬프트가 깁니다(약 1,400~3,200자, 표정 초상화의 짧은 판은 약 500~800자). 입력칸이 뒤를 잘라도 중요한 내용이 남도록 **구도·초록 배경·표정이나 장면을 앞에, 그림체와 인물 묘사를 뒤에** 두었습니다.
   - 붙여 넣은 뒤 **입력칸 맨 끝이 `No film grain.`으로 끝나는지** 확인하세요. 안 보이면 잘린 것입니다.
   - 잘렸다면 표정 초상화는 **짧은 판**을 씁니다. 다른 그림은 레퍼런스를 붙였다면 대개 그대로 써도 되지만, 결과가 이상하면 슬롯 이름을 알려 주세요. 짧은 판을 드립니다.

### 1단계: 캐릭터 기준 시트 4장 (얼굴 고정의 핵심)

- 인물마다 '전신 정면 + 상반신' 두 모습이 한 장에 들어간 기준 시트를 먼저 만듭니다. 이후 모든 그림은 이 시트를 레퍼런스로 붙여서 만듭니다.
- **희민 시트**는 레퍼런스 없이 만듭니다. 마음에 들 때까지 뽑은 뒤 다운로드합니다.
- **소영·성아·지현 시트**는 희민 시트를 **레퍼런스 1**로 붙여 만듭니다. 그림체와 남색 블레이저를 맞추기 위해서이고, 얼굴·머리·넥타이·바지는 따라 하지 말라는 문장이 프롬프트에 들어 있습니다.
- 다 만들면 네 장을 나란히 놓고 한 게임의 그림처럼 보이는지 확인합니다.
- 비율은 3:2(없으면 4:3)입니다.
- 네거티브 칸이 보여도 1단계에는 네거티브 블록을 넣지 마세요.
- 저장 이름은 자유입니다(예: `sheet_heemin.png`). 다음 장 작업에도 쓰도록 채팅으로 보내 주셔도 좋습니다. 다만 `assets/hf/` 폴더에는 넣지 마세요. 게임 슬롯 이름이 아니라서 자동 검사가 실패합니다.

### 2단계: 기본 초상화 4장 (가장 중요)

- 비율은 **2:3**(없으면 3:4)이고, 해상도 선택이 있으면 2K입니다.
- **레퍼런스 1** = 그 인물의 기준 시트를 붙입니다. 시트에는 두 모습이 들어 있지만, 프롬프트에 '한 모습만, 허리 위로만' 그리라는 문장이 들어 있습니다.
- 결과를 확인합니다.
  - 시트와 같은 얼굴·머리·교복인가요?
  - 인물이 한 명, 한 모습만 있나요? 시트처럼 두 모습이 나오면 다시 만듭니다.
  - 몸이 그림 왼쪽으로 살짝 돌아 있나요?
  - 배경이 균일한 초록이고 네 모서리까지 초록인가요? 머리 주변에 만화 기호가 떠 있지 않나요?
- 고른 기본 초상화는 이후 표정 그림들의 **원본**이 됩니다.

### 3단계: 표정 초상화 14장

- **레퍼런스 1** = 그 인물의 기본 초상화(필수)를 붙입니다.
- 슬롯마다 프롬프트가 두 개 있습니다. **짧은 판을 먼저** 쓰고, **긴 판**은 얼굴이 자꾸 다른 사람처럼 바뀔 때 씁니다. 긴 판에는 **레퍼런스 2**로 기준 시트를 붙여도 됩니다. 레퍼런스는 1~2장으로 시작하는 것이 좋습니다.
- 표정과 작은 손짓만 바뀌고 머리·목·어깨는 그대로여야 합니다. 얼굴이나 옷, 머리 위치가 달라지면 이렇게 해 보세요.
  - 편집(Edit)에 **부분 수정(Inpaint)** 도구가 있으면(예: Nano Banana Pro Inpaint), 기본 초상화를 열어 **얼굴만**(손짓이 있는 표정은 손도) 칠하고 그 슬롯의 **짧은 판**을 넣습니다. 긴 판은 넣지 않습니다.
  - 부분 수정이 없으면, 기본 초상화(또는 가장 가까운 결과)에 대고 문장으로 고치는 편집(Nano Banana 2.1/2, GPT Image 2.5 등 보이는 것)에 같은 **짧은 판**을 넣습니다.
  - 그래도 얼굴이 달라지면 **긴 판**에 레퍼런스 1(과 선택으로 레퍼런스 2 기준 시트)을 붙여 새로 만듭니다.
  - 다시 만들 때는 **프롬프트와 레퍼런스 중 하나만** 바꿔 가며 시도합니다.
- 다 만들면 기본 초상화와 번갈아 넘겨 보면서 머리 위치와 크기가 튀지 않는지 확인합니다.

### 4단계: 초상화 배경 처리

- **초상화는 직접 배경을 지우지 말고 초록 배경 원본을 보내 주세요.** 개발자 도구가 초록 배경과 머리카락 가장자리의 초록 번짐을 함께 지웁니다.
- 다른 도구(힉스필드의 Image Background Remover 앱, GPT Image의 '투명 배경(transparent)' 옵션 등)로 먼저 지우면 이 번짐 제거 단계를 건너뛰어, 가장자리에 초록 테두리가 남습니다. 투명 배경 옵션이 보여도 켜지 마세요.
- 이미 투명하게 만든 파일이 있다면, 같은 그림의 초록 배경 원본도 함께 보내 주세요.
- **초록 배경 위에 그림자나 그라데이션이 생긴 것**은 다시 만들어 주세요.

### 5단계: 타이틀·CG 8장

- 비율은 이벤트 CG 7장은 **2:3**(없으면 9:16), `title_keyart`만 **9:16**입니다. 해상도 선택이 있으면 2K입니다.
- **모든 CG에 레퍼런스 1**을 붙입니다.
  - 인물이 나오는 CG(`cg_prologue`, `cg_sigil_metal`, `cg_tree`)는 그 인물의 기준 시트를 붙입니다.
  - 나머지(`title_keyart`, `cg_janitor`, `cg_hanging`, `cg_recording`, `cg_seal`)는 희민 기준 시트를 **그림체 맞추기용으로만** 붙입니다. 그 인물은 그리지 말라는 문장이 프롬프트에 들어 있습니다.
- `cg_recording`은 먼저 만든 `cg_hanging`을 **레퍼런스 2**로 붙이면 귀신의 모습이 맞춰집니다(선택). 차단되면 레퍼런스 2를 빼고 다시 시도하세요.
- `cg_hanging`, `cg_recording`, `cg_tree`는 바로 아래에 **차단되면 쓰는 순화판**이 있습니다.
- 휴대폰 화면에서 작게 봐도 무엇인지 바로 읽히는지 확인합니다.
- 金·木이 정확한 한자로 그려졌는지 확인합니다. 틀리면 다시 만들거나 그대로 보내 주세요(개발자가 보정).

### 6단계: 차단(NSFW 판정)될 때

- 힉스필드 자체 검사와 모델 제공사의 검사가 함께 걸립니다.
- 힉스필드 약관은 실사든 합성이든 **미성년자를 부적절하게 묘사하는 것을 금지**합니다. 그래서 프롬프트는 이미 단정한 교복과 평범한 자세로만 썼습니다.
- 차단 가능성이 가장 높은 것은 `cg_hanging`, `cg_recording`(매달린 귀신)과 `cg_tree`(뿌리에 붙잡힌 소영)입니다.
- 차단되면 다음 순서로 해 주세요. **같은 프롬프트를 이 모델 저 모델에 반복해서 넣지 마세요.**
  1. **같은 모델**에서, 그 CG 바로 아래의 '차단되면 이 문장으로' 순화판으로 한 번 시도합니다. 다른 CG를 레퍼런스로 붙였다면 빼고 시도합니다. 초상화가 막히면 같은 모델에서 한 번 더 시도합니다.
  2. 그래도 막히면 **CG에 한해** 다른 모델에서 순화판으로 한 번 시도합니다. 초상화는 모델을 바꾸지 마세요(표정끼리 그림체가 달라집니다).
  3. 그래도 안 되면 **슬롯 이름만 알려 주세요**.
- 검사를 우회하려는 시도는 약관 위반이니 하지 마세요.

### 7단계: 다운로드·전달

- 결과는 **다운로드 기능으로 원본**을 저장합니다. 화면 캡처는 화질이 떨어지니 쓰지 마세요.
- PNG로 받을 수 있으면 PNG로 받습니다.
- 파일 이름을 슬롯 이름으로 바꿉니다. 소문자, 밑줄 그대로 쓰고 공백이나 `(1)` 같은 것이 붙지 않게 합니다.
- 채팅에 올리거나 `assets/hf/`에 넣습니다. 채팅으로 보낼 때는 이미지마다 메시지에 슬롯 이름을 적어 주세요(여러 장이면 순서대로).
- 원본 파일은 본인 컴퓨터에도 보관해 주세요.

## 1단계 프롬프트: 캐릭터 기준 시트 (보관용, 게임 슬롯 아님)

### 기준 시트: 희민 (`sheet_heemin`)

- 비율 3:2 (없으면 4:3) · 레퍼런스: 없음 (첫 장)

```text
Character reference sheet of one character in one image on a landscape canvas: on the left a full-body front view standing straight with relaxed arms, on the right a waist-up view turned slightly toward the image's left, the same character with the same outfit and proportions in both views, calm neutral expression and relaxed standing posture. Flat, evenly lit, pure chroma green #00FF00 background. Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no labels, no color swatches, no logo, no watermark, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The protagonist boy: a Korean high-school second-year student, a soft-featured boy with a quiet, ordinary, understated air; short straight jet-black hair with slightly choppy, uneven bangs just above the eyebrows, ears visible, neat short back and sides; dark brown eyes; light warm skin; average build; Korean winter school uniform: navy blue single-breasted blazer with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared dress shirt, dark burgundy necktie. Below the waist: charcoal-grey slacks, dark brown leather shoes. No film grain.
```

### 기준 시트: 소영 (`sheet_soyoung`)

- 비율 3:2 (없으면 4:3) · 레퍼런스 1: 희민 시트 (그림체·블레이저만)

```text
Reference image 1 is another character's sheet: use it only for art style, line weight, coloring and the shared navy blazer with brass buttons and plain white name tag; do not copy that character's face, hair, necktie or slacks. Character reference sheet of one character in one image on a landscape canvas: on the left a full-body front view standing straight with relaxed arms, on the right a waist-up view turned slightly toward the image's left, the same character with the same outfit and proportions in both views, calm neutral expression and relaxed standing posture. Flat, evenly lit, pure chroma green #00FF00 background. Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no labels, no color swatches, no logo, no watermark, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The long-haired girl: a Korean high-school second-year student, a quiet girl with a cool, mysterious presence; very long, perfectly straight blue-black hair falling to the waist, blunt straight-cut bangs at eyebrow level, face-framing side locks cut at shoulder length (hime cut), no hair accessories; pale porcelain skin; dark eyes; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. Below the waist: modest knee-length navy-and-grey plaid pleated skirt, short white socks, dark brown loafers. No film grain.
```

### 기준 시트: 성아 (`sheet_seonga`)

- 비율 3:2 (없으면 4:3) · 레퍼런스 1: 희민 시트 (그림체·블레이저만)

```text
Reference image 1 is another character's sheet: use it only for art style, line weight, coloring and the shared navy blazer with brass buttons and plain white name tag; do not copy that character's face, hair, necktie or slacks. Character reference sheet of one character in one image on a landscape canvas: on the left a full-body front view standing straight with relaxed arms, on the right a waist-up view turned slightly toward the image's left, the same character with the same outfit and proportions in both views, calm neutral expression and relaxed standing posture. Flat, evenly lit, pure chroma green #00FF00 background. Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no labels, no color swatches, no logo, no watermark, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The short-haired girl with the gold hair clip: a Korean high-school second-year student, a lively, tomboyish girl; short chin-length very dark chocolate-brown hair in a slightly flared short bob, asymmetric side-swept bangs falling toward her left eyebrow, the hair above her right temple pinned back with one small rectangular gold-yellow hair clip; bright dark eyes; warm, healthy, lightly tanned skin; Korean winter school uniform: navy blue blazer worn open and unbuttoned over an off-white collared blouse, red bow ribbon at the collar, a small plain white name tag pinned on the left side of the blazer front. Below the waist: modest knee-length navy-and-grey plaid pleated skirt, short white socks, dark brown loafers. No film grain.
```

### 기준 시트: 지현 (`sheet_jihyeon`)

- 비율 3:2 (없으면 4:3) · 레퍼런스 1: 희민 시트 (그림체·블레이저만)

```text
Reference image 1 is another character's sheet: use it only for art style, line weight, coloring and the shared navy blazer with brass buttons and plain white name tag; do not copy that character's face, hair, necktie or slacks. Character reference sheet of one character in one image on a landscape canvas: on the left a full-body front view standing straight with relaxed arms, on the right a waist-up view turned slightly toward the image's left, the same character with the same outfit and proportions in both views, calm neutral expression and relaxed standing posture. Flat, evenly lit, pure chroma green #00FF00 background. Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no labels, no color swatches, no logo, no watermark, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The girl with round glasses: a Korean high-school second-year student, a gentle, shy girl; shoulder-length soft chestnut-brown hair with the ends flicking slightly outward, worn half-up with the top section gathered into a small knot and short tail at the back of the head, tied with a dark wine-red hair tie, soft straight bangs; round, thin gold metal-rimmed glasses with a soft white glare on the lenses; soft round dark eyes; light warm peach skin; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. Below the waist: modest knee-length navy-and-grey plaid pleated skirt, short white socks, dark brown loafers. No film grain.
```

## 2단계 프롬프트: 기본 초상화 4장 (★ 가장 먼저)

공통 사항: 비율 **2:3**(없으면 3:4) · 해상도 선택이 있으면 2K · 레퍼런스 1 = 그 인물의 기준 시트

### `portrait_heemin`

- 용도: 희민의 **기본** 얼굴. 독백과 대부분의 대사("이희민. 얼마 전에 전학 왔어." 등)에 씁니다.
- 비율 2:3 · 레퍼런스 1: 기준 시트(희민)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's two-view reference sheet: match the face, hair, outfit and art style exactly, but take only the identity from it, not its layout; draw ONE single waist-up view only, not the sheet's two-view layout or its full-body pose. Expression: calm, earnest and quietly tense; soft neutral closed mouth; calm, gentle dark eyes looking at the viewer; brows relaxed with a faint hint of worry at the inner ends; reserved and ordinary, not smug, not flashy; arms relaxed at his sides. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The protagonist boy: a Korean high-school second-year student, a soft-featured boy with a quiet, ordinary, understated air; short straight jet-black hair with slightly choppy, uneven bangs just above the eyebrows, ears visible, neat short back and sides; dark brown eyes; light warm skin; average build; Korean winter school uniform: navy blue single-breasted blazer with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared dress shirt, dark burgundy necktie. No film grain.
```

### `portrait_soyoung`

- 용도: 소영의 **기본** 얼굴. 경고·다섯 개의 패 설명·동행("…거기서 뭐 하는 거야?").
- 비율 2:3 · 레퍼런스 1: 기준 시트(소영)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's two-view reference sheet: match the face, hair, outfit and art style exactly, but take only the identity from it, not its layout; draw ONE single waist-up view only, not the sheet's two-view layout or its full-body pose. Expression: cool composure; calm, level, guarded gaze at the viewer; upright, still posture; lips closed, neutral brows, a faint distance as if she knows more than she says; polite but guarded and mysterious; no smile, no blush; arms relaxed. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The long-haired girl: a Korean high-school second-year student, a quiet girl with a cool, mysterious presence; very long, perfectly straight blue-black hair falling to the waist, blunt straight-cut bangs at eyebrow level, face-framing side locks cut at shoulder length (hime cut), no hair accessories; pale porcelain skin; dark eyes; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. No film grain.
```

### `portrait_seonga`

- 용도: 성아의 **기본** 얼굴. 첫 만남·열쇠 요구·은근한 경고("…조심해. 이 학교, 밤에는 좀 이상하거든.").
- 비율 2:3 · 레퍼런스 1: 기준 시트(성아)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's two-view reference sheet: match the face, hair, outfit and art style exactly, but take only the identity from it, not its layout; draw ONE single waist-up view only, not the sheet's two-view layout or its full-body pose. Expression: bold, breezy self-confidence; mischievous eyes, chin slightly raised, confident posture with relaxed shoulders; a knowing closed-mouth half-smile, direct gaze at the viewer; friendly on the surface but hard to read underneath, not a wide grin; arms relaxed. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The short-haired girl with the gold hair clip: a Korean high-school second-year student, a lively, tomboyish girl; short chin-length very dark chocolate-brown hair in a slightly flared short bob, asymmetric side-swept bangs falling toward her left eyebrow, the hair above her right temple pinned back with one small rectangular gold-yellow hair clip; bright dark eyes; warm, healthy, lightly tanned skin; Korean winter school uniform: navy blue blazer worn open and unbuttoned over an off-white collared blouse, red bow ribbon at the collar, a small plain white name tag pinned on the left side of the blazer front. No film grain.
```

### `portrait_jihyeon`

- 용도: 지현의 **기본** 얼굴(웃지 않음). 화장실 부탁, 수위 설명, 숨어 있을 때.
- 비율 2:3 · 레퍼런스 1: 기준 시트(지현)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's two-view reference sheet: match the face, hair, outfit and art style exactly, but take only the identity from it, not its layout; draw ONE single waist-up view only, not the sheet's two-view layout or its full-body pose. Expression: timid and uneasy; slightly hunched, timid posture, head slightly lowered, eyes looking up shyly at the viewer through her glasses, brows tilted up at the inner ends, small closed mouth, hands clasped together in front of her, fully inside the frame; soft-spoken and a little embarrassed, not smiling. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The girl with round glasses: a Korean high-school second-year student, a gentle, shy girl; shoulder-length soft chestnut-brown hair with the ends flicking slightly outward, worn half-up with the top section gathered into a small knot and short tail at the back of the head, tied with a dark wine-red hair tie, soft straight bangs; round, thin gold metal-rimmed glasses with a soft white glare on the lenses; soft round dark eyes; light warm peach skin; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. No film grain.
```

## 3단계 프롬프트: 표정 초상화 14장

공통 사항: 비율 **2:3**(없으면 3:4) · 해상도 선택이 있으면 2K · 레퍼런스 1 = 그 인물의 **기본 초상화**(필수), 레퍼런스 2 = 기준 시트(긴 판에서 선택). **짧은 판**은 새로 만들 때, 부분 수정(Inpaint)할 때, 문장으로 고칠 때 모두 그대로 씁니다.

### 희민

#### `portrait_heemin_surprised`

- 용도: 현관문이 잠겼을 때("…잠겼어?"), 밤 교실에서 소영과 마주쳤을 때, 귀신이 소영의 언니임을 알았을 때.
- 비율 2:3 · 레퍼런스 1: `portrait_heemin`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: startled disbelief; eyes widened with small pupils, eyebrows jumping up high, mouth slightly open mid-word; shock mixed with confusion, not comedic. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: startled disbelief; eyes widened with small pupils, eyebrows jumping up high, mouth slightly open mid-word; shock mixed with confusion, not comedic. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The protagonist boy: a Korean high-school second-year student, a soft-featured boy with a quiet, ordinary, understated air; short straight jet-black hair with slightly choppy, uneven bangs just above the eyebrows, ears visible, neat short back and sides; dark brown eyes; light warm skin; average build; Korean winter school uniform: navy blue single-breasted blazer with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared dress shirt, dark burgundy necktie. No film grain.
```

#### `portrait_heemin_scared`

- 용도: 밤중의 전화벨("(…누가 이 시간에?)")과 방망이 든 수위의 첫 등장. 속으로 삼키는 공포.
- 비율 2:3 · 레퍼런스 1: `portrait_heemin`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: quiet, silent fear; face slightly pale, wide trembling eyes with shrunken pupils, brows pinched upward in the middle, lips parted on a held breath, a faint sheen of cold sweat on his forehead, painted inside the face; hushed terror, not screaming. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: quiet, silent fear; face slightly pale, wide trembling eyes with shrunken pupils, brows pinched upward in the middle, lips parted on a held breath, a faint sheen of cold sweat on his forehead, painted inside the face; hushed terror, not screaming. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The protagonist boy: a Korean high-school second-year student, a soft-featured boy with a quiet, ordinary, understated air; short straight jet-black hair with slightly choppy, uneven bangs just above the eyebrows, ears visible, neat short back and sides; dark brown eyes; light warm skin; average build; Korean winter school uniform: navy blue single-breasted blazer with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared dress shirt, dark burgundy necktie. No film grain.
```

#### `portrait_heemin_serious`

- 용도: 소영이 뿌리에 끌려간 직후의 결심("(소영이가 안에 있어…! 어떻게든 해야 해.)").
- 비율 2:3 · 레퍼런스 1: `portrait_heemin`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: resolve under pressure; brows lowered and drawn together, eyes narrowed and focused toward the image's left, jaw set, mouth a firm line; one hand clenched into a fist at chest height, fully inside the frame. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: resolve under pressure; brows lowered and drawn together, eyes narrowed and focused toward the image's left, jaw set, mouth a firm line; one hand clenched into a fist at chest height, fully inside the frame. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The protagonist boy: a Korean high-school second-year student, a soft-featured boy with a quiet, ordinary, understated air; short straight jet-black hair with slightly choppy, uneven bangs just above the eyebrows, ears visible, neat short back and sides; dark brown eyes; light warm skin; average build; Korean winter school uniform: navy blue single-breasted blazer with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared dress shirt, dark burgundy necktie. No film grain.
```

### 소영

#### `portrait_soyoung_surprised`

- 용도: 다이어리·사탕 이야기("…사탕? 지금, 이런 밤에?")와 바닥이 갈라지는 순간의 "…!".
- 비율 2:3 · 레퍼런스 1: `portrait_soyoung`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: restrained but sharp alarm; eyes widened, lips parted in a small intake of breath, brows lifted, one hand half-raised in front of her, fully inside the frame; still composed, not panicked. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: restrained but sharp alarm; eyes widened, lips parted in a small intake of breath, brows lifted, one hand half-raised in front of her, fully inside the frame; still composed, not panicked. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The long-haired girl: a Korean high-school second-year student, a quiet girl with a cool, mysterious presence; very long, perfectly straight blue-black hair falling to the waist, blunt straight-cut bangs at eyebrow level, face-framing side locks cut at shoulder length (hime cut), no hair accessories; pale porcelain skin; dark eyes; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. No film grain.
```

#### `portrait_soyoung_sad`

- 용도: 언니를 알아볼 때("…언니?")와 언니 이야기를 털어놓을 때.
- 비율 2:3 · 레퍼런스 1: `portrait_soyoung`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: sorrow held in; eyes lowered toward the image's left and glistening with unshed tears, no tears falling, brows tilted up at the inner ends, lips slightly pressed; quiet grief and determination, not open crying. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: sorrow held in; eyes lowered toward the image's left and glistening with unshed tears, no tears falling, brows tilted up at the inner ends, lips slightly pressed; quiet grief and determination, not open crying. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The long-haired girl: a Korean high-school second-year student, a quiet girl with a cool, mysterious presence; very long, perfectly straight blue-black hair falling to the waist, blunt straight-cut bangs at eyebrow level, face-framing side locks cut at shoulder length (hime cut), no hair accessories; pale porcelain skin; dark eyes; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. No film grain.
```

#### `portrait_soyoung_smile`

- 용도: 구해 준 뒤의 드문 미소("…이상한 애네, 너. 그래도 고마워.").
- 비율 2:3 · 레퍼런스 1: `portrait_soyoung`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: a rare, faint, shy smile; softened eyes, mouth corners lifted only slightly, a light blush on the cheeks, her guard dropping for a moment; grateful and a little embarrassed. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: a rare, faint, shy smile; softened eyes, mouth corners lifted only slightly, a light blush on the cheeks, her guard dropping for a moment; grateful and a little embarrassed. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The long-haired girl: a Korean high-school second-year student, a quiet girl with a cool, mysterious presence; very long, perfectly straight blue-black hair falling to the waist, blunt straight-cut bangs at eyebrow level, face-framing side locks cut at shoulder length (hime cut), no hair accessories; pale porcelain skin; dark eyes; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. No film grain.
```

#### `portrait_soyoung_angry`

- 용도: 자기 자리에 있던 희민을 차갑게 추궁할 때("내가 먼저 물었어.", "거짓말이 서툴구나.").
- 비율 2:3 · 레퍼런스 1: `portrait_soyoung`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: cold displeasure, not hot anger; eyes narrowed into an icy level stare at the viewer, brows lowered, lips closed in a flat line; calm and intimidating, no shouting, no pout. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: cold displeasure, not hot anger; eyes narrowed into an icy level stare at the viewer, brows lowered, lips closed in a flat line; calm and intimidating, no shouting, no pout. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The long-haired girl: a Korean high-school second-year student, a quiet girl with a cool, mysterious presence; very long, perfectly straight blue-black hair falling to the waist, blunt straight-cut bangs at eyebrow level, face-framing side locks cut at shoulder length (hime cut), no hair accessories; pale porcelain skin; dark eyes; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. No film grain.
```

### 성아

#### `portrait_seonga_smile`

- 용도: 지현 놀리기, 열쇠 발견, "어, 전학생! 살아 있었네?".
- 비율 2:3 · 레퍼런스 1: `portrait_seonga`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: bright, cheeky grin; wide open-mouthed smile, one eye winking, energetic and playful. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: bright, cheeky grin; wide open-mouthed smile, one eye winking, energetic and playful. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The short-haired girl with the gold hair clip: a Korean high-school second-year student, a lively, tomboyish girl; short chin-length very dark chocolate-brown hair in a slightly flared short bob, asymmetric side-swept bangs falling toward her left eyebrow, the hair above her right temple pinned back with one small rectangular gold-yellow hair clip; bright dark eyes; warm, healthy, lightly tanned skin; Korean winter school uniform: navy blue blazer worn open and unbuttoned over an off-white collared blouse, red bow ribbon at the collar, a small plain white name tag pinned on the left side of the blazer front. No film grain.
```

#### `portrait_seonga_smirk`

- 용도: "수상한걸?", 도망친 이유 둘러대기, "내가 귀신이라도 되는 줄 알았어?". 속을 숨긴 비웃음.
- 비율 2:3 · 레퍼런스 1: `portrait_seonga`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: sly, teasing smirk with a hidden edge; one corner of the mouth raised, eyelids half-lowered, eyes sliding sideways toward the viewer; mocking and secretive; a cold glint in her eyes is the only eerie touch, her skin stays warm and healthy, and there is no shadow, aura or effect around her. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: sly, teasing smirk with a hidden edge; one corner of the mouth raised, eyelids half-lowered, eyes sliding sideways toward the viewer; mocking and secretive; a cold glint in her eyes is the only eerie touch, her skin stays warm and healthy, and there is no shadow, aura or effect around her. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The short-haired girl with the gold hair clip: a Korean high-school second-year student, a lively, tomboyish girl; short chin-length very dark chocolate-brown hair in a slightly flared short bob, asymmetric side-swept bangs falling toward her left eyebrow, the hair above her right temple pinned back with one small rectangular gold-yellow hair clip; bright dark eyes; warm, healthy, lightly tanned skin; Korean winter school uniform: navy blue blazer worn open and unbuttoned over an off-white collared blouse, red bow ribbon at the collar, a small plain white name tag pinned on the left side of the blazer front. No film grain.
```

#### `portrait_seonga_angry`

- 용도: 말대꾸에 토라질 때("…뭐야, 말투 하고는.", "흥. 그래, 그렇다 치자.").
- 비율 2:3 · 레퍼런스 1: `portrait_seonga`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: irritated, sulky annoyance; brows furrowed, lips pouted, eyes glaring sideways toward the image's left, arms crossed, fully inside the frame; petty irritation, not rage. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: irritated, sulky annoyance; brows furrowed, lips pouted, eyes glaring sideways toward the image's left, arms crossed, fully inside the frame; petty irritation, not rage. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The short-haired girl with the gold hair clip: a Korean high-school second-year student, a lively, tomboyish girl; short chin-length very dark chocolate-brown hair in a slightly flared short bob, asymmetric side-swept bangs falling toward her left eyebrow, the hair above her right temple pinned back with one small rectangular gold-yellow hair clip; bright dark eyes; warm, healthy, lightly tanned skin; Korean winter school uniform: navy blue blazer worn open and unbuttoned over an off-white collared blouse, red bow ribbon at the collar, a small plain white name tag pinned on the left side of the blazer front. No film grain.
```

#### `portrait_seonga_surprised`

- 용도: 경보가 울릴 때, 방송실 울음소리("…! 저 소리…"). **시선은 정면이 아니라 옆**(머리는 그대로, 눈만 옆으로).
- 비율 2:3 · 레퍼런스 1: `portrait_seonga`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: sharp startle; eyes darting toward a sound off to the image's left, looking away from the viewer, eyes wide with small pupils, mouth slightly open, body tense as if about to run; a flicker of recognition and dread, not plain fright. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: sharp startle; eyes darting toward a sound off to the image's left, looking away from the viewer, eyes wide with small pupils, mouth slightly open, body tense as if about to run; a flicker of recognition and dread, not plain fright. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The short-haired girl with the gold hair clip: a Korean high-school second-year student, a lively, tomboyish girl; short chin-length very dark chocolate-brown hair in a slightly flared short bob, asymmetric side-swept bangs falling toward her left eyebrow, the hair above her right temple pinned back with one small rectangular gold-yellow hair clip; bright dark eyes; warm, healthy, lightly tanned skin; Korean winter school uniform: navy blue blazer worn open and unbuttoned over an off-white collared blouse, red bow ribbon at the collar, a small plain white name tag pinned on the left side of the blazer front. No film grain.
```

### 지현

#### `portrait_jihyeon_scared`

- 용도: 더듬는 변명("성, 성아야…"), 성아가 뛰쳐나갈 때, 희민을 끌고 피할 때("이쪽! 빨리!").
- 비율 2:3 · 레퍼런스 1: `portrait_jihyeon`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: frightened and urgent; eyes wide and teary behind her glasses, brows sharply raised at the center, mouth open mid-stammer, one hand reaching toward the image's left, fully inside the frame; urgent energy, not cowering. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: frightened and urgent; eyes wide and teary behind her glasses, brows sharply raised at the center, mouth open mid-stammer, one hand reaching toward the image's left, fully inside the frame; urgent energy, not cowering. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The girl with round glasses: a Korean high-school second-year student, a gentle, shy girl; shoulder-length soft chestnut-brown hair with the ends flicking slightly outward, worn half-up with the top section gathered into a small knot and short tail at the back of the head, tied with a dark wine-red hair tie, soft straight bangs; round, thin gold metal-rimmed glasses with a soft white glare on the lenses; soft round dark eyes; light warm peach skin; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. No film grain.
```

#### `portrait_jihyeon_smile`

- 용도: 수위가 지나간 뒤("…갔다. 휴우.")와 희민과의 재회.
- 비율 2:3 · 레퍼런스 1: `portrait_jihyeon`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: relieved, warm smile; soft eyes slightly teary with relief, small open smile, a relieved sigh, one hand resting over her heart. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: relieved, warm smile; soft eyes slightly teary with relief, small open smile, a relieved sigh, one hand resting over her heart. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The girl with round glasses: a Korean high-school second-year student, a gentle, shy girl; shoulder-length soft chestnut-brown hair with the ends flicking slightly outward, worn half-up with the top section gathered into a small knot and short tail at the back of the head, tied with a dark wine-red hair tie, soft straight bangs; round, thin gold metal-rimmed glasses with a soft white glare on the lenses; soft round dark eyes; light warm peach skin; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. No film grain.
```

#### `portrait_jihyeon_sad`

- 용도: 성아가 소영을 험담할 때("성아야…"), "…우리도 같이 가도 돼?".
- 비율 2:3 · 레퍼런스 1: `portrait_jihyeon`

짧은 판 (먼저 이것)

```text
Same character as reference image 1 or the image being edited: same face, hair, outfit, body angle, framing, head size and position, same flat pure green #00FF00 background; the head, neck and shoulders do not move. Change only the facial expression and the small gesture: hurt, pleading sadness; eyes downcast, brows knit upward, lips pressed together, fingers fidgeting together in front of her. If an area is masked, change only inside it. One character, one view, 2D anime cel shading, modest uniform, no text, no floating emotion symbols, no shadow on the background. No film grain.
```

긴 판 (얼굴이 자꾸 달라질 때)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is this character's default portrait: keep the same face, hair, outfit, body angle, framing, head size and position, lighting and flat green background, and change only the facial expression and the small gesture described below. The head, neck and shoulders stay in exactly the same position, size and angle as in reference image 1; only the face, eyes and hands change. Reference image 2, if attached, is the character's two-view reference sheet: take only the identity from it, not its layout. Expression: hurt, pleading sadness; eyes downcast, brows knit upward, lips pressed together, fingers fidgeting together in front of her. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; the top of the plaid skirt may just show at the bottom edge; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). Fully clothed in the modest uniform as described, neutral non-suggestive pose, no revealing clothing. No text, no letters on the name tag, no logo, no watermark, no frame, no second character, no sailor collar, no Japanese seifuku. 2D anime visual-novel art style, bishoujo/bishounen character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The girl with round glasses: a Korean high-school second-year student, a gentle, shy girl; shoulder-length soft chestnut-brown hair with the ends flicking slightly outward, worn half-up with the top section gathered into a small knot and short tail at the back of the head, tied with a dark wine-red hair tie, soft straight bangs; round, thin gold metal-rimmed glasses with a soft white glare on the lenses; soft round dark eyes; light warm peach skin; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. No film grain.
```

### (선택) `portrait_janitor`

- 용도: 1장에서는 **쓰이지 않습니다**. 수위는 대사가 없습니다. 다음 장을 대비해 만들어 두거나 `cg_janitor`의 레퍼런스로 쓰고 싶을 때만 만듭니다.
- 비율 2:3 · 레퍼런스 1: 희민 기준 시트(그림체만)

```text
Single waist-up portrait of one character, one single view only (not a character sheet, no multiple views, no turnaround), vertical portrait image, on a flat, evenly lit, pure #00FF00 green background with no shadow or gradient, no text. Reference image 1 is a student character's sheet from the same game: use it only for art style, line weight and coloring; do not copy that character's face, hair or school uniform. Expression: a silent, blank, possessed stare; empty unfocused eyes, no expression, mouth shut under the grey mustache; his face lit from below by the flashlight held in his right hand at chest height, with no light beam or glow outside his figure; the bat in his left hand hangs low, mostly cut off by the bottom edge. Body turned slightly toward the image's left (three-quarter view). Top of the head about 6% below the top edge; head about one quarter of the image height; figure slightly right of center with empty space on the left and above the head; torso cut off by the bottom edge and kept within the middle 70% of the width; all four corners empty; any visible hands stay in the upper 85% of the image; legs and shoes are out of frame. Flat, evenly lit, pure chroma green #00FF00 background: no gradient, no shadow, no glow, no halo; no bright green on the character; neutral white lighting with no green rim light or green reflections on the character. Nothing is drawn outside the character's outline: no floating anime emotion symbols (no sweat drops, anger marks, exclamation or question marks, shock lines, speed lines, sparkles, flying tears). No text, no letters on the badge, no logo, no watermark, no frame, no second character. 2D anime visual-novel art style, anime visual-novel character design, clean crisp lineart, flat cel shading with soft two-tone shadows, muted natural colors, simple clumped hair shapes with few loose strands, wholesome and modest. The night security guard: a Korean man close to 60, drawn as a weathered, unglamorous man, not prettified and not youthful; bald crown with a thin band of short grey hair around the sides and back; bushy grey eyebrows, thick grey mustache, narrow droopy eyes, deep forehead wrinkles, weathered tan skin; stocky, heavy-set, slightly stooped build; olive-drab grey-green security guard uniform: long-sleeve shirt with darker olive epaulettes, cuffs and flapped chest pockets, a small gold badge on the left chest, a navy patch on the left upper sleeve, matching olive trousers, black belt with a brass buckle, a ring of keys and a whistle hanging at his belt, black shoes; a silver metal flashlight in his right hand and a silver aluminum baseball bat with a black grip in his left hand; he walks with a heavy limp, dragging a stiff right leg. No film grain.
```

## 5단계 프롬프트: 타이틀·이벤트 CG 8장

공통 사항: 비율 이벤트 CG **2:3**(없으면 9:16), `title_keyart`만 **9:16** · 해상도 선택이 있으면 2K · 투명 배경 불필요(배경이 있는 한 장짜리 그림) · 레퍼런스 1은 항상 붙임

### `title_keyart`

- 용도: 타이틀 화면 배경. 게임이 가운데 띠에 제목·버튼을 겹쳐 그리므로 그 띠는 어둡게 비우고, 글자는 넣지 않습니다. 불 켜진 창 하나가 위쪽 띠에 크게 들어오게 했습니다.
- 비율 9:16 · 레퍼런스 1: 희민 기준 시트 (그림체만)

```text
Reference image 1 is only an art-style reference: match its line weight, cel shading and color treatment, but do not draw that character or any person from it. Vertical full-scene illustration for a title-screen background, with no characters in focus. Layout from top to bottom: a close, low-angle view of the dark main building of a late-1990s Korean concrete school, four to five storeys with rows of identical dark windows, which rises from the top edge down to about 45% of the image height, under cold blue moonlight with a few bare early-spring tree branches at the sides. Every window is dark except one second-floor classroom window near the horizontal center, at about 14-25% of the image height and about 15% of the image width, glowing faintly warm white, with the dark silhouette of a girl with very long straight hair filling most of it. Below 28% the building is unlit, flat, nearly black wall with no glowing signs or bright details; its ground floor and entrance are lost in darkness. From about 45% to 72% of the height, the empty dirt schoolyard lies in deep shadow, plain and without detail, with only a very faint, very dark crimson haze. Below 72%: the black silhouettes of a closed iron school gate and a low wall, and the very bottom fades to black. Keep everything important inside the central 80% of the width. Paint it slightly brighter than a normal night scene. Mood: dread and loneliness, the school is waiting. 2D anime visual-novel event CG, anime visual-novel character design, clean crisp lineart, cel shading with painterly atmospheric lighting, muted colors, dark horror-mystery mood, a Korean school at night in March 2001, strong light-and-dark contrast, one clear focal subject with large readable shapes, edges fading into a dark vignette, nothing important in the bottom 10%, eerie but not graphic, any students wholesome, fully clothed and modestly posed, no revealing clothing or suggestive poses. No text, no captions, no logo, no watermark, no frame, no smartphones, no modern LED screens. No title, no fine stripes or tiny repeating patterns. No film grain.
```

### `cg_prologue`

- 용도: 1장 첫 컷(장 카드 직후, 희민 독백 3줄). 현관문이 닫히기 **전**의 고요라서 문은 아직 열려 있습니다.
- 비율 2:3 (없으면 9:16) · 레퍼런스 1: 희민 기준 시트

```text
Reference image 1 is the protagonist boy's character sheet: match his face, hair and uniform. Vertical full-scene illustration. Scene: the quiet moment before something goes wrong. The protagonist boy stands alone just inside the dark main entrance lobby of the school, seen from the front at a slight angle, knee-up and large in the frame. He holds a pink diary and a small ribbon-tied candy box in both hands and looks down at them with shy excitement mixed with nervousness; a school bag hangs on his shoulder. Behind him the double glass front doors still stand ajar, showing the moonlit empty schoolyard; cold blue moonlight pours in from behind and rims his hair and shoulders; a small green emergency-exit sign glows above the doors. Stone-tiled lobby floor, wooden shoe cabinets on both sides, a drink vending machine giving off a dim reddish glow at one side, a folding ladder leaning against the wall, dark corridor openings at the edges; otherwise near darkness. Hushed, nervous anticipation with a faint unease. 2D anime visual-novel event CG, bishoujo/bishounen character design, clean crisp lineart, cel shading with painterly atmospheric lighting, muted colors, dark horror-mystery mood, a Korean school at night in March 2001, strong light-and-dark contrast, one clear focal subject with large readable shapes, edges fading into a dark vignette, nothing important in the bottom 10%, eerie but not graphic, any students wholesome, fully clothed and modestly posed, no revealing clothing or suggestive poses. The protagonist boy: a Korean high-school second-year student, a soft-featured boy with a quiet, ordinary, understated air; short straight jet-black hair with slightly choppy, uneven bangs just above the eyebrows, ears visible, neat short back and sides; dark brown eyes; light warm skin; average build; Korean winter school uniform: navy blue single-breasted blazer with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared dress shirt, dark burgundy necktie. Below the waist: charcoal-grey slacks, dark brown leather shoes. No text, no captions, no logo, no watermark, no frame, no smartphones, no modern LED screens. No film grain.
```

### `cg_sigil_metal`

- 용도: 환기구에서 기계실습실로 내려선 순간. 경보 벨과, 바닥에 새겨져 **희미하게** 빛나는 金 문양(네온 마법진 아님). 문양은 게임 속 바닥 그림과 같은 구조(바깥 고리 두 겹 + 오각별 + 가운데 작은 고리 속 金)입니다.
- 비율 2:3 (없으면 9:16) · 레퍼런스 1: 희민 기준 시트

```text
Reference image 1 is the protagonist boy's character sheet: match his hair and uniform. Vertical full-scene illustration. Scene: high-angle view looking down into an old school machine-shop classroom at night. In the middle of the stone floor a circle is carved into the floor and glows faintly with a dim, desaturated gold light, not neon: two thin concentric outer rings with a band of alternating short bars and small diamond dots between them; a five-pointed star whose points touch the inner of those two rings, each point capped with a small circle; at the center a smaller plain ring, where the star lines stop, enclosing one single large Chinese character 金. Around it: a workbench with one sheet of paper on it, old lathes and a milling machine in shadow, a heavy steel safe with a small switchboard panel of four unlit lamps beside it, a cut-open ventilation grate high on the wall in the upper-left corner, and a closed iron door. Pulsing red alarm light floods the whole room, an old alarm bell on the wall rattles with a slight motion blur, and a sliver of cold moonlight falls from a window. The protagonist boy is small beside the cut vent opening in the upper-left corner, having just dropped down, standing frozen and facing into the room toward the carved circle, his face half in shadow. Tense, ritualistic, uncanny. The only writing in the image is the single character 金. 2D anime visual-novel event CG, bishoujo/bishounen character design, clean crisp lineart, cel shading with painterly atmospheric lighting, muted colors, dark horror-mystery mood, a Korean school at night in March 2001, strong light-and-dark contrast, one clear focal subject with large readable shapes, edges fading into a dark vignette, nothing important in the bottom 10%, eerie but not graphic, any students wholesome, fully clothed and modestly posed, no revealing clothing or suggestive poses. The protagonist boy: a Korean high-school second-year student, a soft-featured boy with a quiet, ordinary, understated air; short straight jet-black hair with slightly choppy, uneven bangs just above the eyebrows, ears visible, neat short back and sides; dark brown eyes; light warm skin; average build; Korean winter school uniform: navy blue single-breasted blazer with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared dress shirt, dark burgundy necktie. Below the waist: charcoal-grey slacks, dark brown leather shoes. No text, no captions, no logo, no watermark, no frame, no smartphones, no modern LED screens. No film grain.
```

### `cg_janitor`

- 용도: 1층 동쪽 복도 '정숙' 팻말 앞, 수위 첫 등장 → 추격 시작. 팻말은 글자 없이(필요하면 개발자가 '정숙'을 넣음). 수위가 화면에 크게 들어와 콧수염과 멍한 눈이 보이게 했습니다.
- 비율 2:3 (없으면 9:16) · 레퍼런스 1: 희민 기준 시트 (그림체만) · 레퍼런스 2(선택): `portrait_janitor`를 만들었다면 그것

```text
Reference image 1 is only an art-style reference: match its line weight, cel shading and color treatment, but do not draw that character or any person from it. If reference image 2 is attached, it is this guard's portrait: match his face and uniform. Vertical full-scene illustration. Scene: first-person view down a long, very dark school corridor at night with a terrazzo floor. The night security guard approaches from the far end and is already fairly close, his figure filling roughly the middle 55-60% of the image height, his head at about 25-35% of the image height: he limps heavily, dragging his stiff right leg; the flashlight in his right hand is aimed straight at the viewer, throwing a harsh warm-white beam with lens flare that backlights him, with enough spill light on his face to show the grey mustache and blank, possessed eyes; the aluminum bat hangs low in his left hand; the keys and whistle swing at his belt. On the near wall in the foreground, a small blank white sign plate with a black border and no lettering. Small, dim and mostly in shadow: closed office doors along the walls, a red metal toolbox on the floor, a lowered metal fire shutter at the stairwell, and an old dark wooden double door. At the far end, a green emergency-exit sign glow and the dim red glow of a drink vending machine. Cold, menacing, sudden dread. 2D anime visual-novel event CG, anime visual-novel character design, clean crisp lineart, cel shading with painterly atmospheric lighting, muted colors, dark horror-mystery mood, a Korean school at night in March 2001, strong light-and-dark contrast, one clear focal subject with large readable shapes, edges fading into a dark vignette, nothing important in the bottom 10%, eerie but not graphic, any students wholesome, fully clothed and modestly posed, no revealing clothing or suggestive poses. The night security guard: a Korean man close to 60, drawn as a weathered, unglamorous man, not prettified and not youthful; bald crown with a thin band of short grey hair around the sides and back; bushy grey eyebrows, thick grey mustache, narrow droopy eyes, deep forehead wrinkles, weathered tan skin; stocky, heavy-set, slightly stooped build; olive-drab grey-green security guard uniform: long-sleeve shirt with darker olive epaulettes, cuffs and flapped chest pockets, a small gold badge on the left chest, a navy patch on the left upper sleeve, matching olive trousers, black belt with a brass buckle, a ring of keys and a whistle hanging at his belt, black shoes; a silver metal flashlight in his right hand and a silver aluminum baseball bat with a black grip in his left hand; he walks with a heavy limp, dragging a stiff right leg. No text, no captions, no logo, no watermark, no frame, no smartphones, no modern LED screens. No lettering on any sign, no CCTV domes. No film grain.
```

### `cg_hanging`

- 용도: 강당 통로 모퉁이에서 천장에 매달린 한나영(소영의 언니)의 귀신이 천천히 고개를 돌림. 피·상처 없이 정적으로 무섭게. 눈높이에서 보고, 올려다보는 각도는 쓰지 않습니다.
- 비율 2:3 (없으면 9:16) · 레퍼런스 1: 희민 기준 시트 (그림체만)

```text
Reference image 1 is only an art-style reference: match its line weight, cel shading and color treatment, but do not draw that character or any person from it. Vertical full-scene illustration. Scene: eye-level view from just around the corner of a narrow L-shaped concrete service passage at night: bare concrete walls, a low ceiling with an exposed pipe, a locked door at the far end, no windows, no stairs. Several steps away, seen as a whole figure at medium distance, the ghost girl is suspended motionless in mid-air just below the ceiling pipe; an old frayed rope hangs down from the pipe and disappears behind her long hair. Her bare feet hover still above the floor, her knee-length skirt hangs straight down, and her legs fade into deep shadow. Her long wet-looking black hair hides her face except for one wide-open eye, and she is very slowly turning her head toward the viewer. The passage is almost pitch dark; the only light is a faint, cold pale-blue glow from the ghost herself. The near edge of the wall corner frames the left side of the image. Total silence, slow creeping horror, a sorrowful apparition rather than a body. Non-graphic: no visible injuries, no visible neck or knot, no struggle; the camera does not look up at her. 2D anime visual-novel event CG, anime visual-novel character design, clean crisp lineart, cel shading with painterly atmospheric lighting, muted colors, dark horror-mystery mood, a Korean school at night in March 2001, strong light-and-dark contrast, one clear focal subject with large readable shapes, edges fading into a dark vignette, nothing important in the bottom 10%, eerie but not graphic, any students wholesome, fully clothed and modestly posed, no revealing clothing or suggestive poses. The ghost girl: a teenage schoolgirl ghost, sorrowful rather than monstrous; ash-grey skin with cold blue-grey mottling; extremely long, straight, wet-looking jet-black hair hanging over her whole face and down past her waist, with a narrow gap showing only her left eye, wide open, dull white with a tiny black pupil; the school's summer uniform with no blazer: a faded, yellowed off-white short-sleeve blouse, slightly frayed at the cuffs, with faint old water stains, a small dark wine-red bow ribbon, a knee-length navy-and-grey plaid pleated skirt with a frayed hem; barefoot; thin, overly long arms and long thin fingers with dark grey-violet nails. No text, no captions, no logo, no watermark, no frame, no smartphones, no modern LED screens. No film grain.
```

차단되면 이 문장으로 (같은 모델, 실루엣만 보이는 순화판)

```text
Reference image 1 is only an art-style reference: match its line weight, cel shading and color treatment, but do not draw that character or any person from it. Vertical full-scene illustration. Scene: eye-level view from just around the corner of a narrow L-shaped concrete service passage at night: bare concrete walls, a low ceiling with an exposed pipe, a locked door at the far end, no windows, no stairs. Several steps away, only the ghost girl's dark silhouette is visible against her own faint pale-blue glow, suspended in the air below the ceiling pipe beside an old frayed rope, long hair hanging over her face, one wide-open eye catching the light; her tall, still shadow stretches across the concrete wall. Everything else is almost pitch dark. The near edge of the wall corner frames the left side of the image. Total silence, a sorrowful apparition rather than a body. Non-graphic: no visible injuries, no visible neck or knot, no struggle; the camera does not look up at her. 2D anime visual-novel event CG, anime visual-novel character design, clean crisp lineart, cel shading with painterly atmospheric lighting, muted colors, dark horror-mystery mood, a Korean school at night in March 2001, strong light-and-dark contrast, one clear focal subject with large readable shapes, edges fading into a dark vignette, nothing important in the bottom 10%, eerie but not graphic, any students wholesome, fully clothed and modestly posed, no revealing clothing or suggestive poses. The ghost girl: a teenage schoolgirl ghost, sorrowful rather than monstrous; ash-grey skin with cold blue-grey mottling; extremely long, straight, wet-looking jet-black hair hanging over her whole face and down past her waist, with a narrow gap showing only her left eye, wide open, dull white with a tiny black pupil; the school's summer uniform with no blazer: a faded, yellowed off-white short-sleeve blouse, slightly frayed at the cuffs, with faint old water stains, a small dark wine-red bow ribbon, a knee-length navy-and-grey plaid pleated skirt with a frayed hem; barefoot; thin, overly long arms and long thin fingers with dark grey-violet nails. No text, no captions, no logo, no watermark, no frame, no smartphones, no modern LED screens. No film grain.
```

### `cg_tree`

- 용도: 2학년 8반, 바닥을 뚫은 뿌리가 소영의 발목을 붙잡아 끌고 가는 순간. 소영은 아직 서 있고, 다리는 넘어진 책상에 가려집니다. 노출 연출 금지.
- 비율 2:3 (없으면 9:16) · 레퍼런스 1 = 소영 기준 시트, 레퍼런스 2 = 희민 기준 시트

```text
Reference image 1 is the long-haired girl's character sheet and reference image 2 is the protagonist boy's character sheet: match their faces, hair and uniforms. Vertical full-scene illustration. Scene: camera at standing eye level inside a dark 2001 Korean classroom at night, rows of wooden-top steel-frame desks and chairs, a green chalkboard at the front, windows along the side wall. The wooden plank floor splits open and thick blackish red-brown thorny tree roots burst upward, toppling desks and chairs; splinters and dust fly. A single thick root has caught the long-haired girl by one ankle at floor level and strains toward the dark front of the classroom by the chalkboard; she is still on her feet, stumbling backward and twisting toward the viewer at the waist, eyes wide in shock, one hand reaching out toward the viewer. A toppled desk in front of her hides her legs below the knee; the taut root runs out from behind it. The roots stay on the floor and around the furniture and never climb her legs or body; her uniform stays neat and in place; she is not lying or falling to the floor. In the near foreground, the protagonist boy is seen from behind, his back and one arm reaching out toward her, a pink diary and a ribbon-tied candy box falling from his other hand. Cold blue moonlight slants through the side windows; only a faint dark-red glow seeps from the cracks in the floor. Violent, sudden, helpless shock. 2D anime visual-novel event CG, bishoujo/bishounen character design, clean crisp lineart, cel shading with painterly atmospheric lighting, muted colors, dark horror-mystery mood, a Korean school at night in March 2001, strong light-and-dark contrast, one clear focal subject with large readable shapes, edges fading into a dark vignette, nothing important in the bottom 10%, eerie but not graphic, any students wholesome, fully clothed and modestly posed, no revealing clothing or suggestive poses. The long-haired girl: a Korean high-school second-year student, a quiet girl with a cool, mysterious presence; very long, perfectly straight blue-black hair falling to the waist, blunt straight-cut bangs at eyebrow level, face-framing side locks cut at shoulder length (hime cut), no hair accessories; pale porcelain skin; dark eyes; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. The protagonist boy: a Korean high-school second-year student, a soft-featured boy with a quiet, ordinary, understated air; short straight jet-black hair with slightly choppy, uneven bangs just above the eyebrows, ears visible, neat short back and sides; dark brown eyes; light warm skin; average build; Korean winter school uniform: navy blue single-breasted blazer with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared dress shirt, dark burgundy necktie. No text, no captions, no logo, no watermark, no frame, no smartphones, no modern LED screens. No film grain.
```

차단되면 이 문장으로 (같은 모델, 뿌리가 둘 사이를 가르고 소영은 허리 위로만 보이는 순화판)

```text
Reference image 1 is the long-haired girl's character sheet and reference image 2 is the protagonist boy's character sheet: match their faces, hair and uniforms. Vertical full-scene illustration. Scene: camera at standing eye level inside a dark 2001 Korean classroom at night, rows of wooden-top steel-frame desks and chairs, a green chalkboard at the front, windows along the side wall. Thick blackish red-brown thorny tree roots burst up through the wooden plank floor between the protagonist boy and the long-haired girl, toppling desks and chairs; splinters and dust fly. In the near foreground, the protagonist boy is seen from behind, one arm reaching out, a pink diary and a ribbon-tied candy box falling from his other hand. Beyond the roots, the long-haired girl, shown from the waist up behind toppled desks, is pulled away into the dark at the front of the classroom by the chalkboard, eyes wide in shock, one hand reaching toward the viewer; the roots never touch her above the floor line and her uniform stays neat. Cold blue moonlight slants through the side windows; only a faint dark-red glow seeps from the cracks in the floor. Violent, sudden, helpless shock. 2D anime visual-novel event CG, bishoujo/bishounen character design, clean crisp lineart, cel shading with painterly atmospheric lighting, muted colors, dark horror-mystery mood, a Korean school at night in March 2001, strong light-and-dark contrast, one clear focal subject with large readable shapes, edges fading into a dark vignette, nothing important in the bottom 10%, eerie but not graphic, any students wholesome, fully clothed and modestly posed, no revealing clothing or suggestive poses. The long-haired girl: a Korean high-school second-year student, a quiet girl with a cool, mysterious presence; very long, perfectly straight blue-black hair falling to the waist, blunt straight-cut bangs at eyebrow level, face-framing side locks cut at shoulder length (hime cut), no hair accessories; pale porcelain skin; dark eyes; Korean winter school uniform: navy blue blazer buttoned with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared blouse, red bow ribbon at the collar. The protagonist boy: a Korean high-school second-year student, a soft-featured boy with a quiet, ordinary, understated air; short straight jet-black hair with slightly choppy, uneven bangs just above the eyebrows, ears visible, neat short back and sides; dark brown eyes; light warm skin; average build; Korean winter school uniform: navy blue single-breasted blazer with two brass buttons, a small plain white name tag pinned on the left side of the blazer front, off-white collared dress shirt, dark burgundy necktie. No text, no captions, no logo, no watermark, no frame, no smartphones, no modern LED screens. No film grain.
```

### `cg_recording`

- 용도: B루트 전용. 녹음실 유리 너머 매달린 귀신이 내려다봄. 소영은 이 그림 **뒤**에 들어오므로 넣지 않습니다. 눈높이에서 유리 너머로 보고, 올려다보는 각도는 쓰지 않습니다.
- 비율 2:3 (없으면 9:16) · 레퍼런스 1: 희민 기준 시트 (그림체만) · 레퍼런스 2(선택): `cg_hanging` (귀신 모습 맞추기). 차단되면 레퍼런스 2를 빼고 다시 시도하세요.

```text
Reference image 1 is only an art-style reference: match its line weight, cel shading and color treatment, but do not draw that character or any person from it. If reference image 2 is attached, it shows this same ghost girl: match her hair, skin and uniform. Vertical full-scene illustration. Scene: inside the dark broadcasting room of a 2001 Korean school at night. In the foreground, switched-off broadcast equipment with every light off: a mixing console with a grey top and a wooden body, a microphone on a stand, shelves of cassette tapes. Beyond them, an interior glass window into a small recording booth whose walls are covered with perforated acoustic panels. Inside the booth, seen at eye level through the glass at medium distance, the ghost girl is suspended in the air near the booth ceiling beside an old frayed rope that disappears behind her long hair; her knee-length skirt hangs straight and her legs fade into deep shadow below the knees; head bowed, she gazes down through the glass toward the viewer; one eye shows through her hair; she seems to be quietly sobbing. The camera does not look up at her. Cold moonlight from the booth's small outer window backlights her; faint reflections and a little fog on the interior glass. No other people and no reflections of people in the glass. Grief-stricken, melancholic horror. Non-graphic: no visible injuries. 2D anime visual-novel event CG, anime visual-novel character design, clean crisp lineart, cel shading with painterly atmospheric lighting, muted colors, dark horror-mystery mood, a Korean school at night in March 2001, strong light-and-dark contrast, one clear focal subject with large readable shapes, edges fading into a dark vignette, nothing important in the bottom 10%, eerie but not graphic, any students wholesome, fully clothed and modestly posed, no revealing clothing or suggestive poses. The ghost girl: a teenage schoolgirl ghost, sorrowful rather than monstrous; ash-grey skin with cold blue-grey mottling; extremely long, straight, wet-looking jet-black hair hanging over her whole face and down past her waist, with a narrow gap showing only her left eye, wide open, dull white with a tiny black pupil; the school's summer uniform with no blazer: a faded, yellowed off-white short-sleeve blouse, slightly frayed at the cuffs, with faint old water stains, a small dark wine-red bow ribbon, a knee-length navy-and-grey plaid pleated skirt with a frayed hem; barefoot; thin, overly long arms and long thin fingers with dark grey-violet nails. No text, no captions, no logo, no watermark, no frame, no smartphones, no modern LED screens. No glowing LEDs. No film grain.
```

차단되면 이 문장으로 (같은 모델, 레퍼런스 2 없이, 실루엣만 보이는 순화판)

```text
Reference image 1 is only an art-style reference: match its line weight, cel shading and color treatment, but do not draw that character or any person from it. Vertical full-scene illustration. Scene: inside the dark broadcasting room of a 2001 Korean school at night. In the foreground, switched-off broadcast equipment with every light off: a mixing console with a grey top and a wooden body, a microphone on a stand, shelves of cassette tapes. Beyond them, an interior glass window into a small recording booth whose walls are covered with perforated acoustic panels. Inside the booth, behind fogged glass, only the dark silhouette of a long-haired ghost girl suspended near the ceiling, head bowed toward the viewer, her outline softly backlit by cold moonlight from the booth's small outer window; no rope or neck visible. The camera does not look up at her. No other people and no reflections of people in the glass. Grief-stricken, melancholic horror. Non-graphic: no visible injuries. 2D anime visual-novel event CG, anime visual-novel character design, clean crisp lineart, cel shading with painterly atmospheric lighting, muted colors, dark horror-mystery mood, a Korean school at night in March 2001, strong light-and-dark contrast, one clear focal subject with large readable shapes, edges fading into a dark vignette, nothing important in the bottom 10%, eerie but not graphic, any students wholesome, fully clothed and modestly posed, no revealing clothing or suggestive poses. The ghost girl: a teenage schoolgirl ghost, sorrowful rather than monstrous; ash-grey skin with cold blue-grey mottling; extremely long, straight, wet-looking jet-black hair hanging over her whole face and down past her waist, with a narrow gap showing only her left eye, wide open, dull white with a tiny black pupil; the school's summer uniform with no blazer: a faded, yellowed off-white short-sleeve blouse, slightly frayed at the cuffs, with faint old water stains, a small dark wine-red bow ribbon, a knee-length navy-and-grey plaid pleated skirt with a frayed hem; barefoot; thin, overly long arms and long thin fingers with dark grey-violet nails. No text, no captions, no logo, no watermark, no frame, no smartphones, no modern LED screens. No glowing LEDs. No film grain.
```

### `cg_seal`

- 용도: 1장 마지막 컷. 木 패를 끼우자 결계문이 저절로 열림. A·B 루트 공용이라 **히로인 없음**, 문에 손잡이 없음. 꽂힌 나무 패에도 작은 木 자가 새겨져 있습니다.
- 비율 2:3 (없으면 9:16) · 레퍼런스 1: 희민 기준 시트 (그림체만, 패를 놓는 손의 소매만)

```text
Reference image 1 is only an art-style reference: match its line weight, cel shading and color treatment; do not draw that character, except that the single hand in the scene wears the same navy blazer sleeve. Vertical full-scene illustration. Scene: the last image of the chapter, a threshold being crossed. A dark school corridor at night with a terrazzo floor. Large in the center: an old double wooden door blackened with age, with two horizontal iron straps, round iron studs and no handles. A round iron-rimmed disc spans the seam of both leaves, and the single Chinese character 木 carved into it glows a cold bluish-teal, not bright green, spilling soft light onto the door and floor. The two leaves are swinging inward by themselves, revealing a long pitch-dark hallway beyond that seems to go on forever. Beside the door, set into the wall, a mossy grey stone slab with a pale granite-rimmed pentagon-shaped recess holding a palm-sized pentagonal wooden tablet whose face bears a small carved 木; a single hand in a navy blazer sleeve is just letting go of the tablet. Nearby, a metal fire shutter rolled up above the stairwell opening; far down the corridor, a faint green emergency-exit glow and the dim red light of a vending machine. No other people. Ominous: the labyrinth continues. The only writing in the image is the Chinese character 木 (large on the door disc, small on the tablet). 2D anime visual-novel event CG, anime visual-novel character design, clean crisp lineart, cel shading with painterly atmospheric lighting, muted colors, dark horror-mystery mood, a Korean school at night in March 2001, strong light-and-dark contrast, one clear focal subject with large readable shapes, edges fading into a dark vignette, nothing important in the bottom 10%, eerie but not graphic, any students wholesome, fully clothed and modestly posed, no revealing clothing or suggestive poses. No text, no captions, no logo, no watermark, no frame, no smartphones, no modern LED screens. No film grain.
```

### 차단될 때 (`cg_hanging`, `cg_recording`, `cg_tree`)

같은 프롬프트를 다른 모델에 반복해서 넣지 마세요. 먼저 **같은 모델**에서 각 CG 바로 아래의 '차단되면 이 문장으로' 순화판으로 한 번 시도합니다(`cg_recording`은 레퍼런스 2도 뺍니다). 그래도 막히면 CG에 한해 다른 모델에서 순화판으로 한 번 시도하고, 그래도 안 되면 슬롯 이름만 알려 주세요.

## 공통 네거티브 블록 (네거티브 칸이 보일 때만)

공식 문서에는 네거티브 칸이 나와 있지 않습니다. 칸이 없으면 이 블록은 쓰지 않아도 됩니다. 위 프롬프트마다 핵심 제외 문구가 이미 들어 있습니다. **1단계 기준 시트에는 네거티브 블록을 넣지 마세요.** 초상화용 블록의 'character sheet, multiple views'가 시트 프롬프트와 정반대라서 시트가 망가집니다.

**초상화용**

```text
text, letters, writing on name tag, logo, watermark, signature, speech bubble, frame, border, two characters, character sheet, multiple views, background scenery, gradient background, vignette, floor shadow, drop shadow, glow, aura, smoke, particles, sparkles, floating emotion symbols, sweat drops, anger marks, speed lines, green rim light, flyaway hair strands, green clothing, green eyes, green accessories, sailor collar, Japanese seifuku, photorealistic, 3D render, chibi, extra fingers, deformed hands, revealing clothing, suggestive pose, film grain, noise
```

**CG·타이틀용**

```text
text, letters, captions, subtitles, logo, watermark, signature, user interface, frame, border, smartphone, modern LED screen, flat-screen monitor, CCTV dome, Japanese signage, sailor collar, Japanese seifuku, photorealistic, 3D render, chibi, graphic injury, gore, revealing clothing, suggestive pose, bright neon magic circle, fine stripes, tiny repeating patterns, film grain, VHS noise
```

## 보내기 전 확인 (QA 체크리스트)

**파일 이름**
- [ ] 위 슬롯 이름과 글자 하나까지 같은가 (`heemin` `soyoung` `seonga` `jihyeon`, 소문자, 밑줄)
- [ ] `portrait_soyoung_smile (1).png`, `.png.png`, 공백, 대문자가 없는가
- [ ] 같은 슬롯을 두 번 보내지 않았는가 (다시 보내면 새 파일로 교체됩니다)
- [ ] 채팅으로 보낼 때 이미지마다 슬롯 이름을 메시지에 적었는가

**배경 (초상화)**
- [ ] 배경이 균일한 초록 #00FF00인가. 그라데이션·바닥 그림자·빛 번짐이 없는가 (직접 투명하게 만들었다면 초록 원본도 함께 보내는가)
- [ ] 네 모서리가 모두 초록인가. 몸이나 팔꿈치가 아래 모서리에 닿지 않았는가
- [ ] 인물에 초록이 없는가 (눈, 소품, 하이라이트, 가장자리 반사광)
- [ ] 지현의 안경알이 흰 반사로 칠해졌는가 (안경알 너머로 초록 배경이 보이면 그 부분에 구멍이 납니다)
- [ ] 잔머리, 연기, 반짝이, 빛 테두리가 인물 바깥으로 튀어나오지 않았는가
- [ ] 머리 주변에 땀방울·분노 마크·느낌표·효과선 같은 만화 기호가 떠 있지 않은가 (게임이 빨간 테두리를 둘러 얼룩처럼 보입니다)

**같은 얼굴·같은 구도 (표정끼리)**
- [ ] 기본 초상화와 번갈아 넘겨 볼 때 얼굴, 머리 모양, 머리 위치·크기, 몸 각도가 그대로인가
- [ ] 몸이 그림 왼쪽으로 살짝 돌아 있는가 (시선은 표정마다 다를 수 있음. `portrait_seonga_surprised`는 반드시 옆을 봄)
- [ ] 인물이 한 명, 한 모습만 있는가 (기준 시트처럼 두 모습이 나오지 않았는가)
- [ ] 정수리와 왼쪽이 잘리지 않았고, 허리 아래만 그림 아래에서 잘렸는가

**손**
- [ ] 손가락 개수와 모양이 자연스러운가
- [ ] 손이 그림 아래쪽 15% 안에 있지 않은가 (아래 7~9%는 대화창에 가려지므로 여유를 둔 기준)

**교복·인물 고정 요소**
- [ ] 남색 블레이저에 금색 단추, 흰 셔츠, 흰색 무지 명찰(글자 없음)인가. 세일러복이 아닌가
- [ ] 희민: 짧은 검은 머리, 버건디 넥타이
- [ ] 소영: 허리까지 오는 검은 생머리, 일자 앞머리, 어깨 길이 옆머리, 장신구 없음
- [ ] 성아: 턱 길이 짧은 단발, 금색 머리핀 1개, **블레이저 단추를 풀어 열어 둠**, 건강한 피부 (창백하거나 귀신 같으면 안 됨)
- [ ] 지현: 어깨 길이 밤색 반묶음, 와인색 머리끈, 둥근 금테 안경
- [ ] 단정한가 (노출이나 선정적인 자세가 없는가)

**CG**
- [ ] CG는 세로 2:3, 타이틀은 9:16인가
- [ ] 글자, 로고, 워터마크가 없는가 (金·木 한 글자만 허용, 한자가 정확한가)
- [ ] `cg_prologue`의 현관문이 아직 열려 있는가 / `cg_recording`에 소영이 없는가 / `cg_seal`에 히로인이 없는가
- [ ] `title_keyart`의 가운데 띠(세로 28~72%)가 어둡고 단순한가
- [ ] 휴대폰에서 작게 봐도 무엇인지 읽히는가

**해상도**
- [ ] 초상화 세로 1536px 이상 (최소 1280px), CG 1280×1920 이상, 타이틀 1080×1920 이상. 2K로 받으면 대개 충족됩니다

> 자동 검사(`tests/hf.mjs`)는 슬롯에 없는 파일 이름(가장 비슷한 이름 제안), 같은 슬롯 중복, 초상화 투명 배경(네 모서리), 초상화 세로 800px 이상만 확인합니다. CG·타이틀 해상도나, 표정끼리 이름이 뒤바뀐 것(예: smile과 smirk)은 잡지 못하니 보내기 전에 이름을 꼭 확인해 주세요.

## 개발자용 (받은 뒤 처리)

```bash
python3 tools/hf_import.py <받은 파일들>   # 초상화: 모서리가 불투명하면 초록 제거(hf_key)·세로 1280px / CG·타이틀: 긴 변 1920px / WebP q88 변환 / manifest.json 갱신
node tests/hf.mjs                          # 슬롯 이름·중복·초상화 투명 배경·초상화 세로 800px 검사 (실패하면 종료 코드 1)
```

- 받은 원본은 `assets/hf/` **밖**(예: 별도 받은 폴더)에 두고 가져옵니다. `hf_import.py`는 `assets/hf/` 안의 같은 슬롯 파일을 확장자와 상관없이 지운 뒤 WebP로 저장하므로, `assets/hf/` 안에 있던 원본은 사라집니다.
- 채팅으로 받은 이미지는 메시지에 적힌 슬롯 이름으로 파일 이름을 붙인 뒤 가져옵니다.
- 이미 투명한 초상화는 `hf_import.py`가 초록 제거·번짐 제거를 건너뜁니다. 초록 원본이 함께 왔다면 그 파일로 가져옵니다.
- 기준 시트(`sheet_*`)는 `assets/hf/`에 넣지 않습니다. `build_sprites.py`가 manifest에 올리고 `tests/hf.mjs`가 실패합니다.
