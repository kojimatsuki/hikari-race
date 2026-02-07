// 羊フェーズのロジック
import { CONFIG } from './data.js';
import { drawButton, hitTest, drawEmoji, drawMoney, drawMessage, Particles } from './ui.js';

export class SheepScene {
  constructor(game) { this.game = game; }

  enter() {
    this.px = CONFIG.BASE_WIDTH / 2;
    this.py = CONFIG.BASE_HEIGHT * 0.5;
    this.targetX = this.px;
    this.targetY = this.py;
    this.kicking = false;
    this.kickTimer = 0;
    this.mehTimer = 0;
    this.mehBubble = false;
    this.particles = new Particles();
    this.otherSheep = this._makeSheep();
    this.flowers = this._makeFlowers();
    this.buttons = {};
  }

  _makeSheep() {
    const sheep = [];
    for (let i = 0; i < 6; i++) {
      sheep.push({
        x: 40 + Math.random() * 320,
        y: 200 + Math.random() * 300,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        timer: Math.random() * 5,
        meh: false, mehT: 0,
      });
    }
    return sheep;
  }

  _makeFlowers() {
    const flowers = [];
    const types = ['🌸', '🌼', '🌻', '🌷', '🌺'];
    for (let i = 0; i < 15; i++) {
      flowers.push({
        x: Math.random() * CONFIG.BASE_WIDTH,
        y: 100 + Math.random() * 500,
        emoji: types[Math.floor(Math.random() * types.length)],
      });
    }
    return flowers;
  }

  update(dt) {
    this.game.economy.update(dt);
    // 移動
    const dx = this.targetX - this.px;
    const dy = this.targetY - this.py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      this.px += (dx / dist) * 2 * 60 * dt;
      this.py += (dy / dist) * 2 * 60 * dt;
    }
    this.px = Math.max(20, Math.min(CONFIG.BASE_WIDTH - 20, this.px));
    this.py = Math.max(80, Math.min(CONFIG.BASE_HEIGHT - 150, this.py));

    if (this.kicking) { this.kickTimer -= dt; if (this.kickTimer <= 0) this.kicking = false; }
    if (this.mehBubble) { this.mehTimer -= dt; if (this.mehTimer <= 0) this.mehBubble = false; }

    // 他の羊
    for (const s of this.otherSheep) {
      s.timer -= dt;
      if (s.timer <= 0) {
        s.vx = (Math.random() - 0.5) * 0.8;
        s.vy = (Math.random() - 0.5) * 0.8;
        s.timer = 3 + Math.random() * 4;
        if (Math.random() < 0.2) { s.meh = true; s.mehT = 1.5; }
      }
      if (s.meh) { s.mehT -= dt; if (s.mehT <= 0) s.meh = false; }
      s.x += s.vx;
      s.y += s.vy;
      s.x = Math.max(20, Math.min(CONFIG.BASE_WIDTH - 20, s.x));
      s.y = Math.max(100, Math.min(CONFIG.BASE_HEIGHT - 150, s.y));
    }

    this.particles.update(dt);

    // あの人チェック
    if (this.game.economy.shouldAnoHito() && !this.game.anoHitoTriggered) {
      this.game.anoHitoTriggered = true;
      this.game.anoHitoForm = 'sheep';
      this.game.changeScene('anoHito');
    }
    if (this.game.economy.isNormalClear() && !this.game.clearShown) {
      this.game.clearShown = true;
      this.game.changeScene('gameClear');
    }
  }

  doKick() {
    this.kicking = true;
    this.kickTimer = 0.3;
    const amount = this.game.economy.addKickMoney(this.game.economy.has('boots'));
    this.game.audio.kick();
    this.game.audio.coin();
    this.particles.spawn(this.px + 20, this.py, '💰', 3);
    this.particles.spawn(this.px + 15, this.py + 5, '💥', 1);
  }

  doMeh() {
    this.mehBubble = true;
    this.mehTimer = 1.5;
    this.game.audio.meh();
    // 近くの羊も鳴く
    for (const s of this.otherSheep) {
      const d = Math.hypot(s.x - this.px, s.y - this.py);
      if (d < 120) { s.meh = true; s.mehT = 1.5; }
    }
  }

  render(ctx) {
    const W = CONFIG.BASE_WIDTH, H = CONFIG.BASE_HEIGHT;
    // 空
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, W, 80);
    // 牧場
    const grad = ctx.createLinearGradient(0, 80, 0, H);
    grad.addColorStop(0, '#7CB342');
    grad.addColorStop(1, '#558B2F');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 80, W, H - 80);

    // 柵
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 80, W - 20, H - 170);
    for (let i = 0; i < 12; i++) {
      const x = 10 + i * (W - 20) / 11;
      ctx.beginPath(); ctx.moveTo(x, 75); ctx.lineTo(x, 95); ctx.stroke();
    }

    // 花
    for (const f of this.flowers) drawEmoji(ctx, f.emoji, f.x, f.y, 16);

    // 他の羊
    for (const s of this.otherSheep) {
      drawEmoji(ctx, '🐑', s.x, s.y, 30);
      if (s.meh) {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('メェ〜', s.x, s.y - 22);
      }
    }

    // プレイヤー羊
    const pEmoji = this.kicking ? '🐑💥' : '🐑';
    drawEmoji(ctx, pEmoji, this.px, this.py, 38);
    if (this.mehBubble) {
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText('メェ〜〜！', this.px, this.py - 30);
    }

    this.particles.render(ctx);

    const combo = this.game.economy.combo;
    if (combo > 1) {
      drawMessage(ctx, `${combo}コンボ！x${(1 + combo * CONFIG.COMBO_BONUS).toFixed(1)}`, W, this.py - 55,
        { fontSize: 18, color: '#FF5722' });
    }

    // HUD
    drawMoney(ctx, this.game.economy.money, 10, 10);

    // ボタン
    this.buttons.kick = drawButton(ctx, W / 2 - 70, H - 120, 140, 55, '🐑💥 蹴る！',
      { color: '#FF5722', fontSize: 22 });
    this.buttons.meh = drawButton(ctx, 10, H - 60, 100, 40, '🐑 メェ〜',
      { color: '#8BC34A', fontSize: 14 });
    this.buttons.back = drawButton(ctx, W - 110, H - 60, 100, 40, '🏃 人間に戻る',
      { color: '#2196F3', fontSize: 13 });
  }

  onClick(x, y) {
    if (this.buttons.kick && hitTest(this.buttons.kick, x, y)) { this.doKick(); return; }
    if (this.buttons.meh && hitTest(this.buttons.meh, x, y)) { this.doMeh(); return; }
    if (this.buttons.back && hitTest(this.buttons.back, x, y)) {
      this.game.changeScene('transformToHuman');
      return;
    }
    if (y > 80 && y < CONFIG.BASE_HEIGHT - 130) {
      this.targetX = x;
      this.targetY = y;
    }
  }

  onKeyDown(key) {
    if (key === ' ' || key === 'Enter') this.doKick();
    if (key === 'm') this.doMeh();
  }
  onKeyUp() {}
  onRelease() {}
}
