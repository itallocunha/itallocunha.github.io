/* Monta a página de aula a partir de dados.js (lista) + conteudo.js (texto da página). */
(()=>{
const slug=document.body.dataset.slug;
const lista=window.AULAS||[], c=window.CONTEUDO||{};
const t=lista.find(x=>x.slug===slug)||{nome:slug,slug,icone:null};
const idx=lista.indexOf(t);
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const dois=n=>String(n).padStart(2,'0');
const ico=x=>x.icone?`../../assets/icones/${x.icone}.png`:'';
const dataBR=d=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(d||'');return m?`${m[3]}/${m[2]}/${m[1]}`:esc(d||'')};
document.body.insertAdjacentHTML('afterbegin','<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter></svg>');
document.title=`${t.nome} · Aulas · Itallo Cunha`;

document.getElementById('topo').innerHTML=`<div class="wrap">
  <a class="logo" href="../../index.html">IC</a>
  <a class="voltar" href="../../index.html#aulas"><svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3 5 8l5 5"/></svg><span>Voltar às aulas</span></a>
  <nav class="areas-nav" aria-label="Ferramentas que ensino">
    ${lista.map(x=>`<a href="../${x.slug}/index.html" class="${x.slug===slug?'atual':''}"><img src="${ico(x)}" alt="">${esc(x.nome)}</a>`).join('')}
  </nav></div>`;
setTimeout(()=>document.querySelector('.areas-nav .atual')?.scrollIntoView({inline:'center',block:'nearest'}),50);

const topicos=c.topicos||[], passos=c.passos||[], posts=[...(c.posts||[])].sort((a,b)=>(b.data||'').localeCompare(a.data||'')), midia=c.midia||[];
let h=`<section class="aula-hero" style="--cor:${t.cor||'#8f4dff'}"><div class="wrap">
  <div>
    <span class="rotulo">Aulas / Ferramenta ${dois(idx+1)} de ${dois(lista.length)}</span>
    <h1 class="rough">${esc(t.nome.toUpperCase())}</h1>
    <p class="lead">${esc(c.intro||t.resumo)}</p>
    ${topicos.length?`<div class="chips">${topicos.map(x=>`<span>${esc(x.titulo)}</span>`).join('')}</div>`:''}
    <p class="mao">Aqui eu conto como<br>eu ensino isso</p>
  </div>
  <div class="icone-palco"><i></i><i></i><i></i><i></i>${t.icone?`<img src="${ico(t)}" alt="Ícone de ${esc(t.nome)}">`:''}</div>
</div></section>`;

if(passos.length) h+=`<section class="sec"><div class="wrap">
  <div class="sec-cab rv"><span class="num">01</span><h2>Como eu trabalho</h2></div>
  <div class="passos">${passos.map((p,i)=>`<div class="passo rv"><b>PASSO ${dois(i+1)}</b><h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}</p></div>`).join('')}</div>
</div></section>`;

if(topicos.length) h+=`<section class="sec"><div class="wrap">
  <div class="sec-cab rv"><span class="num">02</span><h2>O que a gente aprende</h2></div>
  <div class="topicos">${topicos.map(p=>`<div class="topico rv"><div><h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}</p></div></div>`).join('')}</div>
</div></section>`;

if(c.opiniao) h+=`<section class="sec"><div class="wrap">
  <div class="opiniao rv"><small>Minha opinião</small><blockquote>${esc(c.opiniao)}</blockquote><p class="assina">Itallo</p></div>
</div></section>`;

h+=`<section class="sec" id="diario"><div class="wrap">
  <div class="sec-cab rv"><span class="num">03</span><h2>Diário de aula</h2></div>
  ${posts.length?`<div class="diario">${posts.map(p=>`<article class="post rv"><time datetime="${esc(p.data)}">${dataBR(p.data)}</time><h3>${esc(p.titulo)}</h3>
    ${(p.texto||[]).map(x=>`<p>${esc(x)}</p>`).join('')}
    ${p.img?`<figure><img src="${esc(p.img)}" alt="${esc(p.legenda||p.titulo)}" loading="lazy">${p.legenda?`<figcaption>${esc(p.legenda)}</figcaption>`:''}</figure>`:''}
    ${p.video?`<figure><video src="${esc(p.video)}" controls preload="metadata"></video>${p.legenda?`<figcaption>${esc(p.legenda)}</figcaption>`:''}</figure>`:''}
  </article>`).join('')}</div>`:`<div class="em-breve rv"><b>Em breve</b>os primeiros textos estão a caminho.</div>`}
</div></section>`;

h+=`<section class="sec" id="galeria"><div class="wrap">
  <div class="sec-cab rv"><span class="num">04</span><h2>Galeria</h2></div>
  ${midia.length?`<div class="galeria">${midia.map((m,i)=>{
    const leg=m.legenda?`<span>${esc(m.legenda)}</span>`:'';
    if(m.tipo==='video') return `<div class="gitem v rv"><video src="${esc(m.src)}" controls preload="metadata"></video>${leg}</div>`;
    if(m.tipo==='youtube') return `<div class="gitem v rv"><iframe src="https://www.youtube-nocookie.com/embed/${esc(m.id)}" title="${esc(m.legenda||'Vídeo')}" allowfullscreen loading="lazy"></iframe>${leg}</div>`;
    return `<button type="button" class="gitem rv" data-i="${i}"><img src="${esc(m.src)}" alt="${esc(m.legenda||'')}" loading="lazy">${leg}</button>`;
  }).join('')}</div>`:`<div class="em-breve rv"><b>Em breve</b>imagens e vídeos das aulas de ${esc(t.nome)} vão aparecer aqui.</div>`}
</div></section>`;

const ant=lista[(idx-1+lista.length)%lista.length], prox=lista[(idx+1)%lista.length];
h+=`<section class="outras"><div class="wrap">
  <div class="sec-cab"><h2>Outras ferramentas</h2></div>
  <div class="outras-grade">${lista.map(x=>`<a href="../${x.slug}/index.html" class="${x.slug===slug?'atual':''}"><img src="${ico(x)}" alt="">${esc(x.nome)}</a>`).join('')}</div>
  <div class="prox"><a class="btn-px alt" href="../${ant.slug}/index.html">◂ ${esc(ant.nome)}</a><a class="btn-px" href="../../index.html#aulas">Voltar às aulas</a><a class="btn-px alt" href="../${prox.slug}/index.html">${esc(prox.nome)} ▸</a></div>
</div></section>
<div class="lbx" id="lbx"><img alt=""><p></p></div>`;
document.getElementById('app').innerHTML=h;

const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));
const lbx=document.getElementById('lbx');
document.querySelectorAll('.gitem[data-i]').forEach(b=>b.addEventListener('click',()=>{
  const m=midia[+b.dataset.i]; lbx.querySelector('img').src=m.src; lbx.querySelector('p').textContent=m.legenda||''; lbx.classList.add('aberto');
}));
lbx.addEventListener('click',()=>lbx.classList.remove('aberto'));
addEventListener('keydown',e=>{if(e.key==='Escape')lbx.classList.remove('aberto')});
})();
