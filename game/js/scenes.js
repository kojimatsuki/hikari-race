// シーン管理（タイトル/チュートリアル/選択/変身/クリア）
import { CONFIG, TUTORIAL_TEXTS, MSG, VEHICLES } from './data.js';
import { drawButton, hitTest, drawEmoji, drawMoney, drawMessage } from './ui.js';

// ===== タイトル画面 =====
export class TitleScene {
  constructor(game) { this.game = game; this.time = 0; this.buttons = {}; }
  enter() { this.time = 0; }
  update(dt) { this.time += dt; }
  render(ctx) {
    const W = CONFIG.BASE_WIDTH, H = CONFIG.BASE_HEIGHT;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a237e');
    grad.addColorStop(1, '#4a148c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 5; i++) {
      const x = ((this.time * 60 + i * 120) % (W + 200)) - 100;
      ctx.font = '16px sans-serif';
      ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.sin(this.time * 2 + i) * 0.1})`;
      ctx.fillText('ふれふれふれふれ！', x, 100 + i * 80);
    }

    const carX = ((this.time * 100) % (W + 100)) - 50;
    const bikeX = ((this.time * 130 + 200) % (W + 100)) - 50;
    drawEmoji(ctx, '🚗', carX, H * 0.45, 40);
    drawEmoji(ctx, '🏍️', bikeX, H * 0.55, 36);

    const sheepY = H * 0.7 + Math.sin(this.time * 1.5) * 10;
    drawEmoji(ctx, '🐑', W * 0.2, sheepY, 30);
    drawEmoji(ctx, '🐑', W * 0.5, sheepY + 5, 26);
    drawEmoji(ctx, '🐑', W * 0.8, sheepY - 3, 28);

    drawMessage(ctx, 'ふれふれドライブ', W, H * 0.2, { fontSize: 32, color: '#FFD700' });
    drawMessage(ctx, '〜蹴ってお金持ち〜', W, H * 0.28, { fontSize: 22, color: '#FF9800' });

    this.buttons.start = drawButton(ctx, W / 2 - 80, H * 0.8, 160, 55, 'はじめる',
      { color: '#FF5722', fontSize: 24 });
  }
  onClick(x, y) {
    if (hitTest(this.buttons.start, x, y)) {
      this.game.audio.select();
      this.game.changeScene('tutorial');
    }
  }
  onKeyDown(key) {
    if (key === 'Enter' || key === ' ') this.game.changeScene('tutorial');
  }
  onKeyUp() {}
  onRelease() {}
}

// ===== チュートリアル =====
export class TutorialScene {
  constructor(game) { this.game = game; this.idx = 0; this.buttons = {}; }
  enter() { this.idx = 0; }
  update() {}
  render(ctx) {
    const W = CONFIG.BASE_WIDTH, H = CONFIG.BASE_HEIGHT;
    ctx.fillStyle = '#263238';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff';
    const bx = 30, by = 80, bw = W - 60, bh = 300;
    ctx.beginPath();
    ctx.moveTo(bx + 15, by);
    ctx.lineTo(bx + bw - 15, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + 15);
    ctx.lineTo(bx + bw, by + bh - 15);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - 15, by + bh);
    ctx.lineTo(bx + 15, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - 15);
    ctx.lineTo(bx, by + 15);
    ctx.quadraticCurveTo(bx, by, bx + 15, by);
    ctx.fill();

    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(TUTORIAL_TEXTS[this.idx], W / 2, by + bh / 2, bw - 30);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#999';
    ctx.fillText(`${this.idx + 1} / ${TUTORIAL_TEXTS.length}`, W / 2, by + bh + 20);

    const isLast = this.idx >= TUTORIAL_TEXTS.length - 1;
    this.buttons.next = drawButton(ctx, W / 2 - 70, H - 120, 140, 50,
      isLast ? 'わかった！' : 'つぎへ →',
      { color: isLast ? '#FF5722' : '#4CAF50', fontSize: 20 });
  }
  onClick(x, y) {
    if (hitTest(this.buttons.next, x, y)) {
      this.game.audio.select();
      if (this.idx >= TUTORIAL_TEXTS.length - 1) {
        this.game.changeScene('vehicleSelect');
      } else {
        this.idx++;
      }
    }
  }
  onKeyDown(key) {
    if (key === 'Enter' || key === ' ') {
      this.onClick(this.buttons.next.x + 1, this.buttons.next.y + 1);
    }
  }
  onKeyUp() {}
  onRelease() {}
}

// ===== 乗り物選択 =====
export class VehicleSelectScene {
  constructor(game) { this.game = game; this.buttons = {}; }
  enter() {}
  update() {}
  render(ctx) {
    const W = CONFIG.BASE_WIDTH, H = CONFIG.BASE_HEIGHT;
    ctx.fillStyle = '#37474F';
    ctx.fillRect(0, 0, W, H);
    drawMessage(ctx, '🏁 乗り物を選ぼう！', W, 60, { fontSize: 26, color: '#FFD700' });

    this.buttons.car = drawButton(ctx, 30, 120, W - 60, 80,
      '🚗 車（スピード普通・大きめ）', { color: '#1565C0', fontSize: 18 });
    this.buttons.bike = drawButton(ctx, 30, 220, W - 60, 80,
      '🏍️ バイク（速い・小さい）', { color: '#E65100', fontSize: 18 });

    let y = 340;
    const eco = this.game.economy;
    for (const s of ['sportsCar', 'bigBike', 'racingCar']) {
      if (eco.has(s)) {
        const v = VEHICLES[s];
        this.buttons[s] = drawButton(ctx, 30, y, W - 60, 65,
          `${v.emoji} ${v.name}（スピード${v.speed}）`, { color: '#4A148C', fontSize: 17 });
        y += 80;
      }
    }
    drawMoney(ctx, eco.money, 10, H - 40);
  }
  onClick(x, y) {
    const trySelect = (key, vid) => {
      if (this.buttons[key] && hitTest(this.buttons[key], x, y)) {
        this.game.audio.select();
        this.game.selectedVehicle = vid;
        this.game.changeScene('race');
        return true;
      }
    };
    if (trySelect('car', 'car')) return;
    if (trySelect('bike', 'bike')) return;
    if (trySelect('sportsCar', 'sportsCar')) return;
    if (trySelect('bigBike', 'bigBike')) return;
    if (trySelect('racingCar', 'racingCar')) return;
  }
  onKeyDown() {}
  onKeyUp() {}
  onRelease() {}
}

// ===== 変身演出 =====
export class TransformScene {
  constructor(game) { this.game = game; }
  enter(target) { this.target = target; this.time = 0; }
  update(dt) {
    this.time += dt;
    if (this.time > 2.0) {
      this.game.changeScene(this.target === 'human' ? 'human' : 'sheep');
    }
  }
  render(ctx) {
    const W = CONFIG.BASE_WIDTH, H = CONFIG.BASE_HEIGHT;
    ctx.fillStyle = `rgba(0,0,0,${Math.min(0.7, this.time)})`;
    ctx.fillRect(0, 0, W, H);
    const scale = 30 + this.time * 25;
    const from = this.target === 'human' ? '🚗' : '🏃';
    const to = this.target === 'human' ? '🏃' : '🐑';
    drawEmoji(ctx, this.time < 1.0 ? from : to, W / 2, H / 2, scale);
    for (let i = 0; i < 8; i++) {
      const angle = (this.time * 3 + i * 0.8) % (Math.PI * 2);
      const r = 60 + this.time * 30;
      drawEmoji(ctx, '✨', W / 2 + Math.cos(angle) * r, H / 2 + Math.sin(angle) * r, 18);
    }
    const msg = this.target === 'human' ? '人間に変身！✨' : '羊に変身！🐑✨';
    drawMessage(ctx, msg, W, H / 2 + 80, { fontSize: 26, color: '#FFD700' });
  }
  onClick() {}
  onKeyDown() {}
  onKeyUp() {}
  onRelease() {}
}

// ===== ゲームクリア =====
export class GameClearScene {
  constructor(game) { this.game = game; this.buttons = {}; }
  enter() {
    this.time = 0;
    this.game.audio.fanfare();
    const eco = this.game.economy;
    if (eco.isTrueClear()) this.title = MSG.trueClear;
    else if (eco.sheepDefeat) this.title = MSG.secretClear;
    else this.title = MSG.normalClear;
  }
  update(dt) { this.time += dt; }
  render(ctx) {
    const W = CONFIG.BASE_WIDTH, H = CONFIG.BASE_HEIGHT;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#FF6F00');
    grad.addColorStop(1, '#F44336');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) {
      const a = this.time * 2 + i * 0.5;
      const x = W / 2 + Math.cos(a) * (80 + i * 15);
      const y = H * 0.3 + Math.sin(a) * (40 + i * 8);
      drawEmoji(ctx, '✨', x, y, 16 + Math.sin(this.time + i) * 6);
    }
    drawMessage(ctx, '🏆 ゲームクリア！ 🏆', W, H * 0.2, { fontSize: 30, color: '#FFD700' });
    drawMessage(ctx, this.title, W, H * 0.35, { fontSize: 20, color: '#fff' });
    drawMoney(ctx, this.game.economy.totalEarned, W / 2 - 80, H * 0.45);
    drawMessage(ctx, `あの人撃退: ${this.game.economy.anoHitoDefeats}回`, W, H * 0.58,
      { fontSize: 16, color: '#fff' });
    this.buttons.retry = drawButton(ctx, W / 2 - 80, H * 0.75, 160, 50, 'もう一回！',
      { color: '#4CAF50', fontSize: 22 });
  }
  onClick(x, y) {
    if (hitTest(this.buttons.retry, x, y)) {
      this.game.reset();
      this.game.changeScene('title');
    }
  }
  onKeyDown() {}
  onKeyUp() {}
  onRelease() {}
}
