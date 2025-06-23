'use strict';

export class Settings {
  constructor() {
    this.settings = {
      soundEnabled: true,
      musicEnabled: true,
      colorblindMode: false,
      highContrast: false,
      partyMode: false,
      volume: 1.0,
      musicVolume: 0.4,
      sfxVolume: 0.6,
      lastPlayedLevel: 1
    };
    
    this.loadSettings();
  }
  
  loadSettings() {
    try {
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
          
          if (this.settings.partyMode) {
            document.body.classList.add('party-mode');
          }
          
          this.updateUI();
        } catch (error) {
          console.error('Failed to parse settings:', error);
        }
      }
    } catch (error) {
      console.warn('LocalStorage not available:', error);
      // Settings will use defaults
    }
  }
  
  saveSettings() {
    try {
      localStorage.setItem('lightMazeSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Unable to save settings:', error);
    }
  }
  
  updateUI() {
    const soundToggle = document.getElementById('sound-toggle');
    const musicToggle = document.getElementById('music-toggle');
    const colorblindToggle = document.getElementById('colorblind-toggle');
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    const partyModeToggle = document.getElementById('party-mode-toggle');
    const musicVolumeSlider = document.getElementById('music-volume');
    const musicVolumeValue = document.getElementById('music-volume-value');
    const sfxVolumeSlider = document.getElementById('sfx-volume');
    const sfxVolumeValue = document.getElementById('sfx-volume-value');
    
    if (soundToggle) soundToggle.checked = this.settings.soundEnabled;
    if (musicToggle) musicToggle.checked = this.settings.musicEnabled;
    if (colorblindToggle) colorblindToggle.checked = this.settings.colorblindMode;
    if (highContrastToggle) highContrastToggle.checked = this.settings.highContrast;
    if (partyModeToggle) partyModeToggle.checked = this.settings.partyMode;
    
    if (musicVolumeSlider) {
      musicVolumeSlider.value = this.settings.musicVolume * 100;
      if (musicVolumeValue) musicVolumeValue.textContent = Math.round(this.settings.musicVolume * 100) + '%';
    }
    
    if (sfxVolumeSlider) {
      sfxVolumeSlider.value = this.settings.sfxVolume * 100;
      if (sfxVolumeValue) sfxVolumeValue.textContent = Math.round(this.settings.sfxVolume * 100) + '%';
    }
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
  
  setMusicVolume(volume) {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }
  
  setSfxVolume(volume) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }
  
  setPartyMode(enabled) {
    this.settings.partyMode = enabled;
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
  
  getMusicVolume() {
    return this.settings.musicVolume;
  }
  
  getSfxVolume() {
    return this.settings.sfxVolume;
  }
  
  getBestTime(levelId) {
    try {
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
    } catch (error) {
      console.warn('Unable to get best time:', error);
    }
    return null;
  }
  
  getBestMoves(levelId) {
    try {
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
    } catch (error) {
      console.warn('Unable to get best moves:', error);
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
  
  isPartyMode() {
    return this.settings.partyMode || false;
  }
}