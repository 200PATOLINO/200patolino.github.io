/*
 * 「ページ送り」の演出: 画面1枚ぶん(セクション)ごとに、入ってきたときだけ決まった動きが再生され、
 * スクロールすると次のページがぴたっと切り替わります。ずっと動き続けるものはありません。
 *  - 各ページに入ると、見出し・本文・カードが順番に現れます(ページごとに少しずつ違う動き)。
 *  - ページから完全に出ると元に戻るので、戻ってきたときにもう一度再生されます。
 *  - 右端の点でページを選べます(広い画面のみ)。
 *  - 「視差効果を減らす」設定の人は、動きなしで最初から全部表示されます。
 * 動きの細かい調整は style.css の「ページ送り」の部分を編集してください。
 */
(function () {
  "use strict";

  var sections = [].slice.call(document.querySelectorAll("main > section"));
  if (!sections.length) return;

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var root = document.documentElement;
  var canAnimate = !reduceMotion && "IntersectionObserver" in window;

  function nameOf(sec, i) {
    var a = sec.previousElementSibling;
    return (a && a.classList.contains("anchor") && a.id) ? a.id : (i === 0 ? "top" : "page" + i);
  }

  /* ---------- 奥に静止して置かれる巨大な輪郭文字 ---------- */
  sections.forEach(function (sec, i) {
    var a = sec.previousElementSibling;
    if (!a || !a.classList.contains("anchor") || !a.id || sec.querySelector(":scope > .ghost")) return;
    var g = document.createElement("div");
    g.className = "ghost";
    g.setAttribute("aria-hidden", "true");
    g.textContent = a.id.toUpperCase();
    sec.appendChild(g); // .wrap より後ろ(先頭の子を他のスクリプトが使っても影響しないように)
  });

  /* ---------- 右端のページ点(広い画面のみ表示) ---------- */
  var pager = document.createElement("nav");
  pager.className = "pager";
  pager.setAttribute("aria-label", "Pages");
  var dots = sections.map(function (sec, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pager-dot";
    var name = nameOf(sec, i);
    b.setAttribute("aria-label", name);
    b.title = name.charAt(0).toUpperCase() + name.slice(1);
    b.addEventListener("click", function () {
      var a = sec.previousElementSibling;
      var target = (a && a.classList.contains("anchor")) ? a : sec;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    pager.appendChild(b);
    return b;
  });
  document.body.appendChild(pager);

  var current = -1;
  function updatePager() {
    var line = window.innerHeight * 0.4;
    var idx = 0;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= line) idx = i;
    }
    if (window.pageYOffset + window.innerHeight >= document.documentElement.scrollHeight - 2) idx = sections.length - 1;
    if (idx === current) return;
    current = idx;
    dots.forEach(function (d, k) {
      d.classList.toggle("is-active", k === idx);
      if (k === idx) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
    });
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; updatePager(); }); }
  }, { passive: true });
  window.addEventListener("resize", updatePager);
  updatePager();

  if (!canAnimate) return;

  /* ---------- 入場アニメーションの対象を決める ---------- */
  // pg = 下から浮かび上がる / wipe = 左から右へ現れる。--i は現れる順番
  function mark(scope) {
    function tag(nodes, kind, start) {
      [].slice.call(nodes).forEach(function (n, k) {
        if (n.classList.contains("pg") || n.classList.contains("pg-wipe")) return;
        n.classList.add(kind);
        n.style.setProperty("--i", (start || 0) + k);
      });
    }
    [].slice.call(scope.querySelectorAll("main > section")).forEach(function (sec) {
      var q = function (s) { return sec.querySelectorAll(s); };
      if (sec.classList.contains("hero")) {
        tag(q(".eyebrow"), "pg", 0);
        tag(q("h1"), "pg-wipe", 1);
        tag(q(".hero-actions"), "pg", 3);
        return;
      }
      tag(q(".section-title"), "pg-wipe", 0);
      tag(q(".about-lead"), "pg", 2);
      tag(q(".about-text > p:not(.about-lead)"), "pg", 3);
      tag(q(".timeline li"), "pg", 5);
      tag(q(".facts"), "pg", 3);
      tag(q(".award"), "pg", 2);
      tag(q(".card"), "pg", 2);
      tag(q(".contact-lead"), "pg", 2);
      tag(q(".contact-mail"), "pg-wipe", 3);
      tag(q(".link-list"), "pg", 5);
    });
  }
  mark(document);
  root.classList.add("has-pages");

  var grid = document.getElementById("works-grid");
  if (grid && "MutationObserver" in window) {
    new MutationObserver(function () { mark(document); }).observe(grid, { childList: true });
  }

  /* ---------- 入る/出るの検知 ---------- */
  // 追加: 画面の真ん中あたりに入ったら再生 / 削除: 画面から完全に出たら元に戻す(次に入るとまた再生)
  var enter = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("in-view"); });
  }, { rootMargin: "-32% 0px -32% 0px", threshold: 0 });

  var leave = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (!e.isIntersecting) e.target.classList.remove("in-view"); });
  }, { threshold: 0 });

  sections.forEach(function (s) { enter.observe(s); leave.observe(s); });

  // 念のため: ページの一番下まで来たら、見えているセクションは必ず再生済みにする
  window.addEventListener("scroll", function () {
    if (window.pageYOffset + window.innerHeight < document.documentElement.scrollHeight - 2) return;
    sections.forEach(function (s) {
      var r = s.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) s.classList.add("in-view");
    });
  }, { passive: true });
})();
