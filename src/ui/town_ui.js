export class TownUI {
  constructor(game) {
    this.game = game;
    this.playerX = 14;
    this.playerY = 10;
    this.facing = 'down';
    this.tileSize = 32;
    this.message = '';
    this.messageTimer = 0;
    this.animTime = 0;
    this.moveDelay = 0;
  }

  onEnter(data) {
    const town = this.game.town;
    this.playerX = town.playerStart.x;
    this.playerY = town.playerStart.y;
    this.message = 'Welcome to Aethermoor! Walk to buildings to enter.';
    this.messageTimer = 3;
  }

  update(dt) {
    this.animTime += dt;
    this.moveDelay = Math.max(0, this.moveDelay - dt);
    if (this.messageTimer > 0) this.messageTimer -= dt;
    const input = this.game.input;
    if (input.isKeyJustPressed('KeyI') || input.isKeyJustPressed('Escape')) {
      this.game.openInventory('TOWN');
      return;
    }
    if (this.moveDelay > 0) return;
    const { dx, dy } = input.getMoveDir();
    if (dx !== 0 || dy !== 0) {
      this.moveDelay = 0.15;
      const nx = this.playerX + dx, ny = this.playerY + dy;
      const town = this.game.town;
      const building = town.getBuildingAt(nx, ny);
      if (building) {
        this._enterBuilding(building);
        return;
      }
      if (town.isWalkable(nx, ny)) {
        this.playerX = nx;
        this.playerY = ny;
        if (dy < 0) this.facing = 'up';
        else if (dy > 0) this.facing = 'down';
        else if (dx < 0) this.facing = 'left';
        else this.facing = 'right';
      }
    }
    // Interact with building
    if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
      const faceDx = this.facing === 'left' ? -1 : this.facing === 'right' ? 1 : 0;
      const faceDy = this.facing === 'up' ? -1 : this.facing === 'down' ? 1 : 0;
      const bx = this.playerX + faceDx, by = this.playerY + faceDy;
      const building = this.game.town.getBuildingAt(bx, by);
      if (building) this._enterBuilding(building);
      else {
        // Check current tile
        const curr = this.game.town.getBuildingAt(this.playerX, this.playerY);
        if (curr) this._enterBuilding(curr);
      }
    }
  }

  _enterBuilding(building) {
    const shopMap = { weapon: 'weapon', armor: 'armor', potion: 'potion', magic: 'magic', material: 'material' };
    if (shopMap[building.id]) {
      this.game.openShop(shopMap[building.id]);
    } else if (building.id === 'inn') {
      this._openInn();
    } else if (building.id === 'crafting') {
      this.game.openCrafting();
    } else if (building.id === 'dungeon') {
      this.game.startDungeon();
    } else if (building.id === 'party_mgmt') {
      this.game.openInventory('TOWN');
    } else {
      this.message = `${building.name}: Coming soon!`;
      this.messageTimer = 2;
    }
  }

  _openInn() {
    const party = this.game.party;
    const level = party.getAverageLevel();
    const cost = level * 10;
    const result = party.restAtInn(cost);
    if (result) {
      this.message = `Rested at inn for ${cost} gold. Party fully restored!`;
      this.game.saveSystem.save(this.game.getSaveData());
    } else {
      this.message = `Not enough gold! Inn costs ${cost}g.`;
    }
    this.messageTimer = 3;
  }

  render(r) {
    const W = r.width, H = r.height;
    const town = this.game.town;
    const ts = this.tileSize;
    // Camera centered on player
    const camX = this.playerX * ts - W/2 + ts/2;
    const camY = this.playerY * ts - H/2 + ts/2;
    const ctx = r.ctx;

    // Draw terrain tiles
    for (let ty = 0; ty < town.height; ty++) {
      for (let tx = 0; tx < town.width; tx++) {
        const sx = tx * ts - camX, sy = ty * ts - camY;
        if (sx < -ts || sx > W || sy < -ts || sy > H) continue;
        const cell = town.grid[ty][tx];
        if (cell === 4) {
          // Water — draw stream
          const wave = Math.sin(this.animTime * 2 + tx * 0.5 + ty * 0.5) * 0.08;
          const blue = Math.round(160 + wave * 40);
          r.drawRect(sx, sy, ts, ts, `#1a4a${blue.toString(16).padStart(2,'0')}`);
          // Shimmer lines
          ctx.strokeStyle = 'rgba(100,180,255,0.3)';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            const waveX = ((this.animTime * 20 + i * 11 + tx * 3) % ts);
            ctx.beginPath();
            ctx.moveTo(sx + waveX, sy + ts * 0.3 + i * 8);
            ctx.lineTo(sx + waveX + 8, sy + ts * 0.3 + i * 8);
            ctx.stroke();
          }
        } else if (cell === 5) {
          // Bridge planks
          r.drawRect(sx, sy, ts, ts, '#8B6914');
          ctx.strokeStyle = '#5a4010';
          ctx.lineWidth = 1;
          for (let i = 0; i < 4; i++) {
            const by = sy + i * (ts / 4);
            ctx.beginPath(); ctx.moveTo(sx, by); ctx.lineTo(sx + ts, by); ctx.stroke();
          }
          ctx.strokeStyle = '#aa8822';
          ctx.lineWidth = 2;
          ctx.strokeRect(sx + 2, sy + 2, ts - 4, ts - 4);
        } else {
          const colors = ['#2d5a1a','#3a6a22','#4a4a3a','#5a5a48'];
          r.drawRect(sx, sy, ts, ts, colors[cell] || '#2d5a1a');
          if (cell === 3) {
            // Cobblestone pattern
            ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.5;
            for (let pi = 0; pi < 4; pi++) {
              const cx2 = sx + (pi % 2) * (ts/2), cy2 = sy + Math.floor(pi/2) * (ts/2);
              ctx.strokeRect(cx2 + 1, cy2 + 1, ts/2 - 2, ts/2 - 2);
            }
          } else if (cell === 2) {
            // Road edge shadow
            ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.5;
            ctx.strokeRect(sx, sy, ts, ts);
          }
        }
      }
    }

    // Draw buildings (SNES-style with more detail)
    town.buildings.forEach(b => {
      const sx = b.x * ts - camX, sy = b.y * ts - camY;
      const bw = b.w * ts, bh = b.h * ts;
      if (sx + bw < -ts || sx > W + ts || sy + bh < -ts || sy > H + ts) return;

      // Foundation/shadow
      r.drawRect(sx + 3, sy + bh - 4, bw - 3, 6, 'rgba(0,0,0,0.25)');

      // Main building walls
      r.drawRoundRect(sx + 1, sy + ts * 0.55, bw - 2, bh - ts * 0.55 - 1, 3, b.color, '#000000', 1);

      // Windows
      const winColor = '#ffe8a0';
      const winRows = Math.max(1, Math.floor((bh - ts * 0.8) / (ts * 0.6)));
      const winCols = Math.max(1, Math.floor((bw - ts * 0.4) / (ts * 0.7)));
      for (let wr = 0; wr < winRows; wr++) {
        for (let wc = 0; wc < winCols; wc++) {
          const wx = sx + ts * 0.3 + wc * (ts * 0.7);
          const wy = sy + ts * 0.75 + wr * (ts * 0.58);
          if (wx + 10 < sx + bw - 4 && wy + 12 < sy + bh - 4) {
            r.drawRect(wx, wy, 10, 12, '#1a1a2a');
            r.drawRect(wx + 1, wy + 1, 8, 5, winColor);
            r.drawRect(wx + 4, wy + 1, 1, 10, 'rgba(0,0,0,0.3)');
            r.drawRect(wx + 1, wy + 6, 8, 1, 'rgba(0,0,0,0.3)');
          }
        }
      }

      // Door
      const doorW = Math.min(18, bw * 0.25);
      const doorH = ts * 0.65;
      const doorX = sx + bw / 2 - doorW / 2;
      const doorY = sy + bh - doorH - 1;
      r.drawRect(doorX, doorY, doorW, doorH, '#2a1505');
      r.drawRoundRect(doorX + 1, doorY + 1, doorW - 2, doorH - 4, 3, '#3d2008', null, 0);
      // Door knob
      r.drawRect(doorX + doorW * 0.6, doorY + doorH * 0.45, 3, 3, '#ccaa44');

      // SNES-style pitched roof
      const roofH = ts * 0.65;
      ctx.beginPath();
      ctx.moveTo(sx - 3, sy + roofH + 2);         // left eave
      ctx.lineTo(sx + bw / 2, sy - 2);            // peak
      ctx.lineTo(sx + bw + 3, sy + roofH + 2);    // right eave
      ctx.lineTo(sx + bw + 3, sy + roofH + ts * 0.15);
      ctx.lineTo(sx - 3, sy + roofH + ts * 0.15);
      ctx.closePath();
      ctx.fillStyle = b.roofColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Roof ridge highlight
      ctx.beginPath();
      ctx.moveTo(sx + bw * 0.25, sy + roofH * 0.5 + 2);
      ctx.lineTo(sx + bw / 2, sy - 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Chimney on some buildings
      if (b.id === 'inn' || b.id === 'crafting') {
        const chX = sx + bw * 0.75;
        const chY = sy + roofH * 0.3;
        r.drawRect(chX, chY, 8, roofH * 0.5, '#5a3a2a');
        r.drawRect(chX - 2, chY, 12, 5, '#6a4a3a');
        // Smoke puffs
        for (let s = 0; s < 3; s++) {
          const puff = (this.animTime * 0.5 + s * 0.4) % 1.0;
          ctx.globalAlpha = (1 - puff) * 0.5;
          ctx.fillStyle = '#cccccc';
          ctx.beginPath();
          ctx.arc(chX + 4 + Math.sin(this.animTime + s) * 4,
                  chY - puff * 20, 4 + puff * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Sign above door
      const signW = Math.min(bw - 8, 60);
      r.drawRoundRect(sx + bw / 2 - signW / 2, sy + ts * 0.55, signW, 14, 2, '#3a2510', '#aa8833', 1);
      r.drawTextCentered(b.name, sx + bw / 2, sy + ts * 0.56, '#ffe0a0', 9, 'monospace', true);
    });

    // Draw trees (SNES-style sprite trees)
    town.trees.forEach(t => {
      const sx = t.x * ts - camX, sy = t.y * ts - camY;
      if (sx < -ts || sx > W || sy < -ts || sy > H) return;
      const sway = Math.sin(this.animTime * 1.2 + t.x * 2.7 + t.y * 1.9) * 1.5;
      // Trunk
      r.drawRect(sx + ts * 0.38, sy + ts * 0.55, ts * 0.24, ts * 0.45, '#6b3f1a');
      // Canopy layers (SNES-style stacked triangles)
      const canopyColor = '#1a5c0a';
      const canopyHigh = '#2a7a14';
      ctx.beginPath();
      ctx.moveTo(sx + ts / 2 + sway * 0.5, sy + 1);
      ctx.lineTo(sx + ts * 0.1, sy + ts * 0.45);
      ctx.lineTo(sx + ts * 0.9, sy + ts * 0.45);
      ctx.closePath();
      ctx.fillStyle = canopyColor;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx + ts / 2 + sway, sy + ts * 0.2);
      ctx.lineTo(sx + ts * 0.05, sy + ts * 0.62);
      ctx.lineTo(sx + ts * 0.95, sy + ts * 0.62);
      ctx.closePath();
      ctx.fillStyle = canopyHigh;
      ctx.fill();
      // Canopy outline
      ctx.strokeStyle = '#0d3806';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Well at town center
    const wellX = 18 * ts - camX, wellY = 13 * ts - camY;
    r.drawRect(wellX + 4, wellY + 6, ts - 8, ts - 10, '#7a5533');
    r.drawRect(wellX + 8, wellY + 10, ts - 16, ts - 16, '#0a1a2a');
    r.drawRect(wellX + 2, wellY + 2, ts - 4, 6, '#5a3a1a');
    ctx.strokeStyle = '#4a2a10'; ctx.lineWidth = 2;
    ctx.strokeRect(wellX + 4, wellY + 6, ts - 8, ts - 10);

    // Lampposts along roads (decorative)
    [[9,14],[9,15],[19,7],[19,22]].forEach(([lx,ly]) => {
      const lsx = lx * ts - camX + ts/2, lsy = ly * ts - camY;
      if (lsx < -ts || lsx > W || lsy < -ts || lsy > H) return;
      r.drawRect(lsx - 2, lsy, 4, ts - 4, '#5a5a6a');
      r.drawRect(lsx - 8, lsy - 4, 16, 6, '#6a6a7a');
      // Lamp glow
      const glow = 0.5 + Math.sin(this.animTime * 3) * 0.1;
      ctx.globalAlpha = glow;
      ctx.fillStyle = '#ffee88';
      ctx.beginPath();
      ctx.arc(lsx, lsy - 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // NPC: town guard near dungeon path
    const guardBob = Math.sin(this.animTime * 1.5) * 1.5;
    const gx = 29 * ts - camX, gy = 21 * ts - camY;
    if (gx > -ts && gx < W && gy > -ts && gy < H) {
      // Guard shadow
      r.drawRect(gx + 5, gy + ts - 6, ts - 10, 5, 'rgba(0,0,0,0.3)');
      // Body (armor)
      r.drawRect(gx + 8, gy + 10 + guardBob, ts - 16, ts - 20, '#8899aa');
      // Legs
      r.drawRect(gx + 9, gy + ts - 12 + guardBob, 6, 8, '#6677aa');
      r.drawRect(gx + ts - 15, gy + ts - 12 + guardBob, 6, 8, '#6677aa');
      // Head
      ctx.fillStyle = '#aabbcc';
      ctx.fillRect(gx + 8, gy + 2 + guardBob, ts - 16, 10);
      ctx.fillStyle = '#ffcc99';
      ctx.fillRect(gx + 10, gy + 4 + guardBob, ts - 20, 7);
      // Spear
      r.drawRect(gx + ts - 6, gy + guardBob, 3, ts - 4, '#8B6914');
    }

    // Draw player (SNES FF-style sprite)
    const px = this.playerX * ts - camX;
    const py = this.playerY * ts - camY;
    const bob = Math.sin(this.animTime * 6) * 2;
    // Player shadow
    r.drawRect(px + 5, py + ts - 6, ts - 10, 5, 'rgba(0,0,0,0.35)');
    // Boots
    r.drawRect(px + 8, py + ts - 10 + bob, 6, 8, '#2244aa');
    r.drawRect(px + ts - 14, py + ts - 10 + bob, 6, 8, '#2244aa');
    // Legs
    r.drawRect(px + 9, py + ts - 18 + bob, 5, 9, '#334499');
    r.drawRect(px + ts - 14, py + ts - 18 + bob, 5, 9, '#334499');
    // Body / tunic
    r.drawRect(px + 7, py + 12 + bob, ts - 14, ts - 26, '#4466cc');
    // Belt
    r.drawRect(px + 7, py + 22 + bob, ts - 14, 3, '#aa8833');
    // Arms
    r.drawRect(px + 3, py + 13 + bob, 5, ts - 28, '#3355bb');
    r.drawRect(px + ts - 8, py + 13 + bob, 5, ts - 28, '#3355bb');
    // Neck
    r.drawRect(px + ts/2 - 3, py + 8 + bob, 6, 5, '#ffcc99');
    // Head
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.ellipse(px + ts/2, py + 6 + bob, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Hair (direction-based)
    ctx.fillStyle = '#553322';
    ctx.fillRect(px + ts/2 - 7, py + 0 + bob, 14, 5);
    // Eyes
    ctx.fillStyle = '#222222';
    ctx.fillRect(px + ts/2 - 4, py + 5 + bob, 2, 2);
    ctx.fillRect(px + ts/2 + 2, py + 5 + bob, 2, 2);

    // Direction indicator arrow
    ctx.fillStyle = '#aabbff';
    ctx.beginPath();
    if (this.facing === 'down')  { ctx.moveTo(px+10,py+ts-2); ctx.lineTo(px+ts/2,py+ts+5); ctx.lineTo(px+ts-10,py+ts-2); }
    else if (this.facing === 'up')   { ctx.moveTo(px+10,py+4); ctx.lineTo(px+ts/2,py-3); ctx.lineTo(px+ts-10,py+4); }
    else if (this.facing === 'left') { ctx.moveTo(px+4,py+10); ctx.lineTo(px-3,py+ts/2); ctx.lineTo(px+4,py+ts-10); }
    else if (this.facing === 'right') { ctx.moveTo(px+ts-4,py+10); ctx.lineTo(px+ts+3,py+ts/2); ctx.lineTo(px+ts-4,py+ts-10); }
    ctx.closePath(); ctx.fill();

    // UI Panel
    r.drawRoundRect(0, H-85, W, 85, 0, 'rgba(0,0,10,0.85)', '#334', 1);
    // Party HP
    if (this.game.party) {
      this.game.party.members.forEach((m, i) => {
        const bx = 10 + i * 180;
        r.drawText(`${m.name}`, bx, H-80, '#ffffff', 13, 'left', 'monospace', true);
        r.drawBar(bx, H-62, 160, 10, m.hp, m.maxHp, m.hp/m.maxHp < 0.3 ? '#ff4444' : '#44aa44', '#222', `${m.hp}/${m.maxHp}`);
        r.drawBar(bx, H-48, 160, 10, m.mp, m.maxMp, '#4488cc', '#222', `${m.mp}/${m.maxMp}`);
      });
    }
    // Gold
    r.drawText(`💰 ${this.game.party?.gold || 0}g`, W - 130, H - 75, '#ffdd44', 16, 'left', 'monospace', true);
    r.drawText(`Floor ${this.game.currentFloor}`, W - 130, H - 54, '#aaaacc', 14);
    // Message
    if (this.messageTimer > 0) {
      const alpha = Math.min(1, this.messageTimer);
      ctx.save();
      ctx.globalAlpha = alpha;
      r.drawRoundRect(W/2-250, H-155, 500, 35, 6, '#1a1a3a', '#5566aa', 1);
      r.drawTextCentered(this.message, W/2, H-147, '#ffffff', 15);
      ctx.restore();
    }
    // Controls hint
    r.drawText('WASD: Move  Enter: Interact  I: Inventory  ESC: Menu', 10, H-30, '#555566', 13);
  }
}
