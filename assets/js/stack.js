/*
 * スクロールすると、次のセクションが前のセクションの上に「せり上がって」重なる演出。
 * - 各セクションは CSS の position: sticky で止まり、次のセクションがその上を覆います。
 * - 画面より長いセクションは、最後まで読み終えてから止まるよう、止まる位置を自動計算します。
 * - 覆われていくセクションは少しだけ縮んで暗くなり、奥に下がったように見えます。
 * - 「視差効果を減らす」設定の人には、縮小・暗転はかかりません。
 */
(function () {
  "use strict";

  var sections = [].slice.call(document.querySelectorAll("main > section"));
  var header = document.querySelector(".site-header");
  if (sections.length < 2) return;

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var headerH = 56;
  var ticking = false;

  function layout() {
    headerH = header ? header.offsetHeight : 0;
    var vh = window.innerHeight;
    sections.forEach(function (s) {
      // 短いセクション: ヘッダーのすぐ下で止まる / 長いセクション: 下端が画面下に来たところで止まる
      var top = Math.min(headerH, vh - s.offsetHeight);
      s.style.top = top + "px";
    });
    update();
  }

  function update() {
    ticking = false;
    if (reduceMotion) return;
    var vh = window.innerHeight;
    var range = Math.max(vh - headerH, 1);
    for (var i = 0; i < sections.length; i++) {
      var inner = sections[i].firstElementChild;
      if (!inner) continue;
      var next = sections[i + 1];
      var p = 0;
      if (next) {
        p = (vh - next.getBoundingClientRect().top) / range;
        p = p < 0 ? 0 : p > 1 ? 1 : p;
      }
      if (p === 0) {
        inner.style.transform = "";
        inner.style.opacity = "";
      } else {
        inner.style.transform = "scale(" + (1 - 0.05 * p).toFixed(4) + ")";
        inner.style.opacity = (1 - 0.65 * p).toFixed(3);
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
