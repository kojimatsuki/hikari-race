// レースフェーズのロジック
import { CONFIG, VEHICLES, OBSTACLES } from './data.js';
import { drawEmoji, drawProgressBar, drawMessage, drawMoney, Particles } from './ui.js';

export class RaceScene {
  constructor(game) { this.game = game; }

  enter(vehicleId) {
    const v = VEHICLES[vehicleId];
    this.vehicleId = vehicleId;
    this.emoji = v.emoji;
    this.speed = v.speed;
    this.hitW = v.hitW;
    this.hitH = v.hitH;
    this.playerX = CONFIG.BASE_WIDTH / 2;
    this.playerTargetX = this.playerX;
    this.distance = 0;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.roadOffset = 0;
    this.crashed = false;
    this.crashTimer = 0;
    this.goalReached = false;
    this.goalTimer = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.particles = new Particles();
    this.keys = {};
    this.touchSide = 0; // -1 left, 0 none, 1 right
  }

  get roadLeft() { return CONFIG.ROAD_MARGIN; }
  get roadRight() { return CONFIG.BASE_WIDTH - CONFIG.ROAD_MARGIN; }
  get roadW() { return this.roadRight - this.roadLeft; }
  get playerY() { return CONFIG.BASE_HEIGHT * 0.82; }

  laneX(lane) {
    return this.roadLeft + CONFIG.ROAD_LANE_WIDTH * (lane + 0.5);
  }

  spawnObstacle() {
    const totalW = OBSTACLES.reduce((s, o) => s + o.weight, 0);
    let r = Math.random() * totalW;
    let type = OBSTACLES[0];
    for (const o of OBSTACLES) { r -= o.weight; if (r <= 0) { type = o; break; } }
    const lane = Math.floor(Math.random() * CONFIG.ROAD_LANES);
    const x = this.laneX(lane);
    const obs = { ...type, x, y: -70, lane };
    if (type.chase) obs.chaseTarget = this.playerX;
    this.obstacles.push(obs);
  }

  update(dt) {
    if (this.goalReached) {
      this.goalTimer += dt;
      if (this.goalTimer > 2.5) this.game.changeScene('transformToHuman');
      return;
    }
    if (this.crashed) {
      this.crashTimer += dt;
      this.shakeX = (Math.random() - 0.5) * 10 * Math.max(0, 1 - this.crashTimer);
      this.shakeY = (Math.random() - 0.5) * 10 * Math.max(0, 1 - this.crashTimer);
      this.particles.update(dt);
      if (this.crashTimer > 2) {
        this.distance = 0;
        this.obstacles = [];
        this.crashed = false;
        this.crashTimer = 0;
        this.playerX = CONFIG.BASE_WIDTH / 2;
        this.playerTargetX = this.playerX;
      }
      return;
    }

    // 移動
    let moveDir = this.touchSide;
    if (this.keys['ArrowLeft'] || this.keys['a']) moveDir = -1;
    if (this.keys['ArrowRight'] || this.keys['d']) moveDir = 1;
    this.playerTargetX += moveDir * this.speed * 1.8;
    this.playerTargetX = Math.max(this.roadLeft + 20, Math.min(this.roadRight - 20, this.playerTargetX));
    this.playerX += (this.playerTargetX - this.playerX) * 0.2;

    // 進行
    this.distance += this.speed * 60 * dt;
    this.roadOffset = (this.roadOffset + this.speed * 120 * dt) % 40;

    // 障害物スポーン
    const spawnRate = Math.max(0.4, 1.2 - this.distance / 5000);
    this.spawnTimer += dt;
    if (this.spawnTimer > spawnRate) {
      this.spawnObstacle();
      this.spawnTimer = 0;
    }

    // 障害物更新
    for (const o of this.obstacles) {
      const relSpeed = this.speed * 60 + o.speed * 60;
      o.y += relSpeed * dt;
      if (o.chase) {
        o.x += (this.playerX - o.x) * 0.02;
      }
    }
    this.obstacles = this.obstacles.filter(o => o.y < CONFIG.BASE_HEIGHT + 100);

    // 衝突判定
    for (const o of this.obstacles) {
      if (this.checkCollision(o)) {
        this.crashed = true;
        this.crashTimer = 0;
        this.game.audio.crash();
        this.particles.spawn(this.playerX, this.playerY, '💥', 8);
        return;
      }
    }

    // ゴール判定
    if (this.distance >= CONFIG.RACE_GOAL) {
      this.goalReached = true;
      this.goalTimer = 0;
      this.game.audio.fanfare();
    }

    // エンジン音（間引き）
    if (Math.random() < 0.1) this.game.audio.engine(this.speed);
    this.particles.update(dt);
  }

