# 사이트 수정 가이드

## 폴더 구조

```
index.html            ← 페이지 뼈대와 소개 문구(일본어)
assets/css/style.css  ← 디자인(색, 글자 크기, 간격)
assets/js/main.js     ← 작품 카드를 그려주는 스크립트 (보통 안 건드려도 됨)
assets/js/wave-bg.js  ← 배경에 흐르는 파형 (보통 안 건드려도 됨)
data/works.js         ← 작품 목록 (작품 추가는 여기만)
data/site.js          ← 이메일, YouTube/SoundCloud 등 링크
EDITING.md            ← 이 파일
```

## 작품 추가하기

1. GitHub에서 `data/works.js`를 열고 연필 아이콘(Edit)을 눌러요.
2. `{ title: ... }` 한 덩어리를 통째로 복사해서 바로 아래에 붙여넣어요. (덩어리 사이에 쉼표 `,` 필수)
3. 제목, 설명, 영상 ID 등을 바꾸고 Commit changes를 눌러요.

영상 ID는 YouTube 주소 `https://www.youtube.com/watch?v=abc123XYZ99`에서 `v=` 뒤의 `abc123XYZ99` 부분이에요.
(`youtu.be/abc123XYZ99` 형태면 슬래시 뒤 부분.)

작품이 7개 이상이 되면 태그(`tags`)별 필터 버튼이 자동으로 나타나요.

## 작품 팝업(상세 보기)

카드의 **제목이나 썸네일을 클릭하면** 큰 영상과 상세 정보가 팝업으로 열려요. 팝업에 나오는 항목은 `data/works.js`의 작품 덩어리에서 정해져요. 아래 항목은 모두 **선택 사항**이라, 안 써도 문제없이 동작해요.

```js
  {
    title: "작품 제목",
    category: "ゲーム映像 サウンドリデザイン",
    year: "2026",
    description: "카드에 보이는 짧은 설명 (3줄까지 표시)",
    details: [                       // 팝업에 보이는 긴 설명. 문단마다 한 줄씩
      "制作意図や工夫した点を書きます。",
      "二つ目の段落もここに書けます。"
    ],
    role: "効果音(SFX)全般",         // 팝업의 「担当」
    tools: ["Wwise", "Reaper"],      // 팝업의 「使用ツール」
    tags: ["SFX"],
    media: { type: "youtube", id: "영상ID" },
    links: [{ label: "制作解説書 (PDF)", url: "https://..." }]  // 팝업 아래쪽에 표시
  },
```

- `details`를 쓰지 않으면 `description`이 팝업 본문으로 표시돼요.
- 영상이 없는 작품(`type: "none"`)도 팝업은 열리고, 영상 칸 없이 설명만 보여요.
- 팝업은 `×` 버튼, 바깥 어두운 부분 클릭, Esc 키로 닫혀요. 닫으면 영상 재생도 멈춰요.

영상이 없는 작품은 `thumb: "이미지 주소"`를 추가하면 그 이미지가 카드 썸네일로 표시돼요. (`assets/img/` 폴더에 올린 파일 경로 또는 https 주소)

## 배경 파형 / 사용 도구

- 사이트 전체 배경에 깔린 움직이는 파형은 `assets/js/wave-bg.js`가 만들어요. 소리는 나지 않고, 마우스로 건드리면 현처럼 흔들려요. 색과 진하기는 파일 맨 위 `CONFIG`에서 바꿔요.
- About의 「使用ツール」 목록은 `data/site.js`의 `tools: [...]`에서 바꿔요. 비워두면(`[]`) 그 줄이 사라져요.

## 소개 문구 / 이메일 / 링크 바꾸기

- 소개 문구: `index.html`의 `About` 부분
- 이메일, YouTube·SoundCloud 링크: `data/site.js` (url을 비워두면 표시되지 않아요)

## 색 바꾸기

`assets/css/style.css` 맨 위 `:root { ... }`의 `--accent`(포인트 색), `--bg`(배경색) 값만 바꾸면 사이트 전체에 반영돼요.

## 페이지를 더 늘리고 싶을 때

예를 들어 작품 상세 페이지가 필요하면 `works/` 폴더를 만들고, `index.html`을 복사해서 같은 CSS(`../assets/css/style.css`)를 불러오면 돼요.
데이터(`data/works.js`)와 디자인(`style.css`)을 공유하기 때문에, 새 페이지에서도 같은 모양을 유지할 수 있어요.

## 참고

- 수정 후 반영까지 1~2분 걸려요. 안 바뀌어 보이면 강력 새로고침(Ctrl+Shift+R / Cmd+Shift+R)을 해보세요.
- 저장소 루트의 `_config.yml`은 이 구조에서는 필요 없어요. 남겨둬도 문제는 없어요.
