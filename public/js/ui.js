'use strict';

export class UI {
  constructor(game, settings) {
    this.game = game;
    this.settings = settings;
    
    this.elements = {
      moveCounter: document.getElementById('move-counter'),
      timer: document.getElementById('timer'),
      levelName: document.getElementById('level-name'),
      worldIndicator: document.getElementById('world-indicator'),
      parMoves: document.getElementById('par-moves'),
      bestTime: document.getElementById('best-time'),
      crystalIndicators: document.getElementById('crystal-indicators'),
      settingsModal: document.getElementById('settings-modal'),
      victoryModal: document.getElementById('victory-modal'),
      levelSelect: document.getElementById('level-select'),
      finalMoves: document.getElementById('final-moves'),
      finalTime: document.getElementById('final-time'),
      starRating: document.getElementById('star-rating')
    };
    
    this.setupSettingsHandlers();
    this.timerInterval = null;
    this.startTimer();
  }
  
  setupSettingsHandlers() {
    document.getElementById('close-settings').addEventListener('click', () => {
      this.hideSettings();
    });
    
    document.getElementById('sound-toggle').addEventListener('change', (e) => {
      this.settings.setSoundEnabled(e.target.checked);
    });
    
    document.getElementById('music-toggle').addEventListener('change', (e) => {
      this.settings.setMusicEnabled(e.target.checked);
      
      if (window.LightMaze && window.LightMaze.audioManager) {
        if (e.target.checked) {
          window.LightMaze.audioManager.playMusic();
        } else {
          window.LightMaze.audioManager.stopMusic();
        }
      }
    });
    
    document.getElementById('colorblind-toggle').addEventListener('change', (e) => {
      this.settings.setColorblindMode(e.target.checked);
      document.body.classList.toggle('colorblind-mode', e.target.checked);
    });
    
    document.getElementById('high-contrast-toggle').addEventListener('change', (e) => {
      this.settings.setHighContrast(e.target.checked);
      document.body.classList.toggle('high-contrast', e.target.checked);
    });
    
    // Volume controls
    const musicVolumeSlider = document.getElementById('music-volume');
    const musicVolumeValue = document.getElementById('music-volume-value');
    const sfxVolumeSlider = document.getElementById('sfx-volume');
    const sfxVolumeValue = document.getElementById('sfx-volume-value');
    
    if (musicVolumeSlider) {
      musicVolumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value);
        musicVolumeValue.textContent = volume + '%';
        
        if (window.LightMaze && window.LightMaze.audioManager) {
          window.LightMaze.audioManager.setMusicVolume(volume / 100);
        }
        this.settings.setMusicVolume(volume / 100);
      });
    }
    
    if (sfxVolumeSlider) {
      sfxVolumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value);
        sfxVolumeValue.textContent = volume + '%';
        
        if (window.LightMaze && window.LightMaze.audioManager) {
          window.LightMaze.audioManager.setSfxVolume(volume / 100);
        }
        this.settings.setSfxVolume(volume / 100);
      });
    }
  }
  
  startTimer() {
    this.timerInterval = setInterval(() => {
      if (!this.game.isPaused && !this.game.isComplete) {
        this.updateTimer(this.game.getElapsedTime());
      }
    }, 1000);
  }
  
  updateMoveCounter(moves) {
    if (this.elements.moveCounter) {
      this.elements.moveCounter.textContent = moves;
      this.elements.moveCounter.classList.toggle('highlight', moves > 0);
    }
  }
  
  updateTimer(seconds) {
    if (this.elements.timer) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      this.elements.timer.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
  
  updateCrystalStatus(crystals) {
    if (!this.elements.crystalIndicators) return;
    
    this.elements.crystalIndicators.innerHTML = '';
    
    crystals.forEach((crystal, index) => {
      const indicator = document.createElement('div');
      indicator.className = `crystal-indicator ${crystal.isActive ? 'active' : ''}`;
      indicator.setAttribute('aria-label', `Crystal ${index + 1} ${crystal.isActive ? 'activated' : 'inactive'}`);
      this.elements.crystalIndicators.appendChild(indicator);
    });
  }
  
  updateLevelInfo(levelData) {
    if (!levelData) {
      console.error('[UI] No level data provided to updateLevelInfo');
      return;
    }
    
    if (this.elements.levelName) {
      this.elements.levelName.textContent = levelData.name || `Level ${levelData.id}`;
    }
    if (this.elements.worldIndicator) {
      this.elements.worldIndicator.textContent = `World ${levelData.world || 1}`;
    }
    if (this.elements.parMoves) {
      this.elements.parMoves.textContent = levelData.parMoves || '-';
    }
    
    const bestTime = this.settings.getBestTime(levelData.id);
    if (this.elements.bestTime) {
      if (bestTime) {
        const minutes = Math.floor(bestTime / 60);
        const seconds = bestTime % 60;
        this.elements.bestTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else {
        this.elements.bestTime.textContent = '-';
      }
    }
  }
  
  showSettings() {
    this.elements.settingsModal.classList.remove('hidden');
    this.game.pause();
  }
  
  hideSettings() {
    this.elements.settingsModal.classList.add('hidden');
    this.game.resume();
  }
  
  showVictory(moves, time) {
    this.elements.finalMoves.textContent = moves;
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    this.elements.finalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const stars = this.calculateStars(moves, time);
    this.renderStars(stars);
    
    this.elements.victoryModal.classList.remove('hidden');
  }
  
  hideVictoryModal() {
    this.elements.victoryModal.classList.add('hidden');
  }
  
  calculateStars(moves, time) {
    let stars = 3;
    
    if (this.game.currentLevel) {
      const parMoves = this.game.currentLevel.parMoves || moves;
      if (moves > parMoves * 1.5) stars--;
      if (moves > parMoves * 2) stars--;
    }
    
    return Math.max(1, stars);
  }
  
  renderStars(count) {
    this.elements.starRating.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      star.textContent = i < count ? '★' : '☆';
      this.elements.starRating.appendChild(star);
    }
  }
  
  showLevelSelect() {
    this.elements.levelSelect.classList.remove('hidden');
    this.game.pause();
  }
  
  hideLevelSelect() {
    this.elements.levelSelect.classList.add('hidden');
    this.game.resume();
  }
}