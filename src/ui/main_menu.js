export class MainMenu {
  constructor(game) {
    this.game = game;
    this.selectedIndex = 0;
    this.animTime = 0;
    this.particles = [];
    this._initParticles();
  }

  _initParticles() {
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.2 - Math.random() * 0.5,
        size: 1 + Math.random() * 2,
        alpha: Math.random()
      });
    }
  }

  onEnter() { this.animTime = 0; }

  update(dt) {
    this.animTime += dt;
    // Update particles
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.alpha += 0.01;
      if (p.y < 0 || p.alpha > 1) {
        p.y = 720; p.x = Math.random() * 1280; p.alpha = 0;
      }
    });
    const hasSave = this.game.hasSave();
    const options = hasSave ? ['New Game', 'Continue', 'How to Play'] : ['New Game', 'How to Play'];
    const input = this.game.input;
    const W = this.game.canvas.width, H = this.game.canvas.height;
    const btnY = H * 0.55;
    options.forEach((opt, i) => {
      if (input.isClickIn(W/2 - 100, btnY + i * 60, 200, 48)) {
        this._selectOption(i, options);
      }
    });
    if (input.isKeyJustPressed('ArrowDown')) this.selectedIndex = Math.min(options.length-1, this.selectedIndex+1);
    if (input.isKeyJustPressed('ArrowUp')) this.selectedIndex = Math.max(0, this.selectedIndex-1);
    if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
      this._selectOption(this.selectedIndex, options);
    }
  }

  _selectOption(index, options) {
    const opt = options[index];
    if (opt === 'New Game') this.game.newGame();
    else if (opt === 'Continue') this.game.loadGame();
    else if (opt === 'How to Play') this.game.setState('HOW_TO_PLAY');
  }

  render(r) {
    const W = r.width, H = r.height;
    // Background gradient
    r.drawGradientBG(0, 0, W, H, '#05050f', '#0f0520');
    // Particles
    const ctx = r.ctx;
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.alpha) * 0.7;
      ctx.fillStyle = '#8888ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Decorative lines
    const pulse = Math.sin(this.animTime * 1.5) * 0.3 + 0.7;
    ctx.save();
    ctx.strokeStyle = `rgba(100,100,200,${pulse * 0.3})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, H * 0.3 + i * 40);
      ctx.lineTo(W, H * 0.35 + i * 35);
      ctx.stroke();
    }
    ctx.restore();
    // Title
    const titleY = H * 0.15;
    ctx.save();
    ctx.font = 'bold 56px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const grad = ctx.createLinearGradient(W/2 - 300, 0, W/2 + 300, 0);
    grad.addColorStop(0, '#8866ff');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(1, '#ff88ff');
    ctx.fillStyle = grad;
    ctx.fillText('RUINS OF AETHERMOOR', W/2, titleY);
    ctx.restore();
    // Subtitle
    r.drawTextCentered('A Classic JRPG Adventure', W/2, titleY + 70, '#9988cc', 20);
    // Decorative runes
    const runeAlpha = Math.sin(this.animTime * 0.8) * 0.3 + 0.5;
    r.drawTextCentered('⚔️ ✨ 🗡️ 🏰 🐉 ✨ ⚔️', W/2, titleY + 105, `rgba(180,160,255,${runeAlpha})`, 22);
    // Menu buttons
    const hasSave = this.game.hasSave();
    const options = hasSave ? ['New Game', 'Continue', 'How to Play'] : ['New Game', 'How to Play'];
    const btnY = H * 0.55;
    options.forEach((opt, i) => {
      const bx = W/2 - 100, by = btnY + i * 60;
      const hov = this.game.input.isMouseOver(bx, by, 200, 48);
      const sel = this.selectedIndex === i;
      r.drawRoundRect(bx - (sel ? 5:0), by - (sel ? 2:0), 200 + (sel ? 10:0), 48 + (sel ? 4:0),
        8, sel ? '#3333aa' : (hov ? '#2a2a6a' : '#1a1a3a'),
        sel ? '#aaaaff' : (hov ? '#7777cc' : '#5555aa'), sel ? 3 : 1);
      const textColor = sel ? '#ffffff' : (hov ? '#ddddff' : '#aaaacc');
      r.drawTextCentered(opt, W/2, by + 14, textColor, 20, 'monospace', true);
    });
    // Version / author
    r.drawText('v1.0 | Use WASD/Arrows to navigate', 10, H - 25, '#555566', 13);
    // Floor progress hint
    if (hasSave) {
      r.drawTextCentered('Save found - press Continue to resume your adventure', W/2, H - 45, '#666688', 15);
    }
  }
}
