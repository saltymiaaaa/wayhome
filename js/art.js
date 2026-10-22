/* Illustrated "photos" of landmarks. Real photos can replace them in the setup wizard. */
(function () {
  const W = 640, H = 400;
  function sky(top, bot, sun) {
    return `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient>
    <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ccf8a"/><stop offset="1" stop-color="#5fa36a"/></linearGradient>
    <linearGradient id="rd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c7480"/><stop offset="1" stop-color="#4b525d"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sk)"/>
    <circle cx="540" cy="70" r="38" fill="${sun}" opacity=".9"/><circle cx="540" cy="70" r="62" fill="${sun}" opacity=".18"/>
    <g fill="#fff" opacity=".85"><ellipse cx="120" cy="70" rx="50" ry="14"/><ellipse cx="150" cy="60" rx="34" ry="12"/><ellipse cx="380" cy="100" rx="44" ry="11"/></g>`;
  }
  const ground = `<rect y="290" width="${W}" height="110" fill="url(#rd)"/><rect y="282" width="${W}" height="14" fill="#c9c3b3"/>
    <g fill="#e8e4d6" opacity=".9"><rect x="40" y="345" width="70" height="8" rx="3"/><rect x="190" y="345" width="70" height="8" rx="3"/><rect x="340" y="345" width="70" height="8" rx="3"/><rect x="490" y="345" width="70" height="8" rx="3"/></g>`;
  const tree = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="-10" width="12" height="46" rx="4" fill="#7a5638"/><circle cx="0" cy="-34" r="34" fill="#3f9b55"/><circle cx="-22" cy="-16" r="22" fill="#4aa860"/><circle cx="22" cy="-16" r="22" fill="#378f4d"/></g>`;
  const person = (x, y, c) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="40" rx="14" ry="4" fill="#0003"/><rect x="-9" y="2" width="18" height="30" rx="8" fill="${c}"/><circle cx="0" cy="-8" r="9" fill="#f1c9a0"/><path d="M-9-10a9 9 0 0 1 18 0z" fill="#ddd"/></g>`;

  const SCENES = {
    market() {
      let aw = '';
      const cols = ['#e2483d', '#fff', '#e2483d', '#fff', '#e2483d', '#fff', '#e2483d'];
      cols.forEach((c, i) => { aw += `<path d="M${90 + i * 66} 150h66l-8 44h-50z" fill="${c}"/>`; });
      return sky('#ffd8a8', '#fff1d9', '#ffb347') +
        `<rect x="60" y="120" width="520" height="170" rx="10" fill="#f2d6a8"/><rect x="80" y="110" width="480" height="40" rx="8" fill="#b9472f"/>
        <text x="320" y="140" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="28" fill="#fff3d6">菜市场 MARKET</text>${aw}
        <g>${[0, 1, 2, 3, 4].map(i => `<rect x="${100 + i * 98}" y="220" width="80" height="60" rx="6" fill="#8a5a33"/><circle cx="${118 + i * 98}" cy="218" r="12" fill="${['#ff7a2f', '#e2483d', '#7bc043', '#ffd23f', '#ff7a2f'][i]}"/><circle cx="${142 + i * 98}" cy="216" r="12" fill="${['#ffd23f', '#7bc043', '#ff7a2f', '#e2483d', '#7bc043'][i]}"/><circle cx="${130 + i * 98}" cy="206" r="12" fill="${['#e2483d', '#ff7a2f', '#ffd23f', '#7bc043', '#e2483d'][i]}"/>`).join('')}</g>` +
        ground + person(260, 285, '#3b82f6') + person(420, 290, '#e2483d') + tree(40, 280, .8);
    },
    pagoda() {
      let tiers = '';
      for (let i = 0; i < 4; i++) {
        const y = 250 - i * 52, w = 200 - i * 36;
        tiers += `<rect x="${320 - w / 2 + 14}" y="${y}" width="${w - 28}" height="40" fill="#c0392b"/><rect x="${320 - w / 2 + 40}" y="${y + 8}" width="14" height="24" fill="#f1c40f"/><rect x="${320 + w / 2 - 54}" y="${y + 8}" width="14" height="24" fill="#f1c40f"/>
        <path d="M${320 - w / 2 - 22} ${y + 6}Q${320 - w / 2 + 10} ${y - 2} ${320 - w / 2 + 40} ${y - 24}H${320 + w / 2 - 40}Q${320 + w / 2 - 10} ${y - 2} ${320 + w / 2 + 22} ${y + 6}Q${320} ${y + 22} ${320 - w / 2 - 22} ${y + 6}z" fill="#2c3e50"/>
        <path d="M${320 - w / 2 - 22} ${y + 6}q-6 -10 2 -14M${320 + w / 2 + 22} ${y + 6}q6 -10 -2 -14" stroke="#f1c40f" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      }
      return sky('#b3d9ff', '#eaf5ff', '#ffe08a') +
        `<rect x="210" y="262" width="220" height="30" fill="#9a8c7a"/><rect x="190" y="282" width="260" height="14" fill="#b4a794"/>${tiers}<rect x="316" y="30" width="8" height="40" fill="#f1c40f"/><circle cx="320" cy="28" r="9" fill="#f1c40f"/>` +
        ground + tree(100, 285, 1.1) + tree(540, 285, 1) + person(470, 292, '#8e44ad');
    },
    parkgate() {
      return sky('#a5d8ff', '#e6f6ff', '#fff3a0') +
        `<rect x="0" y="180" width="${W}" height="110" fill="url(#gr)"/>${tree(70, 250, 1.3)}${tree(570, 250, 1.3)}${tree(150, 230, .9)}${tree(500, 230, .9)}
        <rect x="170" y="110" width="30" height="180" rx="6" fill="#d6ccb8"/><rect x="440" y="110" width="30" height="180" rx="6" fill="#d6ccb8"/>
        <path d="M185 110Q320 20 455 110" stroke="#2e7d4f" stroke-width="22" fill="none" stroke-linecap="round"/>
        <rect x="230" y="54" width="180" height="40" rx="10" fill="#2e7d4f"/><text x="320" y="82" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="19" fill="#eafff0">LIANHUASHAN PARK</text>
        <g fill="#f4a3c4"><circle cx="205" cy="270" r="6"/><circle cx="225" cy="278" r="6"/><circle cx="415" cy="272" r="6"/><circle cx="440" cy="280" r="6"/></g>
        <rect x="205" y="200" width="230" height="90" fill="#7fbf8e" opacity=".55"/>` + ground + person(320, 280, '#e67e22');
    },
    pharmacy() {
      return sky('#cfe8ff', '#f2f9ff', '#ffe08a') +
        `<rect x="120" y="110" width="400" height="180" rx="10" fill="#f4f1ea"/><rect x="120" y="110" width="400" height="44" rx="10" fill="#17a773"/>
        <text x="350" y="141" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="26" fill="#fff">药店 PHARMACY</text>
        <g transform="translate(160 132)"><rect x="-14" y="-5" width="28" height="10" rx="3" fill="#fff"/><rect x="-5" y="-14" width="10" height="28" rx="3" fill="#fff"/></g>
        <rect x="150" y="180" width="150" height="90" rx="8" fill="#bfe3f5"/><rect x="330" y="180" width="70" height="110" rx="6" fill="#7a5638"/><circle cx="388" cy="238" r="4" fill="#ffd23f"/>
        <rect x="420" y="180" width="80" height="90" rx="8" fill="#bfe3f5"/><rect x="170" y="200" width="30" height="46" rx="4" fill="#fff" opacity=".8"/><rect x="215" y="200" width="30" height="46" rx="4" fill="#17a773" opacity=".8"/><rect x="260" y="200" width="30" height="46" rx="4" fill="#fff" opacity=".8"/>
        <path d="M110 154h420l-20 26H130z" fill="#17a773" opacity=".35"/>` + ground + tree(70, 285, 1) + person(560, 292, '#2c7be5');
    },
    bakery() {
      let st = '';
      for (let i = 0; i < 8; i++) st += `<path d="M${110 + i * 52} 170h52l-6 36h-40z" fill="${i % 2 ? '#fff' : '#f0883e'}"/>`;
      return sky('#ffe3c7', '#fff6ea', '#ffbe55') +
        `<rect x="100" y="100" width="440" height="190" rx="10" fill="#f6d9b0"/><rect x="100" y="100" width="440" height="52" rx="10" fill="#8c4a2f"/>
        <text x="320" y="136" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="30" fill="#ffe6c2">面包店 BAKERY</text>${st}
        <rect x="130" y="215" width="200" height="60" rx="8" fill="#fff6e6"/><ellipse cx="170" cy="240" rx="26" ry="14" fill="#d98a3d"/><ellipse cx="230" cy="244" rx="30" ry="14" fill="#c97832"/><ellipse cx="290" cy="240" rx="22" ry="12" fill="#e0a252"/>
        <rect x="380" y="190" width="70" height="100" rx="6" fill="#6b4226"/><circle cx="436" cy="244" r="4" fill="#ffd23f"/>` + ground + tree(560, 285, 1) + person(80, 292, '#c0392b');
    },
    busstop() {
      return sky('#bde0ff', '#eef7ff', '#fff0a0') +
        `<rect x="150" y="150" width="280" height="12" rx="4" fill="#2c3e50"/><rect x="156" y="162" width="8" height="128" fill="#2c3e50"/><rect x="416" y="162" width="8" height="128" fill="#2c3e50"/><rect x="164" y="162" width="252" height="80" fill="#bfe3f5" opacity=".6"/>
        <rect x="190" y="248" width="200" height="12" rx="4" fill="#8a5a33"/><rect x="450" y="70" width="14" height="220" fill="#7b8794"/><rect x="430" y="60" width="64" height="64" rx="12" fill="#2c7be5"/><text x="462" y="104" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="38" fill="#fff">BUS</text>
        <g transform="translate(540 220)"><rect x="-70" y="-50" width="130" height="80" rx="14" fill="#e2483d"/><rect x="-60" y="-40" width="40" height="28" rx="4" fill="#cfeaff"/><rect x="-14" y="-40" width="40" height="28" rx="4" fill="#cfeaff"/><circle cx="-40" cy="32" r="14" fill="#222"/><circle cx="30" cy="32" r="14" fill="#222"/></g>` +
        ground + person(260, 250, '#8e44ad') + tree(70, 285, 1);
    },
    school() {
      return sky('#b3d9ff', '#eaf5ff', '#ffe08a') +
        `<rect x="110" y="130" width="420" height="160" rx="6" fill="#f0e3c2"/><path d="M90 134 320 60l230 74z" fill="#b5533c"/><rect x="290" y="150" width="60" height="60" rx="30" fill="#fff"/><text x="320" y="192" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="30" fill="#2c3e50">T</text>
        ${[0, 1, 2, 3, 4].map(i => `<rect x="${140 + i * 78}" y="${i === 2 ? 230 : 220}" width="${i === 2 ? 60 : 44}" height="${i === 2 ? 60 : 50}" rx="4" fill="${i === 2 ? '#7a5638' : '#bfe3f5'}"/>`).join('')}
        <rect x="500" y="30" width="6" height="100" fill="#7b8794"/><path d="M506 34h44v28h-44z" fill="#e2483d"/>` + ground + tree(60, 285, 1) + tree(590, 285, 1);
    },
    crossing() {
      let z = '';
      for (let i = 0; i < 9; i++) z += `<path d="M${60 + i * 62} 330l40 0l-22 60l-52 0z" fill="#f4f4f0"/>`;
      return sky('#bde0ff', '#eef7ff', '#fff0a0') +
        `<rect y="250" width="${W}" height="150" fill="url(#rd)"/><rect y="236" width="${W}" height="18" fill="#c9c3b3"/>${z}
        <rect x="500" y="60" width="12" height="180" fill="#444"/><rect x="480" y="50" width="52" height="100" rx="12" fill="#222"/><circle cx="506" cy="76" r="12" fill="#e2483d" opacity=".35"/><circle cx="506" cy="100" r="12" fill="#ffbe55" opacity=".35"/><circle cx="506" cy="124" r="12" fill="#3ddc84"/>
        <path d="M120 250V120l60-30v160z" fill="#9aa5b1"/><path d="M180 250V90l80 20v140z" fill="#7d8a97"/>` + tree(70, 232, .9) + person(260, 262, '#2c7be5');
    },
    street() {
      return sky('#bde0ff', '#eef7ff', '#fff0a0') +
        `<path d="M0 400V260l320-80 320 80v140z" fill="url(#rd)"/><path d="M300 400 316 190h8l16 210z" fill="#e8e4d6" opacity=".8"/>
        <path d="M0 260 130 130v160zM640 260 510 130v160z" fill="#8aa0b8"/><rect x="60" y="150" width="90" height="140" fill="#cdbf9a"/><rect x="490" y="150" width="90" height="140" fill="#d9b8a0"/>` + tree(50, 290, 1.1) + tree(590, 290, 1.1);
    },
    home() {
      return sky('#ffe0c2', '#fff4e6', '#ffb347') +
        `<rect x="0" y="260" width="${W}" height="140" fill="url(#gr)"/><rect x="150" y="150" width="340" height="130" fill="#f4e3c3"/><path d="M130 154 320 70l190 84z" fill="#b5533c"/><rect x="410" y="80" width="30" height="50" fill="#a04a35"/>
        <rect x="190" y="180" width="70" height="60" rx="6" fill="#bfe3f5"/><rect x="380" y="180" width="70" height="60" rx="6" fill="#bfe3f5"/><rect x="288" y="188" width="64" height="92" rx="6" fill="#7a5638"/><circle cx="342" cy="236" r="4" fill="#ffd23f"/>
        <rect x="120" y="240" width="400" height="50" fill="none"/><g fill="#2c7be5"><rect x="110" y="262" width="20" height="40" rx="3"/><rect x="510" y="262" width="20" height="40" rx="3"/><rect x="130" y="270" width="380" height="8" rx="3" opacity=".55"/></g>
        <g><rect x="270" y="250" width="100" height="56" rx="8" fill="#2c7be5"/><rect x="278" y="258" width="38" height="46" rx="3" fill="#1e63c0"/><rect x="324" y="258" width="38" height="46" rx="3" fill="#1e63c0"/><rect x="298" y="226" width="44" height="22" rx="4" fill="#fff"/><text x="320" y="243" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="16" fill="#2c3e50">24</text></g>
        <g fill="#f45b8d"><circle cx="190" cy="294" r="7"/><circle cx="214" cy="300" r="7"/><circle cx="238" cy="294" r="7"/></g><g fill="#ffd23f"><circle cx="410" cy="296" r="7"/><circle cx="434" cy="302" r="7"/><circle cx="458" cy="296" r="7"/></g>` +
        tree(60, 290, 1.1) + tree(590, 290, 1.1);
    }
  };

  function svg(type, label) {
    const fn = SCENES[type] || SCENES.street;
    const cap = label ? `<g><rect x="0" y="${H - 54}" width="${W}" height="54" fill="#0b1226" opacity=".72"/><text x="24" y="${H - 20}" font-family="Be Vietnam Pro,sans-serif" font-weight="800" font-size="26" fill="#fff">${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></g>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${fn()}${cap}</svg>`;
  }
  window.landmarkArt = function (type, label) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(type, label));
  };
  window.LM_TYPES = ['market', 'pagoda', 'parkgate', 'pharmacy', 'bakery', 'busstop', 'school'];
})();
