// Web Audio API synthesizers for study timer sounds without external asset dependencies
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Play start chime (pleasant ascending notes)
  playStart() {
    this.initContext();
    this.playTone(523.25, 'sine', 0.12, 0.12); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.12, 0.12), 80); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.15), 160); // G5
  }

  // Play pause chime (subtle descending tone)
  playPause() {
    this.initContext();
    this.playTone(659.25, 'sine', 0.1, 0.08);
    setTimeout(() => this.playTone(523.25, 'sine', 0.15, 0.08), 80);
  }

  // Lap recorded click
  playLap() {
    this.initContext();
    this.playTone(880, 'triangle', 0.08, 0.1);
  }

  // Target completed victory chime!
  playFanfare() {
    this.initContext();
    const notes = [
      { f: 523.25, d: 0.1 },  // C5
      { f: 659.25, d: 0.1 },  // E5
      { f: 783.99, d: 0.1 },  // G5
      { f: 1046.50, d: 0.3 }  // C6
    ];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n.f, 'triangle', n.d, 0.15), idx * 100);
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const sounds = new SoundEffects();
