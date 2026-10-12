/*
 * 作品データ
 * ----------------------------------------------------------
 * 作品を増やすときは、下の { ... }, のかたまりを1つコピーして
 * 配列の中(最後の ]; より上)に貼り付けるだけです。
 * 各かたまりの間は「},」でつなぎ、最後のかたまりだけ「}」で終わります。
 *
 * media の書き方
 *   YouTube    : { type: "youtube", id: "動画ID" }
 *                 例) https://www.youtube.com/watch?v=abc123XYZ99 の abc123XYZ99 の部分
 *   SoundCloud : { type: "soundcloud", url: "https://soundcloud.com/..." }
 *   未設定      : { type: "none" } (「動画準備中」と表示されます)
 *
 * links : 制作解説書(PDF)などの追加リンク。url が空なら表示されません。
 * en    : 英語ページ用の上書き。category / description / tags / links などを英語で書けます(書かない項目は日本語のまま)。
 * tags  : 作品が7件以上になると、タグでの絞り込みボタンが自動で表示されます。
 */
window.WORKS = [
  {
    title: "Game Skill Redesign",
    category: "ゲーム映像 サウンドリデザイン (黒い砂漠)",
    year: "2026",
    description: "使用ツール:Logic Pro。ライブラリ:Soundly、Splice。制作期間1週間。",
    tags: ["SFX", "Skill"],
    media: { type: "youtube", id: "-uvS4SlQrh0" },
    links: [{ label: "制作解説書 (PDF)", url: "" }],
    en: {
      category: "Game footage sound redesign (Black Desert)",
      description: "Tools: Logic Pro. Libraries: Soundly, Splice. Production time: 1 week.",
      links: [{ label: "Production notes (PDF)", url: "" }]
    }
  },
  {
    title: "BIFSC 2026 Finalist",
    category: "映像 サウンドリデザイン (Berlin International Sound Design Competition)",
    year: "2026",
    description: "使用ツール:Logic Pro。ライブラリ:Soundly、Splice。自分で収録したFoleyも使用。制作期間1か月。",
    tags: ["SFX", "短編映像", "Finalist"],
    media: { type: "youtube", id: "zdIdv4i0clI" },
    links: [{ label: "制作解説書 (PDF)", url: "" }],
    en: {
      category: "Film sound redesign (Berlin International Sound Design Competition)",
      description: "Tools: Logic Pro. Libraries: Soundly, Splice. Also used Foley I recorded myself. Production time: 1 month.",
      tags: ["SFX", "Short film", "Finalist"],
      links: [{ label: "Production notes (PDF)", url: "" }]
    }
  },
  {
    title: "CAPCOM Contest",
    category: "ゲーム映像 サウンドリデザイン",
    year: "2026",
    description: "使用ツール:Logic Pro。ライブラリ:Soundly、Splice。自分で収録したFoleyも使用。制作期間約40時間。",
    tags: ["SFX", "Foley"],
    media: { type: "youtube", id: "CBrUTeC69t4" },
    links: [{ label: "制作解説書 (PDF)", url: "" }],
    en: {
      category: "Game sound redesign",
      description: "Tools: Logic Pro. Libraries: Soundly, Splice. Also used Foley I recorded myself. Production time: approx. 40 hours.",
      links: [{ label: "Production notes (PDF)", url: "" }]
    }
  },
  {
    title: "Borrowed Skin",
    category: "ゲームジャム作品 (Brackeys Game Jam 2026.2)",
    year: "2026",
    description: "一人称視点のナラティブホラー。担当:効果音(SFX)。クレジット名:SoMok0617。",
    tags: ["SFX", "Game Jam"],
    media: { type: "none" },
    thumb: "https://img.itch.zone/aW1nLzI5NjExNjgwLnBuZw==/508x254%23mb/UWWhdy.png",
    links: [{ label: "itch.io でプレイ", url: "https://luvbytes404.itch.io/borrowed-skin-moonmoss" }],
    en: {
      category: "Game jam entry (Brackeys Game Jam 2026.2)",
      description: "A first-person narrative horror game. Role: sound effects (SFX). Credited as SoMok0617.",
      links: [{ label: "Play on itch.io", url: "https://luvbytes404.itch.io/borrowed-skin-moonmoss" }]
    }
  }
];
