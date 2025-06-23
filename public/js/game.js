'use strict';

import { RayCaster, Renderer, Vector2 } from './engine.js';
import { LightSource, Mirror, Crystal, Wall } from './entities.js';
import { EntityManager } from './entityManager.js';
import { ParticleSystem } from './particles.js';
import { TransitionManager } from './transitions.js';
import { PerformanceMonitor } from './performance.js';

export class Game {
  constructor(canvas, levelManager, audioManager) {
    this.canvas = canvas;
    this.levelManager = levelManager;
    this.audioManager = audioManager;
    
    this.renderer = new Renderer(canvas);
    this.rayCaster = new RayCaster();
    this.entityManager = new EntityManager();
    this.particleSystem = new ParticleSystem();
    this.transitionManager = new TransitionManager(canvas);
    this.performanceMonitor = new PerformanceMonitor();
    
    this.moveCount = 0;
    this.globalStartTime = Date.now(); // Global timer for entire game session
    this.levelStartTime = Date.now(); // Timer for current level
    this.isPaused = false;
    this.isComplete = false;
    
    this.history = [];
    this.currentLevel = null;
    this.draggedMirror = null;
    this.hoveredMirror = null;
    this.lastTimestamp = null;
    
    // Mobile touch handling
    this.lastTapTime = 0;
    this.lastTapX = 0;
    this.lastTapY = 0;
    this.tapTimeout = null;
    
    this.setupInputHandlers();
    this.gameLoop = this.gameLoop.bind(this);
    
    // Handle initial sizing and window resize
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    
    requestAnimationFrame(this.gameLoop);
  }
  
  loadLevel(levelData, useTransition = true) {
    if (useTransition && !this.transitionManager.isActive()) {
      // Start transition
      const transitionType = ['circleWipe', 'slideLeft', 'slideRight'][Math.floor(Math.random() * 3)];
      this.transitionManager[transitionType](() => {
        this._loadLevelData(levelData);
      }, 600);
    } else {
      this._loadLevelData(levelData);
    }
  }
  
  _loadLevelData(levelData) {
    this.currentLevel = levelData;
    this.entityManager.clear();
    this.particleSystem.clear();
    this.history = [];
    this.moveCount = 0;
    this.levelStartTime = Date.now(); // Reset level timer, but not global timer
    this.isComplete = false;
    
    if (levelData.lightSource) {
      const lightSource = new LightSource(
        levelData.lightSource.x,
        levelData.lightSource.y,
        levelData.lightSource.angle || 0
      );
      this.entityManager.add(lightSource);
    }
    
    if (levelData.walls) {
      levelData.walls.forEach(wallData => {
        const wall = new Wall(
          wallData.x,
          wallData.y,
          wallData.width || 1,
          wallData.height || 1
        );
        this.entityManager.add(wall);
      });
    }
    
    if (levelData.crystals) {
      levelData.crystals.forEach(crystalData => {
        const crystal = new Crystal(crystalData.x, crystalData.y);
        this.entityManager.add(crystal);
      });
    }
    
    if (levelData.mirrors) {
      levelData.mirrors.forEach(mirrorData => {
        const mirror = new Mirror(
          mirrorData.x,
          mirrorData.y,
          mirrorData.angle || Math.PI / 4
        );
        this.entityManager.add(mirror);
      });
    }
    
    this.updateUI();
    
    // Show mobile hint on first level for touch devices
    if ('ontouchstart' in window && levelData.id === 1) {
      this.showMobileHint();
    }
  }
  
  showMobileHint() {
    const hint = document.getElementById('mobile-hint');
    if (hint) {
      hint.classList.remove('hidden');
      setTimeout(() => {
        hint.classList.add('hidden');
      }, 5000); // Hide after 5 seconds
    }
  }
  
