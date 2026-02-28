import { RACES } from '../data/races.js';
import { CLASSES } from '../data/classes.js';
import { SKILLS } from '../data/skills.js';

export class Character {
  constructor(name, raceId, classId) {
    this.name = name;
    this.raceId = raceId;
    this.classId = classId;
    this.level = 1;
    this.exp = 0;
    this.expToNext = 100;
    this.alive = true;
    this.usedRevive = false; // Undead passive
    this.usedDragonBreath = false; // Dragonborn passive
    this.equipment = { weapon: null, head: null, chest: null, legs: null, boots: null };
    this.learnedSkills = [];
    this.learnedSpells = [];
    this.statusEffects = [];
    this.summons = [];
    this.battleBuffs = [];
    this.frenzyStacks = 0;
    this.activeElement = 'fire'; // for elementalist
    this._initStats();
  }

  _initStats() {
    const race = RACES[this.raceId];
    const cls = CLASSES[this.classId];
    const mods = race.statMods;
    this.baseStr = cls.baseStats.str + (mods.str || 0);
    this.baseDex = cls.baseStats.dex + (mods.dex || 0);
    this.baseInt = cls.baseStats.int + (mods.int || 0);
    this.baseWis = cls.baseStats.wis + (mods.wis || 0);
    this.baseCon = cls.baseStats.con + (mods.con || 0);
    this.baseSpd = cls.baseStats.spd;
    const baseHp = Math.round(cls.baseStats.hp * race.hpMod);
    const baseMp = Math.round(cls.baseStats.mp * race.mpMod);
    this.maxHp = baseHp + this.baseCon * 5;
    this.maxMp = baseMp + this.baseInt * 2;
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    // Learn starting skills
    this._updateSkills();
  }

  get str() { return Math.max(1, this.baseStr + this._eqBonus('str') + this._buffBonus('str')); }
  get dex() { return Math.max(1, this.baseDex + this._eqBonus('dex') + this._buffBonus('dex')); }
  get int() { return Math.max(1, this.baseInt + this._eqBonus('int') + this._buffBonus('int')); }
  get wis() { return Math.max(1, this.baseWis + this._eqBonus('wis') + this._buffBonus('wis')); }
  get con() { return Math.max(1, this.baseCon + this._eqBonus('con') + this._buffBonus('con')); }
  get spd() { return Math.max(1, this.baseSpd + this._eqBonus('spd') + this._buffBonus('spd')); }
  get atk() { return this._eqBonus('atk') + this.str; }
  get def() { return this._eqBonus('def') + Math.floor(this.con / 2); }
  get critChance() { return 0.05 + this.dex / 100 + this._eqBonus('critChance'); }

  _eqBonus(stat) {
    let total = 0;
    Object.values(this.equipment).forEach(item => {
      if (item && item[stat]) total += item[stat];
    });
    return total;
  }

  _buffBonus(stat) {
    let total = 0;
    this.battleBuffs.forEach(buff => {
      if (buff.stats && buff.stats[stat]) total += buff.stats[stat];
    });
    return total;
  }

  _updateSkills() {
    const cls = CLASSES[this.classId];
    this.learnedSkills = cls.skills.filter(skillId => {
      const skill = SKILLS[skillId];
      return skill && skill.levelRequired <= this.level;
    });
  }

  levelUp() {
    this.level++;
    this.expToNext = this.level * 100;
    const cls = CLASSES[this.classId];
    const growth = cls.statGrowth;
    this.maxHp += growth.hp;
    this.maxMp += growth.mp;
    this.baseStr += growth.str;
    this.baseDex += growth.dex;
    this.baseInt += growth.int;
    this.baseWis += growth.wis;
    this.baseCon += growth.con;
    this.baseSpd += growth.spd;
    this.hp = Math.min(this.hp + growth.hp, this.maxHp);
    this.mp = Math.min(this.mp + growth.mp, this.maxMp);
    const prevSkills = [...this.learnedSkills];
    this._updateSkills();
    const newSkills = this.learnedSkills.filter(s => !prevSkills.includes(s));
    return newSkills;
  }

  giveExp(amount) {
    const race = RACES[this.raceId];
    const mult = race.passive.type === 'exp_bonus' ? 1 + race.passive.value : 1;
    amount = Math.round(amount * mult);
    this.exp += amount;
    const levelsGained = [];
    while (this.exp >= this.expToNext && this.level < 50) {
      this.exp -= this.expToNext;
      const newSkills = this.levelUp();
      levelsGained.push({ level: this.level, newSkills });
    }
    return levelsGained;
  }

