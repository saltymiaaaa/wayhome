/* Family setup wizard (6 steps) with a live 3D map. */
(function () {
  const WH = (window.WH = window.WH || {});
  const S = WH.S, $ = WH.$, $$ = WH.$$, esc = WH.esc;
  const T = (k, v) => WH.t(k, v);
  const Setup = (WH.Setup = { step: 1, max: 6, pairState: 0, pendingLm: null, lmPhoto: null, lmType: 'market' });
  let uid = 100;

  const STEPS = [
    ['user', 'st1'], ['map', 'st2'], ['shield', 'st3'], ['users', 'st4'], ['assistant', 'st5'], ['watch', 'st6']
  ];

  Setup.open = function (step) {
    Setup.step = step || 1; WH.go('setup'); Setup.render();
  };

  function renderStepper() {
    $('#stepper').innerHTML = STEPS.map((s, i) => {
      const n = i + 1, cls = n === Setup.step ? 'on' : n < Setup.step ? 'done' : '';
      return `<button class="st ${cls}" data-n="${n}"><i>${n < Setup.step ? ic('check', 16) : ic(s[0], 18)}</i><span>${T(s[1])}</span></button>`;
    }).join('<b class="st-line"></b>');
    $$('#stepper .st').forEach((b) => (b.onclick = () => { Setup.step = +b.dataset.n; Setup.render(); }));
  }

  const row = (label, html, hint) => `<div class="fld"><label>${label}</label>${html}${hint ? `<small>${hint}</small>` : ''}</div>`;
  const inp = (id, v, type, ph) => `<input id="${id}" type="${type || 'text'}" value="${esc(v)}" ${ph ? `placeholder="${esc(ph)}"` : ''}>`;

  /* ── step 1: profile ── */
  function s1() {
    return `<h2>${T('s1t')}</h2><p class="lead2">${T('s1d')}</p>
    <div class="grid2">${row(T('fFull'), inp('fName', S.name))}${row(T('fCall'), inp('fCall', S.callName), T('fCallH'))}</div>
    <div class="grid2">${row(T('fAge'), inp('fAge', S.age, 'number'))}${row(T('fLang'), `<div class="seg wide" id="elLang"><button data-l="en" class="${S.lang === 'en' ? 'on' : ''}">English</button><button data-l="vi" class="${S.lang === 'vi' ? 'on' : ''}">Tiếng Việt</button><button data-l="id" class="${S.lang === 'id' ? 'on' : ''}">Indonesia</button></div>`)}</div>
    ${row(T('fNotes'), `<textarea id="fNotes" rows="3">${esc(S.notes)}</textarea>`, T('fNotesH'))}
    <div class="fld"><label>${T('fDevice')}</label><div class="cards2">
      <button class="pick ${S.device === 'watch' ? 'on' : ''}" data-dev="watch">${ic('watch', 40)}<b>${T('devWatch')}</b><span>${T('devWatchD')}</span></button>
      <button class="pick ${S.device === 'pendant' ? 'on' : ''}" data-dev="pendant">${ic('pendant', 40)}<b>${T('devPendant')}</b><span>${T('devPendantD')}</span></button></div></div>`;
  }
  function b1() {
    $('#fName').oninput = (e) => { S.name = e.target.value; };
    $('#fCall').oninput = (e) => { S.callName = e.target.value || S.callName; S.shortName = S.callName; };
    $('#fAge').oninput = (e) => { S.age = +e.target.value; };
    $('#fNotes').oninput = (e) => { S.notes = e.target.value; };
    $$('#elLang button').forEach((b) => (b.onclick = () => { WH.setLang(b.dataset.l); }));
    $$('.pick[data-dev]').forEach((b) => (b.onclick = () => { S.device = b.dataset.dev; Setup.render(); }));
  }

  /* ── step 2: home + map provider + landmarks ── */
  const SUGGEST = ['24 Fuhua Road, Futian District, Shenzhen', '24 Fuhua Rd, Futian, Shenzhen, Guangdong', '24 Fuhua Road, Nanshan District, Shenzhen'];
  function s2() {
    const prov = [['amap', 'Amap (高德地图)', '#1aa0ff'], ['google', 'Google Maps', '#4285f4'], ['apple', 'Apple Maps', '#34c759']];
    return `<h2>${T('s2t')}</h2><p class="lead2">${T('s2d')}</p>
    ${row(T('fAddr'), `<div class="addr">${inp('fAddr', S.addr)}<button class="btn ghost sm" id="btnLocate">${ic('gps', 18)} ${T('locate')}</button></div><div class="suggest" id="suggest"></div>`)}
    <div class="fld"><label>${T('fProv')}</label><div class="provs">${prov.map((p) => `<button class="prov ${S.provider === p[0] ? 'on' : ''} ${S.providers[p[0]] ? 'ok' : ''}" data-p="${p[0]}" style="--pc:${p[2]}"><i>${ic('map', 22)}</i><b>${p[1]}</b><span>${S.providers[p[0]] ? ic('check', 14) + ' ' + T('connected') : T('connect')}</span></button>`).join('')}</div></div>
    <div class="fld"><label>${T('fLms')} <em>(${S.landmarks.length})</em></label><div class="tip">${ic('pin', 18)}<span>${T('lmTip')}</span></div>
    <div class="lms">${S.landmarks.map((l, i) => `<div class="lm"><img src="${l.photo || landmarkArt(l.type, l.name)}" alt=""><div><b>${esc(l.name)}</b><span>${esc(WH.STREETS_V[l.i])}</span></div><button class="x" data-rm="${i}">${ic('trash', 18)}</button></div>`).join('')}</div></div>`;
  }
  function b2() {
    $('#fAddr').oninput = (e) => { S.addr = e.target.value; const q = e.target.value.trim().toLowerCase(); $('#suggest').innerHTML = q.length > 3 ? SUGGEST.filter((s) => s.toLowerCase().includes(q.slice(0, 5))).map((s) => `<button>${ic('pin', 16)} ${esc(s)}</button>`).join('') : ''; $$('#suggest button').forEach((b) => (b.onclick = () => { S.addr = b.textContent.trim(); $('#fAddr').value = S.addr; $('#suggest').innerHTML = ''; locate(); })); };
    $('#btnLocate').onclick = locate;
    $$('.prov').forEach((b) => (b.onclick = () => {
      const p = b.dataset.p; S.provider = p;
      if (!S.providers[p]) { b.classList.add('busy'); b.lastElementChild.innerHTML = '<span class="spin"></span> ' + T('connecting'); setTimeout(() => { S.providers[p] = true; WH.toast(ic('check', 18) + ' ' + T('provOk', { p: b.querySelector('b').textContent }), 'ok'); Setup.render(); }, 1100); }
      else Setup.render();
    }));
    $$('[data-rm]').forEach((b) => (b.onclick = () => { WH.MemoryData.remove('places', S.landmarks[+b.dataset.rm].id); Setup.render(); }));
  }
  function locate() {
    WH.toast(ic('gps', 18) + ' ' + T('located'), 'ok'); WH.wSetup.flyHome(40);
  }

  /* ── step 3: zone ── */
  function s3() {
    const e = S.esc, cn = (sel) => S.contacts.map((c, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${esc(c.name)} (${esc(c.rel)})</option>`).join('');
    return `<h2>${T('s3t')}</h2><p class="lead2">${T('s3d')}</p>
    ${row(T('fRadius') + ` <b class="val" id="vRad">${S.radiusKm.toFixed(1)} km</b>`, `<input type="range" id="fRad" min="0.2" max="1.1" step="0.1" value="${S.radiusKm}">`, T('fRadiusH'))}
    ${row(T('fGrace') + ` <b class="val" id="vGrace">${S.graceMin} min</b>`, `<input type="range" id="fGrace" min="10" max="60" step="5" value="${S.graceMin}">`, T('fGraceH'))}
    <div class="fld"><label>${T('fCurfew')}</label><div class="curfew ${S.curfewOn ? 'on' : ''}"><button class="switch ${S.curfewOn ? 'on' : ''}" id="swCurfew"><i></i></button><div><b>${T('curfewT')}</b><span>${T('curfewD')}</span></div>
      <div class="cf-ctl"><span>${T('after')}</span>${inp('fCfFrom', S.curfewFrom, 'time')}<span>${T('radius')}</span><b class="val" id="vCf">${S.curfewKm.toFixed(2)} km</b></div><input type="range" id="fCf" min="0.1" max="0.6" step="0.05" value="${S.curfewKm}"></div></div>
    <div class="fld"><label>${ic('ladder', 16)} ${T('fLadder')}</label><div class="ladder-ed">
      <div class="lr"><i>1</i><div><b>${T('ls1')}</b><span>${T('ladE1')}</span></div><em>${T('now')}</em></div>
      <div class="lr"><i>2</i><div><b>${T('ladE2')}</b><span><select id="lw0">${cn(e[0].who)}</select> · ${T('viaPush')}</span></div><em><input type="number" id="lm0" min="1" max="30" value="${e[0].min}"> min</em></div>
      <div class="lr"><i>3</i><div><b>${T('ladE3')}</b><span><select id="lw1">${cn(e[1].who)}</select> · ${T('viaSmsCall')}</span></div><em><input type="number" id="lm1" min="2" max="45" value="${e[1].min}"> min</em></div>
      <div class="lr"><i>4</i><div><b>${T('ladE4')}</b><span>${T('ladE4d')}</span></div><em id="lm2">${S.graceMin} min</em></div></div></div>`;
  }
  function zoneCam() { const r = (S.night && S.curfewOn ? S.curfewKm : S.radiusKm) * WH.CITY.KM; WH.wSetup.setCam({ tx: WH.HOME_POS.x, tz: WH.HOME_POS.z, dist: Math.min(150, Math.max(55, r * 2.5 + 28)), pol: 0.85 }); }
  function b3() {
    $('#fRad').oninput = (e) => { S.radiusKm = +e.target.value; $('#vRad').textContent = S.radiusKm.toFixed(1) + ' km'; zoneCam(); foot(); };
    $('#fGrace').oninput = (e) => { S.graceMin = +e.target.value; S.esc[2].min = S.graceMin; $('#vGrace').textContent = S.graceMin + ' min'; $('#lm2').textContent = S.graceMin + ' min'; };
    $('#swCurfew').onclick = () => { S.curfewOn = !S.curfewOn; Setup.render(); };
    $('#fCf').oninput = (e) => { S.curfewKm = +e.target.value; $('#vCf').textContent = S.curfewKm.toFixed(2) + ' km'; };
    $('#fCfFrom').oninput = (e) => { S.curfewFrom = e.target.value; };
    ['0', '1'].forEach((k) => { $('#lw' + k).onchange = (e) => { S.esc[+k].who = +e.target.value; }; $('#lm' + k).oninput = (e) => { S.esc[+k].min = +e.target.value || 1; }; });
  }

  /* ── step 4: contacts ── */
  function s4() {
    return `<h2>${T('s4t')}</h2><p class="lead2">${T('s4d')}</p>
    <div class="contacts">${S.contacts.map((c, i) => `<div class="ct"><div class="ava">${esc(c.name.slice(0, 1))}</div><div class="ct-t"><b>${esc(c.name)} <em>${esc(c.rel)}</em></b><span>${esc(c.phone)}</span>
      <div class="ct-ch"><span class="tag">${ic('bell', 13)} ${T('push')}</span><span class="tag">${ic('chat', 13)} SMS</span><span class="tag">${ic('phone', 13)} ${T('call')}</span></div></div>
      <div class="ct-act">${c.paired ? `<span class="paired">${ic('link', 16)} ${T('paired')}</span>` : `<button class="btn primary sm" data-pair="${i}">${ic('qr', 16)} ${T('pairPhone')}</button>`}<button class="x" data-rmc="${i}">${ic('trash', 18)}</button></div></div>`).join('')}</div>
    <div class="add-ct"><h4>${ic('plus', 16)} ${T('addContact')}</h4><div class="grid3">${inp('cName', '', 'text', T('cName'))}${inp('cRel', '', 'text', T('cRel'))}${inp('cPhone', '', 'tel', '+86 …')}</div><button class="btn ghost" id="btnAddC">${ic('plus', 18)} ${T('add')}</button></div>`;
  }
  function b4() {
    $('#btnAddC').onclick = () => {
      const n = $('#cName').value.trim(), p = $('#cPhone').value.trim();
      if (!n || !p) return WH.toast(T('needNamePhone'), 'warn');
      S.contacts.push({ id: 'c' + uid++, name: n, rel: $('#cRel').value.trim() || T('family'), phone: p, paired: false }); Setup.render();
    };
    $$('[data-rmc]').forEach((b) => (b.onclick = () => { if (S.contacts.length < 2) return WH.toast(T('needOne'), 'warn'); S.contacts.splice(+b.dataset.rmc, 1); S.esc.forEach((e) => { if (e.who >= S.contacts.length) e.who = 0; }); Setup.render(); }));
    $$('[data-pair]').forEach((b) => (b.onclick = () => openPair(+b.dataset.pair)));
  }
  function qr(canvas) {
    const g = canvas.getContext('2d'), n = 25, c = canvas.width / n; g.fillStyle = '#fff'; g.fillRect(0, 0, canvas.width, canvas.width); g.fillStyle = '#0b1226';
    let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const finder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!finder && r() < 0.5) g.fillRect(x * c, y * c, c, c);
    }
    [[0, 0], [n - 7, 0], [0, n - 7]].forEach(([fx, fy]) => { g.fillStyle = '#0b1226'; g.fillRect(fx * c, fy * c, 7 * c, 7 * c); g.fillStyle = '#fff'; g.fillRect((fx + 1) * c, (fy + 1) * c, 5 * c, 5 * c); g.fillStyle = '#0b1226'; g.fillRect((fx + 2) * c, (fy + 2) * c, 3 * c, 3 * c); });
  }
  function openPair(i) {
    const c = S.contacts[i]; $('#pairWho').innerHTML = T('pairWho', { n: '<b>' + esc(c.name) + '</b>', p: esc(c.phone) });
    qr($('#qrCanvas')); $('#mdPair').classList.add('on');
    $('#pairCancel').onclick = () => $('#mdPair').classList.remove('on');
    $('#pairDone').onclick = () => { c.paired = true; $('#mdPair').classList.remove('on'); WH.toast(ic('link', 18) + ' ' + T('pairedToast', { n: c.name }), 'ok'); Setup.render(); };
  }

  /* ── step 5: voice, phrases, medicine, sensors ── */
  const ACTIONS = ['fall', 'sos', 'lost', 'meds', 'call'];
  function s5() {
    const cn = (sel) => S.contacts.map((c, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    return `<h2>${T('s5t')}</h2><p class="lead2">${T('s5d')}</p>
    <div class="grid2">${row(T('fAssist'), inp('fAsName', S.assistant.name), T('fAssistH'))}${row(T('fVoice'), `<div class="seg wide" id="voiceSeg"><button data-v="warm" class="${S.assistant.voice === 'warm' ? 'on' : ''}">${T('vWarm')}</button><button data-v="deep" class="${S.assistant.voice === 'deep' ? 'on' : ''}">${T('vDeep')}</button></div>`)}</div>
    <div class="fld"><label>${ic('mic', 16)} ${T('fPhrases')}</label><p class="hint">${T('fPhrasesH')}</p>
    <div class="phr">${S.phrases.map((p, i) => `<div class="ph"><div class="ph-q">${ic('mic', 18)}<b>"${esc(p.say)}"</b></div><div class="ph-v">${(p.variants || []).slice(0, 4).map((v) => `<span class="tag">${esc(v)}</span>`).join('')}<button class="tag add" data-teach="${i}">${ic('plus', 12)} ${T('teach')}</button></div>
      <div class="ph-a"><select data-act="${i}">${ACTIONS.map((a) => `<option value="${a}" ${p.action === a ? 'selected' : ''}>${T('act_' + a)}</option>`).join('')}</select>${p.action === 'call' ? `<select data-who="${i}">${cn(p.who || 0)}</select>` : ''}<button class="x" data-rmp="${i}">${ic('trash', 16)}</button></div></div>`).join('')}</div>
    <div class="add-ph">${inp('pNew', '', 'text', T('pNewPh'))}<select id="pNewAct">${ACTIONS.map((a) => `<option value="${a}">${T('act_' + a)}</option>`).join('')}</select><button class="btn ghost" id="btnAddP">${ic('plus', 18)} ${T('add')}</button></div></div>
    <div class="fld"><label>${ic('pill', 16)} ${T('fMeds')}</label><p class="hint">${T('fMedsH')}</p>
    <div class="meds">${S.meds.map((m, i) => `<div class="md">${ic('pill', 22)}<div><b>${esc(m.name)} · ${esc(m.time)}</b><span>${esc(m.dose)}. ${esc(m.note)}</span></div><button class="x" data-rmm="${i}">${ic('trash', 16)}</button></div>`).join('')}</div>
    <div class="add-md">${inp('mName', '', 'text', T('mName'))}${inp('mTime', '12:00', 'time')}${inp('mDose', '', 'text', T('mDose'))}<button class="btn ghost" id="btnAddM">${ic('plus', 18)} ${T('add')}</button></div></div>
    <div class="fld"><label>${ic('pulse', 16)} ${T('fSensors')}</label><div class="sens">
      <div><span>${T('sFall')}</span><div class="seg wide" id="fallSeg">${[1, 2, 3].map((n) => `<button data-n="${n}" class="${S.sensors.fallSens === n ? 'on' : ''}">${T('sens' + n)}</button>`).join('')}</div></div>
      <div><span>${T('sHrMax')} <b class="val" id="vHrMax">${S.sensors.hrMax}</b></span><input type="range" id="fHrMax" min="100" max="170" step="5" value="${S.sensors.hrMax}"></div>
      <div><span>${T('sHrMin')} <b class="val" id="vHrMin">${S.sensors.hrMin}</b></span><input type="range" id="fHrMin" min="30" max="60" step="1" value="${S.sensors.hrMin}"></div>
      <div><span>${T('sIdle')} <b class="val" id="vIdle">${S.sensors.idleMin} min</b></span><input type="range" id="fIdle" min="5" max="60" step="5" value="${S.sensors.idleMin}"></div></div></div>`;
  }
  function b5() {
    $('#fAsName').oninput = (e) => { S.assistant.name = e.target.value || 'Sprout'; WH.MemoryData.state.prefs.name=S.assistant.name; WH.MemoryData.save(); };
    $$('#voiceSeg button').forEach((b) => (b.onclick = () => { S.assistant.voice = b.dataset.v; WH.say(T('v_sample', { n: S.callName })); Setup.render(); }));
    $$('[data-act]').forEach((s) => (s.onchange = () => { S.phrases[+s.dataset.act].action = s.value; Setup.render(); }));
    $$('[data-who]').forEach((s) => (s.onchange = () => { S.phrases[+s.dataset.who].who = +s.value; }));
    $$('[data-rmp]').forEach((b) => (b.onclick = () => { S.phrases.splice(+b.dataset.rmp, 1); Setup.render(); }));
    $$('[data-teach]').forEach((b) => (b.onclick = () => {
      const p = S.phrases[+b.dataset.teach]; b.innerHTML = '<span class="spin"></span> ' + T('listening');
      setTimeout(() => { p.variants = (p.variants || []).concat(T('myVoice', { k: (p.variants || []).length + 1 })); WH.toast(ic('mic', 18) + ' ' + T('taught', { p: p.say }), 'ok'); Setup.render(); }, 1300);
    }));
    $('#btnAddP').onclick = () => { const v = $('#pNew').value.trim(); if (!v) return WH.toast(T('needPhrase'), 'warn'); S.phrases.push({ id: 'p' + uid++, say: v, variants: [], action: $('#pNewAct').value, who: 0 }); Setup.render(); };
    $$('[data-rmm]').forEach((b) => (b.onclick = () => { S.meds.splice(+b.dataset.rmm, 1); Setup.render(); }));
    $('#btnAddM').onclick = () => { const n = $('#mName').value.trim(); if (!n) return WH.toast(T('needMed'), 'warn'); S.meds.push({ id: 'm' + uid++, name: n, time: $('#mTime').value, dose: $('#mDose').value || '1', note: '', done: false }); Setup.render(); };
    $$('#fallSeg button').forEach((b) => (b.onclick = () => { S.sensors.fallSens = +b.dataset.n; Setup.render(); }));
    [['fHrMax', 'hrMax', 'vHrMax', ''], ['fHrMin', 'hrMin', 'vHrMin', ''], ['fIdle', 'idleMin', 'vIdle', ' min']].forEach(([id, k, v, u]) => { $('#' + id).oninput = (e) => { S.sensors[k] = +e.target.value; $('#' + v).textContent = e.target.value + u; }; });
  }

  /* ── step 6: review + pair device ── */
  function s6() {
    const paired = Setup.pairState === 3;
    return `<h2>${T('s6t')}</h2><p class="lead2">${T('s6d', { n: esc(S.callName) })}</p>
    <div class="review">
      <div class="rv"><i>${ic('user', 20)}</i><div><b>${esc(S.name)}</b><span>${S.age} · ${esc(S.callName)}</span></div></div>
      <div class="rv"><i>${ic('home', 20)}</i><div><b>${esc(S.addr)}</b><span>${S.provider === 'amap' ? 'Amap' : S.provider === 'google' ? 'Google Maps' : 'Apple Maps'} · ${S.landmarks.length} ${T('landmarks')}</span></div></div>
      <div class="rv"><i>${ic('shield', 20)}</i><div><b>${S.radiusKm.toFixed(1)} km · ${S.graceMin} min</b><span>${S.curfewOn ? T('curfewSum', { t: S.curfewFrom, r: S.curfewKm }) : T('noCurfew')}</span></div></div>
      <div class="rv"><i>${ic('users', 20)}</i><div><b>${S.contacts.map((c) => esc(c.name)).join(', ')}</b><span>${S.contacts.filter((c) => c.paired).length}/${S.contacts.length} ${T('phonesPaired')}</span></div></div>
      <div class="rv"><i>${ic('mic', 20)}</i><div><b>${S.phrases.length} ${T('phrases')} · ${S.meds.length} ${T('medsN')}</b><span>${esc(S.assistant.name)}</span></div></div>
    </div>
    <div class="pairbox"><div class="pb-3d" id="pb3d"></div>
      <div class="pb-ctl"><h4>${ic('watch', 18)} ${T('pairBand')}</h4>
      <div class="pb-state" id="pbState">${paired ? `<span class="paired">${ic('check', 18)} ${T('bandReady')}</span>` : Setup.pairState === 1 ? `<span class="spin"></span> ${T('searching')}` : Setup.pairState === 2 ? `<span class="spin"></span> ${T('connectingBand')}` : T('pbIdle')}</div>
      ${paired ? '' : `<button class="btn primary" id="btnPair">${ic('link', 18)} ${T('pairBtn')}</button>`}</div></div>`;
  }
  function b6() {
    if (!Setup.watchCv) { Setup.watchCv = document.createElement('canvas'); Setup.watch = new WH.Watch3D(Setup.watchCv); }
    $('#pb3d').appendChild(Setup.watchCv); Setup.watch._resize();
    const b = $('#btnPair');
    if (b) b.onclick = () => {
      Setup.pairState = 1; Setup.render();
      setTimeout(() => { Setup.pairState = 2; Setup.render(); setTimeout(() => { Setup.pairState = 3; WH.beep('ok'); WH.toast(ic('check', 18) + ' ' + T('bandReady'), 'ok'); Setup.render(); }, 1300); }, 1500);
    };
  }

  const VIEWS = [null, [s1, b1], [s2, b2], [s3, b3], [s4, b4], [s5, b5], [s6, b6]];

  function foot() {
    const m = $('#setupMapFoot');
    m.innerHTML = Setup.step === 2 ? `${ic('pin', 16)} ${T('mapFoot2')}` : Setup.step === 3 ? `${ic('shield', 16)} ${T('mapFoot3', { r: S.radiusKm.toFixed(1) })}` : `${ic('home', 16)} ${T('mapFoot1')}`;
  }

  Setup.render = function () {
    renderStepper();
    const v = VIEWS[Setup.step];
    $('#setupPanel').innerHTML = `<div class="step-in">${v[0]()}</div>`;
    v[1]();
    $('#setupBack').style.visibility = Setup.step === 1 ? 'hidden' : 'visible';
    const nx = $('#setupNext'); nx.innerHTML = Setup.step === Setup.max ? `${ic('check', 18)}<span>${T('finish')}</span>` : `<span>${T('next')}</span>${ic('right', 18)}`;
    $('#setupMapTitle').textContent = T(['', 'mt1', 'mt2', 'mt3', 'mt1', 'mt1', 'mt1'][Setup.step]);
    $('#setupMapBadge').innerHTML = Setup.step === 2 ? `${ic('pin', 14)} ${T('pickOn')}` : `${ic('map', 14)} 3D`;
    foot();
    const w = WH.wSetup;
    w.setPick(Setup.step === 2, onPick);
    S.showZone = true;
    if (Setup.step === 3) zoneCam(); else if (Setup.step === 2) w.setCam({ tx: WH.HOME_POS.x + 8, tz: WH.HOME_POS.z - 6, dist: 50, pol: 0.95 }); else w.setCam({ tx: WH.HOME_POS.x, tz: WH.HOME_POS.z, dist: 46, pol: 1.0 });
    paintIcons(document);
    WH.applyI18n && WH.applyI18n($('#scr-setup'));
    $('#setupPanel').scrollTop = 0;
  };

  /* landmark editor */
  function onPick(info) {
    if(Setup.lmPhoto?.startsWith('blob:'))URL.revokeObjectURL(Setup.lmPhoto);Setup.pendingLm = info; Setup.lmPhoto = null;Setup.lmFile=null;$('#lmFile').value=''; Setup.lmType = 'market';
    $('#lmName').value = ''; renderTypes(); preview(); $('#mdLandmark').classList.add('on'); setTimeout(() => $('#lmName').focus(), 80);
  }
  const TYPE_LABEL = { market: 'lt_market', pagoda: 'lt_pagoda', parkgate: 'lt_park', pharmacy: 'lt_pharm', bakery: 'lt_bakery', busstop: 'lt_bus', school: 'lt_school' };
  function renderTypes() {
    $('#lmTypes').innerHTML = window.LM_TYPES.map((t) => `<button class="lt ${Setup.lmType === t ? 'on' : ''}" data-t="${t}"><img src="${landmarkArt(t, '')}" alt=""><span>${T(TYPE_LABEL[t])}</span></button>`).join('');
    $$('#lmTypes .lt').forEach((b) => (b.onclick = () => { Setup.lmType = b.dataset.t; if (!$('#lmName').value) $('#lmName').placeholder = T(TYPE_LABEL[b.dataset.t]); renderTypes(); preview(); }));
  }
  function preview() { $('#lmPrev').src = Setup.lmPhoto || landmarkArt(Setup.lmType, $('#lmName').value || T(TYPE_LABEL[Setup.lmType])); }
  function bindModal() {
    $('#lmName').oninput = () => { if (!Setup.lmPhoto) preview(); };
    $('#lmFile').onchange = (e) => { const f = e.target.files[0]; if (!f) return; if(!/^image\/(jpeg|png|webp|gif)$/.test(f.type)||f.size>5*1024*1024)return WH.toast(T('mgFileError'),'warn');if(Setup.lmPhoto?.startsWith('blob:'))URL.revokeObjectURL(Setup.lmPhoto);Setup.lmFile=f;Setup.lmPhoto=URL.createObjectURL(f);preview(); };
    $('#lmCancel').onclick = () => $('#mdLandmark').classList.remove('on');
    $('#lmSave').onclick = async () => {
      const i = Setup.pendingLm; if (!i) return;
      const name = $('#lmName').value.trim() || T(TYPE_LABEL[Setup.lmType]);
      let photoId=null;try{if(Setup.lmFile)photoId=await WH.MemoryData.putMedia(Setup.lmFile,'image');}catch(err){WH.toast(T('mgFileError'),'warn');return;}
      WH.MemoryData.upsert('places',{ type: Setup.lmType, name, i: i.i, j: i.j, sx: i.sx, sz: i.sz, photoId, memoryApproved:false, navigationApproved:false });
      $('#mdLandmark').classList.remove('on');
      WH.worlds.forEach((w) => w.rebuildLandmarks());
      WH.toast(ic('pin', 18) + ' ' + T('lmAdded', { n: name }), 'ok'); Setup.render();
    };
  }

  Setup.bind = function () {
    bindModal();
    $('#setupBack').onclick = () => { if (Setup.step > 1) { Setup.step--; Setup.render(); } };
    $('#setupNext').onclick = () => {
      if (Setup.step < Setup.max) { Setup.step++; Setup.render(); return; }
      WH.toast(ic('check', 18) + ' ' + T('handover', { n: S.callName }), 'ok', 4200);
      S.shortName = S.callName; WH.Sim.reset(); S.view = 'both'; WH.enterStage('both');
    };
  };
})();
