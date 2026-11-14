/* ============================================================
   INFINITY RUN · mini-jogo da seção de contato
   Canvas 320x200 (pixel art), escalado por CSS com image-rendering: pixelated.
   Controles: ESPAÇO / ↑ / W / toque = pular (dá pra pular 2x) · P / Esc = pausar · M = som
   Tudo desenhado por código: nenhum arquivo de imagem ou áudio é necessário.
   ============================================================ */
(function(){
'use strict';
const root = document.getElementById('jogo');
if(!root) return;
const cv = document.getElementById('jogoTela');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = 320, H = 200, GY = 166, PX = 48;          // largura, altura, topo do chão, x do jogador
const REDUCED = !!window.__calmo;
const $ = id => document.getElementById(id);
const el = {
  pts:$('jPts'), hi:$('jHi'), tela:$('jTela'), titulo:$('jTitulo'), sub:$('jSub'), dica:$('jDica'),
  play:$('jPlay'), playTxt:$('jPlayTxt'), pause:$('jPause'), som:$('jSom')
};

/* ---------- utilidades ---------- */
const rnd  = (a,b) => a + Math.random()*(b-a);
const rndI = (a,b) => Math.floor(rnd(a,b+1));
const pick = a => a[Math.floor(Math.random()*a.length)];
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp = (a,b,t) => a+(b-a)*t;
const smooth = t => { t=clamp(t,0,1); return t*t*(3-2*t); };
function seeded(seed){ return () => (seed = (seed*1664525+1013904223)>>>0) / 4294967296; }
function mk(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); x.imageSmoothingEnabled=false; return [c,x]; }
function sprite(rows,pal){
  const [c,x] = mk(rows[0].length, rows.length);
  rows.forEach((r,j)=>{ for(let i=0;i<r.length;i++){ const col=pal[r[i]]; if(col){ x.fillStyle=col; x.fillRect(i,j,1,1); } } });
  return c;
}
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
};

/* ---------- sprites ---------- */
/* personagem 16x16: cabelo escuro, barba, camiseta branca, calça roxa escura, tênis branco */
const PAL_P = {H:'#2a1a22',S:'#f0b48a',B:'#3b2428',E:'#0d0915',W:'#f4effb',w:'#b9acd6',P:'#3a2a78',p:'#5b46b0',F:'#ffffff',f:'#0d0915'};
const RUN_A = [
  "................",
  ".....HHHHH......",
  "....HHHHHHH.....",
  "....HHSSSSS.....",
  "....HHSSSES.....",
  "....HBBBBBB.....",
  ".....BBBBB......",
  "....WWWWWWW.....",
  "...SWWWWWWWS....",
  "...SWWWWwwW.....",
  "....WWWWWWW.....",
  "....PPPPPPP.....",
  "....PPPpPPP.....",
  "...PPP...PPP....",
  "..PPP.....PP....",
  "..FFf.....FFf..."
];
const RUN_B = [
  "................",
  ".....HHHHH......",
  "....HHHHHHH.....",
  "....HHSSSSS.....",
  "....HHSSSES.....",
  "....HBBBBBB.....",
  ".....BBBBB......",
  "....WWWWWWW.....",
  "....WWWWWWW.....",
  "....SWWWwWS.....",
  "....WWWWWWW.....",
  "....PPPPPPP.....",
  "....PPPpPPP.....",
  ".....PPPPP......",
  ".....PP.PP......",
  ".....FF.FFf....."
];
const JUMP = [
  "................",
  ".....HHHHH......",
  "....HHHHHHH.....",
  "....HHSSSSS.....",
  "....HHSSSES.....",
  "....HBBBBBB.....",
  ".....BBBBB......",
  "..S.WWWWWWW.S...",
  "..S.WWWWWWW.S...",
  "....WWWWwWW.....",
  "....WWWWWWW.....",
  "....PPPPPPPP....",
  "...PPPPPpPPPP...",
  "...PPP....PPP...",
  "...FFf....FFf...",
  "................"
];
const SPR = {
  runA:sprite(RUN_A,PAL_P), runB:sprite(RUN_B,PAL_P), jump:sprite(JUMP,PAL_P),
  spike:sprite([
    "....cc....",
    "...cCCc...",
    "...cCCc...",
    "..cCCCCc..",
    "..cCCCCc..",
    ".cCCCCCCc.",
    ".cCCCCCCc.",
    "cCCCCCCCCc",
    "cCCCCCCCCc",
    "kkkkkkkkkk"
  ],{c:'#ff9ad5',C:'#e03a8c',k:'#5a2a8a'}),
  bug:sprite([
    "..a......a..",
    "...a....a...",
    "..RRRRRRRR..",
    ".RRWWRRWWRR.",
    ".RRKWRRKWRR.",
    "RRRRRRRRRRRR",
    "RrRRRRRRRRrR",
    "RRRRKKKKRRRR",
    ".RRRRRRRRRR.",
    "..R.R..R.R..",
    ".R..R..R..R."
  ],{R:'#ff4d6d',r:'#c71f4a',W:'#ffffff',K:'#0d0915',a:'#ffd23a'}),
  batUp:sprite([
    "k............k",
    "kk...k..k...kk",
    "kkk.kkkkkk.kkk",
    "kkkkkrkkrkkkkk",
    ".kkkkkkkkkkkk.",
    "..kk..kk..kk..",
    ".............."
  ],{k:'#b98bff',r:'#ff4d6d'}),
  batDn:sprite([
    "....kk..kk....",
    "...kkkkkkkk...",
    "..kkkrkkrkkk..",
    "kkkkkkkkkkkkkk",
    "kk.kkkkkkkk.kk",
    "k............k",
    ".............."
  ],{k:'#b98bff',r:'#ff4d6d'}),
  star:sprite([
    "...yy...",
    "..yyyy..",
    "yyyyyyyy",
    ".yyyyyy.",
    "..yyyy..",
    ".yyyyyy.",
    ".yy..yy.",
    ".y....y."
  ],{y:'#ffd23a'}),
  starW:sprite([
    "...yy...",
    "..yyyy..",
    "yyyyyyyy",
    ".yyyyyy.",
    "..yyyy..",
    ".yyyyyy.",
    ".yy..yy.",
    ".y....y."
  ],{y:'#fff6c2'}),
  icG:[ "111","010","010","010","111" ],
  icC:[ "111","100","100","100","111" ]
};

