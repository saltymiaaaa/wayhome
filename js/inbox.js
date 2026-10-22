/* How each family contact actually receives the messages: lock-screen push, SMS, WeChat, phone call. */
(function () {
  const WH = (window.WH = window.WH || {});
  const S = WH.S, $ = WH.$, $$ = WH.$$, esc = WH.esc;
  const T = (k, v) => WH.t(k, v);
  const Inbox = (WH.Inbox = { msgs: [], sel: 0, unread: 0 });
  const plain = (s) => String(s || '').replace(/<[^>]+>/g, '');
  const locale = () => ({ vi: 'vi-VN', id: 'id-ID' }[S.lang] || 'en-GB');

  /* who gets what: quiet info goes to the primary contact, warnings add SMS, alerts go to everyone on every channel */
  function route(tone) {
    const n = S.contacts.length, all = [...Array(n).keys()];
    if (tone === 'blue' || tone === 'green') return { to: [0], ch: ['push'] };
    if (tone === 'amber') return { to: all.slice(0, 2), ch: ['push', 'sms'] };
    return { to: all, ch: ['push', 'sms', 'wechat'], call: n > 1 };
  }
  function chFor(m, i) {
    if (!m.to.includes(i)) return [];
    const c = S.contacts[i];
    let ch = m.ch.filter((x) => x !== 'push' || c.paired);
    if (!ch.length) ch = ['sms'];          // phone not paired to the app: falls back to SMS
    if (m.call && i === 1) ch = ch.concat('call');
    return ch;
  }
  Inbox.dispatch = function (o) {
    const r = route(o.tone || 'blue');
    Inbox.msgs.unshift({ time: WH.nowStr(), tone: o.tone || 'blue', ic: o.ic || 'bell', title: plain(o.title), body: plain(o.body), to: r.to, ch: r.ch, call: !!r.call });
    if (Inbox.msgs.length > 40) Inbox.msgs.pop();
    if (S.view !== 'inbox') { Inbox.unread++; badge(); }
    Inbox.render();
    WH.sysLog(T('ib_sent', { who: r.to.map((i) => (S.contacts[i] || {}).name).join(', '), ch: r.ch.join('+') + (r.call ? '+call' : '') }), 'ok');
  };
  function badge() { const b = $('#ibBadge'); if (b) { b.textContent = Inbox.unread; b.style.display = Inbox.unread ? 'inline-grid' : 'none'; } }
  Inbox.seen = function () { Inbox.unread = 0; badge(); Inbox.render(); };

  const smsText = (m) => '[WayHome] ' + m.title + '. ' + m.body + ' ' + T('ib_link') + ' wayhome.app/t/8f2k';

  Inbox.render = function () {
    const tabs = $('#ibTabs'), body = $('#ibBody'); if (!tabs || !body) return;
    if (Inbox.sel >= S.contacts.length) Inbox.sel = 0;
    const i = Inbox.sel;
    tabs.innerHTML = S.contacts.map((x, k) => `<button class="ibt ${k === i ? 'on' : ''}" data-k="${k}"><i>${esc(x.name.slice(0, 1))}</i><b>${esc(x.name)}</b><span>${esc(x.rel)} · ${esc(x.phone)}</span><em class="${x.paired ? 'ok' : ''}">${x.paired ? T('ib_app') : T('ib_noapp')}</em></button>`).join('');
    $$('.ibt', tabs).forEach((b) => (b.onclick = () => { Inbox.sel = +b.dataset.k; Inbox.render(); }));
    const mine = Inbox.msgs.filter((m) => chFor(m, i).length);
    const withCh = (ch) => mine.filter((m) => chFor(m, i).includes(ch));
    const empty = `<div class="mp-empty">${ic('bell', 30)}<span>${T('ib_empty')}</span></div>`;

    const push = withCh('push').slice(0, 5), calls = withCh('call').slice(0, 1);
    const lock = `<div class="mp-s lock"><div class="lk-time">${WH.nowStr()}</div><div class="lk-date">${new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <div class="lk-stack">${calls.map((m) => `<div class="lk-card call"><div class="lk-app red">${ic('phone', 16)}</div><div><b>${T('ib_call_in')}</b><span>WayHome Alert · +86 755 8888 0123</span></div><time>${esc(m.time)}</time></div>`).join('')}
      ${push.map((m) => `<div class="lk-card ${m.tone}"><div class="lk-app">${ic('home', 16)}</div><div><small>WAYHOME · ${esc(m.time)}</small><b>${esc(m.title)}</b><span>${esc(m.body)}</span></div></div>`).join('') || (calls.length ? '' : empty)}</div><div class="lk-bar"></div></div>`;
    const sms = withCh('sms').slice(0, 5).reverse();
    const smsH = `<div class="mp-s sms"><div class="sm-head"><i>${ic('chat', 16)}</i><b>WayHome</b><span>${T('ib_sms_sub')}</span></div><div class="sm-body">${sms.map((m) => `<div class="sm-t">${esc(m.time)}</div><div class="sm-b ${m.tone}">${esc(smsText(m))}</div>`).join('') || empty}</div></div>`;
    const wc = withCh('wechat').slice(0, 4).reverse();
    const wcH = `<div class="mp-s wc"><div class="wc-head"><b>WayHome Care</b></div><div class="wc-body">${wc.map((m) => `<div class="wc-t">${esc(m.time)}</div><div class="wc-row"><div class="wc-ava">${ic('home', 18)}</div><div class="wc-card ${m.tone}"><b>${esc(m.title)}</b><span>${esc(m.body)}</span><div class="wc-btn">${T('ib_wc_view')} ›</div></div></div>`).join('') || empty}</div></div>`;
    const logRows = mine.slice(0, 8).map((m) => `<div class="ibl ${m.tone}"><time>${esc(m.time)}</time><b>${esc(m.title)}</b><span>${chFor(m, i).map((x) => `<em>${T('ch_' + x)}</em>`).join('')}</span></div>`).join('') || `<div class="ibl none">${T('ib_empty')}</div>`;
    body.innerHTML = `<div class="ib-phones">
      <div class="ib-ph"><h4>${ic('bell', 16)} ${T('ch_push')}</h4><div class="mp">${lock}</div></div>
      <div class="ib-ph"><h4>${ic('chat', 16)} SMS</h4><div class="mp">${smsH}</div></div>
      <div class="ib-ph"><h4>${ic('users', 16)} WeChat</h4><div class="mp">${wcH}</div></div></div>
      <div class="ib-log"><h4>${ic('chart', 16)} ${T('ib_log')}</h4>${logRows}</div>`;
    $$('.sm-body,.wc-body').forEach((e) => (e.scrollTop = e.scrollHeight));
  };
  Inbox.reset = function () { Inbox.msgs = []; Inbox.unread = 0; badge(); Inbox.render(); };
})();
