'use strict';

export class LevelSelector {
  constructor(levelManager, onLevelSelect) {
    this.levelManager = levelManager;
    this.onLevelSelect = onLevelSelect;
    this.currentWorld = 1;
    
    this.container = document.getElementById('level-select');
    this.grid = document.getElementById('level-grid');
    this.worldTabs = document.querySelectorAll('.world-tab');
    
    this.setupEventListeners();
    this.render();
  }
  
  setupEventListeners() {
    this.worldTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const world = parseInt(e.target.dataset.world);
        this.switchWorld(world);
      });
    });
  }
  
  switchWorld(world) {
    this.currentWorld = world;
    
    // Update tab states
    this.worldTabs.forEach(tab => {
      const tabWorld = parseInt(tab.dataset.world);
      tab.classList.toggle('active', tabWorld === world);
      tab.setAttribute('aria-selected', tabWorld === world);
    });
    
    this.render();
  }
  
  render() {
    this.grid.innerHTML = '';
    
    // Get levels for current world
    const levels = this.levelManager.levels.filter(level => level.world === this.currentWorld);
    
    levels.forEach(level => {
      const isUnlocked = this.levelManager.isLevelUnlocked(level.id);
      const progress = this.getLevelProgress(level.id);
      
      const levelElement = document.createElement('button');
      levelElement.className = 'level-item';
      levelElement.disabled = !isUnlocked;
      
      if (isUnlocked) {
        levelElement.classList.add('unlocked');
      }
      
      if (progress.completed) {
        levelElement.classList.add('completed');
      }
      
      // Create level content
      const levelNumber = document.createElement('div');
      levelNumber.className = 'level-number';
      // Calculate level number within the world
      const worldOffsets = { 1: 0, 2: 5, 3: 14 };
      const levelInWorld = level.id - worldOffsets[level.world];
      levelNumber.textContent = levelInWorld;
      
      const levelName = document.createElement('div');
      levelName.className = 'level-name';
      levelName.textContent = level.name;
      
      const levelStats = document.createElement('div');
      levelStats.className = 'level-stats';
      
      if (progress.completed) {
        // Show stars based on performance
        const stars = this.calculateStars(level, progress);
        for (let i = 0; i < 3; i++) {
          const star = document.createElement('span');
          star.className = 'star';
          star.textContent = i < stars ? '★' : '☆';
          levelStats.appendChild(star);
        }
      } else if (isUnlocked) {
        levelStats.textContent = `Par: ${level.parMoves}`;
      } else {
        levelStats.innerHTML = '🔒';
      }
      
      levelElement.appendChild(levelNumber);
      levelElement.appendChild(levelName);
      levelElement.appendChild(levelStats);
      
      if (isUnlocked) {
        levelElement.addEventListener('click', () => {
          this.onLevelSelect(level.id);
        });
      }
      
      this.grid.appendChild(levelElement);
    });
  }
  
  getLevelProgress(levelId) {
    try {
      const key = `level_${levelId}`;
      const saved = localStorage.getItem(key);
      
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return { completed: false };
        }
      }
    } catch (error) {
      console.warn('Unable to load level progress:', error);
    }
    
    return { completed: false };
  }
  
  calculateStars(level, progress) {
    let stars = 3;
    
    // Deduct stars based on moves
    if (progress.bestMoves > level.parMoves * 1.5) stars--;
    if (progress.bestMoves > level.parMoves * 2) stars--;
    
    // Ensure at least 1 star for completion
    return Math.max(1, stars);
  }
  
  show() {
    this.container.classList.remove('hidden');
    this.render(); // Refresh to show latest progress
  }
  
  hide() {
    this.container.classList.add('hidden');
  }
}