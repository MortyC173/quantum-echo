/* Original, dependency-free scientific illustration. Geometry is explanatory,
   not a ray-tracing model, and colours never encode a photon's identity. */
const C = { ink: '#17372c', dark: '#102b23', mid: '#3b5e4b', edge: '#78917c', lime: '#c3ef59', purple: '#b9a0dc', cream: '#f5f5ee', muted: '#768273' };
const FONT = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';

export class QuantumLab {
  constructor(canvas) {
    if (!canvas || !canvas.getContext) throw new TypeError('QuantumLab requires a canvas.');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = { stage: 0, running: false, noise: .48, retention: .9, alignment: 1, targetVisible: true, targetPresent: true, samples: 0 };
    this.pulses = [];
    this.time = 0;
    this.lastTime = 0;
    this.lastPulse = 0;
    this.destroyed = false;
    this.media = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.media.matches;
    this.onMotion = e => { this.reducedMotion = e.matches; this.draw(); };
    this.media.addEventListener?.('change', this.onMotion);
    this.onClick = e => {
      const p = this.pointer(e);
      const device = this.hitboxes?.find(b => p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h);
      if (device) canvas.dispatchEvent(new CustomEvent('device-select', { bubbles: true, detail: { stage: device.stage } }));
    };
    this.onMove = e => {
      const p = this.pointer(e);
      canvas.style.cursor = this.hitboxes?.some(b => p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h) ? 'pointer' : 'default';
    };
    canvas.addEventListener('click', this.onClick);
    canvas.addEventListener('pointermove', this.onMove);
    if (!canvas.hasAttribute('role')) canvas.setAttribute('role', 'img');
    if (!canvas.hasAttribute('aria-label')) canvas.setAttribute('aria-label', '量子照明实验台：量子信号源分出探测信号与参考信号。探测信号经过目标区域，与本地保留的参考信号进入联合接收器。');
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
    this.frame = requestAnimationFrame(t => this.tick(t));
  }

  setState(next = {}) {
    this.state = { ...this.state, ...next };
    for (const key of ['noise', 'retention', 'alignment']) this.state[key] = Math.max(0, Math.min(1, Number(this.state[key]) || 0));
    this.state.stage = Math.max(0, Math.min(7, Math.round(Number(this.state.stage) || 0)));
    this.state.samples = Math.max(0, Number(this.state.samples) || 0);
    this.draw();
  }

  pulse() {
    this.pulses.push(this.time);
    if (this.pulses.length > 12) this.pulses.shift();
    this.draw();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.dpr = dpr;
    this.mobile = this.width < 550;
    this.vw = this.mobile ? 520 : 860;
    this.vh = this.mobile ? 650 : 520;
    this.scale = Math.min(this.width / this.vw, this.height / this.vh);
    this.offsetX = (this.width - this.vw * this.scale) / 2;
    this.offsetY = (this.height - this.vh * this.scale) / 2;
    this.layout = this.mobile
      ? { source: [137, 387], memory: [155, 182], target: [376, 265], receiver: [349, 500] }
      : { source: [202, 335], memory: [300, 165], target: [643, 214], receiver: [592, 379] };
    this.hitboxes = Object.entries(this.layout).map(([name, [x, y]]) => ({ x: x - 80, y: y - 110, w: 160, h: 160, stage: ({ source: 0, memory: 1, target: 3, receiver: 5 })[name] }));
    this.draw();
  }

  pointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left - this.offsetX) / this.scale, y: (e.clientY - rect.top - this.offsetY) / this.scale };
  }

  tick(t) {
    if (this.destroyed) return;
    if (!document.hidden && (!this.lastTime || t - this.lastTime > 1000 / 32)) {
      this.time = t / 1000;
      this.lastTime = t;
      if (this.state.running && this.time - this.lastPulse > 1.55) {
        this.pulse();
        this.lastPulse = this.time;
      }
      this.pulses = this.pulses.filter(p => this.time - p < 4.8);
      this.draw();
    }
    this.frame = requestAnimationFrame(time => this.tick(time));
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.media.removeEventListener?.('change', this.onMotion);
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('pointermove', this.onMove);
  }

  line(points, color, width = 1, dash = []) {
    const c = this.ctx;
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.strokeStyle = color;
    c.lineWidth = width;
    c.setLineDash(dash);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.stroke();
    c.setLineDash([]);
  }

  poly(points, fill, stroke, width = 1) {
    const c = this.ctx;
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }

  circle(x, y, radius, color, stroke) {
    const c = this.ctx;
    c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2);
    if (color) { c.fillStyle = color; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
  }

  ellipse(x, y, rx, ry, fill, stroke, width = 1) {
    const c = this.ctx;
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = width; c.strokeStyle = stroke; c.stroke(); }
  }

  text(text, x, y, size = 12, color = C.ink, weight = '400', align = 'left') {
    const c = this.ctx;
    c.font = `${weight} ${size}px ${FONT}`;
    c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(text, x, y);
  }

  box(x, y, w, d, h, colors = {}) {
    const top = [[x, y - d / 2 - h], [x + w / 2, y - h], [x, y + d / 2 - h], [x - w / 2, y - h]];
    this.poly([[x - w / 2, y - h], [x, y + d / 2 - h], [x, y + d / 2], [x - w / 2, y]], colors.left || C.mid, colors.edge || '#16392b40');
    this.poly([[x, y + d / 2 - h], [x + w / 2, y - h], [x + w / 2, y], [x, y + d / 2]], colors.right || C.ink, colors.edge || '#16392b40');
    this.poly(top, colors.top || '#63816b', colors.edge || '#17372c45');
    this.line([top[3], top[2], top[1]], '#ffffff25', 1);
  }

  glow(x, y, r, color) {
    const c = this.ctx;
    c.save();
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, color.slice(0, 7) + '00');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    c.restore();
  }

  label(title, sub, x, y, n, active) {
    const size = this.mobile ? 17 : 15;
    this.text(title, x, y, size, C.ink, '600', 'center');
    this.text(sub, x, y + 22, this.mobile ? 12 : 11, C.muted, '400', 'center');
    const tx = x - (title.length * size / 2) - 19;
    this.circle(tx, y, 9, active ? C.ink : '#e4e8db');
    this.text(n, tx, y + .5, 9, active ? C.lime : C.muted, '600', 'center');
  }

  active(name) {
    const s = this.state.stage;
    return name === 'source' ? s === 0 : name === 'memory' ? s === 1 : name === 'target' ? s === 2 || s === 3 : s >= 4;
  }

  base(x, y, w, d, name) {
    const active = this.active(name);
    this.ellipse(x, y + 15, w * .60, d * .58, '#253f2510');
    if (active) this.glow(x, y, w * .8, name === 'memory' ? '#b9a0dc30' : '#c3ef5938');
    this.box(x, y, w, d, 8, { top: active ? '#e7efcf' : '#e9ecdf', left: '#ccd4c2', right: '#bcc8b2', edge: '#74846845' });
    if (active) {
      const a = this.reducedMotion ? .5 : .4 + Math.sin(this.time * 2) * .1;
      this.ctx.save(); this.ctx.globalAlpha = a;
      this.poly([[x, y - d / 2 - 12], [x + w / 2 + 10, y - 8], [x, y + d / 2 + 4], [x - w / 2 - 10, y - 8]], null, C.ink, 1.25);
      this.ctx.restore();
    }
    [[-.34, -.08], [.34, -.08], [0, .3]].forEach(([dx, dy]) => this.ellipse(x + w * dx, y + d * dy - 7, 2.5, 1.4, '#f9faf5', '#93a28d'));
  }

  drawSource(x, y) {
    this.base(x, y, 130, 64, 'source');
    this.box(x, y - 8, 94, 43, 32, { top: '#537760', left: '#35513f', right: '#1a3e2d' });
    this.box(x, y - 42, 60, 25, 9, { top: '#87a17a', left: '#527546', right: '#396031' });
    this.ellipse(x, y - 53, 17, 9, '#203c29', '#c3ef5990', 1.5);
    this.glow(x, y - 53, 27, '#c3ef5960');
    this.ellipse(x, y - 54, 8, 4, C.lime);
    this.line([[x - 35, y - 32], [x - 9, y - 20]], '#96b39b70', 1.5);
    this.line([[x - 35, y - 26], [x - 9, y - 14]], '#96b39b50', 1.5);
    this.circle(x + 26, y - 21, 3, C.lime);
    this.circle(x + 36, y - 26, 2, '#c3ef5950');
    // A split emission is a path illustration, not an individually labelled pair.
    this.text('QI', x + 9, y - 8, 10, '#cee4b9', '500');
    this.label('量子信号源', '制备关联的两路信号', x, y + 52, '01', this.active('source'));
  }

  drawMemory(x, y) {
    this.base(x, y, 133, 67, 'memory');
    this.box(x, y - 8, 86, 42, 15, { top: '#607363', left: '#3f5445', right: '#2b4738' });
    const top = y - 83;
    this.ctx.fillStyle = '#c9bdd4'; this.ctx.fillRect(x - 24, top + 9, 48, 44);
    this.ellipse(x, top + 53, 24, 12, '#796c89');
    this.ellipse(x, top + 8, 24, 12, '#eee6f3', '#8d7d9d');
    for (let j = 0; j < 6; j++) this.ellipse(x, top + 12 + j * 7, 29, 12, null, j % 2 ? '#a895bd' : '#e5d9ed', 3);
    this.ellipse(x, top + 3, 18, 8, '#453e50', '#b9a0dc', 2);
    this.ellipse(x, top + 2, 10, 4, '#c8b5e6');
    this.line([[x - 37, y - 31], [x - 37, top + 12], [x - 27, top + 7]], '#6e8274', 3);
    this.line([[x + 37, y - 31], [x + 37, top + 12], [x + 27, top + 7]], '#6e8274', 3);
    const lights = Math.round(this.state.retention * 5);
    for (let j = 0; j < 5; j++) this.circle(x + 7 + j * 6, y - 8 - j * 3, 1.6, j < lights ? C.purple : '#587160');
    this.label('参考信号存储', '保留一路 · 等待回波', x, y + 48, '02', this.active('memory'));
  }

  noise(x, y, w, h, count, clip = true) {
    const c = this.ctx;
    c.save();
    if (clip) { c.beginPath(); c.rect(x - w / 2, y - h / 2, w, h); c.clip(); }
    for (let i = 0; i < count; i++) {
      const speed = this.reducedMotion ? 0 : this.time * (.12 + (i % 4) * .025);
      const nx = x + Math.sin(i * 12.9898 + speed) * w * .48;
      const ny = y + Math.cos(i * 7.128 + speed * 1.7) * h * .46;
      this.circle(nx, ny, i % 7 === 0 ? 2.2 : 1.1, i % 4 === 0 ? '#8ca47b85' : '#8ca47b40');
    }
    c.restore();
  }

  drawTarget(x, y) {
    this.base(x, y, 159, 78, 'target');
    const h = 87, w = 148, d = 67, by = y - 8;
    // Rear walls: transparent and deliberately schematic.
    this.poly([[x - w / 2, by], [x, by - d / 2], [x, by - d / 2 - h], [x - w / 2, by - h]], '#c0cbbb25', '#9bac9560');
    this.poly([[x, by - d / 2], [x + w / 2, by], [x + w / 2, by - h], [x, by - d / 2 - h]], '#c0cbbb20', '#9bac9560');
    this.line([[x, by - d / 2], [x, by - d / 2 - h]], '#9bac9550', 1, [3, 4]);
    if (this.state.targetVisible && this.state.targetPresent) {
      this.ellipse(x, by - 6, 28, 12, '#17372c18');
      this.box(x, by - 10, 51, 26, 33, { top: '#9dafa0', left: '#638370', right: '#355b46', edge: '#375c4760' });
      this.poly([[x - 18, by - 47], [x, by - 57], [x + 18, by - 47], [x, by - 37]], '#d3dccd', '#789480');
      this.line([[x - 16, by - 30], [x - 3, by - 23]], '#a8c09f', 2);
    } else if (!this.state.targetVisible) {
      this.ellipse(x, by - 25, 28, 30, '#edf0e5b0', '#bdc9ae70');
      this.text('?', x, by - 26, 31, '#60765b', '300', 'center');
    } else {
      this.ellipse(x, by - 12, 27, 13, null, '#8ea38580', 1);
      this.line([[x - 15, by - 12], [x + 15, by - 12]], '#8ea38565', 1, [2, 3]);
    }
    this.noise(x, by - 48, 137, 80, Math.floor(12 + this.state.noise * 65));
    // Front pane holds the same noise appearance whether the hidden target is present or absent.
    this.poly([[x - w / 2, by], [x, by + d / 2], [x + w / 2, by], [x + w / 2, by - h], [x, by + d / 2 - h], [x - w / 2, by - h]], '#dfe6d908', '#99ab8e70');
    this.poly([[x - w / 2, by - h], [x, by - d / 2 - h], [x + w / 2, by - h], [x, by + d / 2 - h]], '#eff5e71a', '#a2b09660');
    this.line([[x, by + d / 2], [x, by + d / 2 - h]], '#8d9f8470');
    this.line([[x - 61, by - 78], [x - 61, by - 46]], '#ffffff9c', 2.5);
    this.text('探测区域', x, by - h - d / 2 - 17, this.mobile ? 13 : 11, C.muted, '400', 'center');
    this.label('目标与环境', this.state.targetVisible ? '教学剖视 · 真值可见' : '盲测模式 · 真值隐藏', x, y + 56, '03', this.active('target'));
  }

  drawReceiver(x, y) {
    this.base(x, y, 146, 72, 'receiver');
    this.box(x, y - 8, 112, 54, 37, { top: '#587963', left: '#34573f', right: '#153b29' });
    this.box(x - 5, y - 45, 65, 31, 18, { top: '#7a957a', left: '#446c4e', right: '#2a5137' });
    // An abstract meter, not a particular physical receiver implementation.
    const panel = [[x - 32, y - 65], [x + 2, y - 49], [x + 2, y - 28], [x - 32, y - 44]];
    this.poly(panel, '#0c2a1c', '#a8bd9470');
    for (let k = 0; k < 5; k++) {
      const h = 4 + ((Math.sin(this.reducedMotion ? k : this.time * 2 + k * 2) + 1) * 4);
      this.line([[x - 26 + k * 5, y - 47 + k * 2.4], [x - 26 + k * 5, y - 47 + k * 2.4 - h]], k % 2 ? '#9cbc7d' : C.lime, 2);
    }
    this.ellipse(x + 34, y - 38, 8, 4, '#172f20', '#aab88c');
    this.ellipse(x + 34, y - 41, 6, 3, '#b2c78d');
    this.circle(x + 21, y - 16, 2.5, this.state.alignment > .7 ? C.lime : '#dcb46c');
    this.circle(x + 31, y - 21, 2, C.purple);
    this.circle(x + 41, y - 26, 2, '#b5cea1');
    // Return and environmental fluctuations intentionally share the same palette.
    this.noise(x - 40, y - 31, 22, 14, Math.floor(3 + this.state.noise * 9), false);
    this.label('联合接收器', this.state.stage >= 6 ? '多次测量 · 积累统计证据' : '回波 + 参考 → 测量读数', x, y + 55, '04', this.active('receiver'));
  }

  paths() {
    const { source: [sx, sy], memory: [mx, my], target: [tx, ty], receiver: [rx, ry] } = this.layout;
    return {
      outgoing: this.mobile ? [[sx + 34, sy - 42], [sx + 64, sy - 59], [tx - 109, ty - 20], [tx - 72, ty - 35]] : [[sx + 35, sy - 43], [sx + 82, sy - 68], [tx - 146, ty - 20], [tx - 73, ty - 35]],
      reference: [[sx - 10, sy - 52], [sx - 46, sy - 71], [mx - 42, my - 12], [mx - 24, my - 22]],
      retained: this.mobile ? [[mx + 38, my - 17], [mx + 77, my + 4], [rx - 81, ry - 90], [rx - 34, ry - 60]] : [[mx + 38, my - 17], [mx + 76, my + 4], [rx - 96, ry - 93], [rx - 34, ry - 60]],
      returning: [[tx + 56, ty + 2], [tx + 89, ty + 21], [rx + 84, ry - 61], [rx + 43, ry - 39]],
    };
  }

  pointOn(points, progress) {
    const lens = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
    let distance = lens.reduce((a, b) => a + b, 0) * Math.max(0, Math.min(.9999, progress));
    for (let i = 0; i < lens.length; i++) {
      if (distance <= lens[i]) { const t = distance / lens[i]; return [points[i][0] + (points[i + 1][0] - points[i][0]) * t, points[i][1] + (points[i + 1][1] - points[i][1]) * t]; }
      distance -= lens[i];
    }
    return points.at(-1);
  }

  drawPath(points, color, active, phase = 0, dashed = false) {
    this.line(points, '#17372c0d', 9);
    this.line(points, active ? color + 'b0' : color + '65', active ? 2.6 : 1.8, dashed ? [5, 4] : []);
    points.slice(1, -1).forEach(([x, y]) => this.circle(x, y, 3, C.cream, color + '88'));
    const mid = this.pointOn(points, .54), before = this.pointOn(points, .52);
    const a = Math.atan2(mid[1] - before[1], mid[0] - before[0]);
    this.ctx.save(); this.ctx.translate(...mid); this.ctx.rotate(a);
    this.poly([[-5, -3.5], [1, 0], [-5, 3.5]], active ? color : color + '90'); this.ctx.restore();
    if (this.reducedMotion) {
      if (active) { const p = this.pointOn(points, .75); this.circle(p[0], p[1], 3.4, color); }
      return;
    }
    // Ambient flow is restrained; bursts correspond to an actual user-triggered shot.
    if (active) {
      const p = this.pointOn(points, ((this.time * .18 + phase) % 1));
      this.glow(p[0], p[1], 10, color + '45');
      this.circle(p[0], p[1], 2.5, color);
    }
    for (const pulse of this.pulses) {
      const progress = (this.time - pulse - phase * 1.4) / 1.6;
      if (progress < 0 || progress > 1) continue;
      const [x, y] = this.pointOn(points, progress);
      this.glow(x, y, 15, color + '88');
      this.circle(x, y, 4, color); this.circle(x, y, 1.5, '#ffffef');
    }
  }

  drawBoard() {
    const c = this.ctx, mobile = this.mobile;
    const cy = mobile ? 347 : 282;
    const bw = mobile ? 430 : 728, bh = mobile ? 390 : 340;
    c.save();
    this.poly([[this.vw / 2, cy - bh / 2], [this.vw / 2 + bw / 2, cy], [this.vw / 2, cy + bh / 2], [this.vw / 2 - bw / 2, cy]], '#ffffff38', '#b6c2aa55');
    c.beginPath(); c.moveTo(this.vw / 2, cy - bh / 2); c.lineTo(this.vw / 2 + bw / 2, cy); c.lineTo(this.vw / 2, cy + bh / 2); c.lineTo(this.vw / 2 - bw / 2, cy); c.closePath(); c.clip();
    for (let x = -600; x < 1400; x += 39) {
      this.line([[x, cy - 300], [x + 1100, cy + 300]], '#59774b0d');
      this.line([[x, cy - 300], [x - 1100, cy + 300]], '#59774b0d');
    }
    c.restore();
    this.line([[this.vw / 2 - bw / 2, cy + 7], [this.vw / 2, cy + bh / 2 + 7], [this.vw / 2 + bw / 2, cy + 7]], '#98aa8a30');
    const cx = this.vw / 2, yy = mobile ? 350 : 293;
    this.ellipse(cx, yy, mobile ? 44 : 61, mobile ? 24 : 30, null, '#91a17e25');
    this.ellipse(cx, yy, mobile ? 36 : 52, mobile ? 19 : 25, null, '#91a17e15');
  }

  draw() {
    if (!this.ctx || !this.layout || !this.scale) return;
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.width, this.height);
    c.fillStyle = C.cream; c.fillRect(0, 0, this.width, this.height);
    c.translate(this.offsetX, this.offsetY); c.scale(this.scale, this.scale);
    this.drawBoard();
    const paths = this.paths(), stage = this.state.stage;
    this.drawPath(paths.outgoing, '#99bb48', stage >= 2, 0);
    this.drawPath(paths.reference, '#b094cf', stage <= 1 || this.state.running, .08);
    this.drawPath(paths.retained, '#b094cf', stage >= 4, 1.1, this.state.retention < .4);
    this.drawPath(paths.returning, '#91a777', stage >= 3, 1.05);
    // Small functional annotations belong to paths, not individual pulses.
    if (!this.mobile) {
      this.text('探测信号', 448, 193, 11, '#789340', '500');
      this.text('保留的参考', 431, 284, 11, '#927ca8', '500');
      this.text('回波 + 噪声', 704, 299, 11, '#718366', '500', 'center');
    }
    const l = this.layout;
    this.drawMemory(...l.memory);
    this.drawTarget(...l.target);
    this.drawSource(...l.source);
    this.drawReceiver(...l.receiver);
    const x = this.mobile ? 28 : 35, top = this.mobile ? 33 : 28;
    this.circle(x + 4, top, 3, this.state.running ? C.ink : '#a2b091');
    this.text(this.state.running ? '探测进行中' : '量子照明实验台', x + 16, top, this.mobile ? 13 : 11, '#6c7a60', '500');
    this.text(this.state.targetVisible ? '教学剖视' : '隐藏真值', this.vw - x, top, this.mobile ? 12 : 10, '#849078', '400', 'right');
    const bottom = this.vh - (this.mobile ? 32 : 24);
    this.text('原理示意 · 颜色区分通路，不代表光子身份', this.vw / 2, bottom, this.mobile ? 11.5 : 10, '#829076', '400', 'center');
  }
}