/* ---------- cenário (camadas pré-renderizadas) ---------- */
const SW = 480;                       // largura de cada faixa que se repete
function buildings(seed,o){
  const r = seeded(seed), [c,x] = mk(SW,GY+1);
  let bx = 0;
  while(bx < SW){
    let bw = Math.round(o.wmin + r()*(o.wmax-o.wmin));
    if(SW-(bx+bw) < o.wmin) bw = SW-bx;
    const bh = Math.round(o.hmin + r()*(o.hmax-o.hmin)), by = GY+1-bh;
    x.fillStyle = o.col; x.fillRect(bx,by,bw,bh);
    if(o.edge){ x.fillStyle=o.edge; x.fillRect(bx,by,1,bh); x.fillRect(bx,by,bw,1); }
    const k = r();
    if(o.roof){
      if(k<.28){ x.fillStyle=o.col; x.fillRect(bx+(bw>>1),by-9,1,9); x.fillStyle='#ff4d6d'; x.fillRect(bx+(bw>>1),by-10,1,1); }
      else if(k<.55){ x.fillStyle=o.col; x.fillRect(bx+3,by-5,Math.max(5,bw>>2),5); x.fillRect(bx+4,by-7,Math.max(3,(bw>>2)-2),2); }
      else if(k<.7){ x.fillStyle=o.col; x.fillRect(bx+2,by-4,bw-4,4); }
    }
    const cols = o.win;
    for(let wy=by+4; wy<GY-3; wy+=o.gy){
      for(let wx=bx+3; wx<bx+bw-o.ww-1; wx+=o.gx){
        if(r()<o.winP){ x.fillStyle = cols[Math.floor(r()*cols.length)]; x.fillRect(wx,wy,o.ww,o.wh); }
      }
    }
    bx += bw;
  }
  return c;
}
function cloudStrip(seed,ymin,ymax,wmin,wmax,n){
  const r = seeded(seed), [c,x] = mk(SW,110);
  x.fillStyle = '#ffffff';
  for(let i=0;i<n;i++){
    const w = Math.round(wmin + r()*(wmax-wmin)), cx = Math.round(i*(SW/n) + r()*(SW/n-w*.4)), cy = Math.round(ymin + r()*(ymax-ymin));
    x.fillRect(cx, cy+8, w, 3);
    x.fillRect(cx+4, cy+5, w-8, 3);
    x.fillRect(cx+Math.round(w*.2), cy+1, Math.round(w*.3), 4);
    x.fillRect(cx+Math.round(w*.5), cy+3, Math.round(w*.22), 2);
  }
  return c;
}
const L = {
  far:  buildings(11,{col:'#2b1759',edge:'#3a2072',hmin:42,hmax:92,wmin:16,wmax:34,win:['#4a2b8a','#5a37a3'],ww:1,wh:1,gx:4,gy:5,winP:.22,roof:true}),
  mid:  buildings(23,{col:'#1b0d38',edge:'#2c1857',hmin:48,hmax:104,wmin:22,wmax:40,win:['#ffd23a','#ffb86b','#ffe9a0'],ww:2,wh:3,gx:6,gy:8,winP:.3,roof:true}),
  near: buildings(37,{col:'#0f0820',edge:'#3b1d6e',hmin:26,hmax:66,wmin:26,wmax:48,win:['#ffd23a','#ff7ac8','#7af0ff'],ww:3,wh:4,gx:8,gy:10,winP:.34,roof:false}),
  cFar: cloudStrip(5,8,50,26,46,9),
  cNear:cloudStrip(9,40,84,44,76,6)
};
/* placa de neon "IC" (Itallo Cunha) escondida na camada da frente */
(function(){
  const n = L.near.getContext('2d');
  [[96,GY-56],[330,GY-48]].forEach(([sx,sy],i)=>{
    n.fillStyle = '#14102e'; n.fillRect(sx-2,sy-2,17,11);
    n.fillStyle = i? '#7af0ff':'#ff7ac8'; n.fillRect(sx-2,sy-2,17,1); n.fillRect(sx-2,sy+8,17,1); n.fillRect(sx-2,sy-2,1,11); n.fillRect(sx+14,sy-2,1,11);
    n.fillStyle='#fff';
    SPR.icG.forEach((row,j)=>{ for(let k=0;k<3;k++) if(row[k]==='1') n.fillRect(sx+1+k*2, sy+j+1, 2, 1); });
    SPR.icC.forEach((row,j)=>{ for(let k=0;k<3;k++) if(row[k]==='1') n.fillRect(sx+8+k*2, sy+j+1, 2, 1); });
  });
})();
/* chão */
const GROUND = (function(){
  const [c,x] = mk(32,H-GY);
  x.fillStyle='#24124d'; x.fillRect(0,0,32,H-GY);
  x.fillStyle='#1a0c3b'; x.fillRect(0,22,32,H-GY-22);
  x.fillStyle='#ffd23a'; x.fillRect(0,0,32,2);
  x.fillStyle='#8f4dff'; x.fillRect(0,2,32,2);
  x.fillStyle='#34206b';
  [10,20,30].forEach(y=>x.fillRect(0,y,32,1));
  [[8,4,10],[24,4,10],[0,11,20],[16,11,20],[8,21,30],[24,21,30]].forEach(([vx,y0,y1])=>x.fillRect(vx,y0,1,Math.min(10,y1-y0)));
  x.fillStyle='#4a2f92'; [[3,6],[18,7],[27,14],[11,15],[5,25],[21,27]].forEach(([a,b])=>x.fillRect(a,b,2,1));
  return c;
})();
const [VIG] = (function(){
  const [c,x] = mk(W,H);
  const g = x.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,W*.62);
  g.addColorStop(0,'rgba(8,4,16,0)'); g.addColorStop(1,'rgba(8,4,16,.55)');
  x.fillStyle=g; x.fillRect(0,0,W,H); return [c];
})();

