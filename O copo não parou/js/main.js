(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CFG = window.SITE || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body;

  /* =============== CONFIG DE VENDA =============== */
  $$("[data-price]").forEach(function (el) { if (CFG.price) el.textContent = CFG.price; });
  var note = $("[data-price-note]");
  if (note && CFG.priceNote) note.textContent = CFG.priceNote;

  var buy = $("#btnBuy"), fine = $("#buyFine");
  if (CFG.checkoutUrl) {
    buy.href = CFG.checkoutUrl;
    buy.target = "_blank";
    buy.rel = "noopener";
  } else {
    buy.removeAttribute("href");
    buy.setAttribute("aria-disabled", "true");
    buy.textContent = "Vendas abrem em breve";
  }
  if (CFG.contactEmail) { var m = $("#footMail"); m.href = "mailto:" + CFG.contactEmail; m.hidden = false; }
  if (CFG.instagramUrl) { var ig = $("#footIg"); ig.href = CFG.instagramUrl; ig.hidden = false; }

  /* =============== ABERTURA =============== */
  var KEY = "copo-intro-visto";
  var intro = $("#intro");
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === "1"; } catch (e) {}
  var forced = /[?&]intro=1/.test(location.search);
  if ((seen && !forced) || (location.hash && location.hash !== "#topo" && !forced)) {
    intro.remove();
    body.classList.remove("locked");
  } else {
    runIntro();
  }

  function runIntro() {
    var NS = "http://www.w3.org/2000/svg";
    var board = $("#introBoard");
    var words = $("#introWords"), sub = $("#introSub"), prompt = $("#introPrompt");
    var flash = $("#introFlash"), tcEl = $("#tc");
    var done = false, audio = null;
    var timers = [];

    /* --- montar o tabuleiro --- */
    function el(name, attrs, parent) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      (parent || board).appendChild(n);
      return n;
    }
    var defs = el("defs", {});
    defs.innerHTML =
      '<radialGradient id="glow"><stop offset="0" stop-color="#ffb35a" stop-opacity=".55"/><stop offset=".45" stop-color="#b3261a" stop-opacity=".18"/><stop offset="1" stop-color="#b3261a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="paper" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#3a2a1c"/><stop offset=".7" stop-color="#1c130d"/><stop offset="1" stop-color="#0a0605"/></radialGradient>';
    var CX = 300, CY = 360;
    el("circle", { cx: 300, cy: 310, r: 296, fill: "url(#paper)" });
    el("circle", { cx: 300, cy: 310, r: 286, class: "b-ring" });

    var pos = {}, lettersEls = {};
    function place(ch, x, y, rot) {
      var t = el("text", { x: x, y: y, class: "b-letter", transform: "rotate(" + (rot || 0) + " " + x + " " + y + ")" });
      t.textContent = ch;
      if (/\d/.test(ch)) t.style.fontSize = "19px";
      pos[ch] = { x: x, y: y };
      lettersEls[ch] = t;
    }
    var A1 = "ABCDEFGHIJKLM", A2 = "NOPQRSTUVWXYZ", i, th;
    for (i = 0; i < 13; i++) { th = (160 - i * (140 / 12)) * Math.PI / 180; place(A1[i], CX + 225 * Math.cos(th), CY - 225 * Math.sin(th), 90 - th * 180 / Math.PI); }
    for (i = 0; i < 13; i++) { th = (154 - i * (128 / 12)) * Math.PI / 180; place(A2[i], CX + 172 * Math.cos(th), CY - 172 * Math.sin(th), (90 - th * 180 / Math.PI) * .9); }
    var DG = "1234567890";
    for (i = 0; i < 10; i++) place(DG[i], 190 + i * 24.4, 505, 0);
    function word(txt, x, y) { var t = el("text", { x: x, y: y, class: "b-word" }); t.textContent = txt; }
    word("SIM", 100, 150); word("NÃO", 500, 150); word("OLÁ", 96, 462); word("ADEUS", 504, 462);

    /* velas */
    var CAND = [[300, 60], [548, 226], [420, 548], [180, 548], [52, 226]];
    CAND.forEach(function (c) {
      el("circle", { cx: c[0], cy: c[1] - 6, r: 64, fill: "url(#glow)" });
      el("rect", { x: c[0] - 5, y: c[1] - 2, width: 10, height: 24, fill: "#d8cdb4", opacity: .85 });
      var f = el("ellipse", { cx: c[0], cy: c[1] - 9, rx: 3.6, ry: 8, fill: "#ffcf7a", class: "b-flame" });
      f.style.animationDelay = (Math.random() * 1.4) + "s";
    });

    /* copo + dedos */
    var glass = el("g", { class: "b-glass" });
    var REST = { x: 300, y: 372 };
    el("circle", { cx: 0, cy: 0, r: 58, fill: "rgba(0,0,0,.28)" }, glass);
    el("ellipse", { cx: 0, cy: 0, rx: 24, ry: 24, class: "g1" }, glass);
    el("ellipse", { cx: 0, cy: 0, rx: 17, ry: 17, class: "g2" }, glass);
    el("path", { d: "M-6 -22 L-2 -8 L-9 2 M-2 -8 L7 3 L5 16" }, glass);
    for (i = 0; i < 5; i++) {
      var a = (90 + i * 72) * Math.PI / 180, sx = Math.cos(a) * 46, sy = Math.sin(a) * 46;
      el("circle", { cx: sx, cy: sy, r: 8, class: i === 0 ? "b-seat empty" : "b-seat" }, glass);
    }
    function moveTo(p) { glass.style.transform = "translate(" + p.x + "px," + p.y + "px)"; }
    glass.style.transition = reduce ? "none" : "";
    moveTo(REST);

    /* --- utilitários --- */
    function later(fn, ms) { var t = setTimeout(function () { if (!done) fn(); }, ms); timers.push(t); return t; }
    function sleep(ms) { return new Promise(function (res) { later(res, ms); }); }
    function say(txt) { sub.textContent = txt; sub.classList.add("show"); }
    function hush() { sub.classList.remove("show"); }

    /* timecode */
    var sec = 12 + 4 * 60 + 1 * 3600;
    var tcTimer = setInterval(function () {
      sec++;
      var h = Math.floor(sec / 3600) % 24, m = Math.floor(sec / 60) % 60, s = sec % 60;
      tcEl.textContent = "16.07.2016 " + [h, m, s].map(function (n) { return (n < 10 ? "0" : "") + n; }).join(":");
    }, 1000);

    /* som (opcional, começa desligado) */
    var soundBtn = $("#introSound");
    function startAudio() {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        var ctx = new AC(), master = ctx.createGain();
        master.gain.value = 0; master.connect(ctx.destination);
        var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 240; lp.connect(master);
        [55, 55.6, 82.4].forEach(function (f, k) {
          var o = ctx.createOscillator(); o.type = k === 2 ? "sine" : "sawtooth"; o.frequency.value = f;
          var g = ctx.createGain(); g.gain.value = k === 2 ? .35 : .5; o.connect(g); g.connect(lp); o.start();
        });
        var len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
        for (var n = 0; n < len; n++) d[n] = (Math.random() * 2 - 1) * .5;
        var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 700; bp.Q.value = .6;
        var ng = ctx.createGain(); ng.gain.value = .06; src.connect(bp); bp.connect(ng); ng.connect(master); src.start();
        master.gain.linearRampToValueAtTime(.16, ctx.currentTime + 2.5);
        audio = { ctx: ctx, master: master };
      } catch (e) { audio = null; }
    }
    soundBtn.addEventListener("click", function () {
      var on = soundBtn.getAttribute("aria-pressed") !== "true";
      soundBtn.setAttribute("aria-pressed", on);
      soundBtn.textContent = on ? "Som ligado" : "Som desligado";
      if (on) { if (!audio) startAudio(); else audio.ctx.resume(); if (audio) audio.master.gain.linearRampToValueAtTime(.16, audio.ctx.currentTime + 1); }
      else if (audio) audio.master.gain.linearRampToValueAtTime(0, audio.ctx.currentTime + .6);
    });

    /* --- saída --- */
    function finish(withFlash) {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout); clearInterval(tcTimer);
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
      if (audio) { audio.master.gain.linearRampToValueAtTime(0, audio.ctx.currentTime + 1.2); setTimeout(function () { audio.ctx.close(); }, 1600); }
      if (withFlash && !reduce) { flash.classList.add("go"); }
      intro.classList.add("gone");
      intro.setAttribute("aria-hidden", "true");
      intro.inert = true;
      body.classList.remove("locked");
      window.scrollTo(0, 0);
      setTimeout(function () { intro.remove(); }, 1600);
    }
    $("#introSkip").addEventListener("click", function () { finish(false); });
    $("#introEnter").addEventListener("click", function () {
      if (done) return;
      prompt.classList.remove("show");
      moveTo({ x: REST.x, y: REST.y - 4 });
      if (!reduce) flash.classList.add("go");
      setTimeout(function () { finish(false); }, reduce ? 0 : 650);
    });
    document.addEventListener("keydown", function esc(e) {
      if (done) { document.removeEventListener("keydown", esc); return; }
      if (e.key === "Escape") finish(false);
    });

    /* --- roteiro --- */
    function showPrompt() { hush(); prompt.classList.add("show"); $("#introEnter").focus({ preventScroll: true }); }
    if (reduce) { words.textContent = "NÃO PAROU"; showPrompt(); return; }

    (async function script() {
      await sleep(900);
      say("Julho de 2016. Uma festa do pijama.");
      await sleep(2800);
      hush(); await sleep(500);
      say("Quatro dedos no copo. Um lugar vazio.");
      await sleep(2600);
      hush(); await sleep(600);
      var seq = "NÃO PAROU".split(""), out = "";
      for (var k = 0; k < seq.length; k++) {
        var ch = seq[k];
        if (ch === " ") { out += " "; words.innerHTML += "<span> </span>"; await sleep(500); continue; }
        var base = ch === "Ã" ? "A" : ch;
        moveTo(pos[base]);
        await sleep(950);
        var le = lettersEls[base]; le.classList.add("lit");
        var s = document.createElement("span"); s.textContent = ch; words.appendChild(s);
        (function (l) { later(function () { l.classList.remove("lit"); }, 700); })(le);
        await sleep(420);
      }
      await sleep(900);
      moveTo(REST);
      await sleep(1300);
      showPrompt();
    })();
  }

  /* =============== NAV / STICKY =============== */
  var nav = $("#nav"), sticky = $("#sticky"), offer = $("#comprar");
  var offerVisible = false;
  if ("IntersectionObserver" in window && offer) {
    new IntersectionObserver(function (en) { offerVisible = en[0].isIntersecting; updateBars(); }, { threshold: .15 }).observe(offer);
  }
  function updateBars() {
    var y = window.scrollY;
    nav.classList.toggle("solid", y > 40);
    var on = y > 520 && !offerVisible;
    sticky.classList.toggle("on", on);
    sticky.setAttribute("aria-hidden", on ? "false" : "true");
    var l = $("a", sticky); if (l) l.tabIndex = on ? 0 : -1;
  }
  window.addEventListener("scroll", updateBars, { passive: true });
  updateBars();

  /* =============== REVEAL =============== */
  var rev = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
    rev.forEach(function (n) { io.observe(n); });
  } else { rev.forEach(function (n) { n.classList.add("in"); }); }

  /* =============== LIGHTBOX =============== */
  var docs = $$("#gallery .doc");
  var lb = $("#lb"), lbImg = $("#lbImg"), lbCap = $("#lbCap"), cur = -1, opener = null;
  function openLb(i) {
    cur = (i + docs.length) % docs.length;
    var d = docs[cur];
    lbImg.src = d.dataset.src;
    lbImg.alt = $("img", d).alt;
    lbCap.textContent = d.dataset.cap || "";
    if (lb.hidden) { lb.hidden = false; document.documentElement.style.overflow = "hidden"; $("#lbClose").focus(); }
  }
  function closeLb() {
    lb.hidden = true; document.documentElement.style.overflow = "";
    if (opener) opener.focus();
  }
  docs.forEach(function (d, i) { d.addEventListener("click", function () { opener = d; openLb(i); }); });
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", function () { openLb(cur - 1); });
  $("#lbNext").addEventListener("click", function () { openLb(cur + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") openLb(cur - 1);
    else if (e.key === "ArrowRight") openLb(cur + 1);
  });

  /* =============== REVER ABERTURA =============== */
  $("#replay").addEventListener("click", function (e) {
    e.preventDefault();
    try { sessionStorage.removeItem(KEY); } catch (er) {}
    location.href = location.pathname + "?intro=1";
  });
})();
