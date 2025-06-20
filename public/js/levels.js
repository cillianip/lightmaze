'use strict';

export class LevelManager {
  constructor() {
    this.levels = [];
    this.currentLevelIndex = 0;
    this.unlockedLevels = new Set([1]);
    
    this.loadProgress();
  }
  
  async loadLevels() {
    const levelPromises = [];
    const worldLevels = {
      1: 5,   // Tutorial world
      2: 9,   // Intermediate world  
      3: 11   // Advanced world
    };
    
    let globalId = 1;
    
    for (let world = 1; world <= 3; world++) {
      const levelsInWorld = worldLevels[world];
      
      for (let level = 1; level <= levelsInWorld; level++) {
        const levelNum = level.toString().padStart(2, '0');
        const filename = `world${world}-${levelNum}.json`;
        
        levelPromises.push(
          this.loadLevel(filename, globalId, world)
            .catch(() => this.generatePlaceholderLevel(globalId, world))
        );
        
        globalId++;
      }
    }
    
    this.levels = await Promise.all(levelPromises);
  }
  
  async loadLevel(filename, id, world) {
    try {
      // Use relative path for GitHub Pages compatibility
      const basePath = window.location.pathname.includes('/lightmaze/') ? '/lightmaze' : '';
      const response = await fetch(`${basePath}/levels/${filename}`);
      if (!response.ok) throw new Error('Level not found');
      
      const levelData = await response.json();
      levelData.id = id;
      levelData.world = world;
      return levelData;
    } catch (error) {
      console.warn(`Failed to load level ${filename}:`, error);
      throw error;
    }
  }
  
  generatePlaceholderLevel(id, world) {
    // Calculate which level within the world this is
    const worldLevels = {
      1: 5,   // Tutorial world
      2: 9,   // Intermediate world  
      3: 11   // Advanced world
    };
    
    let levelInWorld = id;
    for (let w = 1; w < world; w++) {
      levelInWorld -= worldLevels[w];
    }
    
    const difficulty = world - 1;
    
    return {
      id,
      world,
      name: `Level ${id}`,
      gridSize: 40,
      parMoves: 5 + difficulty * 3,
      lightSource: { x: 2, y: 7, angle: 0 },
      walls: this.generateWalls(difficulty),
      crystals: this.generateCrystals(levelInWorld, difficulty),
      mirrors: this.generateMirrors(levelInWorld, difficulty)
    };
  }
  
  generateWalls(difficulty) {
    const walls = [
      { x: 0, y: 0, width: 20, height: 1 },
      { x: 0, y: 14, width: 20, height: 1 },
      { x: 0, y: 0, width: 1, height: 15 },
      { x: 19, y: 0, width: 1, height: 15 }
    ];
    
    if (difficulty >= 1) {
      walls.push(
        { x: 5, y: 5, width: 3, height: 1 },
        { x: 12, y: 9, width: 3, height: 1 }
      );
    }
    
    if (difficulty >= 2) {
      walls.push(
        { x: 8, y: 3, width: 1, height: 4 },
        { x: 11, y: 7, width: 1, height: 4 }
      );
    }
    
    return walls;
  }
  
  generateCrystals(level, difficulty) {
    const positions = [
      { x: 17, y: 7 },
      { x: 15, y: 3 },
      { x: 15, y: 11 },
      { x: 10, y: 7 }
    ];
    
    return positions.slice(0, Math.min(level, 1 + difficulty));
  }
  
  generateMirrors(level, difficulty) {
    const positions = [
      { x: 7, y: 7, angle: Math.PI / 4 },
      { x: 12, y: 5, angle: -Math.PI / 4 },
      { x: 10, y: 10, angle: Math.PI / 4 }
    ];
    
    return positions.slice(0, Math.min(level, 1 + difficulty));
  }
  
  getCurrentLevel() {
    return this.levels[this.currentLevelIndex];
  }
  
  getNextLevel() {
    if (this.currentLevelIndex < this.levels.length - 1) {
      this.currentLevelIndex++;
      const nextLevel = this.levels[this.currentLevelIndex];
      this.unlockLevel(nextLevel.id);
      return nextLevel;
    }
    return null;
  }
  
  getPreviousLevel() {
    if (this.currentLevelIndex > 0) {
      this.currentLevelIndex--;
      return this.levels[this.currentLevelIndex];
    }
    return null;
  }
  
  getLevelById(id) {
    // Convert to number to ensure consistent comparison
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    return this.levels.find(level => level.id === numId);
  }
  
  setCurrentLevel(id) {
    // Convert to number to ensure consistent comparison
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    const index = this.levels.findIndex(level => level.id === numId);
    if (index !== -1) {
      this.currentLevelIndex = index;
    }
  }
  
  isLevelUnlocked(id) {
    return this.unlockedLevels.has(id);
  }
  
  unlockLevel(id) {
    this.unlockedLevels.add(id);
    this.saveProgress();
  }
  
  completeLevel(id, moves, time) {
    this.unlockLevel(id + 1);
    
    try {
      const key = `level_${id}`;
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      
      const newRecord = {
        completed: true,
        bestMoves: Math.min(moves, existing.bestMoves || Infinity),
        bestTime: Math.min(time, existing.bestTime || Infinity),
        lastPlayed: Date.now()
      };
      
      localStorage.setItem(key, JSON.stringify(newRecord));
    } catch (error) {
      console.warn('Unable to save level progress:', error);
    }
    
    if (window.analytics && window.analytics.track) {
      window.analytics.track('level_complete', {
        level: id,
        moves: moves,
        time: time
      });
    }
  }
  
  loadProgress() {
    try {
      const saved = localStorage.getItem('unlockedLevels');
      if (saved) {
        try {
          const unlocked = JSON.parse(saved);
          this.unlockedLevels = new Set(unlocked);
        } catch (e) {
          console.error('Failed to parse progress:', e);
        }
      }
    } catch (error) {
      console.warn('LocalStorage not available:', error);
    }
  }
  
  saveProgress() {
    try {
      localStorage.setItem('unlockedLevels', JSON.stringify([...this.unlockedLevels]));
    } catch (error) {
      console.warn('Unable to save progress:', error);
    }
  }
}