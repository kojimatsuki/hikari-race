// UI描画ヘルパー
export function drawButton(ctx, x, y, w, h, text, opts = {}) {
  const { color = '#4CAF50', textColor = '#fff', fontSize = 20, radius = 12, shadow = true } = opts;
  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
  }
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.restore();
  return { x, y, w, h };
}

export function hitTest(btn, px, py) {
  return px >= btn.x && px <= btn.x + btn.w && py >= btn.y && py <= btn.y + btn.h;
}

export function drawMoney(ctx, money, x, y) {
  ctx.save();
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  const text = `💰 ${money} コイン`;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawMessage(ctx, text, cw, cy, opts = {}) {
  const { fontSize = 28, color = '#fff', stroke = '#333', maxWidth = cw - 40 } = opts;
  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = stroke;
  ctx.fillStyle = color;
  ctx.strokeText(text, cw / 2, cy, maxWidth);
  ctx.fillText(text, cw / 2, cy, maxWidth);
  ctx.restore();
}

export function drawEmoji(ctx, emoji, x, y, size = 30) {
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y);
}

export function drawProgressBar(ctx, x, y, w, h, progress, color = '#4CAF50') {
  ctx.fillStyle = '#555';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (progress > 0) {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, w * Math.min(progress, 1), h, h / 2);
    ctx.fill();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// パーティクルシステム
export class Particles {
  constructor() { this.list = []; }

  spawn(x, y, emoji, count = 5) {
    for (let i = 0; i < count; i++) {
      this.list.push({
        x, y, emoji,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 2,
        life: 1.0,
        size: 16 + Math.random() * 10,
      });
    }
  }

  update(dt) {
    for (const p of this.list) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= dt * 1.5;
    }
    this.list = this.list.filter(p => p.life > 0);
  }

  render(ctx) {
    for (const p of this.list) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      drawEmoji(ctx, p.emoji, p.x, p.y, p.size);
      ctx.restore();
    }
  }
}
