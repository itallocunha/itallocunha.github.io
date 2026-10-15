/* ALTHEA :: Camara das Orbes
   WebGL puro, sem dependencias. Cinco orbes volumetricas renderizadas
   por um unico fragment shader (intersecao analitica + marcha interna). */
(function(){
  var host = document.getElementById('orbChamber');
  var canvas = document.getElementById('orbCanvas');
  if(!host || !canvas) return;

  var gl = null;
  try{
    gl = canvas.getContext('webgl', {alpha:true, antialias:false, premultipliedAlpha:false, powerPreference:'high-performance'})
      || canvas.getContext('experimental-webgl', {alpha:true});
  }catch(e){ gl = null; }

  if(!gl){ host.classList.add('no-webgl'); return; }
  host.classList.add('has-webgl');

  var VERT = [
    'attribute vec2 aPos;',
    'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform vec3  uCam;',
    'uniform vec3  uRight;',
    'uniform vec3  uUp;',
    'uniform vec3  uFwd;',
    'uniform float uSteps;',
    'uniform vec3  uPos[5];',
    'uniform vec3  uColA[5];',
    'uniform vec3  uColB[5];',
    'uniform vec3  uRim[5];',
    'uniform float uScale[5];',
    'uniform float uGlowK[5];',

    'float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453123); }',

    'float vnoise(vec3 p){',
    '  vec3 i = floor(p); vec3 f = fract(p);',
    '  f = f*f*(3.0-2.0*f);',
    '  float n000 = hash(i+vec3(0.0,0.0,0.0));',
    '  float n100 = hash(i+vec3(1.0,0.0,0.0));',
    '  float n010 = hash(i+vec3(0.0,1.0,0.0));',
    '  float n110 = hash(i+vec3(1.0,1.0,0.0));',
    '  float n001 = hash(i+vec3(0.0,0.0,1.0));',
    '  float n101 = hash(i+vec3(1.0,0.0,1.0));',
    '  float n011 = hash(i+vec3(0.0,1.0,1.0));',
    '  float n111 = hash(i+vec3(1.0,1.0,1.0));',
    '  return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),',
    '             mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);',
    '}',

    'float fbm(vec3 p){',
    '  float a = 0.5; float s = 0.0;',
    '  for(int i=0;i<4;i++){ s += a * vnoise(p); p *= 2.03; a *= 0.5; }',
    '  return s;',
    '}',

    'vec3 background(vec3 rd){',
    '  float h = rd.y * 0.5 + 0.5;',
    '  vec3 col = mix(vec3(0.010,0.008,0.022), vec3(0.026,0.019,0.050), h);',
    '  float neb = fbm(rd * 2.6 + vec3(0.0, 0.0, uTime * 0.012));',
    '  col += vec3(0.055,0.032,0.115) * smoothstep(0.62, 1.0, neb) * 0.6;',
    '  vec3 sp = rd * 230.0;',
    '  vec3 ip = floor(sp);',
    '  vec3 fp = fract(sp) - 0.5;',
    '  float st = pow(hash(ip), 300.0) * 5.0;',
    '  st *= smoothstep(0.42, 0.02, length(fp));',
    '  float tw = 0.6 + 0.4 * sin(uTime * 1.9 + hash(ip + 3.3) * 40.0);',
    '  col += vec3(0.95,0.93,0.88) * st * tw;',
    '  return col;',
    '}',

    'void main(){',
    '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;',
    '  vec3 rd = normalize(p.x * uRight + p.y * uUp + 1.65 * uFwd);',
    '  vec3 ro = uCam;',
    '  vec3 bgc = background(rd);',
    '  vec3 halo = vec3(0.0);',

    /* nucleo central: o viajante */
    '  vec3 toC = -ro;',
    '  if(dot(toC, rd) > 0.0){',
    '    float dC = length(cross(rd, toC));',
    '    halo += vec3(0.95,0.72,0.34) * 0.10 / (1.0 + dC*dC*70.0);',
    '  }',

    /* halos aditivos */
    '  for(int i=0;i<5;i++){',
    '    vec3 oc = uPos[i] - ro;',
    '    if(dot(oc, rd) > 0.0){',
    '      float d = length(cross(rd, oc));',
    '      float r = 0.78 * uScale[i];',
    '      float x = max(d - r, 0.0);',
    '      float g = exp(-x * x * 16.0);',
    '      if(d < r) g *= 0.18;',
    '      halo += uRim[i] * g * 0.26 * uGlowK[i];',
    '    }',
    '  }',

    /* orbe mais proxima */
    '  float bestT = 1e9; int best = -1;',
    '  for(int i=0;i<5;i++){',
    '    float r = 0.78 * uScale[i];',
    '    vec3 oc = ro - uPos[i];',
    '    float b = dot(oc, rd);',
    '    float c = dot(oc, oc) - r*r;',
    '    float h = b*b - c;',
    '    if(h > 0.0){',
    '      float t = -b - sqrt(h);',
    '      if(t > 0.0 && t < bestT){ bestT = t; best = i; }',
    '    }',
    '  }',

    '  vec3 col = bgc;',
    '  if(best >= 0){',
    '    for(int i=0;i<5;i++){',
    '      if(i == best){',
    '        float r = 0.78 * uScale[i];',
    '        vec3 ctr = uPos[i];',
    '        vec3 oc = ro - ctr;',
    '        float b = dot(oc, rd);',
    '        float c = dot(oc, oc) - r*r;',
    '        float h = sqrt(max(b*b - c, 0.0));',
    '        float t0 = -b - h;',
    '        float t1 = -b + h;',
    '        float dt = (t1 - t0) / uSteps;',
    '        vec3 acc = vec3(0.0);',
    '        float trans = 1.0;',
    '        for(int s=0;s<26;s++){',
    '          if(float(s) >= uSteps) break;',
    '          vec3 q = (ro + rd * (t0 + dt * (float(s) + 0.5)) - ctr) / r;',
    '          float rad = length(q);',
    '          float ang = rad * 2.6 + uTime * 0.55;',
    '          float ca = cos(ang), sa = sin(ang);',
    '          vec3 qs = vec3(q.x * ca - q.z * sa, q.y, q.x * sa + q.z * ca);',
    '          float warp = fbm(qs * 2.2 - vec3(0.0, uTime * 0.20, 0.0));',
    '          float n = fbm(qs * 4.6 + warp * 2.2 + vec3(0.0, uTime * 0.14, 0.0));',
    '          float fil = pow(1.0 - abs(n * 2.0 - 1.0), 11.0) * 7.0;',
    '          float core = pow(max(0.0, 1.0 - rad), 3.0);',
    '          float d = fil * smoothstep(1.06, 0.08, rad);',
    '          d = max(d, 0.0);',
    '          vec3 cc = mix(uColA[i], vec3(1.0), clamp(fil * 0.12, 0.0, 0.6));',
    '          acc += trans * cc * d * 0.16;',
    '          acc += trans * uColA[i] * core * 0.022;',
    '          trans *= exp(-d * 1.3);',
    '          if(trans < 0.02) break;',
    '        }',
    '        float axial = length(cross(rd, ctr - ro)) / r;',
'        acc += uColA[i] * 0.42 * pow(max(0.0, 1.0 - axial), 7.0) * (0.8 + 0.2 * sin(uTime * 1.6 + float(i) * 2.0));',
'        vec3 hit = ro + rd * bestT;',
    '        vec3 n = normalize(hit - ctr);',
    '        float fres = pow(1.0 - abs(dot(n, -rd)), 3.0);',
    '        vec3 refr = refract(rd, n, 0.70);',
    '        vec3 through = background(normalize(refr + vec3(0.0001))) * 2.2;',
    '        vec3 glass = mix(uColB[i] * 1.6, uColA[i] * 0.5, 0.35);',
    '        acc += through * (0.32 + glass);',
    '        acc += glass * 0.22;',
    '        acc += uRim[i] * fres * 4.2;',
    '        vec3 L = normalize(vec3(0.55, 0.85, 0.35));',
    '        float spec = pow(max(dot(reflect(rd, n), L), 0.0), 60.0);',
    '        acc += vec3(1.0, 0.97, 0.90) * spec * 0.8;',
    '        col = acc;',
    '      }',
    '    }',
    '  }',
    '  col += halo;',

    /* vinheta + curva de cor */
    '  float vig = 1.0 - 0.38 * dot(p, p);',
    '  col *= vig;',
    '  float lum = max(max(col.r, col.g), col.b);',
    '  col *= (lum / (1.0 + lum)) / max(lum, 0.0001);',
    '  col = mix(col, col * col * (3.0 - 2.0 * col), 0.35);',
    '  col = pow(col, vec3(0.4545));',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src){
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
      if(window.console) console.error('shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if(!vs || !fs){ host.classList.remove('has-webgl'); host.classList.add('no-webgl'); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){
    host.classList.remove('has-webgl'); host.classList.add('no-webgl'); return;
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  function U(n){ return gl.getUniformLocation(prog, n); }
  var uRes = U('uRes'), uTime = U('uTime'), uCam = U('uCam'),
      uRight = U('uRight'), uUp = U('uUp'), uFwd = U('uFwd'), uSteps = U('uSteps');

  /* ---------- dados das orbes ---------- */
  var ORBS = [
    {colA:[1.00,0.70,0.18], colB:[0.42,0.16,0.02], rim:[1.00,0.74,0.30]},
    {colA:[0.30,0.74,1.00], colB:[0.04,0.12,0.52], rim:[0.40,0.78,1.00]},
    {colA:[1.00,0.38,0.14], colB:[0.36,0.03,0.03], rim:[1.00,0.34,0.16]},
    {colA:[0.30,1.00,0.56], colB:[0.02,0.26,0.16], rim:[0.26,0.95,0.58]},
    {colA:[0.70,0.42,1.00], colB:[0.17,0.05,0.42], rim:[0.66,0.44,1.00]}
  ];
  var RING = 3.05;
  var basePos = [];
  for(var i=0;i<5;i++){
    var a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    basePos.push([Math.cos(a) * RING, Math.sin(i * 1.7) * 0.42, Math.sin(a) * RING]);
  }
  var scale = [1,1,1,1,1], scaleT = [1,1,1,1,1];
  var glowK = [1,1,1,1,1], glowT = [1,1,1,1,1];

  for(var k=0;k<5;k++){
    gl.uniform3fv(U('uColA[' + k + ']'), ORBS[k].colA);
    gl.uniform3fv(U('uColB[' + k + ']'), ORBS[k].colB);
    gl.uniform3fv(U('uRim[' + k + ']'),  ORBS[k].rim);
  }

  /* ---------- camera orbital ---------- */
  var yaw = 0, pitch = 0.10, yawT = 0, pitchT = 0.10;
  var fitK = 1;
  var dist = 10.4, distT = 10.4;
  var target = [0,0.30,0], targetT = [0,0.30,0];
  var autoSpin = true;
  var selected = -1, hovered = -1;

  var reduced = false; /* a cena 3D e conteudo animado, como um video: nao congela */

  function camBasis(){
    var D = dist * fitK;
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var fwd = [-cp * sy, -sp, -cp * cy];
    var pos = [
      target[0] - fwd[0] * D,
      target[1] - fwd[1] * D,
      target[2] - fwd[2] * D
    ];
    var right = [cy, 0, -sy];
    var up = [
      right[1]*fwd[2] - right[2]*fwd[1],
      right[2]*fwd[0] - right[0]*fwd[2],
      right[0]*fwd[1] - right[1]*fwd[0]
    ];
    up = [-up[0], -up[1], -up[2]];
    return {pos:pos, fwd:fwd, right:right, up:up};
  }

  /* ---------- selecao ---------- */
  var labels = Array.prototype.slice.call(document.querySelectorAll('[data-orb]'));
  var panelTitle = document.getElementById('orbTitle');
  var panelNum = document.getElementById('orbNum');
  var panelText = document.getElementById('orbText');
  var panelArt = document.getElementById('orbArt');
  var ORB_INFO = [];
  labels.forEach(function(btn){
    ORB_INFO.push({
      title: btn.getAttribute('data-title') || '',
      num: btn.getAttribute('data-num') || '',
      text: btn.getAttribute('data-text') || '',
      art: btn.getAttribute('data-art') || ''
    });
  });

  function select(idx, moveCam){
    selected = idx;
    labels.forEach(function(b, j){
      b.classList.toggle('is-active', j === idx);
      b.setAttribute('aria-pressed', j === idx ? 'true' : 'false');
    });
    var info = ORB_INFO[idx];
    if(info){
      if(panelTitle) panelTitle.textContent = info.title;
      if(panelNum) panelNum.textContent = info.num;
      if(panelText) panelText.textContent = info.text;
      if(panelArt && info.art && panelArt.getAttribute('src') !== info.art){
        panelArt.classList.remove('is-in');
        panelArt.setAttribute('src', info.art);
      }
    }
    if(moveCam !== false){
      var pp = basePos[idx];
      targetT = [pp[0], pp[1], pp[2]];
      distT = 4.9;
      yawT = Math.atan2(-pp[0], -pp[2]) + Math.PI;
      autoSpin = false;
    }
  }
  function deselect(){
    selected = -1;
    labels.forEach(function(b){ b.classList.remove('is-active'); b.setAttribute('aria-pressed','false'); });
    targetT = [0,0.30,0];
    distT = 10.4;
    autoSpin = true;
  }
  labels.forEach(function(btn, j){
    btn.addEventListener('click', function(){
      if(selected === j){ deselect(); } else { select(j); }
    });
    btn.addEventListener('mouseenter', function(){ hovered = j; });
    btn.addEventListener('mouseleave', function(){ hovered = -1; });
  });
  if(panelArt){
    panelArt.addEventListener('load', function(){ panelArt.classList.add('is-in'); });
    if(panelArt.complete && panelArt.naturalWidth) panelArt.classList.add('is-in');
  }

  /* ---------- picking ---------- */
  function pick(cx, cy){
    var rect = canvas.getBoundingClientRect();
    var px = ((cx - rect.left) - rect.width * 0.5) / rect.height;
    var py = -((cy - rect.top) - rect.height * 0.5) / rect.height;
    var b = camBasis();
    var rd = [
      px * b.right[0] + py * b.up[0] + 1.65 * b.fwd[0],
      px * b.right[1] + py * b.up[1] + 1.65 * b.fwd[1],
      px * b.right[2] + py * b.up[2] + 1.65 * b.fwd[2]
    ];
    var L = Math.sqrt(rd[0]*rd[0] + rd[1]*rd[1] + rd[2]*rd[2]);
    rd = [rd[0]/L, rd[1]/L, rd[2]/L];
    var bestT = 1e9, best = -1;
    for(var i=0;i<5;i++){
      var r = 0.78 * scale[i] * 1.3;
      var oc = [b.pos[0]-basePos[i][0], b.pos[1]-basePos[i][1], b.pos[2]-basePos[i][2]];
      var bb = oc[0]*rd[0] + oc[1]*rd[1] + oc[2]*rd[2];
      var cc = oc[0]*oc[0] + oc[1]*oc[1] + oc[2]*oc[2] - r*r;
      var hh = bb*bb - cc;
      if(hh > 0){
        var t = -bb - Math.sqrt(hh);
        if(t > 0 && t < bestT){ bestT = t; best = i; }
      }
    }
    return best;
  }

  /* ---------- interacao de ponteiro ---------- */
  var dragging = false, moved = false, lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', function(e){
    dragging = true; moved = false;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function(e){
    if(dragging){
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      if(Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      yawT -= dx * 0.006;
      pitchT = Math.max(-0.75, Math.min(0.85, pitchT + dy * 0.004));
      lastX = e.clientX; lastY = e.clientY;
      autoSpin = false;
    } else {
      var h = pick(e.clientX, e.clientY);
      hovered = h;
      canvas.style.cursor = h >= 0 ? 'pointer' : 'grab';
    }
  });
  function endDrag(e){
    if(dragging && !moved && e){
      var h = pick(e.clientX, e.clientY);
      if(h >= 0){ if(selected === h){ deselect(); } else { select(h); } }
      else { deselect(); }
    }
    dragging = false;
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', function(){ dragging = false; });
  canvas.addEventListener('pointerleave', function(){ dragging = false; hovered = -1; });

  /* ---------- resize adaptativo ---------- */
  var qScale = 1;
  var frameAvg = 16;
  function resize(){
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    var w = Math.max(1, Math.round(rect.width * dpr * qScale));
    var h = Math.max(1, Math.round(rect.height * dpr * qScale));
    if(canvas.width !== w || canvas.height !== h){
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    var aspect = w / Math.max(h, 1);
    fitK = Math.min(Math.max(1, 0.86 / Math.max(aspect, 0.4)), 1.6);
  }
  window.addEventListener('resize', resize, {passive:true});

  /* ---------- pausa fora da tela ---------- */
  var visible = true;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      entries.forEach(function(en){ visible = en.isIntersecting; });
    }, {threshold:0.01}).observe(host);
  }

  /* ---------- loop ---------- */
  var t0 = performance.now();
  var last = t0;
  function frame(now){
    requestAnimationFrame(frame);
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if(!visible) return;

    frameAvg = frameAvg * 0.9 + (dt * 1000) * 0.1;
    if(frameAvg > 34 && qScale > 0.6){ qScale -= 0.06; resize(); }
    else if(frameAvg < 19 && qScale < 1){ qScale = Math.min(1, qScale + 0.02); resize(); }

    resize();

    if(autoSpin && !reduced) yawT += dt * 0.11;

    var k = reduced ? 1 : 1 - Math.pow(0.001, dt);
    yaw += (yawT - yaw) * k;
    pitch += (pitchT - pitch) * k;
    dist += (distT - dist) * k;
    target[0] += (targetT[0] - target[0]) * k;
    target[1] += (targetT[1] - target[1]) * k;
    target[2] += (targetT[2] - target[2]) * k;

    var tt = (now - t0) / 1000;
    for(var i=0;i<5;i++){
      scaleT[i] = (i === selected) ? 1.35 : (i === hovered ? 1.16 : 1.0);
      glowT[i] = (i === selected) ? 1.9 : (i === hovered ? 1.35 : (selected >= 0 ? 0.5 : 1.0));
      scale[i] += (scaleT[i] - scale[i]) * k;
      glowK[i] += (glowT[i] - glowK[i]) * k;
      var bp = basePos[i];
      var bob = reduced ? 0 : Math.sin(tt * 0.6 + i * 1.3) * 0.16;
      gl.uniform3f(U('uPos[' + i + ']'), bp[0], bp[1] + bob, bp[2]);
      gl.uniform1f(U('uScale[' + i + ']'), scale[i]);
      gl.uniform1f(U('uGlowK[' + i + ']'), glowK[i]);
    }

    var b = camBasis();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reduced ? 4.0 : tt);
    gl.uniform3fv(uCam, b.pos);
    gl.uniform3fv(uRight, b.right);
    gl.uniform3fv(uUp, b.up);
    gl.uniform3fv(uFwd, b.fwd);
    gl.uniform1f(uSteps, (canvas.width * canvas.height > 1400000) ? 14.0 : 22.0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  resize();
  select(0, false);
  requestAnimationFrame(frame);
})();
