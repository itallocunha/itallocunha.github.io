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

  /* =============== ABERTURA: VESTÍGIOS DE UMA SESSÃO =============== */
  var KEY = 'copo-intro-arte-v2';
  var intro = $('#intro');
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  var forced = /[?&]intro=1(?:&|$)/.test(location.search);
  function setPageInert(on) { $$('.nav, main, .foot, .sticky, .skip').forEach(function (el) { el.inert = on; }); }
  if ((seen && !forced) || (location.hash && location.hash !== '#topo' && !forced)) {
    intro.remove(); body.classList.remove('locked'); body.classList.add('session-open');
  } else { runIntro(); }

  function runIntro() {
    var done = false, audio = null, soundBusy = false, frame = 0;
    var soundBtn = $('#introSound'), scene = $('.ritual-scene', intro);
    var sec = 3852, lines = ['Quatro levantaram. Uma ficou.', 'Ninguém se lembra da mesma noite.', 'O copo não parou.'];
    var lineIndex = 0, tcEl = $('#tc'), sub = $('#introSub');
    setPageInert(true); intro.tabIndex = -1; intro.focus({ preventScroll: true });
    var clock = setInterval(function () {
      sec++;
      tcEl.textContent = [Math.floor(sec / 3600) % 24, Math.floor(sec / 60) % 60, sec % 60].map(function (n) { return String(n).padStart(2, '0'); }).join(':');
    }, 1000);
    var narrative = reduce ? null : setInterval(function () { lineIndex = (lineIndex + 1) % lines.length; sub.textContent = lines[lineIndex]; }, 6500);

    function finish() {
      if (done) return; done = true;
      clearInterval(clock); clearInterval(narrative); cancelAnimationFrame(frame);
      try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
      if (audio) {
        var context = audio.ctx; audio.master.gain.setTargetAtTime(0, context.currentTime, .15);
        setTimeout(function () { context.close().catch(function () {}); }, 900);
      }
      intro.removeEventListener('keydown', trapIntro); intro.removeEventListener('pointermove', moveScene);
      intro.classList.add('gone'); intro.setAttribute('aria-hidden', 'true'); intro.inert = true;
      setPageInert(false); body.classList.remove('locked'); body.classList.add('session-open');
      window.scrollTo(0, 0); $('#h1').focus({ preventScroll: true });
      setTimeout(function () { intro.remove(); }, reduce ? 0 : 850);
    }
    function trapIntro(e) {
      if (e.key === 'Escape') { e.preventDefault(); finish(); return; }
      if (e.key !== 'Tab') return;
      var focusables = $$('button', intro), first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === intro)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    intro.addEventListener('keydown', trapIntro);
    $('#introEnter').addEventListener('click', finish); $('#introSkip').addEventListener('click', finish);
    function moveScene(e) {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () {
        scene.style.setProperty('--scene-x', ((e.clientX / window.innerWidth - .5) * 10).toFixed(1) + 'px');
        scene.style.setProperty('--scene-y', ((e.clientY / window.innerHeight - .5) * 8).toFixed(1) + 'px');
      });
    }
    if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) intro.addEventListener('pointermove', moveScene, { passive: true });
    soundBtn.addEventListener('click', async function () {
      if (soundBusy || done) return;
      soundBusy = true;
      try {
        var on = soundBtn.getAttribute('aria-pressed') !== 'true';
        if (on) {
          if (!audio) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) throw new Error('Áudio não suportado');
            var ctx = new AC(), master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
            var filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 180; filter.connect(master);
            [55, 55.35, 82.4].forEach(function (hz, i) { var osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = 'sine'; osc.frequency.value = hz; gain.gain.value = i === 2 ? .18 : .3; osc.connect(gain); gain.connect(filter); osc.start(); });
            audio = { ctx: ctx, master: master };
          }
          await audio.ctx.resume();
          if (done) return;
        }
        if (audio) audio.master.gain.setTargetAtTime(on ? .12 : 0, audio.ctx.currentTime, .4);
        soundBtn.setAttribute('aria-pressed', String(on)); soundBtn.innerHTML = (on ? 'Desativar som' : 'Ativar som') + ' <span aria-hidden="true">◌</span>';
      } catch (e) { soundBtn.setAttribute('aria-pressed', 'false'); soundBtn.textContent = 'Som indisponível'; }
      finally { soundBusy = false; }
    });
  }

  /* =============== NAV / STICKY =============== */
  var nav = $("#nav"), sticky = $("#sticky"), offer = $("#comprar");
  var offerVisible = false;
  if ("IntersectionObserver" in window && offer) {
    new IntersectionObserver(function (en) { offerVisible = en[0].isIntersecting; updateBars(); }, { threshold: .15 }).observe(offer);
  }
  function updateBars() {
    var y = window.scrollY;
    var total = document.documentElement.scrollHeight - window.innerHeight;
    $("#readingProgress").style.transform = "scaleX(" + (total > 0 ? Math.min(1, y / total) : 0) + ")";
    nav.classList.toggle("solid", y > 40);
    var on = y > 520 && !offerVisible;
    sticky.classList.toggle("on", on);
    sticky.setAttribute("aria-hidden", on ? "false" : "true");
    var l = $("a", sticky); if (l) l.tabIndex = on ? 0 : -1;
  }
  var scrollFrame = 0;
  window.addEventListener("scroll", function () { if (scrollFrame) return; scrollFrame = requestAnimationFrame(function () { updateBars(); scrollFrame = 0; }); }, { passive: true });
  window.addEventListener("resize", updateBars);
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
  var docs = $$("#gallery .doc, [data-art-preview]");
  var lb = $("#lb"), lbImg = $("#lbImg"), lbCap = $("#lbCap"), cur = -1, opener = null;
  function openLb(i) {
    cur = (i + docs.length) % docs.length;
    var d = docs[cur];
    lbImg.src = d.dataset.src;
    lbImg.alt = $("img", d).alt;
    lbCap.textContent = d.dataset.cap || "";
    if (lb.hidden) { lb.hidden = false; setPageInert(true); document.documentElement.style.overflow = "hidden"; $("#lbClose").focus(); }
  }
  function closeLb() {
    lb.hidden = true; setPageInert(false); document.documentElement.style.overflow = "";
    if (opener) opener.focus();
  }
  docs.forEach(function (d, i) { d.addEventListener("click", function () { opener = d; openLb(i); }); });
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", function () { openLb(cur - 1); });
  $("#lbNext").addEventListener("click", function () { openLb(cur + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Tab") {
      var controls = $$("button", lb), first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") openLb(cur - 1);
    else if (e.key === "ArrowRight") openLb(cur + 1);
  });



  /* =============== MESA DE EVIDÊNCIAS =============== */
  var evidenceItems = [
    { src: 'img/doc-bo.webp', caption: 'O registro de uma ausência.', alt: 'Boletim de ocorrência do desaparecimento', label: 'boletim de ocorrência' },
    { src: 'img/doc-tabuleiro.webp', caption: 'Alguém esqueceu de dizer adeus.', alt: 'Tabuleiro original do jogo do copo', label: 'tabuleiro' },
    { src: 'img/doc-fotos.webp', caption: 'Antes de tudo virar um caso.', alt: 'Fotografias cedidas pelas famílias', label: 'fotografias' }
  ];
  var evidenceTabs = $$('[data-evidence]'), evidenceIndex = 0;
  var evidenceImage = $('#evidenceImage'), evidencePreview = $('#evidencePreview');
  function selectEvidence(i, focus) {
    evidenceIndex = (i + evidenceItems.length) % evidenceItems.length; var item = evidenceItems[evidenceIndex];
    evidenceTabs.forEach(function (tab, index) { var active = index === evidenceIndex; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
    $('#evidencePanel').setAttribute('aria-labelledby', evidenceTabs[evidenceIndex].id);
    evidenceImage.src = item.src; evidenceImage.alt = item.alt; evidenceImage.classList.toggle('landscape', evidenceIndex === 1);
    evidenceImage.width = 1000; evidenceImage.height = evidenceIndex === 1 ? 708 : evidenceIndex === 2 ? 1500 : 1413;
    evidencePreview.setAttribute('aria-label', 'Ampliar ' + item.label);
    $('#evidenceNumber').textContent = 'Evidência 0' + (evidenceIndex + 1); $('#evidenceCaption').textContent = item.caption;
    if (focus) evidenceTabs[evidenceIndex].focus();
  }
  evidenceTabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectEvidence(i, false); });
    tab.addEventListener('keydown', function (e) {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) === -1) return;
      e.preventDefault(); selectEvidence(e.key === 'Home' ? 0 : e.key === 'End' ? 2 : evidenceIndex + (e.key === 'ArrowRight' ? 1 : -1), true);
    });
  });
  evidencePreview.addEventListener('click', function () {
    var i = docs.findIndex(function (doc) { return doc.dataset.src === evidenceItems[evidenceIndex].src; });
    if (i >= 0) { opener = evidencePreview; openLb(i); }
  });

  /* =============== MENU E NAVEGAÇÃO DAS SEÇÕES =============== */
  var navToggle = $('#navToggle');
  function closeMenu() { nav.classList.remove('menu-open'); navToggle.setAttribute('aria-expanded', 'false'); navToggle.setAttribute('aria-label', 'Abrir menu de seções'); }
  navToggle.addEventListener('click', function () { var on = navToggle.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('menu-open', on); navToggle.setAttribute('aria-expanded', String(on)); navToggle.setAttribute('aria-label', on ? 'Fechar menu de seções' : 'Abrir menu de seções'); });
  $$('.nav-links a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  nav.addEventListener('keydown', function (e) { if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') { closeMenu(); navToggle.focus(); } });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) closeMenu(); });
  var menuMedia = window.matchMedia('(max-width: 960px)');
  if (menuMedia.addEventListener) menuMedia.addEventListener('change', closeMenu);
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (!entry.isIntersecting) return; $$('.nav-links a').forEach(function (a) { if (a.hash === '#' + entry.target.id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }); });
    }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
    $$('.nav-links a').forEach(function (a) { var section = $(a.hash); if (section) sectionObserver.observe(section); });
  }

  /* =============== TRILHOS DE DOCUMENTOS =============== */
  ['envelopes', 'evidencias'].forEach(function (name) {
    var rail = name === 'envelopes' ? $('.env-rail') : $('#gallery');
    var buttons = $$('[data-rail="' + name + '"]');
    function updateRail() { var max = rail.scrollWidth - rail.clientWidth; buttons.forEach(function (btn) { btn.disabled = max <= 1 || (btn.dataset.direction === '-1' ? rail.scrollLeft <= 2 : rail.scrollLeft >= max - 2); }); }
    buttons.forEach(function (btn) { btn.addEventListener('click', function () { rail.scrollBy({ left: Number(btn.dataset.direction) * rail.clientWidth * .75, behavior: reduce ? 'instant' : 'smooth' }); }); });
    rail.addEventListener('scroll', updateRail, { passive: true }); window.addEventListener('resize', updateRail); window.addEventListener('load', updateRail); updateRail();
  });

  /* =============== REVER ABERTURA =============== */
  $("#replay").addEventListener("click", function (e) {
    e.preventDefault();
    try { sessionStorage.removeItem(KEY); } catch (er) {}
    location.href = location.pathname + "?intro=1";
  });
})();
