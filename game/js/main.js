// ゲーム初期化・フェーズ管理
import { CONFIG } from './data.js';
import { AudioManager } from './audio.js';
import { Economy, ShopScene, AnoHitoScene, FureFureScene } from './economy.js';
import { RaceScene } from './race.js';
import { HumanScene } from './human.js';
import { SheepScene } from './sheep.js';
import {
  TitleScene, TutorialScene, VehicleSelectScene,
  TransformScene, GameClearScene,
} from './scenes.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.audio = new AudioManager();
    this.economy = new Economy();

    // ゲームフラグ
    this.selectedVehicle = 'car';
    this.anoHitoTriggered = false;
    this.anoHitoForm = 'human';
    this.clearShown = false;

    // シーン
    this.scenes = {
      title: new TitleScene(this),
      tutorial: new TutorialScene(this),
      vehicleSelect: new VehicleSelectScene(this),
      race: new RaceScene(this),
      transformToHuman: new TransformScene(this),
      transformToSheep: new TransformScene(this),
      human: new HumanScene(this),
      shop: new ShopScene(this),
      sheep: new SheepScene(this),
      anoHito: new AnoHitoScene(this),
      fureFure: new FureFureScene(this),
      gameClear: new GameClearScene(this),
    };
    this.currentScene = null;
    this.sceneName = '';

    this._resize();
    this._bindEvents();
    this.changeScene('title');
    this._lastTime = performance.now();
    requestAnimationFrame(t => this._loop(t));
  }

  reset() {
    this.economy = new Economy();
    this.selectedVehicle = 'car';
    this.anoHitoTriggered = false;
    this.clearShown = false;
  }

  changeScene(name) {
    this.sceneName = name;
    this.currentScene = this.scenes[name];
    if (name === 'race') {
      this.currentScene.enter(this.selectedVehicle);
    } else if (name === 'transformToHuman') {
      this.currentScene.enter('human');
    } else if (name === 'transformToSheep') {
      this.currentScene.enter('sheep');
    } else if (this.currentScene.enter) {
      this.currentScene.enter();
    }
  }

  _resize() {
    const maxW = Math.min(window.innerWidth, 450);
    const maxH = Math.min(window.innerHeight, 800);
    const scale = Math.min(maxW / CONFIG.BASE_WIDTH, maxH / CONFIG.BASE_HEIGHT);
    const w = CONFIG.BASE_WIDTH * scale;
    const h = CONFIG.BASE_HEIGHT * scale;
    this.canvas.width = CONFIG.BASE_WIDTH;
    this.canvas.height = CONFIG.BASE_HEIGHT;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.scale = scale;
  }

  _canvasPos(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / this.scale,
      y: (clientY - rect.top) / this.scale,
    };
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._resize());

    // マウス
    this.canvas.addEventListener('mousedown', e => {
      this.audio.resume();
      if (!this.audio.ctx) this.audio.init();
      const p = this._canvasPos(e.clientX, e.clientY);
      if (this.currentScene.onClick) this.currentScene.onClick(p.x, p.y);
    });
    this.canvas.addEventListener('mouseup', () => {
      if (this.currentScene.onRelease) this.currentScene.onRelease();
    });

    // タッチ
    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      this.audio.resume();
      if (!this.audio.ctx) this.audio.init();
      const t = e.touches[0];
      const p = this._canvasPos(t.clientX, t.clientY);
      if (this.currentScene.onClick) this.currentScene.onClick(p.x, p.y);
    }, { passive: false });
    this.canvas.addEventListener('touchend', e => {
      e.preventDefault();
      if (this.currentScene.onRelease) this.currentScene.onRelease();
    }, { passive: false });

    // キーボード
    window.addEventListener('keydown', e => {
      this.audio.resume();
      if (!this.audio.ctx) this.audio.init();
      if (this.currentScene.onKeyDown) this.currentScene.onKeyDown(e.key);
    });
    window.addEventListener('keyup', e => {
      if (this.currentScene.onKeyUp) this.currentScene.onKeyUp(e.key);
    });
  }

  _loop(now) {
    const dt = Math.min((now - this._lastTime) / 1000, 0.05);
    this._lastTime = now;

    if (this.currentScene.update) this.currentScene.update(dt);

    this.ctx.clearRect(0, 0, CONFIG.BASE_WIDTH, CONFIG.BASE_HEIGHT);
    if (this.currentScene.render) this.currentScene.render(this.ctx);

    requestAnimationFrame(t => this._loop(t));
  }
}

// スタート
window.addEventListener('DOMContentLoaded', () => new Game());
