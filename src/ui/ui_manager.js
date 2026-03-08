import { GAME_STATES } from '../engine/game.js';
import { MainMenu } from './main_menu.js';
import { PartyCreation } from './party_creation.js';
import { TownUI } from './town_ui.js';
import { DungeonUI } from './dungeon_ui.js';
import { BattleUI } from './battle_ui.js';
import { InventoryUI } from './inventory_ui.js';
import { ShopUI } from './shop_ui.js';
import { CraftingUI } from './crafting_ui.js';
import { HUD } from './hud.js';
import { OverworldUI } from './overworld_ui.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.screens = {};
    this.currentScreen = null;
    this.hud = null;
    this._initScreens();
  }

  _initScreens() {
    this.screens[GAME_STATES.MAIN_MENU]      = new MainMenu(this.game);
    this.screens[GAME_STATES.PARTY_CREATION] = new PartyCreation(this.game);
    this.screens[GAME_STATES.OVERWORLD]      = new OverworldUI(this.game);
    this.screens[GAME_STATES.TOWN]           = new TownUI(this.game);
    this.screens[GAME_STATES.DUNGEON]        = new DungeonUI(this.game);
    this.screens[GAME_STATES.BATTLE]         = new BattleUI(this.game);
    this.screens[GAME_STATES.INVENTORY]      = new InventoryUI(this.game);
    this.screens[GAME_STATES.SHOP]           = new ShopUI(this.game);
    this.screens[GAME_STATES.CRAFTING]       = new CraftingUI(this.game);
    this.screens[GAME_STATES.HOW_TO_PLAY]    = new HowToPlayScreen(this.game);
    this.screens[GAME_STATES.LEVEL_UP]       = new LevelUpScreen(this.game);
    this.screens[GAME_STATES.GAME_OVER]      = new GameOverScreen(this.game);
    this.hud = new HUD(this.game);
  }

  setState(state, data = {}) {
    if (this.currentScreen && this.currentScreen.onExit) this.currentScreen.onExit();
    this.currentScreen = this.screens[state] || null;
    if (this.currentScreen && this.currentScreen.onEnter) this.currentScreen.onEnter(data);
  }

  update(dt) {
    if (this.currentScreen && this.currentScreen.update) {
      this.currentScreen.update(dt);
    }
  }

  render(renderer) {
    if (this.currentScreen && this.currentScreen.render) {
      this.currentScreen.render(renderer);
    }
    // HUD overlay for dungeon/battle
    const state = this.game.state;
    if ([GAME_STATES.DUNGEON, GAME_STATES.TOWN].includes(state) && this.game.party) {
      this.hud.render(renderer);
    }
  }
}

// Inline simple screens
class HowToPlayScreen {
  constructor(game) { this.game = game; }
  onEnter() {}
  update(dt) {
    if (this.game.input.isKeyJustPressed('Escape') || this.game.input.wasClicked()) {
      this.game.setState('MAIN_MENU');
    }
  }
  render(r) {
    r.drawGradientBG(0,0,r.width,r.height,'#0a0a1f','#1a0a2f');
    r.drawTextCentered('HOW TO PLAY', r.width/2, 40, '#ffdd88', 32, 'monospace', true);
    const lines = [
      'MOVEMENT: WASD or Arrow Keys',
      'CONFIRM / INTERACT: Enter or Space',
      'BACK / PAUSE: Escape',
      'INVENTORY: I key',
      'MINIMAP TOGGLE: M key',
      'CYCLE PARTY: Q / E',
      '',
      'OVERWORLD (3D Isometric View):',
      '  Explore the world to find towns, caves & hidden secrets',
      '  Walk onto a TOWN tile to enter the town',
      '  Walk onto a CAVE tile to enter the dungeon',
      '  Hidden treasures glow gold — walk over them to collect!',
      '  Ancient Ruins grant stat bonuses and experience',
      '  Encounter rate is LOW on the overworld',
      '',
      'CAVE / DUNGEON:',
      '  Encounter rate is HIGH — fight often to gain strength',
      '  Each floor ends with a mandatory BOSS fight',
      '  Defeat the boss to unlock the stairs down (▼)',
      '  Walk on stairs (▲) to escape back to the overworld',
      '  Treasure chests, healing fountains & traps inside',
      '',
      'BATTLE:',
      '  Click/select actions from the menu',
      '  Attack: Basic weapon attack',
      '  Skill: Use class abilities (costs MP)',
      '  Item: Use consumables from inventory',
      '  Defend: Halve damage until your next turn',
      '  Flee: 50% chance to escape (not available vs bosses)',
      '',
      'TOWN:',
      '  Visit shops to buy equipment and supplies',
      '  Rest at the Inn to fully restore HP/MP',
      '  Use the Crafting Station to forge items',
      '  Press ESC to leave town and return to the overworld',
      '',
      'Press any key or click to return...'
    ];
    lines.forEach((line, i) => {
      r.drawText(line, 80, 100 + i * 22, '#ccccff', 16);
    });
  }
}

