'use strict';

export class Settings {
  constructor() {
    this.settings = {
      soundEnabled: true,
      musicEnabled: true,
      colorblindMode: false,
      highContrast: false,
      volume: 1.0,
      lastPlayedLevel: 1
    };
    
    this.loadSettings();
  }
  
  loadSettings() {
    const saved = localStorage.getItem('lightMazeSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
        
        if (this.settings.colorblindMode) {
          document.body.classList.add('colorblind-mode');
        }
        
        if (this.settings.highContrast) {
          document.body.classList.add('high-contrast');
        }
        
        this.updateUI();
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }
  
  saveSettings() {
    localStorage.setItem('lightMazeSettings', JSON.stringify(this.settings));
  }
  
  updateUI() {
    const soundToggle = document.getElementById('sound-toggle');
    const musicToggle = document.getElementById('music-toggle');
    const colorblindToggle = document.getElementById('colorblind-toggle');
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    
    if (soundToggle) soundToggle.checked = this.settings.soundEnabled;
    if (musicToggle) musicToggle.checked = this.settings.musicEnabled;
    if (colorblindToggle) colorblindToggle.checked = this.settings.colorblindMode;
    if (highContrastToggle) highContrastToggle.checked = this.settings.highContrast;
  }
  
  setSoundEnabled(enabled) {
    this.settings.soundEnabled = enabled;
    this.saveSettings();
  }
  
  setMusicEnabled(enabled) {
    this.settings.musicEnabled = enabled;
    this.saveSettings();
  }
  
  setColorblindMode(enabled) {
    this.settings.colorblindMode = enabled;
    this.saveSettings();
  }
  
  setHighContrast(enabled) {
    this.settings.highContrast = enabled;
    this.saveSettings();
  }
  
  setVolume(volume) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }
  
  isSoundEnabled() {
    return this.settings.soundEnabled;
  }
  
  isMusicEnabled() {
    return this.settings.musicEnabled;
  }
  
  isColorblindMode() {
    return this.settings.colorblindMode;
  }
  
  isHighContrast() {
    return this.settings.highContrast;
  }
  
  getVolume() {
    return this.settings.volume;
  }
  
  getBestTime(levelId) {
    const key = `level_${levelId}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        return parsed.bestTime;
      } catch (error) {
        return null;
      }
    }
    return null;
  }
  
  getBestMoves(levelId) {
    const key = `level_${levelId}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        return parsed.bestMoves;
      } catch (error) {
        return null;
      }
    }
    return null;
  }
  
  getLastPlayedLevel() {
    return this.settings.lastPlayedLevel || 1;
  }
  
  setLastPlayedLevel(levelId) {
    this.settings.lastPlayedLevel = levelId;
    this.saveSettings();
  }
}