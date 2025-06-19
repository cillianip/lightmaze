'use strict';

export class TransitionManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.active = false;
    this.type = 'fade';
    this.progress = 0;
    this.duration = 500; // milliseconds
    this.callback = null;
  }
  
  fadeOut(callback, duration = 500) {
    this.start('fadeOut', callback, duration);
  }
  
  fadeIn(callback, duration = 500) {
    this.start('fadeIn', callback, duration);
  }
  
  slideLeft(callback, duration = 500) {
    this.start('slideLeft', callback, duration);
  }
  
  slideRight(callback, duration = 500) {
    this.start('slideRight', callback, duration);
  }
  
  circleWipe(callback, duration = 500) {
    this.start('circleWipe', callback, duration);
  }
  
  start(type, callback, duration) {
    this.active = true;
    this.type = type;
    this.progress = 0;
    this.duration = duration;
    this.callback = callback;
    this.startTime = performance.now();
  }
  
  update(currentTime) {
    if (!this.active) return false;
    
    const elapsed = currentTime - this.startTime;
    this.progress = Math.min(elapsed / this.duration, 1);
    
    if (this.progress >= 0.5 && this.callback) {
      // Call callback at halfway point
      this.callback();
      this.callback = null;
    }
    
    if (this.progress >= 1) {
      this.active = false;
      return false;
    }
    
    return true;
  }
  
  render() {
    if (!this.active) return;
    
    this.ctx.save();
    
    switch (this.type) {
      case 'fadeOut':
        this.renderFadeOut();
        break;
      case 'fadeIn':
        this.renderFadeIn();
        break;
      case 'slideLeft':
        this.renderSlideLeft();
        break;
      case 'slideRight':
        this.renderSlideRight();
        break;
      case 'circleWipe':
        this.renderCircleWipe();
        break;
    }
    
    this.ctx.restore();
  }
  
  renderFadeOut() {
    const alpha = this.easeInOut(this.progress);
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  renderFadeIn() {
    const alpha = 1 - this.easeInOut(this.progress);
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  renderSlideLeft() {
    const x = this.canvas.width * (1 - this.easeInOut(this.progress));
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(x, 0, this.canvas.width, this.canvas.height);
    
    // Add glow edge
    const gradient = this.ctx.createLinearGradient(x - 20, 0, x, 0);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0.5)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - 20, 0, 20, this.canvas.height);
  }
  
  renderSlideRight() {
    const x = -this.canvas.width * (1 - this.easeInOut(this.progress));
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(x, 0, this.canvas.width, this.canvas.height);
    
    // Add glow edge
    const gradient = this.ctx.createLinearGradient(x + this.canvas.width, 0, x + this.canvas.width + 20, 0);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x + this.canvas.width, 0, 20, this.canvas.height);
  }
  
  renderCircleWipe() {
    const maxRadius = Math.sqrt(
      Math.pow(this.canvas.width / 2, 2) + 
      Math.pow(this.canvas.height / 2, 2)
    );
    
    let radius;
    if (this.progress <= 0.5) {
      // First half: circle closes
      radius = maxRadius * (1 - this.progress * 2);
    } else {
      // Second half: circle opens
      radius = maxRadius * ((this.progress - 0.5) * 2);
    }
    
    // Fill entire canvas with black
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Cut out circle
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.beginPath();
    this.ctx.arc(
      this.canvas.width / 2,
      this.canvas.height / 2,
      radius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    
    // Add glow to circle edge
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.strokeStyle = '#00ffff';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 20;
    this.ctx.stroke();
  }
  
  easeInOut(t) {
    return t < 0.5 
      ? 2 * t * t 
      : -1 + (4 - 2 * t) * t;
  }
  
  isActive() {
    return this.active;
  }
}