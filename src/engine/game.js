import { UIManager } from '../ui/ui_manager.js';
import { InputHandler } from './input.js';
import { Renderer } from './renderer.js';
import { SaveSystem } from '../systems/save_system.js';
import { DungeonGenerator } from '../world/dungeon_generator.js';
import { Town } from '../world/town.js';
import { Party } from '../entities/party.js';

export const GAME_STATES = {
  MAIN_MENU: 'MAIN_MENU',
  PARTY_CREATION: 'PARTY_CREATION',
  TOWN: 'TOWN',
  DUNGEON: 'DUNGEON',
  BATTLE: 'BATTLE',
  INVENTORY: 'INVENTORY',
  CRAFTING: 'CRAFTING',
  SHOP: 'SHOP',
  MAGIC: 'MAGIC',
  GAME_OVER: 'GAME_OVER',
  LEVEL_UP: 'LEVEL_UP',
  HOW_TO_PLAY: 'HOW_TO_PLAY'
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.renderer = new Renderer(this.ctx);
    this.input = new InputHandler(canvas);
    this.uiManager = new UIManager(this);
    this.saveSystem = new SaveSystem();
    this.state = GAME_STATES.MAIN_MENU;
    this.previousState = null;
    // Game data
    this.party = null;
    this.currentFloor = 1;
    this.dungeon = null;
    this.town = new Town();
    this.currentBattle = null;
    this.currentShop = null;
    this.pendingLevelUps = [];
    this.shopTierFloor = 0;
    this.defeatedBosses = [];
    this.lastTime = 0;
    this.animFrame = 0;
    this.running = false;
  }

  start() {
    this.running = true;
    this.uiManager.setState(GAME_STATES.MAIN_MENU);
    requestAnimationFrame(t => this.loop(t));
  }

  loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.animFrame += dt;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.loop(t));
  }

  update(dt) {
    this.uiManager.update(dt);
    this.input.endFrame();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.uiManager.render(this.renderer);
  }

  setState(newState, data = {}) {
    this.previousState = this.state;
    this.state = newState;
    this.uiManager.setState(newState, data);
  }

  goBack() {
    if (this.previousState) {
      this.setState(this.previousState);
    }
  }

  newGame() {
    this.party = null;
    this.currentFloor = 1;
    this.dungeon = null;
    this.currentBattle = null;
    this.currentShop = null;
    this.pendingLevelUps = [];
    this.shopTierFloor = 0;
    this.defeatedBosses = [];
    this.setState(GAME_STATES.PARTY_CREATION);
  }

  startDungeon() {
    this.generateFloor(this.currentFloor);
    this.setState(GAME_STATES.DUNGEON);
  }

  generateFloor(floor) {
    const gen = new DungeonGenerator();
    this.dungeon = gen.generate(floor);
    this.dungeon.floor = floor;
    // Place party at starting position
    const start = this.dungeon.startPos;
    if (this.party) {
      this.party.x = start.x;
      this.party.y = start.y;
    }
  }

  enterTown() {
    // Auto-save
    if (this.party) {
      this.saveSystem.save(this.getSaveData());
    }
    this.setState(GAME_STATES.TOWN);
  }

  startBattle(enemies, isBoss = false) {
    this.currentBattle = { enemies, isBoss, turn: 0 };
    this.setState(GAME_STATES.BATTLE, { enemies, isBoss });
  }

  endBattle(victory) {
    if (victory) {
      // Distribute loot
      const battle = this.currentBattle;
      let totalExp = 0;
      let totalGold = 0;
      const drops = [];
      if (battle && battle.enemies) {
        battle.enemies.forEach(e => {
          totalExp += e.expReward || 0;
          totalGold += e.goldReward || 0;
          if (e.drops) {
            e.drops.forEach(d => {
              if (Math.random() < d.chance) drops.push(d.id);
            });
          }
        });
      }
      totalExp = Math.round(totalExp * (1 + this.currentFloor * 0.05));
      this.party.gold += totalGold;
      drops.forEach(id => this.party.inventory.addItem(id, 1));
      // Give EXP
      const levelUps = this.party.giveExp(totalExp);
      this.currentBattle = null;
      if (levelUps && levelUps.length > 0) {
        this.pendingLevelUps = levelUps;
        this.setState(GAME_STATES.LEVEL_UP, { levelUps, totalExp, totalGold, drops });
      } else {
        this.setState(GAME_STATES.DUNGEON, { battleResult: { totalExp, totalGold, drops } });
      }
    } else {
      this.currentBattle = null;
      this.setState(GAME_STATES.GAME_OVER);
    }
  }

  openShop(shopType) {
    this.currentShop = shopType;
    this.setState(GAME_STATES.SHOP, { shopType });
  }

  openCrafting(returnState = 'TOWN') {
    this.setState(GAME_STATES.CRAFTING, { returnState });
  }

  openInventory(returnState) {
    this.setState(GAME_STATES.INVENTORY, { returnState: returnState || this.state });
  }

  hasSave() {
    return this.saveSystem.hasSave();
  }

  loadGame() {
    const data = this.saveSystem.load();
    if (!data) return false;
    this.restoreFromSave(data);
    return true;
  }

  getSaveData() {
    return {
      party: this.party ? this.party.serialize() : null,
      currentFloor: this.currentFloor,
      shopTierFloor: this.shopTierFloor,
      defeatedBosses: this.defeatedBosses
    };
  }

  restoreFromSave(data) {
    this.currentFloor = data.currentFloor || 1;
    this.shopTierFloor = data.shopTierFloor || 0;
    this.defeatedBosses = data.defeatedBosses || [];
    if (data.party) {
      this.party = Party.deserialize(data.party);
    }
    this.enterTown();
  }

  gameOver() {
    this.setState(GAME_STATES.GAME_OVER);
  }

  isAlive() {
    return this.party && this.party.isAlive();
  }
}
