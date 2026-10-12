/*
 * 枠のない、ひと続きのページに「奥行き」を足す演出(Apple のページのような動き)。
 * - 下から入ってくるセクションの中身は、少し小さく奥にあり、スクロールに合わせて大きく手前に出てきます。
 * - 上へ抜けていくセクションの中身は、すっと薄くなって奥に下がります。
 * - スクロール位置に連動するので、止めれば止まり、戻せば元に戻ります。
 * - 「視差効果を減らす」設定の人には何もかかりません。
 * 強さは下の CONFIG で変えられます。
 */
(function () {
  "use strict";

  var CONFIG = {
    enterScale: 0.93, // 入ってくるときの最初の大きさ(1 で演出なし。小さいほど強い)
    enterSpan: 0.55,  // 画面の下端からどこまで上がる間に出てくるか(0〜1。大きいほどゆっくり)
    exitFade: 0.7,    // 上へ抜けるときに薄くなる量(0 で薄くならない)
    exitScale: 0.04   // 上へ抜けるときに縮む量
  };

  var sections = [].slice.call(document.querySelectorAll("main > section"));
  var header = document.querySelector(".site-header");
  if (!sections.length) return;

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var headerH = 56;
  var ticking = false;
  var natTop = [];
  var maxScroll = 0;

  function ease(t) { return t * t * (3 - 2 * t); }
  function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }

  function layout() {
    headerH = header ? header.offsetHeight : 0;
    // ヘッダーが2段になる狭い画面でも、メニューで飛んだ先が隠れないように
    document.documentElement.style.scrollPaddingTop = headerH + "px";
    maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
    // 各セクションが本来ある位置は、直前の .anchor(高さ0)の位置でわかる
    natTop = sections.map(function (s) {
      var a = s.previousElementSibling;
      return (a && a.classList.contains("anchor")) ? a.getBoundingClientRect().top + window.pageYOffset : null;
    });
    update();
  }

  function update() {
    ticking = false;
    if (reduceMotion) return;
    var vh = window.innerHeight;
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var inner = sec.firstElementChild;
      if (!inner) continue;
      var r = sec.getBoundingClientRect();

      // 入ってくる側(最初のセクションは最初から見えているので対象外)
      var e = 1;
      if (i > 0) {
        // ページの終端で止まるセクション(お問い合わせ)も、止まった位置で「出終わる」ようにする
        var restTop = natTop[i] == null ? 0 : natTop[i] - maxScroll;
        var doneTop = Math.max(vh * (1 - CONFIG.enterSpan), restTop);
        e = ease(clamp01((vh - r.top) / Math.max(vh - doneTop, 1)));
      }

      // 抜けていく側(最後のセクションはページ終端で止まるので対象外)
      var x = 0;
      if (i < sections.length - 1) {
        var band = vh * 0.28;
        x = ease(clamp01((headerH + band - r.bottom) / band));
      }

      if (e >= 1 && x === 0) {
        inner.style.transform = "";
        inner.style.opacity = "";
      } else {
        var scale = (CONFIG.enterScale + (1 - CONFIG.enterScale) * e) * (1 - CONFIG.exitScale * x);
        inner.style.transform = "scale(" + scale.toFixed(4) + ")";
        inner.style.opacity = (1 - CONFIG.exitFade * x).toFixed(3);
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
  document.documentElement.classList.add("has-flow");
  layout();
})();
