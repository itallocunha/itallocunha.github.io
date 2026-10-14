/* ============================================================
   PÁGINAS DE ÁREA: monta tudo a partir de assets/manifesto.js
   (gerado por gerar-galeria.py). Cada página só define
   <body data-area="slug">.
============================================================ */
(function(){
const DADOS = window.PORTFOLIO;
const slug = document.body.dataset.area;
const app = document.getElementById('app');
if(!DADOS){ app.innerHTML = '<div class="wrap"><div class="vazio"><h2>Manifesto não encontrado</h2><p>Rode <code>python gerar-galeria.py</code> na pasta do site.</p></div></div>'; return; }
const areas = DADOS.areas, idx = areas.findIndex(a=>a.slug===slug), area = areas[idx];
const url = p => encodeURI(p).replace(/#/g,'%23');
const dois = n => String(n).padStart(2,'0');
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ICO = {
  seta:'<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12 12 4M5 4h7v7"/></svg>',
  esq:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M15 5l-7 7 7 7"/></svg>',
  dir:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M9 5l7 7-7 7"/></svg>',
  volta:'<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3 5 8l5 5"/></svg>',
  cheia:'<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/></svg>',
  x:'<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l10 10M13 3 3 13"/></svg>'
};
document.title = `${area.titulo} · Itallo Cunha`;

/* ---------- topo ---------- */
const temConteudo = a => a.atividades && a.atividades.length;
document.getElementById('topo').innerHTML = `
  <div class="wrap">
    <a class="logo" href="index.html">IC</a>
    <a class="voltar" href="index.html#portfolio">${ICO.volta}<span>Voltar ao portfólio</span></a>
    <nav class="areas-nav" aria-label="Áreas do portfólio">
      ${areas.map(a=>`<a href="${a.pagina}" class="${a.slug===slug?'atual':''} ${temConteudo(a)?'':'vazia'}"><b>${a.num}</b>${esc(a.titulo)}</a>`).join('')}
    </nav>
  </div>`;
setTimeout(()=>document.querySelector('.areas-nav .atual')?.scrollIntoView({inline:'center',block:'nearest'}),50);

/* ---------- conteúdo ---------- */
const ativs = area.atividades || [];
const totApr = ativs.reduce((s,a)=>s+a.apresentacao.length,0), totArt = ativs.reduce((s,a)=>s+a.artes.length,0);
let html = `
<header class="hero wrap">
  <span class="rotulo">Portfólio / Área ${area.num}</span>
  <h1 class="rough">${esc(area.titulo.toUpperCase())}</h1>
  <div class="hero-corpo">
    <p>${esc(area.intro || area.resumo)}</p>
    <p class="mao">${esc(area.nota||'')}</p>
  </div>
  ${ativs.length ? `<div class="stats">
    <div><b>${dois(ativs.length)}</b>atividades</div>
    <div><b>${dois(totApr)}</b>pranchas</div>
    ${totArt?`<div><b>${dois(totArt)}</b>artes em alta</div>`:''}
  </div>
  <nav class="missoes" aria-label="Atividades">
    ${ativs.map((a,i)=>`<a class="missao rv" href="#${a.id}">
      ${a.apresentacao[0]?`<img src="${url(a.apresentacao[0].src)}" alt="" loading="lazy">`:''}
      <div><small>${dois(i+1)}</small><span>${esc(a.titulo)}</span></div></a>`).join('')}
  </nav>`:''}
</header>`;

if(!ativs.length){
  html += `<div class="wrap"><div class="vazio rv"><h2>Área em construção</h2>
    <p>Estou organizando os projetos desta área. Logo eles aparecem aqui.</p>
    <a class="btn" href="index.html#portfolio">Voltar ao portfólio ${ICO.seta}</a></div></div>`;
}

ativs.forEach((a,i)=>{
  html += `<section class="atividade" id="${a.id}"><div class="wrap">
    <div class="ativ-cab rv">
      <span class="ativ-num">${dois(i+1)}</span>
      <span class="rotulo">Atividade ${dois(i+1)} de ${dois(ativs.length)}</span>
      <h2>${esc(a.titulo)}</h2>
      <div class="ativ-desc">
        ${a.descricao?`<p>${esc(a.descricao)}</p>`:''}
        ${a.tags?.length?`<div class="tags">${a.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}
      </div>
    </div>
    <div class="pranchas">
      ${a.apresentacao.map((p,j)=>`<figure class="prancha rv ${p.w>p.h?'paisagem':'retrato'}" data-grupo="apr-${i}" data-i="${j}" tabindex="0" role="button" aria-label="Ampliar prancha ${j+1}">
        <img src="${url(p.src)}" width="${p.w}" height="${p.h}" alt="${esc(p.legenda)}" loading="${i===0&&j<2?'eager':'lazy'}">
        <figcaption><span>${esc(p.legenda)}</span><b>${dois(j+1)} / ${dois(a.apresentacao.length)}</b></figcaption>
      </figure>`).join('')}
    </div>
    ${a.artes.length?`<div class="carrossel rv" data-grupo="art-${i}">
      <div class="car-cab"><h3>Artes em <em>alta resolução</em></h3><span class="contador"></span></div>
      <div class="palco" tabindex="0" aria-roledescription="carrossel" aria-label="Artes de ${esc(a.titulo)}">
        <div class="carregando">carregando...</div>
        <button class="seta ant" aria-label="Arte anterior">${ICO.esq}</button>
        <button class="seta prox" aria-label="Próxima arte">${ICO.dir}</button>
      </div>
      <div class="car-info"><span class="legenda"></span>
        <div class="car-acoes"><button class="abrir-cheia" type="button">${ICO.cheia} Tela cheia</button><a class="orig" target="_blank" rel="noopener">Arquivo original ${ICO.seta}</a></div></div>
      <div class="miniaturas" role="tablist">
        ${a.artes.map((r,j)=>`<button role="tab" aria-label="Arte ${j+1}" data-i="${j}"><img src="${url(r.mini)}" alt="" loading="lazy"${Math.max(r.w,r.h)<320?' class="pixel"':''}></button>`).join('')}
      </div>
    </div>`:''}
  </div></section>`;
});

const ant = areas[(idx-1+areas.length)%areas.length], prox = areas[(idx+1)%areas.length];
html += `<div class="wrap"><nav class="prox-areas">
  <a href="${ant.pagina}"><small>← Área anterior</small><strong><b>${ant.num}</b>${esc(ant.titulo)}</strong></a>
  <a class="dir" href="${prox.pagina}"><small>Próxima área →</small><strong><b>${prox.num}</b>${esc(prox.titulo)}</strong></a>
</nav></div>
<footer class="rodape"><div class="wrap"><span>ITALLO CUNHA · PORTFÓLIO</span><span>FEITO COM PIXELS, IDEIAS E CAFÉ <b>&lt;3</b></span></div></footer>`;
app.innerHTML = html;

/* ---------- itens por grupo (pranchas e artes) ---------- */
const GRUPOS = {};
ativs.forEach((a,i)=>{ GRUPOS['apr-'+i] = a.apresentacao; GRUPOS['art-'+i] = a.artes; });
const legendaDe = (it,j) => it.legenda || `Arte ${dois(j+1)}`;
/* sprites pequenos (pixel art) crescem sem borrar */
function pixelar(im, it, alvo){
  im.classList.remove('pixel'); im.style.width = '';
  if(!it.w || Math.max(it.w,it.h) >= 320) return;
  const k = Math.max(2, Math.floor(alvo / Math.max(it.w,it.h)));
  im.classList.add('pixel'); im.style.width = (it.w*k)+'px';
}

/* ---------- tela cheia ---------- */
const lb = document.createElement('div');
lb.className = 'lb'; lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true');
lb.innerHTML = `<div class="lb-topo"><span class="legenda"></span><span class="contador"></span>
  <a class="orig" target="_blank" rel="noopener">Original ${ICO.seta}</a>
  <button class="fechar" aria-label="Fechar">${ICO.x} Fechar</button></div>
  <div class="lb-palco"><button class="seta ant" aria-label="Anterior">${ICO.esq}</button><img alt=""><button class="seta prox" aria-label="Próxima">${ICO.dir}</button></div>
  <div class="lb-dica">CLIQUE NA IMAGEM PARA DAR ZOOM · ← → PARA NAVEGAR · ESC PARA FECHAR</div>`;
document.body.appendChild(lb);
const lbImg = lb.querySelector('img'), lbPalco = lb.querySelector('.lb-palco');
let lbGrupo = null, lbI = 0, aoFechar = null;
function lbMostrar(){
  const lista = GRUPOS[lbGrupo], it = lista[lbI];
  lbPalco.classList.remove('zoom'); lbImg.style.transform = '';
  lbImg.src = url(it.src); lbImg.alt = legendaDe(it,lbI); pixelar(lbImg, it, 640);
  lb.querySelector('.legenda').textContent = legendaDe(it,lbI);
  lb.querySelector('.contador').textContent = `${dois(lbI+1)} / ${dois(lista.length)}`;
  lb.querySelector('.orig').href = url(it.original);
  [lista[lbI+1],lista[lbI-1]].forEach(n=>{ if(n){ const im=new Image(); im.src=url(n.src);} });
}
function lbAbrir(grupo,i,cb){ lbGrupo=grupo; lbI=i; aoFechar=cb||null; lbMostrar(); lb.classList.add('aberto'); document.body.style.overflow='hidden'; lb.querySelector('.fechar').focus(); }
function lbFechar(){ lb.classList.remove('aberto'); document.body.style.overflow=''; aoFechar && aoFechar(lbI); }
function lbIr(d){ const n=GRUPOS[lbGrupo].length; lbI=(lbI+d+n)%n; lbMostrar(); }
lb.querySelector('.fechar').onclick = lbFechar;
lb.querySelector('.ant').onclick = ()=>lbIr(-1);
lb.querySelector('.prox').onclick = ()=>lbIr(1);
lbPalco.addEventListener('click',e=>{ if(e.target===lbPalco) lbFechar(); });
lbImg.addEventListener('click',e=>{
  const z = lbPalco.classList.toggle('zoom');
  if(z){ zoomEm(e); } else lbImg.style.transform='';
});
function zoomEm(e){
  const r = lbImg.getBoundingClientRect();
  const x = ((e.clientX - r.left)/r.width - .5)*-100, y = ((e.clientY - r.top)/r.height - .5)*-100;
  lbImg.style.transform = `scale(2.4) translate(${x/2.4*1.6}%,${y/2.4*1.6}%)`;
}
lbPalco.addEventListener('mousemove',e=>{ if(lbPalco.classList.contains('zoom')){
  const r = lbPalco.getBoundingClientRect();
  const x = ((e.clientX - r.left)/r.width - .5)*-70, y = ((e.clientY - r.top)/r.height - .5)*-70;
  lbImg.style.transform = `scale(2.4) translate(${x}%,${y}%)`;
}});
addEventListener('keydown',e=>{
  if(!lb.classList.contains('aberto')) return;
  if(e.key==='Escape') lbFechar();
  if(e.key==='ArrowRight') lbIr(1);
  if(e.key==='ArrowLeft') lbIr(-1);
});
swipe(lbPalco, d=>{ if(!lbPalco.classList.contains('zoom')) lbIr(d); });

/* pranchas abrem em tela cheia */
document.querySelectorAll('.prancha').forEach(p=>{
  const abrir = ()=>lbAbrir(p.dataset.grupo, +p.dataset.i);
  p.addEventListener('click',abrir);
  p.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); abrir(); } });
});

/* ---------- carrosséis ---------- */
document.querySelectorAll('.carrossel').forEach(car=>{
  const lista = GRUPOS[car.dataset.grupo], palco = car.querySelector('.palco'), minis = [...car.querySelectorAll('.miniaturas button')];
  const slides = lista.map(()=>{ const s=document.createElement('div'); s.className='slide'; palco.insertBefore(s, palco.querySelector('.seta')); return s; });
  let atual = -1;
  function carregar(i){
    const s = slides[i]; if(!s || s.firstChild) return;
    const im = new Image(); im.decoding='async'; im.src = url(lista[i].src); im.alt = legendaDe(lista[i],i);
    im.addEventListener('click',()=>lbAbrir(car.dataset.grupo, atual, j=>ir(j)));
    pixelar(im, lista[i], 480);
    s.appendChild(im);
  }
  function ir(i){
    i = (i + lista.length) % lista.length;
    if(i===atual) return;
    const dir = i > atual ? 1 : -1;
    slides.forEach((s,j)=>{ s.classList.toggle('ativo', j===i); s.style.transform = j===i ? 'none' : `translateX(${(j<i?-1:1)*40}px)`; });
    atual = i; carregar(i); carregar((i+1)%lista.length); carregar((i-1+lista.length)%lista.length);
    const img = slides[i].querySelector('img');
    const pronto = ()=>{ palco.querySelector('.carregando').style.display='none'; };
    img.complete ? pronto() : (palco.querySelector('.carregando').style.display='', img.addEventListener('load',pronto,{once:true}));
    minis.forEach((m,j)=>{ m.classList.toggle('ativo',j===i); m.setAttribute('aria-selected',j===i); });
    const m = minis[i], fila = m.parentNode;
    fila.scrollLeft = m.offsetLeft - fila.clientWidth/2 + m.clientWidth/2;
    car.querySelector('.contador').textContent = `${dois(i+1)} / ${dois(lista.length)}`;
    car.querySelector('.legenda').textContent = legendaDe(lista[i],i);
    car.querySelector('.orig').href = url(lista[i].original);
  }
  car.querySelector('.seta.ant').onclick = ()=>ir(atual-1);
  car.querySelector('.seta.prox').onclick = ()=>ir(atual+1);
  minis.forEach((m,j)=>m.onclick=()=>ir(j));
  car.querySelector('.abrir-cheia').onclick = ()=>lbAbrir(car.dataset.grupo, atual, j=>ir(j));
  palco.addEventListener('keydown',e=>{ if(e.key==='ArrowRight') ir(atual+1); if(e.key==='ArrowLeft') ir(atual-1); });
  swipe(palco, d=>ir(atual+d));
  ir(0);
});

function swipe(el, fn){
  let x0=null, y0=null;
  el.addEventListener('pointerdown',e=>{ if(e.pointerType!=='mouse'){ x0=e.clientX; y0=e.clientY; } });
  el.addEventListener('pointerup',e=>{
    if(x0===null) return; const dx=e.clientX-x0, dy=e.clientY-y0; x0=null;
    if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)) fn(dx<0?1:-1);
  });
}

/* ---------- título da área: letras em onda + glitch de tempos em tempos ---------- */
const h1=document.querySelector('.hero h1');
if(h1){
  const txt=h1.textContent; h1.setAttribute('aria-label',area.titulo); h1.textContent='';
  [...txt].forEach((c,i)=>{ const s=document.createElement('span'); s.className='l'; s.textContent=c===' '?' ':c; s.style.setProperty('--i',i); s.setAttribute('aria-hidden','true'); h1.appendChild(s); });
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches){
    (function prox(){ setTimeout(()=>{ h1.classList.add('glitch'); setTimeout(()=>h1.classList.remove('glitch'),460); prox(); },5000+Math.random()*5000); })();
  }
}

/* ---------- revelar ao rolar ---------- */
const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{threshold:.08});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));
if(location.hash){ setTimeout(()=>document.querySelector(location.hash)?.scrollIntoView(),60); }
})();
