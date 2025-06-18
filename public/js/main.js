'use strict';

import { Game } from './game.js';
import { UI } from './ui.js';
import { LevelManager } from './levels.js';
import { AudioManager } from './audio.js';
import { Settings } from './settings.js';

const LightMaze = {
  game: null,
  ui: null,
  levelManager: null,
  audioManager: null,
  settings: null,
  
  async init() {
    try {
      this.settings = new Settings();
      this.audioManager = new AudioManager(this.settings);
      this.levelManager = new LevelManager();
      
      await this.levelManager.loadLevels();
      
      const canvas = document.getElementById('game-canvas');
      this.game = new Game(canvas, this.levelManager, this.audioManager);
      this.ui = new UI(this.game, this.settings);
      
      this.setupEventListeners();
      this.hideLoadingScreen();
      
      this.game.loadLevel(this.levelManager.getCurrentLevel());
      
      window.Game = this.game;
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.showError('Failed to load game. Please refresh the page.');
    }
  },
  
  setupEventListeners() {
    document.getElementById('reset-btn').addEventListener('click', () => {
      this.game.resetLevel();
      this.ui.updateMoveCounter(0);
    });
    
    document.getElementById('undo-btn').addEventListener('click', () => {
      this.game.undo();
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.ui.showSettings();
    });
    
    document.getElementById('replay-btn').addEventListener('click', () => {
      this.game.resetLevel();
      this.ui.hideVictoryModal();
    });
    
    document.getElementById('next-level-btn').addEventListener('click', () => {
      const nextLevel = this.levelManager.getNextLevel();
      if (nextLevel) {
        this.game.loadLevel(nextLevel);
        this.ui.hideVictoryModal();
      }
    });
    
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

document.addEventListener('DOMContentLoaded', () => {
  LightMaze.init();
});

export { LightMaze };