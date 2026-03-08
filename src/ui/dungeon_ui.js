import { TILE, TILE_COLORS, TILE_WALKABLE, MINIMAP_COLORS } from '../world/tile.js';
import { DungeonGenerator } from '../world/dungeon_generator.js';
import { Enemy } from '../entities/enemy.js';

export class DungeonUI {
  constructor(game) {
    this.game = game;
    this.tileSize = 24;
    this.showMinimap = true;
    this.animTime = 0;
    this.moveDelay = 0;
    this.message = '';
    this.messageTimer = 0;
    this.battleResult = null;
    this.stepCounter = 0;
    this.openChests = new Set();
    this.usedFountains = new Set();
    this.gen = new DungeonGenerator();
    // Track whether the floor boss has been defeated (required to descend)
    this.bossDefeated = false;
    this.fromOverworld = false;
  }

  onEnter(data) {
    if (data && data.fromOverworld) {
      this.fromOverworld = true;
      this.bossDefeated = false;
      this.openChests.clear();
      this.usedFountains.clear();
    }
    if (data && data.battleResult) {
      const br = data.battleResult;
      const parts = [];
      if (br.totalExp) parts.push(`+${br.totalExp} EXP`);
      if (br.totalGold) parts.push(`+${br.totalGold} Gold`);
      if (br.drops && br.drops.length > 0) parts.push(`Loot: ${br.drops.join(', ')}`);
      if (parts.length > 0) {
        this.message = parts.join('  ');
        this.messageTimer = 3;
      }
    }
    // After a boss victory, mark the boss as defeated so stairs unlock
    if (data && data.wasBoss) {
      this.bossDefeated = true;
      this.message = `Floor ${this.game.currentFloor} boss defeated! Stairs unlocked!`;
      this.messageTimer = 3;
    }
    const dungeon = this.game.dungeon;
    if (dungeon && this.game.party) {
      this.gen.updateFogOfWar(dungeon.fog, this.game.party.x, this.game.party.y);
    }
  }

  update(dt) {
    this.animTime += dt;
    this.moveDelay = Math.max(0, this.moveDelay - dt);
    if (this.messageTimer > 0) this.messageTimer -= dt;
    const input = this.game.input;
    if (input.isKeyJustPressed('KeyI')) { this.game.openInventory('DUNGEON'); return; }
    if (input.isKeyJustPressed('KeyM')) { this.showMinimap = !this.showMinimap; }
    if (input.isKeyJustPressed('Escape')) {
      // Return to overworld if we came from there, otherwise legacy town path
      if (this.fromOverworld && this.game.overworld) {
        this.game.enterOverworld({ fromCave: true, restorePos: { x: this.game.caveEntryX, y: this.game.caveEntryY } });
      } else {
        this.game.enterTown();
      }
      return;
    }
    if (this.moveDelay > 0) return;
    const { dx, dy } = input.getMoveDir();
    if (dx !== 0 || dy !== 0) {
      this._tryMove(dx, dy);
    }
  }

  _tryMove(dx, dy) {
    const dungeon = this.game.dungeon;
    const party = this.game.party;
    if (!dungeon || !party) return;
    const nx = party.x + dx, ny = party.y + dy;
    if (nx < 0 || ny < 0 || nx >= dungeon.width || ny >= dungeon.height) return;
    const tile = dungeon.grid[ny][nx];
    if (!TILE_WALKABLE[tile]) { this.moveDelay = 0.08; return; }
    // Approaching stairs-down while boss is not yet defeated → trigger boss fight
    if (tile === TILE.STAIRS_DOWN && !this.bossDefeated) {
      party.x = nx;
      party.y = ny;
      this.moveDelay = 0.3;
      this.gen.updateFogOfWar(dungeon.fog, nx, ny);
      this.message = `Floor ${dungeon.floor} boss approaches!`;
      this.messageTimer = 1.5;
      const enemies = Enemy.generateEncounter(dungeon.floor, true);
      if (enemies.length > 0) {
        setTimeout(() => this.game.startBattle(enemies, true), 800);
      } else {
        this.bossDefeated = true;
      }
      return;
    }
    // Move
    party.x = nx;
    party.y = ny;
    this.moveDelay = 0.15;
    this.stepCounter++;
    // Update fog
    this.gen.updateFogOfWar(dungeon.fog, nx, ny);
    // Check tile interactions
    this._checkTileInteraction(nx, ny, tile);
    // Cave encounters: higher rate than overworld — every 3-6 steps
    if (this.stepCounter % (3 + Math.floor(Math.random() * 4)) === 0 && tile === TILE.FLOOR) {
      this._triggerRandomEncounter();
    }
  }

