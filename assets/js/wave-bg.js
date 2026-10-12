/*
 * ページ全体の背景に流れる波形。
 * - 画面に固定され、スクロールしても背景として残ります(音は鳴りません)。
 * - 波形の近くでポインタを動かす/タップすると、弦のように揺れます。
 * 色や強さを変えたいときは、下の CONFIG だけ触れば大丈夫です。
 */
(function () {
  "use strict";

  var canvas = document.getElementById("bg-wave");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var CONFIG = {
    points: 220,          // 波形の細かさ
    tension: 0.45,        // 波の伝わる速さ
    damping: 0.012,       // 揺れが収まる速さ
    peakAt: 0.62,         // この振幅を超えるとピーク色(赤)
    line: "236, 208, 111",// 波形の色 (R, G, B)
    peak: "209, 72, 54",  // ピークの色
    opacity: 0.5          // 背景として控えめに見せる濃さ(0〜1)
  };

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var N = CONFIG.points;
  var y = new Float32Array(N);
  var v = new Float32Array(N);
  var w = 0, h = 0, dpr = 1, base = 0, amp = 0;
  var raf = 0;
  var pointer = { active: false, lastY: 0 };
  var flip = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    base = h * (w < 720 ? 0.74 : 0.7);
    amp = Math.max(40, Math.min(h * 0.19, 160));
    kick();
  }

  function idle(i, t) {
    if (reduceMotion) return 0.12 * Math.sin(i * 0.07) * Math.sin(i * 0.021 + 1);
    return 0.13 * Math.sin(i * 0.07 + t * 0.0014) * Math.sin(i * 0.021 - t * 0.0006) +
           0.05 * Math.sin(i * 0.19 - t * 0.002);
  }

  function step() {
    var c = CONFIG.tension, d = CONFIG.damping;
    for (var k = 0; k < 2; k++) {
      for (var i = 1; i < N - 1; i++) {
        v[i] += c * (y[i - 1] + y[i + 1] - 2 * y[i]) - d * v[i];
      }
      for (var j = 1; j < N - 1; j++) {
        y[j] += v[j];
        if (y[j] > 1.1) y[j] = 1.1; else if (y[j] < -1.1) y[j] = -1.1;
      }
    }
  }

  function pluck(px, strength) {
    var centre = (px / Math.max(w, 1)) * (N - 1);
    var radius = 6;
    for (var i = Math.max(1, Math.floor(centre - radius * 2)); i <= Math.min(N - 2, Math.ceil(centre + radius * 2)); i++) {
      var dd = (i - centre) / radius;
      v[i] += strength * Math.exp(-dd * dd * 2.2);
    }
  }

  function energy() {
    var e = 0;
    for (var i = 0; i < N; i++) e += Math.abs(v[i]) + Math.abs(y[i]);
    return e;
  }

  function pointAt(i, t, mirror) {
    var taper = Math.pow(Math.sin(Math.PI * i / (N - 1)), 0.7);
    var d = (y[i] + idle(i, t)) * taper;
    return { x: (i / (N - 1)) * w, y: base - (mirror ? -d : d) * amp, d: d };
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = CONFIG.opacity;

    ctx.strokeStyle = "rgba(242, 240, 235, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, base); ctx.lineTo(w, base);
    ctx.stroke();

    var pts = [], i;
    for (i = 0; i < N; i++) pts.push(pointAt(i, t, false));

    // 反射(水面に映ったような薄い線)
    ctx.strokeStyle = "rgba(" + CONFIG.line + ", 0.16)";
    ctx.beginPath();
    for (i = 0; i < N; i++) {
      var m = pointAt(i, t, true);
      if (i === 0) ctx.moveTo(m.x, m.y); else ctx.lineTo(m.x, m.y);
    }
    ctx.stroke();

    // 本体
    ctx.strokeStyle = "rgb(" + CONFIG.line + ")";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (i = 0; i < N; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y); else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // ピーク(大きく振れた部分)は赤で上書き
    ctx.strokeStyle = "rgb(" + CONFIG.peak + ")";
    ctx.lineWidth = 2.4;
    for (i = 1; i < N; i++) {
      if (Math.abs(pts[i].d) > CONFIG.peakAt || Math.abs(pts[i - 1].d) > CONFIG.peakAt) {
        ctx.beginPath();
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function shouldRun() {
    if (document.hidden) return false;
    if (!reduceMotion) return true;
    return energy() > 0.002;
  }

  function frame(now) {
    raf = 0;
    step();
    draw(now);
    if (shouldRun()) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  /* ---------- 入力(音は鳴りません) ---------- */
  window.addEventListener("pointermove", function (e) {
    if (!pointer.active) { pointer.active = true; pointer.lastY = e.clientY; return; }
    var vy = e.clientY - pointer.lastY;
    pointer.lastY = e.clientY;
    var near = Math.exp(-Math.pow((e.clientY - base) / (h * 0.3), 2));
    var strength = Math.max(-1, Math.min(1, vy / 28)) * 0.3 * near;
    if (Math.abs(strength) > 0.004) { pluck(e.clientX, strength); kick(); }
  }, { passive: true });
  document.addEventListener("pointerleave", function () { pointer.active = false; });

  window.addEventListener("pointerdown", function (e) {
    if (e.target.closest && e.target.closest("a, button, iframe, dialog")) return;
    var near = Math.exp(-Math.pow((e.clientY - base) / (h * 0.3), 2));
    flip = -flip;
    pluck(e.clientX, flip * 1.2 * near);
    kick();
  }, { passive: true });

  document.addEventListener("visibilitychange", kick);

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 80);
  });

  resize();
})();
