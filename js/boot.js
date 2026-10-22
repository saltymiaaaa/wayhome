/* Boot: build the 3D views, wire the screens. */
(function () {
  const WH = (window.WH = window.WH || {});
  const S = WH.S, $ = WH.$, $$ = WH.$$, esc = WH.esc;
  const T = (k, v) => WH.t(k, v);

  WH.enterStage = function (view) {
    S.view = view || S.view; $('#stage').dataset.view = S.view; $('#device').classList.toggle('nostraps', S.view === 'elder');
    $$('#viewSeg button').forEach((b) => b.classList.toggle('on', b.dataset.view === S.view));
    if (S.view === 'inbox') WH.Inbox.seen();
    WH.go('stage'); WH.Sim.renderLadder(); WH.renderRemind(); WH.refresh();
    setTimeout(() => { WH.fit(); }, 60); setTimeout(() => { WH.fit(); }, 400);
    if (!WH._hinted) { WH._hinted = true; setTimeout(() => WH.toast(ic('spark', 18) + ' ' + T('t_stage_hint'), 'ok', 6500), 800); }
  };

  WH.fit = function () {
    const dev = $('#device'), df = $('#devFit');
    if (dev && df && df.clientHeight > 50) {
      const bare = S.view === 'elder', total = dev.offsetHeight + (bare ? 24 : 200);
      const k = Math.max(0.35, Math.min(1, (df.clientHeight - 4) / total, df.clientWidth / (dev.offsetWidth + 50)));
      dev.style.transform = 'translateY(' + ((bare ? 10 : 100) * k).toFixed(1) + 'px) scale(' + k.toFixed(3) + ')';
    }
    const ph = $('#phone'), pf = $('.phone-fit');
    if (ph && pf && pf.clientHeight > 50) {
      const k = Math.max(0.35, Math.min(1, (pf.clientHeight - 4) / ph.offsetHeight, pf.clientWidth / ph.offsetWidth));
      ph.style.transform = 'scale(' + k.toFixed(3) + ')';
    }
  };

  const IDEAS = [
    ['demo', 'image', 'i1'], ['demo', 'ladder', 'i2'], ['demo', 'pulse', 'i3'], ['demo', 'mic', 'i4'], ['demo', 'chat', 'i5'], ['demo', 'moon', 'i6'],
    ['next', 'route', 'i7'], ['next', 'volume', 'i8'], ['next', 'wifioff', 'i9'], ['next', 'nav', 'i10'], ['next', 'qr', 'i11'], ['next', 'chart', 'i12'], ['next', 'home', 'i13'], ['hw', 'hand', 'i14']
  ];
  function renderIdeas() {
    $('#ideasList').innerHTML = IDEAS.map((i) => `<div class="idea ${i[0]}"><i>${ic(i[1], 24)}</i><div><b>${T(i[2] + 't')}</b><span>${T(i[2] + 'd')}</span></div><em>${T('tag_' + i[0])}</em></div>`).join('');
  }

  function bindCommon() {
    $('#roleFamily').onclick = () => WH.Setup.open(1);
    $('#roleElder').onclick = () => WH.enterStage('elder');
    $('#roleStage').onclick = () => WH.enterStage('both');
    $$('[data-go]').forEach((b) => (b.onclick = () => { if (WH.Guide.active) WH.Guide.stop(true); WH.go(b.dataset.go); }));
    $('#btnSetupAgain').onclick = () => WH.Setup.open(1);
    $$('#viewSeg button').forEach((b) => (b.onclick = () => WH.enterStage(b.dataset.view)));
    $$('.lang button').forEach((b) => (b.onclick = () => WH.setLang(b.dataset.lang)));
    $('#btnIdeas').onclick = () => { renderIdeas(); $('#mdIdeas').classList.add('on'); };
    $('#ideasClose').onclick = () => $('#mdIdeas').classList.remove('on');
    $$('.modal').forEach((m) => m.addEventListener('pointerdown', (e) => { if (e.target === m) m.classList.remove('on'); }));
    $('#dirToggle').onclick = () => $('#director').classList.toggle('min');
    window.addEventListener('resize', () => WH.fit());
  }

  WH.onLang = function () {
    paintIcons(document);
    WH.Sim.buildDirector(); WH.Guide.bind(); WH.Inbox.render();
    if(WH.Memory.active) WH.Memory.render();
    if(!$('#memoryLibrary').hidden) WH.MemoryLibrary.render();
    WH.MemoryDemo.render();$('#navCall').setAttribute('aria-label',T('mgFamily'));$('#navSos').setAttribute('aria-label','SOS');
    WH.refresh(); WH.Sim.renderLadder(); WH.renderRemind(); WH.renderChips && $('#csChips') && WH.renderChips();
    $$('.lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === S.lang));
    if (S.screen === 'setup') WH.Setup.render();
    if (WH.Guide.active) WH.Guide.renderAll();
  };

  WH.onScreen = function (name) {
    if (name === 'stage') { WH.fit(); WH.refresh(); }
    if (name === 'landing') { WH.bg && WH.bg.setCam({}, false); }
  };

  function boot() {
    const saved = (function () { try { return localStorage.getItem('wh_lang2'); } catch (e) { return null; } })();
    S.lang = saved || WH.MemoryData.state.prefs.language || 'en';
    const W = WH.World;
    WH.bg = new W($('#bgWorld'), { mode: 'orbit', night: true, autoRotate: true, interactive: false, dist: 74 });
    WH.bg.setCam({ tx: -6, tz: -6, az: 0.6, pol: 1.02, dist: 74 }, true);
    WH.wSetup = new W($('#setupMap'), { mode: 'orbit' });
    WH.wSetup.setCam({ tx: WH.HOME_POS.x, tz: WH.HOME_POS.z, dist: 46, az: 0.7, pol: 1.0 }, true);
    WH.wDev = new W($('#devMap'), { mode: 'avatar', interactive: false, autoRotate: true });
    WH.wDev.setCam({ dist: 26, pol: 0.82, az: 0.8, tx: S.pos.x, tz: S.pos.z }, true);
    WH.wFam = new W($('#famMap'), { mode: 'both', interactive: false, minDist: 30 });
    WH.wFam.setCam({ dist: 44, pol: 0.78, az: 0.7, tx: -10, tz: -5 }, true);
    WH.wNav = new W($('#navWorld'), { mode: 'follow', fov: 58, interactive: false });
    WH.wMini = new W($('#navMini'), { mode: 'both', interactive: false, minDist: 40, pol: 0.55 });
    WH.hero = new WH.Watch3D($('#heroWatch'));

    WH.Inbox.render();
    WH.Memory.init(); WH.MemoryLibrary.init(); WH.MemoryDemo.init(); WH.MemorySafety.init();
    WH.Sim.bind(); WH.Guide.bind(); WH.Setup.bind(); bindCommon();
    $('#memoryOpen').onclick=()=>WH.Memory.open();
    $$('[data-memory-library]').forEach(b=>b.onclick=()=>WH.MemoryLibrary.open());
    $('#memoryDemoStart').onclick=()=>WH.MemoryDemo.start();
    $('#memoryConfirm').onclick=()=>WH.MemorySafety.confirm();
    $('#memoryNavForm').onsubmit=e=>{e.preventDefault();WH.Sim.userSays($('#memoryNavText').value);$('#memoryNavText').value='';};
    $('#memoryNavRest').onclick=()=>WH.MemorySafety.rest();
    $('#memoryNavConfused').onclick=()=>WH.MemorySafety.confused();
    $('#memoryNavMic').onclick=()=>$('#csMic').click();
    WH.MemoryData.hydrate();
    WH.MemoryData.syncBackend();
    WH.setLang(S.lang);
    WH.refresh();
    WH.sysLog(T('log_boot'), 'ok');
    document.fonts && document.fonts.ready.then(() => { WH.hero.paint(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