  _checkTileInteraction(x, y, tile) {
    const key = `${x},${y}`;
    if (tile === TILE.STAIRS_DOWN) {
      // Boss defeated; descend
      this._goDeeper();
    } else if (tile === TILE.STAIRS_UP) {
      if (this.fromOverworld && this.game.overworld) {
        this.game.enterOverworld({ fromCave: true, restorePos: { x: this.game.caveEntryX, y: this.game.caveEntryY } });
      } else {
        this.game.enterTown();
      }
    } else if (tile === TILE.TREASURE_CHEST && !this.openChests.has(key)) {
      this.openChests.add(key);
      this._openTreasure(x, y);
    } else if (tile === TILE.HEALING_FOUNTAIN && !this.usedFountains.has(key)) {
      this.usedFountains.add(key);
      this._healParty();
    } else if (tile === TILE.TRAP) {
      this._triggerTrap();
    } else if (tile === TILE.CRAFTING_STATION) {
      this.game.openCrafting('DUNGEON');
    } else if (tile === TILE.SHOP) {
      const shopTypes = ['weapon','potion','material'];
      this.game.openShop(shopTypes[Math.floor(Math.random() * shopTypes.length)]);
    }
  }

  _goDeeper() {
    this.game.currentFloor++;
    this.bossDefeated = false;
    this.openChests.clear();
    this.usedFountains.clear();
    this.game.generateFloor(this.game.currentFloor);
    this.message = `Descended to Floor ${this.game.currentFloor}!`;
    this.messageTimer = 2;
    // Boss appears at the end of every floor — spawned automatically on the new floor
    const enemies = Enemy.generateEncounter(this.game.currentFloor, true);
    if (enemies.length > 0) {
      this.message = `Floor ${this.game.currentFloor} — a powerful boss lurks here!`;
      this.messageTimer = 2;
    }
  }

  _openTreasure(x, y) {
    const party = this.game.party;
    const floor = this.game.currentFloor;
    const gold = Math.round((10 + floor * 5) * (0.7 + Math.random() * 0.6));
    party.gold += gold;
    // Random item
    const possibleItems = ['health_potion','mana_potion','iron_ingot','fire_ruby','aqua_pearl','volt_shard','terra_stone'];
    const higherItems = ['steel_ingot','mithril_ingot','scroll_mastery','scroll_precision'];
    const pool = floor >= 10 ? [...possibleItems, ...higherItems] : possibleItems;
    const item = pool[Math.floor(Math.random() * pool.length)];
    party.inventory.addItem(item, 1);
    this.message = `Found chest: ${gold}g and ${item.replace(/_/g,' ')}!`;
    this.messageTimer = 2.5;
    // Mark chest as opened in grid
    this.game.dungeon.grid[y][x] = TILE.FLOOR;
  }

  _healParty() {
    const party = this.game.party;
    party.members.forEach(m => {
      if (m.alive) {
        m.hp = Math.min(m.maxHp, m.hp + Math.round(m.maxHp * 0.4));
        m.mp = Math.min(m.maxMp, m.mp + Math.round(m.maxMp * 0.3));
      }
    });
    this.message = 'The healing fountain restores your party! (+40% HP, +30% MP)';
    this.messageTimer = 2.5;
  }

  _triggerTrap() {
    const party = this.game.party;
    const floor = this.game.currentFloor;
    const dmg = 5 + floor * 3;
    const target = party.aliveMembers[Math.floor(Math.random() * party.aliveMembers.length)];
    if (target) {
      target.takeDamage(dmg);
      this.message = `Trap! ${target.name} takes ${dmg} damage!`;
      this.messageTimer = 2;
      if (!this.game.isAlive()) { this.game.gameOver(); }
    }
  }

  _triggerRandomEncounter() {
    const floor = this.game.currentFloor;
    const enemies = Enemy.generateEncounter(floor);
    if (enemies.length > 0) {
      this.game.startBattle(enemies, false);
    }
  }

