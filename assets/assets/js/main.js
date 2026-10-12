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

  function visibleLinks(work) {
    return (work.links || []).filter(function (l) { return l && l.url; });
  }

  function tagList(items) {
    var ul = el("ul", "tags");
    items.forEach(function (t) { ul.appendChild(el("li", "", t)); });
    return ul;
  }

  /* ---------- カードのサムネイル ---------- */
  function buildThumb(work, onOpen) {
    var m = work.media || {};
    var box = el("button", "media media-thumb");
    box.type = "button";
    box.tabIndex = -1; // キーボード操作はタイトルのボタンに任せる
    box.setAttribute("aria-hidden", "true");
    if (m.type === "youtube" && m.id) {
      box.classList.add("media-video");
      box.style.backgroundImage = "url(https://i.ytimg.com/vi/" + encodeURIComponent(m.id) + "/hqdefault.jpg)";
      box.appendChild(el("span", "play"));
    } else {
      box.classList.add("media-empty");
      box.textContent = (m.type === "soundcloud" && m.url) ? "♪ AUDIO" : "動画準備中";
    }
    box.addEventListener("click", onOpen);
    return box;
  }

  /* ---------- 詳細ポップアップ(モーダル) ---------- */
  var modal = null;

  function closeModal() {
    if (!modal) return;
    if (typeof modal.dialog.close === "function") {
      if (modal.dialog.open) modal.dialog.close();
    } else {
      modal.dialog.removeAttribute("open");
    }
    cleanupModal();
  }

  function cleanupModal() {
    if (!modal) return;
    modal.media.textContent = ""; // iframe を消して再生を止める
    document.documentElement.classList.remove("modal-open");
  }

  function buildModal() {
    var dialog = el("dialog", "modal");
    dialog.setAttribute("aria-labelledby", "modal-title");

    var panel = el("div", "modal-panel");
    var close = el("button", "modal-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "閉じる");
    var media = el("div", "modal-media");
    var body = el("div", "modal-body");

    panel.appendChild(close);
    panel.appendChild(media);
    panel.appendChild(body);
    dialog.appendChild(panel);
    document.body.appendChild(dialog);

    close.addEventListener("click", closeModal);
    // 暗い背景(::backdrop)をクリックしたとき、target は dialog 自身になる
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) closeModal();
    });
    // Esc キーで閉じたときも後片付けをする
    dialog.addEventListener("close", cleanupModal);

    return { dialog: dialog, panel: panel, media: media, body: body };
  }

  function fillModalMedia(work) {
    var m = work.media || {};
    var frame = null;
    modal.media.textContent = "";
    modal.media.className = "modal-media";

    if (m.type === "youtube" && m.id) {
      frame = document.createElement("iframe");
      frame.className = "modal-frame";
      frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(m.id) + "?autoplay=1&rel=0";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
    } else if (m.type === "soundcloud" && m.url) {
      frame = document.createElement("iframe");
      frame.className = "modal-frame";
      frame.src = "https://w.soundcloud.com/player/?color=%235eead4&visual=false&auto_play=true&url=" + encodeURIComponent(m.url);
      frame.allow = "autoplay";
      modal.media.classList.add("is-audio");
    }

    if (frame) {
      frame.title = work.title || "";
      modal.media.appendChild(frame);
      modal.media.hidden = false;
      modal.panel.classList.remove("no-media");
    } else {
      modal.media.hidden = true;
      modal.panel.classList.add("no-media");
    }
  }

  function fillModalBody(work) {
    var body = modal.body;
    body.textContent = "";

    var meta = [work.category, work.year].filter(Boolean).join(" · ");
    if (meta) body.appendChild(el("p", "card-meta", meta));

    var title = el("h2", "modal-title", work.title || "Untitled");
    title.id = "modal-title";
    body.appendChild(title);

    // details(段落の配列)があればそれを、なければ description を表示
    var paragraphs = (work.details && work.details.length) ? work.details : (work.description ? [work.description] : []);
    paragraphs.forEach(function (t) { body.appendChild(el("p", "modal-text", t)); });

    var facts = el("dl", "modal-facts");
    function addFact(label, node) {
      var row = el("div");
      row.appendChild(el("dt", "", label));
      var dd = el("dd");
      dd.appendChild(node);
      row.appendChild(dd);
      facts.appendChild(row);
    }
    if (work.role) addFact("担当", document.createTextNode(work.role));
    if (work.tools && work.tools.length) addFact("使用ツール", tagList(work.tools));
    if (facts.childNodes.length) body.appendChild(facts);

    if (work.tags && work.tags.length) body.appendChild(tagList(work.tags));

    var links = visibleLinks(work);
    if (links.length) {
      var row = el("p", "modal-links");
      links.forEach(function (l) {
        var a = el("a", "", l.label || l.url);
        a.href = l.url;
        a.target = "_blank";
        a.rel = "noopener";
        row.appendChild(a);
      });
      body.appendChild(row);
    }
  }

  function openModal(work) {
    if (!modal) modal = buildModal();
    fillModalMedia(work);
    fillModalBody(work);
    modal.dialog.scrollTop = 0;
    document.documentElement.classList.add("modal-open");
    if (typeof modal.dialog.showModal === "function") {
      if (!modal.dialog.open) modal.dialog.showModal();
    } else {
      modal.dialog.setAttribute("open", "");
    }
  }

  /* ---------- 作品カード ---------- */
  function buildCard(work) {
    function open() { openModal(work); }

    var card = el("article", "card");
    card.appendChild(buildThumb(work, open));

    var body = el("div", "card-body");
    var meta = [work.category, work.year].filter(Boolean).join(" · ");
    if (meta) body.appendChild(el("p", "card-meta", meta));

    var h = el("h3", "card-title");
    var titleBtn = el("button", "title-btn", work.title || "Untitled");
    titleBtn.type = "button";
    titleBtn.addEventListener("click", open);
    h.appendChild(titleBtn);
    body.appendChild(h);

    if (work.description) body.appendChild(el("p", "card-desc", work.description));
    if (work.tags && work.tags.length) body.appendChild(tagList(work.tags));

    var more = el("button", "more", "詳細を見る ›");
    more.type = "button";
    more.tabIndex = -1;
    more.setAttribute("aria-hidden", "true");
    more.addEventListener("click", open);
    body.appendChild(more);

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
