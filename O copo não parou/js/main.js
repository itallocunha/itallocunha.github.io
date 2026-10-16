(function () {
  'use strict';
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var CFG = window.SITE || {}, body = document.body;
  var reduceMedia = window.matchMedia('(prefers-reduced-motion: reduce)'), reduce = reduceMedia.matches;
  var savedChoice = null; try { savedChoice = localStorage.getItem('copo-effects'); } catch (e) {}
  var savedPause = savedChoice === 'paused', effectsOptIn = savedChoice === 'playing';
  var effectsPaused = effectsOptIn ? false : reduce || savedPause, introActive = false;
  var money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var price = Number(String(CFG.price || '49,90').replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(price) || price <= 0) price = 49.9;
  $$('[data-price]').forEach(function (el) { el.textContent = price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); });
  if (CFG.priceNote) $('[data-price-note]').textContent = CFG.priceNote;
  var buy = $('#btnBuy');
  if (CFG.checkoutUrl) { buy.href = CFG.checkoutUrl; buy.target = '_blank'; buy.rel = 'noopener'; }
  else { buy.removeAttribute('href'); buy.setAttribute('aria-disabled', 'true'); buy.tabIndex = -1; buy.textContent = 'Vendas abrem em breve'; $('#buyFine').textContent = 'As vendas ainda não abriram. O valor acima é o preço do kit completo.'; }
  if (CFG.contactEmail) { $('#footMail').href = 'mailto:' + CFG.contactEmail; $('#footMail').hidden = false; }
  if (CFG.instagramUrl) { $('#footIg').href = CFG.instagramUrl; $('#footIg').hidden = false; }

  function setPageInert(on) { $$('.nav, main, .foot, .sticky, .skip').forEach(function (el) { el.inert = on; }); }
  var KEY = 'copo-intro-arte-v2', intro = $('#intro');
  var forced = new URLSearchParams(location.search).get('intro') === '1';
  if (forced) runIntro(); else { intro.remove(); body.classList.add('session-open'); }

  function runIntro() {
    var done = false, audio = null, soundBusy = false, frame = 0;
    intro.hidden = false; body.classList.add("locked"); introActive = true;
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
      introActive = false; setPageInert(false); body.classList.remove('locked'); body.classList.add('session-open');
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
      if (effectsPaused) return;
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


  /* Efeitos visuais confinados à logo e controlados pelo visitante. */
  var logo = $('#hauntLogo'), motionToggle = $('#motionToggle');
  var logoVisible = true, hauntEnd = 0, hauntTimer = 0, pointerFrame = 0;
  function applyMotion() {
    body.classList.toggle('motion-paused', effectsPaused);
    document.documentElement.classList.toggle('reduce-effects', effectsPaused);
    body.classList.toggle('effects-opt-in', effectsOptIn && !effectsPaused);
    document.documentElement.classList.toggle('effects-opt-in', effectsOptIn && !effectsPaused);
    motionToggle.setAttribute('aria-pressed', String(!effectsPaused));
    motionToggle.textContent = effectsPaused ? 'Ativar efeitos' : 'Pausar efeitos';
    motionToggle.title = reduce && effectsPaused ? 'Seu dispositivo pede movimento reduzido. Você pode optar por ativar os efeitos aqui.' : '';
    if (effectsPaused) { logo.classList.remove('is-haunted'); clearTimeout(hauntEnd); logo.style.setProperty('--brand-x', '0px'); logo.style.setProperty('--brand-y', '0px'); }
  }
  applyMotion();
  motionToggle.addEventListener('click', function () { effectsPaused = !effectsPaused; savedPause = effectsPaused; effectsOptIn = !effectsPaused; try { localStorage.setItem('copo-effects', effectsPaused ? 'paused' : 'playing'); } catch (e) {} applyMotion(); });
  if (reduceMedia.addEventListener) reduceMedia.addEventListener('change', function (e) { reduce = e.matches; effectsPaused = effectsOptIn ? false : reduce || savedPause; applyMotion(); });
  for (var particle = 0; particle < 18; particle++) {
    var dot = document.createElement('i'); dot.style.left = (7 + particle * 37 % 86) + '%'; dot.style.top = (18 + particle * 29 % 78) + '%';
    dot.style.setProperty('--size', (1 + particle % 3) + 'px'); dot.style.setProperty('--duration', (9 + particle % 7) + 's'); dot.style.setProperty('--delay', (-particle * .67) + 's'); $('#brandParticles').appendChild(dot);
  }
  function haunt(manual) {
    if (effectsPaused) { if (manual) { var shown = logo.classList.toggle('mark-revealed'); $('#brandStatus').textContent = shown ? 'Uma marca apareceu na logo.' : 'A marca desapareceu.'; } return; }
    clearTimeout(hauntEnd); logo.classList.add('is-haunted');
    hauntEnd = setTimeout(function () { logo.classList.remove('is-haunted'); }, 1150);
    if (manual) $('#brandStatus').textContent = 'Marcas surgiram por um instante na logo.';
  }
  logo.addEventListener('click', function () { haunt(true); });
  function scheduleHaunt() { clearTimeout(hauntTimer); hauntTimer = setTimeout(function () { if (logoVisible && !effectsPaused && !document.hidden && !introActive && $('#lb').hidden) haunt(false); scheduleHaunt(); }, 11000 + Math.random() * 4000); }
  scheduleHaunt();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { logoVisible = entries[0].isIntersecting; }, { threshold: .15 }).observe(logo);
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    logo.addEventListener('pointermove', function (e) { if (effectsPaused) return; cancelAnimationFrame(pointerFrame); pointerFrame = requestAnimationFrame(function () { var rect = logo.getBoundingClientRect(); logo.style.setProperty('--brand-x', ((e.clientX - rect.left) / rect.width * 8 - 4).toFixed(1) + 'px'); logo.style.setProperty('--brand-y', ((e.clientY - rect.top) / rect.height * 6 - 3).toFixed(1) + 'px'); }); });
    logo.addEventListener('pointerleave', function () { cancelAnimationFrame(pointerFrame); logo.style.setProperty('--brand-x', '0px'); logo.style.setProperty('--brand-y', '0px'); });
  }
  window.addEventListener('pagehide', function () { logo.classList.remove('is-haunted'); clearTimeout(hauntTimer); clearTimeout(hauntEnd); cancelAnimationFrame(pointerFrame); });
  window.addEventListener('pageshow', scheduleHaunt);

  /* Navegação e oferta fixa somente depois da apresentação do kit. */
  var nav = $('#nav'), sticky = $('#sticky'), offerVisible = false, scrollFrame = 0;
  function updateBars() {
    var y = window.scrollY, total = document.documentElement.scrollHeight - innerHeight;
    $('#readingProgress').style.transform = 'scaleX(' + (total > 0 ? Math.min(1, Math.max(0, y / total)) : 0) + ')';
    nav.classList.toggle('solid', y > 40);
    var on = y > $('#kit').offsetTop + 180 && !offerVisible && !introActive;
    sticky.classList.toggle('on', on); sticky.setAttribute('aria-hidden', String(!on)); $('a', sticky).tabIndex = on ? 0 : -1;
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { offerVisible = entries[0].isIntersecting; updateBars(); }, { threshold: .08 }).observe($('#comprar'));
  window.addEventListener('scroll', function () { if (scrollFrame) return; scrollFrame = requestAnimationFrame(function () { updateBars(); scrollFrame = 0; }); }, { passive: true });
  window.addEventListener('resize', updateBars); updateBars();
  var navToggle = $('#navToggle');
  function closeMenu() { nav.classList.remove('menu-open'); navToggle.setAttribute('aria-expanded', 'false'); navToggle.setAttribute('aria-label', 'Abrir menu de seções'); }
  navToggle.addEventListener('click', function () { var open = navToggle.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('menu-open', open); navToggle.setAttribute('aria-expanded', String(open)); navToggle.setAttribute('aria-label', open ? 'Fechar menu de seções' : 'Abrir menu de seções'); });
  $$('.nav-links a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) closeMenu(); });
  nav.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('menu-open')) { closeMenu(); navToggle.focus(); } });
  var menuMedia = window.matchMedia('(max-width: 980px)'); if (menuMedia.addEventListener) menuMedia.addEventListener('change', closeMenu);
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (!entry.isIntersecting) return; $$('.nav-links a').forEach(function (a) { if (a.hash === '#' + entry.target.id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }); }); }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
    $$('.nav-links a').forEach(function (a) { var section = $(a.hash); if (section) sectionObserver.observe(section); });
  }
  function revealHashTarget() { var hash; try { hash = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; } var target = document.getElementById(hash); if (!target) return; var details = target.closest('details'); if (details) details.open = true; }
  window.addEventListener('hashchange', revealHashTarget); revealHashTarget();

  /* Entrada suave das seções, com fallback sem animação. */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) { var revealObserver = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('in'); revealObserver.unobserve(entry.target); } }); }, { threshold: .1, rootMargin: '0px 0px -25px 0px' }); reveals.forEach(function (el) { revealObserver.observe(el); }); }
  else reveals.forEach(function (el) { el.classList.add('in'); });

  /* Imagens ampliadas: navegação por teclado e retorno do foco. */
  var evidenceItems = [
    { src: 'img/doc-bo.webp', caption: 'O registro de uma ausência.', alt: 'Boletim de ocorrência do desaparecimento', label: 'boletim de ocorrência', cap: 'Boletim de ocorrência — prévia do jogo' },
    { src: 'img/doc-tabuleiro.webp', caption: 'Alguém esqueceu de dizer adeus.', alt: 'Tabuleiro do jogo do copo', label: 'tabuleiro', cap: 'O tabuleiro — prévia do jogo' },
    { src: 'img/doc-fotos.webp', caption: 'Antes de tudo virar um caso.', alt: 'Fotografias cedidas pelas famílias', label: 'fotografias', cap: 'Fotografias — prévia do jogo' }
  ];
  var imageItems = evidenceItems.slice(), artButtons = $$('[data-art-preview]');
  artButtons.forEach(function (button) { imageItems.push({ src: button.dataset.src, alt: $('img', button).alt, cap: button.dataset.cap }); });
  var lb = $('#lb'), cur = 0, opener = null;
  function openImage(index, source) {
    cur = (index + imageItems.length) % imageItems.length; var item = imageItems[cur];
    $('#lbImg').src = item.src; $('#lbImg').alt = item.alt; $('#lbCap').textContent = item.cap;
    if (lb.hidden) { opener = source || document.activeElement; lb.hidden = false; setPageInert(true); document.documentElement.style.overflow = 'hidden'; $('#lbClose').focus(); }
  }
  function closeImage() { lb.hidden = true; setPageInert(false); document.documentElement.style.overflow = ''; if (opener && document.contains(opener)) opener.focus({ preventScroll: true }); }
  artButtons.forEach(function (button, index) { button.addEventListener('click', function () { openImage(evidenceItems.length + index, button); }); });
  $('#lbClose').addEventListener('click', closeImage); $('#lbPrev').addEventListener('click', function () { openImage(cur - 1); }); $('#lbNext').addEventListener('click', function () { openImage(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeImage(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); closeImage(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); openImage(cur - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); openImage(cur + 1); }
    else if (e.key === 'Tab') { var controls = $$('button', lb), first = controls[0], last = controls[controls.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });

  /* As abas mostram uma evidência de cada vez. */
  var evidenceTabs = $$('[data-evidence]'), evidenceIndex = 0;
  function selectEvidence(index, focus) {
    evidenceIndex = (index + evidenceItems.length) % evidenceItems.length; var item = evidenceItems[evidenceIndex];
    evidenceTabs.forEach(function (tab, i) { var active = i === evidenceIndex; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
    $('#evidencePanel').setAttribute('aria-labelledby', evidenceTabs[evidenceIndex].id);
    $('#evidenceImage').src = item.src; $('#evidenceImage').alt = item.alt; $('#evidenceImage').classList.toggle('landscape', evidenceIndex === 1);
    $('#evidenceImage').width = 1000; $('#evidenceImage').height = evidenceIndex === 1 ? 708 : evidenceIndex === 2 ? 1500 : 1413;
    $('#evidenceCaption').textContent = item.caption; $('#evidencePreview').setAttribute('aria-label', 'Ampliar ' + item.label); if (focus) evidenceTabs[evidenceIndex].focus();
  }
  function wireTabs(tabs, select) { tabs.forEach(function (tab, i) { tab.addEventListener('click', function () { select(i, false); }); tab.addEventListener('keydown', function (e) { var current = tabs.indexOf(document.activeElement); if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) < 0) return; e.preventDefault(); select(e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : current + (e.key === 'ArrowRight' ? 1 : -1), true); }); }); }
  wireTabs(evidenceTabs, selectEvidence);
  $('#evidencePreview').addEventListener('click', function () { openImage(evidenceIndex, $('#evidencePreview')); });

  /* Exploração do conteúdo, sem exibir três explicações ao mesmo tempo. */
  var kitItems = [
    { label: 'Documentos e depoimentos', title: 'O que uma versão<br>deixa de fora?', text: 'Cartas, boletim de ocorrência, mensagens recuperadas e depoimentos. Leiam as versões e descubram quais detalhes não se encaixam.' },
    { label: 'Áudios, vídeos e atmosfera', title: 'Escute com atenção.<br>Veja o que ficou.', text: 'Registros em áudio e vídeo entram na investigação. O áudio ambiente acompanha a partida e ajuda a montar o clima da noite.' },
    { label: 'Plantas, fotos e materiais de jogo', title: 'Uma pista muda<br>o sentido da outra.', text: 'Fotografias, plantas, tabuleiro e cartões de verificação ajudam a conectar os fragmentos e reconstruir o que aconteceu naquele quarto.' }
  ];
  var kitTabs = $$('[data-kit]'), kitChangeTimer = 0;
  function selectKit(index, focus) { var current = (index + kitItems.length) % kitItems.length, item = kitItems[current]; kitTabs.forEach(function (tab, i) { var active = i === current; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; }); var panel = $('#kitPanel'); panel.setAttribute('aria-labelledby', kitTabs[current].id); $('#kitChapter').textContent = item.label; $('#kitPanelTitle').innerHTML = item.title; $('#kitPanelText').textContent = item.text; panel.classList.remove('content-change'); if (!effectsPaused) { void panel.offsetWidth; panel.classList.add('content-change'); clearTimeout(kitChangeTimer); kitChangeTimer = setTimeout(function () { panel.classList.remove('content-change'); }, 450); } if (focus) kitTabs[current].focus(); }
  wireTabs(kitTabs, selectKit);

  /* Divisão estimada do valor: o preço do kit permanece o mesmo. */
  $$('[data-players]').forEach(function (button) { button.setAttribute('aria-label', 'Dividir entre ' + button.dataset.players + ' jogadores'); button.addEventListener('click', function () { var count = Number(button.dataset.players); $$('[data-players]').forEach(function (option) { option.setAttribute('aria-pressed', String(option === button)); }); $('#shareValue').textContent = money.format(price / count); $('#shareCount').textContent = String(count); }); });
  $('#shareValue').textContent = money.format(price / 6);

  /* Trilho dos cinco envelopes. */
  var rail = $('.env-rail'), railButtons = $$('[data-rail="envelopes"]');
  function updateRail() { var max = rail.scrollWidth - rail.clientWidth; railButtons.forEach(function (button) { button.disabled = max <= 2 || (button.dataset.direction === '-1' ? rail.scrollLeft <= 2 : rail.scrollLeft >= max - 2); }); }
  railButtons.forEach(function (button) { button.addEventListener('click', function () { rail.scrollBy({ left: Number(button.dataset.direction) * rail.clientWidth * .75, behavior: effectsPaused ? 'auto' : 'smooth' }); }); });
  rail.addEventListener('scroll', updateRail, { passive: true }); window.addEventListener('resize', updateRail); window.addEventListener('load', function () { updateRail(); updateBars(); }); updateRail();
  $('#replay').addEventListener('click', function (e) { e.preventDefault(); location.href = location.pathname + '?intro=1'; });
})();
