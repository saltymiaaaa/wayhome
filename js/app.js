/* WayHome core: state, helpers, wearable UI, family phone UI. */
(function () {
  const WH = (window.WH = window.WH || {});
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  Object.assign(WH, { $, $$, esc });
  const T = (k, v) => WH.t(k, v);

  /* ───────────── state ───────────── */
  const S = (WH.S = {
    lang: 'en', voiceOn: true,
    name: 'Li Xiuying', callName: 'Grandma Li', shortName: 'Grandma Li', age: 78,
    notes: 'Early-stage Alzheimer. Walks every morning. Sometimes mixes up streets near the market.',
    device: 'watch', addr: '24 Fuhua Road, Futian District, Shenzhen', provider: 'amap',
    providers: { google: false, amap: false, apple: false },
    radiusKm: 0.6, graceMin: 30, curfewOn: true, curfewKm: 0.25, curfewFrom: '20:00',
    esc: [
      { lvl: 2, min: 5, who: 0, how: ['push'] },
      { lvl: 3, min: 15, who: 1, how: ['sms', 'call'] },
      { lvl: 4, min: 30, who: -1, how: ['emergency'] }
    ],
    contacts: [
      { id: 'c0', name: 'Wei', rel: 'Son', phone: '+86 138 0013 8000', paired: true },
      { id: 'c1', name: 'Mei', rel: 'Daughter', phone: '+86 139 0013 9000', paired: false }
    ],
    landmarks: [
      { id: 'l1', type: 'pagoda', name: 'Hongfa Temple', i: 8, j: 2, sx: 1, sz: 1 },
      { id: 'l2', type: 'parkgate', name: 'Lianhuashan Park Gate', i: 8, j: 4, sx: -1, sz: 1 },
      { id: 'l3', type: 'market', name: 'Futian Market', i: 6, j: 4, sx: 1, sz: -1 },
      { id: 'l4', type: 'pharmacy', name: 'Green Cross Pharmacy', i: 6, j: 6, sx: 1, sz: -1 },
      { id: 'l5', type: 'bakery', name: 'Corner Bakery', i: 7, j: 6, sx: 1, sz: 1 },
      { id: 'l6', type: 'busstop', name: 'Bus Stop 24', i: 7, j: 8, sx: -1, sz: -1 },
      { id: 'l7', type: 'school', name: 'Primary School', i: 5, j: 4, sx: 1, sz: 1 },
      { id: 'l8', type: 'bakery', name: 'Red Lantern Café', i: 3, j: 6, sx: 1, sz: -1 },
      { id: 'l9', type: 'busstop', name: 'Community Bus Shelter', i: 5, j: 9, sx: -1, sz: 1 },
      { id: 'l10', type: 'pharmacy', name: 'Harmony Pharmacy', i: 10, j: 6, sx: -1, sz: -1 },
      { id: 'l11', type: 'parkgate', name: 'Banyan Garden Gate', i: 5, j: 2, sx: 1, sz: 1 },
      { id: 'l12', type: 'market', name: 'Fruit Stall Corner', i: 3, j: 4, sx: -1, sz: 1 },
      { id: 'l13', type: 'school', name: 'Community Learning Centre', i: 8, j: 6, sx: 1, sz: 1 },
      { id: 'l14', type: 'pagoda', name: 'Riverside Pavilion', i: 5, j: 8, sx: 1, sz: -1 },
      { id: 'l15', type: 'market', name: 'Blue Awning Vegetable Stall', i: 2, j: 2, sx: 1, sz: 1, guidanceCue: 'the vegetable stall with the blue awning', recognitionCue: 'Look for stacked green baskets beneath a bright blue awning.', visibility: 'day', salience: 5 },
      { id: 'l16', type: 'pharmacy', name: 'Sunrise Pharmacy', i: 2, j: 5, sx: -1, sz: 1, guidanceCue: 'the pharmacy with the large green cross', recognitionCue: 'Look for a large illuminated green cross above the door.', visibility: 'day-night', salience: 5 },
      { id: 'l17', type: 'bakery', name: 'Golden Bun Bakery', i: 2, j: 8, sx: 1, sz: -1, guidanceCue: 'the bakery with the yellow sign', recognitionCue: 'Look for the yellow bun-shaped sign and striped window.', visibility: 'day', salience: 4 },
      { id: 'l18', type: 'busstop', name: 'Lotus Road Bus Shelter', i: 2, j: 10, sx: -1, sz: -1, guidanceCue: 'the glass bus shelter with the red bench', recognitionCue: 'Look for a glass shelter and one long red bench.', visibility: 'day-night', salience: 4 },
      { id: 'l19', type: 'school', name: 'Rainbow Kindergarten Gate', i: 4, j: 3, sx: 1, sz: 1, guidanceCue: 'the gate painted like a rainbow', recognitionCue: 'Look for the low gate with seven colored arches.', visibility: 'day', salience: 5 },
      { id: 'l20', type: 'parkgate', name: 'Twin Lion Park Gate', i: 4, j: 7, sx: -1, sz: 1, guidanceCue: 'the park gate with two stone lions', recognitionCue: 'Look for one stone lion on each side of the green gate.', visibility: 'day', salience: 5 },
      { id: 'l21', type: 'pagoda', name: 'Three Lantern Pavilion', i: 4, j: 11, sx: 1, sz: -1, guidanceCue: 'the pavilion with three red lanterns', recognitionCue: 'Look for three red lanterns hanging in one row.', visibility: 'day-night', salience: 5 },
      { id: 'l22', type: 'market', name: 'Flower Cart Corner', i: 6, j: 1, sx: -1, sz: 1, guidanceCue: 'the flower cart with pink umbrellas', recognitionCue: 'Look for buckets of flowers under two pink umbrellas.', visibility: 'day', salience: 4 },
      { id: 'l23', type: 'busstop', name: 'Hospital Bus Stop', i: 6, j: 10, sx: 1, sz: -1, guidanceCue: 'the bus stop with the blue hospital sign', recognitionCue: 'Look for a blue H sign beside the covered seat.', visibility: 'day-night', salience: 4 },
      { id: 'l24', type: 'bakery', name: 'Moon Cake Shop', i: 8, j: 9, sx: -1, sz: 1, guidanceCue: 'the shop with the round moon sign', recognitionCue: 'Look for a large round gold sign above the window.', visibility: 'day-night', salience: 5 },
      { id: 'l25', type: 'pharmacy', name: 'Corner Medical Shop', i: 9, j: 3, sx: 1, sz: -1, guidanceCue: 'the white shop with the green cross', recognitionCue: 'Look for the white storefront and green cross at the corner.', visibility: 'day-night', salience: 4 },
      { id: 'l26', type: 'school', name: 'Red Clock School', i: 10, j: 2, sx: -1, sz: 1, guidanceCue: 'the school with the red clock', recognitionCue: 'Look for the square red clock above the main gate.', visibility: 'day', salience: 5 },
      { id: 'l27', type: 'parkgate', name: 'Bamboo Walk Entrance', i: 10, j: 8, sx: 1, sz: 1, guidanceCue: 'the entrance between two tall bamboo signs', recognitionCue: 'Look for two tall green bamboo signs beside the path.', visibility: 'day', salience: 4 },
      { id: 'l28', type: 'pagoda', name: 'East Lake Lantern Arch', i: 11, j: 5, sx: -1, sz: -1, guidanceCue: 'the red arch with hanging lanterns', recognitionCue: 'Look for the red arch and four hanging lanterns.', visibility: 'day-night', salience: 5 }
    ],
    phrases: [
      { id: 'p1', say: 'I fell', variants: ['i have fallen', 'wo shuai dao le', '我摔倒了', 'nga roi'], action: 'fall', who: 0 },
      { id: 'p2', say: 'Help me', variants: ['jiu ming', '救命', 'tolong', 'cuu toi'], action: 'sos', who: 0 },
      { id: 'p3', say: 'I am lost', variants: ["i'm lost", 'wo mi lu le', '我迷路了', 'lac roi'], action: 'lost', who: 0 },
      { id: 'p4', say: 'I forgot my medicine', variants: ['forgot medicine', 'did i take', '我忘了吃药', 'quen uong thuoc'], action: 'meds', who: 0 },
      { id: 'p5', say: 'Call Wei', variants: ['call my son', '打电话给小伟', 'goi minh'], action: 'call', who: 0 }
    ],
    meds: [
      { id: 'm1', name: 'Amlodipine', time: '08:00', dose: '1 white pill', note: 'With breakfast', done: true },
      { id: 'm2', name: 'Donepezil', time: '14:00', dose: '1 small blue pill', note: 'Second slot of the pill box, with water', done: false }
    ],
    assistant: { name: 'Sprout', voice: 'warm' },
    sensors: { fallSens: 2, hrMax: 130, hrMin: 42, idleMin: 20 },
    // runtime
    pos: { x: WH.DOOR.x, z: WH.DOOR.z }, heading: 0, moving: false, out: false, night: false, showZone: true,
    hr: 72, hrBase: 72, batt: 84, gpsLost: false, removed: false, trail: [], clockOffset: 0,
    view: 'both', screen: 'landing', guiding: false, sosActive: false, inCall: false, askCount: {}, done: false
  });

  /* ───────────── small utils ───────────── */
  WH.nowStr = function () {
    const d = new Date(Date.now() + S.clockOffset * 60000);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };
  WH.hour = () => new Date(Date.now() + S.clockOffset * 60000).getHours();
  WH.distHomeKm = () => Math.hypot(S.pos.x - WH.HOME_POS.x, S.pos.z - WH.HOME_POS.z) / WH.CITY.KM;
  WH.effRadiusKm = () => (S.night && S.curfewOn ? S.curfewKm : S.radiusKm);
  WH.isOutside = () => WH.distHomeKm() > WH.effRadiusKm();
  WH.contact = (idx) => (idx >= 0 ? S.contacts[idx] : null) || S.contacts[0];

  WH.go = function (name) {
    S.screen = name;
    document.body.dataset.screen = name;
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 'scr-' + name));
    window.scrollTo(0, 0);
    WH.fit && setTimeout(WH.fit, 30);
    WH.onScreen && WH.onScreen(name);
  };

  WH.toast = function (msg, kind, ms) {
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms || 3800);
  };

  WH.sysLog = function (msg, kind) {
    const el = $('#sysLog'); if (!el) return;
    const d = document.createElement('div'); d.className = 'sl ' + (kind || '');
    d.innerHTML = '<time>' + WH.nowStr() + '</time><span>' + msg + '</span>';
    el.prepend(d); while (el.children.length > 40) el.lastChild.remove();
  };

  /* audio + haptics + voice */
  let actx = null;
  function ac() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { actx = null; } return actx; }
  document.addEventListener('pointerdown', ac, { once: true });
  function tone(f, t0, d, type, vol) {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, a.currentTime + t0); g.gain.exponentialRampToValueAtTime(vol || 0.12, a.currentTime + t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + d);
    o.connect(g); g.connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + d + 0.05);
  }
  WH.beep = function (kind) {
    if (!S.voiceOn) return;
    if (kind === 'chime') { tone(784, 0, 0.5, 'sine', 0.1); tone(1046, 0.18, 0.7, 'sine', 0.09); }
    else if (kind === 'alert') { [0, 0.28, 0.56].forEach((t) => { tone(880, t, 0.18, 'square', 0.07); tone(660, t + 0.1, 0.14, 'square', 0.05); }); }
    else if (kind === 'siren') { for (let i = 0; i < 4; i++) { tone(700, i * 0.45, 0.22, 'sawtooth', 0.06); tone(980, i * 0.45 + 0.22, 0.22, 'sawtooth', 0.06); } }
    else if (kind === 'ring') { for (let i = 0; i < 2; i++) { tone(440, i * 0.5, 0.16, 'sine', 0.1); tone(480, i * 0.5 + 0.02, 0.16, 'sine', 0.1); tone(440, i * 0.5 + 0.2, 0.16, 'sine', 0.1); } }
    else if (kind === 'ok') { tone(660, 0, 0.14, 'sine', 0.09); tone(990, 0.12, 0.26, 'sine', 0.09); }
    else if (kind === 'tick') tone(1200, 0, 0.05, 'square', 0.03);
  };
  WH.buzz = function (kind) {
    const dev = $('#device'); if (!dev) return;
    dev.classList.remove('vib'); void dev.offsetWidth; dev.classList.add('vib');
    clearTimeout(WH._vibT); WH._vibT = setTimeout(() => dev.classList.remove('vib'), kind === 'strong' || kind === 'sos' ? 1400 : 600);
    const pat = { soft: [80], strong: [300, 120, 300, 120, 500], sos: [400, 120, 400, 120, 400, 120, 700], left: [90, 90, 90], right: [260] }[kind] || [120];
    try { navigator.vibrate && navigator.vibrate(pat); } catch (e) { /* ignore */ }
    if (kind === 'left' || kind === 'right') { const el = $(kind === 'left' ? '#hapL' : '#hapR'); if (el) { el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); } }
  };

  let speakTimer = null;
  WH.say = function (text, o) {
    o = o || {};
    S.lastSay = text;
    const plain = String(text).replace(/<[^>]+>/g, '');
    const cap = $('#csSay'); if (cap && !o.noCaption) cap.textContent = plain;
    const ns = $('#nsTx'); if (ns) ns.textContent = plain;
    const nm = (S.assistant && S.assistant.name) || 'Na';
    const nn = $('#nsName'); if (nn) nn.textContent = nm;
    WH.sysLog('<b>' + esc(nm) + '</b> says: "' + esc(plain.slice(0, 90)) + (plain.length > 90 ? '…' : '') + '"');
    $$('.cs-wave').forEach((w) => w.classList.add('speaking'));
    clearTimeout(speakTimer); speakTimer = setTimeout(() => $$('.cs-wave').forEach((w) => w.classList.remove('speaking')), Math.min(9000, 900 + plain.length * 62));
    if (S.voiceOn && 'speechSynthesis' in window) {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(plain);
        u.lang = { vi: 'vi-VN', id: 'id-ID' }[S.lang] || 'en-US'; u.rate = 0.92; u.pitch = S.assistant.voice === 'deep' ? 0.8 : 1.05;
        const vs = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith(S.lang));
        if (vs.length) u.voice = vs[0];
        speechSynthesis.speak(u);
      } catch (e) { /* ignore */ }
    }
  };

  /* ───────────── wearable UI ───────────── */
  let promptState = null, promptLayer = null;
  WH.devPrompt = function (o) {
    WH.closePrompt(true);
    const layer = S.screen === 'nav' ? $('#navPrompt') : $('#devLayer'); if (!layer) return null;
    promptLayer = layer;
    const total = o.secs || 0;
    const R = 46, C = 2 * Math.PI * R;
    layer.innerHTML = `<div class="dp tone-${o.tone || 'blue'}${o.big ? ' big' : ''}">
      <div class="dp-ic">${o.iconHtml || ic(o.icon || 'assistant', 54)}</div>
      <h2>${o.title || ''}</h2>
      ${o.text ? `<p>${o.text}</p>` : ''}
      ${o.extra ? `<div class="dp-extra">${o.extra}</div>` : ''}
      ${total ? `<div class="dp-count"><svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="${R}" class="bg"/><circle cx="55" cy="55" r="${R}" class="fg" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><b>${total}</b></div>` : ''}
      <div class="dp-btns">${(o.buttons || []).map((b, i) => `<button class="dpb ${b.tone || ''}" data-i="${i}">${b.icon ? ic(b.icon, 30) : ''}<span>${b.label}</span></button>`).join('')}</div>
    </div>`;
    layer.classList.add('on');
    const st = { o, left: total, closed: false };
    promptState = st;
    $$('.dpb', layer).forEach((btn) => btn.addEventListener('click', () => {
      const b = o.buttons[+btn.dataset.i]; WH.beep('tick');
      if (b.keep) { b.fn && b.fn(st); } else { WH.closePrompt(); b.fn && b.fn(st); }
    }));
    if (total) {
      const fg = $('.fg', layer), num = $('.dp-count b', layer), t0 = performance.now();
      st.timer = setInterval(() => {
        const el = (performance.now() - t0) / 1000, left = Math.max(0, total - el);
        fg && fg.setAttribute('stroke-dashoffset', String(C * (el / total)));
        const n = Math.ceil(left); if (num && num.textContent !== String(n)) { num.textContent = n; if (o.tick !== false && n <= 5) WH.beep('tick'); if (o.repeatBuzz) WH.buzz('soft'); }
        if (left <= 0) { clearInterval(st.timer); if (!st.closed) { WH.closePrompt(); o.onTimeout && o.onTimeout(); } }
      }, 100);
    }
    if (o.haptic) WH.buzz(o.haptic);
    if (o.beep) WH.beep(o.beep);
    if (o.say) WH.say(o.say);
    st.close = () => WH.closePrompt();
    return st;
  };
  WH.closePrompt = function (silent) {
    if (promptState) { clearInterval(promptState.timer); promptState.closed = true; promptState = null; }
    [promptLayer, $('#devLayer'), $('#navPrompt')].forEach((layer, k, arr) => { if (!layer || arr.indexOf(layer) !== k) return; layer.classList.remove('on'); if (silent) { layer.innerHTML = ''; } else setTimeout(() => { if (!promptState) layer.innerHTML = ''; }, 250); });
  };
  WH.hasPrompt = () => !!promptState;

  /* chat sheet */
  WH.openChat = function () {
    const sh = $('#chatSheet'); sh.classList.add('on');
    $('#csName').textContent = S.assistant.name;
    if (!$('#csBody').children.length) WH.chatBot(T('chatHello', { n: S.callName }));
    WH.renderChips();
  };
  WH.closeChat = function () { $('#chatSheet').classList.remove('on'); };
  WH.chatBot = function (html, o) {
    const b = $('#csBody'); b.insertAdjacentHTML('beforeend', `<div class="cm bot">${html}</div>`); b.scrollTop = b.scrollHeight;
    WH.say(html, { noCaption: false });
  };
  WH.chatUser = function (txt) {
    const b = $('#csBody'); b.insertAdjacentHTML('beforeend', `<div class="cm me">${esc(txt)}</div>`); b.scrollTop = b.scrollHeight;
  };
  WH.renderChips = function () {
    let box = $('#csChips');
    if (!box) { box = document.createElement('div'); box.id = 'csChips'; box.className = 'cs-chips'; $('#csBody').after(box); }
    const chips = S.phrases.map((p) => `<button class="chip say" data-say="${esc(p.say)}">${ic('mic', 16)}<span>"${esc(p.say)}"</span></button>`);
    chips.push(`<button class="chip say" data-say="${esc(T('qWhere'))}">${ic('pin', 16)}<span>${esc(T('qWhere'))}</span></button>`);
    chips.push(`<button class="chip say" data-say="${esc(T('qTired'))}">${ic('heart', 16)}<span>${esc(T('qTired'))}</span></button>`);
    box.innerHTML = chips.join('');
    $$('.chip', box).forEach((c) => c.addEventListener('click', () => WH.Sim && WH.Sim.userSays(c.dataset.say)));
  };

  /* ───────────── family phone UI ───────────── */
  WH.famBanner = function (o) {
    const box = $('#pBanners'); if (!box) return;
    const el = document.createElement('div'); el.className = 'pb tone-' + (o.tone || 'blue');
    el.innerHTML = `<div class="pb-ic">${ic(o.ic || 'bell', 22)}</div><div class="pb-tx"><b>${o.title}</b><span>${o.body || ''}</span></div><time>${T('now')}</time>`;
    box.prepend(el); WH.beep(o.tone === 'red' ? 'alert' : 'chime');
    WH.Inbox && WH.Inbox.dispatch(o);
    const kill = () => { el.classList.add('out'); setTimeout(() => el.remove(), 350); };
    el.addEventListener('click', kill); setTimeout(kill, o.ms || 6500);
    if (S.screen === 'nav') WH.toast(ic(o.ic || 'bell', 18) + ' <b>' + o.title + '</b> ' + (o.body || ''), 'fam', 4200);
  };
  WH.feed = function (txt, tone, icon) {
    const f = $('#pFeed'); if (!f) return;
    f.insertAdjacentHTML('afterbegin', `<div class="fi tone-${tone || 'blue'}"><i>${ic(icon || 'bell', 18)}</i><div><b>${txt}</b><span>${WH.nowStr()}</span></div></div>`);
    while (f.children.length > 40) f.lastChild.remove();
  };
  WH.famLayer = function (html, cls) { const l = $('#pLayer'); l.innerHTML = html ? `<div class="pl ${cls || ''}">${html}</div>` : ''; l.classList.toggle('on', !!html); return l; };
  WH.setChip = function (text, tone) { const c = $('#pChip'); if (c) { c.textContent = text; c.className = 'p-chip ' + (tone || 'ok'); } };

  /* ───────────── refresh header bits ───────────── */
  WH.refresh = function () {
    const hr = WH.hour();
    const g = hr < 11 ? 'goodMorning' : hr < 17 ? 'goodAfternoon' : 'goodEvening';
    $('#dGreet').textContent = T(g) + ', ' + S.callName;
    $('#dAvatar').textContent = (S.callName || S.name).trim().slice(-1).toUpperCase();
    $('#dDate').textContent = new Date().toLocaleDateString(({ vi: 'vi-VN', id: 'id-ID' }[S.lang] || 'en-GB'), { weekday: 'long', day: 'numeric', month: 'long' });
    $('#pName').textContent = S.callName;
    $('#dTime').textContent = WH.nowStr();
    $('#csName').textContent = S.assistant.name;
    $('#dHrV').textContent = Math.round(S.hr);
    $('#dBatV').textContent = Math.round(S.batt) + '%';
    $('#dBat').classList.toggle('low', S.batt <= 20);
    $('#dBat .ic').outerHTML = ic(S.batt <= 20 ? 'batteryLow' : 'battery', 16);
    $('#dHr').classList.toggle('bad', S.hr > S.sensors.hrMax || S.hr < S.sensors.hrMin);
    $('#dGps').classList.toggle('off', S.gpsLost);
    $('#pHr').textContent = Math.round(S.hr); $('#pBat').textContent = Math.round(S.batt);
    const d = WH.distHomeKm(); $('#pDist').textContent = d < 0.05 ? '0.0' : d.toFixed(2);
    $('#device').classList.toggle('removed', S.removed);
    $('#device').classList.toggle('pendant', S.device === 'pendant');
    let safeCls = 'ok', safeTxt = T('safeIn'), icn = 'shield';
    if (S.sosActive) { safeCls = 'sos'; safeTxt = T('safeSos'); icn = 'siren'; }
    else if (S.guiding) { safeCls = 'guide'; safeTxt = T('safeGuide'); icn = 'nav'; }
    else if (S.out) { safeCls = 'out'; safeTxt = T('safeOut'); icn = 'alert'; }
    else if (S.night && S.curfewOn) { safeCls = 'night'; safeTxt = T('safeNight'); icn = 'moon'; }
    const sf = $('#dSafe'); sf.className = 'd-safe ' + safeCls; $('#dSafeTxt').textContent = safeTxt; sf.firstElementChild.outerHTML = ic(icn, 26);
    $('#devMapTag').textContent = S.out ? T('mapOut', { d: WH.distHomeKm().toFixed(2) }) : T('mapNear');
    $('#famMapTag').textContent = S.gpsLost ? T('gpsLastSeen') : S.out ? T('mapOut', { d: WH.distHomeKm().toFixed(2) }) : T('mapNear');
    if (!S.sosActive && !WH._chipLocked) WH.setChip(S.guiding ? T('chipGuide') : S.out ? T('chipOut') : S.removed ? T('chipRemoved') : T('chipSafe'), S.guiding ? 'blue' : S.out || S.removed ? 'red' : 'ok');
    WH.renderRemind && WH.renderRemind();
    const hrc = S.hr > S.sensors.hrMax || S.hr < S.sensors.hrMin;
    const tg = $('#ecgTag'); tg.textContent = hrc ? T('ecgBad') : T('ecgOk'); tg.className = 'ecg-tag ' + (hrc ? 'bad' : '');
  };

  /* avatar movement bookkeeping */
  WH.setAvatar = function (x, z, heading, moving) {
    const p = S.pos, dx = x - p.x, dz = z - p.z;
    if (moving && (dx * dx + dz * dz) > 1e-6 && heading === undefined) heading = Math.atan2(dx, dz);
    S.pos = { x, z };
    if (heading !== undefined) S.heading = heading;
    S.moving = !!moving;
    const last = S.trail[S.trail.length - 1];
    if (!last || Math.hypot(last.x - x, last.z - z) > 1.1) { S.trail.push({ x, z }); if (S.trail.length > 700) S.trail.shift(); WH.worlds.forEach((w) => w.setTrail(S.trail)); }
  };

  /* ECG */
  const ecg = { phase: 0, buf: new Array(220).fill(0) };
  function g(x, mu, sg) { return Math.exp(-Math.pow((x - mu) / sg, 2)); }
  function ecgVal(p) { return 0.14 * g(p, 0.16, 0.035) - 0.12 * g(p, 0.285, 0.012) + 1.0 * g(p, 0.31, 0.011) - 0.28 * g(p, 0.335, 0.014) + 0.26 * g(p, 0.56, 0.06); }
  WH.tickEcg = function (dt) {
    const cv = $('#ecg'); if (!cv || !cv.getClientRects().length) return;
    ecg.phase += dt * (S.hr / 60);
    const steps = Math.max(1, Math.round(dt * 60));
    for (let i = 0; i < steps; i++) { ecg.buf.push(ecgVal(ecg.phase % 1) + (Math.random() - 0.5) * 0.02); ecg.buf.shift(); }
    const c = cv.getContext('2d'), W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    const bad = S.hr > S.sensors.hrMax || S.hr < S.sensors.hrMin;
    c.strokeStyle = bad ? '#ef4444' : '#10b981'; c.lineWidth = 2.2; c.lineJoin = 'round'; c.beginPath();
    ecg.buf.forEach((v, i) => { const x = (i / (ecg.buf.length - 1)) * W, y = H * 0.72 - v * H * 0.55; i ? c.lineTo(x, y) : c.moveTo(x, y); });
    c.stroke();
  };
})();