/* paletas do céu: entardecer → noite → amanhecer */
const PALS = [
  {top:[27,15,58],  mid:[106,42,143], bot:[255,122,89], sun:[255,210,58],  sunY:GY-52, star:.5,  cloud:.30, bands:1},
  {top:[7,4,15],    mid:[20,10,46],   bot:[59,29,110],  sun:[232,224,245], sunY:40,     star:1,   cloud:.10, bands:0},
  {top:[26,16,64],  mid:[91,59,166],  bot:[255,184,107],sun:[255,236,150], sunY:GY-42, star:.28, cloud:.34, bands:.5}
];
const PHASE = 200;                               // pontos por fase do dia
function sky(score){
  const p = Math.max(0,score)/PHASE, i = Math.floor(p)%3, f = smooth(((p%1)-.7)/.3);
  const a = PALS[i], b = PALS[(i+1)%3], o = {};
  ['top','mid','bot','sun'].forEach(k=>{ o[k]=a[k].map((v,j)=>Math.round(lerp(v,b[k][j],f))); });
  ['sunY','star','cloud','bands'].forEach(k=>{ o[k]=lerp(a[k],b[k],f); });
  o.night = i===1 ? 1-f : (i===0 ? f : 0);
  return o;
}
const rgb = (a,al) => al==null ? `rgb(${a[0]},${a[1]},${a[2]})` : `rgba(${a[0]},${a[1]},${a[2]},${al})`;

/* estrelas fixas do fundo */
const BGSTARS = Array.from({length:70},()=>({x:rndI(0,W-1),y:rndI(2,GY-44),s:Math.random()<.2?2:1,ph:rnd(0,6.28)}));
const EMBERS = Array.from({length:14},()=>({x:rnd(0,W),y:rnd(GY-70,GY),v:rnd(4,12),ph:rnd(0,6.28)}));
const STREAKS = Array.from({length:9},()=>({x:rnd(0,W),y:rnd(20,GY-6),l:rndI(8,22),k:rnd(1.4,2.6)}));

/* ---------- estado ---------- */
let state = 'idle';            // idle | run | dead | over
let paused = false, visible = true, raf = 0, last = 0;
let scroll = 0, dist = 0, bonus = 0, score = 0, speed = 62, nextMs = 100, msT = 0, msTxt = '';
let hi = parseInt(store.get('infinity-run-hi')||'0',10) || 0, newRecord = false;
let muted = store.get('infinity-run-mudo') === '1';
const P = {y:GY, vy:0, on:true, jumps:0, coyote:0, buf:0, t:0, rot:0, cut:false};
let segs = [], plats = [], haz = [], pick$ = [], decor = [], parts = [], floats = [], shoots = [];
let gx = 0, lastP = '', lampIn = 80, shake = 0, flash = 0, deadT = 0, jumpHeld = false, shootIn = rnd(4,9), clock = 0;

function reset(){
  segs = [{x:-60,w:W+260}]; plats=[]; haz=[]; pick$=[]; decor=[]; parts=[]; floats=[]; shoots=[];
  gx = W+200; lastP=''; dist=0; bonus=0; score=0; nextMs=100; msT=0; shake=0; flash=0; deadT=0; newRecord=false;
  P.y=GY; P.vy=0; P.on=true; P.jumps=0; P.coyote=0; P.buf=0; P.rot=0; P.cut=false; P.t=0;
  hud(true);
}