  render(r) {
    const W = r.width, H = r.height;
    const dungeon = this.game.dungeon;
    const party = this.game.party;
    if (!dungeon || !party) {
      r.drawTextCentered('Loading dungeon...', W/2, H/2, '#ffffff', 24);
      return;
    }
    const ts = this.tileSize;
    const camX = party.x * ts - W/2 + ts/2;
    const camY = party.y * ts - (H-100)/2 + ts/2;
    // Draw tiles
    for (let ty = 0; ty < dungeon.height; ty++) {
      for (let tx = 0; tx < dungeon.width; tx++) {
        const sx = tx * ts - camX, sy = ty * ts - camY;
        if (sx < -ts || sx > W || sy < -ts || sy > H - 80) continue;
        const fog = dungeon.fog[ty]?.[tx] ?? 0;
        if (fog === 0) {
          r.drawRect(sx, sy, ts, ts, '#000000');
          continue;
        }
        const tile = dungeon.grid[ty][tx];
        const baseColor = TILE_COLORS[tile] || '#1e1e2e';
        const alpha = fog === 1 ? 0.45 : 1.0;
        r.ctx.save();
        r.ctx.globalAlpha = alpha;
        r.drawRect(sx, sy, ts, ts, tile === TILE.WALL ? '#0d0d1a' : '#1e1e2e');
        if (tile !== TILE.WALL) {
          r.drawRect(sx, sy, ts, ts, baseColor + '44');
          // Draw special tiles
          r.ctx.fillStyle = baseColor;
          if (tile === TILE.STAIRS_DOWN) {
            r.ctx.font = `${ts*0.7}px monospace`; r.ctx.textAlign = 'center'; r.ctx.textBaseline = 'middle';
            if (!this.bossDefeated) {
              // Locked — show red lock symbol
              r.ctx.fillStyle = '#ff4444';
              r.ctx.fillText('🔒', sx + ts/2, sy + ts/2);
            } else {
              r.ctx.fillText('▼', sx + ts/2, sy + ts/2);
            }
          } else if (tile === TILE.STAIRS_UP) {
            r.ctx.font = `${ts*0.7}px monospace`; r.ctx.textAlign = 'center'; r.ctx.textBaseline = 'middle';
            r.ctx.fillText('▲', sx + ts/2, sy + ts/2);
          } else if (tile === TILE.TREASURE_CHEST) {
            r.ctx.fillStyle = '#ffdd44';
            r.ctx.fillRect(sx+4, sy+6, ts-8, ts-10);
            r.ctx.fillStyle = '#aa6600';
            r.ctx.fillRect(sx+4, sy+6, ts-8, 5);
          } else if (tile === TILE.HEALING_FOUNTAIN) {
            r.ctx.fillStyle = '#44ffaa';
            r.ctx.beginPath(); r.ctx.arc(sx+ts/2, sy+ts/2, ts*0.35, 0, Math.PI*2); r.ctx.fill();
            r.ctx.fillStyle = '#00ddff';
            r.ctx.font = `${ts*0.5}px monospace`; r.ctx.textAlign = 'center'; r.ctx.textBaseline = 'middle';
            r.ctx.fillText('+', sx+ts/2, sy+ts/2);
          } else if (tile === TILE.CRAFTING_STATION) {
            r.ctx.fillStyle = '#cc44ff';
            r.ctx.fillRect(sx+4, sy+4, ts-8, ts-8);
            r.ctx.fillStyle = '#ffffff';
            r.ctx.font = `${ts*0.5}px monospace`; r.ctx.textAlign = 'center'; r.ctx.textBaseline = 'middle';
            r.ctx.fillText('⚒', sx+ts/2, sy+ts/2);
          } else if (tile === TILE.SHOP) {
            r.ctx.fillStyle = '#44aaff';
            r.ctx.fillRect(sx+4, sy+4, ts-8, ts-8);
            r.ctx.fillStyle = '#ffffff';
            r.ctx.font = `${ts*0.5}px monospace`; r.ctx.textAlign = 'center'; r.ctx.textBaseline = 'middle';
            r.ctx.fillText('$', sx+ts/2, sy+ts/2);
          } else if (tile === TILE.TRAP) {
            r.ctx.fillStyle = '#ff440033'; r.ctx.fillRect(sx, sy, ts, ts);
            r.ctx.fillStyle = '#ff2200';
            r.ctx.font = `${ts*0.5}px monospace`; r.ctx.textAlign = 'center'; r.ctx.textBaseline = 'middle';
            r.ctx.fillText('!', sx+ts/2, sy+ts/2);
          } else if (tile === TILE.DOOR) {
            r.ctx.fillStyle = '#5a3a1a'; r.ctx.fillRect(sx+ts*0.3, sy+2, ts*0.4, ts-4);
          }
          // Wall top border
          r.ctx.strokeStyle = 'rgba(255,255,255,0.04)'; r.ctx.lineWidth = 0.5;
          r.ctx.strokeRect(sx, sy, ts, ts);
        } else {
          // Wall texture
          r.ctx.fillStyle = '#151530'; r.ctx.fillRect(sx+1, sy+1, ts-2, ts-2);
          r.ctx.fillStyle = '#0d0d20'; r.ctx.fillRect(sx+3, sy+3, ts-6, ts-6);
        }
        r.ctx.restore();
      }
    }
    // Draw party marker
    const px = party.x * ts - camX, py = party.y * ts - camY;
    const bob = Math.sin(this.animTime * 3) * 2;
    r.drawRect(px+ts*0.2, py+ts*0.1+bob, ts*0.6, ts*0.7, '#4488ff');
    r.ctx.fillStyle = '#ffcc99';
    r.ctx.beginPath(); r.ctx.arc(px+ts/2, py+ts*0.2+bob, ts*0.18, 0, Math.PI*2); r.ctx.fill();
    // Party glow
    r.ctx.save();
    r.ctx.globalAlpha = 0.3;
    r.ctx.fillStyle = '#4488ff';
    r.ctx.beginPath(); r.ctx.arc(px+ts/2, py+ts/2, ts*0.7, 0, Math.PI*2); r.ctx.fill();
    r.ctx.restore();
    // Bottom HUD
    r.drawRoundRect(0, H-85, W, 85, 0, 'rgba(0,0,10,0.9)', '#223', 1);
    party.members.forEach((m, i) => {
      const bx = 10 + i * 195;
      const alive = m.alive;
      r.drawText(`${m.name} Lv${m.level}`, bx, H-80, alive ? '#ffffff' : '#664444', 12, 'left', 'monospace', true);
      r.drawBar(bx, H-62, 175, 10, m.hp, m.maxHp, m.hp/m.maxHp < 0.3 ? '#ff4444' : '#44aa44');
      r.drawText(`${m.hp}/${m.maxHp}`, bx+178, H-63, '#aaaacc', 10);
      r.drawBar(bx, H-48, 175, 10, m.mp, m.maxMp, '#4488cc');
      r.drawText(`${m.mp}/${m.maxMp}`, bx+178, H-49, '#aaaacc', 10);
      // Status icons
      m.statusEffects.forEach((e, si) => {
        r.drawText(e.id.slice(0,3), bx + si*22, H-35, '#ffaa44', 10);
      });
    });
    r.drawText(`💰 ${party.gold}g`, W-150, H-75, '#ffdd44', 15, 'left', 'monospace', true);
    const bossStatus = this.bossDefeated ? '✓ Boss Slain' : '⚠ Boss Awaits';
    const bossColor  = this.bossDefeated ? '#44ff88' : '#ff4444';
    r.drawText(`Floor ${dungeon.floor}  ${bossStatus}`, W-200, H-55, bossColor, 13, 'left', 'monospace', true);
    r.drawText(`(${party.x},${party.y})`, W-150, H-38, '#666677', 12);
    // Minimap
    if (this.showMinimap) {
      this._renderMinimap(r, W, dungeon, party);
    }
    // Message
    if (this.messageTimer > 0) {
      const alpha = Math.min(1, this.messageTimer * 2);
      r.ctx.save(); r.ctx.globalAlpha = alpha;
      r.drawRoundRect(W/2 - 280, 20, 560, 36, 6, '#0a0a2a', '#5566aa', 1);
      r.drawTextCentered(this.message, W/2, 29, '#ffffff', 15);
      r.ctx.restore();
    }
    // Controls
    r.drawText('WASD:Move  I:Inventory  M:Minimap  ESC:Overworld', 10, 10, '#445566', 12);
  }

