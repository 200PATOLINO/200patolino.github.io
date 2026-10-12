/*
 * ヒーローの「弾ける波形」。
 * - 波形の近くでポインタを動かすと、弦のように揺れます。
 * - クリック/タップで、Web Audio で合成した効果音が鳴ります(音源ファイルは使っていません)。
 * - 音を出したくない人向けに「音 OFF」ボタンがあります。
 * 色や波形の細かさを変えたいときは、下の CONFIG だけ触れば大丈夫です。
 */
(function () {
  "use strict";

  var hero = document.getElementById("hero");
  var canvas = document.getElementById("hero-canvas");
  if (!hero || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var CONFIG = {
    points: 220,          // 波形の細かさ
    tension: 0.45,        // 波の伝わる速さ
    damping: 0.012,       // 揺れが収まる速さ
    peakAt: 0.62,         // この振幅を超えると琥珀色(ピーク表示)
    teal: "94, 234, 212",
    amber: "255, 179, 71"
  };

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var N = CONFIG.points;
  var y = new Float32Array(N);
  var v = new Float32Array(N);
  var w = 0, h = 0, dpr = 1, base = 0, amp = 0;
  var rings = [];
  var level = 0;
  var raf = 0;
  var visible = true;
  var pointer = { active: false, lastY: 0 };
  var flip = 1;

  /* ---------- レベルメーター ---------- */
  var meter = document.getElementById("hero-meter");
  var segs = [];
  var lit = -1;
  var SEG = 14;
  if (meter) {
    for (var s = 0; s < SEG; s++) {
      var seg = document.createElement("span");
      if (s >= SEG - 3) seg.className = "peak";
      meter.appendChild(seg);
      segs.push(seg);
    }
  }
  function drawMeter() {
    var count = Math.round(Math.min(level, 1) * SEG);
    if (count === lit) return;
    lit = count;
    for (var i = 0; i < segs.length; i++) segs[i].classList.toggle("on", i < count);
  }

  /* ---------- 効果音(Web Audio で合成) ---------- */
  var AC = window.AudioContext || window.webkitAudioContext;
  var ac = null, master = null, noise = null;
  var soundOn = true;
  var sfxIndex = Math.floor(Math.random() * 4);
  var sfxLabel = document.getElementById("hero-sfx");

  function ensureAudio() {
    if (!AC) return null;
    if (!ac) {
      ac = new AC();
      var comp = ac.createDynamicsCompressor();
      master = ac.createGain();
      master.gain.value = 0.5;
      master.connect(comp);
      comp.connect(ac.destination);
      noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      var data = noise.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ac.state === "suspended") ac.resume();
    return ac;
  }

  function env(gain, t, attack, peak, end) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + end);
  }
  function osc(type, f0, f1, t, dur) {
    var o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    return o;
  }
  function noiseSrc() {
    var n = ac.createBufferSource();
    n.buffer = noise;
    n.loop = true;
    return n;
  }

  var SFX = [
    { name: "Pickup", play: function (t, f) {
      var o = osc("square", 880 * f, 880 * f, t, 0.3);
      o.frequency.setValueAtTime(1320 * f, t + 0.07);
      var g = ac.createGain();
      env(g, t, 0.005, 0.35, 0.3);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.32);
    } },
    { name: "Laser", play: function (t, f) {
      var o = osc("sawtooth", 1800 * f, 160, t, 0.3);
      var lp = ac.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 3200;
      var g = ac.createGain();
      env(g, t, 0.005, 0.3, 0.32);
      o.connect(lp); lp.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.34);
    } },
    { name: "Impact", play: function (t, f) {
      var o = osc("sine", 170 * f, 38, t, 0.32);
      var g = ac.createGain();
      env(g, t, 0.004, 0.9, 0.34);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.36);
      var n = noiseSrc();
      var bp = ac.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = 0.8;
      var gn = ac.createGain();
      env(gn, t, 0.002, 0.45, 0.2);
      n.connect(bp); bp.connect(gn); gn.connect(master);
      n.start(t); n.stop(t + 0.22);
    } },
    { name: "Whoosh", play: function (t, f) {
      var n = noiseSrc();
      var bp = ac.createBiquadFilter();
      bp.type = "bandpass"; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(300, t);
      bp.frequency.exponentialRampToValueAtTime(3000 * f, t + 0.5);
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.7, t + 0.22);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      n.connect(bp); bp.connect(g); g.connect(master);
      n.start(t); n.stop(t + 0.58);
    } }
  ];

  function playSfx(xRatio) {
    var item = SFX[sfxIndex % SFX.length];
    sfxIndex++;
    if (sfxLabel) sfxLabel.textContent = item.name;
    if (!soundOn || !ensureAudio()) return;
    item.play(ac.currentTime + 0.01, 0.7 + xRatio * 0.9);
  }

  /* ---------- 描画 ---------- */
  function resize() {
    var r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    base = h * (w < 720 ? 0.72 : 0.67);
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

    // 基準線
    ctx.strokeStyle = "rgba(232, 238, 238, 0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, base); ctx.lineTo(w, base);
    ctx.stroke();

    // 広がる輪(クリックの手応え)
    for (var r = rings.length - 1; r >= 0; r--) {
      var ring = rings[r];
      ring.r += 5; ring.a *= 0.94;
      if (ring.a < 0.02) { rings.splice(r, 1); continue; }
      ctx.strokeStyle = "rgba(" + CONFIG.teal + "," + ring.a.toFixed(3) + ")";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    var pts = [], peak = 0, i;
    for (i = 0; i < N; i++) {
      var p = pointAt(i, t, false);
      pts.push(p);
      if (Math.abs(p.d) > peak) peak = Math.abs(p.d);
    }

    // 水面に映ったような反射
    ctx.strokeStyle = "rgba(" + CONFIG.teal + ", 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < N; i++) {
      var m = pointAt(i, t, true);
      if (i === 0) ctx.moveTo(m.x, m.y); else ctx.lineTo(m.x, m.y);
    }
    ctx.stroke();

    // 本体の波形
    ctx.save();
    ctx.shadowColor = "rgba(" + CONFIG.teal + ", 0.55)";
    ctx.shadowBlur = 14;
    ctx.strokeStyle = "rgb(" + CONFIG.teal + ")";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (i = 0; i < N; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y); else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // ピーク(大きく振れた部分)は琥珀色で上書き
    ctx.strokeStyle = "rgb(" + CONFIG.amber + ")";
    ctx.lineWidth = 2.4;
    for (i = 1; i < N; i++) {
      if (Math.abs(pts[i].d) > CONFIG.peakAt || Math.abs(pts[i - 1].d) > CONFIG.peakAt) {
        ctx.beginPath();
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      }
    }

    level = Math.max(level * 0.93, Math.min(peak * 1.05, 1));
    drawMeter();
  }

  function shouldRun() {
    if (document.hidden || !visible) return false;
    if (!reduceMotion) return true;
    return energy() > 0.002 || rings.length > 0 || level > 0.02;
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

  /* ---------- 入力 ---------- */
  function local(e) {
    var r = hero.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  hero.addEventListener("pointermove", function (e) {
    var p = local(e);
    if (!pointer.active) { pointer.active = true; pointer.lastY = p.y; return; }
    var vy = p.y - pointer.lastY;
    pointer.lastY = p.y;
    var near = Math.exp(-Math.pow((p.y - base) / (h * 0.3), 2));
    var strength = Math.max(-1, Math.min(1, vy / 28)) * 0.3 * near;
    if (Math.abs(strength) > 0.004) { pluck(p.x, strength); kick(); }
  });
  hero.addEventListener("pointerleave", function () { pointer.active = false; });

  function trigger(px, py) {
    flip = -flip;
    pluck(px, flip * 1.5);
    rings.push({ x: px, y: py, r: 4, a: 0.8 });
    level = Math.max(level, 0.85);
    playSfx(px / Math.max(w, 1));
    kick();
  }

  hero.addEventListener("pointerdown", function (e) {
    if (e.target.closest && e.target.closest("a, button")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var p = local(e);
    trigger(p.x, p.y);
  });

  var playBtn = document.getElementById("hero-play");
  if (playBtn) {
    playBtn.addEventListener("click", function () {
      var px = w * (0.15 + Math.random() * 0.7);
      trigger(px, base);
    });
  }

  var soundBtn = document.getElementById("hero-sound");
  if (soundBtn) {
    soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
      soundBtn.textContent = soundOn ? "音 ON" : "音 OFF";
    });
  }

  /* ---------- 起動 ---------- */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) kick();
    }).observe(hero);
  }
  document.addEventListener("visibilitychange", kick);

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 80);
  });

  resize();
})();
