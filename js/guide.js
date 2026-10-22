/* Full-screen guided walk home: road routing, step engine, landmark questions, rerouting. */
(function () {
  const WH = (window.WH = window.WH || {});
  const S = WH.S, $ = WH.$, esc = WH.esc;
  const T = (k, v) => WH.t(k, v);
  const SP = WH.CITY.SP, KM = WH.CITY.KM;
  const M = 1000 / KM; // metres per world unit (20)
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

  function streetOf(a, b) {
    if (Math.abs(a.x - b.x) < 0.01) { const i = Math.round(a.x / SP + 6); return WH.STREETS_V[Math.max(0, Math.min(12, i))]; }
    const j = Math.round(a.z / SP + 6); return WH.STREETS_H[Math.max(0, Math.min(12, j))];
  }
  function snapToRoad(p) {
    const ri = Math.round(p.x / SP + 6), rj = Math.round(p.z / SP + 6);
    const dx = Math.abs(p.x - (ri - 6) * SP), dz = Math.abs(p.z - (rj - 6) * SP);
    if (dx < 0.7 && dz < 0.7) return { i: ri, j: rj };
    if (dx < 0.7) return { i: ri, j: rj };
    if (dz < 0.7) return { i: ri, j: rj };
    return WH.nearestNode(p.x, p.z);
  }
  function nodePath(a, b) {
    const path = [{ i: a.i, j: a.j }], cur = { i: a.i, j: a.j };
    let axis = Math.abs(b.i - a.i) >= Math.abs(b.j - a.j) ? 'i' : 'j', guard = 0;
    while ((cur.i !== b.i || cur.j !== b.j) && guard++ < 40) {
      const rem = axis === 'i' ? b.i - cur.i : b.j - cur.j;
      if (rem === 0) { axis = axis === 'i' ? 'j' : 'i'; continue; }
      const chunk = Math.min(Math.abs(rem), Math.abs(rem) >= 5 ? 3 : 2) * Math.sign(rem);
      cur[axis] += chunk; path.push({ i: cur.i, j: cur.j });
      axis = axis === 'i' ? 'j' : 'i';
    }
    return path;
  }

  function buildRoute(from) {
    const n0 = snapToRoad(from), np = WH.node(n0.i, n0.j);
    const pts = [{ x: from.x, z: from.z }], nodeIdx = [];
    const atNode = dist(from, np) <= 0.5;
    if (!atNode) pts.push(np);
    nodePath(n0, { i: WH.HOME_NODE[0], j: WH.HOME_NODE[1] }).forEach((n, k) => {
      const w = WH.node(n.i, n.j);
      if (k === 0) { nodeIdx.push({ i: n.i, j: n.j, pt: atNode ? 0 : 1 }); return; }
      pts.push(w); nodeIdx.push({ i: n.i, j: n.j, pt: pts.length - 1 });
    });
    const hn = WH.node(WH.HOME_NODE[0], WH.HOME_NODE[1]);
    pts.push({ x: WH.DOOR.x, z: hn.z }, { x: WH.DOOR.x, z: WH.DOOR.z });
    const cum = [0]; for (let k = 1; k < pts.length; k++) cum[k] = cum[k - 1] + dist(pts[k - 1], pts[k]);
    nodeIdx.forEach((n) => { n.s = cum[n.pt]; });
    return { pts, cum, nodes: nodeIdx, total: cum[cum.length - 1], cornerS: cum[pts.length - 2] };
  }
  function project(r, p) {
    let best = { d: 1e9, s: 0 };
    for (let k = 1; k < r.pts.length; k++) {
      const a = r.pts[k - 1], b = r.pts[k], l2 = (b.x - a.x) ** 2 + (b.z - a.z) ** 2 || 1;
      const u = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / l2));
      const q = { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u }, d = dist(p, q);
      if (d < best.d) best = { d, s: r.cum[k - 1] + Math.sqrt(l2) * u };
    }
    return best;
  }
  function posAt(r, s) {
    s = Math.max(0, Math.min(r.total, s));
    for (let k = 1; k < r.pts.length; k++) {
      if (s <= r.cum[k] + 1e-6) {
        const a = r.pts[k - 1], b = r.pts[k], l = r.cum[k] - r.cum[k - 1] || 1, u = (s - r.cum[k - 1]) / l;
        return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, dx: (b.x - a.x) / l, dz: (b.z - a.z) / l };
      }
    }
    const e = r.pts[r.pts.length - 1]; return { x: e.x, z: e.z, dx: 0, dz: 1 };
  }
  function turnAt(r, ptIdx) {
    if (ptIdx <= 0 || ptIdx >= r.pts.length - 1) return 0;
    const a = r.pts[ptIdx - 1], b = r.pts[ptIdx], c = r.pts[ptIdx + 1];
    const d1 = { x: b.x - a.x, z: b.z - a.z }, d2 = { x: c.x - b.x, z: c.z - b.z };
    const cr = d1.x * d2.z - d1.z * d2.x, dt = d1.x * d2.x + d1.z * d2.z;
    if (Math.abs(cr) < 0.01) return dt < 0 ? 2 : 0;
    return cr > 0 ? 1 : -1;
  }

  function buildSteps(r) {
    const ev = [];
    let crossNode = null;
    r.nodes.forEach((n, k) => {
      if (k === 0) return;
      const tr = turnAt(r, n.pt);
      if (tr === 1 || tr === -1) ev.push({ type: 'turn', dir: tr === 1 ? 'right' : 'left', s: n.s, street: streetOf(r.pts[n.pt], r.pts[n.pt + 1]) });
      else if (!crossNode && k < r.nodes.length - 1) crossNode = n;
    });
    if (!crossNode && r.nodes.length > 2) crossNode = r.nodes[Math.floor(r.nodes.length / 2)];
    if (crossNode) ev.push({ type: 'cross', s: crossNode.s - 1.9, node: crossNode });
    WH.MemoryData.navigationPlaces().forEach((source) => {
      const lm = {...source, name:WH.MemoryData.text(source), photo:WH.MemoryData.url(source.photoId)||source.photo};
      const pr = project(r, WH.lmPos(lm));
      if (lm.waypoint && project(r, WH.node(lm.waypoint.i,lm.waypoint.j)).d > 0.7) return;
      if (pr.d <= 4.9 && pr.s > 3 && pr.s < r.total - 7) ev.push({ type: 'look', s: pr.s - 0.8, lm, d: pr.d });
    });
    ev.sort((a, b) => a.s - b.s);
    const out = [{ type: 'start', s: 0, street: streetOf(r.pts[0], r.pts[1] || r.pts[0]) }];
    ev.forEach((e) => {
      const prev = out[out.length - 1];
      if (e.type === 'look' && out.some((o) => o.type === 'look' && Math.abs(o.s - e.s) < 4)) return; // one photo per stretch
      e.s = Math.max(prev.s + 1.4, e.s); out.push(e);
    });
    out.push({ type: 'arrive', s: Math.max(out[out.length - 1].s + 1, r.cornerS - 0.2) });
    return out;
  }

  /* ───────────── engine ───────────── */
  const G = (WH.Guide = {
    active: false, route: null, steps: [], idx: 0, s: 0, state: 'idle', speedMul: 1, waitT: 0, fails: 0, detour: null, paused: false, practice: false, viewMode:'presenter'
  });
  const BASE_V = 3.4;

  G.start = function (opts) {
    opts = opts || {};
    G.practice = !!opts.practice; G.viewMode=opts.viewMode||G.viewMode||'presenter';
    S.guiding = true; G.active = true; G.fails = 0; G.paused = false;
    WH.go('nav');
    WH.closePrompt && WH.closePrompt(true);
    G.plan(false);
    WH.wNav.snap();
    WH.sysLog('Guide: route built, ' + G.steps.length + ' steps, ' + Math.round(G.route.total * M) + ' m', 'ok');
    WH.refresh(); WH.Sim && WH.Sim.onGuideStart && WH.Sim.onGuideStart(G);
  };
  G.plan = function (isReroute) {
    G.route = buildRoute(S.pos); G.steps = buildSteps(G.route); G.idx = 0; G.s = 0; G.state = 'brief'; G.detour = null;
    G.waitT = 3.4;
    G.hasApprovedLandmark=G.steps.some(st=>st.type==='look');
    WH.worlds.forEach((w) => { w.setRoute(G.route.pts); w.setCrossing(null, false); });
    const first = G.route.pts[1] || G.route.pts[0];
    const p0 = G.route.pts[0], dx = first.x - p0.x, dz = first.z - p0.z;
    if (Math.hypot(dx, dz) > 0.01) S.heading = Math.atan2(dx, dz);
    G.renderAll();
    const st = G.steps[0];
    const street = st.street || '';
    WH.say(isReroute ? T('v_reroute') : T('v_start', { n: S.callName, street }));
    if (isReroute) WH.buzz('strong'); else WH.buzz('soft');
  };

  G.cur = () => G.steps[G.idx];
  G.complete = function () {
    if(S.sosActive || S.gpsLost || G.paused || WH.hasPrompt()) return;
    G.idx++; G.fails = 0;
    WH.wNav.setLight('red'); WH.worlds.forEach((w) => w.setCrossing(null, false));
    if (G.idx >= G.steps.length) { G.arrive(); return; }
    G.state = 'walking'; G.renderAll();
  };

  G.enter = function (st) {
    G.state = 'event'; G.fails = 0; S.moving = false;
    if (st.type === 'turn') {
      WH.buzz(st.dir); WH.beep('chime');
      WH.say(T(st.dir === 'left' ? 'v_turn_L' : 'v_turn_R', { street: st.street }));
      G.waitT = 2.6;
    } else if (st.type === 'look') {
      WH.buzz('soft'); WH.beep('chime');
      WH.say(T('v_look', { name: st.lm.name }));
    } else if (st.type === 'cross') {
      WH.worlds.forEach((w) => { w.setCrossing(st.node, true); w.setLight('red'); });
      WH.say(T('mgCross')); G.crossPhase = 0; WH.buzz('soft');
    } else if (st.type === 'arrive') {
      WH.buzz('soft'); WH.say(T('v_arrive', { n: S.callName }));
    }
    G.renderAll();
  };

  G.answerYes = function () {
    if (S.gpsLost || S.sosActive || G.paused) return;
    const st = G.cur(); if (!st || !['arrive','look'].includes(st.type) || WH.hasPrompt()) return;
    if (st.type === 'arrive') { WH.say(T('v_arrive_yes')); G.arrive(); return; }
    if (st.type === 'look') { WH.say(T('v_look_yes')); WH.beep('ok'); }
    G.complete();
  };
  G.answerNo = function () {
    if (S.gpsLost || S.sosActive) return;
    const st = G.cur(); if (!st) return;
    G.fails++;
    if (G.fails === 1) {
      G.paused = true;
      WH.MemoryData.event('landmark-not-visible', st.lm?.id || 'home');
      WH.devPrompt({tone:'blue',icon:'eye',title:T('mgReorient'),buttons:[
        {label:T('mgLookAgain'),tone:'green',fn:()=>{G.paused=false;G.renderAll();}},
        {label:T('mgFamily'),tone:'blue',fn:()=>WH.MemorySafety.handover()},
        {label:T('mgConfused'),tone:'ghost',fn:()=>WH.MemorySafety.confused()}
      ]});
    } else {
      WH.MemorySafety.confused();
    }
  };

  G.skip = function () {
    if (!G.active) return;
    const st = G.cur(); if (!st) return;
    WH.toast(ic('skip', 18) + ' ' + T('skipped'), 'warn', 1800);
    WH.sysLog('Guide: step skipped (demo)', 'warn');
    if (G.state === 'detour') { G.detour = null; G.reroute(); return; }
    if (G.state === 'brief') { G.waitT = 0; return; }
    if (G.state === 'walking') { G.s = st.s; const p = posAt(G.route, G.s); WH.setAvatar(p.x, p.z, undefined, false); G.enter(st); return; }
    if (G.state === 'event') { if (st.type === 'arrive') { G.arrive(); return; } G.complete(); return; }
    if (G.state === 'hold') { G.state = 'walking'; G.renderAll(); }
  };

  G.arrive = function () {
    G.state = 'arrived';
    WH.setAvatar(WH.DOOR.x, WH.DOOR.z, 0, false);
    WH.beep('ok');
    const el = $('#arrive');
    el.innerHTML = `<div class="arr-card"><div class="arr-ic">${ic('home', 84)}</div><h1>${T('arriveTitle')}</h1><p>${T('arriveText', { n: S.callName })}</p><div class="arr-fam">${ic('check', 22)} ${T('arriveFam')}</div><button class="btn primary big" id="arrDone">${T('done')}</button></div><div class="confetti"></div>`;
    const cf = $('.confetti', el); let h = '';
    for (let i = 0; i < 46; i++) h += `<i style="left:${Math.random() * 100}%;background:hsl(${Math.random() * 360},85%,60%);animation-delay:${(Math.random() * 1.2).toFixed(2)}s;animation-duration:${(2.4 + Math.random() * 2).toFixed(2)}s"></i>`;
    cf.innerHTML = h; el.classList.add('on');
    WH.say(T('v_home', { n: S.callName }));
    $('#arrDone').onclick = () => { el.classList.remove('on'); G.stop(true); };
    WH.Sim.onArrived && WH.Sim.onArrived();
  };

  G.stop = function (arrived) {
    G.active = false; G.state = 'idle'; S.guiding = false; S.moving = false;
    WH.worlds.forEach((w) => { w.setRoute(null); w.setCrossing(null, false); });
    WH.closePrompt && WH.closePrompt(true);
    $('#navPrompt').innerHTML = '';
    WH.go('stage');
    if (!arrived) WH.Sim && WH.Sim.onGuideAborted && WH.Sim.onGuideAborted();
    WH.refresh();
  };
  G.cancel=function(){if(!G.active)return;G.paused=true;WH.devPrompt({tone:'amber',icon:'close',title:T('mgCancelGuide'),text:T('mgCancelGuideText'),buttons:[{label:T('mgKeepGuiding'),tone:'green',fn:()=>{G.paused=false;G.renderAll();}},{label:T('mgCancelGuide'),tone:'ghost',fn:()=>{WH.MemoryData.event('guidance-cancelled',G.state);WH.SafetyPolicy.resolve('guidance-cancelled');G.stop(false);}}]});};
  G.setView=function(mode){G.viewMode=mode==='wearer'?'wearer':'presenter';const screen=$('#scr-nav');screen.dataset.navView=G.viewMode;WH.$$('#navViewSwitch button').forEach(b=>b.classList.toggle('on',b.dataset.navView===G.viewMode));G.renderAll();};

  /* demo hooks */
  G.wrongTurn = function () {
    if (!G.active || (G.state !== 'walking' && G.state !== 'event')) return WH.toast(T('needWalking'), 'warn');
    const r = G.route;
    let nxt = r.nodes.find((n) => n.s > G.s + 0.8) || r.nodes[r.nodes.length - 1];
    const here = posAt(r, G.s), np = WH.node(nxt.i, nxt.j);
    const perp = { x: -here.dz, z: here.dx };
    const tryEnd = (sg) => ({ x: np.x + perp.x * sg * SP, z: np.z + perp.z * sg * SP });
    let end = tryEnd(1); if (Math.abs(end.x) > 58 || Math.abs(end.z) > 58) end = tryEnd(-1);
    const pts = [{ x: S.pos.x, z: S.pos.z }, np, end];
    const cum = [0, dist(pts[0], pts[1]), 0]; cum[2] = cum[1] + dist(pts[1], pts[2]);
    G.detour = { pts, cum, total: cum[2], s: 0, warned: false, hold: 0 };
    G.state = 'detour'; G.renderAll();
    WH.SafetyPolicy.schedule('route-divergence',{reason:'divergence'});
    WH.sysLog('Demo: wrong turn injected', 'warn');
  };
  G.reroute = function () {
    G.plan(true);
    if(WH.SafetyPolicy.incident?.kind==='route-divergence')WH.SafetyPolicy.resolve('rerouted');
    WH.sysLog('Guide: off route, rerouting from current position', 'warn');
    WH.Sim && WH.Sim.onReroute && WH.Sim.onReroute();
  };
  G.holdStop = function () {
    if (!G.active || (G.state !== 'walking' && G.state !== 'brief')) return WH.toast(T('needWalking'), 'warn');
    G.state = 'hold'; S.moving = false; G.holdT = 0; G.holdAsked = false; G.renderAll();
    WH.sysLog('Demo: user stopped moving', 'warn');
  };
  G.resume = function () { if(S.sosActive||S.gpsLost||G.paused)return; if (G.state === 'hold') { if (G.idx === 0) G.idx = 1; G.state = 'walking'; G.holdAsked = false; WH.say(T('v_resume')); G.renderAll(); } };

  /* per-frame */
  G.tick = function (dt) {
    if (!G.active || G.paused) return;
    if ((WH.hasPrompt() && G.state !== 'hold') || S.sosActive) return;
    const mul = G.speedMul, r = G.route;
    if (G.state === 'brief') { G.waitT -= dt * mul; S.moving = false; if (G.waitT <= 0) { G.idx = 1; if (G.idx >= G.steps.length) { G.arrive(); return; } G.state = 'walking'; G.renderAll(); } }
    else if (G.state === 'walking') {
      const st = G.steps[G.idx];
      G.s = Math.min(st.s, G.s + BASE_V * mul * dt);
      const p = posAt(r, G.s);
      WH.setAvatar(p.x, p.z, Math.atan2(p.dx, p.dz), true);
      if (G.s >= st.s - 1e-3) { WH.setAvatar(p.x, p.z, undefined, false); G.enter(st); }
      G.updateDyn();
    } else if (G.state === 'event') {
      const st = G.cur();
      if (st.type === 'turn') { G.waitT -= dt * mul; if (G.waitT <= 0) G.complete(); }
      // Crossing steps require explicit classroom continuation, never a timed green light.
    } else if (G.state === 'detour') {
      const d = G.detour; d.s = Math.min(d.total, d.s + BASE_V * mul * dt);
      let k = d.s <= d.cum[1] ? 1 : 2, a = d.pts[k - 1], b = d.pts[k], l = d.cum[k] - d.cum[k - 1] || 1, u = (d.s - d.cum[k - 1]) / l;
      const x = a.x + (b.x - a.x) * u, z = a.z + (b.z - a.z) * u;
      WH.setAvatar(x, z, Math.atan2(b.x - a.x, b.z - a.z), d.s < d.total);
      if (!d.warned && d.s > d.cum[1] + 3.2) { d.warned = true; WH.buzz('strong'); WH.beep('alert'); WH.say(T('v_wrong')); WH.famBanner({ ic: 'route', tone: 'amber', title: T('famOffRoute'), body: T('famOffRouteB', { n: S.callName }) }); WH.feed(T('famOffRoute'), 'amber', 'route'); G.renderAll(); }
      if (d.s >= d.total) { d.hold += dt; if (d.hold > 2.6 / mul) G.reroute(); }
    } else if (G.state === 'hold') {
      G.holdT += dt;
      if (G.holdT > 3.5 && !G.holdAsked) {
        G.holdAsked = true;
        WH.MemorySafety.check('stopped',{nonurgent:true});
      }
    }
  };

  /* ───────────── rendering ───────────── */
  G.nextInfo = function () {
    const st = G.cur(); if (!st) return null;
    const d = Math.max(0, st.s - G.s) * M;
    if (st.type === 'turn') return { ic: st.dir, main: T(st.dir === 'left' ? 'tLeft' : 'tRight'), sub: T('onto', { street: st.street }), d, tone: 'turn' };
    if (st.type === 'look') return { ic: 'eye', main: T('lookFor', { name: st.lm.name }), sub: T('lookSub'), d, tone: 'look' };
    if (st.type === 'cross') return { ic: 'crossing', main: T('mgSimulation'), sub: T('mgCross'), d, tone: 'cross' };
    if (st.type === 'arrive') return { ic: 'home', main: T('homeAhead'), sub: T('homeSub'), d, tone: 'home' };
    return { ic: 'walk', main: T('walkAlong', { street: st.street || '' }), sub: T('slowly'), d: 0, tone: 'walk' };
  };
  G.updateDyn = function () {
    const n = G.nextInfo(); if (!n) return;
    $('#ntDist').textContent = n.d > 1 ? Math.round(n.d / 5) * 5 + ' m' : '';
    const bar = $('#navBottom .nb-bar i'); if (bar) bar.style.width = Math.min(100, (G.s / G.route.total) * 100) + '%';
    const left = Math.max(0, G.route.total - G.s) * M;
    $('#navMiniTag').textContent = T('toGo', { d: Math.round(left / 10) * 10, min: Math.max(1, Math.round(left / 70)) });
  };
  G.renderAll = function () {
    if (!G.active) return;
    G.renderTop(); G.renderBottom(); G.renderWearer(); G.updateDyn();
    $$speed();
  };
  G.renderWearer=function(){const root=$('#wearerNav');if(!root||!G.active)return;const st=G.cur(),n=G.nextInfo()||{};let main=n.main||T('mgRoutePaused'),sub=n.sub||'',arrow='↑',status=G.hasApprovedLandmark?T('mgLandmarkAvailable'):T('mgNoLandmark');let photo='',caption='';if(S.gpsLost){main=T('mgLow');sub=WH.MemorySafety?.lastKnown?T('mgLast',{pos:`${WH.MemorySafety.lastKnown.x.toFixed(1)}, ${WH.MemorySafety.lastKnown.z.toFixed(1)}`,time:new Date(WH.MemorySafety.lastKnown.at).toLocaleTimeString(S.lang)}):T('mgSimulation');arrow='?';status=T('mgLocationUncertain');}else if(G.paused){main=T('mgRoutePaused');sub=T('mgHandover');arrow='‖';}else if(G.state==='detour'){main=T('offRoute');sub=T('offRouteSub');arrow='↶';status=T('mgRouteDivergence');}else if(st?.type==='turn')arrow=st.dir==='left'?'←':'→';else if(st?.type==='arrive')arrow='⌂';else if(st?.type==='look'){arrow='●';photo=st.lm.photo||landmarkArt(st.lm.type,st.lm.name);caption=st.lm.name;}else if(st?.type==='cross')arrow='◇';$('#wearerNavStatus').textContent=status;$('#wearerNavArrow').textContent=arrow;$('#wearerNavMain').textContent=main;$('#wearerNavSub').textContent=sub;const fig=$('#wearerNavLandmark');fig.hidden=!photo;if(photo){$('#wearerNavPhoto').src=photo;$('#wearerNavPhoto').alt=caption;$('#wearerNavCaption').textContent=caption;}};
  function $$speed() { WH.$$('#navSpeed button').forEach((b) => b.classList.toggle('on', +b.dataset.sp === G.speedMul)); }

  G.renderTop = function () {
    const st = G.cur(), n = G.nextInfo();
    const turn = $('#navTurn');
    if (G.state === 'detour' && G.detour && G.detour.warned) {
      turn.className = 'nav-turn tone-red'; $('#ntIc').innerHTML = ic('uturn', 56); $('#ntMain').textContent = T('offRoute'); $('#ntSub').textContent = T('offRouteSub'); $('#ntDist').textContent = '';
    } else if (G.state === 'hold') {
      turn.className = 'nav-turn tone-amber'; $('#ntIc').innerHTML = ic('stop', 56); $('#ntMain').textContent = T('pausedTitle'); $('#ntSub').textContent = T('pausedSub'); $('#ntDist').textContent = '';
    } else if (n) {
      turn.className = 'nav-turn tone-' + n.tone; $('#ntIc').innerHTML = ic(n.ic, 56); $('#ntMain').textContent = n.main; $('#ntSub').textContent = n.sub;
    }
    // progress segments
    $('#navProg').innerHTML = G.steps.map((s, i) => `<i class="${i < G.idx ? 'done' : i === G.idx ? 'cur' : ''}"></i>`).join('') + `<span>${T('stepOf', { a: Math.min(G.idx + 1, G.steps.length), b: G.steps.length })}</span>`;
  };

  G.renderBottom = function () {
    const box = $('#navBottom'), st = G.cur();
    if (!st) { box.innerHTML = ''; return; }
    let h = '';
    const walkCard = (title, sub) => `<div class="nb walking"><div class="nb-ic">${ic('walk', 42)}</div><div class="nb-tx"><b>${esc(title)}</b><span>${esc(sub)}</span></div><div class="nb-bar"><i></i></div><button class="nb-btn" id="nbRest">${ic('heart', 20)} ${T('needRest')}</button></div>`;
    if (G.state === 'brief') {
      h = `<div class="nb brief"><div class="nb-ic">${ic('assistant', 46)}</div><div class="nb-tx"><b>${T('briefTitle', { n: S.callName })}</b><span>${T('briefSub')}</span></div></div>`;
    } else if (G.state === 'detour') {
      const w = G.detour && G.detour.warned;
      h = `<div class="nb ${w ? 'bad' : 'walking'}"><div class="nb-ic">${ic(w ? 'uturn' : 'walk', 42)}</div><div class="nb-tx"><b>${w ? T('offRoute') : T('walking')}</b><span>${w ? T('offRouteSub') : ''}</span></div></div>`;
    } else if (G.state === 'hold') {
      h = `<div class="nb"><div class="nb-ic">${ic('stop', 42)}</div><div class="nb-tx"><b>${T('pausedTitle')}</b><span>${T('pausedSub')}</span></div><button class="nb-btn go" id="nbGo">${ic('walk', 20)} ${T('keepGoing')}</button></div>`;
    } else if (G.state === 'walking') {
      const n = G.nextInfo();
      h = walkCard(T('keepWalking'), T('nextUp', { what: n.main.toLowerCase() }));
    } else if (G.state === 'event') {
      if (st.type === 'look' || st.type === 'arrive') {
        const lm = st.lm, photo = st.type === 'arrive' ? landmarkArt('home', T('yourGateCap')) : (lm.photo || landmarkArt(lm.type, lm.name));
        const q = st.type === 'arrive' ? T('arriveQ') : T('mgSeeQ');
        const hint = G.fails ? T('mgReorient') : (st.type === 'arrive' ? T('arriveHint') : WH.MemoryData.text(lm,'story'));
        h = `<div class="nb look ${G.fails ? 'retry' : ''}"><div class="nb-photo"><img src="${esc(photo)}" alt="${esc(lm?lm.name:T('yourGateCap'))}"><span class="nb-tag">${ic('eye', 16)} ${T('lookTag')}</span></div>
          <div class="nb-q"><h2>${q}</h2><p>${esc(hint)}</p>
          <div class="nb-yn"><button class="yn yes" id="ynYes">${ic('check', 34)}<span>${T('mgSee')}</span></button><button class="yn no" id="ynNo">${ic('close', 30)}<span>${T('mgNoSee')}</span></button></div><button class="nb-btn" id="landmarkCall">${T('mgFamily')}</button></div></div>`;
      } else if (st.type === 'cross') {
        h = `<div class="nb cross red"><div class="nb-tx"><b>${T('mgSimulation')}</b><span>${T('mgCross')}</span></div><button class="nb-btn" id="classroomCross">${T('mgCrossNext')}</button></div>`;
      } else if (st.type === 'turn') {
        h = `<div class="nb turn"><div class="nb-ic big">${ic(st.dir, 54)}</div><div class="nb-tx"><b>${T(st.dir === 'left' ? 'tLeft' : 'tRight')}</b><span>${T('onto', { street: st.street })}</span></div></div>`;
      }
    }
    box.innerHTML = h;
    const y = $('#ynYes'), n = $('#ynNo'), r = $('#nbRest'), go = $('#nbGo');
    if ($('#landmarkCall')) $('#landmarkCall').onclick = () => WH.MemorySafety.handover();
    if ($('#classroomCross')) $('#classroomCross').onclick = () => { if(!S.gpsLost&&!S.sosActive&&!G.paused) G.complete(); };
    if (y) y.onclick = () => G.answerYes();
    if (n) n.onclick = () => G.answerNo();
    if (r) r.onclick = () => WH.MemorySafety.rest();
    if (go) go.onclick = () => G.resume();
  };

  G.bind = function () {
    $('#navSkip').onclick = () => G.skip();
    $('#navEnd').onclick = () => G.cancel();
    $('#wearerNavCancel').onclick=()=>G.cancel();
    $('#wearerNavHelp').onclick=()=>{WH.MemorySafety.reason='help';WH.MemorySafety.offer(T('mgReasonHelp'));};
    WH.$$('#navViewSwitch button').forEach(b=>b.onclick=()=>G.setView(b.dataset.navView));
    WH.$$('#navSpeed button').forEach((b) => (b.onclick = () => { G.speedMul = +b.dataset.sp; $$speed(); }));
    $('#navCall').onclick = () => WH.MemorySafety.handover();
    $('#navSos').onclick = () => WH.Sim.pressSos();
    $('#navDirector').innerHTML = `<div class="nd-h">${ic('spark', 14)} ${T('navDemo')}</div>
      <button data-a="wrong">${ic('route', 16)}<span>${T('nd_wrong')}</span></button>
      <button data-a="stop">${ic('stop', 16)}<span>${T('nd_stop')}</span></button>
      <button data-a="fall">${ic('alert', 16)}<span>${T('nd_fall')}</span></button>
      <button data-a="hr">${ic('pulse', 16)}<span>${T('nd_hr')}</span></button>
      <button data-a="night">${ic('moon', 16)}<span>${T('nd_night')}</span></button>
      <button data-a="low"><span>${T('mgLowButton')}</span></button>
      <button data-a="restore"><span>${T('mgRestore')}</span></button>
      <button data-a="confused"><span>${T('mgConfused')}</span></button>`;
    WH.$$('#navDirector button').forEach((b) => (b.onclick = () => {
      const a = b.dataset.a;
      if(a==='low'){if(!S.gpsLost)WH.Sim.gpsLost();return;}
      if(a==='restore'){if(S.gpsLost)WH.MemorySafety.restore();return;}
      if(a==='confused')return WH.MemorySafety.confused();
      if (a === 'wrong') G.wrongTurn(); else if (a === 'stop') G.holdStop(); else if (a === 'fall') WH.Sim.fall(false); else if (a === 'hr') WH.Sim.hrAbnormal('high'); else if (a === 'night') WH.Sim.toggleNight();
    }));
    G.setView(G.viewMode);
  };
  WH.Guide.posAt = posAt; WH.Guide.buildRoute = buildRoute; WH.Guide.buildSteps=buildSteps; WH.Guide.snapToRoad = snapToRoad;
})();
