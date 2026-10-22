/* Scenario engine: geofence + escalation ladder, falls, heart rate, voice phrases, calls, SOS, meds, device health. */
(function () {
  const WH = (window.WH = window.WH || {});
  const S = WH.S, $ = WH.$, $$ = WH.$$, esc = WH.esc;
  const T = (k, v) => WH.t(k, v);
  const Sim = (WH.Sim = {});
  const KM = WH.CITY.KM, SP = WH.CITY.SP;
  const nm = () => S.callName;
  const famName = (i) => (WH.contact(i) || { name: '' }).name;

  /* ───────────── helpers ───────────── */
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9'\u4e00-\u9fff ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  WH.norm = norm;
  WH.whereText = function () {
    const n = WH.nearestNode(S.pos.x, S.pos.z);
    return WH.STREETS_V[n.i] + ' / ' + WH.STREETS_H[n.j];
  };
  function stopWalkers() { Wander.active = false; S.moving = false; }
  Sim.pauseMovement = stopWalkers;

  /* ───────────── escalation ladder ───────────── */
  const Esc = (Sim.Esc = { on: false, vmin: 0, level: 0, noAnswer: 0, reaskT: 0, prompted: false });
  Sim.renderLadder = function () {
    const box = $('#pLadder'); if (!box) return;
    if (!Esc.on) {
      box.innerHTML = `<div class="lad idle">${ic('shield', 20)}<span>${T('ladIdle', { r: WH.effRadiusKm().toFixed(2) })}</span></div>`;
      return;
    }
    const e = S.esc;
    const steps = [
      { l: 1, t: T('ls1'), s: T('ls1s') },
      { l: 2, t: T('ls2', { n: famName(e[0].who) }), s: '+' + e[0].min + ' min' },
      { l: 3, t: T('ls3', { n: famName(e[1].who) }), s: '+' + e[1].min + ' min' },
      { l: 4, t: T('ls4'), s: '+' + e[2].min + ' min' }
    ];
    box.innerHTML = `<div class="lad ${S.guiding ? 'guiding' : ''}"><div class="lad-h"><b>${ic('ladder', 16)} ${T('ladTitle')}</b><span>${S.guiding ? T('ladGuiding') : T('ladOut', { m: Math.floor(Esc.vmin) })}</span></div>
      <div class="lad-steps">${steps.map((s) => `<div class="ls ${Esc.level >= s.l ? 'done' : Esc.level + 1 === s.l ? 'next' : ''}"><i>${Esc.level >= s.l ? ic('check', 14) : s.l}</i><b>${s.t}</b><span>${s.s}</span></div>`).join('')}</div></div>`;
  };
  function escBegin() {
    if (Esc.on) return;
    Esc.on = true; Esc.vmin = 0; Esc.level = 1; Esc.noAnswer = 0; Esc.reaskT = 0; Esc.prompted = false;
    WH._chipLocked = false;
    WH.sysLog(T('log_breach', { km: WH.distHomeKm().toFixed(2), r: WH.effRadiusKm().toFixed(2) }), 'bad');
    WH.feed(T('f_outside', { n: nm() }), 'amber', 'alert');
    WH.beep('alert'); WH.buzz('strong');
    Sim.renderLadder(); WH.refresh();
    askGoHome();
  }
  function escEnd(reason) {
    if (!Esc.on) return;
    Esc.on = false; Esc.level = 0; Esc.vmin = 0;
    WH.sysLog(T('log_resolved') + ' (' + reason + ')', 'ok');
    Sim.renderLadder(); WH.refresh();
  }
  function askGoHome() {
    if (!Esc.on || S.guiding || S.sosActive || WH.hasPrompt()) return;
    if (WH.MemorySafety) { Esc.prompted=true; WH.MemorySafety.check(); return; }
    Esc.prompted = true;
    WH.devPrompt({
      tone: 'blue', icon: 'nav', title: T('breachTitle'), text: T('breachText', { n: nm() }), secs: 16, haptic: 'strong', beep: 'chime', say: T('v_breach', { n: nm() }),
      buttons: [
        { label: T('yesHome'), tone: 'green', icon: 'home', fn: () => { WH.say(T('v_ok_walk')); WH.Guide.start(); } },
        { label: T('noImFine'), tone: 'ghost', icon: 'close', fn: () => { WH.say(T('v_fine')); WH.sysLog('User declined the first offer, will re-ask', 'warn'); Esc.reaskT = 14; } }
      ],
      onTimeout: () => { Esc.noAnswer++; WH.sysLog(T('log_noanswer', { k: Esc.noAnswer }), 'bad'); Esc.vmin = Math.max(Esc.vmin, S.esc[0].min); Esc.reaskT = 6; }
    });
  }
  function escStep(dt) {
    if (!Esc.on || S.sosActive) return;
    if (S.guiding) { return; }
    Esc.vmin += dt * 2.6;
    if (Esc.reaskT > 0) { Esc.reaskT -= dt; if (Esc.reaskT <= 0) askGoHome(); }
    const e = S.esc;
    if (Esc.level < 2 && Esc.vmin >= e[0].min) {
      Esc.level = 2; const c = WH.contact(e[0].who);
      WH.famBanner({ ic: 'bell', tone: 'amber', title: T('fb_out_title', { n: nm() }), body: T('fb_out_body', { m: e[0].min, d: WH.distHomeKm().toFixed(2) }) });
      WH.feed(T('f_push', { who: c.name, m: e[0].min }), 'amber', 'bell'); WH.sysLog(T('log_l2', { who: c.name }), 'warn'); Sim.renderLadder();
    }
    if (Esc.level < 3 && Esc.vmin >= e[1].min) {
      Esc.level = 3; const c = WH.contact(e[1].who);
      WH.famBanner({ ic: 'phone', tone: 'red', title: T('fb_l3_title', { n: nm() }), body: T('fb_l3_body', { who: c.name }) });
      WH.feed(T('f_l3', { who: c.name }), 'red', 'phone'); WH.beep('ring'); WH.sysLog(T('log_l3', { who: c.name }), 'bad'); Sim.renderLadder();
    }
    if (Esc.level < 4 && Esc.vmin >= e[2].min) {
      Esc.level = 4; Sim.sos('zone'); Sim.renderLadder();
    }
    if ((Math.floor(Esc.vmin) !== Esc._lm)) { Esc._lm = Math.floor(Esc.vmin); Sim.renderLadder(); }
  }

  /* ───────────── wander (walk out of the zone) ───────────── */
  const Wander = { active: false };
  Sim.wander = function () {
    if (S.guiding) return WH.toast(T('busyGuide'), 'warn');
    if (S.sosActive) return;
    if (Wander.active) return;
    WH.closePrompt(true); WH.closeChat();
    const rUnits = WH.effRadiusKm() * KM, want = Math.max(rUnits * 1.35, rUnits + 14);
    let best = null, bs = 1e9;
    for (let i = 1; i <= 11; i++) for (let j = 1; j <= 11; j++) {
      const p = WH.node(i, j), d = Math.hypot(p.x - WH.HOME_POS.x, p.z - WH.HOME_POS.z);
      const sc = Math.abs(d - want) + (p.x < WH.HOME_POS.x ? 18 : 0) + (p.z > 14 ? 10 : 0);
      if (sc < bs) { bs = sc; best = { i, j }; }
    }
    const tp = WH.node(best.i, best.j);
    const back = WH.Guide.buildRoute(tp);
    const pts = back.pts.slice().reverse();
    const cum = [0]; for (let k = 1; k < pts.length; k++) cum[k] = cum[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].z - pts[k - 1].z);
    // start from where she is now (snap to the first road point)
    Wander.pts = pts; Wander.cum = cum; Wander.s = 0; Wander.total = cum[cum.length - 1]; Wander.active = true;
    // skip the slow part: start just inside the zone edge so the crossing happens within a few seconds
    for (let k = 0; k < pts.length; k++) { if (Math.hypot(pts[k].x - WH.HOME_POS.x, pts[k].z - WH.HOME_POS.z) >= rUnits * 0.8) { Wander.s = Math.max(0, cum[Math.max(0, k - 1)]); break; } }
    const a = WH.Guide.posAt({ pts, cum, total: Wander.total }, Wander.s);
    WH.toast(ic('walk', 18) + ' ' + T('t_wander'), 'warn', 2500);
    WH.setAvatar(a.x, a.z, undefined, false);
    WH.sysLog(T('log_wander'), 'warn');
    WH.worlds.forEach((w) => w.setCam({ az: 0.9 }));
  };
  Sim.teleportFar = function () {
    if (S.guiding) return WH.toast(T('busyGuide'), 'warn');
    Wander.active = false;
    const rUnits = WH.effRadiusKm() * KM, want = Math.max(rUnits * 1.3, rUnits + 12);
    let best = null, bs = 1e9;
    for (let i = 2; i <= 11; i++) for (let j = 1; j <= 10; j++) {
      const p = WH.node(i, j), d = Math.hypot(p.x - WH.HOME_POS.x, p.z - WH.HOME_POS.z), sc = Math.abs(d - want) + (p.x < 0 ? 20 : 0);
      if (sc < bs) { bs = sc; best = p; }
    }
    WH.setAvatar(best.x, best.z, 2.2, false); S.trail = []; WH.worlds.forEach((w) => w.setTrail([]));
    WH.sysLog(T('log_teleport'), 'warn');
  };
  function wanderTick(dt) {
    if (!Wander.active) return;
    Wander.s = Math.min(Wander.total, Wander.s + 5 * dt);
    const p = WH.Guide.posAt({ pts: Wander.pts, cum: Wander.cum, total: Wander.total }, Wander.s);
    WH.setAvatar(p.x, p.z, Math.atan2(p.dx, p.dz), Wander.s < Wander.total);
    if (Wander.s >= Wander.total) { Wander.active = false; WH.sysLog(T('log_wander_stop'), 'warn'); }
  }

  /* ───────────── calls ───────────── */
  let call = null;
  Sim.callFamily = function (o) {
    if (S.sosActive) return;
    o = o || {};
    if (call) return;
    const c = WH.contact(o.who || 0);
    call = { o, c, t: 0, state: 'ring' };
    S.inCall = true;
    WH.sysLog(T('log_calling', { who: c.name, reason: o.reason || 'user' }), 'ok');
    WH.devPrompt({
      tone: 'green', icon: 'phone', title: T('mgWaiting'), text: T('mgSimulation'), haptic: 'soft', say: T('mgWaiting'),
      buttons: [{ label: T('hangUp'), tone: 'red', icon: 'close', fn: () => endCall() }]
    });
    famIncoming(c);
    // The caregiver explicitly acknowledges; elapsed time is not an acknowledgement.
  };
  function famIncoming(c) {
    WH.famLayer(`<div class="call in"><div class="call-ava big">${esc(nm().slice(-1))}</div><h3>${esc(nm())}</h3><p>${T('incoming')}</p>
      <div class="call-btns"><button class="cb red" id="fcDecline">${ic('close', 30)}</button><button class="cb green" id="fcAccept">${ic('phone', 30)}</button></div></div>`, 'dark');
    WH.beep('ring');
    $('#fcAccept').onclick = () => connect(); $('#fcDecline').onclick = () => endCall(true);
  }
  function connect() {
    if (S.sosActive) return;
    if (!call || call.state === 'live') return;
    call.state = 'live'; call.t0 = performance.now(); clearTimeout(call.auto);
    const c = call.c;
    WH.MemorySafety && WH.MemorySafety.acknowledged();
    const line = T(S.out ? 'callLineOut' : 'callLine', { n: nm() });
    WH.devPrompt({
      tone: 'green', icon: 'phone', title: T('mgAcknowledged'), text: T('mgSimulation'), extra: '<div class="dp-timer" id="dpTimer">00:00</div>',
      buttons: [{ label: T('hangUp'), tone: 'red', icon: 'close', fn: () => endCall() }]
    });
    WH.say(line);
    WH.famLayer(`<div class="call live"><div class="call-ava big">${esc(nm().slice(-1))}</div><h3>${esc(nm())}</h3><p id="fcTimer">00:00</p><div class="bubble">${esc(line)}</div>
      <div class="call-btns"><button class="cb red" id="fcEnd">${ic('close', 30)}</button></div></div>`, 'dark');
    $('#fcEnd').onclick = () => endCall();
    call.iv = setInterval(() => {
      if (!call) return; const s = Math.floor((performance.now() - call.t0) / 1000), tx = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      const a = $('#dpTimer'), b = $('#fcTimer'); a && (a.textContent = tx); b && (b.textContent = tx);
      if (call.o.auto && s >= 11) endCall();
    }, 250);
  }
  function endCall(declined) {
    if (!call) return; const c = call; call = null; S.inCall = false;
    clearTimeout(c.auto); clearInterval(c.iv);
    WH.closePrompt(); WH.famLayer(null);
    const secs = c.t0 ? Math.round((performance.now() - c.t0) / 1000) : 0;
    WH.feed(declined ? T('f_declined', { who: c.c.name }) : T('f_call', { who: c.c.name, s: secs }), declined ? 'amber' : 'blue', 'phone');
    c.o.onEnd && c.o.onEnd();
  }
  Sim.famCall = function () {
    if(S.sosActive)return;
    if (call) return;
    call = { o: {}, c: { name: nm() }, state: 'ring' };
    WH.famLayer(`<div class="call out"><div class="call-ava big">${esc(nm().slice(-1))}</div><h3>${esc(nm())}</h3><p>${T('calling2')}</p><div class="call-btns"><button class="cb red" id="fcEnd2">${ic('close', 30)}</button></div></div>`, 'dark');
    $('#fcEnd2').onclick = () => { WH.closePrompt(); call = null; WH.famLayer(null); };
    WH.devPrompt({
      tone: 'green', icon: 'phone', title: T('incomingDev', { who: famName(0) }), text: T('incomingDevSub'), haptic: 'strong', beep: 'ring', secs: 20, say: T('v_incoming', { who: famName(0) }), repeatBuzz: true,
      buttons: [{ label: T('answer'), tone: 'green', icon: 'phone', fn: () => { call.c = WH.contact(0); call.state = 'ring'; connect(); } }],
      onTimeout: () => { call = null; WH.famLayer(null); WH.feed(T('f_noans', { n: nm() }), 'amber', 'phone'); WH.famBanner({ ic: 'phone', tone: 'amber', title: T('noAnsTitle'), body: T('noAnsBody', { n: nm() }) }); }
    });
  };
  Sim.abortCall = function () { if(call){clearTimeout(call.auto);clearInterval(call.iv);call=null;} S.inCall=false; };
  Sim.notifyFamily = function (kind) {
    const map = {
      rest: ['heart', 'blue', T('nf_rest_t', { n: nm() }), T('nf_rest_b')],
      stopped: ['stop', 'amber', T('nf_stop_t', { n: nm() }), T('nf_stop_b')],
      lost: ['pin', 'red', T('nf_lost_t', { n: nm() }), T('nf_lost_b')],
      fallPhrase: ['alert', 'red', T('nf_fall_t', { n: nm() }), T('nf_fall_b')],
      repeat: ['bell', 'amber', T('nf_rep_t', { n: nm() }), T('nf_rep_b')]
    }[kind];
    if (!map) return;
    WH.famBanner({ ic: map[0], tone: map[1], title: map[2], body: map[3] }); WH.feed(map[2], map[1], map[0]);
  };

  /* ───────────── SOS ───────────── */
  Sim.pressSos = function () {
    if (S.sosActive) return;
    WH.devPrompt({
      tone: 'red', icon: 'sos', title: T('sosSending'), text: T('sosSendingSub'), secs: 3, haptic: 'strong', tick: true, say: T('v_sos_press'),
      buttons: [{ label: T('cancel'), tone: 'ghost', icon: 'close', fn: () => { WH.say(T('v_sos_cancel')); } }],
      onTimeout: () => Sim.sos('button')
    });
  };
  Sim.sos = function (reason) {
    if (S.sosActive) return;
    S.sosActive = true; WH.closeChat(); stopWalkers();
    WH.buzz('sos'); WH.beep('siren');
    WH._chipLocked = true; WH.setChip('SOS', 'red');
    WH.sysLog(T('log_sos', { r: T('r_' + reason) }), 'bad');
    const targets = S.contacts.map((c, i) => `<div class="sl-item" style="--d:${(i * 0.9 + 0.5).toFixed(1)}s">${ic('phone', 20)}<b>${esc(c.name)}</b><span>${i === 0 ? T('sosCalling') : T('sosSms')}</span><em>${ic('check', 16)}</em></div>`).join('') +
      `<div class="sl-item" style="--d:${(S.contacts.length * 0.9 + 0.8).toFixed(1)}s">${ic('ambulance', 20)}<b>${T('emerg')}</b><span>${T('sosGps')}</span><em>${ic('check', 16)}</em></div>`;
    WH.devPrompt({
      emergency: true, tone: 'red', big: true, icon: 'siren', title: T('sosTitle'), text: T('mgSimulation'), extra: `<div class="sos-list">${targets}</div>`, say: T('v_sos', { n: nm() }),
      buttons: [{ label: T('sosCancel'), tone: 'ghost', icon: 'check', fn: () => Sim.cancelSos(), keep: false }]
    });
    WH.buzz('sos');
    const c0 = WH.contact(0);
    WH.famLayer(`<div class="alert-full"><div class="af-siren">${ic('siren', 64)}</div><h2>${T('af_title', { n: esc(nm()) })}</h2><p class="af-reason">${T('r_' + reason)}</p>
      <div class="af-grid"><div><i>${ic('heart', 18)}</i><b>${Math.round(S.hr)}</b><span>bpm</span></div><div><i>${ic('pin', 18)}</i><b>${WH.distHomeKm().toFixed(2)}</b><span>km</span></div><div><i>${ic('battery', 18)}</i><b>${Math.round(S.batt)}</b><span>%</span></div></div>
      <div class="af-where">${ic('pin', 16)} ${esc(WH.whereText())}</div>
      <button class="af-btn red" id="afCall">${ic('phone', 24)} ${T('af_call', { n: esc(nm()) })}</button>
      <button class="af-btn" id="afWay">${ic('walk', 22)} ${T('af_way')}</button>
      <button class="af-btn ghost" id="afMap">${ic('map', 22)} ${T('af_map')}</button></div>`, 'red');
    WH.beep('siren');
    WH.feed(T('f_sos', { n: nm(), r: T('r_' + reason) }), 'red', 'siren');
    WH.feed(T('f_emerg'), 'red', 'ambulance');
    WH.Inbox.dispatch({ tone: 'red', ic: 'siren', title: T('af_title', { n: nm() }), body: T('r_' + reason) + '. ' + T('f_emerg') });
    $('#afCall').onclick = () => { WH.famLayer(null); Sim.famCall(); };
    $('#afWay').onclick = () => { WH.famLayer(null); WH.feed(T('f_onway', { who: c0.name }), 'green', 'walk'); WH.toast(ic('walk', 18) + ' ' + T('t_onway', { who: c0.name }), 'ok'); if (S.sosActive) { const b = $('#devLayer .dp-ic'); WH.say(T('v_onway', { who: c0.name })); } };
    $('#afMap').onclick = () => WH.famLayer(null);
    WH.refresh();
  };
  Sim.cancelSos = function () {
    if (!S.sosActive) return;
    S.sosActive = false; WH._chipLocked = false; WH.famLayer(null); WH.closePrompt();
    S.hr = S.hrBase; S.hrTarget = null;
    WH.say(T('v_sos_cancelled'));
    WH.feed(T('f_sos_cancel', { n: nm() }), 'green', 'check'); WH.famBanner({ ic: 'check', tone: 'green', title: T('fb_cancel_t', { n: nm() }), body: T('fb_cancel_b') });
    WH.sysLog(T('log_sos_cancel'), 'ok'); WH.refresh();
  };

  /* ───────────── fall + heart rate ───────────── */
  Sim.fall = function (critical) {
    if (S.sosActive) return;
    stopWalkers(); WH.closeChat();
    WH.buzz('strong'); WH.beep('siren');
    if (critical) {
      S.hrTarget = 36; WH.sysLog(T('log_fall_crit'), 'bad');
      WH.famBanner({ ic: 'alert', tone: 'red', title: T('fb_fallc_t', { n: nm() }), body: T('fb_fallc_b') });
      setTimeout(() => Sim.sos('fall-critical'), 900); return;
    }
    S.hrTarget = 118; WH.sysLog(T('log_fall'), 'bad');
    WH.famBanner({ ic: 'alert', tone: 'amber', title: T('fb_fall_t', { n: nm() }), body: T('fb_fall_b') });
    WH.feed(T('f_fall', { n: nm() }), 'amber', 'alert');
    WH.devPrompt({
      tone: 'red', icon: 'alert', title: T('fallTitle'), text: T('fallText'), secs: 20, haptic: 'strong', repeatBuzz: true, say: T('v_fall', { n: nm() }),
      buttons: [
        { label: T('imOk'), tone: 'green', icon: 'check', fn: () => { S.hrTarget = null; WH.say(T('v_fall_ok')); WH.famBanner({ ic: 'check', tone: 'green', title: T('fb_fallok_t', { n: nm() }), body: T('fb_fallok_b') }); WH.feed(T('f_fallok', { n: nm() }), 'green', 'check'); } },
        { label: T('needHelp'), tone: 'red', icon: 'sos', fn: () => Sim.sos('fall-confirmed') }
      ],
      onTimeout: () => Sim.sos('fall-noreply')
    });
  };
  Sim.hrAbnormal = function (kind) {
    if (S.sosActive) return;
    kind = kind || 'high'; const high = kind === 'high';
    S.hrTarget = high ? 152 : 34; WH.sysLog(T(high ? 'log_hr_high' : 'log_hr_low', { v: S.hrTarget }), 'bad');
    WH.famBanner({ ic: 'pulse', tone: 'red', title: T(high ? 'fb_hr_high_t' : 'fb_hr_low_t', { n: nm() }), body: T('fb_hr_b', { v: S.hrTarget }) });
    WH.feed(T(high ? 'f_hr_high' : 'f_hr_low', { n: nm(), v: S.hrTarget }), 'red', 'pulse');
    WH.beep('alert'); WH.buzz('strong');
    WH.devPrompt({
      tone: 'red', icon: 'heart', title: T(high ? 'hrTitleHigh' : 'hrTitleLow'), text: T('hrText'), secs: 20, haptic: 'strong', repeatBuzz: true, say: T(high ? 'v_hr_high' : 'v_hr_low', { n: nm() }),
      buttons: [
        { label: T('imOk'), tone: 'green', icon: 'check', fn: () => { S.hrTarget = null; WH.say(T('v_hr_ok')); WH.famBanner({ ic: 'check', tone: 'green', title: T('fb_hrok_t', { n: nm() }), body: T('fb_hrok_b') }); } },
        { label: T('callFam'), tone: 'blue', icon: 'phone', fn: () => Sim.callFamily({ reason: 'hr' }) }
      ],
      onTimeout: () => Sim.sos('hr')
    });
  };

  /* ───────────── medicine ───────────── */
  WH.renderRemind = function () {
    const box = $('#dRemind'); if (!box) return;
    const next = S.meds.find((m) => !m.done);
    if (!next) { box.innerHTML = `<div class="rm done">${ic('check', 26)}<span>${T('medAll')}</span></div>`; return; }
    box.innerHTML = `<div class="rm">${ic('pill', 30)}<div><b>${esc(next.time)} · ${esc(next.name)}</b><span>${esc(next.dose)}</span></div><button id="rmTaken">${ic('check', 22)}<span>${T('taken')}</span></button></div>`;
    $('#rmTaken').onclick = () => takeMed(next, 'manual');
  };
  function takeMed(m, how) {
    m.done = true; WH.beep('ok'); WH.renderRemind();
    WH.feed(T('f_med', { n: nm(), m: m.name, t: WH.nowStr() }), 'green', 'pill');
    WH.sysLog(T('log_med_ok', { m: m.name }), 'ok');
    if (how !== 'manual') WH.say(T('v_med_ok'));
  }
  Sim.medDue = function () {
    if (S.sosActive) return;
    const m = S.meds.find((x) => !x.done) || (S.meds.forEach((x) => (x.done = false)), S.meds[0]);
    WH.renderRemind(); WH.sysLog(T('log_med_due', { m: m.name }), 'warn');
    WH.devPrompt({
      tone: 'amber', icon: 'pill', title: T('medTitle', { m: esc(m.name) }), text: esc(m.dose) + '. ' + esc(m.note), secs: 25, haptic: 'soft', beep: 'chime', say: T('v_med', { n: nm(), m: m.name, d: m.dose, note: m.note }),
      buttons: [
        { label: T('taken'), tone: 'green', icon: 'check', fn: () => takeMed(m, 'prompt') },
        { label: T('later10'), tone: 'ghost', icon: 'clock', fn: () => { WH.say(T('v_later')); WH.feed(T('f_med_later', { n: nm() }), 'blue', 'clock'); } }
      ],
      onTimeout: () => { WH.sysLog(T('log_med_miss'), 'bad'); WH.famBanner({ ic: 'pill', tone: 'amber', title: T('fb_miss_t', { n: nm(), m: m.name }), body: T('fb_miss_b') }); WH.feed(T('f_miss', { n: nm(), m: m.name }), 'amber', 'pill'); }
    });
  };

  /* ───────────── device health ───────────── */
  /* device + world health: quiet notice first, louder reminders if it lasts */
  const Health = (Sim.Health = {});
  const HL = [15, 30]; // virtual minutes to reminder / alert
  function hStart(key, softIc, softTone, title, body, feedTxt) {
    Health[key] = { vmin: 0, level: 1 };
    WH.famBanner({ ic: softIc, tone: softTone, title, body, ms: 4200 }); WH.feed(feedTxt || title, softTone, softIc);
  }
  function hEnd(key, ic2, title) {
    if (!Health[key]) return; delete Health[key];
    WH.famBanner({ ic: ic2, tone: 'green', title, body: '', ms: 3500 }); WH.feed(title, 'green', ic2);
  }
  const HMSG = {
    batt: [['batteryLow', 'hb2_t', 'hb2_b'], ['batteryLow', 'hb3_t', 'hb3_b']],
    removed: [['hand', 'hr2_t', 'hr2_b'], ['hand', 'hr3_t', 'hr3_b']],
    gps: [['wifioff', 'hg2_t', 'hg2_b'], ['wifioff', 'hg3_t', 'hg3_b']]
  };
  function healthTick(dt) {
    Object.keys(Health).forEach((k) => {
      const h = Health[k]; h.vmin += dt * 2.6;
      const need = h.vmin >= HL[1] ? 3 : h.vmin >= HL[0] ? 2 : 1;
      if (need > h.level) {
        h.level = need; const m = HMSG[k][need - 2], v = { n: nm(), m: Math.floor(h.vmin), w: WH.whereText() };
        if (k === 'batt' && need === 2) S.batt = 5; if (k === 'batt' && need === 3) S.batt = 0;
        WH.famBanner({ ic: m[0], tone: need === 3 ? 'red' : 'amber', title: T(m[1], v), body: T(m[2], v), ms: need === 3 ? 9000 : 6000 });
        WH.feed(T(m[1], v), need === 3 ? 'red' : 'amber', m[0]); WH.sysLog(T(m[1], v), need === 3 ? 'bad' : 'warn');
        WH.refresh();
      }
    });
  }
  Sim.batteryLow = function () {
    if (Health.batt) { S.batt = 84; hEnd('batt', 'battery', T('fb_ok_batt', { n: nm() })); WH.sysLog(T('log_charged'), 'ok'); WH.refresh(); return; }
    S.batt = 14; WH.refresh(); WH.sysLog(T('log_batt'), 'warn');
    hStart('batt', 'batteryLow', 'blue', T('fb_batt_t'), T('fb_batt_b', { n: nm() }), T('f_batt'));
    if (!WH.hasPrompt()) WH.devPrompt({ tone: 'amber', icon: 'batteryLow', title: T('battTitle'), text: T('battText'), secs: 7, haptic: 'soft', say: T('v_batt'), buttons: [{ label: T('ok'), tone: 'blue', icon: 'check', fn: () => {} }], onTimeout: () => {} });
  };
  Sim.bandRemoved = function () {
    S.removed = !S.removed; WH.refresh();
    if (S.removed) { WH.sysLog(T('log_removed'), 'warn'); hStart('removed', 'hand', 'blue', T('fb_rem_t', { n: nm() }), T('fb_rem_b', { w: WH.whereText() }), T('f_rem')); }
    else { WH.sysLog(T('log_worn'), 'ok'); hEnd('removed', 'watch', T('fb_ok_rem', { n: nm() })); }
  };
  Sim.gpsLost = function () {
    S.gpsLost = !S.gpsLost; WH.refresh();
    if (S.gpsLost) { WH.sysLog(T('log_gps'), 'warn'); hStart('gps', 'wifioff', 'blue', T('fb_gps_t'), T('fb_gps_b', { w: WH.whereText() }), T('f_gps')); }
    else { WH.sysLog(T('log_gps_back'), 'ok'); hEnd('gps', 'gps', T('fb_ok_gps')); }
  };
  Sim.toggleNight = function () {
    S.night = !S.night;
    const d = new Date(), cur = d.getHours() * 60 + d.getMinutes();
    S.clockOffset = S.night ? ((21 * 60 + 5) - cur + 1440) % 1440 : 0;
    WH.sysLog(T(S.night ? 'log_night' : 'log_day', { r: S.curfewKm }), 'warn'); WH.refresh();
    WH.famBanner({ ic: S.night ? 'moon' : 'sun', tone: 'blue', title: T(S.night ? 'fb_night_t' : 'fb_day_t'), body: T(S.night ? 'fb_night_b' : 'fb_day_b', { r: S.curfewKm }), ms: 4200 });
    WH.feed(T(S.night ? 'fb_night_t' : 'fb_day_t'), 'blue', S.night ? 'moon' : 'sun');
  };

  /* ───────────── family-side actions ───────────── */
  Sim.ringBand = function () {
    WH.buzz('strong'); WH.beep('ring'); WH.sysLog(T('log_ring'), 'ok');
    WH.devPrompt({ tone: 'blue', icon: 'ring', title: T('ringTitle'), text: T('ringText', { who: famName(0) }), haptic: 'strong', say: T('v_ring', { who: famName(0) }), secs: 12,
      buttons: [{ label: T('imHere'), tone: 'green', icon: 'check', fn: () => { WH.famBanner({ ic: 'check', tone: 'green', title: T('fb_ring_t', { n: nm() }), body: T('fb_ring_b') }); WH.feed(T('f_ring_ack', { n: nm() }), 'green', 'check'); } }],
      onTimeout: () => { WH.feed(T('f_ring_no', { n: nm() }), 'amber', 'ring'); } });
  };
  Sim.checkIn = function () {
    WH.sysLog(T('log_checkin'), 'ok');
    WH.devPrompt({ tone: 'blue', icon: 'eye', title: T('ciTitle', { who: famName(0) }), text: T('ciText'), secs: 15, haptic: 'soft', beep: 'chime', say: T('v_ci', { n: nm(), who: famName(0) }),
      buttons: [{ label: T('imOk'), tone: 'green', icon: 'check', fn: () => { WH.famBanner({ ic: 'check', tone: 'green', title: T('fb_ci_ok', { n: nm() }), body: '' }); WH.feed(T('fb_ci_ok', { n: nm() }), 'green', 'check'); } }, { label: T('needHelp'), tone: 'red', icon: 'sos', fn: () => Sim.sos('checkin') }],
      onTimeout: () => { WH.famBanner({ ic: 'alert', tone: 'amber', title: T('fb_ci_no', { n: nm() }), body: T('fb_ci_no_b') }); WH.feed(T('fb_ci_no', { n: nm() }), 'amber', 'alert'); } });
  };
  Sim.voiceNote = function () {
    WH.famLayer(`<div class="vn"><h3>${ic('volume', 22)} ${T('vnTitle')}</h3><p>${T('vnSub', { n: esc(nm()) })}</p><textarea id="vnText" rows="3" placeholder="${esc(T('vnPh'))}"></textarea>
      <div class="vn-chips"><button>${T('vnC1')}</button><button>${T('vnC2')}</button><button>${T('vnC3')}</button></div>
      <div class="vn-act"><button class="btn ghost" id="vnX">${T('cancel')}</button><button class="btn primary" id="vnSend">${ic('send', 18)} ${T('vnSend')}</button></div></div>`, 'light');
    $$('.vn-chips button').forEach((b) => (b.onclick = () => ($('#vnText').value = b.textContent)));
    $('#vnX').onclick = () => WH.famLayer(null);
    $('#vnSend').onclick = () => {
      const txt = $('#vnText').value.trim() || T('vnC1'); WH.famLayer(null);
      WH.feed(T('f_vn', { t: esc(txt) }), 'blue', 'volume');
      WH.devPrompt({ tone: 'blue', icon: 'volume', title: T('vnDev', { who: famName(0) }), text: '“' + esc(txt) + '”', haptic: 'soft', beep: 'chime', say: T('vnSay', { who: famName(0), t: txt }), buttons: [{ label: T('ok'), tone: 'green', icon: 'check', fn: () => {} }] });
    };
  };

  /* ───────────── chat brain ───────────── */
  Sim.userSays = function (text) {
    text = (text || '').trim(); if (!text) return;
    WH.openChat(); WH.chatUser(text);
    setTimeout(() => process(text), 520);
  };
  function process(text) {
    if(S.sosActive)return;
    const n = norm(text);
    for (const p of S.phrases) {
      const keys = [p.say].concat(p.variants || []).map(norm).filter(Boolean);
      if (keys.some((k) => n.includes(k))) { return phrase(p, text); }
    }
    const has = (...w) => w.some((x) => n.includes(x));
    const cnt = (k) => (S.askCount[k] = (S.askCount[k] || 0) + 1);
    if (has('where am i', 'toi o dau', 'o dau')) {
      const c = cnt('where'); WH.chatBot(T('c_where', { w: WH.whereText(), d: Math.round(WH.distHomeKm() * 1000) }));
      if (c >= 3) { Sim.notifyFamily('repeat'); WH.sysLog(T('log_repeat', { k: 'where' }), 'warn'); S.askCount.where = 0; }
      return;
    }
    if (has('tired', 'met', 'dizzy', 'chong mat', 'pain', 'dau')) { WH.chatBot(T('c_tired')); Sim.notifyFamily('rest'); return; }
    if (has('home', 'nha', 've nha')) { WH.chatBot(T('c_home')); setTimeout(() => { WH.closeChat(); Sim.pressHome(); }, 1800); return; }
    if (has('call', 'goi', 'son', 'daughter', 'con ')) { WH.chatBot(T('c_call', { who: famName(0) })); setTimeout(() => { WH.closeChat(); Sim.callFamily({ reason: 'chat' }); }, 1500); return; }
    if (has('medic', 'pill', 'thuoc')) return phrase({ action: 'meds' }, text);
    if (has('hello', 'hi ', 'xin chao', 'chao')) { WH.chatBot(T('c_hello', { n: nm() })); return; }
    if (has('thank', 'cam on')) { WH.chatBot(T('c_thanks')); return; }
    WH.chatBot(T('c_default', { n: nm() }));
  }
  function phrase(p, text) {
    WH.sysLog(T('log_phrase', { p: esc(p.say || text), a: T('act_' + p.action) }), 'warn');
    const who = p.who == null ? 0 : p.who;
    if (p.action === 'fall') {
      WH.chatBot(T('c_fall', { n: nm() })); Sim.notifyFamily('fallPhrase');
      setTimeout(() => { WH.closeChat(); Sim.sos('phrase-fall'); }, 1800);
    } else if (p.action === 'sos') {
      WH.chatBot(T('c_sos', { n: nm() })); setTimeout(() => { WH.closeChat(); Sim.sos('phrase-help'); }, 1500);
    } else if (p.action === 'lost') {
      WH.chatBot(T('c_lost', { n: nm() })); Sim.notifyFamily('lost');
      setTimeout(() => { WH.closeChat(); if (WH.distHomeKm() < 0.12) Sim.teleportFar(); WH.Guide.start(); }, 2300);
    } else if (p.action === 'meds') {
      const c = (S.askCount.meds = (S.askCount.meds || 0) + 1);
      const m = S.meds.find((x) => !x.done), last = S.meds.filter((x) => x.done).slice(-1)[0];
      WH.chatBot(m ? T('c_meds', { n: nm(), m: m.name, t: m.time, d: m.dose, note: m.note, lastm: last ? last.name : '', lt: last ? last.time : '' }) : T('c_meds_done', { n: nm() }));
      if (c >= 3) { Sim.notifyFamily('repeat'); WH.sysLog(T('log_repeat', { k: 'meds' }), 'warn'); S.askCount.meds = 0; }
      else setTimeout(() => WH.devPrompt({ tone: 'blue', icon: 'pill', title: T('allClear'), text: T('allClearQ', { who: famName(0) }), secs: 14, buttons: [{ label: T('yesClear'), tone: 'green', icon: 'check', fn: () => WH.say(T('v_clear')) }, { label: T('callMe', { who: famName(0) }), tone: 'blue', icon: 'phone', fn: () => { WH.closeChat(); Sim.callFamily({ reason: 'meds' }); } }], onTimeout: () => {} }), 2600);
    } else if (p.action === 'call') {
      WH.chatBot(T('c_call', { who: famName(who) })); setTimeout(() => { WH.closeChat(); Sim.callFamily({ who, reason: 'phrase' }); }, 1500);
    }
  }
  Sim.sayPhrase = function (id) {
    const p = S.phrases.find((x) => x.id === id) || S.phrases[0];
    Sim.userSays(p.say);
  };

  /* ───────────── elder buttons ───────────── */
  Sim.pressHome = function () {
    if (S.guiding) return;
    if (WH.distHomeKm() < 0.1 && !S.out) {
      WH.devPrompt({ tone: 'blue', icon: 'home', title: T('atHomeTitle'), text: T('atHomeText'), secs: 0, say: T('v_athome', { n: nm() }),
        buttons: [{ label: T('practice'), tone: 'green', icon: 'walk', fn: () => { Sim.teleportFar(); setTimeout(() => WH.Guide.start({ practice: true }), 400); } }, { label: T('noThanks'), tone: 'ghost', icon: 'close', fn: () => {} }] });
      return;
    }
    WH.devPrompt({ tone: 'blue', icon: 'nav', title: T('goHomeQ'), text: T('goHomeText'), say: T('v_gohome'), haptic: 'soft',
      buttons: [{ label: T('yesGo'), tone: 'green', icon: 'home', fn: () => { Wander.active = false; WH.Guide.start(); } }, { label: T('notNow'), tone: 'ghost', icon: 'close', fn: () => {} }] });
  };
  Sim.pressCall = function () { Sim.callFamily({ reason: 'user' }); };

  /* ───────────── lifecycle hooks used by the guide ───────────── */
  Sim.onGuideStart = function () {
    Wander.active = false;
    WH.famBanner({ ic: 'nav', tone: 'blue', title: T('fb_guide_t', { n: nm() }), body: T('fb_guide_b') });
    WH.feed(T('f_guide', { n: nm() }), 'blue', 'nav'); WH.setChip(T('chipGuide'), 'blue'); Sim.renderLadder();
  };
  Sim.onArrived = function () {
    S.out = false; WH.famBanner({ ic: 'home', tone: 'green', title: T('fb_home_t', { n: nm() }), body: T('fb_home_b') });
    WH.feed(T('f_home', { n: nm() }), 'green', 'home'); WH.sysLog(T('log_arrived'), 'ok');
    S.guiding = false; escEnd('arrived'); S.trail = []; WH.worlds.forEach((w) => w.setTrail([]));
  };
  Sim.onGuideAborted = function () {
    WH.feed(T('f_guide_end', { n: nm() }), 'amber', 'close');
    if (Esc.on) { WH.famBanner({ ic: 'close', tone: 'amber', title: T('fb_gend_t', { n: nm() }), body: T('fb_gend_b') }); Sim.renderLadder(); Esc.reaskT = 8; }
  };
  Sim.onReroute = function () { WH.feed(T('f_reroute', { n: nm() }), 'blue', 'route'); };

  Sim.reset = function () {
    if (WH.Guide.active) WH.Guide.stop(true);
    WH.closePrompt(true); WH.closeChat(); WH.famLayer(null); $('#navPrompt').innerHTML = '';
    if (call) { clearInterval(call.iv); clearTimeout(call.auto); call = null; }
    Wander.active = false; Esc.on = false; Esc.level = 0; Esc.vmin = 0; Esc.reaskT = 0;
    Object.keys(Health).forEach((k) => delete Health[k]);
    Object.assign(S, { out: false, sosActive: false, guiding: false, inCall: false, night: false, clockOffset: 0, gpsLost: false, removed: false, batt: 84, hr: 72, hrBase: 72, hrTarget: null, askCount: {} });
    S.meds.forEach((m, i) => (m.done = i === 0)); S.trail = []; WH.worlds.forEach((w) => w.setTrail([]));
    WH.setAvatar(WH.DOOR.x, WH.DOOR.z, 0, false); WH._chipLocked = false;
    WH.Inbox.reset(); $('#pFeed').innerHTML = ''; $('#csBody').innerHTML = ''; $('#pBanners').innerHTML = '';
    Sim.renderLadder(); WH.renderRemind(); WH.refresh();
    WH.sysLog(T('log_reset'), 'ok'); WH.toast(ic('refresh', 18) + ' ' + T('t_reset'), 'ok', 2000);
  };

  /* ───────────── frame tick ───────────── */
  let acc = 0, slow = 0;
  WH.onFrame = function (dt) {
    wanderTick(dt); healthTick(dt);
    WH.Guide.tick(dt);
    // zone check
    if (!S.sosActive) {
      const outside = WH.isOutside();
      if (outside !== S.out) { S.out = outside; WH.refresh(); }
      if (outside && !Esc.on) escBegin();
      else if (!outside && Esc.on && !S.guiding && !WH.Guide.active) { escEnd('returned'); }
    }
    escStep(dt);
    // heart rate
    const moving = S.moving ? 9 : 0;
    const tgt = S.hrTarget != null ? S.hrTarget : S.hrBase + moving + Math.sin(performance.now() / 2300) * 2;
    S.hr += (tgt - S.hr) * Math.min(1, dt * (S.hrTarget != null ? 1.2 : 0.8));
    WH.tickEcg && WH.tickEcg(dt);
    slow += dt; if (slow > 0.5) { slow = 0; if (S.screen === 'stage') WH.refresh(); }
    acc += dt;
  };

  /* ───────────── director panel ───────────── */
  Sim.buildDirector = function () {
    const groups = [
      { t: 'dg_move', items: [['walk', 'dir_wander', () => Sim.wander()], ['pin', 'dir_teleport', () => Sim.teleportFar()], ['clock', 'dir_ffwd', () => { if (Esc.on) { Esc.vmin += 8; WH.sysLog('+8 virtual minutes', 'warn'); } else WH.toast(T('t_needOut'), 'warn'); }]] },
      { t: 'dg_safety', items: [['alert', 'dir_fall', () => Sim.fall(false)], ['siren', 'dir_fallc', () => Sim.fall(true)], ['pulse', 'dir_hrh', () => Sim.hrAbnormal('high')], ['heart', 'dir_hrl', () => Sim.hrAbnormal('low')]] },
      { t: 'dg_voice', items: [['mic', 'dir_lost', () => Sim.sayPhrase('p3')], ['mic', 'dir_fellsay', () => Sim.sayPhrase('p1')], ['mic', 'dir_helpsay', () => Sim.sayPhrase('p2')], ['pill', 'dir_forgot', () => Sim.sayPhrase('p4')]] },
      { t: 'dg_daily', items: [['pill', 'dir_med', () => Sim.medDue()]] },
      { t: 'dg_device', items: [['batteryLow', 'dir_batt', () => Sim.batteryLow()], ['hand', 'dir_removed', () => Sim.bandRemoved()], ['wifioff', 'dir_gps', () => Sim.gpsLost()], ['moon', 'dir_night', () => Sim.toggleNight()]] },
      { t: 'dg_reset', items: [['refresh', 'dir_reset', () => Sim.reset()]] }
    ];
    $('#dirGroups').innerHTML = groups.map((g) => `<div class="dg"><h4>${T(g.t)}</h4>${g.items.map((it, i) => `<button class="dbtn" data-g="${g.t}" data-i="${i}">${ic(it[0], 20)}<span>${T(it[1])}</span></button>`).join('')}</div>`).join('');
    $$('#dirGroups .dbtn').forEach((b) => (b.onclick = () => { const g = groups.find((x) => x.t === b.dataset.g); g.items[+b.dataset.i][2](); }));
  };

  Sim.bind = function () {
    $('#bHome').onclick = () => Sim.pressHome();
    $('#bCall').onclick = () => Sim.pressCall();
    $('#bAsk').onclick = () => { if(!S.sosActive) WH.openChat(); };
    $('#bSos').onclick = () => Sim.pressSos();
    $('#csClose').onclick = () => WH.closeChat();
    const send = () => { const i = $('#csInput'); const v = i.value; i.value = ''; Sim.userSays(v); };
    $('#csSend').onclick = send; $('#csInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    $('#csMic').onclick = () => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return WH.toast(ic('mic', 18) + ' ' + T('t_nomic'), 'warn');
      const r = new SR(); r.lang = { vi: 'vi-VN', id: 'id-ID' }[S.lang] || 'en-US'; r.onresult = (e) => Sim.userSays(e.results[0][0].transcript); r.onerror = () => WH.toast(T('t_nohear'), 'warn'); r.start(); WH.toast(ic('mic', 18) + ' ' + T('t_listening'), 'ok', 2000);
    };
    $('#pCall').onclick = () => Sim.famCall();
    $('#pMsg').onclick = () => Sim.voiceNote();
    $('#pRing').onclick = () => Sim.ringBand();
    $('#pCheck').onclick = () => Sim.checkIn();
  };
})();