/* ---------- som (Web Audio, tudo sintetizado) ---------- */
let AC = null;
function audio(){
  if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ AC=null; } }
  if(AC && AC.state==='suspended'){ try{ AC.resume(); }catch(e){} }
  return AC;
}
function tone(f0,f1,dur,type,vol,delay){
  if(muted) return; const a = audio(); if(!a) return;
  const t = a.currentTime + (delay||0), o = a.createOscillator(), g = a.createGain();
  o.type = type||'square';
  o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(vol==null?.05:vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+dur+.03);
}
function noise(dur,vol){
  if(muted) return; const a = audio(); if(!a) return;
  const n = Math.floor(a.sampleRate*dur), buf = a.createBuffer(1,n,a.sampleRate), d = buf.getChannelData(0);
  for(let i=0;i<n;i++) d[i] = (Math.random()*2-1)*(1-i/n);
  const s = a.createBufferSource(), g = a.createGain(); s.buffer = buf; g.gain.value = vol||.08;
  s.connect(g); g.connect(a.destination); s.start();
}
const SFX = {
  jump:   () => tone(260,540,.13,'square',.045),
  jump2:  () => { tone(420,900,.12,'square',.04); },
  land:   () => tone(130,70,.06,'triangle',.06),
  star:   () => { tone(988,988,.06,'square',.04); tone(1319,1319,.12,'square',.04,.06); },
  hit:    () => { noise(.28,.09); tone(240,45,.45,'sawtooth',.06); },
  mile:   () => [523,659,784,1047].forEach((f,i)=>tone(f,f,.09,'square',.04,i*.08)),
  start:  () => [392,523,659,784].forEach((f,i)=>tone(f,f,.07,'square',.04,i*.06)),
  pause:  () => tone(330,247,.07,'square',.04),
  resume: () => tone(247,330,.07,'square',.04),
  record: () => [659,784,988,1319,1568].forEach((f,i)=>tone(f,f,.1,'square',.045,i*.09))
};

/* ---------- partículas ---------- */
function burst(x,y,n,cols,vx,vy,life){
  for(let i=0;i<n;i++) parts.push({x,y,vx:rnd(-vx,vx),vy:rnd(-vy,vy*.3),life:rnd(.25,life),t:0,c:pick(cols),s:Math.random()<.3?2:1});
}

/* ---------- mundo: geração ---------- */
function addGround(x,w){
  const l = segs[segs.length-1];
  if(l && Math.abs(l.x+l.w-x) < 2) l.w += w; else segs.push({x,w});
}
function arc(cx,n,y){
  for(let i=0;i<n;i++) pick$.push({x:cx+(i-(n-1)/2)*12-4, y:y-Math.sin(Math.PI*(n===1?.5:i/(n-1)))*9-4, ph:rnd(0,6)});
}
function spike(x){ haz.push({t:'spike',x,y:GY-10,w:10,h:10,ix:2,iy:3,i2:1}); }
function bug(x){ haz.push({t:'bug',x,y:GY-11,w:12,h:11,ix:2,iy:2,i2:1}); }
function spawn(){
  const react = speed*.8, pad = rnd(react*1.05,react*1.7);
  addGround(gx,pad);
  let x = gx+pad;
  const bag = ['spike'];
  if(score>=25) bag.push('gap','coins');
  if(score>=45) bag.push('tower');
  if(score>=70) bag.push('bug','bat');
  if(score>=100) bag.push('bridge','bug');
  let t = pick(bag); if(t===lastP && bag.length>1) t = pick(bag); lastP = t;
  if(t==='spike'){
    const n = clamp(1+(Math.random()<.3+score/500?1:0)+(score>120&&Math.random()<.3?1:0),1,3);
    for(let i=0;i<n;i++) spike(x+8+i*10);
    const len = 22+n*10; addGround(x,len);
    if(Math.random()<.5) arc(x+len/2,3,GY-34);
    x += len;
  } else if(t==='bug'){
    bug(x+10); let len = 38;
    if(score>150 && Math.random()<.4){ bug(x+10+34); len = 74; }
    addGround(x,len); arc(x+len/2,3,GY-34); x += len;
  } else if(t==='coins'){
    addGround(x,96); arc(x+48,5,GY-26); x += 96;
  } else if(t==='gap'){
    const gw = Math.round(.36*speed*rnd(.8,1)); arc(x+gw/2,3,GY-30); x += gw;
  } else if(t==='bridge'){
    const gw = Math.round(.6*speed*rnd(.9,1.05));
    plats.push({x:x-14,w:gw+28,y:GY-34}); arc(x+gw/2,3,GY-38); x += gw;
  } else if(t==='tower'){
    spike(x+26); plats.push({x:x+6,w:52,y:GY-34}); arc(x+32,3,GY-38); addGround(x,76); x += 76;
  } else if(t==='bat'){
    haz.push({t:'bat',x:x+28,y:GY-31,by:GY-31,w:14,h:7,ix:2,iy:1,i2:1,ph:rnd(0,6)}); addGround(x,100); x += 100;
  }
  gx = x;
}

