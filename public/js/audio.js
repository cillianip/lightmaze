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
    const pentatonic = [261.63, 293.66, 329.63, 392, 440]; // C pentatonic
    let noteIndex = 0;
    
    const playNote = () => {
      if (!this.settings.isMusicEnabled() || this.musicOscillators.length === 0) return;
      
      const freq = pentatonic[noteIndex] * (Math.random() > 0.5 ? 1 : 0.5);
      noteIndex = (noteIndex + Math.floor(Math.random() * 3)) % pentatonic.length;
      
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.musicGain);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      filter.Q.value = 5;
      
      const attackTime = 0.1;
      const releaseTime = 2;
      
      gainNode.gain.setValueAtTime(0, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, this.context.currentTime + attackTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + releaseTime);
      
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + releaseTime);
      
      // Schedule next note
      setTimeout(playNote, 2000 + Math.random() * 3000);
    };
    
    // Start the melody loop
    setTimeout(playNote, 1000);
  }
}