  checkCollision(o) {
    const px = this.playerX, py = this.playerY;
    const hw = this.hitW / 2, hh = this.hitH / 2;
    const ow = o.w / 2, oh = o.h / 2;
    return px - hw < o.x + ow && px + hw > o.x - ow &&
           py - hh < o.y + oh && py + hh > o.y - oh;
  }

  render(ctx) {
    const W = CONFIG.BASE_WIDTH, H = CONFIG.BASE_HEIGHT;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    // 背景（草）
    ctx.fillStyle = '#4a7c3f';
    ctx.fillRect(0, 0, W, H);

    // 道路
    ctx.fillStyle = '#555';
    ctx.fillRect(this.roadLeft, 0, this.roadW, H);

    // 車線
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -this.roadOffset;
    for (let i = 1; i < CONFIG.ROAD_LANES; i++) {
      const x = this.roadLeft + CONFIG.ROAD_LANE_WIDTH * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 道路端線
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.roadLeft, 0); ctx.lineTo(this.roadLeft, H);
    ctx.moveTo(this.roadRight, 0); ctx.lineTo(this.roadRight, H);
    ctx.stroke();

    // ゴールライン
    if (this.distance > CONFIG.RACE_GOAL - 800) {
      const goalY = H * 0.2 - (this.distance - (CONFIG.RACE_GOAL - 800)) * 0.3;
      if (goalY > -30 && goalY < H) {
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 12; i++) {
          const bx = this.roadLeft + (i * this.roadW / 12);
          const by = goalY + ((i % 2) * 12);
          ctx.fillRect(bx, by, this.roadW / 12, 12);
        }
        drawEmoji(ctx, '🏁', W / 2, goalY - 15, 28);
      }
    }

    // 障害物
    for (const o of this.obstacles) {
      drawEmoji(ctx, o.emoji, o.x, o.y, 38);
    }

    // 自機
    if (!this.crashed || Math.floor(this.crashTimer * 8) % 2 === 0) {
      drawEmoji(ctx, this.emoji, this.playerX, this.playerY, 42);
    }

    this.particles.render(ctx);

    // HUD
    drawProgressBar(ctx, 20, 15, W - 40, 14, this.distance / CONFIG.RACE_GOAL, '#FFD700');
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`🏁 ${Math.min(100, (this.distance / CONFIG.RACE_GOAL * 100) | 0)}%`, W / 2, 12);

    drawMoney(ctx, this.game.economy.money, 10, 38);

    if (this.crashed) {
      drawMessage(ctx, 'スタートにもどる！💥', W, H * 0.4, { fontSize: 26, color: '#ff4444' });
    }
    if (this.goalReached) {
      drawMessage(ctx, '🏁 ゴール！！ 🏁', W, H * 0.35, { fontSize: 32, color: '#FFD700' });
      drawMessage(ctx, '人間に変身だ！✨', W, H * 0.45, { fontSize: 24 });
    }
    ctx.restore();
  }

  onKeyDown(key) { this.keys[key] = true; }
  onKeyUp(key) { this.keys[key] = false; }

  onClick(x, y) {
    if (x < CONFIG.BASE_WIDTH / 2) this.touchSide = -1;
    else this.touchSide = 1;
  }

  onRelease() { this.touchSide = 0; }
}