/* ---------- controle ---------- */
function jump(){
  if(state!=='run' || paused) return;
  if(P.on || P.coyote>0){ doJump(false); }
  else if(P.jumps<2 && P.jumps>0){ doJump(true); }
  else P.buf = .12;
}
function doJump(air){
  P.vy = air ? -290 : -350; P.on = false; P.coyote = 0; P.jumps = air?2:1; P.buf = 0; P.cut = false;
  (air?SFX.jump2:SFX.jump)();
  if(air) burst(PX+8,P.y-2,8,['#b98bff','#ffffff','#ffd23a'],40,30,.4);
  else burst(PX+6,GY,5,['#8d82a0','#5b46b0'],28,16,.3);
}
function release(){ jumpHeld = false; if(state==='run' && P.vy < -230) P.vy = -230; }

function die(kind){
  if(state!=='run') return;
  state = 'dead'; deadT = 0; shake = REDUCED?0:.35; flash = REDUCED?0:.5;
  if(kind==='hit') P.vy = -230;
  syncBtns(); SFX.hit(); burst(PX+8,P.y-8,22,['#ff4d6d','#ffd23a','#ffffff','#b98bff'],110,110,.8);
  if(score>hi){ hi = score; newRecord = true; store.set('infinity-run-hi',String(hi)); }
  hud(true);
  root.classList.remove('jogando');
}

/* ---------- atualização ---------- */
const ov = (ax,ay,aw,ah,bx,by,bw,bh) => ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
function step(dt){
  clock += dt;
  if(state==='run') speed = Math.min(235,105+score*.2);
  else if(state==='idle') speed = 62;
  else speed = Math.max(0,speed-430*dt);
  const mv = speed*dt;
  scroll += mv; if(state==='run') dist += mv;
  if(state!=='idle'){
    segs.forEach(s=>s.x-=mv); plats.forEach(p=>p.x-=mv); haz.forEach(h=>{ h.x-=mv; }); pick$.forEach(s=>s.x-=mv);
    gx -= mv;
  } else { segs = [{x:-60,w:W+260}]; }
  decor.forEach(d=>d.x-=mv);
  segs = segs.filter(s=>s.x+s.w>-30); plats = plats.filter(p=>p.x+p.w>-30);
  haz = haz.filter(h=>h.x+h.w>-30); pick$ = pick$.filter(s=>s.x>-20&&!s.got); decor = decor.filter(d=>d.x>-20);
  lampIn -= mv; if(lampIn<=0){ decor.push({x:W+10}); lampIn = rnd(120,240); }
  if(state==='run'){ while(gx < W+110) spawn(); }
  haz.forEach(h=>{ if(h.t==='bat'){ h.x -= 22*dt; h.y = h.by + Math.sin(clock*5+h.ph)*3; } });

  /* jogador */
  P.t += dt*(speed/105);
  if(state==='run'){
    const prev = P.y;
    P.coyote = Math.max(0,P.coyote-dt); P.buf = Math.max(0,P.buf-dt);
    P.vy += 1000*dt; P.y += P.vy*dt;
    let land = null;
    if(P.vy>=0){
      if(segs.some(s=>s.x<PX+11 && s.x+s.w>PX+5) && prev<=GY+1 && P.y>=GY) land = GY;
      plats.forEach(p=>{ if(PX+11>p.x && PX+5<p.x+p.w && prev<=p.y+1 && P.y>=p.y) land = land==null?p.y:Math.min(land,p.y); });
    }
    if(land!=null){
      if(!P.on){ SFX.land(); burst(PX+8,land,4,['#8d82a0','#5b46b0'],24,10,.25); }
      P.y = land; P.vy = 0; P.on = true; P.jumps = 0;
      if(P.buf>0){ doJump(false); }
    } else { if(P.on){ P.coyote = .09; if(P.jumps===0) P.jumps = 1; } P.on = false; }
    if(P.y > GY+22) die('pit');
    /* colisões */
    const hx = PX+4, hy = P.y-14, hw = 8, hh = 13;
    for(const h of haz){ if(ov(hx,hy,hw,hh,h.x+h.ix,h.y+h.iy,h.w-h.ix*2,h.h-h.iy-h.i2)){ die('hit'); break; } }
    if(state==='run') pick$.forEach(s=>{
      if(!s.got && ov(hx-3,hy-3,hw+6,hh+6,s.x,s.y,8,8)){
        s.got = true; bonus += 10; SFX.star(); burst(s.x+4,s.y+4,6,['#ffd23a','#fff6c2'],36,36,.4);
        floats.push({x:s.x-2,y:s.y-2,t:'+10',life:.8,age:0});
      }
    });
    score = Math.floor(dist/10)+bonus;
    if(state==='run' && score>=nextMs){
      msTxt = nextMs+'!'; msT = 1.3; if(!REDUCED) flash = .3; SFX.mile(); nextMs += 100;
    }
    hud();
  } else if(state==='dead'){
    deadT += dt; P.vy += 1000*dt; P.y += P.vy*dt; P.rot += dt*9;
    if(deadT>1.05){ state='over'; telaFim(); }
  } else if(state==='idle'){
    P.y = GY; P.on = true;
  }

  /* efeitos */
  parts.forEach(p=>{ p.t+=dt; p.x+=p.vx*dt-mv*.6; p.y+=p.vy*dt; p.vy+=260*dt; });
  parts = parts.filter(p=>p.t<p.life);
  floats.forEach(f=>{ f.age+=dt; f.y-=22*dt; }); floats = floats.filter(f=>f.age<f.life);
  shoots.forEach(s=>{ s.x+=s.vx*dt; s.y+=s.vy*dt; s.age+=dt; }); shoots = shoots.filter(s=>s.age<.9);
  shootIn -= dt; if(shootIn<=0 && !REDUCED){ shootIn = rnd(5,11); shoots.push({x:rnd(60,W),y:rnd(6,50),vx:-rnd(110,170),vy:rnd(45,70),age:0}); }
  if(msT>0) msT -= dt; if(shake>0) shake -= dt; if(flash>0) flash -= dt;
  if(state==='run' && P.on && Math.random() < dt*14) parts.push({x:PX+3,y:GY,vx:rnd(-22,-6),vy:rnd(-26,-6),life:.3,t:0,c:'#8d82a0',s:1});
}

