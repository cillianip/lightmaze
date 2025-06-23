'use strict';

export class EntityManager {
  constructor(gridSize = 40) {
    this.gridSize = gridSize;
    this.entities = new Map();
    this.grid = new Map(); // Spatial hash for efficient lookups
    this.draggableMirrors = [];
    this.walls = [];
    this.crystals = [];
    this.lightSource = null;
  }
  
  add(entity) {
    const id = this.generateId();
    entity.id = id;
    this.entities.set(id, entity);
    
    // Add to type-specific arrays
    switch (entity.type) {
      case 'mirror':
        this.draggableMirrors.push(entity);
        break;
      case 'wall':
        this.walls.push(entity);
        break;
      case 'crystal':
        this.crystals.push(entity);
        break;
      case 'light':
        this.lightSource = entity;
        break;
    }
    
    // Add to spatial grid
    this.updateGridPosition(entity);
    return id;
  }
  
  remove(id) {
    const entity = this.entities.get(id);
    if (!entity) return;
    
    // Remove from type arrays
    switch (entity.type) {
      case 'mirror':
        const mirrorIdx = this.draggableMirrors.indexOf(entity);
        if (mirrorIdx !== -1) this.draggableMirrors.splice(mirrorIdx, 1);
        break;
      case 'wall':
        const wallIdx = this.walls.indexOf(entity);
        if (wallIdx !== -1) this.walls.splice(wallIdx, 1);
        break;
      case 'crystal':
        const crystalIdx = this.crystals.indexOf(entity);
        if (crystalIdx !== -1) this.crystals.splice(crystalIdx, 1);
        break;
    }
    
    // Remove from spatial grid
    this.removeFromGrid(entity);
    this.entities.delete(id);
  }
  
  updateGridPosition(entity) {
    // Remove from old position
    this.removeFromGrid(entity);
    
    // Add to new position
    const key = this.getGridKey(entity.gridX, entity.gridY);
    if (!this.grid.has(key)) {
      this.grid.set(key, new Set());
    }
    this.grid.get(key).add(entity);
    
    // For walls, add to all occupied cells
    if (entity.type === 'wall') {
      for (let x = 0; x < entity.width; x++) {
        for (let y = 0; y < entity.height; y++) {
          const cellKey = this.getGridKey(entity.gridX + x, entity.gridY + y);
          if (!this.grid.has(cellKey)) {
            this.grid.set(cellKey, new Set());
          }
          this.grid.get(cellKey).add(entity);
        }
      }
    }
  }
  
  removeFromGrid(entity) {
    // Remove from all grid cells
    this.grid.forEach((entities, key) => {
      entities.delete(entity);
      if (entities.size === 0) {
        this.grid.delete(key);
      }
    });
  }
  
  getGridKey(gridX, gridY) {
    return `${gridX},${gridY}`;
  }
  
  getEntitiesAt(gridX, gridY) {
    const key = this.getGridKey(gridX, gridY);
    return this.grid.has(key) ? Array.from(this.grid.get(key)) : [];
  }
  
  canPlaceMirrorAt(gridX, gridY, excludeEntity = null) {
    const entities = this.getEntitiesAt(gridX, gridY);
    
    for (const entity of entities) {
      if (entity === excludeEntity) continue;
      
      // Can't place on walls, other mirrors, crystals, or light source
      if (entity.type !== 'empty') {
        return false;
      }
    }
    
    // Check bounds
    if (gridX < 0 || gridX >= 20 || gridY < 0 || gridY >= 15) {
      return false;
    }
    
    return true;
  }
  
  getMirrorAt(x, y, customRadius = null) {
    // Larger touch target for mobile devices
    const isTouchDevice = 'ontouchstart' in window;
    const baseRadius = isTouchDevice ? 35 : 30;
    const radius = customRadius || baseRadius;
    
    for (const mirror of this.draggableMirrors) {
      const dist = Math.sqrt(
        Math.pow(x - mirror.x, 2) + 
        Math.pow(y - mirror.y, 2)
      );
      if (dist < radius) {
        return mirror;
      }
    }
    return null;
  }
  
  getAllEntities() {
    return Array.from(this.entities.values());
  }
  
  getAllCrystals() {
    return this.crystals;
  }
  
  checkWinCondition() {
    // Only return true if there are crystals AND all are active
    return this.crystals.length > 0 && this.crystals.every(crystal => crystal.isActive);
  }
  
  resetCrystals() {
    this.crystals.forEach(crystal => crystal.deactivate());
  }
  
  generateId() {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  clear() {
    this.entities.clear();
    this.grid.clear();
    this.draggableMirrors = [];
    this.walls = [];
    this.crystals = [];
    this.lightSource = null;
  }
}