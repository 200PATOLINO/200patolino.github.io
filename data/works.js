/*
 * 作品データ
 * ----------------------------------------------------------
 * 作品を増やすときは、下の { ... }, のかたまりを1つコピーして
 * 配列の中に貼り付けるだけです。HTMLやCSSは触らなくて大丈夫です。
 *
 * media の書き方
 *   YouTube    : { type: "youtube", id: "動画ID" }
 *                 例) https://www.youtube.com/watch?v=abc123XYZ99 の abc123XYZ99 の部分
 *   SoundCloud : { type: "soundcloud", url: "https://soundcloud.com/..." }
 *   未設定      : { type: "none" } (「動画準備中」と表示されます)
 *
 * links : 制作解説書(PDF)などの追加リンク。url が空なら表示されません。
 * tags  : 作品が7件以上になると、タグでの絞り込みボタンが自動で表示されます。
 */
window.WORKS = [
  {
    title: "作品タイトル 1",
    category: "ゲーム映像 サウンドリデザイン",
    year: "2026",
    description: "使用ツールや担当範囲などを、1〜2行で書いてください。",
    tags: ["SFX"],
    media: { type: "youtube", id: "" },
    links: [{ label: "制作解説書 (PDF)", url: "" }]
  },
  {
    title: "作品タイトル 2",
    category: "ゲーム映像 サウンドリデザイン",
    year: "2026",
    description: "使用ツールや担当範囲などを、1〜2行で書いてください。",
    tags: ["SFX"],
    media: { type: "youtube", id: "" },
    links: [{ label: "制作解説書 (PDF)", url: "" }]
  },
  {
    title: "作品タイトル 3",
    category: "ゲーム映像 サウンドリデザイン",
    year: "2026",
    description: "使用ツールや担当範囲などを、1〜2行で書いてください。",
    tags: ["SFX"],
    media: { type: "youtube", id: "" },
    links: [{ label: "制作解説書 (PDF)", url: "" }]
  }
];
