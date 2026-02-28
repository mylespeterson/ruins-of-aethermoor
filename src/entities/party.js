import { Character } from './character.js';
import { Inventory } from '../systems/inventory.js';

export class Party {
  constructor() {
    this.members = [];
    this.gold = 200;
    this.inventory = new Inventory();
    this.x = 0;
    this.y = 0;
    this.facing = 'down';
    // Give starting items
    this.inventory.addItem('health_potion', 3);
    this.inventory.addItem('mana_potion', 2);
  }

  addMember(character) {
    if (this.members.length < 4) {
      this.members.push(character);
      return true;
    }
    return false;
  }

  removeMember(index) {
    return this.members.splice(index, 1)[0];
  }

  get leader() {
    return this.members[0] || null;
  }

  get aliveMembers() {
    return this.members.filter(m => m.alive);
  }

  isAlive() {
    return this.members.some(m => m.alive);
  }

  giveExp(totalExp) {
    const perMember = Math.round(totalExp / Math.max(1, this.aliveMembers.length));
    const allLevelUps = [];
    this.members.forEach(member => {
      if (member.alive) {
        const levelUps = member.giveExp(perMember);
        if (levelUps && levelUps.length > 0) {
          allLevelUps.push({ character: member, levelUps });
        }
      }
    });
    return allLevelUps;
  }

  restAtInn(gold) {
    if (this.gold < gold) return false;
    this.gold -= gold;
    this.members.forEach(m => m.fullRestore());
    return true;
  }

  fullRestore() {
    this.members.forEach(m => m.fullRestore());
  }

  postBattle() {
    this.members.forEach(m => m.postBattleRestore());
  }

  getAverageLevel() {
    if (this.members.length === 0) return 1;
    return Math.round(this.members.reduce((s, m) => s + m.level, 0) / this.members.length);
  }

  serialize() {
    return {
      members: this.members.map(m => m.serialize()),
      gold: this.gold,
      inventory: this.inventory.serialize(),
      x: this.x, y: this.y
    };
  }

  static deserialize(data) {
    const party = new Party();
    party.members = data.members.map(m => Character.deserialize(m));
    party.gold = data.gold;
    party.inventory = Inventory.deserialize(data.inventory);
    party.x = data.x || 0;
    party.y = data.y || 0;
    return party;
  }
}
