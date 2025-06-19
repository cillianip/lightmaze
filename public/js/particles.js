'use strict';

import { Vector2 } from './engine.js';

export class Particle {
  constructor(x, y, velocity, color, size, lifetime) {
    this.position = new Vector2(x, y);
    this.velocity = velocity;
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.opacity = 1;
  }
  
  update(deltaTime) {
    // Update position
    this.position = this.position.add(this.velocity.multiply(deltaTime));
    
    // Apply gravity or other forces
    this.velocity.y += 100 * deltaTime; // Gravity
    
    // Update lifetime
    this.lifetime -= deltaTime;
    
    // Fade out
    this.opacity = Math.max(0, this.lifetime / this.maxLifetime);
    
    // Shrink over time
    this.size *= 0.98;
  }
  
  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.size * 2;
    
    // Draw particle as a circle
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  isAlive() {
    return this.lifetime > 0 && this.size > 0.1;
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.emitters = new Map();
  }
  
  update(deltaTime) {
    // Update all particles
    this.particles = this.particles.filter(particle => {
      particle.update(deltaTime);
      return particle.isAlive();
    });
    
    // Update emitters
    this.emitters.forEach((emitter, id) => {
      if (emitter.active) {
        emitter.emit(deltaTime);
        this.particles.push(...emitter.newParticles);
        emitter.newParticles = [];
      }
      
      // Remove finished emitters
      if (emitter.duration !== -1) {
        emitter.duration -= deltaTime;
        if (emitter.duration <= 0) {
          this.emitters.delete(id);
        }
      }
    });
  }
  
  render(ctx) {
    this.particles.forEach(particle => particle.render(ctx));
  }
  
  createCrystalActivation(x, y) {
    const colors = ['#00ff00', '#00ffff', '#ffff00', '#ffffff'];
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 100 + Math.random() * 100;
      const velocity = new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 50
      );
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 2 + Math.random() * 3;
      const lifetime = 0.5 + Math.random() * 0.5;
      
      this.particles.push(new Particle(x, y, velocity, color, size, lifetime));
    }
  }
  
  createVictoryEffect(canvasWidth, canvasHeight) {
    const colors = ['#00ff00', '#00ffff', '#ff00ff', '#ffff00', '#ffffff'];
    const particleCount = 100;
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvasWidth;
      const y = canvasHeight + 20;
      const velocity = new Vector2(
        (Math.random() - 0.5) * 200,
        -200 - Math.random() * 300
      );
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 4;
      const lifetime = 2 + Math.random() * 1;
      
      this.particles.push(new Particle(x, y, velocity, color, size, lifetime));
    }
  }
  
  createBeamTrail(x, y, direction) {
    const velocity = direction.multiply(-20).add(
      new Vector2((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10)
    );
    
    const particle = new Particle(
      x + (Math.random() - 0.5) * 4,
      y + (Math.random() - 0.5) * 4,
      velocity,
      '#00ffff',
      1 + Math.random() * 2,
      0.3
    );
    
    this.particles.push(particle);
  }
  
  createMirrorRotation(x, y) {
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 50;
      const velocity = new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
      
      const particle = new Particle(
        x, y, velocity,
        '#ff00ff',
        2,
        0.4
      );
      
      this.particles.push(particle);
    }
  }
  
  addEmitter(id, emitter) {
    this.emitters.set(id, emitter);
  }
  
  removeEmitter(id) {
    this.emitters.delete(id);
  }
  
  clear() {
    this.particles = [];
    this.emitters.clear();
  }
}

export class ParticleEmitter {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.active = true;
    this.duration = config.duration || -1; // -1 for infinite
    this.rate = config.rate || 10; // Particles per second
    this.accumulator = 0;
    this.newParticles = [];
    
    // Particle properties
    this.color = config.color || '#00ffff';
    this.sizeRange = config.sizeRange || [1, 3];
    this.lifetimeRange = config.lifetimeRange || [0.5, 1];
    this.velocityRange = config.velocityRange || { min: -50, max: 50 };
    this.spread = config.spread || Math.PI * 2; // Full circle by default
    this.direction = config.direction || 0;
  }
  
  emit(deltaTime) {
    this.accumulator += deltaTime;
    const particlesToEmit = Math.floor(this.accumulator * this.rate);
    this.accumulator -= particlesToEmit / this.rate;
    
    for (let i = 0; i < particlesToEmit; i++) {
      const angle = this.direction + (Math.random() - 0.5) * this.spread;
      const speed = this.velocityRange.min + 
        Math.random() * (this.velocityRange.max - this.velocityRange.min);
      
      const velocity = new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
      
      const size = this.sizeRange[0] + 
        Math.random() * (this.sizeRange[1] - this.sizeRange[0]);
      
      const lifetime = this.lifetimeRange[0] + 
        Math.random() * (this.lifetimeRange[1] - this.lifetimeRange[0]);
      
      this.newParticles.push(
        new Particle(this.x, this.y, velocity, this.color, size, lifetime)
      );
    }
  }
  
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  stop() {
    this.active = false;
  }
  
  start() {
    this.active = true;
  }
}