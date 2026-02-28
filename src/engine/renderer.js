export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.width = ctx.canvas.width;
    this.height = ctx.canvas.height;
  }

  clear(color = '#0a0a0f') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawRect(x, y, w, h, color, alpha = 1) {
    const c = this.ctx;
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
    c.restore();
  }

  drawRoundRect(x, y, w, h, r, fillColor, strokeColor, strokeWidth = 1) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
    if (fillColor) { c.fillStyle = fillColor; c.fill(); }
    if (strokeColor) { c.strokeStyle = strokeColor; c.lineWidth = strokeWidth; c.stroke(); }
  }

  drawText(text, x, y, color = '#ffffff', size = 16, align = 'left', font = 'monospace', bold = false) {
    const c = this.ctx;
    c.save();
    c.font = `${bold ? 'bold ' : ''}${size}px ${font}`;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = 'top';
    c.fillText(text, x, y);
    c.restore();
  }

  drawTextCentered(text, x, y, color = '#ffffff', size = 16, font = 'monospace', bold = false) {
    this.drawText(text, x, y, color, size, 'center', font, bold);
  }

  measureText(text, size = 16, font = 'monospace') {
    this.ctx.font = `${size}px ${font}`;
    return this.ctx.measureText(text).width;
  }

  drawBar(x, y, w, h, current, max, fgColor, bgColor = '#333333', label = '') {
    this.drawRect(x, y, w, h, bgColor);
    const pct = Math.max(0, Math.min(1, current / Math.max(1, max)));
    this.drawRect(x, y, Math.round(w * pct), h, fgColor);
    this.drawRoundRect(x, y, w, h, 2, null, '#555555', 1);
    if (label) {
      this.drawText(label, x + w/2, y + h/2 - 6, '#ffffff', 11, 'center');
    }
  }

  drawBorderBox(x, y, w, h, title = '') {
    this.drawRoundRect(x, y, w, h, 6, '#1a1a2e', '#4444aa', 2);
    if (title) {
      const tw = this.measureText(title, 14) + 16;
      this.drawRect(x + 10, y - 8, tw, 16, '#1a1a2e');
      this.drawText(title, x + 18, y - 8, '#aaaaff', 14, 'left', 'monospace', true);
    }
  }

  drawButton(x, y, w, h, text, hovered = false, pressed = false, disabled = false) {
    const bg = disabled ? '#333344' : pressed ? '#6666cc' : hovered ? '#4444aa' : '#2a2a5a';
    const stroke = disabled ? '#444466' : hovered ? '#8888ff' : '#5555aa';
    const textColor = disabled ? '#888899' : '#ffffff';
    this.drawRoundRect(x, y, w, h, 5, bg, stroke, 2);
    this.drawTextCentered(text, x + w/2, y + h/2 - 8, textColor, 15, 'monospace', true);
  }

  drawSprite(type, x, y, w, h, color, animFrame = 0) {
    const c = this.ctx;
    c.save();
    const bob = Math.sin(animFrame * 2) * 2;
    switch(type) {
      case 'warrior':
        // Body
        c.fillStyle = color;
        c.fillRect(x + w*0.3, y + h*0.2 + bob, w*0.4, h*0.5);
        // Helm
        c.fillStyle = '#aaaacc';
        c.fillRect(x + w*0.3, y + h*0.05 + bob, w*0.4, h*0.2);
        // Shield
        c.fillStyle = '#8888bb';
        c.fillRect(x + w*0.1, y + h*0.25 + bob, w*0.18, h*0.35);
        // Sword
        c.fillStyle = '#ccccdd';
        c.fillRect(x + w*0.72, y + h*0.15 + bob, w*0.08, h*0.45);
        break;
      case 'mage':
        // Robe
        c.fillStyle = color;
        c.fillRect(x + w*0.25, y + h*0.2 + bob, w*0.5, h*0.55);
        // Hat
        c.fillStyle = '#334488';
        c.beginPath();
        c.moveTo(x + w*0.5, y + bob);
        c.lineTo(x + w*0.2, y + h*0.22 + bob);
        c.lineTo(x + w*0.8, y + h*0.22 + bob);
        c.closePath(); c.fill();
        // Staff (glow)
        c.fillStyle = '#aabbff';
        c.fillRect(x + w*0.72, y + h*0.05 + bob, w*0.06, h*0.65);
        c.fillStyle = '#ffddff';
        c.beginPath();
        c.arc(x + w*0.75, y + h*0.05 + bob, w*0.08, 0, Math.PI*2);
        c.fill();
        break;
      case 'ranger':
        c.fillStyle = color;
        c.fillRect(x + w*0.3, y + h*0.2 + bob, w*0.4, h*0.5);
        c.fillStyle = '#774433';
        c.fillRect(x + w*0.3, y + h*0.05 + bob, w*0.4, h*0.18);
        // Bow
        c.strokeStyle = '#886633';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(x + w*0.8, y + h*0.4 + bob, h*0.25, -Math.PI*0.6, Math.PI*0.6);
        c.stroke();
        break;
      default:
        c.fillStyle = color;
        c.fillRect(x + w*0.25, y + h*0.1 + bob, w*0.5, h*0.65);
        // Head
        c.fillStyle = '#ffcc99';
        c.beginPath();
        c.arc(x + w*0.5, y + h*0.12 + bob, w*0.18, 0, Math.PI*2);
        c.fill();
    }
    c.restore();
  }

  drawEnemySprite(enemy, x, y, w, h, animFrame = 0) {
    const c = this.ctx;
    const color = enemy.color || '#ff4444';
    const bob = Math.sin(animFrame * 1.5) * 3;
    c.save();
    c.fillStyle = color;
    // Draw based on enemy type
    if (enemy.id && enemy.id.includes('slime')) {
      c.beginPath();
      c.ellipse(x + w*0.5, y + h*0.65 + bob, w*0.45, h*0.4, 0, 0, Math.PI*2);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)';
      c.beginPath(); c.arc(x + w*0.38, y + h*0.52 + bob, w*0.06, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x + w*0.6, y + h*0.52 + bob, w*0.06, 0, Math.PI*2); c.fill();
    } else if (enemy.id && (enemy.id.includes('dragon') || enemy.id.includes('wyvern'))) {
      // Dragon body
      c.fillRect(x + w*0.15, y + h*0.35 + bob, w*0.7, h*0.35);
      // Head
      c.fillRect(x + w*0.55, y + h*0.2 + bob, w*0.35, h*0.25);
      // Wings
      c.fillStyle = color + '99';
      c.beginPath();
      c.moveTo(x + w*0.3, y + h*0.35 + bob);
      c.lineTo(x, y + h*0.15 + bob);
      c.lineTo(x + w*0.3, y + h*0.5 + bob);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(x + w*0.7, y + h*0.35 + bob);
      c.lineTo(x + w, y + h*0.15 + bob);
      c.lineTo(x + w*0.7, y + h*0.5 + bob);
      c.closePath(); c.fill();
      // Eye
      c.fillStyle = '#ffff00';
      c.beginPath(); c.arc(x + w*0.82, y + h*0.27 + bob, w*0.05, 0, Math.PI*2); c.fill();
    } else if (enemy.id && enemy.id.includes('golem')) {
      c.fillRect(x + w*0.2, y + h*0.1 + bob, w*0.6, h*0.8);
      c.fillStyle = '#aaaaaa';
      c.fillRect(x + w*0.3, y + h*0.15 + bob, w*0.4, h*0.3);
      c.fillStyle = '#ff4444';
      c.beginPath(); c.arc(x + w*0.42, y + h*0.28 + bob, w*0.06, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x + w*0.58, y + h*0.28 + bob, w*0.06, 0, Math.PI*2); c.fill();
    } else if (enemy.id && enemy.id.includes('skeleton')) {
      // Skeleton
      c.strokeStyle = color; c.lineWidth = 3;
      c.beginPath(); c.arc(x+w*0.5, y+h*0.15+bob, w*0.15, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.moveTo(x+w*0.5, y+h*0.3+bob); c.lineTo(x+w*0.5, y+h*0.65+bob); c.stroke();
      c.beginPath(); c.moveTo(x+w*0.25, y+h*0.35+bob); c.lineTo(x+w*0.75, y+h*0.35+bob); c.stroke();
      c.beginPath(); c.moveTo(x+w*0.5, y+h*0.65+bob); c.lineTo(x+w*0.3, y+h*0.9+bob); c.stroke();
      c.beginPath(); c.moveTo(x+w*0.5, y+h*0.65+bob); c.lineTo(x+w*0.7, y+h*0.9+bob); c.stroke();
    } else {
      // Generic enemy
      c.fillRect(x + w*0.2, y + h*0.2 + bob, w*0.6, h*0.6);
      c.fillStyle = '#ffcc99';
      c.beginPath(); c.arc(x + w*0.5, y + h*0.22 + bob, w*0.2, 0, Math.PI*2); c.fill();
      c.fillStyle = '#ff2222';
      c.beginPath(); c.arc(x + w*0.4, y + h*0.18 + bob, w*0.05, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x + w*0.6, y + h*0.18 + bob, w*0.05, 0, Math.PI*2); c.fill();
    }
    c.restore();
  }

  drawTile(tileType, x, y, size, visibility) {
    const c = this.ctx;
    const TILE_COLORS = {
      0: '#1a1a2e', // wall
      1: '#2a2a3e', // floor
      2: '#3a2a1a', // door
      3: '#ffaa00', // stairs down
      4: '#00aaff', // stairs up
      5: '#ffdd44', // treasure chest
      6: '#ff4422', // trap
      7: '#44ffaa', // healing fountain
      8: '#cc44ff', // crafting station
      9: '#44aaff', // shop
    };
    if (visibility === 0) {
      c.fillStyle = '#000000';
      c.fillRect(x, y, size, size);
      return;
    }
    const baseColor = TILE_COLORS[tileType] || '#2a2a3e';
    const alpha = visibility === 1 ? 0.5 : 1.0;
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = baseColor;
    c.fillRect(x, y, size, size);
    if (tileType === 5 && visibility === 2) {
      // Treasure chest icon
      c.fillStyle = '#ffaa00';
      c.fillRect(x+2, y+4, size-4, size-8);
      c.fillStyle = '#aa6600';
      c.fillRect(x+2, y+4, size-4, 4);
    } else if (tileType === 3) {
      c.fillStyle = '#ffdd00';
      c.beginPath();
      c.moveTo(x+size*0.5, y+size*0.15);
      c.lineTo(x+size*0.85, y+size*0.7);
      c.lineTo(x+size*0.15, y+size*0.7);
      c.closePath(); c.fill();
    } else if (tileType === 7) {
      c.fillStyle = '#00ffcc';
      c.beginPath();
      c.arc(x+size/2, y+size/2, size*0.3, 0, Math.PI*2);
      c.fill();
    }
    c.restore();
  }

  drawDamageNumber(text, x, y, color = '#ffff00', size = 18) {
    const c = this.ctx;
    c.save();
    c.font = `bold ${size}px monospace`;
    c.fillStyle = '#000000';
    c.fillText(text, x+1, y+1);
    c.fillStyle = color;
    c.fillText(text, x, y);
    c.restore();
  }

  // Gradient background
  drawGradientBG(x, y, w, h, color1, color2, vertical = true) {
    const c = this.ctx;
    const grad = vertical
      ? c.createLinearGradient(x, y, x, y+h)
      : c.createLinearGradient(x, y, x+w, y);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    c.fillStyle = grad;
    c.fillRect(x, y, w, h);
  }
}
