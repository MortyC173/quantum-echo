/* Original procedural artwork for Quantum Echo. No image assets are used.
   Hidden target state is read exclusively by the reveal rendering branch. */
export function createGameScene(container, onEvent = () => {}) {
  const P = window.Phaser;
  if (!P) throw new Error('Phaser 尚未加载');
  const node = typeof container === 'string' ? document.querySelector(container) : container;
  if (!node) throw new Error('找不到游戏画面容器');
  const palette = { paper: 0xf5f5ee, ink: 0x173f36, deep: 0x205446, green: 0x4b8970, lime: 0xd5ef67, coral: 0xee9273, lilac: 0xc5b0e4, white: 0xfffbed, fog: 0xd5e7db, moss: 0x779e63 };
  const font = '"PingFang SC","Microsoft YaHei",sans-serif';
  const sceneKey = 'EchoIsland';
  let sceneRef = null, destroyed = false, paused = false;
  let pendingState = { phase: 'intro', selectedZone: 0, noise: .45, referenceReady: false, clues: [{ samples: 0, score: 0 }, { samples: 0, score: 0 }, { samples: 0, score: 0 }], revealed: false, targetZone: 0, level: 1, running: false, receiverActive: false };
  const emit = value => { if (!destroyed) onEvent(value); };

  class EchoIsland extends P.Scene {
    constructor() { super(sceneKey); }
    create() {
      sceneRef = this;
      this.s = { ...pendingState };
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.root = this.add.container(0, 0);
      this.back = this.add.graphics(); this.root.add(this.back);
      this.decor = this.add.container(0, 0); this.root.add(this.decor);
      this.lines = this.add.graphics(); this.root.add(this.lines);
      this.zoneObjects = [];
      for (let i = 0; i < 3; i++) this.zoneObjects.push(this.makeZone(i));
      this.home = this.makeHome(); this.root.add(this.home);
      this.hero = this.makeRobot(1); this.root.add(this.hero);
      this.referenceHome = this.makeReferenceHome(); this.root.add(this.referenceHome);
      this.source = this.makeSource(); this.root.add(this.source);
      this.receiver = this.makeReceiver(); this.root.add(this.receiver);
      this.explorer = this.makeSpirit(palette.lime, 1.05); this.root.add(this.explorer);
      this.reference = this.makeSpirit(palette.lilac, .9); this.root.add(this.reference);
      this.reference.setInteractive(new P.Geom.Circle(0, 0, 35), P.Geom.Circle.Contains).on('pointerdown', () => {
        this.bounce(this.reference);
        emit({ type: 'reference' });
      });
      this.reference.input.cursor = 'pointer';
      this.effects = this.add.container(0, 0); this.root.add(this.effects);
      this.hint = this.add.graphics(); this.root.add(this.hint);
      this.labels = this.add.container(0, 0); this.root.add(this.labels);
      this.layout();
      this.applyState(pendingState);
      this.scale.on('resize', this.layout, this);
      if (!this.reduced) {
        this.tweens.add({ targets: this.explorer, angle: { from: -7, to: 7 }, duration: 1700, ease: 'Sine.inOut', yoyo: true, repeat: -1 });
        this.tweens.add({ targets: this.reference, angle: { from: 5, to: -5 }, duration: 2100, ease: 'Sine.inOut', yoyo: true, repeat: -1 });
        this.time.addEvent({ delay: 4300, loop: true, callback: () => {
          this.tweens.add({ targets: this.hero.eyes, scaleY: .12, duration: 85, yoyo: true, hold: 80 });
        } });
      }
      if (paused) this.scene.pause();
    }

    g(parent) { const g = this.add.graphics(); parent.add(g); return g; }
    text(parent, value, x, y, size, color = '#173f36', weight = '700') {
      const t = this.add.text(x, y, value, { fontFamily: font, fontSize: `${size}px`, color, fontStyle: weight, padding: { x: 3, y: 2 } }).setOrigin(.5);
      parent.add(t); return t;
    }
    round(g, x, y, w, h, r, fill, stroke = null, line = 2) {
      g.fillStyle(fill, 1).fillRoundedRect(x, y, w, h, r);
      if (stroke !== null) g.lineStyle(line, stroke, 1).strokeRoundedRect(x, y, w, h, r);
    }
    ellipse(g, x, y, w, h, fill, alpha = 1) { g.fillStyle(fill, alpha).fillEllipse(x, y, w, h); }
    circle(g, x, y, r, fill, alpha = 1) { g.fillStyle(fill, alpha).fillCircle(x, y, r); }
    poly(g, points, color, alpha = 1) { g.fillStyle(color, alpha).fillPoints(points.map(([x, y]) => new P.Geom.Point(x, y)), true); }
    stroke(g, points, color, width = 2, alpha = 1) { g.lineStyle(width, color, alpha).strokePoints(points.map(([x, y]) => new P.Geom.Point(x, y)), false); }
    star(g, x, y, radius, color, rot = 0) {
      const points = [];
      for (let i = 0; i < 8; i++) { const r = i % 2 ? radius * .29 : radius; const a = i * Math.PI / 4 + rot; points.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
      this.poly(g, points, color);
    }
    leaf(g, x, y, angle, scale = 1, color = palette.green) {
      const a = angle * Math.PI / 180, points = [[0, 0], [-9, -7], [-7, -25], [0, -37], [7, -25], [9, -7]];
      const mapped = points.map(([px, py]) => [x + (px * Math.cos(a) - py * Math.sin(a)) * scale, y + (px * Math.sin(a) + py * Math.cos(a)) * scale]);
      this.poly(g, mapped, color);
      this.stroke(g, [[x, y], [x + 28 * Math.sin(a) * scale, y - 28 * Math.cos(a) * scale]], palette.paper, 1, .35);
    }
    plant(g, x, y, scale = 1) {
      this.leaf(g, x, y, -38, scale, palette.deep); this.leaf(g, x, y, 29, scale * .9, palette.green); this.leaf(g, x, y, 0, scale * .7, palette.moss);
    }
    cloud(g, x, y, scale = 1, alpha = 1) {
      this.ellipse(g, x, y, 104 * scale, 25 * scale, 0xffffff, alpha);
      this.circle(g, x - 22 * scale, y - 9 * scale, 19 * scale, 0xffffff, alpha);
      this.circle(g, x + 6 * scale, y - 16 * scale, 28 * scale, 0xffffff, alpha);
      this.circle(g, x + 31 * scale, y - 5 * scale, 17 * scale, 0xffffff, alpha);
    }
    island(g, x, y, w, h = 72, small = false) {
      this.ellipse(g, x + 10, y + h + 34, w * .66, 15, palette.ink, .055);
      this.poly(g, [[x - w / 2, y], [x - w * .34, y + h * .62], [x - w * .07, y + h], [x + w * .2, y + h * .67], [x + w * .43, y + h * .25], [x + w / 2, y]], 0x82a98a);
      this.poly(g, [[x - w / 2, y], [x - w * .34, y + h * .62], [x - w * .07, y + h], [x - w * .14, y + 11]], 0x4d7a62);
      this.poly(g, [[x - w * .14, y + 11], [x - w * .07, y + h], [x + w * .2, y + h * .67], [x + w * .25, y + 7]], 0x658e70);
      this.ellipse(g, x, y, w, small ? 34 : 48, 0xacc58b);
      this.ellipse(g, x, y - 5, w * .94, small ? 30 : 41, 0xdde6b2);
      this.stroke(g, [[x - w * .29, y + h * .34], [x - w * .25, y + h * .48]], 0xa5bea1, 2, .55);
      this.stroke(g, [[x + w * .29, y + h * .15], [x + w * .27, y + h * .3]], 0xd4e1c3, 2, .6);
      this.ellipse(g, x - w * .25, y - 7, 17, 5, 0x9fb97d, .4);
      this.ellipse(g, x + w * .34, y + 1, 11, 4, 0x9fb97d, .4);
    }

    makeSpirit(color, size = 1) {
      const c = this.add.container(0, 0), g = this.g(c);
      this.ellipse(g, 0, 27, 35, 9, palette.ink, .08);
      this.poly(g, [[-17, 1], [-15, -13], [-5, -24], [3, -32], [7, -19], [18, -12], [23, 2], [17, 17], [3, 22], [-12, 17]], color);
      this.circle(g, -6, -10, 6, 0xffffff, .3);
      this.ellipse(g, -5, 1, 4.5, 7, palette.ink); this.ellipse(g, 8, 1, 4.5, 7, palette.ink);
      this.ellipse(g, -11, 9, 7, 3.5, palette.white, .65); this.ellipse(g, 13, 9, 7, 3.5, palette.white, .65);
      this.stroke(g, [[-1, 9], [2, 11], [5, 9]], palette.ink, 1.6);
      c.setScale(size); c.baseScale = size;
      return c;
    }

    makeRobot(scale = 1, tiny = false) {
      const c = this.add.container(0, 0), g = this.g(c);
      this.ellipse(g, 0, 43, 95, 22, palette.ink, .13);
      this.round(g, -43, 12, 24, 35, 10, palette.ink);
      this.round(g, 21, 12, 24, 35, 10, palette.ink);
      this.round(g, -38, 16, 9, 23, 4, 0x527b64);
      this.round(g, 31, 16, 7, 23, 4, 0x527b64);
      this.round(g, -38, -31, 78, 67, 23, 0xecebd6, palette.ink, 2.5);
      this.round(g, -38, 11, 78, 25, { tl: 0, tr: 0, bl: 20, br: 20 }, 0xc3d0a5);
      this.round(g, -31, -24, 65, 35, 14, palette.ink);
      this.round(g, -24, -20, 51, 8, 4, 0x52796b);
      this.circle(g, 0, 24, 7, palette.coral); this.circle(g, 0, 22, 3, 0xffc4a0);
      this.stroke(g, [[-44, -7], [-55, 2], [-54, 14]], palette.ink, 6);
      this.circle(g, -53, 14, 7, palette.lime);
      this.stroke(g, [[42, -5], [54, -16], [57, -7]], palette.ink, 6);
      this.circle(g, 56, -6, 6, palette.coral);
      this.stroke(g, [[0, -31], [-5, -47], [5, -59]], palette.ink, 4);
      const dish = this.add.container(tiny ? -9 : 8, tiny ? -58 : -86), dg = this.g(dish); c.add(dish);
      if (tiny) {
        this.ellipse(dg, 0, 0, 48, 18, palette.deep);
        this.ellipse(dg, 0, -3, 45, 17, palette.lime);
        this.ellipse(dg, 0, -4, 28, 9, 0xe9f7b2);
        this.stroke(dg, [[0, -4], [7, -18]], palette.ink, 2.5); this.circle(dg, 7, -18, 4, palette.coral);
        dish.angle = -15;
      } else {
        // A large, unmistakable parabolic antenna, carried by the friendly rover.
        this.poly(dg, [[-78, 0], [-59, 25], [-28, 40], [4, 46], [35, 35], [65, 16], [78, 0]], palette.deep);
        this.ellipse(dg, 0, 0, 159, 65, palette.ink);
        this.ellipse(dg, 0, -3, 151, 59, 0xd7ebae);
        this.ellipse(dg, 0, -4, 125, 45, 0xf4f7d6);
        dg.lineStyle(2, 0xa2bd85, .7).strokeEllipse(0, -4, 103, 34);
        dg.lineStyle(1.5, 0xb7cc94, .65).strokeEllipse(0, -4, 65, 22);
        this.stroke(dg, [[-60,-2], [4,-10], [57,-2]], 0x9bb781, 2, .55);
        this.stroke(dg, [[0,21], [8,-33], [50,-4]], palette.ink, 3);
        this.circle(dg, 8, -33, 6, palette.coral);
        this.circle(dg, 8, -35, 2.6, 0xffd6a8);
        this.ellipse(dg, -42, -17, 23, 6, 0xffffff, .65);
        dish.angle = -23;
        for (let i = 0; i < 3; i++) {
          dg.lineStyle(2, palette.green, .37 - i * .08);
          dg.beginPath(); dg.arc(8, -34, 24 + i * 14, -Math.PI * .78, -Math.PI * .22); dg.strokePath();
        }
        this.stroke(g, [[0,-33], [11,-48], [13,-72]], palette.ink, 7);
      }
      const eyes = this.add.container(0, -6), eg = this.g(eyes); c.add(eyes);
      this.round(eg, -18, -5, 8, 11, 4, palette.lime);
      this.round(eg, 10, -5, 8, 11, 4, palette.lime);
      this.stroke(eg, [[-4, 4], [0, 7], [4, 4]], palette.lime, 2);
      c.eyes = eyes; c.dish = dish; c.setScale(scale); c.baseScale = scale;
      if (!tiny) { c.setInteractive(new P.Geom.Rectangle(-60, -83, 120, 132), P.Geom.Rectangle.Contains); c.on('pointerdown', () => this.bounce(c)); c.input.cursor = 'pointer'; }
      return c;
    }

    makeZone(i) {
      const c = this.add.container(0, 0); this.root.add(c);
      const g = this.g(c);
      this.island(g, 0, 34, 168, 74);
      this.plant(g, -61, 25, .53); this.plant(g, 65, 27, .42);
      this.ellipse(g, 0, 22, 127, 45, palette.ink);
      this.ellipse(g, 0, 16, 126, 43, 0x6f9981);
      this.ellipse(g, 0, 10, 110, 36, 0xc6dcb3);
      this.ellipse(g, 0, 8, 92, 28, 0x6e9b85);
      this.circle(g, 0, -36, 54, 0xd9e8d8, .8);
      this.round(g, -54, -36, 108, 44, { tl: 0, tr: 0, bl: 16, br: 16 }, 0xd5e4d4);
      this.ellipse(g, 0, 5, 108, 30, 0xc4d9c4);
      this.stroke(g, [[-43, -34], [-39, -54], [-29, -67]], 0xffffff, 4, .85);
      this.circle(g, -22, -72, 3, 0xffffff, .8);
      this.ellipse(g, 0, 16, 122, 38, palette.ink, .13);
      this.stroke(g, [[-55, 5], [-43, 14], [-20, 21], [0, 23], [24, 20], [44, 13], [55, 4]], 0x426e5a, 3);
      for (let k = 0; k < 3; k++) this.circle(g, -12 + k * 12, 24, 2, palette.lime, .8);
      const fog = this.add.container(0, -29); c.add(fog);
      const fg = this.g(fog);
      this.cloud(fg, 1, 4, .68, .7); this.cloud(fg, -2, -15, .44, .55);
      this.star(fg, -28, -26, 4, palette.white); this.star(fg, 28, 7, 3, palette.white);
      const question = this.text(fog, '?', 0, -9, 31, '#688c74', '600'); question.setAlpha(.75);
      const noise = this.g(c);
      const hidden = this.makeRobot(.53, true); hidden.setPosition(0, -22).setVisible(false); c.add(hidden);
      const empty = this.add.container(0, -24); c.add(empty); const eg = this.g(empty);
      this.ellipse(eg, 0, 23, 45, 13, 0x5b8c73, .18); this.plant(eg, 0, 15, .6); empty.setVisible(false);
      const ring = this.g(c);
      const badge = this.add.container(0, 55); c.add(badge); const bg = this.g(badge);
      this.circle(bg, 0, 0, 16, palette.paper); this.circle(bg, 0, 0, 13, palette.deep);
      this.text(badge, 'ABC'[i], 0, 0, 15, '#e4f28d');
      const clues = this.g(c);
      const hit = this.add.zone(0, -4, 160, 180).setInteractive({ useHandCursor: true }); c.add(hit);
      hit.on('pointerdown', () => { this.bounce(c, .035); emit({ type: 'zone', zone: i }); });
      hit.on('pointerover', () => { if (!this.s.revealed) this.tweens.add({ targets: c, scaleX: 1.035, scaleY: 1.035, duration: 160 }); });
      hit.on('pointerout', () => this.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 160 }));
      if (!this.reduced) this.tweens.add({ targets: fog, y: -33, alpha: .82, duration: 1600 + i * 240, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      return { c, fog, noise, hidden, empty, ring, clues, hit };
    }

    makeHome() {
      const c = this.add.container(0, 0), g = this.g(c);
      this.island(g, 0, 28, 278, 82);
      this.plant(g, -108, 16, .8); this.plant(g, 110, 19, .6);
      // Small coral mushroom lights anchor the island in a friendly world.
      for (const [x, y, scale] of [[-91, 23, .8], [97, 21, .65]]) {
        this.round(g, x - 3 * scale, y - 21 * scale, 6 * scale, 24 * scale, 3, palette.white);
        this.ellipse(g, x, y - 22 * scale, 29 * scale, 17 * scale, palette.coral);
        this.circle(g, x - 6 * scale, y - 24 * scale, 2.3 * scale, palette.white); this.circle(g, x + 4 * scale, y - 26 * scale, 2 * scale, palette.white);
      }
      this.ellipse(g, 6, 18, 143, 39, 0xa1b97a, .6);
      this.ellipse(g, 6, 14, 123, 35, 0xf3edca);
      this.stroke(g, [[-48, 13], [-20, 22], [10, 24], [43, 19], [61, 11]], 0xc0ce99, 2);
      return c;
    }

    makeReferenceHome() {
      const c = this.add.container(0, 0), g = this.g(c);
      this.island(g, 0, 24, 145, 49, true);
      this.ellipse(g, 0, 13, 72, 29, 0x7c7792);
      this.ellipse(g, 0, 8, 72, 27, 0xb9a9d5);
      this.ellipse(g, 0, 5, 53, 19, 0xe7dbef);
      this.circle(g, -26, 15, 2, palette.white); this.circle(g, 26, 15, 2, palette.white);
      this.plant(g, -55, 17, .38);
      const seal = this.g(c); c.seal = seal;
      return c;
    }

    makeSource() {
      const c = this.add.container(0, 0), g = this.g(c);
      this.ellipse(g, 0, 19, 64, 21, palette.ink, .09);
      this.round(g, -26, -17, 52, 40, 13, palette.deep);
      this.ellipse(g, 0, -15, 52, 24, 0x6f9a76);
      this.ellipse(g, 0, -18, 36, 17, palette.lime);
      this.ellipse(g, 0, -20, 20, 8, palette.white);
      this.ellipse(g, -9, -20, 14, 8, palette.lime);
      this.ellipse(g, 9, -20, 14, 8, palette.lilac);
      this.stroke(g, [[-8,-22], [-2,-27], [4,-27], [10,-22]], palette.white, 2);
      this.circle(g, -9, 8, 3, palette.lime); this.circle(g, 9, 8, 3, palette.lilac);
      this.star(g, 0, -33, 9, palette.coral);
      return c;
    }

    makeReceiver() {
      const c = this.add.container(0, 0), g = this.g(c);
      this.ellipse(g, 0, 24, 77, 20, palette.ink, .10);
      this.round(g, -35, -16, 70, 43, 12, palette.ink);
      this.round(g, -31, -19, 62, 31, 10, 0x729477);
      this.round(g, -24, -12, 48, 20, 5, 0x203f36);
      this.stroke(g, [[-18,1],[-12,-2],[-7,2],[-2,-6],[3,3],[9,-3],[15,1],[19,-1]], 0xc8e594, 1.7);
      this.circle(g, -20, 18, 4, palette.coral); this.circle(g, 20, 18, 4, palette.lilac);
      const glow = this.g(c); c.glow = glow;
      return c;
    }

    layout() {
      if (!this.root) return;
      // The shell changes height when leaving the cover. Read that real viewport
      // rather than relying on a ScaleManager size from the previous frame.
      const bounds = node.getBoundingClientRect();
      const w = Math.max(1, bounds.width || this.scale.width);
      const h = Math.max(1, bounds.height || this.scale.height);
      this.mobile = w < 640;
      const vw = this.mobile ? 620 : 960, vh = this.mobile ? 680 : 570;
      const intro = this.s.phase === 'intro';
      const availableW = intro && !this.mobile ? w * .64 : w;
      const availableH = intro && this.mobile ? h - 235 : h - (intro ? 0 : 62);
      const fit = Math.min(availableW / vw, Math.max(100, availableH) / vh) * (intro ? 1 : .94);
      const left = intro && !this.mobile ? w * .36 : 0;
      const top = intro && this.mobile ? 235 : intro ? 0 : 48;
      this.root.setPosition(left + (availableW - vw * fit) / 2, top + (availableH - vh * fit) / 2).setScale(fit);
      this.vw = vw; this.vh = vh;
      const positions = this.mobile ? [[133, 242], [311, 155], [490, 242]] : [[281, 226], [486, 163], [704, 230]];
      this.zoneObjects.forEach((z, i) => z.c.setPosition(...positions[i]));
      const heroPos = this.mobile ? [365, 531] : [541, 429];
      this.hero.setPosition(...heroPos);
      this.home.setPosition(heroPos[0], heroPos[1] + 13);
      this.referenceHome.setPosition(this.mobile ? 148 : 226, this.mobile ? 518 : 411);
      this.reference.setPosition(this.referenceHome.x, this.referenceHome.y - 21);
      this.explorer.setPosition(this.mobile ? 251 : 409, this.mobile ? 450 : 373);
      this.source.setPosition(this.mobile ? 230 : 350, this.mobile ? 552 : 435);
      this.receiver.setPosition(this.hero.x + 91, this.hero.y + 22);
      this.drawLabels();
      this.drawBackground(); this.drawConnections(); this.paintHint();
    }

    drawLabels() {
      this.labels.removeAll(true);
      this.text(this.labels, '量子照明雷达', this.hero.x, this.hero.y + 118, this.mobile ? 22 : 20, '#173f36');
      this.text(this.labels, '小参留在家', this.referenceHome.x - 9, this.referenceHome.y + 65, this.mobile ? 18 : 15, '#8976a4', '500');
      this.text(this.labels, '纠缠源', this.source.x - 5, this.source.y + 59, this.mobile ? 17 : 14, '#416c50', '600');
      this.text(this.labels, '一起检查', this.receiver.x + 10, this.receiver.y + 49, this.mobile ? 17 : 14, '#416c50', '600');
      const z = this.zoneObjects[this.s.selectedZone ?? 0]?.c || this.zoneObjects[0].c;
      const outx = this.hero.x - 125;
      const outy = this.hero.y - 175;
      this.text(this.labels, '发射 ↑', outx, outy, this.mobile ? 18 : 14, '#728945', '600');
      this.text(this.labels, '回波 + 噪声 ↓', (this.hero.x + z.x) / 2 + 91, (this.hero.y + z.y) / 2 - 5, this.mobile ? 16 : 13, '#917e58', '600');
    }

    drawBackground() {
      const g = this.back; g.clear();
      const w = this.vw, h = this.vh;
      this.ellipse(g, w * .52, h * .48, w * .88, h * .77, 0xe8eddd, .75);
      this.ellipse(g, w * .54, h * .46, w * .71, h * .63, 0xf1f2e6, .7);
      this.cloud(g, w * .12, h * .19, .7, .85);
      this.cloud(g, w * .88, h * .55, .9, .85);
      this.cloud(g, w * .1, h * .72, .6, .8);
      this.cloud(g, w * .8, h * .1, .7, .6);
      const decor = this.decor; decor.removeAll(true);
      const dg = this.g(decor);
      this.island(dg, w * .88, h * .7, 70, 37, true); this.plant(dg, w * .88, h * .7 - 7, .7);
      this.island(dg, w * .10, h * .46, 45, 24, true); this.plant(dg, w * .10, h * .46 - 7, .4);
      this.poly(dg, [[w * .69, h * .88], [w * .71, h * .87], [w * .72, h * .9], [w * .7, h * .91]], 0x9eb893);
      const spots = [[.2,.1,5], [.62,.1,4], [.88,.31,5], [.07,.35,3], [.67,.6,4], [.26,.61,4], [.78,.87,3], [.11,.85,4]];
      spots.forEach(([x, y, r], i) => this.star(dg, w * x, h * y, r, i % 2 ? 0xc9b5df : 0xb2c77b));
      for (let i = 0; i < 21; i++) this.circle(dg, 25 + ((i * 113) % (w - 40)), 45 + ((i * 77) % (h - 100)), i % 3 ? 1.3 : 2.2, 0x9cac86, .28);
    }

    drawConnections() {
      if (!this.lines) return;
      const g = this.lines; g.clear();
      const end = this.zoneObjects[this.s.selectedZone ?? 0]?.c || this.zoneObjects[0].c;
      const source = { x: this.hero.x + 3, y: this.hero.y - 120 };
      const points = new P.Curves.QuadraticBezier(new P.Math.Vector2(source.x, source.y), new P.Math.Vector2(source.x - 85, end.y + 24), new P.Math.Vector2(end.x, end.y - 25)).getPoints(36);
      for (let i = 0; i < points.length - 1; i += 3) this.stroke(g, [[points[i].x, points[i].y], [points[i + 1].x, points[i + 1].y]], 0x8ca67e, 2, .38);
      const back = new P.Curves.QuadraticBezier(new P.Math.Vector2(end.x, end.y - 15), new P.Math.Vector2(end.x + 104, this.hero.y - 137), new P.Math.Vector2(this.receiver.x, this.receiver.y - 17)).getPoints(36);
      for (let i = 0; i < back.length - 1; i += 3) this.stroke(g, [[back[i].x, back[i].y], [back[i + 1].x, back[i + 1].y]], 0x80a78b, 2, .32);
      const ref = new P.Curves.QuadraticBezier(new P.Math.Vector2(this.referenceHome.x + 28, this.referenceHome.y), new P.Math.Vector2(this.referenceHome.x + 130, this.hero.y + 65), new P.Math.Vector2(this.receiver.x - 20, this.receiver.y + 18)).getPoints(24);
      for (let i = 0; i < ref.length - 1; i += 3) this.stroke(g, [[ref[i].x, ref[i].y], [ref[i + 1].x, ref[i + 1].y]], palette.lilac, 2.5, this.s.referenceReady ? .8 : .35);
      this.stroke(g, [[this.source.x - 16,this.source.y - 9], [this.reference.x + 25,this.reference.y + 20]], palette.lilac, 3, .65);
      this.stroke(g, [[this.source.x + 15,this.source.y - 14], [this.explorer.x - 8,this.explorer.y + 24], [this.hero.x - 59,this.hero.y - 39], [this.hero.x - 20,this.hero.y - 69]], 0xa6c65c, 3, .7);
    }

    paintHint() {
      if (!this.hint) return;
      const g = this.hint; g.clear();
      if (this.s.phase === 'prepare' && !this.s.referenceReady) {
        const x = this.reference.x, y = this.reference.y;
        this.stroke(g, [[x, y - 65], [x, y - 45], [x - 6, y - 51], [x, y - 45], [x + 6, y - 51]], palette.ink, 2.5);
        this.star(g, x - 39, y - 11, 7, palette.lilac); this.star(g, x + 37, y - 5, 5, palette.lilac);
      }
      if (this.s.phase === 'align') {
        const x = this.receiver.x, y = this.receiver.y - 32;
        this.circle(g, x - 20, y, 8, palette.coral);
        this.circle(g, x - 25, y - 3, 4, 0xd5df86);
        this.circle(g, x - 16, y + 2, 3, 0xedc48a);
        this.circle(g, x + 20, y, 8, palette.lilac);
        this.stroke(g, [[x-15,y+12], [x-8,y+18]], palette.coral, 2.5);
        this.stroke(g, [[x+15,y+12], [x+8,y+18]], palette.lilac, 2.5);
      }
      const rg = this.receiver.glow; rg.clear();
      if (this.s.receiverActive || this.s.phase === 'align') {
        rg.lineStyle(3, palette.lime, .95).strokeRoundedRect(-41, -25, 82, 57, 16);
        this.star(rg, -41, -26, 7, palette.lime); this.star(rg, 40, -24, 5, palette.lilac);
      }
    }

    applyState(state) {
      const wasRevealed = this.s?.revealed;
      const wasIntro = this.s?.phase === 'intro';
      this.s = { ...this.s, ...state };
      if (wasIntro !== (this.s.phase === 'intro')) this.layout();
      this.zoneObjects.forEach((z, i) => {
        const selected = i === Number(this.s.selectedZone);
        z.ring.clear();
        if (selected && !this.s.revealed) {
          z.ring.lineStyle(3, palette.coral, .9).strokeEllipse(0, 21, 145, 50);
          this.poly(z.ring, [[-6,-111], [6,-111], [0,-103]], palette.coral);
          this.circle(z.ring, 0, -119, 3, palette.coral);
        }
        z.clues.clear();
        const samples = Number(this.s.clues?.[i]?.samples) || 0;
        for (let k = 0; k < Math.min(6, Math.ceil(samples / 8)); k++) this.circle(z.clues, -17 + k * 7, 82, 2.5, palette.ink, .7);
        z.fog.setVisible(!this.s.revealed);
        // The secret is referenced only after the player has committed to a reveal.
        if (this.s.revealed) {
          const found = i === Number(this.s.targetZone);
          z.hidden.setVisible(found); z.empty.setVisible(!found);
          if (found) {
            z.ring.lineStyle(3, palette.lime, 1).strokeEllipse(0, 21, 146, 52);
            this.star(z.ring, -53, -75, 10, palette.coral); this.star(z.ring, 53, -62, 7, palette.lime);
            if (!wasRevealed) this.bounce(z.hidden, .12);
          }
        } else { z.hidden.setVisible(false); z.empty.setVisible(false); }
      });
      const seal = this.referenceHome.seal; seal.clear();
      if (this.s.referenceReady) {
        seal.lineStyle(2.5, 0x9d85c3, .65).strokeEllipse(0, 7, 86, 35);
        this.circle(seal, 29, -20, 12, palette.ink);
        this.stroke(seal, [[23,-20], [27,-16], [35,-25]], palette.lime, 2.5);
      }
      if (!this.sourcePreparing) this.reference.setAlpha(this.pairSpent ? .2 : this.s.referenceReady ? 1 : .6);
      this.drawConnections(); this.drawLabels(); this.paintHint();
      this.paintAmbientNoise(this.time.now);
    }

    update(time) {
      if (!this.zoneObjects || this.reduced || time - (this.lastNoisePaint || 0) < 120) return;
      this.lastNoisePaint = time;
      this.paintAmbientNoise(time);
    }

    paintAmbientNoise(time = 0) {
      const noise = Math.max(0, Math.min(1, Number(this.s.noise) || 0));
      const count = 5 + Math.round(noise * 24);
      this.zoneObjects.forEach((z, index) => {
        const g = z.noise; g.clear();
        const t = this.reduced ? 0 : time / 1700;
        for (let i = 0; i < count; i++) {
          const x = Math.sin(i * 2.399 + t * .24 + index * 1.1) * 43;
          const y = -38 + Math.cos(i * 1.371 + t * .37 + index) * 35;
          this.circle(g, x, y, i % 5 === 0 ? 3 : 1.8, palette.coral, this.s.revealed ? .25 : .6);
          if (i % 7 === 0) this.stroke(g, [[x-4,y+5],[x,y+3],[x+4,y+5]], 0xd6a36f, 1, .45);
        }
      });
    }

    prepareSource(done = null) {
      if (this.sourcePreparing) return false;
      this.sourcePreparing = true;
      this.pairSpent = true;
      this.reference.setAlpha(.2); this.explorer.setAlpha(.4);
      const start = new P.Math.Vector2(this.source.x, this.source.y - 22);
      const green = this.makeSpirit(palette.lime, .52);
      const purple = this.makeSpirit(palette.lilac, .52);
      this.effects.add([green, purple]);
      green.setPosition(start.x - 6, start.y); purple.setPosition(start.x + 6, start.y);
      const greenPath = new P.Curves.QuadraticBezier(start, new P.Math.Vector2(this.explorer.x - 20, this.explorer.y - 8), new P.Math.Vector2(this.hero.x + 3, this.hero.y - 120));
      const purplePath = new P.Curves.QuadraticBezier(start, new P.Math.Vector2(this.reference.x + 12, this.reference.y + 38), new P.Math.Vector2(this.reference.x, this.reference.y));
      const trace = this.g(this.effects), v = { t: 0 };
      this.sparkle(start.x, start.y, palette.lime, 6); this.sparkle(start.x, start.y, palette.lilac, 6);
      this.bounce(this.source, .12);
      this.tweens.add({ targets: v, t: 1, duration: 700, ease: 'Sine.inOut', onUpdate: () => {
        const a = greenPath.getPoint(v.t), b = purplePath.getPoint(v.t);
        green.setPosition(a.x, a.y); purple.setPosition(b.x, b.y);
        trace.clear();
        for (let k = 1; k <= 5; k++) {
          const gp = greenPath.getPoint(Math.max(0, v.t - k * .025));
          const pp = purplePath.getPoint(Math.max(0, v.t - k * .025));
          this.circle(trace, gp.x, gp.y, 3 - k * .4, palette.lime, .6 - k * .08);
          this.circle(trace, pp.x, pp.y, 3 - k * .4, palette.lilac, .6 - k * .08);
        }
      }, onComplete: () => {
        green.destroy(); purple.destroy(); trace.destroy();
        this.pairSpent = false; this.sourcePreparing = false;
        this.reference.setAlpha(1); this.explorer.setAlpha(1);
        this.bounce(this.reference, .12);
        if (this.pendingShot !== undefined) {
          const shot = this.pendingShot; this.pendingShot = undefined; this.runFlight(shot);
        } else if (done) done();
        else emit({ type: 'source-prepared' });
      } });
      return true;
    }

    bounce(target, strength = .075) {
      if (!target || this.reduced) return;
      const scale = target.baseScale || 1;
      this.tweens.add({ targets: target, scaleX: scale * (1 + strength), scaleY: scale * (1 - strength), duration: 100, yoyo: true, ease: 'Sine.inOut', onComplete: () => target.setScale(scale) });
    }

    sparkle(x, y, color, count = 9) {
      for (let i = 0; i < count; i++) {
        const p = this.add.graphics(); this.effects.add(p);
        this.star(p, 0, 0, 3 + (i % 3), color);
        p.setPosition(x, y);
        const angle = i / count * Math.PI * 2;
        this.tweens.add({ targets: p, x: x + Math.cos(angle) * (24 + (i % 3) * 8), y: y + Math.sin(angle) * 30, alpha: 0, angle: 80, duration: 500, ease: 'Cubic.out', onComplete: () => p.destroy() });
      }
    }

    launch(zoneIndex) {
      if (this.flightActive || this.s.revealed) return false;
      const zi = Math.max(0, Math.min(2, Number(zoneIndex) || 0));
      this.flightActive = true;
      // Every shot gets a fresh locally generated signal/reference preparation.
      if (this.sourcePreparing) this.pendingShot = zi;
      else this.prepareSource(() => this.runFlight(zi));
      return true;
    }

    runFlight(zi) {
      const z = this.zoneObjects[zi].c;
      const flight = this.makeSpirit(palette.lime, .57); this.effects.add(flight);
      const trail = this.g(this.effects);
      const mixed = this.g(this.effects);
      const noise = Math.max(0, Math.min(1, Number(this.s.noise) || 0));
      const source = new P.Math.Vector2(this.hero.x + 3, this.hero.y - 120);
      const destination = new P.Math.Vector2(z.x, z.y - 25);
      const receiver = new P.Math.Vector2(this.receiver.x, this.receiver.y - 17);
      const outbound = new P.Curves.QuadraticBezier(source, new P.Math.Vector2(source.x - 85, z.y + 24), destination);
      const inbound = new P.Curves.QuadraticBezier(destination, new P.Math.Vector2(z.x + 104, receiver.y - 100), receiver);
      this.bounce(this.explorer, .14);
      this.sparkle(source.x, source.y, palette.lime, 7);
      const timer = { t: 0 };
      let turned = false;
      this.tweens.add({ targets: timer, t: 1, duration: 1600, ease: 'Linear', onUpdate: () => {
        const returning = timer.t >= .48;
        const curve = returning ? inbound : outbound;
        const progress = returning ? (timer.t - .48) / .52 : timer.t / .48;
        const p = curve.getPoint(progress); flight.setPosition(p.x, p.y);
        flight.setVisible(!returning);
        trail.clear();
        for (let k = 1; k <= 7; k++) {
          const q = curve.getPoint(Math.max(0, progress - k * .022));
          const color = returning ? [palette.coral, 0xd6d887, 0xdcb58a][k % 3] : palette.lime;
          this.circle(trail, q.x, q.y, returning ? 4.5 - k * .35 : 3.4 - k * .34, color, .7 - k * .07);
        }
        mixed.clear();
        if (returning) {
          // An explanatory mixture: colours cannot identify an individual return
          // at the receiver, and the animation never depends on target truth.
          this.ellipse(mixed, p.x, p.y, 42, 30, 0xe6d7a9, .28);
          const count = 7 + Math.round(noise * 20);
          for (let k = 0; k < count; k++) {
            const angle = k * 2.399 + progress * 4;
            const phase = (progress * 2.7 + k * .137) % 1;
            const radius = 12 + (1 - phase) * (32 + noise * 20);
            const x = p.x + Math.cos(angle) * radius;
            const y = p.y + Math.sin(angle) * radius * .7;
            this.circle(mixed, x, y, 2 + (k % 3) * .5, palette.coral, .22 + phase * .55);
            if (k % 4 === 0) this.stroke(mixed, [[x + Math.cos(angle)*5,y + Math.sin(angle)*3], [x,y]], palette.coral, 1.4, .4);
          }
          for (let k = 0; k < 9; k++) {
            const angle = k * 2.399 - progress * 3;
            const radius = 5 + (k % 3) * 4;
            this.circle(mixed, p.x + Math.cos(angle)*radius, p.y + Math.sin(angle)*radius*.7, 3.1, [0xd5df86,palette.coral,0xdcb58a][k%3], .85);
          }
        }
        if (returning && !turned) {
          turned = true;
          this.sparkle(z.x, z.y - 30, palette.coral, 8 + Math.round(noise * 14));
          this.bounce(z, .05);
          // No reflection strength, route, timing, or animation reads the hidden target.
          if (this.s.referenceReady) this.sendReference(receiver);
        }
      }, onComplete: () => {
        flight.destroy(); trail.destroy(); mixed.destroy(); this.flightActive = false;
        this.sparkle(receiver.x, receiver.y, 0xe0cf9a, 8);
        this.bounce(this.hero, .09);
        emit({ type: 'returned', zone: zi });
      } });
    }

    sendReference(receiver) {
      const reference = this.makeSpirit(palette.lilac, .47); this.effects.add(reference);
      const path = new P.Curves.QuadraticBezier(new P.Math.Vector2(this.reference.x, this.reference.y), new P.Math.Vector2(this.reference.x + 135, this.hero.y + 55), receiver);
      const v = { t: 0 };
      this.pairSpent = true; this.reference.setAlpha(.2);
      this.tweens.add({ targets: v, t: 1, duration: 750, ease: 'Sine.inOut', onUpdate: () => { const p = path.getPoint(v.t); reference.setPosition(p.x, p.y); }, onComplete: () => reference.destroy() });
      this.bounce(this.reference, .12);
    }
  }

  const game = new P.Game({ type: P.AUTO, parent: node, width: Math.max(1, node.clientWidth), height: Math.max(460, node.clientHeight || 570), transparent: true, antialias: true, roundPixels: false, resolution: Math.min(window.devicePixelRatio || 1, 2), scene: EchoIsland, scale: { mode: P.Scale.RESIZE, autoCenter: P.Scale.NO_CENTER }, render: { antialias: true, pixelArt: false, powerPreference: 'low-power' }, audio: { noAudio: true }, banner: false });
  const observer = new ResizeObserver(entries => {
    if (destroyed) return;
    const rect = entries[0].contentRect;
    if (rect.width > 0) {
      game.scale.resize(rect.width, Math.max(460, rect.height || 570));
      sceneRef?.layout();
    }
  });
  observer.observe(node);
  return {
    setState(state = {}) { pendingState = { ...pendingState, ...state }; sceneRef?.applyState(pendingState); },
    prepareSource() { return sceneRef && !sceneRef.flightActive ? sceneRef.prepareSource() : false; },
    launch(zoneIndex) { return sceneRef?.launch(zoneIndex) || false; },
    setPaused(value) { paused = !!value; if (sceneRef) paused ? game.scene.pause(sceneKey) : game.scene.resume(sceneKey); },
    destroy() { destroyed = true; observer.disconnect(); sceneRef = null; game.destroy(true); },
  };
}
