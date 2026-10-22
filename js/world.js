/* WayHome 3D world (Three.js). One procedural city, many views (landing, setup, device, family, guide). */
(function () {
  const WH = (window.WH = window.WH || {});
  const T = THREE;
  const CITY = { G: 12, SP: 10, ROAD: 3.4, KM: 50 };
  WH.CITY = CITY;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const node = (i, j) => ({ x: (i - 6) * CITY.SP, z: (j - 6) * CITY.SP });
  WH.node = node;
  WH.HOME_NODE = [5, 6];
  WH.HOME_POS = { x: -15.2, z: -5.2 };
  WH.DOOR = { x: -13.85, z: -2.3 };
  WH.nearestNode = (x, z) => ({ i: clamp(Math.round(x / CITY.SP + 6), 0, CITY.G), j: clamp(Math.round(z / CITY.SP + 6), 0, CITY.G) });
  WH.STREETS_V = ['Shennan Ave', 'Binhe Ave', 'Jintian Rd', 'Caitian Rd', 'Hongli Rd', 'Fuhua Rd', 'Huaqiang Rd', 'Xinzhou Rd', 'Fumin Rd', 'Shangbu Rd', 'Binhai Ave', 'Xiangmihu Rd', 'Nonglin Rd'];
  WH.STREETS_H = ['Futian Rd', 'Zhenhua Rd', 'Chegongmiao Rd', 'Qiaoxiang Rd', 'Xinghe Rd', 'Zhongxin Rd', 'Fuzhong Rd', 'Yitian Rd', 'Huanggang Rd', 'Guangdian Rd', 'Bagua Rd', 'Shennan Mid Rd', 'Dongmen Rd'];

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ─────────── static city layout (same for every view) ─────────── */
  const PAL = [0xf5e6d3, 0xe8d5c4, 0xdfe7f0, 0xf0d9d9, 0xd9e8d9, 0xf3ead2, 0xcfd8e3, 0xe6cfae, 0xf7f3ea, 0xd7c9e6];
  const LAYOUT = (function () {
    const r = rng(2026), G = CITY.G, SP = CITY.SP, blocks = [], lots = [], trees = [], lamps = [];
    for (let bi = 0; bi < G; bi++) for (let bj = 0; bj < G; bj++) {
      const cx = (bi + 0.5 - 6) * SP, cz = (bj + 0.5 - 6) * SP;
      const dc = Math.hypot(bi + 0.5 - 6, bj + 0.5 - 6);
      let kind = 'mid';
      if (bi === 4 && bj === 5) kind = 'home';
      else if (r() < 0.11 && dc > 1.6) kind = 'park';
      else if (dc < 3.2) kind = 'high';
      blocks.push({ bi, bj, cx, cz, kind });
      const half = (SP - CITY.ROAD) / 2;
      if (kind === 'park' || kind === 'home') continue;
      const base = kind === 'high' ? 2.6 : 1.1, spread = kind === 'high' ? 4.8 : 2.2;
      const layout = r();
      const col = () => PAL[Math.floor(r() * PAL.length)];
      if (layout < 0.25) {
        lots.push({ x: cx, z: cz, w: 4.6 + r() * 1.1, d: 4.6 + r() * 1.1, h: base + r() * spread * 1.3, c: col() });
      } else if (layout < 0.55) {
        const horiz = r() < 0.5;
        for (let k = -1; k <= 1; k += 2) if (r() < 0.92) lots.push({ x: cx + (horiz ? 0 : k * 1.6), z: cz + (horiz ? k * 1.6 : 0), w: horiz ? 5.2 : 2.7, d: horiz ? 2.7 : 5.2, h: base + r() * spread, c: col() });
      } else {
        for (let a = -1; a <= 1; a += 2) for (let b = -1; b <= 1; b += 2) if (r() < 0.86) lots.push({ x: cx + a * 1.6, z: cz + b * 1.6, w: 2.6 + r() * 0.3, d: 2.6 + r() * 0.3, h: base * 0.8 + r() * spread, c: col() });
      }
      // trees along the kerb
      for (let s = -half + 0.5; s <= half - 0.4; s += 2.2) {
        [[s, -half + 0.35], [s, half - 0.35], [-half + 0.35, s], [half - 0.35, s]].forEach((p) => { if (r() < 0.42) trees.push({ x: cx + p[0], z: cz + p[1], s: 0.8 + r() * 0.6 }); });
      }
    }
    for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) {
      if ((i + j) % 2 === 0) { const n = node(i, j); lamps.push({ x: n.x + 1.9, z: n.z + 1.9 }); }
    }
    // park trees
    blocks.filter((b) => b.kind === 'park').forEach((b) => { for (let k = 0; k < 9; k++) trees.push({ x: b.cx + (r() - 0.5) * 5.6, z: b.cz + (r() - 0.5) * 5.6, s: 1 + r() * 0.8 }); });
    // home garden trees
    trees.push({ x: -18.2, z: -2.2, s: 1.3 }, { x: -11.9, z: -8.0, s: 1.1 }, { x: -18.4, z: -8.0, s: 1.2 });
    return { blocks, lots, trees, lamps };
  })();

  /* ─────────── textures ─────────── */
  let TEX = null;
  function textures() {
    if (TEX) return TEX;
    const rnd = rng(9);
    const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.anisotropy = 4; return t; };
    const wall = mk(256, 256, (g, w, h) => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      for (let fy = 0; fy < 4; fy++) for (let fx = 0; fx < 3; fx++) {
        const x = fx * 85.3 + 16, y = fy * 64 + 14;
        g.fillStyle = '#5d83ad'; g.fillRect(x, y, 52, 36);
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, 52, 7);
        g.fillStyle = '#cfd6de'; g.fillRect(x - 3, y + 36, 58, 4);
      }
    });
    wall.wrapS = wall.wrapT = T.RepeatWrapping;
    const glow = mk(256, 256, (g, w, h) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      for (let fy = 0; fy < 4; fy++) for (let fx = 0; fx < 3; fx++) {
        if (rnd() < 0.62) { g.fillStyle = rnd() < 0.7 ? '#ffd27a' : '#ffe9b5'; g.fillRect(fx * 85.3 + 16, fy * 64 + 14, 52, 36); }
      }
    });
    glow.wrapS = glow.wrapT = T.RepeatWrapping;
    const dash = mk(8, 64, (g) => { g.clearRect(0, 0, 8, 64); g.fillStyle = '#f7f1d4'; g.fillRect(2, 8, 4, 30); });
    dash.wrapS = dash.wrapT = T.RepeatWrapping;
    const chev = mk(128, 64, (g) => {
      g.clearRect(0, 0, 128, 64); g.strokeStyle = '#fff'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(30, 12); g.lineTo(62, 32); g.lineTo(30, 52); g.stroke();
    });
    chev.wrapS = chev.wrapT = T.RepeatWrapping;
    const grad = mk(4, 128, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.62)');
      g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
    });
    TEX = { wall, glow, dash, chev, grad };
    return TEX;
  }

  /* ─────────── geometry helpers ─────────── */
  function BoxBuf() { return { p: [], n: [], uv: [], c: [] }; }
  function pushBox(b, cx, y0, cz, w, h, d, color, rand) {
    const x0 = cx - w / 2, x1 = cx + w / 2, y1 = y0 + h, z0 = cz - d / 2, z1 = cz + d / 2;
    const col = new T.Color(color), top = col.clone().multiplyScalar(1.07);
    const TU = 2.4, TV = 3.6, off = rand ? rand() : 0;
    const face = (v, n, uw, c, topFace) => {
      const uvs = topFace ? [[0.02, 0.02], [0.02, 0.02], [0.02, 0.02], [0.02, 0.02]] : [[off, 0], [off + uw / TU, 0], [off + uw / TU, h / TV], [off, h / TV]];
      [0, 1, 2, 0, 2, 3].forEach((k) => {
        b.p.push(v[k][0], v[k][1], v[k][2]); b.n.push(n[0], n[1], n[2]); b.uv.push(uvs[k][0], uvs[k][1]); b.c.push(c.r, c.g, c.b);
      });
    };
    face([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], d, col);
    face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], d, col);
    face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], w, col);
    face([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], w, col);
    face([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], 0, top, true);
  }
  function bufToMesh(b, mat) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(b.p, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(b.n, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(b.uv, 2));
    g.setAttribute('color', new T.Float32BufferAttribute(b.c, 3));
    return new T.Mesh(g, mat);
  }
  const lam = (c, o) => new T.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  function box(w, h, d, color, x, y, z, o) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), lam(color, o)); m.position.set(x || 0, y || 0, z || 0); return m; }
  function cyl(rt, rb, h, color, x, y, z, seg, o) { const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 12), lam(color, o)); m.position.set(x || 0, y || 0, z || 0); return m; }
  function sph(r, color, x, y, z, o) { const m = new T.Mesh(new T.SphereGeometry(r, 16, 12), lam(color, o)); m.position.set(x || 0, y || 0, z || 0); return m; }

  function labelSprite(text, opt) {
    opt = opt || {};
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const g = c.getContext('2d');
    g.font = '800 46px "Be Vietnam Pro", Segoe UI, sans-serif';
    const tw = Math.min(480, g.measureText(text).width + 70);
    const x = (512 - tw) / 2;
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.roundRect ? g.roundRect(x + 2, 24, tw, 78, 39) : g.rect(x + 2, 24, tw, 78); g.fill();
    g.fillStyle = opt.bg || '#20305f'; g.beginPath(); g.roundRect ? g.roundRect(x, 18, tw, 78, 39) : g.rect(x, 18, tw, 78); g.fill();
    g.strokeStyle = opt.ring || 'rgba(255,255,255,.55)'; g.lineWidth = 4; g.stroke();
    g.fillStyle = opt.fg || '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 256, 58, 440);
    const tex = new T.CanvasTexture(c);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    sp.renderOrder = 30; sp.userData.aspect = 4; sp.userData.k = opt.k || 1;
    return sp;
  }
  WH.labelSprite = labelSprite;

  /* ─────────── landmark / home models ─────────── */
  function buildLandmark(type) {
    const g = new T.Group();
    const add = (m) => { g.add(m); return m; };
    switch (type) {
      case 'market': {
        add(box(2.6, 0.12, 1.8, 0xd8c7a3, 0, 0.06, 0));
        for (let i = 0; i < 4; i++) add(box(0.62, 0.06, 1.0, i % 2 ? 0xffffff : 0xe2483d, -0.95 + i * 0.64, 1.25 - 0.12 * (i % 2), 0.1, {}));
        [[-1.15, -0.3], [1.15, -0.3], [-1.15, 0.5], [1.15, 0.5]].forEach((p) => add(cyl(0.04, 0.04, 1.3, 0x6b4a2b, p[0], 0.65, p[1], 6)));
        add(box(2.3, 0.45, 0.5, 0x8a5a33, 0, 0.35, 0.2));
        [0xff7a2f, 0xe2483d, 0x7bc043, 0xffd23f, 0xff7a2f].forEach((c, i) => add(sph(0.14, c, -0.9 + i * 0.45, 0.68, 0.2)));
        break; }
      case 'pagoda': {
        add(box(2.2, 0.2, 2.2, 0xb9ae98, 0, 0.1, 0));
        for (let i = 0; i < 4; i++) {
          const w = 1.5 - i * 0.28, y = 0.2 + i * 0.62;
          add(box(w * 0.8, 0.4, w * 0.8, 0xc0392b, 0, y + 0.2, 0));
          const roof = add(new T.Mesh(new T.ConeGeometry(w * 0.95, 0.38, 4), lam(0x2c3e50))); roof.rotation.y = Math.PI / 4; roof.position.y = y + 0.57;
        }
        add(cyl(0.03, 0.03, 0.5, 0xf1c40f, 0, 3.0, 0, 6)); add(sph(0.08, 0xf1c40f, 0, 3.28, 0));
        break; }
      case 'parkgate': {
        add(box(0.38, 2.2, 0.38, 0xd6ccb8, -1.3, 1.1, 0)); add(box(0.38, 2.2, 0.38, 0xd6ccb8, 1.3, 1.1, 0));
        add(box(3.2, 0.34, 0.4, 0x2e7d4f, 0, 2.3, 0)); add(box(2.2, 0.5, 0.3, 0x2e7d4f, 0, 2.7, 0));
        const arch = add(new T.Mesh(new T.TorusGeometry(1.3, 0.1, 8, 24, Math.PI), lam(0x2e7d4f))); arch.position.y = 2.0;
        [-1.9, 1.9].forEach((x) => { add(cyl(0.08, 0.1, 0.6, 0x7a5638, x, 0.3, 0.3, 6)); add(sph(0.55, 0x3f9b55, x, 1.0, 0.3)); });
        break; }
      case 'pharmacy': {
        add(box(2.4, 1.8, 1.8, 0xf4f1ea, 0, 0.9, 0)); add(box(2.5, 0.5, 1.9, 0x17a773, 0, 2.05, 0));
        add(box(0.34, 1.1, 0.12, 0x17a773, 0, 2.8, 0.95, { emissive: 0x0b6b48 })); add(box(1.1, 0.34, 0.12, 0x17a773, 0, 2.8, 0.95, { emissive: 0x0b6b48 }));
        add(box(0.7, 1.1, 0.05, 0x7a5638, 0.6, 0.55, 0.93)); add(box(0.9, 0.7, 0.05, 0xbfe3f5, -0.6, 0.9, 0.93, { emissive: 0x335566 }));
        break; }
      case 'bakery': {
        add(box(2.4, 1.7, 1.8, 0xf6d9b0, 0, 0.85, 0)); add(box(2.5, 0.42, 1.9, 0x8c4a2f, 0, 1.9, 0));
        for (let i = 0; i < 6; i++) add(box(0.42, 0.06, 0.8, i % 2 ? 0xffffff : 0xf0883e, -1.05 + i * 0.42, 1.45, 1.1));
        add(box(0.6, 1.0, 0.05, 0x6b4226, 0.7, 0.5, 0.93)); add(sph(0.22, 0xd98a3d, -0.6, 0.55, 1.0, { emissive: 0x3a2000 }));
        add(cyl(0.18, 0.18, 0.9, 0xb9472f, 0.95, 2.45, -0.5, 8));
        break; }
      case 'busstop': {
        add(box(2.2, 0.08, 1.0, 0x2c3e50, 0, 1.7, 0)); add(box(0.06, 1.7, 0.06, 0x2c3e50, -1.0, 0.85, -0.4)); add(box(0.06, 1.7, 0.06, 0x2c3e50, 1.0, 0.85, -0.4));
        add(box(2.0, 1.4, 0.04, 0xbfe3f5, 0, 0.9, -0.45, { transparent: true, opacity: 0.45 })); add(box(1.4, 0.1, 0.4, 0x8a5a33, 0, 0.45, -0.2));
        add(cyl(0.04, 0.04, 2.6, 0x7b8794, 1.5, 1.3, 0.3, 6)); add(box(0.7, 0.7, 0.06, 0x2c7be5, 1.5, 2.7, 0.3, { emissive: 0x0a2f6b }));
        break; }
      case 'school': {
        add(box(2.9, 1.5, 1.7, 0xf0e3c2, 0, 0.75, 0)); const rf = add(new T.Mesh(new T.ConeGeometry(2.1, 0.8, 4), lam(0xb5533c))); rf.rotation.y = Math.PI / 4; rf.position.y = 1.9; rf.scale.z = 0.6;
        add(box(0.5, 0.9, 0.05, 0x7a5638, 0, 0.45, 0.88)); add(cyl(0.03, 0.03, 2.2, 0x7b8794, 1.3, 2.0, 0, 6)); add(box(0.5, 0.3, 0.03, 0xe2483d, 1.55, 2.9, 0));
        break; }
      default: add(box(1.6, 1.4, 1.4, 0xe8d5c4, 0, 0.7, 0)); add(box(1.7, 0.2, 1.5, 0xb5533c, 0, 1.5, 0));
    }
    return g;
  }

  function buildHome() {
    const g = new T.Group();
    const add = (m) => { g.add(m); return m; };
    add(box(6.0, 0.14, 6.0, 0xb7e0a2, 0, 0.07, 0));                       // lawn
    add(box(3.8, 2.4, 3.0, 0xf6e7c8, 0, 1.35, -0.2));                     // house
    const roof = add(new T.Mesh(new T.ConeGeometry(3.3, 1.5, 4), lam(0xb5533c))); roof.rotation.y = Math.PI / 4; roof.position.set(0, 3.3, -0.2); roof.scale.set(1.0, 1, 0.82);
    add(box(0.5, 1.0, 0.5, 0xa04a35, 1.1, 3.6, -0.5));                    // chimney
    add(box(0.8, 1.5, 0.06, 0x7a5638, 0.5, 0.9, 1.34)); add(sph(0.06, 0xffd23f, 0.78, 0.9, 1.4));
    [-1.1, 1.3].forEach((x) => add(box(0.8, 0.7, 0.06, 0xffe7a8, x, 1.6, 1.34, { emissive: 0xaa7a22 })));
    add(box(0.8, 0.7, 0.06, 0xffe7a8, -0.2, 2.35, 1.34, { emissive: 0xaa7a22 }));
    // blue gate + fence
    for (let k = 0; k < 9; k++) add(box(0.1, 0.7, 0.08, 0x2c7be5, -2.6 + k * 0.58, 0.45, 2.7));
    add(box(5.4, 0.08, 0.08, 0x2c7be5, 0, 0.72, 2.7)); add(box(1.0, 1.0, 0.1, 0x1e63c0, 1.35, 0.6, 2.72));
    add(box(0.5, 0.35, 0.08, 0xffffff, 1.35, 1.45, 2.72));
    [[-2.3, 1.8, 0xf45b8d], [-1.7, 2.1, 0xf45b8d], [-1.1, 1.9, 0xffd23f], [2.3, 1.9, 0xffd23f], [2.5, 1.3, 0xf45b8d]].forEach((p) => add(sph(0.16, p[2], p[0], 0.25, p[1])));
    add(cyl(0.05, 0.05, 0.7, 0x6b4a2b, -2.6, 0.45, 1.2, 6)); add(box(0.3, 0.2, 0.2, 0xe2483d, -2.6, 0.85, 1.2));
    return g;
  }

  function buildFigure() {
    const g = new T.Group();
    const body = new T.Group(); g.add(body);
    const coat = cyl(0.26, 0.3, 0.62, 0x2ec4b6, 0, 0.88, 0, 10); body.add(coat);
    body.add(sph(0.22, 0xf1c9a0, 0, 1.36, 0));
    const hair = sph(0.235, 0xf2f2f2, 0, 1.43, -0.02); hair.scale.set(1, 0.7, 1); body.add(hair);
    const mkLeg = (x) => { const lg = new T.Group(); lg.position.set(x, 0.58, 0); const m = box(0.15, 0.56, 0.17, 0x35456b, 0, -0.28, 0); lg.add(m); const sh = box(0.17, 0.08, 0.26, 0x2a2a2a, 0, -0.58, 0.04); lg.add(sh); return lg; };
    const lL = mkLeg(-0.11), lR = mkLeg(0.11); g.add(lL, lR);
    const mkArm = (x) => { const a = new T.Group(); a.position.set(x, 1.12, 0); a.add(box(0.1, 0.46, 0.1, 0x2ec4b6, 0, -0.22, 0)); return a; };
    const aL = mkArm(-0.33), aR = mkArm(0.33); g.add(aL, aR);
    const cane = cyl(0.025, 0.025, 0.9, 0x7a5638, 0.42, 0.45, 0.08, 6); g.add(cane);
    g.userData = { lL, lR, aL, aR, body, cane };
    return g;
  }

  /* ─────────── the World ─────────── */
  const ALL = [];
  class World {
    constructor(el, opts) {
      opts = opts || {};
      this.el = el; this.opts = opts;
      this.mode = opts.mode || 'orbit';
      this.forceNight = opts.night === undefined ? null : opts.night;
      this.autoRotate = !!opts.autoRotate;
      this.renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      this.renderer.domElement.className = 'world-canvas';
      el.appendChild(this.renderer.domElement);
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera(opts.fov || 50, 1, 0.5, 700);
      this.cam = { tx: -15, tz: -4, ty: 0, az: 0.9, pol: 1.0, dist: opts.dist || 52 };
      this.camT = Object.assign({}, this.cam);
      this.night = 0; this.nightT = 0;
      this.rZone = 30; this.zoneCol = new T.Color(0x3aa0ff);
      this.heading = 0; this.pickEnabled = false; this.onPick = null; this.hover = null;
      this.drag = null; this.idle = 0; this.t = 0;
      this.landmarkObjs = []; this.pos = { x: 0, z: 0 };
      this._build();
      this._bindInput();
      this._resize();
      if (window.ResizeObserver) new ResizeObserver(() => this._resize()).observe(el);
      ALL.push(this);
    }

    _build() {
      const sc = this.scene, TX = textures();
      this.hemi = new T.HemisphereLight(0xffffff, 0xb9c4d4, 0.95); sc.add(this.hemi);
      this.sun = new T.DirectionalLight(0xfff0d6, 0.85); this.sun.position.set(-40, 70, 30); sc.add(this.sun);
      this.moon = new T.DirectionalLight(0x7fa0ff, 0); this.moon.position.set(30, 60, -20); sc.add(this.moon);

      // ground + roads
      const ground = new T.Mesh(new T.PlaneGeometry(900, 900), lam(0xcfe3bf)); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; sc.add(ground); this.ground = ground;
      const roadMat = lam(0x59606c), G = CITY.G, SP = CITY.SP, LEN = G * SP + CITY.ROAD;
      this.roadMat = roadMat;
      for (let i = 0; i <= G; i++) {
        const v = new T.Mesh(new T.BoxGeometry(CITY.ROAD, 0.05, LEN), roadMat); v.position.set((i - 6) * SP, 0.02, 0); sc.add(v);
        const h = new T.Mesh(new T.BoxGeometry(LEN, 0.05, CITY.ROAD), roadMat); h.position.set(0, 0.021, (i - 6) * SP); sc.add(h);
      }
      const dashMat = new T.MeshBasicMaterial({ map: TX.dash, transparent: true, depthWrite: false });
      for (let i = 0; i <= G; i++) {
        const t1 = TX.dash.clone(); t1.needsUpdate = true; t1.repeat.set(1, LEN / 2.2);
        const m1 = new T.MeshBasicMaterial({ map: t1, transparent: true, depthWrite: false });
        const v = new T.Mesh(new T.PlaneGeometry(0.34, LEN), m1); v.rotation.x = -Math.PI / 2; v.position.set((i - 6) * SP, 0.052, 0); sc.add(v);
        const t2 = TX.dash.clone(); t2.needsUpdate = true; t2.repeat.set(1, LEN / 2.2);
        const m2 = new T.MeshBasicMaterial({ map: t2, transparent: true, depthWrite: false });
        const h = new T.Mesh(new T.PlaneGeometry(0.34, LEN), m2); h.rotation.x = -Math.PI / 2; h.rotation.z = Math.PI / 2; h.position.set(0, 0.053, (i - 6) * SP); sc.add(h);
      }

      // blocks (slabs) merged with buildings
      this.bMat = new T.MeshLambertMaterial({ vertexColors: true, map: TX.wall, emissiveMap: TX.glow, emissive: 0x000000 });
      this.slabMat = new T.MeshLambertMaterial({ vertexColors: true });
      const sb = BoxBuf(), half = SP - CITY.ROAD;
      LAYOUT.blocks.forEach((b) => {
        const col = b.kind === 'park' ? 0xa5d68f : b.kind === 'home' ? 0xbfe4a6 : 0xe4dfd2;
        pushBox(sb, b.cx, 0, b.cz, half, 0.1, half, col);
      });
      this.scene.add(bufToMesh(sb, this.slabMat));
      this.buildGroup = new T.Group(); sc.add(this.buildGroup);
      this.rebuildBuildings();

      // parks: ponds
      LAYOUT.blocks.filter((b) => b.kind === 'park').forEach((b, k) => {
        if (k % 2 === 0) { const p = new T.Mesh(new T.CircleGeometry(1.7, 24), new T.MeshLambertMaterial({ color: 0x6cc0e8 })); p.rotation.x = -Math.PI / 2; p.position.set(b.cx + 0.6, 0.13, b.cz - 0.4); p.scale.set(1.2, 0.8, 1); sc.add(p); }
      });

      // trees (instanced)
      const nT = LAYOUT.trees.length;
      const trunk = new T.InstancedMesh(new T.CylinderGeometry(0.09, 0.13, 0.8, 6), lam(0x7a5638), nT);
      const crown = new T.InstancedMesh(new T.IcosahedronGeometry(0.62, 0), lam(0xffffff), nT);
      const m4 = new T.Matrix4(), q = new T.Quaternion(), sc3 = new T.Vector3(), pv = new T.Vector3(), col = new T.Color();
      const greens = [0x3f9b55, 0x4aa860, 0x378f4d, 0x5dbb63, 0x2f8a52];
      LAYOUT.trees.forEach((t, i) => {
        sc3.set(t.s, t.s, t.s); pv.set(t.x, 0.4 * t.s + 0.1, t.z); m4.compose(pv, q, sc3); trunk.setMatrixAt(i, m4);
        pv.set(t.x, 1.15 * t.s + 0.1, t.z); m4.compose(pv, q, sc3); crown.setMatrixAt(i, m4); crown.setColorAt(i, col.setHex(greens[i % greens.length]));
      });
      sc.add(trunk, crown);

      // street lamps
      const nL = LAYOUT.lamps.length;
      const pole = new T.InstancedMesh(new T.CylinderGeometry(0.05, 0.06, 1.9, 6), lam(0x4a5260), nL);
      this.bulbMat = new T.MeshBasicMaterial({ color: 0xdfe6ee });
      const bulb = new T.InstancedMesh(new T.SphereGeometry(0.17, 8, 6), this.bulbMat, nL);
      LAYOUT.lamps.forEach((l, i) => {
        m4.compose(pv.set(l.x, 0.95, l.z), q, sc3.set(1, 1, 1)); pole.setMatrixAt(i, m4);
        m4.compose(pv.set(l.x, 1.95, l.z), q, sc3.set(1, 1, 1)); bulb.setMatrixAt(i, m4);
      });
      sc.add(pole, bulb);

      // cars
      this.cars = [];
      const r = rng(77), carCols = [0xe2483d, 0x2c7be5, 0xf4b942, 0xffffff, 0x2ec4b6, 0x6b4eff, 0x222a35];
      for (let k = 0; k < 22; k++) {
        const g = new T.Group();
        g.add(box(0.95, 0.34, 0.52, carCols[k % carCols.length], 0, 0.3, 0)); g.add(box(0.5, 0.28, 0.46, 0xcfe8ff, -0.05, 0.58, 0));
        g.add(box(0.05, 0.12, 0.38, 0xfff3b0, 0.5, 0.32, 0, { emissive: 0xffe68a }));
        const axis = r() < 0.5 ? 'x' : 'z', line = Math.floor(r() * (G + 1)), dir = r() < 0.5 ? 1 : -1;
        const c = { g, axis, line, dir, off: 0.55 * dir, s: 2.2 + r() * 2.6, p: (r() - 0.5) * 110 };
        this.cars.push(c); sc.add(g);
      }
      // clouds
      this.clouds = [];
      for (let k = 0; k < 9; k++) {
        const g = new T.Group(); const m = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
        for (let s = 0; s < 4; s++) { const p = new T.Mesh(new T.SphereGeometry(3 + r() * 2.5, 10, 8), m); p.position.set(s * 4 - 6 + r() * 2, r() * 1.5, r() * 3); p.scale.y = 0.55; g.add(p); }
        g.position.set((r() - 0.5) * 220, 38 + r() * 14, (r() - 0.5) * 220); this.clouds.push(g); sc.add(g);
      }

      // home
      this.home = buildHome(); this.home.position.set(WH.HOME_POS.x, 0.05, WH.HOME_POS.z); sc.add(this.home);
      const beam = new T.Mesh(new T.CylinderGeometry(0.5, 0.9, 60, 20, 1, true), new T.MeshBasicMaterial({ map: TX.grad, color: 0xffb03a, transparent: true, side: T.DoubleSide, depthWrite: false, opacity: 0.55 }));
      beam.position.set(WH.HOME_POS.x, 30, WH.HOME_POS.z); sc.add(beam); this.homeBeam = beam;
      this.homeLabel = labelSprite('HOME', { bg: '#f59e0b', fg: '#fff', ring: '#fff' }); this.homeLabel.position.set(WH.HOME_POS.x, 6.3, WH.HOME_POS.z); sc.add(this.homeLabel);

      // Shenzhen street signs + district banner
      this.streetLabels = [];
      for (let i = 0; i <= CITY.G; i++) {
        const v = labelSprite(WH.STREETS_V[i], { bg: '#0f766e', k: 0.8 }); v.position.set((i - 6) * CITY.SP, 1.6, -63); sc.add(v); this.streetLabels.push(v);
        const h = labelSprite(WH.STREETS_H[i], { bg: '#0f766e', k: 0.8 }); h.position.set(-66, 1.6, (i - 6) * CITY.SP); sc.add(h); this.streetLabels.push(h);
      }
      this.cityLabel = labelSprite('SHENZHEN · FUTIAN 深圳 福田', { bg: '#b91c1c', k: 1.3 }); this.cityLabel.position.set(0, 12, -70); sc.add(this.cityLabel);
      // landmarks group
      this.lmGroup = new T.Group(); sc.add(this.lmGroup); this.rebuildLandmarks();

      // safe zone
      this.zoneGroup = new T.Group(); sc.add(this.zoneGroup);
      this.domeMat = new T.MeshBasicMaterial({ map: TX.grad, color: 0x3aa0ff, transparent: true, side: T.DoubleSide, depthWrite: false, opacity: 0.8 });
      this.dome = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 120, 1, true), this.domeMat); this.dome.position.y = 0.5;
      this.floorMat = new T.MeshBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0.16, depthWrite: false });
      this.floor = new T.Mesh(new T.CircleGeometry(1, 96), this.floorMat); this.floor.rotation.x = -Math.PI / 2; this.floor.position.y = 0.16;
      this.ringMat = new T.MeshBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0.95, depthWrite: false });
      this.ring = new T.Mesh(new T.RingGeometry(0.984, 1, 160), this.ringMat); this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.2;
      this.ring2Mat = new T.MeshBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0.4, depthWrite: false });
      this.ring2 = new T.Mesh(new T.RingGeometry(0.985, 1, 160), this.ring2Mat); this.ring2.rotation.x = -Math.PI / 2; this.ring2.position.y = 0.22;
      this.bandMat = new T.MeshBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0.3, depthWrite: false });
      this.band = new T.Mesh(new T.RingGeometry(0.93, 1, 160), this.bandMat); this.band.rotation.x = -Math.PI / 2; this.band.position.y = 0.18;
      this.zoneGroup.add(this.dome, this.floor, this.band, this.ring, this.ring2);
      this.zoneGroup.position.set(WH.HOME_POS.x, 0, WH.HOME_POS.z);

      // route + trail + crossing
      this.routeGroup = new T.Group(); sc.add(this.routeGroup); this.routeTex = [];
      this.trailGeo = new T.BufferGeometry(); this.trailMax = 700; this.trailArr = new Float32Array(this.trailMax * 3);
      this.trailGeo.setAttribute('position', new T.BufferAttribute(this.trailArr, 3)); this.trailGeo.setDrawRange(0, 0);
      const dotC = document.createElement('canvas'); dotC.width = dotC.height = 64; const dg = dotC.getContext('2d'); dg.fillStyle = '#fff'; dg.beginPath(); dg.arc(32, 32, 28, 0, 7); dg.fill();
      this.trailPts = new T.Points(this.trailGeo, new T.PointsMaterial({ color: 0xffb020, size: 0.5, map: new T.CanvasTexture(dotC), alphaTest: 0.4, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false }));
      this.trailPts.frustumCulled = false; sc.add(this.trailPts);
      this.crossG = new T.Group(); this.crossG.visible = false; sc.add(this.crossG);
      for (let a = 0; a < 4; a++) for (let s = 0; s < 6; s++) {
        const st = box(0.6, 0.02, 2.4, 0xf8f8f2, 0, 0.065, 0); const ang = a * Math.PI / 2; const off = 2.4;
        const lx = (s - 2.5) * 0.52, lz = off;
        st.position.set(lx * Math.cos(ang) - lz * Math.sin(ang), 0.065, lx * Math.sin(ang) + lz * Math.cos(ang)); st.rotation.y = ang; this.crossG.add(st);
      }
      const lp = cyl(0.06, 0.06, 2.4, 0x333a44, 2.2, 1.2, 2.2, 6); const lb = box(0.4, 1.1, 0.34, 0x20252d, 2.2, 2.55, 2.2);
      this.lightR = sph(0.12, 0xff3b3b, 2.2, 2.9, 2.42, { emissive: 0xff2020 }); this.lightG = sph(0.12, 0x2cf07a, 2.2, 2.4, 2.42, { emissive: 0x10a040 });
      this.crossG.add(lp, lb, this.lightR, this.lightG);
      this.setLight('red');

      // avatar
      this.av = new T.Group(); sc.add(this.av);
      this.figure = buildFigure(); this.av.add(this.figure);
      this.pinMat = new T.MeshBasicMaterial({ color: 0x2ee6a8 });
      this.pin = new T.Group(); const cone = new T.Mesh(new T.ConeGeometry(0.34, 0.8, 12), this.pinMat); cone.rotation.x = Math.PI; cone.position.y = 0.4;
      const ball = new T.Mesh(new T.SphereGeometry(0.38, 16, 12), this.pinMat); ball.position.y = 1.05; this.pin.add(cone, ball);
      const dot = new T.Mesh(new T.SphereGeometry(0.15, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff })); dot.position.y = 1.05; dot.position.z = 0.28; this.pin.add(dot);
      this.av.add(this.pin);
      this.pulseMat = new T.MeshBasicMaterial({ color: 0x2ee6a8, transparent: true, opacity: 0.5, depthWrite: false, side: T.DoubleSide });
      this.pulse = new T.Mesh(new T.RingGeometry(0.85, 1, 48), this.pulseMat); this.pulse.rotation.x = -Math.PI / 2; this.pulse.position.y = 0.25; sc.add(this.pulse);
      this.discMat = new T.MeshBasicMaterial({ color: 0x2ee6a8, transparent: true, opacity: 0.35, depthWrite: false });
      this.disc = new T.Mesh(new T.CircleGeometry(0.8, 32), this.discMat); this.disc.rotation.x = -Math.PI / 2; this.disc.position.y = 0.23; sc.add(this.disc);
      this.avLabel = labelSprite('YOU', { bg: '#10b981', fg: '#fff' }); sc.add(this.avLabel);

      // pick ghost
      this.ghost = new T.Group(); this.ghost.visible = false;
      const gr = new T.Mesh(new T.RingGeometry(1.0, 1.35, 40), new T.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.9, depthWrite: false, side: T.DoubleSide })); gr.rotation.x = -Math.PI / 2; gr.position.y = 0.3;
      const gd = new T.Mesh(new T.OctahedronGeometry(0.55), new T.MeshBasicMaterial({ color: 0xa78bfa })); gd.position.y = 2.2;
      this.ghost.add(gr, gd); sc.add(this.ghost); this.ghostDiamond = gd;
    }

    rebuildBuildings() {
      this.buildGroup.children.slice().forEach((c) => { this.buildGroup.remove(c); c.geometry && c.geometry.dispose(); });
      const S = WH.S, lms = (S && S.landmarks) || [], b = BoxBuf(), rand = rng(5);
      LAYOUT.lots.forEach((l) => {
        for (const m of lms) { const p = WH.lmPos(m); if (Math.abs(p.x - l.x) < l.w / 2 + 1.5 && Math.abs(p.z - l.z) < l.d / 2 + 1.5) return; }
        pushBox(b, l.x, 0.1, l.z, l.w, l.h, l.d, l.c, rand);
      });
      this.buildGroup.add(bufToMesh(b, this.bMat));
    }

    rebuildLandmarks() {
      while (this.lmGroup.children.length) this.lmGroup.remove(this.lmGroup.children[0]);
      this.landmarkObjs = [];
      const S = WH.S; if (!S) return;
      S.landmarks.forEach((m) => {
        const g = new T.Group(), p = WH.lmPos(m);
        g.position.set(p.x, 0.1, p.z);
        g.add(buildLandmark(m.type));
        const d = new T.Mesh(new T.OctahedronGeometry(0.45), new T.MeshBasicMaterial({ color: 0xa78bfa })); d.position.y = 4.2; g.add(d);
        const lab = labelSprite(m.name, { bg: '#6d4fe0', k: 0.9 }); lab.position.y = 5.4; g.add(lab);
        this.lmGroup.add(g); this.landmarkObjs.push({ g, d, lab, m });
      });
      this.rebuildBuildings();
    }

    setNight(v) { this.nightT = v ? 1 : 0; }
    setLight(c) { if (!this.lightR) return; this.lightR.visible = c === 'red'; this.lightG.visible = c === 'green'; }
    setCrossing(n, on) { if (!n || !on) { this.crossG.visible = false; return; } const p = WH.node(n.i, n.j); this.crossG.position.set(p.x, 0, p.z); this.crossG.visible = true; }
    setPick(on, cb) { this.pickEnabled = !!on; this.onPick = cb || null; this.ghost.visible = false; this.el.style.cursor = on ? 'crosshair' : ''; }

    setRoute(pts) {
      while (this.routeGroup.children.length) this.routeGroup.remove(this.routeGroup.children[0]);
      this.routeTex = [];
      if (!pts || pts.length < 2) return;
      const TX = textures();
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
        if (len < 0.05) continue;
        const tex = TX.chev.clone(); tex.needsUpdate = true; tex.repeat.set(len / 1.3, 1);
        const m = new T.Mesh(new T.PlaneGeometry(len, 0.95), new T.MeshBasicMaterial({ map: tex, color: 0x22d3ee, transparent: true, depthWrite: false }));
        const glow = new T.Mesh(new T.PlaneGeometry(len + 0.3, 1.5), new T.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.4, depthWrite: false }));
        const grp = new T.Group(); grp.rotation.order = 'YXZ'; grp.rotation.y = Math.atan2(-dz, dx); grp.position.set((a.x + b.x) / 2, 0.11, (a.z + b.z) / 2);
        m.rotation.x = -Math.PI / 2; glow.rotation.x = -Math.PI / 2; glow.position.y = -0.01; m.position.y = 0.01;
        grp.add(glow, m); this.routeGroup.add(grp); this.routeTex.push(tex);
      }
    }
    setTrail(pts) {
      const n = Math.min(pts.length, this.trailMax);
      for (let i = 0; i < n; i++) { const p = pts[pts.length - n + i]; this.trailArr[i * 3] = p.x; this.trailArr[i * 3 + 1] = 0.3; this.trailArr[i * 3 + 2] = p.z; }
      this.trailGeo.setDrawRange(0, n); this.trailGeo.attributes.position.needsUpdate = true;
    }

    snap() { this.heading = WH.S.heading; this._camera(100); this._camera(100); }
    setCam(o, instant) { Object.assign(this.camT, o); if (instant) Object.assign(this.cam, this.camT); }
    flyHome(d) { this.setCam({ tx: WH.HOME_POS.x, tz: WH.HOME_POS.z, az: 0.8, pol: 0.95, dist: d || 46 }); }

    /* input */
    _bindInput() {
      const el = this.renderer.domElement;
      el.style.touchAction = 'none';
      el.addEventListener('pointerdown', (e) => { if (this.mode === 'follow' && !this.opts.interactive) return; this.drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId }; el.setPointerCapture(e.pointerId); this.idle = 0; });
      el.addEventListener('pointermove', (e) => {
        if (this.drag) {
          const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
          this.drag.moved += Math.abs(dx) + Math.abs(dy); this.drag.x = e.clientX; this.drag.y = e.clientY;
          if (this.opts.interactive !== false && this.mode === 'orbit') {
            this.camT.az -= dx * 0.006; this.camT.pol = clamp(this.camT.pol - dy * 0.005, 0.25, 1.4);
          }
        } else if (this.pickEnabled) {
          const hit = this._pick(e.clientX, e.clientY);
          if (hit) { this.hover = hit; this.ghost.visible = true; const p = this._corner(hit.x, hit.z); this.ghost.position.set(p.x, 0.1, p.z); } else this.ghost.visible = false;
        }
      });
      el.addEventListener('pointerup', (e) => {
        const d = this.drag; this.drag = null;
        if (d && d.moved < 6 && this.pickEnabled && this.onPick) { const hit = this._pick(e.clientX, e.clientY); if (hit) this.onPick(this._cornerInfo(hit.x, hit.z)); }
      });
      el.addEventListener('wheel', (e) => { if (this.mode !== 'orbit' || this.opts.interactive === false) return; e.preventDefault(); this.camT.dist = clamp(this.camT.dist * (1 + Math.sign(e.deltaY) * 0.1), 14, 150); this.idle = 0; }, { passive: false });
    }
    _pick(cx, cy) {
      const r = this.renderer.domElement.getBoundingClientRect();
      const v = new T.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      const rc = new T.Raycaster(); rc.setFromCamera(v, this.camera);
      const pl = new T.Plane(new T.Vector3(0, 1, 0), 0), out = new T.Vector3();
      return rc.ray.intersectPlane(pl, out) ? { x: out.x, z: out.z } : null;
    }
    _cornerInfo(x, z) {
      const n = WH.nearestNode(x, z), p = WH.node(n.i, n.j);
      const sx = x >= p.x ? 1 : -1, sz = z >= p.z ? 1 : -1;
      return { i: n.i, j: n.j, sx, sz };
    }
    _corner(x, z) { const c = this._cornerInfo(x, z), p = WH.node(c.i, c.j); return { x: p.x + c.sx * 2.9, z: p.z + c.sz * 2.9 }; }

    _resize() {
      const w = this.el.clientWidth, h = this.el.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h, false);
      const cv = this.renderer.domElement; cv.style.width = '100%'; cv.style.height = '100%';
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    }
    visible() {
      if (!this.el.getClientRects().length) return false;
      const r = this.el.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 8;
    }

    frame(dt, t) {
      if (!this.visible()) return;
      if (this.renderer.domElement.width < 8) this._resize();
      const S = WH.S;
      this.t = t;
      // time of day
      const nt = this.forceNight === null ? (S.night ? 1 : 0) : (this.forceNight ? 1 : 0);
      this.night = lerp(this.night, nt, 1 - Math.pow(0.02, dt));
      const n = this.night;
      const sky = new T.Color(0xcfe6ff).lerp(new T.Color(0x0b1230), n);
      this.scene.background = sky;
      this.scene.fog = this.scene.fog || new T.Fog(sky, 90, 300);
      this.scene.fog.color.copy(sky); this.scene.fog.near = lerp(90, 40, n); this.scene.fog.far = lerp(320, 190, n);
      this.hemi.intensity = lerp(0.95, 0.38, n); this.hemi.color.setHex(n > 0.5 ? 0x7f95d6 : 0xffffff);
      this.sun.intensity = lerp(0.85, 0.0, n); this.moon.intensity = lerp(0, 0.55, n);
      this.ground.material.color.setRGB(lerp(0.81, 0.07, n), lerp(0.89, 0.12, n), lerp(0.75, 0.17, n));
      this.roadMat.color.setRGB(lerp(0.35, 0.12, n), lerp(0.38, 0.14, n), lerp(0.42, 0.18, n));
      this.bMat.emissive.setRGB(n, n * 0.85, n * 0.55);
      this.bulbMat.color.setRGB(lerp(0.87, 1, n), lerp(0.9, 0.86, n), lerp(0.93, 0.45, n));
      this.clouds.forEach((c) => { c.visible = n < 0.5 && this.mode === 'follow'; c.position.x += dt * 1.2; if (c.position.x > 130) c.position.x = -130; });

      // zone
      const effKm = S.night && S.curfewOn ? S.curfewKm : S.radiusKm;
      const rT = effKm * CITY.KM;
      this.rZone = lerp(this.rZone, rT, 1 - Math.pow(0.003, dt));
      const out = S.out;
      const tc = out ? new T.Color(0xff4d6d) : (n > 0.5 ? new T.Color(0x5ab0ff) : new T.Color(0x2f8cff));
      this.zoneCol.lerp(tc, 1 - Math.pow(0.01, dt));
      [this.domeMat, this.floorMat, this.ringMat, this.ring2Mat, this.bandMat].forEach((m) => m.color.copy(this.zoneCol));
      this.dome.scale.set(this.rZone, 7, this.rZone); this.floor.scale.set(this.rZone, this.rZone, 1); this.ring.scale.set(this.rZone, this.rZone, 1); this.band.scale.set(this.rZone, this.rZone, 1);
      const pulseK = 1 + (Math.sin(t * 2.2) * 0.5 + 0.5) * 0.012 * (out ? 2.5 : 1);
      this.ring2.scale.set(this.rZone * pulseK, this.rZone * pulseK, 1); this.ring2Mat.opacity = 0.25 + 0.25 * Math.sin(t * 2.2);
      this.domeMat.opacity = out ? 0.95 : 0.7;
      this.zoneGroup.visible = S.showZone !== false;
      this.homeBeam.material.opacity = 0.35 + 0.2 * Math.sin(t * 2);
      this.homeLabel.position.y = 6.3 + Math.sin(t * 2) * 0.25;

      // avatar
      const P = S.pos;
      this.av.position.set(P.x, 0.05, P.z);
      this.heading = this._angLerp(this.heading, S.heading, 1 - Math.pow(0.0005, dt));
      this.figure.rotation.y = this.heading;
      const u = this.figure.userData, mv = S.moving ? 1 : 0;
      const sw = Math.sin(t * 9) * 0.65 * mv;
      u.lL.rotation.x = sw; u.lR.rotation.x = -sw; u.aL.rotation.x = -sw * 0.8; u.aR.rotation.x = sw * 0.3; u.body.position.y = Math.abs(Math.sin(t * 9)) * 0.03 * mv;
      const camD = this.cam.dist;
      const fs = this.mode === 'follow' ? 1 : clamp(camD / 20, 1, 3.4);
      this.figure.scale.setScalar(fs);
      this.pin.visible = this.mode !== 'follow';
      this.pin.scale.setScalar(fs * 0.95); this.pin.position.y = 1.9 * fs + Math.sin(t * 3) * 0.12;
      const gc = S.gpsLost ? 0x9aa4b2 : (out ? 0xff4d6d : 0x2ee6a8);
      this.pinMat.color.setHex(gc); this.pulseMat.color.setHex(gc); this.discMat.color.setHex(gc);
      this.pulse.position.set(P.x, 0.25, P.z); this.disc.position.set(P.x, 0.23, P.z);
      const ph = (t * 0.9) % 1; const ps = (0.8 + ph * 2.6) * fs; this.pulse.scale.set(ps, ps, 1); this.pulseMat.opacity = (1 - ph) * 0.55;
      this.disc.scale.setScalar(fs);
      this.avLabel.visible = this.mode !== 'follow';
      this.avLabel.position.set(P.x, 3.7 * fs + 0.6, P.z);
      this._setAvLabel(S.gpsLost ? 'last seen' : (S.shortName || 'YOU'), S.gpsLost ? '#6b7280' : (out ? '#e11d48' : '#10b981'));

      // labels scale with distance, landmark anim
      const kk = clamp(camD * 0.034, 0.9, 4.2);
      const setS = (sp, f) => { sp.scale.set(kk * sp.userData.aspect * (f || 1) * 0.9, kk * (f || 1) * 0.9, 1); };
      setS(this.homeLabel); setS(this.avLabel, 0.9); setS(this.cityLabel, 1.4);
      this.streetLabels.forEach((l) => { setS(l, 0.55); l.visible = this.mode !== 'follow'; }); this.cityLabel.visible = this.mode !== 'follow';
      this.landmarkObjs.forEach((o, i) => { o.d.rotation.y = t * 1.5 + i; o.d.position.y = 4.2 + Math.sin(t * 2 + i) * 0.2; setS(o.lab, 0.8); o.lab.visible = this.mode !== 'follow' || camD > 20; });
      this.ghostDiamond.rotation.y = t * 2;

      // route animation
      this.routeTex.forEach((tx) => { tx.offset.x -= dt * 0.9; });
      // cars
      const G = CITY.G, SP = CITY.SP, LEN = G * SP + 12;
      this.cars.forEach((c) => {
        c.p += c.s * c.dir * dt; if (c.p > LEN / 2) c.p = -LEN / 2; if (c.p < -LEN / 2) c.p = LEN / 2;
        const l = (c.line - 6) * SP;
        if (c.axis === 'x') { c.g.position.set(c.p, 0.05, l + c.off); c.g.rotation.y = c.dir > 0 ? 0 : Math.PI; }
        else { c.g.position.set(l + c.off, 0.05, c.p); c.g.rotation.y = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
      });

      this._camera(dt);
      this.renderer.render(this.scene, this.camera);
    }
    _setAvLabel(text, bg) {
      if (this._avTxt === text + bg) return; this._avTxt = text + bg;
      const sp = labelSprite(text, { bg }); this.avLabel.material.map.dispose(); this.avLabel.material.map = sp.material.map; this.avLabel.material.needsUpdate = true;
    }
    _angLerp(a, b, k) { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k; }
    _camera(dt) {
      const S = WH.S, c = this.cam, d = this.camT;
      if (this.mode === 'follow') {
        const hx = Math.sin(this.heading), hz = Math.cos(this.heading);
        d.tx = S.pos.x + hx * 4.2; d.tz = S.pos.z + hz * 4.2; d.ty = 0.7; d.az = this.heading + Math.PI + (this.opts.followSwing || 0); d.pol = 1.18; d.dist = 11.5;
      } else if (this.mode === 'both') {
        const hx = WH.HOME_POS.x, hz = WH.HOME_POS.z, sep = Math.hypot(S.pos.x - hx, S.pos.z - hz);
        d.tx = (hx + S.pos.x) / 2; d.tz = (hz + S.pos.z) / 2; d.ty = 0; d.dist = clamp(sep * 1.9 + 22, this.opts.minDist || 34, 140); d.pol = this.opts.pol || 0.78;
        if (!this.drag) d.az += dt * 0.05;
      } else if (this.mode === 'avatar') {
        d.tx = S.pos.x; d.tz = S.pos.z; d.ty = 0; if (this.autoRotate) d.az += dt * 0.06;
      } else if (this.autoRotate && !this.drag) { d.az += dt * 0.07; }
      const k = 1 - Math.pow(this.mode === 'follow' ? 0.0008 : 0.01, dt);
      c.tx = lerp(c.tx, d.tx, k); c.tz = lerp(c.tz, d.tz, k); c.ty = lerp(c.ty, d.ty, k);
      c.az = this._angLerp(c.az, d.az, k); c.pol = lerp(c.pol, d.pol, k); c.dist = lerp(c.dist, d.dist, k);
      const sp = Math.sin(c.pol);
      this.camera.position.set(c.tx + c.dist * sp * Math.sin(c.az), c.ty + c.dist * Math.cos(c.pol), c.tz + c.dist * sp * Math.cos(c.az));
      this.camera.lookAt(c.tx, c.ty, c.tz);
      if (this.mode === 'follow') {
        const w = this.el.clientWidth, h = this.el.clientHeight;
        if (w && (this._vw !== w || this._vh !== h)) { this._vw = w; this._vh = h; this.camera.setViewOffset(w, h, 0, Math.round(h * 0.15), w, h); }
      }
    }
  }

  WH.World = World;
  WH.lmPos = (m) => { const p = WH.node(m.i, m.j); return { x: p.x + m.sx * 2.9, z: p.z + m.sz * 2.9 }; };
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    if (WH.S) { ALL.forEach((w) => { try { w.frame(dt, t); } catch (e) { console.error(e); } }); WH.onFrame && WH.onFrame(dt, t); }
    requestAnimationFrame(loop);
  })(last);
  WH.worlds = ALL;
})();
