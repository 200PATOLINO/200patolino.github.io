/*
 * サイト共通の設定(連絡先など)
 * url が空("")のリンクは表示されません。作成したら URL を入れるだけで表示されます。
 * tools : About の「使用ツール」に並ぶ名前です。増減は自由です。空 [] なら行ごと非表示になります。
 * awards: 「受賞歴」に並ぶ項目です。上から順に表示されます。空 [] ならセクションごと非表示になります。
 *         title = 賞の名前 / detail = 作品名や補足(なくてもOK) / year = 年(書いたときだけ表示)
 */
window.SITE = {
  email: "leeseongmin1996@gmail.com",
  tools: ["Reaper", "Logic Pro", "Pro Tools", "Wwise"],
  awards: [
    { title: "カプコン サウンドインターンシップ コンテスト SFX部門 優秀賞", detail: "PRAGMATA サウンドリデザイン" },
    { title: "バンダイナムコスタジオ サウンドMAチャレンジコンテスト 入賞", detail: "テイルズ オブ アライズ カットシーンの効果音制作・MA" },
    { title: "ベルリン国際サウンドデザインコンテスト ファイナリスト", detail: "" }
  ],
  links: [
    { label: "YouTube", url: "" },
    { label: "SoundCloud", url: "" },
    { label: "GitHub", url: "https://github.com/SOMOKs1" }
  ]
};
