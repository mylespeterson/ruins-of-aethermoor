import { ENEMIES } from '../data/enemies.js';

export class Enemy {
  constructor(templateId, floor = 1) {
    const template = ENEMIES.find(e => e.id === templateId);
    if (!template) throw new Error(`Enemy not found: ${templateId}`);
    Object.assign(this, JSON.parse(JSON.stringify(template)));
    this._scaleToFloor(floor);
    this.maxHp = this.hp;
    this.maxMp = this.mp || 0;
    this.mp = this.maxMp;
    this.alive = true;
    this.statusEffects = [];
    this.battleBuffs = [];
    this.expReward = this.exp;
    this.goldReward = this._randRange(Math.round(this.gold * 0.7), Math.round(this.gold * 1.3));
  }

  _scaleToFloor(floor) {
    const scale = 1 + (floor - 1) * 0.12;
    this.hp = Math.round(this.hp * scale);
    this.mp = Math.round((this.mp || 0) * scale);
    this.atk = Math.round(this.atk * scale);
    this.def = Math.round(this.def * scale);
    this.exp = Math.round(this.exp * scale);
    this.gold = Math.round(this.gold * scale);
    if (this.isBoss) {
      this.hp *= 5; this.atk = Math.round(this.atk * 2); this.def = Math.round(this.def * 1.5);
    } else if (this.isMiniboss) {
      this.hp *= 3; this.atk = Math.round(this.atk * 1.5);
    }
    this.spd = this.spd || 5;
  }

  _randRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  chooseAction(partyMembers) {
    // AI: pick ability based on HP and available abilities
    const hpPct = this.hp / this.maxHp;
    const abilities = this.abilities || ['Attack'];
    // Use special ability if HP low or randomly
    if (abilities.length > 1 && (hpPct < 0.4 || Math.random() < 0.35)) {
      const idx = Math.floor(Math.random() * (abilities.length - 1)) + 1;
      return { type: 'skill', skillName: abilities[idx], target: this._pickTarget(partyMembers) };
    }
    return { type: 'attack', target: this._pickTarget(partyMembers) };
  }

  _pickTarget(partyMembers) {
    const alive = partyMembers.filter(m => m.alive);
    if (alive.length === 0) return null;
    // Target taunted member if any
    const taunted = alive.find(m => m.battleBuffs && m.battleBuffs.some(b => b.effect === 'taunt'));
    if (taunted) return taunted;
    // Random target
    return alive[Math.floor(Math.random() * alive.length)];
  }

  takeDamage(amount) {
    if (!this.alive) return 0;
    const actual = Math.max(1, amount - Math.floor(this.def / 3));
    this.hp = Math.max(0, this.hp - actual);
    if (this.hp <= 0) { this.alive = false; this.hp = 0; }
    return actual;
  }

  heal(amount) {
    const prev = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - prev;
  }

  canAct() {
    if (!this.alive) return false;
    if (this.hasStatus('paralyze') && Math.random() < 0.25) return false;
    if (this.hasStatus('sleep') || this.hasStatus('petrify') || this.hasStatus('freeze') || this.hasStatus('stun')) return false;
    return true;
  }

  addStatusEffect(effect) {
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

  hasStatus(id) {
    return this.statusEffects.some(e => e.id === id);
  }

  tickStatuses() {
    const dmgDealt = [];
    this.statusEffects = this.statusEffects.filter(e => {
      e.duration--;
      if (e.id === 'burn') {
        const d = Math.round(this.maxHp * 0.05);
        this.hp = Math.max(0, this.hp - d);
        if (this.hp <= 0) { this.alive = false; }
        dmgDealt.push({ type:'burn', amount:d });
      }
      if (e.id === 'poison') {
        const d = Math.round(this.maxHp * 0.08 * (e.stacks||1));
        this.hp = Math.max(0, this.hp - d);
        if (this.hp <= 0) { this.alive = false; }
        dmgDealt.push({ type:'poison', amount:d });
      }
      if (e.id === 'bleed') {
        const d = Math.round(this.maxHp * 0.03 * (e.stacks||1));
        this.hp = Math.max(0, this.hp - d);
        if (this.hp <= 0) { this.alive = false; }
        dmgDealt.push({ type:'bleed', amount:d });
      }
      return e.duration > 0;
    });
    return dmgDealt;
  }

  // For enemy encounter
  static getEnemiesForFloor(floor) {
    const candidates = ENEMIES.filter(e => {
      if (e.isBoss) return e.minFloor === floor;
      if (e.isMiniboss) return e.minFloor === floor;
      return e.minFloor <= floor && e.maxFloor >= floor;
    });
    return candidates;
  }

  static generateEncounter(floor, isBoss = false) {
    if (isBoss) {
      const boss = ENEMIES.find(e => e.isBoss && e.minFloor === floor);
      if (boss) return [new Enemy(boss.id, floor)];
    }
    // Check for mini-boss
    const miniboss = ENEMIES.find(e => e.isMiniboss && e.minFloor === floor);
    if (miniboss && Math.random() < 0.3) return [new Enemy(miniboss.id, floor)];

    const candidates = ENEMIES.filter(e =>
      !e.isBoss && !e.isMiniboss &&
      e.minFloor <= floor && e.maxFloor >= floor
    );
    if (candidates.length === 0) {
      const fallback = ENEMIES.filter(e => !e.isBoss && !e.isMiniboss);
      candidates.push(...fallback.slice(-3));
    }
    const count = Math.min(4, 1 + Math.floor(Math.random() * 3));
    const enemies = [];
    for (let i = 0; i < count; i++) {
      const template = candidates[Math.floor(Math.random() * candidates.length)];
      enemies.push(new Enemy(template.id, floor));
    }
    return enemies;
  }
}
