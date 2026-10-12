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

  /* ---------- 自動ページ送り(マウス・トラックパッド・キーボード) ---------- */
  // 少し回すだけで、次(前)のページまで「すっ」と滑って切り替わる。
  // 画面より長いページ(作品)は、中では普通にスクロールでき、端まで来たら次のページへ。
  if (!reduceMotion && window.matchMedia && window.matchMedia("(pointer: fine)").matches) initAutoPaging();

  function initAutoPaging() {
    var DURATION = 760;   // 切り替わりにかかる時間(ミリ秒)
    var animating = false;
    var lockUntil = 0;    // 慣性スクロールで続けて何ページも飛ばないように、入力を受け付けない期限
    var raf = 0;

    function header() { var h = document.querySelector(".site-header"); return h ? h.offsetHeight : 56; }

    function metrics() {
      var vh = window.innerHeight, hh = header(), y = window.pageYOffset;
      var maxScroll = Math.max(document.documentElement.scrollHeight - vh, 0);
      var list = sections.map(function (s, i) {
        var T = Math.min(Math.round(s.getBoundingClientRect().top + y - hh), maxScroll); // ページの先頭
        // ページの終わり(内容の下端が画面の下に来る位置)。下の余白は内容ではないので、24px だけ残して無視する
        var pad = Math.max((parseFloat(getComputedStyle(s).paddingBottom) || 0) - 24, 0);
        var E = Math.max(T, T + s.offsetHeight - pad - (vh - hh));
        if (i === sections.length - 1) E = maxScroll;
        return { T: T, E: Math.min(E, maxScroll) };
      });
      return { y: y, vh: vh, maxScroll: maxScroll, list: list };
    }

    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function animateTo(target) {
      cancelAnimationFrame(raf);
      var start = window.pageYOffset, dist = target - start;
      if (Math.abs(dist) < 1) { animating = false; return; }
      animating = true;
      var html = document.documentElement;
      html.style.scrollBehavior = "auto";
      var t0 = performance.now();
      (function step(now) {
        var p = Math.min((now - t0) / DURATION, 1);
        window.scrollTo({ top: start + dist * ease(p), behavior: "instant" });
        if (p < 1) { raf = requestAnimationFrame(step); return; }
        animating = false;
        html.style.scrollBehavior = "";
        lockUntil = performance.now() + 180;
      })(t0);
    }

    // 入力(dy: 下が正)に対して、どうするか。null = ブラウザ標準のスクロールに任せる
    function decide(dy) {
      var m = metrics(), y = m.y, last = sections.length - 1, i = 0;
      for (var k = 0; k <= last; k++) if (m.list[k].T <= y + 2) i = k;
      var P = m.list[i];
      if (dy > 0) {
        if (y >= P.E - 1) return i < last ? m.list[i + 1].T : null;
        return (y + dy < P.E) ? null : P.E;
      }
      if (y > P.E + 1) return P.E;
      if (y > P.T + 1) return (y + dy > P.T) ? null : P.T;
      return i > 0 ? m.list[i - 1].E : null;
    }

    function handle(dy, e) {
      var now = performance.now();
      if (animating || now < lockUntil) {
        e.preventDefault();
        if (!animating) lockUntil = Math.max(lockUntil, now + 160); // 慣性が続いている間は受け付けない
        return;
      }
      var target = decide(dy);
      if (target == null) return;
      e.preventDefault();
      animateTo(target);
    }

    function blocked() { return root.classList.contains("modal-open"); }

    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey || blocked()) return;
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      if (Math.abs(e.deltaX) > Math.abs(dy) || Math.abs(dy) < 2) return;
      handle(dy, e);
    }, { passive: false });

    window.addEventListener("keydown", function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || blocked()) return;
      var t = e.target, tag = t && t.tagName;
      if (tag && (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || t.isContentEditable)) return;
      var vh = window.innerHeight, dy = 0;
      if (e.key === " " && /^(BUTTON|A)$/.test(tag || "")) return; // ボタンの決定キーはそのまま
      if (e.key === "PageDown" || (e.key === " " && !e.shiftKey)) dy = vh * 0.85;
      else if (e.key === "PageUp" || (e.key === " " && e.shiftKey)) dy = -vh * 0.85;
      else if (e.key === "ArrowDown") dy = 80;
      else if (e.key === "ArrowUp") dy = -80;
      else if (e.key === "Home") { e.preventDefault(); animateTo(0); return; }
      else if (e.key === "End") { e.preventDefault(); animateTo(metrics().maxScroll); return; }
      else return;
      handle(dy, e);
    });
  }

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
