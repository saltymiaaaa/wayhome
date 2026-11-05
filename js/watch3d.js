/* Floating 3D Ping An Gem (hero + device pairing step): round navy case, gold ring, curved gold SOS bar, leather strap.
   The screen is a live canvas texture. */
(function () {
  const WH = (window.WH = window.WH || {});
  const T = THREE;

  function rr(w, h, r) {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  const iconCache = {};
  function iconImg(name, color, cb) {
    const k = name + color;
    if (iconCache[k]) return iconCache[k];
    const img = new Image();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 32 32" style="color:${color}">${window.ICONS[name].replace(/currentColor/g, color)}</svg>`;
    img.onload = cb; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    iconCache[k] = img; return img;
  }

  class Watch3D {
    constructor(canvas, opts) {
      opts = opts || {};
      this.canvas = canvas; this.opts = opts;
      this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera(32, 1, 0.1, 100); this.camera.position.set(0, 0, 12.5);
      this.scene.add(new T.AmbientLight(0xffffff, 0.8));
      const key = new T.DirectionalLight(0xffffff, 1.0); key.position.set(-4, 5, 8); this.scene.add(key);
      const rim = new T.DirectionalLight(0x9db9ff, 0.9); rim.position.set(6, 2, -4); this.scene.add(rim);
      const warm = new T.DirectionalLight(0xffd9a0, 0.6); warm.position.set(5, -4, 5); this.scene.add(warm);

      this.rig = new T.Group(); this.scene.add(this.rig);
      const gold = new T.MeshStandardMaterial({ color: 0xd9a862, metalness: 0.75, roughness: 0.3 });
      // round case
      const body = new T.Mesh(new T.CylinderGeometry(1.8, 1.8, 0.55, 72), new T.MeshStandardMaterial({ color: 0x2c4a86, metalness: 0.5, roughness: 0.35 }));
      body.rotation.x = Math.PI / 2; this.rig.add(body);
      const ring = new T.Mesh(new T.TorusGeometry(1.52, 0.07, 16, 96), gold); ring.position.z = 0.28; this.rig.add(ring);
      // curved SOS bar along the lower ring (never covered by the strap)
      const arc = Math.PI * 0.62;
      const sos = new T.Mesh(new T.TorusGeometry(1.66, 0.17, 18, 48, arc), gold);
      sos.rotation.z = -Math.PI / 2 - arc / 2; sos.position.z = 0.3; this.rig.add(sos);
      // leather strap + gold lugs, set clear of the SOS bar
      const strapMat = new T.MeshStandardMaterial({ color: 0x6b4423, metalness: 0.05, roughness: 0.8 });
      const lugMat = new T.MeshStandardMaterial({ color: 0xe2b96b, metalness: 0.7, roughness: 0.3 });
      const mkStrap = (sign) => {
        const off = sign > 0 ? 3.0 : 3.35;
        const s = new T.Mesh(new T.ExtrudeGeometry(rr(1.5, 2.5, 0.32), { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 }), strapMat);
        s.position.set(0, sign * off, -0.2); s.rotation.x = sign * -0.16; this.rig.add(s);
        const lug = new T.Mesh(new T.BoxGeometry(1.6, 0.26, 0.42), lugMat); lug.position.set(0, sign * (sign > 0 ? 1.8 : 2.12), -0.02); this.rig.add(lug);
        if (sign < 0) for (let k = 0; k < 3; k++) { const h = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.1, 12), new T.MeshStandardMaterial({ color: 0x2d1b0b })); h.rotation.x = Math.PI / 2; h.position.set(0, sign * (3.3 + k * 0.5), 0.0); this.rig.add(h); }
        return s;
      };
      mkStrap(1); mkStrap(-1);

      // screen (round)
      this.sc = document.createElement('canvas'); this.sc.width = 512; this.sc.height = 512;
      this.tex = new T.CanvasTexture(this.sc); this.tex.anisotropy = 8;
      const scr = new T.Mesh(new T.CircleGeometry(1.46, 72), new T.MeshBasicMaterial({ map: this.tex, transparent: true }));
      scr.position.z = 0.285; this.rig.add(scr);
      // SOS label on the bar
      const lc = document.createElement('canvas'); lc.width = 256; lc.height = 96; const lg = lc.getContext('2d');
      lg.fillStyle = '#5a3a12'; lg.font = '900 54px "Be Vietnam Pro", sans-serif'; lg.textAlign = 'center'; lg.textBaseline = 'middle'; lg.fillText('SOS', 128, 50);
      const lab = new T.Mesh(new T.PlaneGeometry(0.8, 0.3), new T.MeshBasicMaterial({ map: new T.CanvasTexture(lc), transparent: true }));
      lab.position.set(0, -1.68, 0.48); this.rig.add(lab);
      // glow
      const gc = document.createElement('canvas'); gc.width = gc.height = 256; const g = gc.getContext('2d');
      const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(241,215,154,.45)'); gr.addColorStop(1, 'rgba(241,215,154,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      const glow = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(gc), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
      glow.scale.set(9, 9, 1); glow.position.z = -2; this.scene.add(glow);

      this.rx = -0.12; this.ry = -0.35; this.tx = this.rx; this.ty = this.ry; this.dragging = false;
      canvas.style.touchAction = 'none';
      canvas.addEventListener('pointerdown', (e) => { this.dragging = true; this.lx = e.clientX; this.ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointermove', (e) => { if (!this.dragging) return; this.ty += (e.clientX - this.lx) * 0.01; this.tx = Math.max(-0.8, Math.min(0.8, this.tx + (e.clientY - this.ly) * 0.008)); this.lx = e.clientX; this.ly = e.clientY; });
      canvas.addEventListener('pointerup', () => { this.dragging = false; });
      this.paint(); this._resize();
      if (window.ResizeObserver) new ResizeObserver(() => this._resize()).observe(canvas.parentElement || canvas);
      this.t0 = performance.now(); this.lastPaint = 0;
      const loop = (now) => { this.frame(now); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
    _resize() {
      const p = this.canvas.parentElement || this.canvas, w = p.clientWidth, h = p.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    }
    paint() {
      const g = this.sc.getContext('2d'), W = 512, H = 512;
      g.clearRect(0, 0, W, H);
      g.save(); g.beginPath(); g.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2); g.clip();
      const bg = g.createRadialGradient(W * 0.35, H * 0.25, 20, W / 2, H / 2, W * 0.7); bg.addColorStop(0, '#232a2c'); bg.addColorStop(1, '#0c1011');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      const now = new Date(), hh = String(now.getHours()).padStart(2, '0'), mm = String(now.getMinutes()).padStart(2, '0');
      const home = iconImg('home', '#f1d79a', () => this.paint());
      if (home.complete && home.naturalWidth) g.drawImage(home, W / 2 - 62, 82, 124, 124);
      g.fillStyle = '#f4efe6'; g.textAlign = 'center'; g.font = '900 112px "Be Vietnam Pro", sans-serif'; g.fillText(hh + ':' + mm, W / 2, 322);
      g.fillStyle = 'rgba(244,239,230,.85)'; g.font = '700 26px "Be Vietnam Pro", sans-serif'; g.fillText('Route ready · GPS good', W / 2, 364);
      const lg = g.createLinearGradient(0, 388, 0, 448); lg.addColorStop(0, '#f1d79a'); lg.addColorStop(1, '#c99747');
      g.fillStyle = lg; g.beginPath(); g.roundRect(W / 2 - 128, 388, 256, 60, 30); g.fill();
      g.fillStyle = '#3a2808'; g.font = '900 28px "Be Vietnam Pro", sans-serif'; g.fillText('GO HOME', W / 2, 428);
      g.restore();
      this.tex.needsUpdate = true;
    }
    frame(now) {
      const r = this.canvas.getBoundingClientRect();
      if (!this.canvas.getClientRects().length || r.bottom < 0 || r.top > innerHeight) return;
      if (now - this.lastPaint > 1000) { this.lastPaint = now; this.paint(); }
      if (!this.dragging) this.ty += Math.sin(now / 1800) * 0.0016;
      this.rx += (this.tx - this.rx) * 0.1; this.ry += (this.ty - this.ry) * 0.1;
      this.rig.rotation.set(this.rx, this.ry, 0);
      this.rig.position.y = Math.sin(now / 900) * 0.18;
      if (this.renderer.domElement.width < 8) this._resize();
      this.renderer.render(this.scene, this.camera);
    }
  }
  WH.Watch3D = Watch3D;
})();
