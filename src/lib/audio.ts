// Web Audio API Synthesizer and Speech Synthesis for Autism-Friendly Feedback

import { AccessibilitySettings } from '../types';

let audioCtx: AudioContext | null = null;
let currentCarOsc: OscillatorNode | null = null;
let currentCarGain: GainNode | null = null;

// Initialize Audio Context on demand (user interaction required by browsers)
function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Global settings reference
let currentSettings: AccessibilitySettings = {
  voiceGuidance: true,
  soundEffects: true,
  backgroundMusic: true,
  reducedMotion: false,
  highContrast: false,
  textSize: 'normal',
};

export function updateAudioSettings(settings: AccessibilitySettings) {
  currentSettings = settings;
  if (!settings.soundEffects) {
    stopCarHum();
  }
  if (!settings.voiceGuidance) {
    stopSpeaking();
  }
}

// 1. Synthesize Speech (Voice Guidance)
export function speak(text: string, force: boolean = false) {
  if (typeof window === 'undefined') return;
  
  // NEVER speak if voice guidance is disabled
  if (!currentSettings.voiceGuidance) return;

  const synth = window.speechSynthesis;
  if (!synth) return;

  // Stop current speaking if forcing
  if (force) {
    synth.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a friendly, high-quality English voice
  const voices = synth.getVoices();
  const friendlyVoice = voices.find(v => 
    v.lang.startsWith('en') && 
    (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('female'))
  ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

  if (friendlyVoice) {
    utterance.voice = friendlyVoice;
  }

  // Slightly slower, clear, and reassuring rate suitable for autism safety and learning
  utterance.rate = 0.85;
  utterance.pitch = 1.15; // friendly, higher pitch (more comforting)
  utterance.volume = 0.9;

  synth.speak(utterance);
}

// Cancel current speech narration
export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// 2. Synthesize Sound Effects
function createTone(freq: number, type: OscillatorType, duration: number, gainValue: number = 0.1) {
  if (!currentSettings.soundEffects) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  // Linear decay to prevent clicking
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// Click POP sound for buttons
export function playClick() {
  createTone(600, 'sine', 0.1, 0.15);
}

// Success chime: high, magical major arpeggio (C5 -> E5 -> G5 -> C6)
export function playSuccessChime() {
  if (!currentSettings.soundEffects) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle'; // soft sound
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
    
    gain.gain.setValueAtTime(0.08, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.5);
  });
}

// Waiting sound: high gentle double chime
export function playWaitChime() {
  if (!currentSettings.soundEffects) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // A4 + E5 harmonic chord
  const notes = [440.00, 659.25];
  notes.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.6);
  });
}

// Police whistle: Double gentle high warble
export function playWarningWhistle() {
  if (!currentSettings.soundEffects) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  // Rapid pitch modulation (warble)
  osc.frequency.setValueAtTime(1000, now);
  osc.frequency.linearRampToValueAtTime(1200, now + 0.08);
  osc.frequency.linearRampToValueAtTime(1000, now + 0.16);
  osc.frequency.linearRampToValueAtTime(1200, now + 0.24);

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.4);
}

// Bird chirping sound: sliding rapid frequencies
export function playBirdChirp() {
  if (!currentSettings.soundEffects) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(2500, now);
  osc.frequency.exponentialRampToValueAtTime(3200, now + 0.15);

  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}

// Level complete: full major chord progression (C -> G -> C)
export function playLevelCompleteChime() {
  if (!currentSettings.soundEffects) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // C major chords sliding up
  const chords = [
    [261.63, 329.63, 392.00], // C4, E4, G4
    [392.00, 493.88, 587.33], // G4, B4, D5
    [523.25, 659.25, 783.99], // C5, E5, G5
  ];

  chords.forEach((chord, chordIdx) => {
    const chordTime = now + chordIdx * 0.25;
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, chordTime);
      
      gain.gain.setValueAtTime(0.05, chordTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, chordTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(chordTime);
      osc.stop(chordTime + 0.6);
    });
  });
}

// 3. Continuous low engine hum for moving cars
export function startCarHum() {
  if (!currentSettings.soundEffects) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (currentCarOsc) return; // Already humming

  currentCarOsc = ctx.createOscillator();
  currentCarGain = ctx.createGain();

  currentCarOsc.type = 'sawtooth';
  currentCarOsc.frequency.setValueAtTime(55, ctx.currentTime); // very low hum

  // Lowpass filter to make it soft and rumbling, not harsh
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(100, ctx.currentTime);

  currentCarGain.gain.setValueAtTime(0.015, ctx.currentTime); // extremely soft hum

  currentCarOsc.connect(filter);
  filter.connect(currentCarGain);
  currentCarGain.connect(ctx.destination);

  currentCarOsc.start();
}

export function updateCarHumPitch(speedRatio: number) {
  if (!currentSettings.soundEffects || !currentCarOsc) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // speedRatio goes from 0 (stopped) to 1.5 (fast)
  // map speedRatio to frequency 45Hz - 85Hz
  const targetFreq = 45 + speedRatio * 30;
  currentCarOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
  currentCarGain?.gain.setTargetAtTime(speedRatio > 0.05 ? 0.015 : 0.002, ctx.currentTime, 0.1);
}

export function stopCarHum() {
  if (currentCarOsc) {
    try {
      currentCarOsc.stop();
      currentCarOsc.disconnect();
    } catch (e) {}
    currentCarOsc = null;
  }
  if (currentCarGain) {
    try {
      currentCarGain.disconnect();
    } catch (e) {}
    currentCarGain = null;
  }
}

// 4. Custom Vehicle Synthesized Sound Effects for fresh environments

// Bicycle Bell: Metallic dual-tone "ring ring"
export function playBicycleBell() {
  if (!currentSettings.soundEffects) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Two rapid successive rings
  [now, now + 0.15].forEach((time) => {
    // Principal frequency + high overtone for metallic ring
    [1200, 1800].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(idx === 0 ? 0.05 : 0.02, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.15);
    });
  });
}

// Fire Truck Siren: Clear dual-tone sliding wail "wee-woo wee-woo"
export function playFireTruckSiren() {
  if (!currentSettings.soundEffects) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle'; // Smooth, friendly siren
  osc.frequency.setValueAtTime(600, now);
  // Slide up and down
  osc.frequency.linearRampToValueAtTime(850, now + 0.25);
  osc.frequency.linearRampToValueAtTime(600, now + 0.5);
  osc.frequency.linearRampToValueAtTime(850, now + 0.75);
  osc.frequency.linearRampToValueAtTime(600, now + 1.0);

  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 1.2);
}

// Scooter Beep: Playful quick double beep "beep beep!"
export function playScooterBeep() {
  if (!currentSettings.soundEffects) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  [now, now + 0.12].forEach((time) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, time); // High clean A5 note

    gain.gain.setValueAtTime(0.03, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.08);
  });
}

// Car Horn: Cheerful dual-tone "honk honk!"
export function playCarHorn() {
  if (!currentSettings.soundEffects) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Dual-tone harmonic interval for realistic cute horn
  [now, now + 0.15].forEach((time) => {
    [349.23, 440.00].forEach((freq) => { // F4 + A4 major third
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.025, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.12);
    });
  });
}

// Heavy Truck/Bus Honk: Low air-horn "baaaarp!"
export function playTruckHonk() {
  if (!currentSettings.soundEffects) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  [220.00, 277.18].forEach((freq) => { // Low A3 + C#4 major chord
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  });
}