  _renderMinimap(r, W, dungeon, party) {
    const mmSize = 150, tileS = 3;
    const mmX = W - mmSize - 10, mmY = 10;
    r.drawRoundRect(mmX-2, mmY-2, mmSize+4, mmSize+4, 3, 'rgba(0,0,0,0.8)', '#445566', 1);
    // Center on party
    const startTX = party.x - Math.floor(mmSize / tileS / 2);
    const startTY = party.y - Math.floor(mmSize / tileS / 2);
    for (let ty = 0; ty < mmSize / tileS; ty++) {
      for (let tx = 0; tx < mmSize / tileS; tx++) {
        const gx = startTX + tx, gy = startTY + ty;
        if (gx < 0 || gy < 0 || gx >= dungeon.width || gy >= dungeon.height) continue;
        const fog = dungeon.fog[gy]?.[gx] ?? 0;
        if (fog === 0) continue;
        const tile = dungeon.grid[gy][gx];
        const col = MINIMAP_COLORS[tile] || '#334455';
        const alpha = fog === 1 ? 0.5 : 1;
        r.ctx.save(); r.ctx.globalAlpha = alpha;
        r.drawRect(mmX + tx * tileS, mmY + ty * tileS, tileS, tileS, col);
        r.ctx.restore();
      }
    }
    // Party dot
    const pdx = (party.x - startTX) * tileS + mmX;
    const pdy = (party.y - startTY) * tileS + mmY;
    r.drawRect(pdx, pdy, tileS+1, tileS+1, '#ffffff');
  }
}
