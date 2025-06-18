'use strict';

export class AudioManager {
  constructor(settings) {
    this.settings = settings;
    this.sounds = {};
    this.music = null;
    this.context = null;
    
    this.initializeAudio();
  }
  
  initializeAudio() {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContext();
      
      this.sounds = {
        move: this.createTone(440, 0.1, 'sine'),
        rotate: this.createTone(660, 0.1, 'sine'),
        crystal: this.createTone(880, 0.2, 'triangle'),
        victory: this.createVictorySound(),
        reset: this.createTone(220, 0.15, 'square'),
        undo: this.createTone(330, 0.1, 'sine')
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
      gainNode.connect(this.context.destination);
      
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
          gainNode.connect(this.context.destination);
          
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
    if (!this.settings.isMusicEnabled()) return;
    
  }
  
  stopMusic() {
    if (this.music) {
      this.music.pause();
    }
  }
  
  setVolume(volume) {
    if (this.context) {
      
    }
  }
}