  setupInputHandlers() {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    // Prevent default touch behaviors
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  handlePointerDown(e) {
    if (this.isPaused || this.isComplete) return;
    
    const rect = this.canvas.getBoundingClientRect();
    // Scale coordinates from display size to canvas resolution
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Check for double tap
    const now = Date.now();
    const tapDelay = 300; // milliseconds
    const tapDistance = 30; // pixels
    
    if (this.lastTapTime && 
        (now - this.lastTapTime) < tapDelay &&
        Math.abs(x - this.lastTapX) < tapDistance &&
        Math.abs(y - this.lastTapY) < tapDistance) {
      // Double tap detected
      const mirror = this.entityManager.getMirrorAt(x, y);
      if (mirror) {
        this.saveState();
        mirror.rotate();
        this.moveCount++;
        this.updateUI();
        this.audioManager.play('rotate');
        
        // Create rotation particle effect
        const pos = mirror.getCenter();
        this.particleSystem.createMirrorRotation(pos.x, pos.y);
        
        // Reset tap tracking
        this.lastTapTime = 0;
        return;
      }
    }
    
    this.lastTapTime = now;
    this.lastTapX = x;
    this.lastTapY = y;
    
    // Normal drag handling
    const mirror = this.entityManager.getMirrorAt(x, y);
    if (mirror) {
      this.saveState();
      mirror.startDrag(x, y);
      this.draggedMirror = mirror;
    }
  }
  
  handlePointerMove(e) {
    if (this.isPaused || this.isComplete) return;
    
    const rect = this.canvas.getBoundingClientRect();
    // Scale coordinates from display size to canvas resolution
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (this.draggedMirror && this.draggedMirror.isDragging) {
      const oldGridX = this.draggedMirror.gridX;
      const oldGridY = this.draggedMirror.gridY;
      
      this.draggedMirror.updateDrag(x, y);
      
      // Check if position is valid
      if (!this.entityManager.canPlaceMirrorAt(this.draggedMirror.gridX, this.draggedMirror.gridY, this.draggedMirror)) {
        // Revert to old position
        this.draggedMirror.gridX = oldGridX;
        this.draggedMirror.gridY = oldGridY;
        this.draggedMirror.x = oldGridX * this.draggedMirror.gridSize + this.draggedMirror.gridSize / 2;
        this.draggedMirror.y = oldGridY * this.draggedMirror.gridSize + this.draggedMirror.gridSize / 2;
      } else {
        // Update entity manager grid
        this.entityManager.updateGridPosition(this.draggedMirror);
      }
    } else {
      // Handle hover
      const newHoveredMirror = this.entityManager.getMirrorAt(x, y);
      
      if (newHoveredMirror !== this.hoveredMirror) {
        if (this.hoveredMirror) {
          this.hoveredMirror.isHovered = false;
        }
        
        this.hoveredMirror = newHoveredMirror;
        
        if (this.hoveredMirror) {
          this.hoveredMirror.isHovered = true;
          this.canvas.style.cursor = 'pointer';
        } else {
          this.canvas.style.cursor = 'crosshair';
        }
      }
    }
  }
  
  handlePointerUp(e) {
    if (this.draggedMirror && this.draggedMirror.isDragging) {
      this.draggedMirror.endDrag();
      this.moveCount++;
      this.updateUI();
      this.audioManager.play('move');
    }
    this.draggedMirror = null;
  }
  
  handleContextMenu(e) {
    e.preventDefault();
    
    if (this.isPaused || this.isComplete) return;
    
    const rect = this.canvas.getBoundingClientRect();
    // Scale coordinates from display size to canvas resolution
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const mirror = this.entityManager.getMirrorAt(x, y);
    if (mirror) {
      this.saveState();
      mirror.rotate();
      this.moveCount++;
      this.updateUI();
      this.audioManager.play('rotate');
      
      // Create rotation particle effect
      const pos = mirror.getCenter();
      this.particleSystem.createMirrorRotation(pos.x, pos.y);
    }
  }
  
  handleKeyDown(e) {
    if (this.isPaused || this.isComplete) return;
    
    switch(e.key) {
      case 'r':
      case 'R':
        this.resetLevel();
        break;
      case 'z':
      case 'Z':
        if (e.ctrlKey || e.metaKey) {
          this.undo();
        }
        break;
    }
  }
  
  saveState() {
    const state = {
      mirrors: this.entityManager.draggableMirrors.map(m => ({
        id: m.id,
        gridX: m.gridX,
        gridY: m.gridY,
        angle: m.angle
      })),
      moveCount: this.moveCount
    };
    
    this.history.push(state);
  }
  
  undo() {
    if (this.history.length === 0) return;
    
    const state = this.history.pop();
    
    state.mirrors.forEach((mirrorState) => {
      const mirror = this.entityManager.entities.get(mirrorState.id);
      if (mirror) {
        mirror.gridX = mirrorState.gridX;
        mirror.gridY = mirrorState.gridY;
        mirror.x = mirror.gridX * mirror.gridSize + mirror.gridSize / 2;
        mirror.y = mirror.gridY * mirror.gridSize + mirror.gridSize / 2;
        mirror.angle = mirrorState.angle;
        this.entityManager.updateGridPosition(mirror);
      }
    });
    
    this.moveCount = state.moveCount;
    this.updateUI();
    this.audioManager.play('undo');
  }
  
  resetLevel() {
    if (this.currentLevel) {
      this.loadLevel(this.currentLevel, false); // No transition for reset
      this.audioManager.play('reset');
    }
  }
  
  updateUI() {
    if (window.LightMaze && window.LightMaze.ui) {
      window.LightMaze.ui.updateMoveCounter(this.moveCount);
      window.LightMaze.ui.updateTimer(this.getElapsedTime());
      window.LightMaze.ui.updateCrystalStatus(this.entityManager.getAllCrystals());
    }
  }
  
  getElapsedTime() {
    return Math.floor((Date.now() - this.globalStartTime) / 1000);
  }
  
  getLevelElapsedTime() {
    return Math.floor((Date.now() - this.levelStartTime) / 1000);
  }
  
  checkWinCondition() {
    const allCrystalsActive = this.entityManager.checkWinCondition();
    
    if (allCrystalsActive && !this.isComplete) {
      this.isComplete = true;
      this.audioManager.play('levelComplete');
      
      // Create victory particle effect
      this.particleSystem.createVictoryEffect(this.canvas.width, this.canvas.height);
      
      // Wait 1 second before showing the victory popup
      setTimeout(() => {
        if (window.LightMaze && window.LightMaze.ui) {
          window.LightMaze.ui.showVictory(this.moveCount, this.getLevelElapsedTime());
        }
        
        if (this.currentLevel && this.currentLevel.id) {
          this.levelManager.completeLevel(
            this.currentLevel.id,
            this.moveCount,
            this.getLevelElapsedTime()
          );
        }
      }, 2000);
    }
  }
  
  gameLoop(timestamp) {
    this.performanceMonitor.startFrame();
    
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
    }
    
    const deltaTime = Math.min((timestamp - this.lastTimestamp) / 1000, 0.016); // Cap at 60fps
    this.lastTimestamp = timestamp;
    
    if (!this.isPaused) {
      this.performanceMonitor.startProfile('update');
      this.update(deltaTime);
      this.performanceMonitor.endProfile('update');
      
      this.performanceMonitor.startProfile('render');
      this.render();
      this.performanceMonitor.endProfile('render');
    }
    
    // Update and render transitions
    this.transitionManager.update(timestamp);
    this.transitionManager.render();
    
    this.performanceMonitor.endFrame();
    requestAnimationFrame(this.gameLoop);
  }
  
