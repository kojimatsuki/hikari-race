// Web Audio API サウンド管理
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  _osc(freq, type, duration, vol = 0.15) {
    if (!this.ctx || !this.enabled) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + duration);
  }

  _noise(duration, vol = 0.1) {
    if (!this.ctx || !this.enabled) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * vol;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buf;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    src.connect(g).connect(this.ctx.destination);
    src.start();
  }

  engine(speed) {
    this._osc(80 + speed * 15, 'sawtooth', 0.08, 0.05);
  }

  crash() {
    this._noise(0.4, 0.3);
    this._osc(100, 'square', 0.3, 0.2);
  }

  kick() {
    this._noise(0.1, 0.2);
    this._osc(200, 'square', 0.08, 0.15);
  }

  coin() {
    this._osc(880, 'sine', 0.08, 0.12);
    setTimeout(() => this._osc(1320, 'sine', 0.1, 0.1), 80);
  }

  meh() {
    this._osc(300, 'sine', 0.3, 0.12);
    setTimeout(() => this._osc(250, 'sine', 0.4, 0.1), 150);
  }

  anoHito() {
    this._osc(60, 'sawtooth', 1.0, 0.15);
    this._osc(63, 'sawtooth', 1.0, 0.1);
  }

  fanfare() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this._osc(f, 'square', 0.25, 0.12), i * 200);
    });
  }

  fureFure() {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this._osc(440 + i * 50, 'sine', 0.15, 0.08), i * 120);
    }
  }

  select() {
    this._osc(660, 'sine', 0.08, 0.1);
  }

  buy() {
    this._osc(523, 'sine', 0.1, 0.1);
    setTimeout(() => this._osc(784, 'sine', 0.15, 0.1), 100);
  }
}
