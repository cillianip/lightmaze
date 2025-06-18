'use strict';

import { Vector2 } from './engine.js';

export class Entity {
  constructor(gridX, gridY, gridSize = 40) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.gridSize = gridSize;
    this.x = gridX * gridSize + gridSize / 2;
    this.y = gridY * gridSize + gridSize / 2;
    this.type = 'entity';
  }
  
  draw(ctx) {}
  
  checkRayIntersection(pos, dir) {
    return null;
  }
}

export class LightSource extends Entity {
  constructor(gridX, gridY, angle = 0) {
    super(gridX, gridY);
    this.type = 'light';
    this.angle = angle;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();
    
    ctx.restore();
  }
}

export class Mirror extends Entity {
  constructor(gridX, gridY, angle = Math.PI / 4) {
    super(gridX, gridY);
    this.type = 'mirror';
    this.angle = angle;
    this.isDragging = false;
    this.isHovered = false;
    this.dragOffset = { x: 0, y: 0 };
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Draw hover/drag indicator
    if (this.isDragging || this.isHovered) {
      ctx.fillStyle = this.isDragging ? 'rgba(255, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = this.isDragging ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.gridSize * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.rotate(this.angle);
    
    // Mirror surface
    ctx.strokeStyle = this.isDragging ? '#ffff00' : '#ffffff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowBlur = this.isDragging ? 20 : 10;
    ctx.shadowColor = this.isDragging ? '#ffff00' : '#ffffff';
    
    ctx.beginPath();
    ctx.moveTo(-this.gridSize * 0.35, 0);
    ctx.lineTo(this.gridSize * 0.35, 0);
    ctx.stroke();
    
    // Reflective surface effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(-this.gridSize * 0.35, -2, this.gridSize * 0.7, 4);
    
    // Direction indicator
    ctx.fillStyle = this.isDragging ? '#ffff00' : 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(4, -4);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
  
  checkRayIntersection(pos, dir) {
    // Get mirror direction and normal vectors
    const mirrorDir = new Vector2(Math.cos(this.angle), Math.sin(this.angle));
    const mirrorNormal = new Vector2(-mirrorDir.y, mirrorDir.x);
    
    // Ray-line intersection
    const toMirror = new Vector2(this.x - pos.x, this.y - pos.y);
    const denominator = dir.dot(mirrorNormal);
    
    // Check if ray is parallel to mirror
    if (Math.abs(denominator) < 0.001) return null;
    
    // Calculate intersection parameter
    const t = toMirror.dot(mirrorNormal) / denominator;
    
    // Check if intersection is behind the ray origin
    if (t < 0) return null;
    
    // Calculate intersection point
    const intersectionPoint = pos.add(dir.multiply(t));
    
    // Check if intersection is within mirror bounds
    const toIntersection = new Vector2(intersectionPoint.x - this.x, intersectionPoint.y - this.y);
    const alongMirror = toIntersection.dot(mirrorDir);
    
    if (Math.abs(alongMirror) <= this.gridSize * 0.35) {
      // Make sure normal points towards the incoming ray
      const normalToUse = denominator > 0 ? mirrorNormal : mirrorNormal.multiply(-1);
      
      return {
        point: intersectionPoint,
        normal: normalToUse
      };
    }
    
    return null;
  }
  
  rotate(clockwise = true) {
    this.angle += clockwise ? Math.PI / 2 : -Math.PI / 2;
    this.angle = this.angle % (Math.PI * 2);
  }
  
  startDrag(mouseX, mouseY) {
    this.isDragging = true;
    this.dragOffset.x = mouseX - this.x;
    this.dragOffset.y = mouseY - this.y;
  }
  
  updateDrag(mouseX, mouseY) {
    if (!this.isDragging) return;
    
    const newGridX = Math.floor((mouseX - this.dragOffset.x) / this.gridSize);
    const newGridY = Math.floor((mouseY - this.dragOffset.y) / this.gridSize);
    
    if (newGridX >= 0 && newGridX < 20 && newGridY >= 0 && newGridY < 15) {
      this.gridX = newGridX;
      this.gridY = newGridY;
      this.x = this.gridX * this.gridSize + this.gridSize / 2;
      this.y = this.gridY * this.gridSize + this.gridSize / 2;
    }
  }
  
  endDrag() {
    this.isDragging = false;
  }
}

export class Crystal extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY);
    this.type = 'crystal';
    this.isActive = false;
    this.pulsePhase = 0;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    const pulse = Math.sin(this.pulsePhase) * 0.1 + 0.9;
    ctx.scale(pulse, pulse);
    
