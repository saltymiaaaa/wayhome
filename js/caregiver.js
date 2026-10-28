/* Caregiver phone app: Overview / Contacts / Safety / Landmarks / Memories / Activity.
   Edits write to the shared state (S) and the local memory library (MemoryData);
   the escalation ladder, SOS order and 3D landmark worlds read the same records. */
(function () {
  const WH = window.WH, S = WH.S, D = WH.MemoryData, $ = WH.$, $$ = WH.$$, E = WH.esc, T = WH.t;
  const C = (WH.Caregiver = { tab: 'overview', editC: null, editLm: null, addingLm: false, lmType: 'market' });
  let uid = 900;

  const TABS = [
    ['overview', 'home', 'cgOver'],
    ['contacts', 'users', 'cgContacts'],
    ['safety', 'shield', 'cgSafety'],
    ['landmarks', 'pin', 'cgLandmarks'],
    ['memories', 'image', 'cgMemories'],
    ['activity', 'chart', 'activity']
  ];

  C.buildTabs = function () {
    $('#pTabs').innerHTML = TABS.map(([id, icn, k]) =>
      `<button class="ptb${C.tab === id ? ' on' : ''}" data-tab="${id}">${ic(icn, 20)}<span>${E(T(k))}</span></button>`).join('');
    $$('#pTabs .ptb').forEach((b) => (b.onclick = () => C.show(b.dataset.tab)));
  };

  C.init = function () {
    C.buildTabs();
    $('#cgClearFeed').onclick = () => { $('#pFeed').innerHTML = ''; WH.toast(ic('trash', 16) + ' ' + T('cgFeedCleared'), 'ok', 2200); };
    C.show('overview');
  };

  C.show = function (tab) {
    C.tab = tab;
    $$('#pscreen .ptab').forEach((p) => p.classList.toggle('on', p.dataset.pane === tab));
    $$('#pTabs .ptb').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    C.render();
    const pane = $('#pscreen .ptab.on');
    if (pane) pane.scrollTop = 0;
  };

  C.render = function () {
    if (C.tab === 'contacts') C.contacts();
    else if (C.tab === 'safety') C.safety();
    else if (C.tab === 'landmarks') C.landmarks();
    else if (C.tab === 'memories') C.memories();
    else if (C.tab === 'activity') C.activity();
  };

  const head = (title, count, extra) =>
    `<div class="cg-head"><h3>${title}</h3><span class="cg-head-r">${count != null ? `<span class="cg-count">${count}</span>` : ''}${extra || ''}</span></div>`;

  /* ───────────── contacts ───────────── */
  const phoneOk = (p) => /^\+?\d{7,15}$/.test(String(p || '').replace(/[\s().-]/g, ''));

  C.contacts = function () {
    const box = $('#cgContacts');
    if (C.editC != null) {
      const c = S.contacts[C.editC];
      if (!c) { C.editC = null; return C.contacts(); }
      box.innerHTML = head(ic('users', 18) + ' ' + T('cgEditContact')) + `
        <div class="cg-form">
          <label>${T('cName')}</label><input id="ceName" maxlength="30" value="${E(c.name)}">
          <label>${T('cRel')}</label><input id="ceRel" maxlength="30" value="${E(c.rel)}">
          <label>${T('cPhone')}</label><input id="cePhone" type="tel" value="${E(c.phone)}">
          <small class="cg-hint">${T('cgPhoneHint')}</small>
          <p class="cg-err" id="ceErr" role="alert"></p>
          <div class="cg-btnrow"><button class="btn primary sm" id="ceSave">${ic('check', 15)} ${T('mgSave')}</button><button class="btn ghost sm" id="ceX">${T('cancel')}</button></div>
        </div>`;
      $('#ceSave').onclick = () => {
        const name = $('#ceName').value.trim(), phone = $('#cePhone').value.trim();
        if (!name || !phone) return err('#ceErr', T('needNamePhone'));
        if (!phoneOk(phone)) return err('#ceErr', T('cgPhoneInvalid'));
        Object.assign(c, { name, rel: $('#ceRel').value.trim() || T('family'), phone });
        C.editC = null; C.contacts(); WH.refresh(); WH.toast(ic('check', 16) + ' ' + T('cgSaved'), 'ok', 2200);
      };
      $('#ceX').onclick = () => { C.editC = null; C.contacts(); };
      return;
    }
    const rows = S.contacts.map((c, i) => `
      <div class="cg-card">
        <div class="ava sm">${E(c.name.slice(0, 1))}</div>
        <div class="cg-t"><b>${E(c.name)} <em>${E(c.rel)}</em></b><span>${E(c.phone)}</span>
          <div class="ct-ch"><span class="tag dark">${E(ordLabel(i))}</span>${c.paired
            ? `<span class="tag okc">${ic('link', 12)} ${T('paired')}</span>`
            : `<button class="tag add" data-pair="${i}">${ic('qr', 12)} ${T('pairPhone')}</button>`}</div></div>
        <div class="cg-ord">
          <button data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="${T('cgMoveUp')}">↑</button>
          <button data-down="${i}" ${i === S.contacts.length - 1 ? 'disabled' : ''} aria-label="${T('cgMoveDown')}">↓</button>
        </div>
        <div class="cg-actions">
          <button class="cgb" data-edit="${i}" aria-label="${T('mgEdit')}">${ic('settings', 14)}</button>
          <button class="cgb red" data-rmc="${i}" aria-label="${T('mgDelete')}">${ic('trash', 14)}</button>
        </div>
      </div>`).join('');
    box.innerHTML = head(ic('users', 18) + ' ' + T('cgContacts'), S.contacts.length) + `<div class="cg-list">${rows}</div>
      <div class="cg-form">
        <h4>${ic('plus', 15)} ${T('addContact')}</h4>
        <div class="cg-row2"><div><label>${T('cName')}</label><input id="ccName" maxlength="30"></div><div><label>${T('cRel')}</label><input id="ccRel" maxlength="30"></div></div>
        <label>${T('cPhone')}</label><input id="ccPhone" type="tel">
        <small class="cg-hint">${T('cgPhoneHint')}</small>
        <p class="cg-err" id="ccErr" role="alert"></p>
        <div class="cg-btnrow"><button class="btn primary sm" id="ccAdd">${ic('plus', 15)} ${T('add')}</button></div>
      </div>`;
    $('#ccAdd').onclick = () => {
      const name = $('#ccName').value.trim(), phone = $('#ccPhone').value.trim();
      if (!name || !phone) return err('#ccErr', T('needNamePhone'));
      if (!phoneOk(phone)) return err('#ccErr', T('cgPhoneInvalid'));
      S.contacts.push({ id: 'c' + uid++, name, rel: $('#ccRel').value.trim() || T('family'), phone, paired: false });
      C.contacts(); WH.refresh(); WH.toast(ic('users', 16) + ' ' + T('cgContactAdded', { n: name }), 'ok', 2600);
    };
    $$('[data-edit]', box).forEach((b) => (b.onclick = () => { C.editC = +b.dataset.edit; C.contacts(); }));
    $$('[data-rmc]', box).forEach((b) => (b.onclick = () => {
      if (S.contacts.length < 2) return WH.toast(T('needOne'), 'warn');
      S.contacts.splice(+b.dataset.rmc, 1);
      S.esc.forEach((e) => { if (e.who >= S.contacts.length) e.who = 0; });
      C.contacts(); WH.refresh(); WH.toast(ic('trash', 16) + ' ' + T('cgDeleted'), 'ok', 2200);
    }));
    $$('[data-pair]', box).forEach((b) => (b.onclick = () => {
      const c = S.contacts[+b.dataset.pair]; c.paired = true;
      C.contacts(); WH.toast(ic('link', 16) + ' ' + T('pairedToast', { n: c.name }), 'ok');
    }));
    $$('[data-up]', box).forEach((b) => (b.onclick = () => moveContact(+b.dataset.up, -1)));
    $$('[data-down]', box).forEach((b) => (b.onclick = () => moveContact(+b.dataset.down, 1)));
  };

  function err(sel, msg) { const el = $(sel); if (el) el.textContent = msg; }
  function ordLabel(i) {
    if (S.esc[0].who === i) return T('cgFirst');
    if (S.esc[1].who === i) return T('cgSecond');
    return T('cgNotOnLadder');
  }
  function moveContact(i, d) {
    const j = i + d;
    if (j < 0 || j >= S.contacts.length) return;
    const before = S.esc.map((e) => (e.who >= 0 && S.contacts[e.who] ? S.contacts[e.who].id : null));
    const tmp = S.contacts[i]; S.contacts[i] = S.contacts[j]; S.contacts[j] = tmp;
    S.esc.forEach((e, k) => {
      if (before[k] == null) return;
      const ni = S.contacts.findIndex((c) => c.id === before[k]);
      e.who = ni < 0 ? 0 : ni;
    });
    C.contacts(); WH.Sim.renderLadder(); WH.refresh();
  }

  /* ───────────── safety ───────────── */
  C.safety = function () {
    const box = $('#cgSafety'), e = S.esc;
    const cn = (sel) => S.contacts.map((c, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${E(c.name)} (${E(c.rel)})</option>`).join('');
    box.innerHTML = `
      <div class="cg-sec">
        <h4>${ic('shield', 15)} ${T('cgZone')}</h4>
        <label>${T('fRadius')} <b class="val" id="csRad">${S.radiusKm.toFixed(1)} km</b></label>
        <input type="range" id="csRadR" min="0.2" max="1.1" step="0.1" value="${S.radiusKm}">
        <label>${T('fGrace')} <b class="val" id="csGrace">${S.graceMin} min</b></label>
        <input type="range" id="csGraceR" min="10" max="60" step="5" value="${S.graceMin}">
      </div>
      <div class="cg-sec">
        <h4>${ic('moon', 15)} ${T('fCurfew')}</h4>
        <div class="cg-curfew"><button class="switch ${S.curfewOn ? 'on' : ''}" id="csCurfew"><i></i></button><span>${T('curfewT')}</span></div>
        <div class="cg-row3"><label>${T('after')}</label><input type="time" id="csCfFrom" value="${S.curfewFrom}"><label>${T('radius')} <b class="val" id="csCfV">${S.curfewKm.toFixed(2)} km</b></label></div>
        <input type="range" id="csCfR" min="0.1" max="0.6" step="0.05" value="${S.curfewKm}">
      </div>
      <div class="cg-sec">
        <h4>${ic('ladder', 15)} ${T('fLadder')}</h4>
        <div class="cg-lr"><i>1</i><div><b>${T('ls1')}</b><span>${T('ladE1')}</span></div><em>${T('now')}</em></div>
        <div class="cg-lr"><i>2</i><div><b>${T('ladE2')}</b><span><select id="csW0">${cn(e[0].who)}</select> · ${T('viaPush')}</span></div><em><input type="number" id="csM0" min="1" max="30" value="${e[0].min}"> min</em></div>
        <div class="cg-lr"><i>3</i><div><b>${T('ladE3')}</b><span><select id="csW1">${cn(e[1].who)}</select> · ${T('viaSmsCall')}</span></div><em><input type="number" id="csM1" min="2" max="45" value="${e[1].min}"> min</em></div>
        <div class="cg-lr"><i>4</i><div><b>${T('ladE4')}</b><span>${T('ladE4d')}</span></div><em>${S.graceMin} min</em></div>
      </div>`;
    $('#csRadR').oninput = (ev) => { S.radiusKm = +ev.target.value; $('#csRad').textContent = S.radiusKm.toFixed(1) + ' km'; WH.refresh(); };
    $('#csGraceR').oninput = (ev) => { S.graceMin = +ev.target.value; S.esc[2].min = S.graceMin; $('#csGrace').textContent = S.graceMin + ' min'; WH.Sim.renderLadder(); };
    $('#csCurfew').onclick = () => { S.curfewOn = !S.curfewOn; C.safety(); WH.refresh(); };
    $('#csCfFrom').oninput = (ev) => { S.curfewFrom = ev.target.value; };
    $('#csCfR').oninput = (ev) => { S.curfewKm = +ev.target.value; $('#csCfV').textContent = S.curfewKm.toFixed(2) + ' km'; WH.refresh(); };
    ['0', '1'].forEach((k) => {
      $('#csW' + k).onchange = (ev) => { S.esc[+k].who = +ev.target.value; WH.Sim.renderLadder(); WH.refresh(); };
      $('#csM' + k).oninput = (ev) => { S.esc[+k].min = +ev.target.value || 1; WH.Sim.renderLadder(); };
    });
  };

  /* ───────────── landmarks ───────────── */
  const LM_LABEL = { market: 'lt_market', pagoda: 'lt_pagoda', parkgate: 'lt_park', pharmacy: 'lt_pharm', bakery: 'lt_bakery', busstop: 'lt_bus', school: 'lt_school' };
  const placeRec = (id) => D.state.places.find((p) => p.id === id) || null;

  C.landmarks = function () {
    const box = $('#cgLandmarks');
    if (C.editLm) return C.lmForm(box, placeRec(C.editLm));
    if (C.addingLm) return C.lmForm(box, null);
    const rows = S.landmarks.map((l) => {
      const rec = placeRec(l.id) || {};
      const mem = rec.memoryApproved === true, nav = rec.navigationApproved === true;
      return `<div class="cg-card">
        <img class="cg-lmimg" src="${l.photo || landmarkArt(l.type, l.name)}" alt="">
        <div class="cg-t"><b>${E(l.name)}</b><span>${E(WH.STREETS_V[l.i])}</span>
          <div class="ct-ch">
            <button class="tag ${mem ? 'okc' : 'dark'}" data-mem="${E(l.id)}" title="${T('mgApproval')}">${T('cgMem')} ${mem ? '✓' : '✗'}</button>
            <button class="tag ${nav ? 'okc' : 'dark'}" data-nav="${E(l.id)}" title="${T('mgNavApproval')}">${T('cgNav')} ${nav ? '✓' : '✗'}</button>
          </div></div>
        <div class="cg-actions">
          <button class="cgb" data-edit="${E(l.id)}" aria-label="${T('mgEdit')}">${ic('settings', 14)}</button>
          <button class="cgb red" data-rml="${E(l.id)}" aria-label="${T('mgDelete')}">${ic('trash', 14)}</button>
        </div></div>`;
    }).join('');
    box.innerHTML = head(ic('pin', 18) + ' ' + T('cgLandmarks'), S.landmarks.length,
      `<button class="cgb accent" id="cLmAdd" aria-label="${T('cgAddLm')}">${ic('plus', 15)}</button>`) + `<div class="cg-list">${rows}</div>`;
    $('#cLmAdd').onclick = () => { C.addingLm = true; C.lmType = 'market'; C.landmarks(); };
    $$('[data-mem]', box).forEach((b) => (b.onclick = () => { togglePlace(b.dataset.mem, 'memoryApproved'); }));
    $$('[data-nav]', box).forEach((b) => (b.onclick = () => { togglePlace(b.dataset.nav, 'navigationApproved'); }));
    $$('[data-edit]', box).forEach((b) => (b.onclick = () => { C.editLm = b.dataset.edit; C.landmarks(); }));
    $$('[data-rml]', box).forEach((b) => (b.onclick = () => { D.remove('places', b.dataset.rml); C.landmarks(); WH.toast(ic('trash', 16) + ' ' + T('cgDeleted'), 'ok', 2200); }));
  };

  function togglePlace(id, key) {
    const old = placeRec(id); if (!old) return;
    D.upsert('places', { ...old, id, [key]: !old[key] });
    C.landmarks(); WH.toast(ic(key === 'navigationApproved' ? 'nav' : 'image', 16) + ' ' + T('cgSaved'), 'ok', 2000);
  }

  C.lmForm = function (box, rec) {
    const types = window.LM_TYPES || Object.keys(LM_LABEL);
    const i = rec ? rec.i : 6, j = rec ? rec.j : 6;
    box.innerHTML = head(ic('pin', 18) + ' ' + (rec ? T('cgEditLm') : T('cgAddLm'))) + `
      <div class="cg-form">
        ${rec ? '' : `<label>${T('fLms')}</label><div class="cg-types">${types.map((t) => `<button class="lt ${C.lmType === t ? 'on' : ''}" data-t="${t}"><img src="${landmarkArt(t, '')}" alt=""><span>${E(T(LM_LABEL[t]))}</span></button>`).join('')}</div>`}
        <label>${T('lmName')}</label><input id="cLmName" maxlength="40" value="${E(rec ? D.text(rec) : '')}">
        <div class="cg-row2"><div><label>i (0–12)</label><input id="cLmI" type="number" min="0" max="12" step="1" value="${i ?? 6}"></div><div><label>j (0–12)</label><input id="cLmJ" type="number" min="0" max="12" step="1" value="${j ?? 6}"></div></div>
        <p class="cg-err" id="cLmErr" role="alert"></p>
        <div class="cg-btnrow"><button class="btn primary sm" id="cLmSave">${ic('check', 15)} ${T('mgSave')}</button><button class="btn ghost sm" id="cLmX">${T('cancel')}</button></div>
      </div>`;
    $$('.cg-types .lt', box).forEach((b) => (b.onclick = () => { C.lmType = b.dataset.t; $$('.cg-types .lt', box).forEach((x) => x.classList.toggle('on', x === b)); }));
    $('#cLmX').onclick = () => { C.editLm = null; C.addingLm = false; C.landmarks(); };
    $('#cLmSave').onclick = () => {
      const name = $('#cLmName').value.trim() || (rec ? D.text(rec) : T(LM_LABEL[C.lmType]));
      const gi = Number($('#cLmI').value), gj = Number($('#cLmJ').value);
      const pos = { i: gi, j: gj };
      if (!D.hasPosition(pos)) return err('#cLmErr', T('cgInvalidPos'));
      if (rec) {
        D.upsert('places', { ...rec, name, nameKey: null, i: gi, j: gj, waypoint: rec.waypoint && rec.waypoint.i === gi && rec.waypoint.j === gj ? rec.waypoint : null });
      } else {
        D.upsert('places', { type: C.lmType, name, i: gi, j: gj, sx: 1, sz: -1, memoryApproved: false, navigationApproved: false });
      }
      C.editLm = null; C.addingLm = false;
      C.landmarks(); WH.toast(ic('pin', 16) + ' ' + (rec ? T('cgSaved') : T('lmAdded', { n: name })), 'ok', 2400);
    };
  };

  /* ───────────── memories ───────────── */
  C.memories = function () {
    const box = $('#cgMemories');
    const kinds = [['people', 'mgPeople'], ['places', 'mgPlaces'], ['music', 'mgMusic'], ['routines', 'mgRoutines'], ['journeys', 'mgJourney']];
    const approved = (k) => D.state[k].filter((p) => (k === 'places' ? p.memoryApproved : p.approved) === true).length;
    const rows = kinds.map(([k, label]) => `
      <button class="cg-card linky" data-kind="${k}">
        <div class="cg-ico">${ic(k === 'people' ? 'users' : k === 'places' ? 'pin' : k === 'music' ? 'volume' : k === 'routines' ? 'check' : 'route', 18)}</div>
        <div class="cg-t"><b>${T(label)}</b><span>${approved(k)} / ${D.state[k].length} ${T('mgApproved')}</span></div>
        <span class="cg-go">${ic('right', 16)}</span>
      </button>`).join('');
    const last = D.state.lastActivity ? T((WH.Memory.labels || {})[D.state.lastActivity] || D.state.lastActivity) : T('cgNever');
    box.innerHTML = head(ic('image', 18) + ' ' + T('cgMemories')) + `<div class="cg-list">${rows}</div>
      <div class="cg-sec">
        <div class="cg-fact"><span>${T('mgGarden')}</span><b>${D.state.garden.length} ${T('cgGrowing')}</b></div>
        <div class="cg-fact"><span>${T('cgLastAct')}</span><b>${E(last)}</b></div>
        ${!D.persistent || D.mediaUnavailable ? `<p class="cg-warn">${T('mgStorage')}</p>` : ''}
        <div class="cg-btnrow">
          <button class="btn primary sm" id="cgOpenLib">${ic('image', 15)} ${T('mgLibrary')}</button>
          <button class="btn ghost sm" id="cgOpenGarden">✿ ${T('mgGarden')}</button>
        </div>
      </div>`;
    $$('[data-kind]', box).forEach((b) => (b.onclick = () => { WH.MemoryLibrary.kind = b.dataset.kind; WH.MemoryLibrary.open(); }));
    $('#cgOpenLib').onclick = () => WH.MemoryLibrary.open();
    $('#cgOpenGarden').onclick = () => { if (!WH.Memory.open()) return; };
  };

  /* ───────────── activity ───────────── */
  C.activity = function () {
    const box = $('#cgHistory');
    const evs = (D.state.events || []).slice(-14).reverse();
    box.innerHTML = head(ic('chart', 16) + ' ' + T('cgHistory')) + (evs.length
      ? evs.map((ev) => `<div class="cg-ev"><b>${E(String(ev.type).replace(/-/g, ' '))}</b><span>${E(ev.detail || '')}</span><time>${E(String(ev.at).slice(11, 16))}</time></div>`).join('')
      : `<p class="cg-none">${T('ib_empty')}</p>`);
  };
})();
