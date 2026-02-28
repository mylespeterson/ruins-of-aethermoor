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
    // Draw terrain
    for (let ty = 0; ty < town.height; ty++) {
      for (let tx = 0; tx < town.width; tx++) {
        const sx = tx * ts - camX, sy = ty * ts - camY;
        if (sx < -ts || sx > W || sy < -ts || sy > H) continue;
        const cell = town.grid[ty][tx];
        const colors = ['#2a4a1a','#2a4a1a','#4a4a3a','#5a5a4a'];
        r.drawRect(sx, sy, ts, ts, colors[cell] || '#2a4a1a');
        // Grid lines
        const ctx = r.ctx;
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.5;
        ctx.strokeRect(sx, sy, ts, ts);
      }
    }
    // Draw buildings
    town.buildings.forEach(b => {
      const sx = b.x * ts - camX, sy = b.y * ts - camY;
      const bw = b.w * ts, bh = b.h * ts;
      // Building body
      r.drawRoundRect(sx+1, sy+1, bw-2, bh-2, 4, b.color, b.roofColor, 2);
      // Roof
      r.drawRoundRect(sx+1, sy+1, bw-2, ts*0.6, 4, b.roofColor, b.roofColor, 0);
      // Door
      r.drawRect(sx + bw/2 - 8, sy + bh - ts*0.7, 16, ts*0.6, '#332211');
      // Name label
      r.drawTextCentered(b.name, sx + bw/2, sy + bh/2 - 8, '#ffffff', 11, 'monospace', true);
    });
    // NPC decorations
    const npcBob = Math.sin(this.animTime * 2) * 2;
    // Well position
    const wellX = 13 * ts - camX, wellY = 9 * ts - camY;
    r.drawRect(wellX + 4, wellY + 4, ts - 8, ts - 8, '#664422');
    r.drawRect(wellX + 8, wellY + 8, ts - 16, ts - 16, '#222244');
    // Draw player
    const px = this.playerX * ts - camX;
    const py = this.playerY * ts - camY;
    // Shadow
    r.drawRect(px + 6, py + ts - 8, ts - 12, 6, 'rgba(0,0,0,0.3)');
    // Body
    r.drawRect(px + 8, py + 10 + npcBob, ts - 16, ts - 18, '#4466cc');
    // Head
    r.ctx.fillStyle = '#ffcc99';
    r.ctx.beginPath();
    r.ctx.arc(px + ts/2, py + 8 + npcBob, 8, 0, Math.PI*2);
    r.ctx.fill();
    // Direction indicator
    const arrowColors = { up:'#8888ff', down:'#8888ff', left:'#8888ff', right:'#8888ff' };
    r.ctx.fillStyle = arrowColors[this.facing];
    r.ctx.beginPath();
    if (this.facing === 'down') { r.ctx.moveTo(px+12, py+ts-2); r.ctx.lineTo(px+ts/2, py+ts+4); r.ctx.lineTo(px+ts-12, py+ts-2); }
    else if (this.facing === 'up') { r.ctx.moveTo(px+12, py+4); r.ctx.lineTo(px+ts/2, py-2); r.ctx.lineTo(px+ts-12, py+4); }
    r.ctx.closePath(); r.ctx.fill();
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
      r.ctx.save();
      r.ctx.globalAlpha = alpha;
      r.drawRoundRect(W/2-250, H-155, 500, 35, 6, '#1a1a3a', '#5566aa', 1);
      r.drawTextCentered(this.message, W/2, H-147, '#ffffff', 15);
      r.ctx.restore();
    }
    // Controls hint
    r.drawText('WASD: Move  Enter: Interact  I: Inventory  ESC: Menu', 10, H-30, '#555566', 13);
  }
}
