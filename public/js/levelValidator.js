'use strict';

import { RayCaster } from './engine.js';
import { EntityManager } from './entityManager.js';
import { LightSource, Mirror, Crystal, Wall } from './entities.js';

export class LevelValidator {
  constructor() {
    this.rayCaster = new RayCaster();
  }
  
  /**
   * Validates if a level has at least one solution
   * @param {Object} levelData - The level data to validate
   * @returns {Object} - { isValid: boolean, solution: Array|null, issues: Array }
   */
  validateLevel(levelData) {
    const issues = [];
    
    // Basic validation
    if (!levelData.lightSource) {
      issues.push('Level must have a light source');
      return { isValid: false, solution: null, issues };
    }
    
    if (!levelData.crystals || levelData.crystals.length === 0) {
      issues.push('Level must have at least one crystal');
      return { isValid: false, solution: null, issues };
    }
    
    // Check if level is solvable
    const solution = this.findSolution(levelData);
    
    if (!solution) {
      issues.push('Level has no valid solution');
      return { isValid: false, solution: null, issues };
    }
    
    return { isValid: true, solution, issues };
  }
  
  /**
   * Attempts to find a solution for the level
   * Uses a breadth-first search approach to try different mirror configurations
   */
  findSolution(levelData) {
    const entityManager = new EntityManager();
    
    // Set up static entities
    const lightSource = new LightSource(
      levelData.lightSource.x,
      levelData.lightSource.y,
      levelData.lightSource.angle || 0
    );
    entityManager.add(lightSource);
    
    // Add walls
    if (levelData.walls) {
      levelData.walls.forEach(wallData => {
        const wall = new Wall(
          wallData.x,
          wallData.y,
          wallData.width || 1,
          wallData.height || 1
        );
        entityManager.add(wall);
      });
    }
    
    // Add crystals
    const crystals = [];
    levelData.crystals.forEach(crystalData => {
      const crystal = new Crystal(crystalData.x, crystalData.y);
      entityManager.add(crystal);
      crystals.push(crystal);
    });
    
    // Get draggable mirrors
    const mirrors = [];
    if (levelData.mirrors) {
      levelData.mirrors.forEach(mirrorData => {
        const mirror = new Mirror(
          mirrorData.x,
          mirrorData.y,
          mirrorData.angle || Math.PI / 4
        );
        mirrors.push(mirror);
      });
    }
    
    // Try to solve without any mirrors first
    if (this.checkSolution(entityManager, crystals)) {
      return { moves: 0, mirrorPositions: [] };
    }
    
    // If there are no draggable mirrors, level is unsolvable
    if (mirrors.length === 0) {
      return null;
    }
    
    // Try different mirror placements
    // For simplicity, we'll try placing one mirror at a time in key positions
    const gridSize = 40;
    const maxX = 20;
    const maxY = 15;
    
    // Generate strategic positions to try (along the light path)
    const strategicPositions = this.getStrategicPositions(
      entityManager, lightSource, crystals, gridSize, maxX, maxY
    );
    
    // Try each mirror in each strategic position
    for (const mirror of mirrors) {
      for (const pos of strategicPositions) {
        // Clear previous placement
        entityManager.entities.delete(mirror.id);
        
        // Try new position
        mirror.gridX = pos.x;
        mirror.gridY = pos.y;
        mirror.x = pos.x * gridSize + gridSize / 2;
        mirror.y = pos.y * gridSize + gridSize / 2;
        
        // Try both mirror angles
        for (const angle of [Math.PI / 4, Math.PI * 3 / 4]) {
          mirror.angle = angle;
          
          // Check if position is valid (no collisions)
          if (!entityManager.canPlaceEntity(mirror)) {
            continue;
          }
          
          // Add mirror and test
          entityManager.add(mirror);
          
          if (this.checkSolution(entityManager, crystals)) {
            return {
              moves: 1,
              mirrorPositions: [{
                x: pos.x,
                y: pos.y,
                angle: angle
              }]
            };
          }
          
          // Remove for next attempt
          entityManager.entities.delete(mirror.id);
        }
      }
    }
    
    // TODO: Try combinations of multiple mirrors for more complex levels
    
    return null;
  }
  
  /**
   * Gets strategic positions where mirrors might be useful
   */
  getStrategicPositions(entityManager, lightSource, crystals, gridSize, maxX, maxY) {
    const positions = new Set();
    
    // Cast initial ray to see where light goes
    const rays = this.rayCaster.cast(lightSource, entityManager.getAllEntities());
    
    // Add positions along the light path
    rays.forEach(ray => {
      ray.points.forEach(point => {
        const gridX = Math.floor(point.x / gridSize);
        const gridY = Math.floor(point.y / gridSize);
        
        // Add adjacent positions
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const x = gridX + dx;
            const y = gridY + dy;
            if (x >= 0 && x < maxX && y >= 0 && y < maxY) {
              positions.add(`${x},${y}`);
            }
          }
        }
      });
    });
    
    // Add positions between light source and crystals
    crystals.forEach(crystal => {
      const dx = crystal.gridX - lightSource.gridX;
      const dy = crystal.gridY - lightSource.gridY;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      
      for (let i = 1; i < steps; i++) {
        const x = Math.round(lightSource.gridX + (dx * i) / steps);
        const y = Math.round(lightSource.gridY + (dy * i) / steps);
        if (x >= 0 && x < maxX && y >= 0 && y < maxY) {
          positions.add(`${x},${y}`);
        }
      }
    });
    
    // Convert set to array of positions
    return Array.from(positions).map(pos => {
      const [x, y] = pos.split(',').map(Number);
      return { x, y };
    });
  }
  
  /**
   * Checks if current configuration activates all crystals
   */
  checkSolution(entityManager, crystals) {
    // Reset crystals
    crystals.forEach(crystal => crystal.isActive = false);
    
    // Cast rays
    const lightSource = entityManager.lightSource;
    if (!lightSource) return false;
    
    this.rayCaster.cast(lightSource, entityManager.getAllEntities());
    
    // Check if all crystals are active
    return crystals.every(crystal => crystal.isActive);
  }
  
  /**
   * Generates a hint for the current level state
   */
  generateHint(levelData, currentState) {
    const validation = this.validateLevel(levelData);
    
    if (!validation.isValid) {
      return "This level cannot be solved in its current design.";
    }
    
    if (!validation.solution) {
      return "Try experimenting with different mirror positions and angles.";
    }
    
    // Compare current state with solution
    const solution = validation.solution;
    
    if (solution.moves === 0) {
      return "The light should reach all crystals without any mirrors!";
    }
    
    // Give a vague hint about mirror placement
    const firstMirror = solution.mirrorPositions[0];
    const hints = [
      "Try placing a mirror where the light beam hits a wall.",
      "Consider redirecting the light beam towards the crystals.",
      "Sometimes a 45° angle mirror works better than a 135° angle.",
      "Look for positions where the light can bounce to reach all crystals."
    ];
    
    return hints[Math.floor(Math.random() * hints.length)];
  }
}