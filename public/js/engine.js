'use strict';

export class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  
  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }
  
  subtract(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }
  
  multiply(scalar) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }
  
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }
  
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  
  normalize() {
    const len = this.length();
    if (len === 0) return new Vector2(0, 0);
    return new Vector2(this.x / len, this.y / len);
  }
  
  reflect(normal) {
    return this.subtract(normal.multiply(2 * this.dot(normal)));
  }
  
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }
}

export class Ray {
  constructor(origin, direction, depth = 0) {
    this.origin = origin;
    this.direction = direction.normalize();
    this.depth = depth;
    this.points = [origin];
    this.active = true;
  }
}

export class RayCaster {
  constructor(gridSize = 40) {
    this.gridSize = gridSize;
    this.maxDepth = 10;
    this.stepSize = 2;
    this.rays = [];
  }
  
  cast(lightSource, entities) {
    this.rays = [];
    const initialRay = new Ray(
      new Vector2(lightSource.x, lightSource.y),
      new Vector2(Math.cos(lightSource.angle), Math.sin(lightSource.angle))
    );
    
    this.traceRay(initialRay, entities);
    return this.rays;
  }
  
  traceRay(ray, entities) {
    if (ray.depth >= this.maxDepth) return;
    
    this.rays.push(ray);
    let currentPos = ray.origin;
    let maxSteps = 1000; // Prevent infinite loops
    
    while (ray.active && maxSteps-- > 0) {
      // Move ray forward
      currentPos = currentPos.add(ray.direction.multiply(this.stepSize));
      
      // Check if out of bounds
      if (this.isOutOfBounds(currentPos)) {
        ray.points.push(currentPos);
        ray.active = false;
        break;
      }
      
      // Check all entities for intersection
      let closestHit = null;
      let closestDist = Infinity;
      
      for (const entity of entities) {
        if (entity.type === 'light') continue; // Skip light source
        
        const hit = entity.checkRayIntersection(currentPos, ray.direction);
        if (hit) {
          const dist = new Vector2(hit.point.x - currentPos.x, hit.point.y - currentPos.y).length();
          if (dist < closestDist && dist < this.stepSize * 2) {
            closestDist = dist;
            closestHit = { ...hit, entity, type: entity.type };
          }
        }
      }
      
      if (closestHit) {
        ray.points.push(closestHit.point);
        
        if (closestHit.type === 'wall') {
          ray.active = false;
        } else if (closestHit.type === 'mirror') {
          ray.active = false;
          const reflected = ray.direction.reflect(closestHit.normal);
          const newOrigin = closestHit.point.add(reflected.multiply(1)); // Small offset to prevent self-collision
          const newRay = new Ray(newOrigin, reflected, ray.depth + 1);
          this.traceRay(newRay, entities);
        } else if (closestHit.type === 'crystal') {
          closestHit.entity.activate();
          // Crystals don't stop the ray - it passes through
          // Move past the crystal to avoid re-detection
          currentPos = closestHit.point.add(ray.direction.multiply(20)); // Move 20 pixels past crystal
          // Add an intermediate point to show the ray continuing
          ray.points.push(currentPos);
          // Continue tracing
        }
      }
    }
  }
  
  
  isOutOfBounds(pos) {
    return pos.x < 0 || pos.x > 800 || pos.y < 0 || pos.y > 600;
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
  }
  
  clear() {
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  drawGrid(gridSize) {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x <= this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }
  
  drawRays(rays) {
    rays.forEach(ray => {
      if (ray.points.length < 2) return;
      
      // Draw multiple layers for smooth glow effect
      const layers = [
        { width: 8, color: 'rgba(0, 255, 255, 0.2)', blur: 20 },
        { width: 5, color: 'rgba(0, 255, 255, 0.4)', blur: 15 },
        { width: 3, color: '#00ffff', blur: 10 },
        { width: 1, color: 'rgba(255, 255, 255, 0.8)', blur: 0 }
      ];
      
      layers.forEach(layer => {
        this.ctx.save();
        this.ctx.strokeStyle = layer.color;
        this.ctx.lineWidth = layer.width;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = layer.blur;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(ray.points[0].x, ray.points[0].y);
        
        for (let i = 1; i < ray.points.length; i++) {
          this.ctx.lineTo(ray.points[i].x, ray.points[i].y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
      });
      
      // Draw glowing points at reflection points
      ray.points.forEach((point, i) => {
        if (i > 0 && i < ray.points.length - 1) {
          this.ctx.save();
          this.ctx.fillStyle = '#00ffff';
          this.ctx.shadowColor = '#00ffff';
          this.ctx.shadowBlur = 15;
          this.ctx.beginPath();
          this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }
      });
    });
  }
  
  drawEntity(entity) {
    entity.draw(this.ctx);
  }
  
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }
}