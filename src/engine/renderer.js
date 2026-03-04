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
    const mx = x + w * 0.5; // center x

    // Helper: fill pixel-art rect
    const pr = (rx, ry, rw, rh, col) => { c.fillStyle = col; c.fillRect(x + w * rx, y + h * ry + bob, w * rw, h * rh); };

    // SNES FF-style sprites: clear body segments with outlines
    const skin = '#f5c58a';
    const skinDark = '#d4a060';
    const shadow = 'rgba(0,0,0,0.5)';

    switch(type) {
      case 'warrior': {
        const helm = '#c0c8e0', helmDark = '#8890b8', armor = color || '#5566aa', armorDark = '#3344aa';
        // Drop shadow
        pr(0.2, 0.92, 0.6, 0.06, shadow);
        // Legs
        pr(0.28, 0.68, 0.18, 0.28, armor); pr(0.54, 0.68, 0.18, 0.28, armor);
        pr(0.28, 0.88, 0.18, 0.08, '#3a3a4a'); pr(0.54, 0.88, 0.18, 0.08, '#3a3a4a');
        // Body / chestplate
        pr(0.22, 0.38, 0.56, 0.32, armor);
        pr(0.24, 0.40, 0.52, 0.28, helmDark);
        // Belt
        pr(0.22, 0.66, 0.56, 0.04, '#aa8833');
        // Shield (left arm)
        pr(0.02, 0.30, 0.18, 0.38, helmDark);
        pr(0.04, 0.32, 0.14, 0.34, '#aab0d0');
        c.fillStyle = '#ffcc00'; c.fillRect(x + w*0.06, y + h*0.46 + bob, w*0.08, w*0.08);
        // Sword (right)
        pr(0.80, 0.10, 0.07, 0.55, '#d0d0e8');
        pr(0.72, 0.27, 0.22, 0.04, '#aa9966');
        pr(0.82, 0.08, 0.06, 0.06, '#ddcc88');
        // Arms
        pr(0.18, 0.40, 0.10, 0.26, helmDark); pr(0.72, 0.40, 0.10, 0.26, helmDark);
        // Neck
        pr(0.42, 0.28, 0.16, 0.12, skin);
        // Head/Helm
        pr(0.22, 0.04, 0.56, 0.28, helm);
        pr(0.24, 0.06, 0.52, 0.22, helmDark);
        // Visor slit
        pr(0.30, 0.14, 0.40, 0.06, '#222233');
        // Helm crest
        pr(0.44, 0.00, 0.12, 0.06, '#cc4422');
        break;
      }
      case 'mage': {
        const robe = color || '#442288', robeDark = '#220055', hat = '#1a1a44';
        pr(0.2, 0.92, 0.6, 0.06, shadow);
        // Robe bottom flare
        pr(0.15, 0.62, 0.70, 0.34, robeDark);
        pr(0.20, 0.64, 0.60, 0.30, robe);
        // Body robe
        pr(0.25, 0.30, 0.50, 0.36, robe);
        // Robe collar/trim
        pr(0.25, 0.30, 0.50, 0.04, '#aa88ff');
        pr(0.25, 0.60, 0.50, 0.04, '#aa88ff');
        // Arms
        pr(0.10, 0.32, 0.15, 0.28, robe); pr(0.75, 0.32, 0.15, 0.28, robe);
        // Staff
        pr(0.78, 0.06, 0.06, 0.64, '#8855aa');
        c.fillStyle = '#dd88ff';
        c.beginPath(); c.arc(x + w*0.81, y + h*0.06 + bob, w*0.10, 0, Math.PI*2); c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath(); c.arc(x + w*0.81, y + h*0.04 + bob, w*0.04, 0, Math.PI*2); c.fill();
        // Neck/face
        pr(0.40, 0.20, 0.20, 0.12, skin);
        // Head
        pr(0.30, 0.08, 0.40, 0.18, skin);
        pr(0.32, 0.10, 0.36, 0.14, skinDark);
        pr(0.30, 0.10, 0.40, 0.10, skin);
        // Eyes (glowing)
        c.fillStyle = '#aa44ff';
        c.fillRect(x + w*0.35, y + h*0.13 + bob, w*0.08, w*0.06);
        c.fillRect(x + w*0.52, y + h*0.13 + bob, w*0.08, w*0.06);
        // Wizard hat
        c.beginPath();
        c.moveTo(x + w*0.50, y - h*0.02 + bob);
        c.lineTo(x + w*0.20, y + h*0.09 + bob);
        c.lineTo(x + w*0.80, y + h*0.09 + bob);
        c.closePath();
        c.fillStyle = hat; c.fill();
        c.strokeStyle = '#4444aa'; c.lineWidth = 1; c.stroke();
        // Hat brim
        pr(0.14, 0.07, 0.72, 0.04, '#222255');
        // Hat star
        c.fillStyle = '#ffee44';
        c.fillRect(x + w*0.46, y + h*0.02 + bob, w*0.04, w*0.04);
        break;
      }
      case 'ranger': {
        const vest = color || '#2d5a1a', vestDark = '#1a3a0a', leather = '#7a5a2a';
        pr(0.2, 0.92, 0.6, 0.06, shadow);
        // Boots
        pr(0.28, 0.82, 0.18, 0.14, '#3a2a10'); pr(0.54, 0.82, 0.18, 0.14, '#3a2a10');
        // Legs (pants)
        pr(0.28, 0.62, 0.18, 0.22, '#4a3a1a'); pr(0.54, 0.62, 0.18, 0.22, '#4a3a1a');
        // Body vest
        pr(0.24, 0.32, 0.52, 0.32, vest);
        pr(0.24, 0.32, 0.52, 0.04, vestDark);
        // Quiver on back
        pr(0.70, 0.20, 0.10, 0.32, leather);
        pr(0.72, 0.18, 0.06, 0.04, '#cc8822'); pr(0.74, 0.14, 0.02, 0.06, '#aa6611');
        pr(0.72, 0.16, 0.02, 0.06, '#bb7722');
        // Cloak
        pr(0.16, 0.34, 0.10, 0.30, vestDark); pr(0.74, 0.34, 0.10, 0.30, vestDark);
        // Belt
        pr(0.24, 0.62, 0.52, 0.04, leather);
        // Arms
        pr(0.14, 0.34, 0.12, 0.24, vest); pr(0.74, 0.34, 0.12, 0.24, vest);
        // Neck/face
        pr(0.40, 0.22, 0.20, 0.12, skin);
        // Head with hood
        pr(0.28, 0.06, 0.44, 0.22, skin);
        pr(0.22, 0.04, 0.56, 0.12, vestDark); // hood
        pr(0.24, 0.06, 0.52, 0.10, vest);
        // Face
        c.fillStyle = '#222222';
        c.fillRect(x + w*0.36, y + h*0.12 + bob, w*0.07, w*0.07);
        c.fillRect(x + w*0.52, y + h*0.12 + bob, w*0.07, w*0.07);
        // Bow
        c.strokeStyle = '#7a5a22'; c.lineWidth = 2.5;
        c.beginPath();
        c.arc(x + w*0.08, y + h*0.48 + bob, h*0.30, -Math.PI*0.55, Math.PI*0.55);
        c.stroke();
        c.strokeStyle = '#ccccaa'; c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x + w*0.08, y + h*0.48 - h*0.30 + bob);
        c.lineTo(x + w*0.08, y + h*0.48 + h*0.30 + bob);
        c.stroke();
        break;
      }
      case 'cleric': {
        const robe = color || '#e8d080', robeDark = '#b09840', trim = '#ffffff';
        pr(0.2, 0.92, 0.6, 0.06, shadow);
        pr(0.20, 0.62, 0.60, 0.34, robeDark);
        pr(0.25, 0.64, 0.50, 0.30, robe);
        pr(0.25, 0.30, 0.50, 0.34, robe);
        pr(0.25, 0.30, 0.50, 0.04, trim); pr(0.25, 0.62, 0.50, 0.04, trim);
        // Holy symbol on chest
        c.fillStyle = '#ffffff';
        c.fillRect(x + w*0.44, y + h*0.36 + bob, w*0.12, w*0.20);
        c.fillRect(x + w*0.38, y + h*0.42 + bob, w*0.24, w*0.08);
        // Arms
        pr(0.14, 0.32, 0.13, 0.28, robe); pr(0.73, 0.32, 0.13, 0.28, robe);
        // Mace
        pr(0.78, 0.28, 0.06, 0.42, '#888899');
        pr(0.72, 0.24, 0.18, 0.10, '#aaaacc');
        // Neck/face
        pr(0.40, 0.20, 0.20, 0.12, skin);
        pr(0.28, 0.06, 0.44, 0.20, skin);
        // Halo
        c.strokeStyle = '#ffee44'; c.lineWidth = 2;
        c.beginPath(); c.arc(x + w*0.50, y + h*0.03 + bob, w*0.24, 0, Math.PI*2); c.stroke();
        // Hood/Headband
        pr(0.24, 0.04, 0.52, 0.06, robeDark);
        // Eyes
        c.fillStyle = '#2244aa';
        c.fillRect(x + w*0.36, y + h*0.12 + bob, w*0.08, w*0.06);
        c.fillRect(x + w*0.52, y + h*0.12 + bob, w*0.08, w*0.06);
        break;
      }
      case 'rogue': {
        const dark = color || '#222244', darkDark = '#111122', leather = '#3a2a10';
        pr(0.2, 0.92, 0.6, 0.06, shadow);
        pr(0.30, 0.78, 0.16, 0.18, '#1a1a2a'); pr(0.54, 0.78, 0.16, 0.18, '#1a1a2a');
        pr(0.30, 0.62, 0.16, 0.18, dark); pr(0.54, 0.62, 0.16, 0.18, dark);
        pr(0.24, 0.34, 0.52, 0.30, dark);
        pr(0.24, 0.34, 0.52, 0.04, '#445577');
        pr(0.24, 0.62, 0.52, 0.04, leather);
        // Daggers on belt
        pr(0.28, 0.56, 0.06, 0.10, '#ccccdd'); pr(0.66, 0.56, 0.06, 0.10, '#ccccdd');
        // Cloak
        pr(0.12, 0.36, 0.12, 0.38, darkDark); pr(0.76, 0.36, 0.12, 0.38, darkDark);
        // Arms
        pr(0.16, 0.36, 0.10, 0.22, dark); pr(0.74, 0.36, 0.10, 0.22, dark);
        // Neck
        pr(0.40, 0.22, 0.20, 0.14, skin);
        // Head with hood
        pr(0.30, 0.06, 0.40, 0.22, skin);
        pr(0.20, 0.04, 0.60, 0.16, darkDark); // hood
        pr(0.22, 0.06, 0.56, 0.12, dark);
        // Face shadow/mask
        pr(0.26, 0.16, 0.48, 0.08, darkDark);
        // Eyes glowing
        c.fillStyle = '#ff4444';
        c.fillRect(x + w*0.34, y + h*0.18 + bob, w*0.08, w*0.06);
        c.fillRect(x + w*0.54, y + h*0.18 + bob, w*0.08, w*0.06);
        break;
      }
      default: {
        // Generic party member with class color
        pr(0.2, 0.92, 0.6, 0.06, shadow);
        // Boots
        pr(0.28, 0.82, 0.18, 0.14, '#2a2a3a'); pr(0.54, 0.82, 0.18, 0.14, '#2a2a3a');
        // Legs
        pr(0.30, 0.62, 0.16, 0.22, color || '#334488'); pr(0.54, 0.62, 0.16, 0.22, color || '#334488');
        // Body
        pr(0.24, 0.32, 0.52, 0.32, color || '#334488');
        // Belt
        pr(0.24, 0.62, 0.52, 0.04, '#886622');
        // Arms
        pr(0.14, 0.34, 0.12, 0.24, color || '#334488');
        pr(0.74, 0.34, 0.12, 0.24, color || '#334488');
        // Neck
        pr(0.40, 0.22, 0.20, 0.12, skin);
        // Head
        pr(0.30, 0.06, 0.40, 0.22, skin);
        pr(0.32, 0.08, 0.36, 0.16, skinDark);
        pr(0.30, 0.08, 0.40, 0.10, skin);
        // Hair
        c.fillStyle = '#442211';
        c.fillRect(x + w*0.28, y + h*0.04 + bob, w*0.44, h*0.08);
        // Eyes
        c.fillStyle = '#222222';
        c.fillRect(x + w*0.36, y + h*0.13 + bob, w*0.07, w*0.07);
        c.fillRect(x + w*0.52, y + h*0.13 + bob, w*0.07, w*0.07);
      }
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
      // SNES slime: shiny blob with highlights
      c.beginPath();
      c.ellipse(x + w*0.5, y + h*0.68 + bob, w*0.44, h*0.36, 0, 0, Math.PI*2);
      c.fill();
      // Bubble texture
      c.fillStyle = color.replace(/[0-9a-f]{2}$/i, 'cc');
      c.beginPath(); c.ellipse(x + w*0.5, y + h*0.72 + bob, w*0.36, h*0.26, 0, 0, Math.PI*2); c.fill();
      // Eyes
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(x + w*0.36, y + h*0.58 + bob, w*0.09, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x + w*0.62, y + h*0.58 + bob, w*0.09, 0, Math.PI*2); c.fill();
      c.fillStyle = '#111111';
      c.beginPath(); c.arc(x + w*0.37, y + h*0.60 + bob, w*0.05, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x + w*0.63, y + h*0.60 + bob, w*0.05, 0, Math.PI*2); c.fill();
      // Highlight
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.beginPath(); c.ellipse(x + w*0.36, y + h*0.52 + bob, w*0.10, h*0.08, -0.5, 0, Math.PI*2); c.fill();
    } else if (enemy.id && (enemy.id.includes('dragon') || enemy.id.includes('wyvern'))) {
      // SNES FF6-style dragon
      const scale = color;
      const scaleDark = '#882200';
      // Tail
      c.fillStyle = scaleDark;
      c.beginPath();
      c.moveTo(x + w*0.05, y + h*0.75 + bob);
      c.quadraticCurveTo(x + w*0.15, y + h*0.90 + bob, x + w*0.30, y + h*0.82 + bob);
      c.lineTo(x + w*0.25, y + h*0.60 + bob);
      c.closePath(); c.fill();
      // Body
      c.fillStyle = scale;
      c.beginPath();
      c.ellipse(x + w*0.42, y + h*0.52 + bob, w*0.38, h*0.28, 0, 0, Math.PI*2);
      c.fill();
      // Belly
      c.fillStyle = '#ffcc99';
      c.beginPath();
      c.ellipse(x + w*0.42, y + h*0.58 + bob, w*0.22, h*0.16, 0, 0, Math.PI*2);
      c.fill();
      // Wings
      c.fillStyle = scaleDark;
      c.globalAlpha = 0.85;
      c.beginPath();
      c.moveTo(x + w*0.32, y + h*0.38 + bob);
      c.lineTo(x + w*0.06, y + h*0.10 + bob);
      c.quadraticCurveTo(x + w*0.18, y + h*0.32 + bob, x + w*0.35, y + h*0.50 + bob);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(x + w*0.60, y + h*0.38 + bob);
      c.lineTo(x + w*0.92, y + h*0.08 + bob);
      c.quadraticCurveTo(x + w*0.78, y + h*0.30 + bob, x + w*0.62, y + h*0.50 + bob);
      c.closePath(); c.fill();
      c.globalAlpha = 1.0;
      // Head
      c.fillStyle = scale;
      c.beginPath();
      c.ellipse(x + w*0.74, y + h*0.34 + bob, w*0.20, h*0.18, 0.3, 0, Math.PI*2);
      c.fill();
      // Horns
      c.fillStyle = '#ffffff';
      c.fillRect(x + w*0.72, y + h*0.16 + bob, w*0.04, w*0.08);
      c.fillRect(x + w*0.82, y + h*0.18 + bob, w*0.04, w*0.08);
      // Eyes
      c.fillStyle = '#ffff00';
      c.beginPath(); c.arc(x + w*0.80, y + h*0.30 + bob, w*0.06, 0, Math.PI*2); c.fill();
      c.fillStyle = '#000000';
      c.beginPath(); c.arc(x + w*0.81, y + h*0.30 + bob, w*0.03, 0, Math.PI*2); c.fill();
      // Snout
      c.fillStyle = scaleDark;
      c.fillRect(x + w*0.86, y + h*0.34 + bob, w*0.10, w*0.06);
      // Nostril
      c.fillStyle = '#110000';
      c.fillRect(x + w*0.91, y + h*0.35 + bob, w*0.03, w*0.03);
    } else if (enemy.id && enemy.id.includes('golem')) {
      // Stone golem SNES style
      const stone = '#8a8090', stoneDark = '#5a5060';
      c.fillStyle = stoneDark;
      c.fillRect(x + w*0.18, y + h*0.08 + bob, w*0.64, h*0.82);
      c.fillStyle = stone;
      c.fillRect(x + w*0.20, y + h*0.10 + bob, w*0.60, h*0.78);
      // Rock texture cracks
      c.strokeStyle = stoneDark; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x+w*0.3, y+h*0.2+bob); c.lineTo(x+w*0.45, y+h*0.38+bob); c.stroke();
      c.beginPath(); c.moveTo(x+w*0.6, y+h*0.25+bob); c.lineTo(x+w*0.5, y+h*0.42+bob); c.stroke();
      c.beginPath(); c.moveTo(x+w*0.35, y+h*0.55+bob); c.lineTo(x+w*0.55, y+h*0.65+bob); c.stroke();
      // Head
      c.fillStyle = stone;
      c.fillRect(x + w*0.26, y + h*0.08 + bob, w*0.48, h*0.28);
      c.fillStyle = stoneDark;
      c.fillRect(x + w*0.28, y + h*0.10 + bob, w*0.44, h*0.24);
      // Eyes (glowing)
      c.fillStyle = '#ff4400';
      c.beginPath(); c.arc(x + w*0.38, y + h*0.20 + bob, w*0.07, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x + w*0.62, y + h*0.20 + bob, w*0.07, 0, Math.PI*2); c.fill();
      c.fillStyle = '#ffaa44';
      c.beginPath(); c.arc(x + w*0.38, y + h*0.20 + bob, w*0.04, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x + w*0.62, y + h*0.20 + bob, w*0.04, 0, Math.PI*2); c.fill();
    } else if (enemy.id && enemy.id.includes('skeleton')) {
      // SNES undead skeleton
      const bone = '#e8e0c8', boneDark = '#c8b898';
      // Skull
      c.fillStyle = bone;
      c.beginPath(); c.arc(x+w*0.5, y+h*0.14+bob, w*0.18, 0, Math.PI*2); c.fill();
      c.fillStyle = boneDark;
      c.beginPath(); c.arc(x+w*0.5, y+h*0.14+bob, w*0.14, 0, Math.PI*2); c.fill();
      c.fillStyle = bone;
      c.beginPath(); c.arc(x+w*0.5, y+h*0.12+bob, w*0.14, 0, Math.PI*2); c.fill();
      // Eye sockets
      c.fillStyle = '#111111';
      c.beginPath(); c.ellipse(x+w*0.42, y+h*0.13+bob, w*0.06, w*0.07, 0, 0, Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(x+w*0.58, y+h*0.13+bob, w*0.06, w*0.07, 0, 0, Math.PI*2); c.fill();
      // Jaw
      c.fillStyle = bone;
      c.fillRect(x+w*0.36, y+h*0.22+bob, w*0.28, w*0.08);
      // Teeth
      c.fillStyle = '#ffffff';
      for (let t = 0; t < 5; t++) c.fillRect(x+w*(0.38+t*0.05), y+h*0.23+bob, w*0.03, w*0.05);
      // Spine
      c.fillStyle = bone;
      c.fillRect(x+w*0.47, y+h*0.30+bob, w*0.06, h*0.36);
      // Ribs
      c.strokeStyle = bone; c.lineWidth = 2;
      for (let r2 = 0; r2 < 4; r2++) {
        const ry2 = y + h*(0.33 + r2*0.08) + bob;
        c.beginPath(); c.moveTo(x+w*0.50, ry2); c.quadraticCurveTo(x+w*0.20, ry2+h*0.03, x+w*0.22, ry2+h*0.06); c.stroke();
        c.beginPath(); c.moveTo(x+w*0.50, ry2); c.quadraticCurveTo(x+w*0.80, ry2+h*0.03, x+w*0.78, ry2+h*0.06); c.stroke();
      }
      // Hip
      c.fillStyle = bone;
      c.fillRect(x+w*0.30, y+h*0.66+bob, w*0.40, h*0.08);
      // Leg bones
      c.fillRect(x+w*0.34, y+h*0.74+bob, w*0.10, h*0.22);
      c.fillRect(x+w*0.56, y+h*0.74+bob, w*0.10, h*0.22);
    } else {
      // Generic SNES-style humanoid enemy
      const body = color, bodyDark = color.replace(/[0-9a-f]{2}$/i, '66');
      // Shadow
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.beginPath(); c.ellipse(x+w*0.5, y+h*0.94+bob, w*0.30, h*0.05, 0, 0, Math.PI*2); c.fill();
      // Feet
      c.fillStyle = '#222222';
      c.fillRect(x+w*0.26, y+h*0.84+bob, w*0.18, h*0.10);
      c.fillRect(x+w*0.56, y+h*0.84+bob, w*0.18, h*0.10);
      // Legs
      c.fillStyle = body;
      c.fillRect(x+w*0.28, y+h*0.62+bob, w*0.16, h*0.24);
      c.fillRect(x+w*0.56, y+h*0.62+bob, w*0.16, h*0.24);
      // Body
      c.fillStyle = body;
      c.fillRect(x+w*0.22, y+h*0.30+bob, w*0.56, h*0.34);
      c.fillStyle = bodyDark;
      c.fillRect(x+w*0.24, y+h*0.32+bob, w*0.52, h*0.28);
      // Arms
      c.fillStyle = body;
      c.fillRect(x+w*0.06, y+h*0.32+bob, w*0.16, h*0.26);
      c.fillRect(x+w*0.78, y+h*0.32+bob, w*0.16, h*0.26);
      // Claws/hands
      c.fillStyle = '#ff8844';
      c.fillRect(x+w*0.04, y+h*0.56+bob, w*0.18, h*0.10);
      c.fillRect(x+w*0.78, y+h*0.56+bob, w*0.18, h*0.10);
      // Head
      c.fillStyle = '#ffcc99';
      c.beginPath();
      c.ellipse(x+w*0.50, y+h*0.18+bob, w*0.22, h*0.18, 0, 0, Math.PI*2);
      c.fill();
      // Angry eyes
      c.fillStyle = '#ff2222';
      c.fillRect(x+w*0.38, y+h*0.14+bob, w*0.08, w*0.08);
      c.fillRect(x+w*0.54, y+h*0.14+bob, w*0.08, w*0.08);
      c.fillStyle = '#ffff00';
      c.fillRect(x+w*0.40, y+h*0.15+bob, w*0.04, w*0.04);
      c.fillRect(x+w*0.56, y+h*0.15+bob, w*0.04, w*0.04);
      // Snarl
      c.strokeStyle = '#222222'; c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x+w*0.38, y+h*0.24+bob);
      c.quadraticCurveTo(x+w*0.50, y+h*0.28+bob, x+w*0.62, y+h*0.24+bob);
      c.stroke();
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
