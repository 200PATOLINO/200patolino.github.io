/*
 * スクロールすると、次のセクションが前のセクションの上に「せり上がって」重なる演出。
 * - 各セクションは CSS の position: sticky で止まり、次のセクションがその上を覆います。
 * - 画面より長いセクションは、止めずに普通にスクロールします(次のセクションが最後の行を覆わないように)。
 * - 覆われていくセクションは少しだけ縮んで暗くなり、奥に下がったように見えます。
 * - 下から上がってくるセクションは、最初は小さく奥にあり、スクロールに合わせて大きく手前に出てきます(Apple のページのような奥行き)。
 *   強さは CONFIG の enterScale(小さいほど強い)と enterRadius で変えられます。
 * - 「視差効果を減らす」設定の人には、縮小・暗転はかかりません。
 */
(function () {
  "use strict";

  var sections = [].slice.call(document.querySelectorAll("main > section"));
  var header = document.querySelector(".site-header");
  if (sections.length < 2) return;

  var CONFIG = {
    enterScale: 0.88,  // 入ってくるときの最初の大きさ(1 で演出なし。0.85 くらいまでが目安)
    enterRadius: 28,   // 入ってくるときに追加される角の丸み(px)
    enterSpan: 0.7,    // 画面の下端からどこまで上がる間に出てくるか(0〜1。大きいほどゆっくり)
    recedeScale: 0.07  // 覆われる側が縮む量
  };

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var headerH = 56;
  var ticking = false;
  var natTop = [];   // 各セクションが本来あるべき位置(文書の上端からの距離)
  var maxScroll = 0;

  function layout() {
    headerH = header ? header.offsetHeight : 0;
    // ヘッダーが2段になる狭い画面でも、メニューで飛んだ先が隠れないように
    document.documentElement.style.scrollPaddingTop = headerH + "px";
    var vh = window.innerHeight;
    sections.forEach(function (s) {
      // 短いセクション: ヘッダーのすぐ下で止まり、次のセクションが上に重なる
      // 画面より長いセクション: 止めずに普通にスクロールさせる
      //   (止めると、ページ終端付近で次のセクションが最後の行を覆って読めなくなるため)
      var tall = s.offsetHeight > vh - headerH;
      s.style.position = tall ? "relative" : "";
      s.style.top = tall ? "" : headerH + "px";
    });
    // 固定される前の本来の位置は、直前の .anchor(高さ0)の位置でわかる
    maxScroll = Math.max(document.documentElement.scrollHeight - vh, 0);
    natTop = sections.map(function (s) {
      var a = s.previousElementSibling;
      return (a && a.classList.contains("anchor")) ? a.getBoundingClientRect().top + window.pageYOffset : null;
    });
    update();
  }

  function ease(t) { return t * t * (3 - 2 * t); }

  function update() {
    ticking = false;
    if (reduceMotion) return;
    var vh = window.innerHeight;
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var inner = sec.firstElementChild;
      if (!inner) continue;
      var r = sec.getBoundingClientRect();

      // --- 入ってくる側: 下から上がる間に、小さく奥 → 大きく手前へ ---
      var e = 1;
      if (i > 0) {
        // ページ終端で止まるセクション(お問い合わせ)も、止まった位置で「出終わる」ようにする
        var restTop = natTop[i] == null ? 0 : natTop[i] - maxScroll;
        var doneTop = Math.max(vh * (1 - CONFIG.enterSpan), restTop);
        e = (vh - r.top) / Math.max(vh - doneTop, 1);
        e = e < 0 ? 0 : e > 1 ? 1 : e;
        e = ease(e);
      }
      if (e >= 1) {
        sec.style.transform = "";
        sec.style.borderRadius = "";
      } else {
        sec.style.transform = "scale(" + (CONFIG.enterScale + (1 - CONFIG.enterScale) * e).toFixed(4) + ")";
        var rad = (22 + CONFIG.enterRadius * (1 - e)).toFixed(1) + "px";
        sec.style.borderRadius = rad + " " + rad + " 0 0";
      }

      // --- 覆われる側: 次のセクションが重なり始めたら、少し縮んで暗くなる ---
      var next = sections[i + 1];
      var p = 0;
      if (next) {
        var bottom = Math.min(r.bottom, vh);
        var range = Math.max(bottom - headerH, 1);
        p = (bottom - next.getBoundingClientRect().top) / range;
        p = p < 0 ? 0 : p > 1 ? 1 : p;
      }
      var fade = 0.4 + 0.6 * e; // 入ってくる間は中身も少し暗い → 明るくなる
      if (p === 0 && e >= 1) {
        inner.style.transform = "";
        inner.style.opacity = "";
      } else {
        inner.style.transform = p ? "scale(" + (1 - CONFIG.recedeScale * p).toFixed(4) + ")" : "";
        inner.style.opacity = (fade * (1 - 0.65 * p)).toFixed(3);
      }
    }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", layout);
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function () { layout(); });
    sections.forEach(function (s) { ro.observe(s); });
  }
  window.addEventListener("load", layout);
  document.documentElement.classList.add("has-stack");
  layout();
})();