/* ---------- desenho ---------- */
const R = Math.round;
function layer(img,speedK,y,alpha){
  const off = R((scroll*speedK) % SW);
  if(alpha!=null) ctx.globalAlpha = alpha;
  ctx.drawImage(img,-off,y); ctx.drawImage(img,SW-off,y);
  if(SW*2-off<W) ctx.drawImage(img,SW*2-off,y);
  ctx.globalAlpha = 1;
}
function discSun(cx,cy,r,col,night,bands){
  ctx.fillStyle = rgb(col);
  for(let y=-r;y<=r;y++){
    if(bands>.3 && y>4 && y%5===0) continue;
    const w = Math.floor(Math.sqrt(r*r-y*y)); ctx.fillRect(cx-w,cy+y,w*2,1);
  }
  if(night>.2){
    ctx.globalAlpha = night*.35; ctx.fillStyle='#b8acd0';
    ctx.fillRect(cx-9,cy-8,6,5); ctx.fillRect(cx+4,cy-2,5,4); ctx.fillRect(cx-6,cy+6,7,4); ctx.globalAlpha = 1;
  }
}
function draw(){
  const s = sky(score);
  ctx.save();
  if(shake>0 && !REDUCED) ctx.translate(rndI(-2,2),rndI(-2,2));

  /* céu */
  const g = ctx.createLinearGradient(0,0,0,GY);
  g.addColorStop(0,rgb(s.top)); g.addColorStop(.55,rgb(s.mid)); g.addColorStop(1,rgb(s.bot));
  ctx.fillStyle = g; ctx.fillRect(-4,-4,W+8,H+8);
  /* estrelas */
  BGSTARS.forEach(st=>{
    const a = s.star*(.55+.45*Math.sin(clock*2+st.ph));
    if(a<.05) return;
    const x = ((st.x - scroll*.01)%W+W)%W;
    ctx.globalAlpha = clamp(a,0,1); ctx.fillStyle = st.s>1?'#fff6c2':'#ffffff'; ctx.fillRect(R(x),st.y,st.s,st.s);
  });
  ctx.globalAlpha = 1;
  shoots.forEach(sh=>{
    const a = 1-sh.age/.9; ctx.fillStyle = `rgba(255,255,255,${a})`;
    for(let i=0;i<9;i++){ ctx.globalAlpha = a*(1-i/9); ctx.fillRect(R(sh.x+i*3.2),R(sh.y-i*1.9),2,1); }
    ctx.globalAlpha = 1;
  });
  /* sol / lua */
  const sx = 236, sy = R(s.sunY);
  discSun(sx,sy,22,s.sun,s.night,s.bands);
  /* camadas de parallax */
  layer(L.cFar,.04,0,s.cloud*.9);
  layer(L.far,.12,0);
  layer(L.cNear,.09,0,s.cloud);
  layer(L.mid,.3,0);
  const hz = ctx.createLinearGradient(0,GY-70,0,GY);
  hz.addColorStop(0,rgb(s.bot,0)); hz.addColorStop(1,rgb(s.bot,.28));
  ctx.fillStyle = hz; ctx.fillRect(0,GY-70,W,70);
  layer(L.near,.62,0);
  /* vazio sob o chão */
  const vg = ctx.createLinearGradient(0,GY,0,H);
  vg.addColorStop(0,'#0a0612'); vg.addColorStop(1,'#3b1d6e');
  ctx.fillStyle = vg; ctx.fillRect(0,GY,W,H-GY);
  /* chão */
  ctx.save(); ctx.beginPath(); segs.forEach(sg=>ctx.rect(R(sg.x),GY,R(sg.w),H-GY)); ctx.clip();
  const goff = R(scroll % 32);
  for(let x=-goff; x<W; x+=32) ctx.drawImage(GROUND,x,GY);
  ctx.restore();
  ctx.fillStyle = '#0d0915';
  segs.forEach(sg=>{ if(sg.x>-2 && sg.x<W){ ctx.fillRect(R(sg.x)-1,GY,1,H-GY); } const e=sg.x+sg.w; if(e>0&&e<W) ctx.fillRect(R(e),GY,1,H-GY); });
  /* postes de luz */
  decor.forEach(d=>{
    const x = R(d.x);
    ctx.fillStyle = '#1b0d38'; ctx.fillRect(x,GY-34,2,34); ctx.fillRect(x-4,GY-36,8,2); ctx.fillRect(x+1,GY-1,0,0);
    const flick = .8+.2*Math.sin(clock*3+d.x);
    const gl = ctx.createRadialGradient(x-3,GY-34,1,x-3,GY-34,26);
    gl.addColorStop(0,`rgba(255,210,58,${.55*flick})`); gl.addColorStop(1,'rgba(255,210,58,0)');
    ctx.fillStyle = gl; ctx.fillRect(x-30,GY-60,60,60);
    ctx.fillStyle = '#fff6c2'; ctx.fillRect(x-5,GY-34,4,2);
  });
  /* plataformas */
  plats.forEach(p=>{
    const x = R(p.x), w = R(p.w);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x+2,p.y+8,w,3);
    ctx.fillStyle = '#4a2f92'; ctx.fillRect(x,p.y+2,w,6);
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(x,p.y,w,2);
    ctx.fillStyle = '#8f4dff'; ctx.fillRect(x,p.y+2,w,1);
    ctx.fillStyle = '#2a1654'; ctx.fillRect(x,p.y+7,w,1);
    ctx.fillStyle = '#6a45c8'; for(let i=4;i<w-3;i+=8) ctx.fillRect(x+i,p.y+4,3,1);
    ctx.fillStyle = '#0d0915'; ctx.fillRect(x-1,p.y,1,8); ctx.fillRect(x+w,p.y,1,8);
  });
  /* estrelas coletáveis */
  pick$.forEach(st=>{
    if(st.got) return;
    const bob = Math.sin(clock*4+st.ph)*1.5, img = (Math.floor(clock*6+st.ph)%2)?SPR.starW:SPR.star;
    ctx.drawImage(img,R(st.x),R(st.y+bob));
  });
  /* obstáculos */
  haz.forEach(h=>{
    const img = h.t==='bat' ? ((Math.floor(clock*8)%2)?SPR.batUp:SPR.batDn) : SPR[h.t];
    if(h.t==='bug'){ ctx.fillStyle='rgba(255,77,109,.18)'; ctx.fillRect(R(h.x)-1,GY-2,h.w+2,2); }
    ctx.drawImage(img,R(h.x),R(h.y));
  });
  /* jogador */
  if(P.on && state!=='dead'){ ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(PX+3,GY,10,1); }
  let img = SPR.jump;
  if(P.on) img = (Math.floor(P.t*9)%2) ? SPR.runB : SPR.runA;
  const py = R(P.y-16);
  if(state==='dead'){
    ctx.save(); ctx.translate(PX+8,py+8); ctx.rotate(P.rot); if(Math.floor(deadT*14)%2) ctx.globalAlpha=.55;
    ctx.drawImage(SPR.jump,-8,-8); ctx.restore();
  } else {
    ctx.drawImage(img,PX,py);
  }
  /* partículas, rastros, vagalumes */
  parts.forEach(p=>{ ctx.globalAlpha = clamp(1-p.t/p.life,0,1); ctx.fillStyle = p.c; ctx.fillRect(R(p.x),R(p.y),p.s,p.s); });
  ctx.globalAlpha = 1;
  if(state==='run'||state==='dead'){
    STREAKS.forEach(st=>{
      st.x -= speed*st.k*(1/60); if(st.x+st.l<0){ st.x=W+rnd(0,40); st.y=rnd(16,GY-6); st.l=rndI(8,22); }
      ctx.globalAlpha = .1+Math.min(.14,speed/1600); ctx.fillStyle='#ffffff'; ctx.fillRect(R(st.x),R(st.y),st.l,1);
    });
    ctx.globalAlpha = 1;
  }
  EMBERS.forEach(e=>{
    e.x -= (speed*.2+6)*(1/60); e.y -= e.v*(1/60); if(e.x<-4) e.x=W+4; if(e.y<GY-90) e.y=GY-2;
    ctx.globalAlpha = .35+.35*Math.sin(clock*3+e.ph); ctx.fillStyle='#ffd23a'; ctx.fillRect(R(e.x),R(e.y),1,1);
  });
  ctx.globalAlpha = 1;
  /* textos flutuantes */
  ctx.textAlign='center'; ctx.font='bold 8px "Silkscreen",monospace';
  floats.forEach(f=>{ ctx.globalAlpha = 1-f.age/f.life; ctx.fillStyle='#000'; ctx.fillText(f.t,R(f.x)+1,R(f.y)+1); ctx.fillStyle='#ffd23a'; ctx.fillText(f.t,R(f.x),R(f.y)); });
  ctx.globalAlpha = 1;
  if(msT>0){
    ctx.font='bold 18px "Pixelify Sans","Silkscreen",monospace'; ctx.globalAlpha = clamp(msT*2,0,1);
    const yy = 52 - (1.3-msT)*8;
    ctx.fillStyle='#000'; ctx.fillText(msTxt,W/2+2,yy+2); ctx.fillStyle='#ffd23a'; ctx.fillText(msTxt,W/2,yy); ctx.globalAlpha=1;
  }
  ctx.restore();
  ctx.drawImage(VIG,0,0);
  if(flash>0 && !REDUCED){ ctx.globalAlpha = clamp(flash,0,.35); ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H); ctx.globalAlpha = 1; }
}