class LevelUpScreen {
  constructor(game) { this.game = game; this.data = null; this.timer = 0; }
  onEnter(data) { this.data = data; this.timer = 0; }
  update(dt) {
    this.timer += dt;
    if (this.timer > 5 || this.game.input.wasClicked() || this.game.input.isKeyJustPressed('Enter') || this.game.input.isKeyJustPressed('Space')) {
      // Return to the correct state after level up
      const returnState = (this.data && this.data.returnToState) ? this.data.returnToState : 'DUNGEON';
      this.game.setState(returnState);
    }
  }
  render(r) {
    r.drawGradientBG(0,0,r.width,r.height,'#0a0a1f','#1a1a3f');
    r.drawTextCentered('✨ LEVEL UP! ✨', r.width/2, 60, '#ffdd44', 40, 'monospace', true);
    const data = this.data;
    if (!data) return;
    let y = 130;
    if (data.totalExp !== undefined) {
      r.drawTextCentered(`+${data.totalExp} EXP  +${data.totalGold} Gold`, r.width/2, y, '#aaffaa', 22);
      y += 40;
    }
    if (data.levelUps) {
      data.levelUps.forEach(lu => {
        const char = lu.character;
        r.drawTextCentered(`${char.name} is now Level ${char.level}!`, r.width/2, y, '#ffee88', 24, 'monospace', true);
        y += 32;
        lu.levelUps.forEach(lv => {
          if (lv.newSkills && lv.newSkills.length > 0) {
            lv.newSkills.forEach(sId => {
              r.drawTextCentered(`  Learned: ${sId.replace(/_/g,' ').toUpperCase()}`, r.width/2, y, '#aaddff', 18);
              y += 24;
            });
          }
        });
        y += 10;
      });
    }
    if (data.drops && data.drops.length > 0) {
      y += 10;
      r.drawTextCentered('Loot:', r.width/2, y, '#ffcc44', 20, 'monospace', true);
      y += 28;
      data.drops.forEach(id => {
        r.drawTextCentered(`  • ${id.replace(/_/g,' ')}`, r.width/2, y, '#cccccc', 16);
        y += 22;
      });
    }
    r.drawTextCentered('Click or press Enter to continue...', r.width/2, r.height - 50, '#888888', 16);
  }
}

class GameOverScreen {
  constructor(game) { this.game = game; }
  onEnter() {}
  update(dt) {
    const input = this.game.input;
    const W = this.game.canvas.width, H = this.game.canvas.height;
    if (input.isClickIn(W/2-100, H/2+20, 200, 45)) {
      // Reload from save
      if (this.game.hasSave()) {
        this.game.loadGame();
      } else {
        this.game.newGame();
      }
    }
    if (input.isClickIn(W/2-100, H/2+80, 200, 45)) {
      this.game.setState('MAIN_MENU');
    }
    if (input.isKeyJustPressed('Escape')) this.game.setState('MAIN_MENU');
  }
  render(r) {
    r.drawGradientBG(0,0,r.width,r.height,'#110000','#330000');
    r.drawTextCentered('GAME OVER', r.width/2, r.height/2 - 100, '#ff4444', 60, 'monospace', true);
    r.drawTextCentered('The party has fallen...', r.width/2, r.height/2 - 30, '#cc8888', 22);
    const W = r.width;
    const hovLoad = this.game.input.isMouseOver(W/2-100, r.height/2+20, 200, 45);
    r.drawButton(W/2-100, r.height/2+20, 200, 45, this.game.hasSave() ? 'Load Save' : 'New Game', hovLoad);
    const hovMenu = this.game.input.isMouseOver(W/2-100, r.height/2+80, 200, 45);
    r.drawButton(W/2-100, r.height/2+80, 200, 45, 'Main Menu', hovMenu);
  }
}
