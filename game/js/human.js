// 人間フェーズのロジック
import { CONFIG } from './data.js';
import { drawButton, hitTest, drawEmoji, drawMoney, drawMessage, Particles } from './ui.js';

export class HumanScene {
  constructor(game) { this.game = game; }

  enter() {
    this.px = CONFIG.BASE_WIDTH / 2;
    this.py = CONFIG.BASE_HEIGHT * 0.55;
    this.targetX = this.px;
    this.targetY = this.py;
    this.running = false;
    this.kicking = false;
    this.kickTimer = 0;
    this.particles = new Particles();
    this.buildings = this._makeBuildings();
    this.npcs = this._makeNPCs();
    this.npcTimer = 0;
    this.buttons = {};
    this.moveSpeed = this.game.economy.has('shoes') ? 4 : 2.5;
  }

  _makeBuildings() {
    return [
      { x: 30, y: 120, w: 70, h: 80, color: '#e67e22', label: '🏠' },
      { x: 150, y: 100, w: 90, h: 100, color: '#3498db', label: '🏢' },
      { x: 290, y: 130, w: 80, h: 70, color: '#e74c3c', label: '🏪' },
      { x: 60, y: 280, w: 100, h: 60, color: '#9b59b6', label: '🏫' },
      { x: 250, y: 260, w: 75, h: 80, color: '#1abc9c', label: '🏥' },
    ];
  }

  _makeNPCs() {
    const npcs = [];
    for (let i = 0; i < 4; i++) {
      npcs.push({
        x: 60 + Math.random() * 280,
        y: 350 + Math.random() * 150,
        emoji: ['👦', '👧', '👨', '👩'][i],
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        timer: Math.random() * 3,
      });
    }
    return npcs;
  }

  update(dt) {
    this.game.economy.update(dt);
    // 移動
    const dx = this.targetX - this.px;
    const dy = this.targetY - this.py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = this.running ? this.moveSpeed * 2 : this.moveSpeed;
    if (dist > 5) {
      this.px += (dx / dist) * speed * 60 * dt;
      this.py += (dy / dist) * speed * 60 * dt;
    }
    // 画面内制限
    this.px = Math.max(20, Math.min(CONFIG.BASE_WIDTH - 20, this.px));
    this.py = Math.max(200, Math.min(CONFIG.BASE_HEIGHT - 150, this.py));

    // 蹴りタイマー
    if (this.kicking) {
      this.kickTimer -= dt;
      if (this.kickTimer <= 0) this.kicking = false;
    }

    // NPC移動
    this.npcTimer += dt;
    for (const npc of this.npcs) {
      npc.timer -= dt;
      if (npc.timer <= 0) {
        npc.vx = (Math.random() - 0.5) * 1.5;
        npc.vy = (Math.random() - 0.5) * 1.5;
        npc.timer = 2 + Math.random() * 3;
      }
      npc.x += npc.vx;
      npc.y += npc.vy;
      npc.x = Math.max(20, Math.min(CONFIG.BASE_WIDTH - 20, npc.x));
      npc.y = Math.max(350, Math.min(CONFIG.BASE_HEIGHT - 150, npc.y));
    }

    this.particles.update(dt);

    // あの人チェック
    if (this.game.economy.shouldAnoHito() && !this.game.anoHitoTriggered) {
      this.game.anoHitoTriggered = true;
      this.game.anoHitoForm = 'human';
      this.game.changeScene('anoHito');
    }
    // クリア判定
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
    this.particles.spawn(this.px + 25, this.py - 10, '💰', 3);
    this.particles.spawn(this.px + 20, this.py, '💥', 1);
  }

  render(ctx) {
    const W = CONFIG.BASE_WIDTH, H = CONFIG.BASE_HEIGHT;
    // 空
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, W, 200);
    // 地面
    ctx.fillStyle = '#8BC34A';
    ctx.fillRect(0, 200, W, H - 200);
    // 道路
    ctx.fillStyle = '#999';
    ctx.fillRect(0, 320, W, 50);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(0, 345); ctx.lineTo(W, 345); ctx.stroke();
    ctx.setLineDash([]);

    // 建物
    for (const b of this.buildings) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      drawEmoji(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2, 28);
    }

    // NPC
    for (const npc of this.npcs) {
      drawEmoji(ctx, npc.emoji, npc.x, npc.y, 28);
    }

    // プレイヤー
    const pEmoji = this.kicking ? '🦶' : (this.running ? '🏃' : '🚶');
    drawEmoji(ctx, pEmoji, this.px, this.py, 36);
    if (this.kicking) {
      drawEmoji(ctx, '💥', this.px + 25, this.py - 5, 22);
    }

    this.particles.render(ctx);

    // コンボ表示
    const combo = this.game.economy.combo;
    if (combo > 1) {
      drawMessage(ctx, `${combo}コンボ！x${(1 + combo * CONFIG.COMBO_BONUS).toFixed(1)}`, W, this.py - 50,
        { fontSize: 18, color: '#FF5722' });
    }

    // HUD
    drawMoney(ctx, this.game.economy.money, 10, 10);

    // ボタン
    this.buttons.kick = drawButton(ctx, W / 2 - 70, H - 120, 140, 55, '🦶 蹴る！',
      { color: '#FF5722', fontSize: 22 });
    this.buttons.shop = drawButton(ctx, W - 100, H - 60, 90, 40, '🛒 ショップ',
      { color: '#2196F3', fontSize: 14 });
    this.buttons.race = drawButton(ctx, 10, H - 60, 90, 40, '🏁 レース',
      { color: '#FF9800', fontSize: 14 });

    if (this.game.economy.has('sheep')) {
      this.buttons.toSheep = drawButton(ctx, W / 2 - 55, H - 60, 110, 40, '🐑 羊に変身',
        { color: '#8BC34A', fontSize: 14 });
    }
  }

  onClick(x, y) {
    if (this.buttons.kick && hitTest(this.buttons.kick, x, y)) {
      this.doKick();
      return;
    }
    if (this.buttons.shop && hitTest(this.buttons.shop, x, y)) {
      this.game.changeScene('shop');
      return;
    }
    if (this.buttons.race && hitTest(this.buttons.race, x, y)) {
      this.game.changeScene('vehicleSelect');
      return;
    }
    if (this.buttons.toSheep && hitTest(this.buttons.toSheep, x, y)) {
      this.game.changeScene('transformToSheep');
      return;
    }
    // 移動先設定
    if (y > 200 && y < CONFIG.BASE_HEIGHT - 130) {
      this.targetX = x;
      this.targetY = y;
    }
  }

  onKeyDown(key) {
    if (key === ' ' || key === 'Enter') this.doKick();
    if (key === 'Shift') this.running = true;
  }
  onKeyUp(key) {
    if (key === 'Shift') this.running = false;
  }
  onRelease() {}
}
