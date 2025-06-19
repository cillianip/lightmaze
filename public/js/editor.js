'use strict';

import { Game } from './game.js';
import { LevelManager } from './levels.js';
import { AudioManager } from './audio.js';
import { Settings } from './settings.js';
import { LevelValidator } from './levelValidator.js';
import { EntityManager } from './entityManager.js';
import { LightSource, Mirror, Crystal, Wall } from './entities.js';

class LevelEditor {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.settings = new Settings();
    this.audioManager = new AudioManager(this.settings);
    this.levelManager = new LevelManager();
    this.validator = new LevelValidator();
    
    this.currentTool = null;
    this.entities = new Map();
    this.gridSize = 40;
    
    this.lightSource = null;
    this.isTestMode = false;
    this.game = null;
    
    this.setupEventListeners();
    this.render();
  }
  
  setupEventListeners() {
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = e.target.dataset.tool;
        this.handleToolClick(tool, e.target);
      });
    });
    
    // Canvas click
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    
    // Canvas hover
    this.canvas.addEventListener('mousemove', this.handleCanvasHover.bind(this));
    
    // Level data textarea
    document.getElementById('level-data').addEventListener('input', (e) => {
      try {
        const data = JSON.parse(e.target.value);
        this.loadLevel(data);
      } catch (err) {
        // Invalid JSON, ignore
      }
    });
  }
  
  handleToolClick(tool, button) {
    // Remove active class from all buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    switch (tool) {
      case 'test':
        this.testLevel();
        break;
      case 'validate':
        this.validateLevel();
        break;
      case 'save':
        this.exportLevel();
        break;
      case 'load':
        this.importLevel();
        break;
      default:
        this.currentTool = tool;
        button.classList.add('active');
        break;
    }
  }
  
  handleCanvasClick(e) {
    if (this.isTestMode) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);
    
    switch (this.currentTool) {
      case 'light':
        this.placeLightSource(gridX, gridY);
        break;
      case 'crystal':
        this.placeCrystal(gridX, gridY);
        break;
      case 'wall':
        this.placeWall(gridX, gridY);
        break;
      case 'mirror':
        this.placeMirror(gridX, gridY);
        break;
      case 'delete':
        this.deleteEntity(gridX, gridY);
        break;
    }
    
    this.updateLevelData();
    this.render();
  }
  
  handleCanvasHover(e) {
    if (this.isTestMode) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.hoverX = Math.floor((e.clientX - rect.left) / this.gridSize);
    this.hoverY = Math.floor((e.clientY - rect.top) / this.gridSize);
    this.render();
  }
  
  placeLightSource(gridX, gridY) {
    // Remove existing light source
    if (this.lightSource) {
      this.entities.delete(this.lightSource.id);
    }
    
    this.lightSource = new LightSource(gridX, gridY, 0);
    this.entities.set(this.lightSource.id, this.lightSource);
  }
  
  placeCrystal(gridX, gridY) {
    const crystal = new Crystal(gridX, gridY);
    this.entities.set(crystal.id, crystal);
  }
  
  placeWall(gridX, gridY) {
    const wall = new Wall(gridX, gridY, 1, 1);
    this.entities.set(wall.id, wall);
  }
  
  placeMirror(gridX, gridY) {
    const mirror = new Mirror(gridX, gridY, Math.PI / 4);
    this.entities.set(mirror.id, mirror);
  }
  
  deleteEntity(gridX, gridY) {
    for (const [id, entity] of this.entities) {
      if (entity.gridX === gridX && entity.gridY === gridY) {
        this.entities.delete(id);
        if (entity === this.lightSource) {
          this.lightSource = null;
        }
        break;
      }
    }
  }
  
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    
    // Draw hover indicator
    if (this.hoverX !== undefined && this.hoverY !== undefined && this.currentTool) {
      this.ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
      this.ctx.fillRect(
        this.hoverX * this.gridSize,
        this.hoverY * this.gridSize,
        this.gridSize,
        this.gridSize
      );
    }
    
    // Draw entities
    this.entities.forEach(entity => {
      entity.draw(this.ctx);
    });
  }
  
  getLevelData() {
    const walls = [];
    const crystals = [];
    const mirrors = [];
    
    this.entities.forEach(entity => {
      switch (entity.type) {
        case 'wall':
          walls.push({
            x: entity.gridX,
            y: entity.gridY,
            width: entity.width / this.gridSize,
            height: entity.height / this.gridSize
          });
          break;
        case 'crystal':
          crystals.push({
            x: entity.gridX,
            y: entity.gridY
          });
          break;
        case 'mirror':
          mirrors.push({
            x: entity.gridX,
            y: entity.gridY,
            angle: entity.angle
          });
          break;
      }
    });
    
    const levelData = {
      name: document.getElementById('level-name').value,
      world: parseInt(document.getElementById('level-world').value),
      parMoves: parseInt(document.getElementById('level-par').value),
      walls,
      crystals,
      mirrors
    };
    
    if (this.lightSource) {
      levelData.lightSource = {
        x: this.lightSource.gridX,
        y: this.lightSource.gridY,
        angle: this.lightSource.angle
      };
    }
    
    return levelData;
  }
  
  updateLevelData() {
    const data = this.getLevelData();
    document.getElementById('level-data').value = JSON.stringify(data, null, 2);
  }
  
  loadLevel(data) {
    this.entities.clear();
    this.lightSource = null;
    
    if (data.lightSource) {
      this.placeLightSource(data.lightSource.x, data.lightSource.y);
      if (this.lightSource) {
        this.lightSource.angle = data.lightSource.angle || 0;
      }
    }
    
    if (data.walls) {
      data.walls.forEach(wall => {
        const w = new Wall(
          wall.x,
          wall.y,
          (wall.width || 1) * this.gridSize,
          (wall.height || 1) * this.gridSize
        );
        this.entities.set(w.id, w);
      });
    }
    
    if (data.crystals) {
      data.crystals.forEach(crystal => {
        this.placeCrystal(crystal.x, crystal.y);
      });
    }
    
    if (data.mirrors) {
      data.mirrors.forEach(mirror => {
        const m = new Mirror(mirror.x, mirror.y, mirror.angle || Math.PI / 4);
        this.entities.set(m.id, m);
      });
    }
    
    if (data.name) {
      document.getElementById('level-name').value = data.name;
    }
    if (data.world) {
      document.getElementById('level-world').value = data.world;
    }
    if (data.parMoves) {
      document.getElementById('level-par').value = data.parMoves;
    }
    
    this.render();
  }
  
  validateLevel() {
    const levelData = this.getLevelData();
    const result = this.validator.validateLevel(levelData);
    
    const resultDiv = document.getElementById('validation-result');
    resultDiv.style.display = 'block';
    
    if (result.isValid) {
      resultDiv.className = 'valid';
      resultDiv.innerHTML = '<h3>✅ Level is valid!</h3>';
      if (result.solution) {
        resultDiv.innerHTML += `<p>Solution found with ${result.solution.moves} moves</p>`;
      }
    } else {
      resultDiv.className = 'invalid';
      resultDiv.innerHTML = '<h3>❌ Level has issues:</h3>';
      result.issues.forEach(issue => {
        resultDiv.innerHTML += `<p>• ${issue}</p>`;
      });
    }
  }
  
  testLevel() {
    if (this.isTestMode) {
      this.exitTestMode();
      return;
    }
    
    const levelData = this.getLevelData();
    
    if (!this.game) {
      this.game = new Game(this.canvas, this.levelManager, this.audioManager);
    }
    
    this.game.loadLevel(levelData);
    this.isTestMode = true;
    
    document.querySelector('[data-tool="test"]').textContent = 'Exit Test';
  }
  
  exitTestMode() {
    this.isTestMode = false;
    document.querySelector('[data-tool="test"]').textContent = 'Test Level';
    this.render();
  }
  
  exportLevel() {
    const data = this.getLevelData();
    const json = JSON.stringify(data, null, 2);
    
    // Create download link
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  importLevel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.loadLevel(data);
          this.updateLevelData();
        } catch (err) {
          alert('Invalid level file');
        }
      };
      reader.readAsText(file);
    });
    
    input.click();
  }
}

// Initialize editor
document.addEventListener('DOMContentLoaded', () => {
  new LevelEditor();
});