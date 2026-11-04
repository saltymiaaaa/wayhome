/* Floating 3D smartwatch (hero + device pairing step). Screen is a live canvas texture. */
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
      this.camera = new T.PerspectiveCamera(32, 1, 0.1, 100); this.camera.position.set(0, 0, 11.5);
      this.scene.add(new T.AmbientLight(0xffffff, 0.75));
      const key = new T.DirectionalLight(0xffffff, 1.0); key.position.set(-4, 5, 8); this.scene.add(key);
      const rim = new T.DirectionalLight(0x5aa9ff, 1.1); rim.position.set(6, 2, -4); this.scene.add(rim);
      const warm = new T.DirectionalLight(0xffb86b, 0.5); warm.position.set(5, -4, 5); this.scene.add(warm);

      this.rig = new T.Group(); this.scene.add(this.rig);
      const bodyMat = new T.MeshStandardMaterial({ color: 0xdfe5f3, metalness: 0.55, roughness: 0.32 });
      const body = new T.Mesh(new T.ExtrudeGeometry(rr(2.5, 3.0, 0.7), { depth: 0.5, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 5, curveSegments: 28 }), bodyMat);
      body.position.z = -0.25; this.rig.add(body);
      // straps
      const strapMat = new T.MeshStandardMaterial({ color: 0x24325e, metalness: 0.1, roughness: 0.7 });
      const mkStrap = (sign) => {
        const s = new T.Mesh(new T.ExtrudeGeometry(rr(1.7, 2.6, 0.35), { depth: 0.22, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3 }), strapMat);
        s.position.set(0, sign * 2.95, -0.28); s.rotation.x = sign * -0.18; this.rig.add(s);
        for (let k = 0; k < 5; k++) { const h = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.1, 10), new T.MeshStandardMaterial({ color: 0x0f1736 })); h.rotation.x = Math.PI / 2; h.position.set(0, sign * (3.7 + k * 0.3), -0.1 + sign * -0.0); h.position.z = -0.08 - Math.abs(sign * (0.55 + k * 0.1)) * 0.18; this.rig.add(h); }
        const stitch = new T.Mesh(new T.PlaneGeometry(0.03, 2.2), new T.MeshBasicMaterial({ color: 0x5a6fa8 }));
        return s;
      };
      mkStrap(1); mkStrap(-1);
      const crown = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.3, 24), new T.MeshStandardMaterial({ color: 0xff7a59, metalness: 0.4, roughness: 0.4 }));
      crown.rotation.z = Math.PI / 2; crown.position.set(1.4, 0.6, 0); this.rig.add(crown);
      const sb = new T.Mesh(new T.BoxGeometry(0.16, 0.8, 0.3), new T.MeshStandardMaterial({ color: 0xcdd5e8, metalness: 0.5, roughness: 0.4 })); sb.position.set(1.36, -0.5, 0); this.rig.add(sb);

      // screen
      this.sc = document.createElement('canvas'); this.sc.width = 512; this.sc.height = 640;
      this.tex = new T.CanvasTexture(this.sc); this.tex.anisotropy = 8;
      const scr = new T.Mesh(new T.PlaneGeometry(2.38, 2.88), new T.MeshBasicMaterial({ map: this.tex, transparent: true }));
      scr.position.z = 0.4; this.rig.add(scr);
      // glow
      const gc = document.createElement('canvas'); gc.width = gc.height = 256; const g = gc.getContext('2d');
      const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(80,160,255,.55)'); gr.addColorStop(1, 'rgba(80,160,255,0)');
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
      const g = this.sc.getContext('2d'), W = 512, H = 640, S = WH.S || {};
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#05070f'; g.beginPath(); g.roundRect(0, 0, W, H, 120); g.fill();
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#fff6e6'); bg.addColorStop(1, '#ffe8c9');
      g.fillStyle = bg; g.beginPath(); g.roundRect(14, 14, W - 28, H - 28, 108); g.fill();
      const now = new Date(), hh = String(now.getHours()).padStart(2, '0'), mm = String(now.getMinutes()).padStart(2, '0');
      g.fillStyle = '#1b2540'; g.font = '800 66px "Be Vietnam Pro", sans-serif'; g.textAlign = 'center'; g.fillText(hh + ':' + mm, W / 2, 106);
      g.fillStyle = '#d8f5e6'; g.beginPath(); g.roundRect(58, 128, W - 116, 64, 32); g.fill();
      g.fillStyle = '#0d7a4f'; g.font = '700 30px "Be Vietnam Pro", sans-serif'; g.fillText((WH.t ? WH.t('watchSafe') : 'You are safe'), W / 2, 171);
      const btns = [['home', '#2f6bff', 'GO HOME'], ['phone', '#12b886', 'CALL'], ['assistant', '#7c5cf5', 'TALK'], ['sos', '#e5304f', 'SOS']];
      btns.forEach((b, i) => {
        const x = 64 + (i % 2) * 196, y = 218 + Math.floor(i / 2) * 178, w = 184, h = 164;
        const gg = g.createLinearGradient(0, y, 0, y + h); gg.addColorStop(0, b[1]); gg.addColorStop(1, b[1] + 'cc');
        g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.roundRect(x, y + 6, w, h, 40); g.fill();
        g.fillStyle = gg; g.beginPath(); g.roundRect(x, y, w, h, 40); g.fill();
        g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.roundRect(x + 6, y + 6, w - 12, h / 2.2, 34); g.fill();
        const im = iconImg(b[0], '#ffffff', () => this.paint());
        if (im.complete && im.naturalWidth) g.drawImage(im, x + w / 2 - 36, y + 22, 72, 72);
        g.fillStyle = '#fff'; g.font = '800 27px "Be Vietnam Pro", sans-serif'; g.fillText(b[2], x + w / 2, y + 134);
      });
      g.fillStyle = '#8a6b3e'; g.font = '600 24px "Be Vietnam Pro", sans-serif'; g.fillText('72 bpm    84%', W / 2, 596);
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