  update(deltaTime) {
    // Store previous crystal states
    const previousCrystalStates = new Map();
    this.entityManager.crystals.forEach(crystal => {
      previousCrystalStates.set(crystal.id, crystal.isActive);
    });
    
    this.entityManager.resetCrystals();
    
    if (this.entityManager.lightSource) {
      const rays = this.rayCaster.cast(this.entityManager.lightSource, this.entityManager.getAllEntities());
      this.currentRays = rays;
      
      // Add beam trail particles
      if (rays.length > 0 && Math.random() < 0.3) { // 30% chance per frame
        const ray = rays[rays.length - 1];
        if (ray.points.length > 1) {
          const lastPoint = ray.points[ray.points.length - 1];
          const secondLastPoint = ray.points[ray.points.length - 2];
          const direction = {
            x: lastPoint.x - secondLastPoint.x,
            y: lastPoint.y - secondLastPoint.y
          };
          const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
          if (length > 0) {
            direction.x /= length;
            direction.y /= length;
            this.particleSystem.createBeamTrail(lastPoint.x, lastPoint.y, 
              new Vector2(direction.x, direction.y));
          }
        }
      }
    }
    
    // Check for newly activated crystals
    this.entityManager.crystals.forEach(crystal => {
      if (crystal.isActive && !previousCrystalStates.get(crystal.id)) {
        // Crystal just activated!
        const pos = crystal.getCenter();
        this.particleSystem.createCrystalActivation(pos.x, pos.y);
        this.audioManager.play('crystal');
      }
    });
    
    // Update particle system
    this.particleSystem.update(deltaTime);
    
    // Update UI (including timer)
    this.updateUI();
    
    this.checkWinCondition();
  }
  
  render() {
    this.renderer.clear();
    this.renderer.drawGrid(40);
    
    this.entityManager.getAllEntities().forEach(entity => {
      this.renderer.drawEntity(entity);
    });
    
    if (this.currentRays) {
      this.renderer.drawRays(this.currentRays);
    }
    
    // Render particles on top
    this.particleSystem.render(this.renderer.ctx);
  }
  
  pause() {
    this.isPaused = true;
  }
  
  resume() {
    this.isPaused = false;
  }
  
  handleResize() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    // Calculate available space
    const padding = 20;
    const availableWidth = rect.width - padding * 2;
    const availableHeight = rect.height - padding * 2;
    
    // Maintain 4:3 aspect ratio
    const targetRatio = 4 / 3;
    let width, height;
    
    if (availableWidth / availableHeight > targetRatio) {
      // Height constrained
      height = availableHeight;
      width = height * targetRatio;
    } else {
      // Width constrained
      width = availableWidth;
      height = width / targetRatio;
    }
    
    // Apply max dimensions for desktop
    const maxWidth = 800;
    const maxHeight = 600;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / targetRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * targetRatio;
    }
    
    // Update canvas display size
    this.canvas.style.width = Math.floor(width) + 'px';
    this.canvas.style.height = Math.floor(height) + 'px';
    
    // Calculate scale factor for rendering
    this.scale = width / this.canvas.width;
    
    // For touch devices, ensure minimum grid size
    const isTouchDevice = 'ontouchstart' in window;
    if (isTouchDevice) {
      const minGridSize = 40; // minimum 40px per grid cell
      const gridCells = 20; // 20x15 grid
      const minWidth = gridCells * minGridSize;
      
      if (width < minWidth) {
        // Add scroll or zoom capability for small screens
        container.style.overflow = 'auto';
      }
    }
  }
}