/* ---------- laço principal ---------- */
function shouldRun(){
  return visible && !document.hidden && !paused && (state==='run' || state==='dead' || (state==='idle' && !REDUCED));
}
function frame(t){
  raf = 0; if(!shouldRun()) return;
  const dt = clamp((t-last)/1000,0,.033) || 0.016; last = t;
  step(dt); draw();
  raf = requestAnimationFrame(frame);
}
function kick(){ if(!raf && shouldRun()){ last = performance.now(); raf = requestAnimationFrame(frame); } }

/* ---------- interface ---------- */
let lastHud = -1;
function pad5(n){ return String(n).padStart(5,'0'); }
function hud(force){
  if(force || score!==lastHud){ lastHud = score; el.pts.textContent = pad5(score); el.hi.textContent = pad5(Math.max(hi,0)); }
}
function setTela(titulo,sub,botao,dica,cls){
  el.titulo.textContent = titulo; el.sub.textContent = sub; el.playTxt.textContent = botao; el.dica.textContent = dica||'';
  el.dica.hidden = !dica; el.tela.className = 'jogo-tela'+(cls?' '+cls:''); el.tela.hidden = false;
}
const DICA = 'ESPAÇO · ↑ · TOQUE pula · pule 2x no ar · P pausa';
function telaInicio(){ setTela('INFINITY RUN','Desvie dos bugs, pegue as estrelas e corra o mais longe que der.','JOGAR',DICA,'t-inicio'); }
function telaFim(){
  setTela('GAME OVER', newRecord ? `Novo recorde: ${score} pontos!` : `${score} pontos · recorde ${hi}`, 'JOGAR DE NOVO','', newRecord?'t-fim t-recorde':'t-fim');
  if(newRecord) SFX.record();
  state = 'over'; syncBtns(); setTimeout(()=>{ try{ el.play.focus({preventScroll:true}); }catch(e){} },30);
}
function syncBtns(){
  const run = state==='run';
  el.pause.disabled = !run;
  el.pause.setAttribute('aria-label', paused ? 'Continuar o jogo' : 'Pausar o jogo');
  root.classList.toggle('pausado',paused);
  el.som.setAttribute('aria-pressed', muted?'true':'false');
  el.som.setAttribute('aria-label', muted?'Ligar o som':'Desligar o som');
  root.classList.toggle('mudo',muted);
}
function start(){
  audio(); reset(); state = 'run'; paused = false; speed = 105; jumpHeld = false;
  el.tela.hidden = true; root.classList.add('jogando'); syncBtns(); SFX.start();
  try{ root.focus({preventScroll:true}); }catch(e){}
  kick();
}
function setPause(p){
  if(state!=='run' || p===paused) return;
  paused = p; syncBtns();
  if(p){ SFX.pause(); setTela('PAUSADO','O mundo espera por você.','CONTINUAR','P ou Esc para continuar','t-pausa'); draw(); }
  else { SFX.resume(); el.tela.hidden = true; kick(); try{ root.focus({preventScroll:true}); }catch(e){} }
}
function toggleMute(){
  muted = !muted; store.set('infinity-run-mudo',muted?'1':'0'); syncBtns();
  if(!muted){ audio(); tone(660,880,.08,'square',.04); }
}

