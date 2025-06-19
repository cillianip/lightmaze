'use strict';

import { Game } from './game.js';
import { UI } from './ui.js';
import { LevelManager } from './levels.js';
import { AudioManager } from './audio.js';
import { Settings } from './settings.js';
import { LevelSelector } from './levelSelector.js';

const LightMaze = {
  game: null,
  ui: null,
  levelManager: null,
  audioManager: null,
  settings: null,
  levelSelector: null,
  
  async init() {
    try {
      // Initialize settings first
      this.settings = new Settings();
      this.audioManager = new AudioManager(this.settings);
      this.levelManager = new LevelManager();
      
      // Load all levels
      await this.levelManager.loadLevels();
      
      // Initialize game
      const canvas = document.getElementById('game-canvas');
      this.game = new Game(canvas, this.levelManager, this.audioManager);
      this.ui = new UI(this.game, this.settings);
      
      // Initialize level selector
      this.levelSelector = new LevelSelector(this.levelManager, (levelId) => {
        this.loadLevel(levelId);
      });
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      // Load first level or last played level
      const lastLevel = this.settings.getLastPlayedLevel() || 1;
      this.loadLevel(lastLevel);
      
      // Start background music if enabled
      if (this.settings.isMusicEnabled()) {
        this.audioManager.playMusic();
      }
      
      // Export for debugging
      window.Game = this.game;
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.showError('Failed to load game. Please refresh the page.');
    }
  },
  
  loadLevel(levelId) {
    const level = this.levelManager.getLevelById(levelId);
    if (level) {
      this.levelManager.setCurrentLevel(levelId);
      this.game.loadLevel(level);
      this.ui.updateLevelInfo(level);
      this.levelSelector.hide();
      this.settings.setLastPlayedLevel(levelId);
    }
  },
  
  setupEventListeners() {
    // Reset button
    document.getElementById('reset-btn').addEventListener('click', () => {
      this.game.resetLevel();
      this.ui.updateMoveCounter(0);
    });
    
    // Undo button
    document.getElementById('undo-btn').addEventListener('click', () => {
      this.game.undo();
    });
    
    // Levels button
    document.getElementById('levels-btn').addEventListener('click', () => {
      this.levelSelector.show();
      this.game.pause();
    });
    
    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.ui.showSettings();
    });
    
    // Victory modal buttons
    document.getElementById('replay-btn').addEventListener('click', () => {
      this.game.resetLevel();
      this.ui.hideVictoryModal();
    });
    
    document.getElementById('next-level-btn').addEventListener('click', () => {
      const nextLevel = this.levelManager.getNextLevel();
      if (nextLevel) {
        this.loadLevel(nextLevel.id);
        this.ui.hideVictoryModal();
      } else {
        // No more levels - show completion message
        alert('Congratulations! You have completed all levels!');
        this.ui.hideVictoryModal();
      }
    });
    
    // Level selector close button
    document.getElementById('close-level-select').addEventListener('click', () => {
      this.levelSelector.hide();
      this.game.resume();
    });
    
    // Window events
    window.addEventListener('resize', () => {
      this.game.handleResize();
    });
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.game.pause();
      } else {
        this.game.resume();
      }
    });
    
    // Keyboard shortcuts for audio controls
    document.addEventListener('keydown', (e) => {
      // M - toggle music
      if (e.key === 'm' || e.key === 'M') {
        const musicEnabled = !this.settings.isMusicEnabled();
        this.settings.setMusicEnabled(musicEnabled);
        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) musicToggle.checked = musicEnabled;
        
        if (musicEnabled) {
          this.audioManager.playMusic();
        } else {
          this.audioManager.stopMusic();
        }
      }
      
      // S - toggle sound effects
      if (e.key === 's' || e.key === 'S') {
        const soundEnabled = !this.settings.isSoundEnabled();
        this.settings.setSoundEnabled(soundEnabled);
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) soundToggle.checked = soundEnabled;
      }
    });
  },
  
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 300);
  },
  
  showError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.querySelector('p').textContent = message;
    loadingScreen.querySelector('.loader').style.display = 'none';
  }
};

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.LightMaze = LightMaze;
  LightMaze.init();
});

export { LightMaze };