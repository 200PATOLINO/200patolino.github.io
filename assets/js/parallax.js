/*
 * パララックス(奥行きのある動き): 要素ごとにスクロールの速さを変えて、層が重なって見えるようにします。
 *  - ヒーロー : 見出し・ボタン・波形が、それぞれ違う速さで遅れてついてきます。
 *  - 各セクションの奥 : 巨大な輪郭文字(ABOUT / WORKS など)が、ゆっくり別の速さで流れます。
 *  - 作品カード : 列ごとに少しずつ速さが違い、サムネイルは枠の中で画像だけが逆向きに動きます。
 *  - 見出しは手前に、プロフィールの表(右側)は奥にあるように動きます。
 * 動きには CSS の translate を使っているので、ほかの演出(transform)とぶつかりません。
 * 強さは下の CONFIG で変えられます。「視差効果を減らす」設定の人には何もかかりません。
 */
(function () {
  "use strict";

  var CONFIG = {
    heroEyebrow: 0.10,   // ヒーロー: 数字が大きいほど、スクロールに遅れてついてくる
    heroTitle: 0.22,
    heroActions: 0.34,
    heroWave: 0.30,      // 背景の波形が上へ流れる速さ(小さいほど奥にある感じ)
    ghost: 0.38,         // 巨大な輪郭文字の遅れ(大きいほど奥にある感じ)
    ghostDrift: 0.14,    // 巨大な輪郭文字の横ずれ
    title: -0.07,        // 見出し(マイナスは「手前」: スクロールより速く動く)
    facts: 0.12,         // プロフィールの表(右側)
    cardColumns: [0, 0.08, 0.16], // 作品カードの列ごとの遅れ(左の列から)
    cardUp: 10,          // 作品カードが「上へ」ずれてよい最大量(px)。上の段の文字に重ならないための上限
    cardDown: 80,        // 作品カードが「下へ」ずれてよい最大量(px)
    thumb: 0.06          // サムネイルの中で画像が動く量(枠の高さに対する割合)
  };

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (reduceMotion) return;

  var vh = window.innerHeight;
  var items = [];
  var ticking = false;
  var canvas = document.getElementById("bg-wave");

  function docY(el) {
    var y = 0;
    while (el) { y += el.offsetTop; el = el.offsetParent; }
    return y;
  }

  function add(el, kind, speed, min, max) {
    if (!el) return;
    items.push({ el: el, kind: kind, speed: speed, min: min, max: max, c: 0, h: 0 });
  }

  function addGhosts() {
    [].slice.call(document.querySelectorAll("main > section")).forEach(function (sec) {
      if (sec.querySelector(":scope > .ghost")) return;
      var a = sec.previousElementSibling;
      if (!a || !a.classList.contains("anchor") || !a.id) return;
      var g = document.createElement("div");
      g.className = "ghost";
      g.setAttribute("aria-hidden", "true");
      g.textContent = a.id.toUpperCase();
      sec.appendChild(g); // .wrap より後ろに入れる(flow.js が最初の子を使うため)
      add(g, "ghost", CONFIG.ghost);
    });
  }

  function collect() {
    items = [];
    var narrow = window.innerWidth < 720;
    var k = narrow ? 0.55 : 1; // 狭い画面では動きを控えめに

    add(document.querySelector(".hero .eyebrow"), "hero", CONFIG.heroEyebrow * k);
    add(document.querySelector(".hero h1"), "hero", CONFIG.heroTitle * k);
    add(document.querySelector(".hero .hero-actions"), "hero", CONFIG.heroActions * k);

    addGhosts();

    [].slice.call(document.querySelectorAll(".section-title")).forEach(function (t) { add(t, "rel", CONFIG.title * k); });
    add(document.querySelector(".about .facts"), "rel", narrow ? 0 : CONFIG.facts);

    // 作品カード: 列ごとに速さを変える(いちばん上の大きなカードは動かさない)
    var cards = [].slice.call(document.querySelectorAll("#works-grid > .card"));
    var lefts = [];
    cards.forEach(function (c) {
      var w = c.parentElement.offsetWidth;
      if (c.offsetWidth > w * 0.9) return;
      if (lefts.indexOf(c.offsetLeft) === -1) lefts.push(c.offsetLeft);
    });
    lefts.sort(function (a, b) { return a - b; });
    cards.forEach(function (c) {
      var w = c.parentElement.offsetWidth;
      if (c.offsetWidth <= w * 0.9) {
        var col = lefts.indexOf(c.offsetLeft);
        add(c, "rel", (CONFIG.cardColumns[Math.min(col, CONFIG.cardColumns.length - 1)] || 0) * k, -CONFIG.cardUp, CONFIG.cardDown);
      }
      var frame = c.querySelector(".thumb-frame");
      var thumb = c.querySelector(".media-thumb");
      if (frame && thumb) items.push({ el: thumb, frame: frame, kind: "thumb", speed: CONFIG.thumb, c: 0, h: 0 });
    });
  }

  function layout() {
    vh = window.innerHeight;
    // 以前に付けた動きを外してから、本来の位置を測り直す
    items.forEach(function (it) { it.el.style.translate = ""; it.el.style.removeProperty("--py"); });
    collect();
    items.forEach(function (it) {
      var m = it.frame || it.el;
      it.h = m.offsetHeight;
      it.c = docY(m) + it.h / 2;
    });
    update();
  }

  function update() {
    ticking = false;
    var y = window.pageYOffset;
    var lim = vh * 0.9;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.kind === "hero") {
        var s = y < vh * 1.2 ? y : vh * 1.2;
        it.el.style.translate = "0 " + (s * it.speed).toFixed(1) + "px";
        continue;
      }
      var off = it.c - y - vh / 2; // 画面の中央からのずれ(下にあるほどプラス)
      if (off > vh * 1.4 || off < -vh * 1.4 - it.h) continue; // 画面から遠いものは動かさない
      var o = off > lim ? lim : off < -lim ? -lim : off;

      if (it.kind === "ghost") {
        it.el.style.translate = (o * CONFIG.ghostDrift).toFixed(1) + "px " + (-o * it.speed).toFixed(1) + "px";
      } else if (it.kind === "thumb") {
        var t = off / (vh / 2 + it.h / 2);
        t = t > 1 ? 1 : t < -1 ? -1 : t;
        it.el.style.setProperty("--py", (-t * it.h * it.speed).toFixed(1) + "px");
      } else {
        var ty = -o * it.speed;
        if (it.min !== undefined) ty = ty < it.min ? it.min : ty > it.max ? it.max : ty;
        it.el.style.translate = "0 " + ty.toFixed(1) + "px";
      }
    }

    if (canvas) canvas.style.translate = "0 " + (-Math.min(y, vh * 1.2) * CONFIG.heroWave).toFixed(1) + "px";
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", layout);
  window.addEventListener("load", layout);
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function () { layout(); });
    [].slice.call(document.querySelectorAll("main > section")).forEach(function (s) { ro.observe(s); });
  }
  // 絞り込みなどでカードが描き直されたときも測り直す
  var grid = document.getElementById("works-grid");
  if (grid && "MutationObserver" in window) {
    new MutationObserver(function () { layout(); }).observe(grid, { childList: true });
  }
  layout();
})();
