'use strict';

export class AudioManager {
  constructor(settings) {
    this.settings = settings;
    this.sounds = {};
    this.music = null;
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicOscillators = [];
    
    this.initializeAudio();
  }
  
  initializeAudio() {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContext();
      
      // Create gain nodes for volume control
      this.masterGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      
      this.masterGain.connect(this.context.destination);
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      
      this.masterGain.gain.value = 0.7;
      this.musicGain.gain.value = 0.4;
      this.sfxGain.gain.value = 0.6;
      
      this.sounds = {
        move: this.createEnhancedMoveSound(),
        rotate: this.createEnhancedRotateSound(),
        crystal: this.createCrystalSound(),
        victory: this.createVictorySound(),
        reset: this.createResetSound(),
        undo: this.createUndoSound(),
        levelComplete: this.createLevelCompleteSound()
      };
      
      document.addEventListener('click', () => {
        if (this.context.state === 'suspended') {
          this.context.resume();
        }
      }, { once: true });
      
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }
  
  createTone(frequency, duration, type = 'sine') {
    return () => {
      if (!this.context || !this.settings.isSoundEnabled()) return;
      
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
      
      gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
      
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);
    };
  }
  
  createVictorySound() {
    return () => {
      if (!this.context || !this.settings.isSoundEnabled()) return;
      
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const duration = 0.15;
      
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = this.context.createOscillator();
          const gainNode = this.context.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.sfxGain);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, this.context.currentTime);
          
          gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
          
          oscillator.start(this.context.currentTime);
          oscillator.stop(this.context.currentTime + duration);
        }, index * 100);
      });
    };
  }
  
  play(soundName) {
    if (this.sounds[soundName] && this.settings && this.settings.isSoundEnabled()) {
      try {
        this.sounds[soundName]();
      } catch (error) {
        console.warn('Audio playback failed:', error);
      }
    }
  }
  
  playMusic() {
    if (!this.settings.isMusicEnabled() || !this.context) return;
    
    // Stop any existing music
    this.stopMusic();
    
    // Create a simple ambient music loop
    this.createAmbientMusic();
  }
  
  stopMusic() {
    this.musicOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.musicOscillators = [];
  }
  
  setVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }
  
  createEnhancedMoveSound() {
    return () => {
      if (!this.context || !this.settings.isSoundEnabled()) return;
      
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, this.context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(220, this.context.currentTime + 0.1);
      
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      
      gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
      
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + 0.1);
    };
  }
  
  createEnhancedRotateSound() {
    return () => {
      if (!this.context || !this.settings.isSoundEnabled()) return;
      
      // Create a sweep sound
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(300, this.context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.05);
      oscillator.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.15, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
      
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + 0.1);
    };
  }
  
  createCrystalSound() {
    return () => {
      if (!this.context || !this.settings.isSoundEnabled()) return;
      
      // Create a bell-like sound
      const frequencies = [523.25, 659.25, 783.99];
      
      frequencies.forEach((freq, i) => {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq * (1 + i * 0.01); // Slight detuning
        
        const attackTime = 0.01;
        const decayTime = 0.3;
        
        gainNode.gain.setValueAtTime(0, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1 / (i + 1), this.context.currentTime + attackTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + decayTime);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + decayTime);
      });
    };
  }
  
  createResetSound() {
    return () => {
      if (!this.context || !this.settings.isSoundEnabled()) return;
      
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(220, this.context.currentTime);
      oscillator.frequency.linearRampToValueAtTime(110, this.context.currentTime + 0.15);
      
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      
      gainNode.gain.setValueAtTime(0.15, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
      
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + 0.15);
    };
  }
  
  createUndoSound() {
    return () => {
      if (!this.context || !this.settings.isSoundEnabled()) return;
      
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(330, this.context.currentTime);
      oscillator.frequency.linearRampToValueAtTime(440, this.context.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
      
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + 0.1);
    };
  }
  
  createLevelCompleteSound() {
    return () => {
      if (!this.context || !this.settings.isSoundEnabled()) return;
      
      const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.50];
      const duration = 0.15;
      
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = this.context.createOscillator();
          const gainNode = this.context.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.sfxGain);
          
          oscillator.type = 'sine';
          oscillator.frequency.value = freq;
          
          gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration * 2);
          
          oscillator.start(this.context.currentTime);
          oscillator.stop(this.context.currentTime + duration * 2);
        }, index * 80);
      });
    };
  }
  
  createAmbientMusic() {
    if (!this.context || !this.settings.isMusicEnabled()) return;
    
    // Base drone notes
    const baseFrequencies = [65.41, 98]; // C2 and G2
    const harmonics = [1, 2, 3, 4];
    
    baseFrequencies.forEach(baseFreq => {
      harmonics.forEach((harmonic, i) => {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.musicGain);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = baseFreq * harmonic;
        
        filter.type = 'lowpass';
        filter.frequency.value = 800 / harmonic;
        
        // Create slow volume oscillation
        const lfo = this.context.createOscillator();
        const lfoGain = this.context.createGain();
        
        lfo.frequency.value = 0.1 + Math.random() * 0.2; // Slow oscillation
        lfoGain.gain.value = 0.02 / (harmonic * 2);
        
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        
        gainNode.gain.value = 0.05 / (harmonic * 2);
        
        oscillator.start();
        lfo.start();
        
        this.musicOscillators.push(oscillator, lfo);
      });
    });
    
    // Add subtle melody
    this.createMelodyLoop();
  }
  
  createMelodyLoop() {
    // Simple pentatonic scale for peaceful sound
    const scale = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25]; // C pentatonic extended
    
    // Wave patterns - high to low sequences
    const wavePatterns = [
      [7, 6, 5, 4, 3, 2, 1, 0], // Full descending wave
      [5, 4, 3, 2, 3, 4, 3, 2], // Gentle wave down
      [4, 5, 4, 3, 2, 1, 2, 3], // Rolling wave
      [6, 5, 4, 5, 4, 3, 2, 1], // Stepped descent
      [3, 4, 3, 2, 1, 0, 1, 2], // Valley pattern
      [4, 3, 2, 3, 4, 3, 2, 1]  // Gentle undulation
    ];
    
    let currentWaveIndex = 0;
    let noteInWave = 0;
    let waveRepeat = 0;
    
    // Peaceful rhythm patterns - no jarring timings
    const rhythmPatterns = [
      [800, 800, 800, 800, 1600, 800, 800, 1600], // Steady with breath
      [1000, 1000, 1000, 1000, 2000], // Simple and calm
      [1200, 600, 600, 1200, 1200, 1200], // Gentle sway
      [900, 900, 900, 900, 900, 900, 1800], // Meditative
      [750, 750, 1500, 750, 750, 1500] // Peaceful pulse
    ];
    let currentRhythm = 0;
    let rhythmIndex = 0;
    
    const playNote = () => {
      if (!this.settings.isMusicEnabled() || this.musicOscillators.length === 0) return;
      
      // Get current wave pattern
      const currentWave = wavePatterns[currentWaveIndex];
      const noteIndex = currentWave[noteInWave % currentWave.length];
      
      // Always use the exact note from the pattern - no randomness
      const freq = scale[noteIndex];
      
      // Occasionally drop an octave for depth
      const octaveMultiplier = (noteIndex < 2 && noteInWave % 4 === 0) ? 0.5 : 1;
      
      // Create multiple oscillators for richer sound
      const oscillators = ['sine', 'triangle'].map((waveType, i) => {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        const panner = this.context.createStereoPanner();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.musicGain);
        
        oscillator.type = waveType;
        oscillator.frequency.value = freq * octaveMultiplier * (1 + i * 0.005); // Very slight detune
        
        filter.type = 'lowpass';
        filter.frequency.value = 600 + (noteIndex * 50); // Filter follows pitch
        filter.Q.value = 2;
        
        // Subtle stereo movement based on pitch
        panner.pan.value = (noteIndex - 4) * 0.1; // High notes right, low notes left
        
        const attackTime = 0.3;
        const releaseTime = 2.0;
        const volume = waveType === 'sine' ? 0.03 : 0.015;
        
        gainNode.gain.setValueAtTime(0, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + attackTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + releaseTime);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + releaseTime);
        
        return oscillator;
      });
      
      noteInWave++;
      
      // Complete one wave pattern
      if (noteInWave >= currentWave.length) {
        noteInWave = 0;
        waveRepeat++;
        
        // Change wave pattern every 2-3 repetitions
        if (waveRepeat >= 2) {
          waveRepeat = 0;
          currentWaveIndex = (currentWaveIndex + 1) % wavePatterns.length;
          
          // Change rhythm with new wave pattern
          currentRhythm = (currentRhythm + 1) % rhythmPatterns.length;
          rhythmIndex = 0;
        }
      }
      
      // Get next timing from rhythm pattern - no random variation
      const rhythm = rhythmPatterns[currentRhythm];
      const nextTime = rhythm[rhythmIndex % rhythm.length];
      rhythmIndex++;
      
      // Schedule next note
      setTimeout(playNote, nextTime);
    };
    
    // Add gentle bass line that follows the waves
    let bassIndex = 0;
    
    const playBass = () => {
      if (!this.settings.isMusicEnabled()) return;
      
      // Simple bass notes - C and G only for stability
      const bassNotes = [65.41, 98.11]; // C2 and G2
      const bassNote = bassNotes[bassIndex % 2];
      
      // Create two oscillators for fatter bass
      ['sine', 'triangle'].forEach((waveType, i) => {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.musicGain);
        
        oscillator.type = waveType;
        oscillator.frequency.value = bassNote * (1 + i * 0.002); // Very subtle detune
        
        filter.type = 'lowpass';
        filter.frequency.value = 150;
        filter.Q.value = 1;
        
        const attackTime = 0.5;
        const releaseTime = 3.0;
        const volume = waveType === 'sine' ? 0.06 : 0.03;
        
        gainNode.gain.setValueAtTime(0, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + attackTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + releaseTime);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + releaseTime);
      });
      
      bassIndex++;
      
      // Simple alternating pattern - every 4 beats
      const nextTime = 3200;
      
      // Schedule next bass note
      setTimeout(playBass, nextTime);
    };
    
    // Start the loops with tighter timing
    setTimeout(playNote, 500);
    setTimeout(playBass, 1000);
  }
  
  setVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
  
  setMusicVolume(volume) {
    if (this.musicGain) {
      this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
  
  setSfxVolume(volume) {
    if (this.sfxGain) {
      this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}