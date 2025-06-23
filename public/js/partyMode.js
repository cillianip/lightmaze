'use strict';

import { AudioManager } from './audio.js';

export class PartyMode {
  constructor(game, audioManager) {
    this.game = game;
    this.audioManager = audioManager;
    this.enabled = false;
    
    // Disco ball properties
    this.discoBallRadius = 30;
    this.discoBallRotation = 0;
    this.lightSpots = [];
    
    // Rainbow colors for beams
    this.rainbowColors = [
      '#ff0000', // Red
      '#ff7700', // Orange
      '#ffdd00', // Yellow
      '#00ff00', // Green
      '#0099ff', // Light Blue
      '#0000ff', // Blue
      '#6633ff', // Purple
      '#ff00ff'  // Magenta
    ];
    
    this.colorIndex = 0;
    this.colorTransition = 0;
    
    // Background animation
    this.backgroundHue = 0;
    this.pulsePhase = 0;
    
    // Party music state
    this.partyMusic = null;
    this.normalMusic = null;
    
    // Initialize light spots for disco ball
    this.initializeLightSpots();
  }
  
  initializeLightSpots() {
    // Create 12 light spots that will rotate around
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      this.lightSpots.push({
        angle: angle,
        color: this.rainbowColors[i % this.rainbowColors.length],
        radius: 150 + Math.random() * 100,
        speed: 0.5 + Math.random() * 0.5,
        size: 20 + Math.random() * 15
      });
    }
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (enabled) {
      this.startPartyMode();
    } else {
      this.stopPartyMode();
    }
  }
  
  startPartyMode() {
    // Store current music state
    this.normalMusic = this.audioManager.currentMusic;
    
    // Play party music
    this.playPartyMusic();
    
    // Add party class to body for CSS effects
    document.body.classList.add('party-mode');
    
    // Start background animation
    this.animateBackground();
  }
  
  stopPartyMode() {
    // Stop party music and restore normal music
    this.stopPartyMusic();
    
    // Remove party class
    document.body.classList.remove('party-mode');
    
    // Reset background
    document.getElementById('canvas-container').style.background = '';
  }
  
  playPartyMusic() {
    // Create upbeat party music using Web Audio API
    if (!this.audioManager.context) return;
    
    // Stop current music
    this.audioManager.stopMusic();
    
    // Create party music oscillators and rhythms
    const createPartyBeat = () => {
      const ctx = this.audioManager.context;
      const now = ctx.currentTime;
      
      // Bass drum pattern (4/4 kick)
      const kickInterval = 0.5; // 120 BPM
      for (let i = 0; i < 8; i++) {
        const kickTime = now + i * kickInterval;
        const kick = ctx.createOscillator();
        const kickGain = ctx.createGain();
        
        kick.frequency.setValueAtTime(60, kickTime);
        kick.frequency.exponentialRampToValueAtTime(30, kickTime + 0.1);
        
        kickGain.gain.setValueAtTime(0.8, kickTime);
        kickGain.gain.exponentialRampToValueAtTime(0.01, kickTime + 0.1);
        
        kick.connect(kickGain);
        kickGain.connect(this.audioManager.masterGain);
        
        kick.start(kickTime);
        kick.stop(kickTime + 0.1);
      }
      
      // Hi-hat pattern
      for (let i = 0; i < 16; i++) {
        const hihatTime = now + i * 0.25;
        const hihat = ctx.createOscillator();
        const hihatGain = ctx.createGain();
        const hihatFilter = ctx.createBiquadFilter();
        
        hihat.type = 'square';
        hihat.frequency.value = 8000 + Math.random() * 2000;
        
        hihatFilter.type = 'highpass';
        hihatFilter.frequency.value = 7000;
        
        hihatGain.gain.setValueAtTime(0.1, hihatTime);
        hihatGain.gain.exponentialRampToValueAtTime(0.01, hihatTime + 0.05);
        
        hihat.connect(hihatFilter);
        hihatFilter.connect(hihatGain);
        hihatGain.connect(this.audioManager.masterGain);
        
        hihat.start(hihatTime);
        hihat.stop(hihatTime + 0.05);
      }
      
      // Synth melody
      const melodyNotes = [523.25, 587.33, 659.25, 698.46, 783.99, 659.25, 587.33, 523.25]; // C D E F G E D C
      melodyNotes.forEach((freq, i) => {
        const synthTime = now + i * 0.25;
        const synth = ctx.createOscillator();
        const synthGain = ctx.createGain();
        const synthFilter = ctx.createBiquadFilter();
        
        synth.type = 'sawtooth';
        synth.frequency.value = freq;
        
        synthFilter.type = 'lowpass';
        synthFilter.frequency.value = 2000;
        synthFilter.Q.value = 10;
        
        synthGain.gain.setValueAtTime(0.2, synthTime);
        synthGain.gain.exponentialRampToValueAtTime(0.01, synthTime + 0.2);
        
        synth.connect(synthFilter);
        synthFilter.connect(synthGain);
        synthGain.connect(this.audioManager.masterGain);
        
        synth.start(synthTime);
        synth.stop(synthTime + 0.2);
      });
    };
    
    // Create recurring beat
    this.partyMusic = setInterval(createPartyBeat, 4000); // 4 second loop
    createPartyBeat(); // Start immediately
  }
  
  stopPartyMusic() {
    if (this.partyMusic) {
      clearInterval(this.partyMusic);
      this.partyMusic = null;
    }
    
    // Restore normal music if it was playing
    if (this.normalMusic && this.audioManager.settings.isMusicEnabled()) {
      this.audioManager.playMusic();
    }
  }
  
  animateBackground() {
    if (!this.enabled) return;
    
    const container = document.getElementById('canvas-container');
    this.backgroundHue = (this.backgroundHue + 2) % 360;
    
    // Create animated gradient background
    const gradient = `linear-gradient(${this.backgroundHue}deg, 
      hsl(${this.backgroundHue}, 70%, 20%), 
      hsl(${(this.backgroundHue + 60) % 360}, 70%, 30%))`;
    
    container.style.background = gradient;
    
    requestAnimationFrame(() => this.animateBackground());
  }
  
  update(deltaTime) {
    if (!this.enabled) return;
    
    // Update disco ball rotation
    this.discoBallRotation += deltaTime * 0.5;
    
    // Update color transition for rainbow beams
    this.colorTransition += deltaTime * 0.5;
    if (this.colorTransition >= 1) {
      this.colorTransition = 0;
      this.colorIndex = (this.colorIndex + 1) % this.rainbowColors.length;
    }
    
    // Update pulse phase for UI elements
    this.pulsePhase += deltaTime * 2;
    
    // Update light spots
    this.lightSpots.forEach(spot => {
      spot.angle += spot.speed * deltaTime;
    });
  }
  
  render(ctx) {
    if (!this.enabled) return;
    
    // Save context state
    ctx.save();
    
    // Draw disco ball
    this.drawDiscoBall(ctx);
    
    // Draw light spots
    this.drawLightSpots(ctx);
    
    // Restore context state
    ctx.restore();
  }
  
  drawDiscoBall(ctx) {
    const centerX = ctx.canvas.width / 2;
    const centerY = 50;
    
    // Draw disco ball sphere
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.discoBallRotation);
    
    // Create metallic gradient
    const gradient = ctx.createRadialGradient(-10, -10, 5, 0, 0, this.discoBallRadius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#e0e0e0');
    gradient.addColorStop(0.6, '#c0c0c0');
    gradient.addColorStop(1, '#808080');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.discoBallRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw mirror facets
    const facetSize = 6;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 6; j++) {
        const angle1 = (i / 8) * Math.PI * 2;
        const angle2 = (j / 6 - 0.5) * Math.PI;
        
        const x = Math.cos(angle1) * Math.sin(angle2) * this.discoBallRadius;
        const y = Math.cos(angle2) * this.discoBallRadius;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle1);
        
        // Draw facet with random sparkle
        if (Math.random() > 0.7) {
          ctx.fillStyle = this.rainbowColors[Math.floor(Math.random() * this.rainbowColors.length)];
        } else {
          ctx.fillStyle = '#ffffff';
        }
        
        ctx.fillRect(-facetSize/2, -facetSize/2, facetSize, facetSize);
        ctx.restore();
      }
    }
    
    ctx.restore();
  }
  
  drawLightSpots(ctx) {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    this.lightSpots.forEach((spot, i) => {
      const x = centerX + Math.cos(spot.angle) * spot.radius;
      const y = centerY + Math.sin(spot.angle) * spot.radius;
      
      // Create gradient for light spot
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, spot.size);
      gradient.addColorStop(0, spot.color + '80'); // 50% opacity
      gradient.addColorStop(0.5, spot.color + '40'); // 25% opacity
      gradient.addColorStop(1, spot.color + '00'); // Transparent
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, spot.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  getRainbowColor() {
    // Get interpolated rainbow color for beams
    const currentColor = this.rainbowColors[this.colorIndex];
    const nextColor = this.rainbowColors[(this.colorIndex + 1) % this.rainbowColors.length];
    
    // Simple color interpolation (hex to rgb and back)
    const curr = this.hexToRgb(currentColor);
    const next = this.hexToRgb(nextColor);
    
    const r = Math.floor(curr.r + (next.r - curr.r) * this.colorTransition);
    const g = Math.floor(curr.g + (next.g - curr.g) * this.colorTransition);
    const b = Math.floor(curr.b + (next.b - curr.b) * this.colorTransition);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  getPartyParticleColor() {
    // Return a random rainbow color for particles
    return this.rainbowColors[Math.floor(Math.random() * this.rainbowColors.length)];
  }
  
  playPartySound(soundType) {
    if (!this.audioManager.context || !this.audioManager.settings.isSoundEnabled()) return;
    
    const ctx = this.audioManager.context;
    const now = ctx.currentTime;
    
    switch(soundType) {
      case 'crystal':
        // Play musical note instead of normal crystal sound
        const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major scale
        const note = notes[Math.floor(Math.random() * notes.length)];
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = note;
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc.connect(gain);
        gain.connect(this.audioManager.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.5);
        break;
        
      case 'victory':
        // Play party horn sound
        const horn = ctx.createOscillator();
        const hornGain = ctx.createGain();
        
        horn.type = 'sawtooth';
        horn.frequency.setValueAtTime(200, now);
        horn.frequency.exponentialRampToValueAtTime(400, now + 0.2);
        horn.frequency.exponentialRampToValueAtTime(200, now + 0.4);
        
        hornGain.gain.setValueAtTime(0.4, now);
        hornGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        horn.connect(hornGain);
        hornGain.connect(this.audioManager.sfxGain);
        
        horn.start(now);
        horn.stop(now + 0.4);
        break;
    }
  }
}