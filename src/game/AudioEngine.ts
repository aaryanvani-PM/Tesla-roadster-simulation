/**
 * Web Audio API procedural sound engine for Tesla Roadster SpaceX Thruster simulator.
 * Produces synthetic electric motor whine, cold-gas thruster hiss, tire screech, and stunt fanfares.
 */

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Motor synthesis
  private motorOsc: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;
  private motorFilter: BiquadFilterNode | null = null;

  // Thruster cold-gas synthesis (white noise + resonant filter)
  private thrusterNoiseNode: AudioBufferSourceNode | null = null;
  private thrusterGain: GainNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;

  // Boost rocket synthesis
  private boostGain: GainNode | null = null;
  private boostOsc: OscillatorNode | null = null;

  // Tire screech
  private tireGain: GainNode | null = null;
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;

  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupMotorSynth();
      this.setupThrusterSynth();
      this.setupBoostSynth();
      this.setupTireSynth();

      this.isInitialized = true;
    } catch {
      console.warn('AudioContext not supported or blocked');
    }
  }

  private createWhiteNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private setupMotorSynth() {
    if (!this.ctx || !this.masterGain) return;
    this.motorOsc = this.ctx.createOscillator();
    this.motorOsc.type = 'sawtooth';
    this.motorOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

    this.motorFilter = this.ctx.createBiquadFilter();
    this.motorFilter.type = 'lowpass';
    this.motorFilter.frequency.setValueAtTime(400, this.ctx.currentTime);

    this.motorGain = this.ctx.createGain();
    this.motorGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.motorOsc.connect(this.motorFilter);
    this.motorFilter.connect(this.motorGain);
    this.motorGain.connect(this.masterGain);
    this.motorOsc.start();
  }

  private setupThrusterSynth() {
    if (!this.ctx || !this.masterGain) return;
    const noiseBuffer = this.createWhiteNoiseBuffer();
    this.thrusterNoiseNode = this.ctx.createBufferSource();
    this.thrusterNoiseNode.buffer = noiseBuffer;
    this.thrusterNoiseNode.loop = true;

    this.thrusterFilter = this.ctx.createBiquadFilter();
    this.thrusterFilter.type = 'bandpass';
    this.thrusterFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.thrusterFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.thrusterGain = this.ctx.createGain();
    this.thrusterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.thrusterNoiseNode.connect(this.thrusterFilter);
    this.thrusterFilter.connect(this.thrusterGain);
    this.thrusterGain.connect(this.masterGain);
    this.thrusterNoiseNode.start();
  }

  private setupBoostSynth() {
    if (!this.ctx || !this.masterGain) return;
    this.boostOsc = this.ctx.createOscillator();
    this.boostOsc.type = 'triangle';
    this.boostOsc.frequency.setValueAtTime(95, this.ctx.currentTime);

    this.boostGain = this.ctx.createGain();
    this.boostGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.boostOsc.connect(this.boostGain);
    this.boostGain.connect(this.masterGain);
    this.boostOsc.start();
  }

  private setupTireSynth() {
    if (!this.ctx || !this.masterGain) return;
    const noiseBuffer = this.createWhiteNoiseBuffer();
    this.tireNoiseNode = this.ctx.createBufferSource();
    this.tireNoiseNode.buffer = noiseBuffer;
    this.tireNoiseNode.loop = true;

    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.tireNoiseNode.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.masterGain);
    this.tireNoiseNode.start();
  }

  public update(speedMph: number, isAccelerating: boolean, isThrusterActive: boolean, isBoostActive: boolean, isDrifting: boolean) {
    if (!this.ctx || this.isMuted) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;

    // Electric motor sound: frequency scales with speed
    if (this.motorOsc && this.motorGain && this.motorFilter) {
      const targetFreq = 50 + (Math.abs(speedMph) / 250) * 850;
      this.motorOsc.frequency.setTargetAtTime(targetFreq, t, 0.05);

      const targetMotorGain = isAccelerating ? Math.min(0.28, 0.08 + (Math.abs(speedMph) / 250) * 0.2) : (Math.abs(speedMph) > 5 ? 0.05 : 0.0);
      this.motorGain.gain.setTargetAtTime(targetMotorGain, t, 0.08);

      const filterCutoff = 350 + (Math.abs(speedMph) / 250) * 1200;
      this.motorFilter.frequency.setTargetAtTime(filterCutoff, t, 0.05);
    }

    // Cold-Gas Thruster Hiss
    if (this.thrusterGain && this.thrusterFilter) {
      const targetThrusterGain = isThrusterActive ? 0.45 : 0.0;
      this.thrusterGain.gain.setTargetAtTime(targetThrusterGain, t, 0.04);
      if (isThrusterActive) {
        // High pressure pneumatic hiss flutter
        const jitter = Math.sin(t * 40) * 100;
        this.thrusterFilter.frequency.setTargetAtTime(1400 + jitter, t, 0.02);
      }
    }

    // Rear Rocket Boost
    if (this.boostGain) {
      const targetBoostGain = isBoostActive ? 0.35 : 0.0;
      this.boostGain.gain.setTargetAtTime(targetBoostGain, t, 0.05);
    }

    // Tire Screech
    if (this.tireGain) {
      const targetTireGain = isDrifting ? 0.22 : 0.0;
      this.tireGain.gain.setTargetAtTime(targetTireGain, t, 0.05);
    }
  }

  public playRingCollect() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.exponentialRampToValueAtTime(1174.66, t + 0.12); // D6

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  public playStuntScore(isEpic: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const notes = isEpic ? [523.25, 659.25, 783.99, 1046.50] : [440, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);

      gain.gain.setValueAtTime(0.2, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.25);
    });
  }

  public playBoostPad() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.28);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  public playBounceLaunch() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.4);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (!this.isMuted) {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const audioEngine = new ProceduralAudioEngine();
