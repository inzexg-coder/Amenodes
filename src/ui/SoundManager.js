export class SoundManager {
  constructor() {
    this.enabled = false;
    this.sounds = {};
    this.init();
  }
  init() {
    if (typeof AudioContext !== 'undefined') {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    this.preload();
  }
  preload() {
    this.sounds.connect = this.createBeep(440, 0.1);
    this.sounds.disconnect = this.createBeep(330, 0.1);
    this.sounds.delete = this.createBeep(220, 0.15);
  }
  createBeep(freq, duration) {
    return () => {
      if (!this.enabled || !this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);
      osc.start();
      osc.stop(now + duration);
    };
  }
  play(soundName) {
    if (!this.enabled || !this.sounds[soundName]) return;
    this.sounds[soundName]();
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled && this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }
}
