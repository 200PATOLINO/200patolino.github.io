/*
 * ポートフォリオサイトの描画スクリプト。
 * 作品は data/works.js、連絡先リンクは data/site.js を編集するだけで増やせます。
 * このファイルは基本的に触らなくて大丈夫です。
 */
(function () {
  "use strict";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  /* ---------- ヒーローの波形装飾 ---------- */
  function buildWave() {
    var wave = document.getElementById("wave");
    if (!wave) return;
    for (var i = 0; i < 56; i++) {
      var bar = document.createElement("span");
      var h = 18 + Math.abs(Math.sin(i * 0.55) * 60) + Math.random() * 18;
      bar.style.setProperty("--h", Math.min(h, 100).toFixed(0) + "%");
      bar.style.setProperty("--d", (i * 0.06).toFixed(2) + "s");
      wave.appendChild(bar);
    }
  }

  /* ---------- メディア(動画・音声) ---------- */
  function youtubeMedia(work) {
    var id = work.media.id;
    var box = el("button", "media media-video");
    box.type = "button";
    box.setAttribute("aria-label", work.title + " の動画を再生");
    box.style.backgroundImage = "url(https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg)";
    box.appendChild(el("span", "play"));
    // クリックされるまで iframe を読み込まない(ページが軽くなる)
    box.addEventListener("click", function () {
      var frame = document.createElement("iframe");
      frame.className = "media";
      frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
      frame.title = work.title;
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      box.replaceWith(frame);
    });
    return box;
  }

  function soundcloudMedia(work) {
    var frame = document.createElement("iframe");
    frame.className = "media media-audio";
    frame.loading = "lazy";
    frame.title = work.title;
    frame.src = "https://w.soundcloud.com/player/?color=%235eead4&visual=false&url=" + encodeURIComponent(work.media.url);
    return frame;
  }

  function renderMedia(work) {
    var m = work.media || {};
    if (m.type === "youtube" && m.id) return youtubeMedia(work);
    if (m.type === "soundcloud" && m.url) return soundcloudMedia(work);
    return el("div", "media media-empty", "動画準備中");
  }

  /* ---------- 作品カード ---------- */
  function buildCard(work) {
    var card = el("article", "card");
    card.appendChild(renderMedia(work));

    var body = el("div", "card-body");
    var meta = [work.category, work.year].filter(Boolean).join(" · ");
    if (meta) body.appendChild(el("p", "card-meta", meta));
    body.appendChild(el("h3", "card-title", work.title || "Untitled"));
    if (work.description) body.appendChild(el("p", "card-desc", work.description));

    if (work.tags && work.tags.length) {
      var tags = el("ul", "tags");
      work.tags.forEach(function (t) { tags.appendChild(el("li", "", t)); });
      body.appendChild(tags);
    }

    var links = (work.links || []).filter(function (l) { return l && l.url; });
    if (links.length) {
      var row = el("p", "card-links");
      links.forEach(function (l) {
        var a = el("a", "", l.label || l.url);
        a.href = l.url;
        a.target = "_blank";
        a.rel = "noopener";
        row.appendChild(a);
      });
      body.appendChild(row);
    }

    card.appendChild(body);
    return card;
  }

  /* ---------- 作品一覧(作品が7件以上でタグ絞り込みが自動で出ます) ---------- */
  function renderWorks() {
    var grid = document.getElementById("works-grid");
    var filterBox = document.getElementById("works-filter");
    if (!grid) return;

    var works = window.WORKS || [];
    if (!works.length) {
      grid.appendChild(el("p", "empty", "作品は準備中です。"));
      return;
    }

    function draw(tag) {
      grid.textContent = "";
      works
        .filter(function (w) { return !tag || (w.tags || []).indexOf(tag) !== -1; })
        .forEach(function (w) { grid.appendChild(buildCard(w)); });
    }

    var allTags = [];
    works.forEach(function (w) {
      (w.tags || []).forEach(function (t) {
        if (allTags.indexOf(t) === -1) allTags.push(t);
      });
    });

    if (filterBox && works.length > 6 && allTags.length > 1) {
      var buttons = [];
      ["すべて"].concat(allTags).forEach(function (label, i) {
        var b = el("button", "chip" + (i === 0 ? " is-active" : ""), label);
        b.type = "button";
        b.addEventListener("click", function () {
          buttons.forEach(function (x) { x.classList.remove("is-active"); });
          b.classList.add("is-active");
          draw(i === 0 ? "" : label);
        });
        buttons.push(b);
        filterBox.appendChild(b);
      });
    }

    draw("");
  }

  /* ---------- 連絡先 ---------- */
  function renderContact() {
    var site = window.SITE || {};

    var mail = document.getElementById("contact-mail");
    if (mail && site.email) {
      mail.href = "mailto:" + site.email;
      mail.textContent = site.email;
    }

    var list = document.getElementById("contact-links");
    if (list) {
      (site.links || []).forEach(function (l) {
        if (!l || !l.url) return;
        var li = el("li");
        var a = el("a", "", l.label || l.url);
        a.href = l.url;
        a.target = "_blank";
        a.rel = "noopener";
        li.appendChild(a);
        list.appendChild(li);
      });
    }
  }

  function init() {
    buildWave();
    renderWorks();
    renderContact();
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
