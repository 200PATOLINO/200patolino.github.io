/*
 * スクロールで要素が下から「ぽんっ」と現れる演出。
 * - 見出し・カード・経歴・受賞歴・連絡先などが、画面に入るタイミングで順番に浮かび上がります。
 * - 強さや速さは、下の CONFIG だけ触れば変えられます。
 * - 「視差効果を減らす」設定の人、JavaScript が動かない環境では、何も隠さず普通に表示されます。
 */
(function () {
  "use strict";

  var CONFIG = {
    stagger: 90,     // 同じ行のカードが順番に出る間隔(ミリ秒)
    heroStagger: 130 // 最初の画面(ヒーロー)の文字・ボタンが出る間隔
  };

  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var SELECTORS = [
    ".hero-inner > *",
    ".section-title",
    ".about-text > p",
    ".timeline li",
    ".facts",
    ".award",
    ".card",
    ".contact-lead",
    ".contact-mail",
    ".link-list"
  ].join(",");

  var root = document.documentElement;
  var io = new IntersectionObserver(onIntersect, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });

  function show(node) {
    node.classList.add("is-in");
    io.unobserve(node);
    // 出終わったら演出用のクラスを外す(ホバー動作などと干渉させないため)
    setTimeout(function () {
      node.classList.remove("reveal", "is-in");
      node.style.removeProperty("--rd");
    }, 1500);
  }

  function onIntersect(entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) show(e.target);
      else if (e.boundingClientRect.top < 0) show(e.target); // すでに通り過ぎた要素は、隠れたままにしない
    });
  }

  function prepare(scope) {
    var nodes = [].slice.call(scope.querySelectorAll(SELECTORS));
    var counters = new Map();
    nodes.forEach(function (n) {
      if (n.classList.contains("reveal")) return;
      var parent = n.parentElement;
      var idx = counters.get(parent) || 0;
      counters.set(parent, idx + 1);
      var inHero = !!n.closest(".hero-inner");
      var delay = inHero ? idx * CONFIG.heroStagger
        : n.classList.contains("card") ? (idx % 3) * CONFIG.stagger
        : Math.min(idx, 4) * 70;
      n.style.setProperty("--rd", delay + "ms");
      n.classList.add("reveal");
      io.observe(n);
    });
  }

  root.classList.add("has-reveal");
  prepare(document);

  // 絞り込みなどでカードが描き直されたときも演出をかける
  var grid = document.getElementById("works-grid");
  if (grid && "MutationObserver" in window) {
    new MutationObserver(function () { prepare(grid); }).observe(grid, { childList: true });
  }
})();