el.play.addEventListener('click',()=>{ if(state==='run' && paused) setPause(false); else start(); });
el.pause.addEventListener('click',()=>{ setPause(!paused); try{ root.focus({preventScroll:true}); }catch(e){} });
el.som.addEventListener('click',()=>{ toggleMute(); try{ root.focus({preventScroll:true}); }catch(e){} });

cv.addEventListener('pointerdown',e=>{
  if(state==='run' && !paused){ e.preventDefault(); jumpHeld = true; jump(); }
});
['pointerup','pointercancel','pointerleave'].forEach(n=>cv.addEventListener(n,()=>{ if(jumpHeld) release(); }));

window.addEventListener('keydown',e=>{
  const tg = e.target, tag = tg && tg.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(tg&&tg.isContentEditable)) return;
  const k = e.key;
  if(k===' '||k==='ArrowUp'||k==='w'||k==='W'){
    if(state==='run' && !paused){
      if(tag==='BUTTON') return;
      e.preventDefault(); if(!e.repeat){ jumpHeld = true; jump(); }
    } else if((state==='idle'||state==='over') && document.activeElement===root && k===' '){ e.preventDefault(); start(); }
  } else if(k==='p'||k==='P'||k==='Escape'){
    if(state==='run' && (k!=='Escape' || !paused)) setPause(!paused);
  } else if(k==='m'||k==='M'){
    if(visible) toggleMute();
  } else if(k==='Enter' && document.activeElement===root && (state==='idle'||state==='over')){
    e.preventDefault(); start();
  }
});
window.addEventListener('keyup',e=>{
  if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W'){ if(jumpHeld) release(); }
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden) setPause(true); else kick();
});
if('IntersectionObserver' in window){
  new IntersectionObserver(es=>{
    const r = es[0].intersectionRatio;
    visible = es[0].isIntersecting;
    if(r<.15 && state==='run' && !paused) setPause(true);
    kick();
  },{threshold:[0,.15,.5]}).observe(root);
}

/* ---------- inicialização ---------- */
reset(); telaInicio(); syncBtns(); hud(true); draw();
kick();
})();
