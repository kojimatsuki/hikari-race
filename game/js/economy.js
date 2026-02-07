// お金システム・ショップ・「あの人」イベント
import { CONFIG, SHOP_ITEMS, MSG } from './data.js';
import { drawButton, hitTest, drawEmoji, drawMoney, drawMessage } from './ui.js';

export class Economy {
  constructor() {
    this.money = 0;
    this.totalEarned = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.inventory = [];
    this.anoHitoTimer = 0;
    this.anoHitoDefeats = 0;
    this.sheepDefeat = false;
  }

  addKickMoney(hasBoot) {
    const base = CONFIG.KICK_MIN + Math.random() * (CONFIG.KICK_MAX - CONFIG.KICK_MIN) | 0;
    const bootMul = hasBoot ? 2 : 1;
    const comboMul = 1 + this.combo * CONFIG.COMBO_BONUS;
    const amount = Math.round(base * bootMul * comboMul);
    this.money += amount;
    this.totalEarned += amount;
    this.combo++;
    this.comboTimer = CONFIG.COMBO_TIMEOUT;
    return amount;
  }

  update(dt) {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt * 1000;
      if (this.comboTimer <= 0) this.combo = 0;
    }
  }

  canBuy(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    if (this.inventory.includes(itemId)) return false;
    return this.money >= item.price;
  }

  buy(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item || !this.canBuy(itemId)) return false;
    this.money -= item.price;
    this.inventory.push(itemId);
    return true;
  }

  has(itemId) { return this.inventory.includes(itemId); }
  shouldAnoHito() { return this.money >= CONFIG.ANO_HITO_THRESHOLD; }

  loseAllMoney() {
    const lost = this.money;
    this.money = 0;
    return lost;
  }

  isNormalClear() { return this.totalEarned >= CONFIG.CLEAR_MONEY; }

  isTrueClear() {
    const allItems = SHOP_ITEMS.every(i => this.inventory.includes(i.id));
    return this.isNormalClear() && allItems;
  }
}

// ===== ショップ画面 =====
export class ShopScene {
  constructor(game) { this.game = game; this.buttons = {}; this.msg = ''; this.msgT = 0; }
  enter() { this.msg = ''; this.msgT = 0; }
  update(dt) { if (this.msgT > 0) this.msgT -= dt; }
  render(ctx) {
    const W = CONFIG.BASE_WIDTH, H = CONFIG.BASE_HEIGHT;
    ctx.fillStyle = '#FFF8E1';
    ctx.fillRect(0, 0, W, H);
    drawMessage(ctx, '🛒 ショップ', W, 40, { fontSize: 28, color: '#333', stroke: '#FFD700' });
    drawMoney(ctx, this.game.economy.money, 10, 65);

    let y = 100;
    for (const item of SHOP_ITEMS) {
      const owned = this.game.economy.has(item.id);
      const canBuy = this.game.economy.canBuy(item.id);
      const color = owned ? '#9E9E9E' : (canBuy ? '#4CAF50' : '#BDBDBD');
      const label = owned ? `${item.emoji} ${item.name} ✅` :
        `${item.emoji} ${item.name}  💰${item.price}`;
      this.buttons[item.id] = drawButton(ctx, 20, y, W - 40, 52, label,
        { color, fontSize: 15, textColor: owned ? '#666' : '#fff' });
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText(item.desc, W / 2, y + 62);
      y += 75;
    }
    if (this.msgT > 0) {
      drawMessage(ctx, this.msg, W, H - 90, { fontSize: 20, color: '#FF5722' });
    }
    this.buttons.back = drawButton(ctx, W / 2 - 60, H - 60, 120, 44, '← もどる',
      { color: '#607D8B', fontSize: 18 });
  }
  onClick(x, y) {
    if (hitTest(this.buttons.back, x, y)) {
      this.game.audio.select();
      this.game.changeScene('human');
      return;
    }
    for (const item of SHOP_ITEMS) {
      if (this.buttons[item.id] && hitTest(this.buttons[item.id], x, y)) {
        if (this.game.economy.has(item.id)) {
          this.msg = 'もう持ってるよ！'; this.msgT = 1.5;
        } else if (this.game.economy.buy(item.id)) {
          this.game.audio.buy();
          this.msg = `${item.name}を買った！`; this.msgT = 2;
        } else {
          this.msg = 'お金が足りないよ…'; this.msgT = 1.5;
        }
        return;
      }
    }
  }
  onKeyDown() {}
  onKeyUp() {}
  onRelease() {}
}