  takeDamage(amount, source = '') {
    if (!this.alive) return 0;
    // Check defend buff
    const defending = this.battleBuffs.find(b => b.effect === 'defend');
    if (defending) amount = Math.round(amount * 0.5);
    // Armor reduction
    const effectiveDamage = Math.max(1, amount - Math.floor(this.def / 2));
    this.hp = Math.max(0, this.hp - effectiveDamage);
    if (this.hp <= 0) {
      // Check Undead passive
      const race = RACES[this.raceId];
      if (race.passive.type === 'revive' && !this.usedRevive) {
        this.usedRevive = true;
        this.hp = Math.round(this.maxHp * race.passive.value);
        return effectiveDamage;
      }
      this.alive = false;
      this.hp = 0;
    }
    return effectiveDamage;
  }

  heal(amount) {
    if (!this.alive) return 0;
    const race = RACES[this.raceId];
    const healMult = race.passive.type === 'heal_bonus' ? 1 + race.passive.value : 1;
    amount = Math.round(amount * healMult);
    const prev = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - prev;
  }

  restoreMp(amount) {
    const prev = this.mp;
    this.mp = Math.min(this.maxMp, this.mp + amount);
    return this.mp - prev;
  }

  revive(hpPercent = 0.25) {
    this.alive = true;
    this.hp = Math.round(this.maxHp * hpPercent);
    this.statusEffects = [];
  }

  fullRestore() {
    this.alive = true;
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.statusEffects = [];
    this.battleBuffs = [];
  }

  addBuff(buff) {
    // Remove existing buff of same type
    this.battleBuffs = this.battleBuffs.filter(b => b.effect !== buff.effect);
    this.battleBuffs.push({ ...buff });
  }

  tickBuffs() {
    this.battleBuffs = this.battleBuffs.filter(b => {
      if (b.duration !== undefined) {
        b.duration--;
        return b.duration > 0;
      }
      return true;
    });
  }

  addStatusEffect(effect) {
    const race = RACES[this.raceId];
    if (race.passive.type === 'status_immune' && race.passive.immuneTo.includes(effect.id)) return;
    // Check for existing
    const existing = this.statusEffects.find(e => e.id === effect.id);
    if (existing) {
      existing.duration = Math.max(existing.duration, effect.duration);
      if (effect.id === 'bleed' && existing.stacks < 3) existing.stacks++;
    } else {
      this.statusEffects.push({ ...effect, stacks: 1 });
    }
  }

  removeStatusEffect(id) {
    this.statusEffects = this.statusEffects.filter(e => e.id !== id);
  }

  clearAllStatus() {
    this.statusEffects = [];
  }

  hasStatus(id) {
    return this.statusEffects.some(e => e.id === id);
  }

  canAct() {
    if (!this.alive) return false;
    if (this.hasStatus('paralyze') && Math.random() < 0.25) return false;
    if (this.hasStatus('sleep') || this.hasStatus('petrify') || this.hasStatus('freeze')) return false;
    if (this.hasStatus('stun')) return false;
    return true;
  }

  equip(item) {
    if (item.type === 'weapon') {
      this.equipment.weapon = item;
    } else if (item.type === 'armor') {
      this.equipment[item.slot] = item;
    }
  }

  unequip(slot) {
    const item = this.equipment[slot];
    this.equipment[slot] = null;
    return item;
  }

  getEquipmentSlots() {
    return ['weapon','head','chest','legs','boots'];
  }

  getBattleStats() {
    return {
      name: this.name, level: this.level,
      hp: this.hp, maxHp: this.maxHp,
      mp: this.mp, maxMp: this.maxMp,
      atk: this.atk, def: this.def,
      str: this.str, dex: this.dex, int: this.int,
      wis: this.wis, con: this.con, spd: this.spd,
      critChance: this.critChance,
      classId: this.classId, raceId: this.raceId,
      alive: this.alive
    };
  }

  postBattleRestore() {
    this.battleBuffs = [];
    this.summons = [];
    this.frenzyStacks = 0;
    this.usedDragonBreath = false;
    // MP regen for elf
    const race = RACES[this.raceId];
    if (race.passive.type === 'mp_regen' && this.alive) {
      this.restoreMp(Math.round(this.maxMp * race.passive.value));
    }
  }

  serialize() {
    return {
      name: this.name, raceId: this.raceId, classId: this.classId,
      level: this.level, exp: this.exp, expToNext: this.expToNext,
      hp: this.hp, mp: this.mp, maxHp: this.maxHp, maxMp: this.maxMp,
      baseStr: this.baseStr, baseDex: this.baseDex, baseInt: this.baseInt,
      baseWis: this.baseWis, baseCon: this.baseCon, baseSpd: this.baseSpd,
      equipment: this.equipment,
      learnedSkills: this.learnedSkills,
      learnedSpells: this.learnedSpells,
      alive: this.alive, usedRevive: this.usedRevive,
      activeElement: this.activeElement
    };
  }

  static deserialize(data) {
    const c = new Character(data.name, data.raceId, data.classId);
    Object.assign(c, data);
    return c;
  }
}
