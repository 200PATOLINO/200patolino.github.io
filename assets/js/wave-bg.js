/*
 * ページ背景に流れる波形(装飾のみ)。
 * - クリックやマウスには反応しません。ゆっくり流れるだけです。
 * - 最初の画面(ヒーロー)の後ろに見え、下のセクションが上に重なると隠れます。
 * 色や強さを変えたいときは、下の CONFIG だけ触れば大丈夫です。
 */
(function () {
  "use strict";

  var canvas = document.getElementById("bg-wave");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var CONFIG = {
    points: 220,           // 波形の細かさ
    line: "236, 208, 111", // 波形の色 (R, G, B)
    opacity: 0.5,          // 濃さ(0〜1)
    speed: 1               // 流れる速さ(0 で止まる)
  };

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var N = CONFIG.points;
  var w = 0, h = 0, dpr = 1, base = 0, amp = 0;
  var raf = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    base = h * (w < 720 ? 0.74 : 0.7);
    amp = Math.max(40, Math.min(h * 0.19, 160));
    if (reduceMotion) draw(0); else kick();
  }

  function shape(i, t) {
    t *= CONFIG.speed;
    return 0.13 * Math.sin(i * 0.07 + t * 0.0014) * Math.sin(i * 0.021 - t * 0.0006) +
           0.05 * Math.sin(i * 0.19 - t * 0.002);
  }

  function pointAt(i, t, mirror) {
    var taper = Math.pow(Math.sin(Math.PI * i / (N - 1)), 0.7);
    var d = shape(i, t) * taper;
    return { x: (i / (N - 1)) * w, y: base - (mirror ? -d : d) * amp };
  }

  function path(t, mirror) {
    ctx.beginPath();
    for (var i = 0; i < N; i++) {
      var p = pointAt(i, t, mirror);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = CONFIG.opacity;

    ctx.strokeStyle = "rgba(242, 240, 235, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, base); ctx.lineTo(w, base);
    ctx.stroke();

    ctx.strokeStyle = "rgba(" + CONFIG.line + ", 0.16)";
    path(t, true);

    ctx.strokeStyle = "rgb(" + CONFIG.line + ")";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    path(t, false);

    ctx.globalAlpha = 1;
  }

  // ヒーローが下のセクションに完全に隠れたら描画を止めて省電力
  function heroVisible() {
    return window.scrollY < h;
  }

  // ヒーローから離れるにつれて、波形をすっと消していく(セクションに背景がないため)
  function fade() {
    var o = 1 - window.scrollY / (h * 0.8);
    canvas.style.opacity = o < 0 ? 0 : o > 1 ? 1 : o.toFixed(3);
  }

  function frame(now) {
    raf = 0;
    if (document.hidden || !heroVisible()) return;
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (reduceMotion) return;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", kick);
  window.addEventListener("scroll", function () { fade(); kick(); }, { passive: true });

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 80);
  });

  resize();
})();