// ===== あの人イベント =====
export class AnoHitoScene {
  constructor(game) { this.game = game; this.buttons = {}; }
  enter() {
    this.time = 0;
    this.phase = 'warning';
    this.anoX = -40;
    this.anoY = CONFIG.BASE_HEIGHT / 2;
    this.px = CONFIG.BASE_WIDTH / 2;
    this.py = CONFIG.BASE_HEIGHT * 0.6;
    this.caught = false;
    this.defeated = false;
    this.game.audio.anoHito();
  }
  update(dt) {
    this.time += dt;
    if (this.phase === 'warning' && this.time > 2) { this.phase = 'chase'; this.time = 0; }
    if (this.phase === 'chase') {
      this.anoX += (this.px - this.anoX) * 0.015;
      this.anoY += (this.py - this.anoY) * 0.015;
      const d = Math.hypot(this.anoX - this.px, this.anoY - this.py);
      if (d < 35) {
        this.phase = 'result'; this.caught = true;
        this.game.economy.loseAllMoney(); this.time = 0;
      }
      if (this.time > 15) {
        this.phase = 'result'; this.defeated = true;
        this.game.economy.anoHitoDefeats++; this.time = 0;
      }
    }
    if (this.phase === 'result' && this.time > 3) {
      if (this.caught) {
        this.game.changeScene('fureFure');
      } else {
        this.game.anoHitoTriggered = false;
        this.game.changeScene(this.game.anoHitoForm === 'sheep' ? 'sheep' : 'human');
      }
    }
  }
  render(ctx) {
    const W = CONFIG.BASE_WIDTH, H = CONFIG.BASE_HEIGHT;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);
    if (this.phase === 'warning') {
      ctx.globalAlpha = Math.min(1, this.time);
      drawMessage(ctx, '⚠️ あの人がやってきた！', W, H * 0.3, { fontSize: 24, color: '#ff4444' });
      drawEmoji(ctx, '👤', W / 2, H * 0.55, 60 + this.time * 10);
      ctx.globalAlpha = 1;
      return;
    }
    if (this.phase === 'chase') {
      const pEmoji = this.game.anoHitoForm === 'sheep' ? '🐑' : '🏃';
      drawEmoji(ctx, pEmoji, this.px, this.py, 36);
      drawEmoji(ctx, '👤', this.anoX, this.anoY, 50);
      ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#ff4444'; ctx.textAlign = 'center';
      ctx.fillText(MSG.anoHitoSays, this.anoX, this.anoY - 35);
      drawMessage(ctx, 'タップで逃げろ！蹴って撃退！', W, 30, { fontSize: 15, color: '#fff' });
      this.buttons.kick = drawButton(ctx, W / 2 - 60, H - 80, 120, 50, '🦶 蹴る！',
        { color: '#FF5722', fontSize: 20 });
      return;
    }
    if (this.phase === 'result') {
      if (this.caught) {
        drawMessage(ctx, MSG.allTaken, W, H * 0.4, { fontSize: 22, color: '#ff4444' });
        drawEmoji(ctx, '👤💰', W / 2, H * 0.55, 50);
      } else {
        drawMessage(ctx, MSG.anoHitoDefeat, W, H * 0.4, { fontSize: 24, color: '#4CAF50' });
        drawEmoji(ctx, '💪', W / 2, H * 0.55, 50);
      }
    }
  }
  onClick(x, y) {
    if (this.phase === 'chase') {
      if (this.buttons.kick && hitTest(this.buttons.kick, x, y)) {
        const d = Math.hypot(this.anoX - this.px, this.anoY - this.py);
        if (d < 100) {
          this.phase = 'result'; this.defeated = true;
          this.game.economy.anoHitoDefeats++;
          if (this.game.anoHitoForm === 'sheep') this.game.economy.sheepDefeat = true;
          this.game.audio.kick(); this.time = 0;
        } else { this.game.audio.kick(); }
        return;
      }
      this.px = Math.max(30, Math.min(CONFIG.BASE_WIDTH - 30, x));
      this.py = Math.max(50, Math.min(CONFIG.BASE_HEIGHT - 100, y));
    }
  }
  onKeyDown(key) {
    if (key === ' ' && this.phase === 'chase' && this.buttons.kick) {
      this.onClick(this.buttons.kick.x + 1, this.buttons.kick.y + 1);
    }
  }
  onKeyUp() {}
  onRelease() {}
}

// ===== ふれふれ演出 =====
export class FureFureScene {
  constructor(game) { this.game = game; }
  enter() { this.time = 0; this.texts = []; this.recovered = false; }
  update(dt) {
    this.time += dt;
    if (this.time < 5 && !this.recovered) {
      if (Math.random() < 0.15) {
        this.texts.push({
          x: Math.random() * CONFIG.BASE_WIDTH, y: Math.random() * CONFIG.BASE_HEIGHT,
          size: 14 + Math.random() * 18, rot: (Math.random() - 0.5) * 0.5, alpha: 1,
        });
      }
      if (Math.random() < 0.05) this.game.audio.fureFure();
    }
    if (this.time > 5 && !this.recovered) this.recovered = true;
    if (this.recovered && this.time > 7) {
      this.game.anoHitoTriggered = false;
      this.game.changeScene('human');
    }
    for (const t of this.texts) t.alpha = Math.max(0, t.alpha - dt * 0.1);
  }
  render(ctx) {
    const W = CONFIG.BASE_WIDTH, H = CONFIG.BASE_HEIGHT;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);
    for (const t of this.texts) {
      ctx.save();
      ctx.translate(t.x, t.y); ctx.rotate(t.rot); ctx.globalAlpha = t.alpha;
      ctx.font = `bold ${t.size}px sans-serif`; ctx.fillStyle = '#ff4444';
      ctx.textAlign = 'center'; ctx.fillText('ふれふれふれふれ', 0, 0);
      ctx.restore();
    }
    if (!this.recovered) {
      const pEmoji = this.game.anoHitoForm === 'sheep' ? '🐑' : '🚶';
      drawEmoji(ctx, pEmoji, W / 2, H / 2, 40);
      drawMessage(ctx, MSG.fureFure, W, H * 0.35, { fontSize: 30, color: '#ff4444' });
    } else {
      drawMessage(ctx, MSG.recovery, W, H * 0.4, { fontSize: 22, color: '#4CAF50' });
      drawEmoji(ctx, '💪🏃', W / 2, H * 0.55, 40);
    }
  }
  onClick() {}
  onKeyDown() {}
  onKeyUp() {}
  onRelease() {}
}
