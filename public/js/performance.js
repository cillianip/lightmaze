'use strict';

export class PerformanceMonitor {
  constructor() {
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.lastFpsUpdate = 0;
    this.frameTimes = [];
    this.maxFrameSamples = 100;
    
    this.showDebug = this.checkDebugMode();
    this.debugElement = null;
    
    if (this.showDebug) {
      this.createDebugDisplay();
    }
  }
  
  checkDebugMode() {
    const params = new URLSearchParams(window.location.search);
    return params.has('debug') || params.has('fps');
  }
  
  createDebugDisplay() {
    this.debugElement = document.createElement('div');
    this.debugElement.id = 'debug-display';
    this.debugElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      border: 1px solid #00ff00;
      z-index: 10000;
      min-width: 150px;
    `;
    document.body.appendChild(this.debugElement);
  }
  
  startFrame() {
    this.frameStartTime = performance.now();
  }
  
  endFrame() {
    const currentTime = performance.now();
    const frameTime = currentTime - this.frameStartTime;
    
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxFrameSamples) {
      this.frameTimes.shift();
    }
    
    this.frameCount++;
    
    // Update FPS every 500ms
    if (currentTime - this.lastFpsUpdate > 500) {
      const elapsed = currentTime - this.lastTime;
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      
      if (this.showDebug) {
        this.updateDebugDisplay();
      }
      
      this.frameCount = 0;
      this.lastTime = currentTime;
      this.lastFpsUpdate = currentTime;
    }
  }
  
  updateDebugDisplay() {
    if (!this.debugElement) return;
    
    const avgFrameTime = this.getAverageFrameTime();
    const maxFrameTime = Math.max(...this.frameTimes);
    const minFrameTime = Math.min(...this.frameTimes);
    
    this.debugElement.innerHTML = `
      <div>FPS: ${this.fps}</div>
      <div>Frame Time:</div>
      <div>&nbsp;&nbsp;Avg: ${avgFrameTime.toFixed(2)}ms</div>
      <div>&nbsp;&nbsp;Min: ${minFrameTime.toFixed(2)}ms</div>
      <div>&nbsp;&nbsp;Max: ${maxFrameTime.toFixed(2)}ms</div>
      <div>Particles: ${this.getParticleCount()}</div>
      <div>Entities: ${this.getEntityCount()}</div>
    `;
  }
  
  getAverageFrameTime() {
    if (this.frameTimes.length === 0) return 0;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }
  
  getParticleCount() {
    if (window.Game && window.Game.particleSystem) {
      return window.Game.particleSystem.particles.length;
    }
    return 0;
  }
  
  getEntityCount() {
    if (window.Game && window.Game.entityManager) {
      return window.Game.entityManager.getAllEntities().length;
    }
    return 0;
  }
  
  // Performance profiling methods
  startProfile(name) {
    if (!this.showDebug) return;
    performance.mark(`${name}-start`);
  }
  
  endProfile(name) {
    if (!this.showDebug) return;
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }
  
  getProfiles() {
    if (!this.showDebug) return {};
    
    const measures = performance.getEntriesByType('measure');
    const profiles = {};
    
    measures.forEach(measure => {
      if (!profiles[measure.name]) {
        profiles[measure.name] = [];
      }
      profiles[measure.name].push(measure.duration);
    });
    
    return profiles;
  }
  
  clearProfiles() {
    performance.clearMarks();
    performance.clearMeasures();
  }
}