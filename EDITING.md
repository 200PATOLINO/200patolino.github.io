# 사이트 수정 가이드

## 폴더 구조

```
index.html            ← 페이지 뼈대와 소개 문구(일본어)
assets/css/style.css  ← 디자인(색, 글자 크기, 간격)
assets/js/main.js     ← 작품 카드를 그려주는 스크립트 (보통 안 건드려도 됨)
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

영상이 없는 작품은 `thumb: "이미지 주소"`를 추가하면 그 이미지가 카드 썸네일로 표시돼요. (`assets/img/` 폴더에 올린 파일 경로 또는 https 주소)

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
