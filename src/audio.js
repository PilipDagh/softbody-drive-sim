// Web Audio API Procedural Sound Engine for BeamNG Soft-Body Sim
// Synthesizes engine audio, turbo spool/blowoff, tire squeal, metal crunches, and horn

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.muted = false;

    // Engine Audio Nodes
    this.engineGain = null;
    this.engineFilter = null;
    this.oscillators = [];
    this.distortionNode = null;
    this.cylinderCount = 6;
    this.isHybrid = false;

    // Turbocharger
    this.turboOsc = null;
    this.turboGain = null;
    this.prevThrottle = 0;
    this.boostLevel = 0;

    // Tire Squeal
    this.tireNoiseNode = null;
    this.tireGain = null;
    this.tireFilter = null;

    // Horn
    this.hornOsc1 = null;
    this.hornOsc2 = null;
    this.hornGain = null;

    // Spark / Scrape
    this.scrapeGain = null;
    this.scrapeFilter = null;

    this.initAudioContext();
  }

  initAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const activate = () => {
      if (!this.ctx) {
        this.ctx = new AudioContextClass();
        this.buildAudioGraph();
        this.isInitialized = true;
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('keydown', activate);
      window.removeEventListener('click', activate);
    };

    window.addEventListener('keydown', activate);
    window.addEventListener('click', activate);
  }

  buildAudioGraph() {
    if (!this.ctx) return;

    // Master Compressor to prevent clipping during multi-car crashes
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.masterCompressor.knee.setValueAtTime(30, this.ctx.currentTime);
    this.masterCompressor.ratio.setValueAtTime(12, this.ctx.currentTime);
    this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.masterCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);
    this.masterCompressor.connect(this.ctx.destination);

    // --- 1. Engine Audio Graph ---
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Waveshaper for exhaust growl
    this.distortionNode = this.ctx.createWaveShaper();
    this.distortionNode.curve = this.makeDistortionCurve(18);
    this.distortionNode.oversample = '2x';

    this.engineGain.connect(this.distortionNode);
    this.distortionNode.connect(this.engineFilter);
    this.engineFilter.connect(this.masterCompressor);

    this.setupEngineOscillators(6);

    // --- 2. Turbocharger Graph ---
    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.masterCompressor);
    this.turboOsc.start();

    // --- 3. Tire Squeal Graph (Filtered White Noise) ---
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(900, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    whiteNoise.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.masterCompressor);
    whiteNoise.start();

    // --- 4. Metal Scrape / Chassis Sparks Graph ---
    const scrapeNoise = this.ctx.createBufferSource();
    scrapeNoise.buffer = noiseBuffer;
    scrapeNoise.loop = true;

    this.scrapeFilter = this.ctx.createBiquadFilter();
    this.scrapeFilter.type = 'highpass';
    this.scrapeFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);

    this.scrapeGain = this.ctx.createGain();
    this.scrapeGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    scrapeNoise.connect(this.scrapeFilter);
    this.scrapeFilter.connect(this.scrapeGain);
    this.scrapeGain.connect(this.masterCompressor);
    scrapeNoise.start();

    // --- 5. Horn Setup ---
    this.hornGain = this.ctx.createGain();
    this.hornGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.hornOsc1 = this.ctx.createOscillator();
    this.hornOsc1.type = 'sawtooth';
    this.hornOsc1.frequency.setValueAtTime(349.23, this.ctx.currentTime); // F4

    this.hornOsc2 = this.ctx.createOscillator();
    this.hornOsc2.type = 'sawtooth';
    this.hornOsc2.frequency.setValueAtTime(415.30, this.ctx.currentTime); // G#4

    this.hornOsc1.connect(this.hornGain);
    this.hornOsc2.connect(this.hornGain);
    this.hornGain.connect(this.masterCompressor);
    this.hornOsc1.start();
    this.hornOsc2.start();
  }

  makeDistortionCurve(amount = 20) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  setupEngineOscillators(cylinders = 6, isHybrid = false) {
    this.cylinderCount = cylinders;
    this.isHybrid = isHybrid;
    if (!this.ctx || !this.engineGain) return;

    // Clean previous oscillators
    for (const osc of this.oscillators) {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    }
    this.oscillators = [];

    // Create 3 harmonic oscillators for deep multi-cylinder engine rumble
    const harmonics = [1.0, 1.5, 2.0, 3.0];
    const types = isHybrid ? ['sine', 'triangle', 'sine', 'sine'] : ['sawtooth', 'triangle', 'sawtooth', 'square'];

    for (let i = 0; i < harmonics.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = types[i];
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(i === 0 ? 0.4 : 0.2 / (i + 1), this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.engineGain);
      osc.start();
      this.oscillators.push({ osc, gain, harmonic: harmonics[i] });
    }
  }

  setEngineConfig(cylinders, isHybrid = false) {
    this.setupEngineOscillators(cylinders, isHybrid);
  }

  update(telemetry) {
    if (!this.ctx || !this.isInitialized) return;
    const t = this.ctx.currentTime;
    const {
      rpm = 800,
      throttle = 0,
      speed = 0,
      boost = 0,
      tireSlip = 0,
      scrapeIntensity = 0,
      horn = false,
      ignition = true
    } = telemetry;

    if (!ignition) {
      this.engineGain.gain.setTargetAtTime(0.0001, t, 0.05);
      this.turboGain.gain.setTargetAtTime(0.0001, t, 0.05);
      return;
    }

    // Engine fundamental firing frequency: F = (RPM / 120) * Cylinders
    const baseFreq = Math.max(18, (rpm / 120) * (this.cylinderCount * 0.5));

    for (const item of this.oscillators) {
      item.osc.frequency.setTargetAtTime(baseFreq * item.harmonic, t, 0.02);
    }

    // Engine Volume & Filter Cutoff opens with throttle
    const targetGain = 0.25 + throttle * 0.35;
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.03);

    const cutoff = Math.min(6000, 300 + (rpm / 8000) * 2200 + throttle * 2400);
    this.engineFilter.frequency.setTargetAtTime(cutoff, t, 0.04);

    // Turbo Spool sound
    if (boost > 0.05) {
      this.turboOsc.frequency.setTargetAtTime(1400 + (rpm / 8000) * 3200 + boost * 2000, t, 0.05);
      this.turboGain.gain.setTargetAtTime(Math.min(0.25, boost * 0.15), t, 0.05);
    } else {
      this.turboGain.gain.setTargetAtTime(0.0001, t, 0.1);
    }

    // Blow-Off Valve (BOV) pop on throttle release after high boost
    if (this.prevThrottle > 0.6 && throttle < 0.15 && this.boostLevel > 0.5) {
      this.playBlowOffValve();
    }
    this.prevThrottle = throttle;
    this.boostLevel = boost;

    // Tire Squeal
    if (tireSlip > 0.18 && speed > 2.0) {
      const squealVol = Math.min(0.4, (tireSlip - 0.18) * 0.8);
      this.tireGain.gain.setTargetAtTime(squealVol, t, 0.02);
      this.tireFilter.frequency.setTargetAtTime(800 + Math.min(1200, speed * 20), t, 0.03);
    } else {
      this.tireGain.gain.setTargetAtTime(0.0001, t, 0.05);
    }

    // Chassis / Rim Scrape Ground Sparks
    if (scrapeIntensity > 0.05) {
      this.scrapeGain.gain.setTargetAtTime(Math.min(0.35, scrapeIntensity * 0.5), t, 0.02);
    } else {
      this.scrapeGain.gain.setTargetAtTime(0.0001, t, 0.08);
    }

    // Horn
    if (horn) {
      this.hornGain.gain.setTargetAtTime(0.35, t, 0.01);
    } else {
      this.hornGain.gain.setTargetAtTime(0.0001, t, 0.03);
    }
  }

  playBlowOffValve() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3200, t);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.28);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(this.masterCompressor);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  playMetalCrunch(energy = 1.0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const clampedEnergy = Math.min(3.0, Math.max(0.2, energy));

    // Low-frequency impact thud
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    subGain.gain.setValueAtTime(0.5 * clampedEnergy, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    subOsc.connect(subGain);
    subGain.connect(this.masterCompressor);
    subOsc.start(t);
    subOsc.stop(t + 0.42);

    // FM Synthesized metallic screech & crumple
    const crunchOsc = this.ctx.createOscillator();
    const crunchGain = this.ctx.createGain();
    crunchOsc.type = 'sawtooth';
    crunchOsc.frequency.setValueAtTime(450 * (0.8 + Math.random() * 0.4), t);
    crunchOsc.frequency.linearRampToValueAtTime(120, t + 0.25);

    crunchGain.gain.setValueAtTime(0.4 * clampedEnergy, t);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    crunchOsc.connect(crunchGain);
    crunchGain.connect(this.masterCompressor);
    crunchOsc.start(t);
    crunchOsc.stop(t + 0.32);
  }

  playGlassShatter() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(4200, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.2);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterCompressor);
    osc.start(t);
    osc.stop(t + 0.26);
  }
}