    ctx.strokeStyle = this.isActive ? '#00ff00' : '#ff00ff';
    ctx.fillStyle = this.isActive ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = this.isActive ? 30 : 10;
    ctx.shadowColor = this.isActive ? '#00ff00' : '#ff00ff';
    
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
    
    if (this.isActive) {
      this.pulsePhase += 0.1;
    }
  }
  
  checkRayIntersection(pos, dir) {
    const dist = Math.sqrt(
      Math.pow(pos.x - this.x, 2) + 
      Math.pow(pos.y - this.y, 2)
    );
    
    if (dist < 15) {
      return {
        point: new Vector2(this.x, this.y),
        normal: new Vector2(0, 0)
      };
    }
    
    return null;
  }
  
  activate() {
    this.isActive = true;
  }
  
  deactivate() {
    this.isActive = false;
    this.pulsePhase = 0;
  }
}

export class Wall extends Entity {
  constructor(gridX, gridY, width = 1, height = 1) {
    super(gridX, gridY);
    this.type = 'wall';
    this.width = width;
    this.height = height;
  }
  
  draw(ctx) {
    ctx.fillStyle = '#444444';
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    
    const x = this.gridX * this.gridSize;
    const y = this.gridY * this.gridSize;
    const w = this.width * this.gridSize;
    const h = this.height * this.gridSize;
    
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }
  
  checkRayIntersection(pos, dir) {
    const x = this.gridX * this.gridSize;
    const y = this.gridY * this.gridSize;
    const w = this.width * this.gridSize;
    const h = this.height * this.gridSize;
    
    // Check intersection with all four edges of the wall
    let closestT = Infinity;
    let closestPoint = null;
    let closestNormal = null;
    
    // Left edge
    if (dir.x > 0) {
      const t = (x - pos.x) / dir.x;
      if (t > 0 && t < closestT) {
        const yAtX = pos.y + t * dir.y;
        if (yAtX >= y && yAtX <= y + h) {
          closestT = t;
          closestPoint = new Vector2(x, yAtX);
          closestNormal = new Vector2(-1, 0);
        }
      }
    }
    
    // Right edge
    if (dir.x < 0) {
      const t = (x + w - pos.x) / dir.x;
      if (t > 0 && t < closestT) {
        const yAtX = pos.y + t * dir.y;
        if (yAtX >= y && yAtX <= y + h) {
          closestT = t;
          closestPoint = new Vector2(x + w, yAtX);
          closestNormal = new Vector2(1, 0);
        }
      }
    }
    
    // Top edge
    if (dir.y > 0) {
      const t = (y - pos.y) / dir.y;
      if (t > 0 && t < closestT) {
        const xAtY = pos.x + t * dir.x;
        if (xAtY >= x && xAtY <= x + w) {
          closestT = t;
          closestPoint = new Vector2(xAtY, y);
          closestNormal = new Vector2(0, -1);
        }
      }
    }
    
    // Bottom edge
    if (dir.y < 0) {
      const t = (y + h - pos.y) / dir.y;
      if (t > 0 && t < closestT) {
        const xAtY = pos.x + t * dir.x;
        if (xAtY >= x && xAtY <= x + w) {
          closestT = t;
          closestPoint = new Vector2(xAtY, y + h);
          closestNormal = new Vector2(0, 1);
        }
      }
    }
    
    if (closestPoint) {
      return {
        point: closestPoint,
        normal: closestNormal
      };
    }
    
    return null;
  }
}