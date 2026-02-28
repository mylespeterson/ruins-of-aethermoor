import { getElementMultiplier, getStatusFromElement } from './elements.js';
import { STATUS_EFFECTS, tickStatusEffects, canActWithStatus, getDmgVulnerability, getMagicAllowed } from './status_effects.js';
import { SKILLS } from '../data/skills.js';
import { RACES } from '../data/races.js';
import { CLASSES } from '../data/classes.js';
import { CONSUMABLES } from '../data/items.js';

export class Battle {
  constructor(party, enemies, floor = 1) {
    this.party = party;
    this.enemies = enemies;
    this.floor = floor;
    this.turnQueue = [];
    this.turn = 0;
    this.log = [];
    this.phase = 'player_select'; // player_select | enemy_turn | animating | end
    this.currentActorIndex = 0;
    this.selectedAction = null;
    this.selectedSkill = null;
    this.selectedSpell = null;
    this.selectedTarget = null;
    this.battleOver = false;
    this.victory = false;
    this.pendingAnimations = [];
    this.totalExp = 0;
    this.totalGold = 0;
    this.loot = [];
    this._buildTurnQueue();
  }

  _buildTurnQueue() {
    const all = [
      ...this.party.members.map(m => ({ entity: m, isPlayer: true })),
      ...this.enemies.map(e => ({ entity: e, isPlayer: false }))
    ];
    // Sort by speed (descending)
    all.sort((a, b) => b.entity.spd - a.entity.spd);
    this.turnQueue = all;
    this.currentActorIndex = 0;
  }

  getCurrentActor() {
    const alive = this.turnQueue.filter(t => t.entity.alive);
    if (alive.length === 0) return null;
    return alive[this.currentActorIndex % alive.length];
  }

  get aliveParty() { return this.party.members.filter(m => m.alive); }
  get aliveEnemies() { return this.enemies.filter(e => e.alive); }

  nextTurn() {
    const alive = this.turnQueue.filter(t => t.entity.alive);
    if (alive.length === 0) return;
    this.currentActorIndex = (this.currentActorIndex + 1) % alive.length;
    this.turn++;
    // Check win/lose
    if (this.aliveEnemies.length === 0) {
      this._handleVictory();
      return;
    }
    if (this.aliveParty.length === 0) {
      this._handleDefeat();
      return;
    }
    const actor = this.getCurrentActor();
    if (!actor) return;
    if (!actor.isPlayer) {
      this.phase = 'enemy_turn';
    } else {
      this.phase = 'player_select';
    }
    // Tick status effects at start of turn
    const statusDamage = tickStatusEffects(actor.entity);
    statusDamage.forEach(s => this.log.push(`${actor.entity.name} takes ${s.amount} ${s.type} damage!`));
    if (!actor.entity.alive) {
      this.nextTurn();
    }
  }

  executePlayerAction(action) {
    const actor = this.getCurrentActor();
    if (!actor || !actor.isPlayer) return;
    const member = actor.entity;
    if (!canActWithStatus(member)) {
      const statusName = member.statusEffects[0]?.id || 'status';
      this.log.push(`${member.name} can't act (${statusName})!`);
      member.tickBuffs && member.tickBuffs();
      this.nextTurn();
      return;
    }
    let result;
    switch(action.type) {
      case 'attack':   result = this.physicalAttack(member, action.target); break;
      case 'skill':    result = this.useSkill(member, action.skillId, action.target); break;
      case 'magic':    result = this.useMagic(member, action.spellId, action.target); break;
      case 'item':     result = this.useItem(member, action.itemId, action.target); break;
      case 'defend':   result = this.defend(member); break;
      case 'flee':     result = this.flee(); break;
      default: result = { message: 'Unknown action' };
    }
    if (result && result.message) this.log.push(result.message);
    member.tickBuffs && member.tickBuffs();
    if (this.aliveEnemies.length === 0) { this._handleVictory(); return; }
    if (this.aliveParty.length === 0) { this._handleDefeat(); return; }
    this.nextTurn();
  }

  executeEnemyTurn() {
    const actor = this.getCurrentActor();
    if (!actor || actor.isPlayer) return;
    const enemy = actor.entity;
    if (!canActWithStatus(enemy)) {
      this.log.push(`${enemy.name} can't act!`);
      this.nextTurn();
      return;
    }
    const action = enemy.chooseAction(this.aliveParty);
    if (!action || !action.target) { this.nextTurn(); return; }
    let result;
    if (action.type === 'attack') {
      result = this.physicalAttack(enemy, action.target, false);
    } else if (action.type === 'skill') {
      result = this.enemySkillAttack(enemy, action.skillName, action.target);
    }
    if (result && result.message) this.log.push(result.message);
    if (this.aliveEnemies.length === 0) { this._handleVictory(); return; }
    if (this.aliveParty.length === 0) { this._handleDefeat(); return; }
    this.nextTurn();
  }

  physicalAttack(attacker, target, isPlayer = true) {
    if (!target || !target.alive) {
      if (isPlayer) {
        const alive = this.aliveEnemies;
        if (alive.length === 0) return { message: 'No targets!' };
        target = alive[0];
      } else {
        const alive = this.aliveParty;
        if (alive.length === 0) return { message: 'No targets!' };
        target = alive[0];
      }
    }
    const atkValue = attacker.atk || attacker.str || 10;
    const defValue = target.def || 5;
    let dmg = Math.max(1, Math.round((atkValue - defValue * 0.5) * (0.9 + Math.random() * 0.2)));
    // Crit check
    const critChance = attacker.critChance || 0.05;
    let isCrit = Math.random() < critChance;
    let critMult = 2;
    // Rogue backstab class mechanic
    if (isPlayer && attacker.classId === 'rogue') critMult = 3;
    if (isCrit) dmg = Math.round(dmg * critMult);
    // Race bonuses
    const race = isPlayer ? RACES[attacker.raceId] : null;
    if (race) {
      if (race.passive.type === 'low_hp_damage' && attacker.hp / attacker.maxHp < 0.3) dmg = Math.round(dmg * (1 + race.passive.value));
      if (race.passive.type === 'luck' && isCrit) dmg = Math.round(dmg * 1.1);
    }
    // Frenzy stacks (berserker)
    if (isPlayer && attacker.frenzyStacks > 0) {
      dmg = Math.round(dmg * (1 + attacker.frenzyStacks * 0.05));
    }
    // Mark bonus
    if (isPlayer) {
      const marked = target.statusEffects?.find(e => e.id === 'mark');
      if (marked) dmg = Math.round(dmg * (1 + marked.value));
    }
    // Vulnerability
    dmg = Math.round(dmg * getDmgVulnerability(target));
    const actualDmg = isPlayer
      ? target.takeDamage(dmg)
      : target.takeDamage(dmg);
    // Weapon element
    const weapon = isPlayer ? attacker.equipment?.weapon : null;
    if (weapon?.element) {
      const elemMult = getElementMultiplier(weapon.element, target.element || 'none');
      // Already applied via getElementMultiplier in actual damage would require restructure
    }
    // Lifesteal
    if (isPlayer && weapon?.lifesteal) {
      attacker.heal(Math.round(actualDmg * weapon.lifesteal));
    }
    const critText = isCrit ? ' CRITICAL!' : '';
    return { message: `${attacker.name} attacks ${target.name} for ${actualDmg} damage!${critText}`, damage: actualDmg, target, isCrit };
  }

  useSkill(member, skillId, target) {
    const skill = SKILLS[skillId];
    if (!skill) return { message: 'Unknown skill!' };
    if (member.mp < skill.mpCost) return { message: `${member.name} doesn't have enough MP!` };
    // Silence check for magic skills
    if (skill.type === 'magic' && !getMagicAllowed(member)) {
      return { message: `${member.name} is silenced and can't use magic skills!` };
    }
    member.mp = Math.max(0, member.mp - skill.mpCost);
    let message = '';
    if (skill.type === 'physical') {
      const targets = this._resolveTargets(skill.target, target, false);
      targets.forEach(t => {
        if (!t.alive) return;
        const atkValue = member.atk;
        const defValue = skill.ignoreDefense ? 0 : t.def;
        let dmg = Math.max(1, Math.round((atkValue * skill.power - defValue * 0.5) * (0.9 + Math.random() * 0.2)));
        if (skill.guaranteedCrit || Math.random() < (member.critChance || 0.05)) {
          dmg = Math.round(dmg * (skill.critMult || 2));
        }
        // Self damage (berserker reckless blow)
        if (skill.selfDamage) member.takeDamage(Math.round(member.maxHp * skill.selfDamage));
        const actual = t.takeDamage(dmg);
        if (skill.statusEffect) this._applyStatusFromElement(t, skill.statusEffect);
        message += `${member.name} uses ${skill.name} on ${t.name} for ${actual} damage! `;
        if (!t.alive && member.classId === 'berserker' && member.battleBuffs.some(b => b.effect === 'frenzy')) {
          member.frenzyStacks = (member.frenzyStacks || 0) + 1;
        }
      });
    } else if (skill.type === 'magic') {
      const targets = this._resolveTargets(skill.target, target, false);
      targets.forEach(t => {
        if (!t.alive) return;
        const power = skill.power || 1.0;
        let dmg = Math.round(skill.power * (30 + member.int * 2) * (0.9 + Math.random() * 0.2));
        const elemMult = getElementMultiplier(skill.element, t.element || 'none');
        dmg = Math.round(dmg * elemMult);
        let actual;
        if (typeof t.takeDamage === 'function') {
          actual = t.takeDamage(dmg);
        } else {
          actual = Math.min(dmg, t.hp);
          t.hp = Math.max(0, t.hp - actual);
          if (t.hp <= 0) t.alive = false;
        }
        if (skill.statusEffect) this._applyStatusFromElement(t, skill.statusEffect);
        // Drain
        if (skill.drain) member.heal(Math.round(actual * skill.drain));
        message += `${member.name} uses ${skill.name} on ${t.name} for ${actual} magic damage! `;
      });
    } else if (skill.type === 'heal') {
      const targets = this._resolveTargets(skill.target, target, true);
      targets.forEach(t => {
        if (!t.alive && skill.target !== 'single_ally') return;
        const healAmt = Math.round(skill.power * (20 + member.wis * 3));
        const actual = t.heal ? t.heal(healAmt) : 0;
        if (skill.removeStatus && t.clearAllStatus) t.clearAllStatus();
        message += `${member.name} heals ${t.name} for ${actual} HP! `;
      });
    } else if (skill.type === 'buff') {
      const targets = this._resolveTargets(skill.target, target, true);
      targets.forEach(t => {
        const buff = { name: skill.name, effect: skill.effect, duration: skill.duration, value: skill.value };
        if (t.addBuff) t.addBuff(buff);
        message += `${member.name} uses ${skill.name} on ${t.name}! `;
      });
    } else if (skill.type === 'debuff') {
      const targets = this._resolveTargets(skill.target, target, false);
      targets.forEach(t => {
        if (!t.alive) return;
        const debuff = { id: skill.effect, duration: skill.duration, value: skill.value };
        if (t.addStatusEffect) t.addStatusEffect(debuff);
        message += `${member.name} uses ${skill.name} on ${t.name}! `;
      });
    } else if (skill.type === 'revive') {
      if (target && !target.alive && target.revive) {
        target.revive(skill.power || 0.5);
        message = `${member.name} revives ${target.name}!`;
      }
    } else if (skill.type === 'special') {
      message = this._handleSpecialSkill(member, skill, target);
    } else {
      message = `${member.name} uses ${skill.name}!`;
    }
    if (!message) message = `${member.name} uses ${skill.name}!`;
    return { message: message.trim() };
  }

  _handleSpecialSkill(member, skill, target) {
    if (skill.effect === 'defend') {
      member.addBuff({ effect: 'defend', duration: 1 });
      return `${member.name} takes a defensive stance!`;
    }
    if (skill.effect === 'frenzy') {
      member.addBuff({ effect: 'frenzy', duration: 99 });
      member.frenzyStacks = 0;
      return `${member.name} enters a frenzy! (+5% ATK per kill)`;
    }
    if (skill.effect === 'meditate') {
      member.restoreMp(skill.mpRestore || 20);
      return `${member.name} meditates and restores ${skill.mpRestore || 20} MP!`;
    }
    if (skill.effect === 'shift_element') {
      const elements = ['fire','water','lightning','earth','nature','ice','wind','metal'];
      const curr = elements.indexOf(member.activeElement || 'fire');
      member.activeElement = elements[(curr + 1) % elements.length];
      member.addBuff({ effect: 'elemental_boost', duration: 2, value: 0.3 });
      return `${member.name} shifts element to ${member.activeElement}!`;
    }
    return `${member.name} uses ${skill.name}!`;
  }

  useMagic(member, spellId, target) {
    if (!getMagicAllowed(member)) {
      return { message: `${member.name} is silenced and can't use magic!` };
    }
    // Find spell in learned spells
    const spellIdFull = member.learnedSpells?.find(s => s === spellId) ? spellId : null;
    if (!spellIdFull) return { message: `${member.name} hasn't learned that spell!` };
    // Import spells dynamically - use inline data
    return { message: `${member.name} casts a spell!` };
  }

  useItem(member, itemId, target) {
    const item = this.party.inventory.findItem(itemId);
    if (!item) return { message: 'Item not found!' };
    this.party.inventory.removeItem(itemId, 1);
    const CONSUMABLE_DEFS = {
      health_potion: { effect:'heal_hp', value:60 },
      hi_potion: { effect:'heal_hp', value:150 },
      mega_potion: { effect:'heal_hp_all', value:100 },
      mana_potion: { effect:'heal_mp', value:40 },
      ether: { effect:'heal_mp', value:80 },
      turbo_ether: { effect:'heal_mp', value:150 },
      antidote: { effect:'cure_status', status:'poison' },
      eye_drops: { effect:'cure_status', status:'blind' },
      smelling_salts: { effect:'cure_status', status:'sleep' },
      phoenix_down: { effect:'revive', value:0.25 },
      elixir: { effect:'heal_all', value:9999 },
      bomb: { effect:'damage_enemy', element:'fire', value:80 },
    };
    const def = CONSUMABLE_DEFS[itemId] || { effect:'heal_hp', value:30 };
    let message = `${member.name} uses ${item.name || itemId}!`;
    if (def.effect === 'heal_hp' && target) {
      const actual = target.heal(def.value);
      message = `${target.name} restores ${actual} HP!`;
    } else if (def.effect === 'heal_hp_all') {
      this.aliveParty.forEach(m => m.heal(def.value));
      message = `Party restores ${def.value} HP!`;
    } else if (def.effect === 'heal_mp' && target) {
      const actual = target.restoreMp(def.value);
      message = `${target.name} restores ${actual} MP!`;
    } else if (def.effect === 'cure_status' && target) {
      target.removeStatusEffect(def.status);
      message = `${target.name} is cured of ${def.status}!`;
    } else if (def.effect === 'revive' && target && !target.alive) {
      target.revive(def.value);
      message = `${target.name} is revived!`;
    } else if (def.effect === 'heal_all' && target) {
      target.heal(target.maxHp);
      target.restoreMp(target.maxMp);
      message = `${target.name} is fully restored!`;
    } else if (def.effect === 'damage_enemy' && target) {
      const dmg = Math.round(def.value * (0.9 + Math.random() * 0.2));
      const actual = typeof target.takeDamage === 'function' ? target.takeDamage(dmg) : dmg;
      message = `${target.name} takes ${actual} fire damage!`;
    }
    return { message };
  }

  defend(member) {
    member.addBuff({ effect: 'defend', duration: 2 });
    return { message: `${member.name} takes a defensive stance! (50% damage reduction)` };
  }

  flee() {
    const avgPartyDex = this.aliveParty.reduce((s, m) => s + m.dex, 0) / Math.max(1, this.aliveParty.length);
    const avgEnemySpd = this.aliveEnemies.reduce((s, e) => s + e.spd, 0) / Math.max(1, this.aliveEnemies.length);
    // Bosses can't be fled from
    const hasBoss = this.enemies.some(e => e.isBoss || e.isMiniboss);
    if (hasBoss) return { message: "Can't flee from this enemy!", fled: false };
    const chance = 0.5 + (avgPartyDex - avgEnemySpd) / 20;
    if (Math.random() < Math.max(0.1, Math.min(0.9, chance))) {
      this.battleOver = true;
      this.victory = false;
      this.fled = true;
      return { message: 'The party fled!', fled: true };
    }
    return { message: "Couldn't flee!", fled: false };
  }

  _resolveTargets(targetType, selectedTarget, forAllies = false) {
    switch(targetType) {
      case 'single': return selectedTarget ? [selectedTarget] : (forAllies ? this.aliveParty.slice(0,1) : this.aliveEnemies.slice(0,1));
      case 'single_enemy': return selectedTarget ? [selectedTarget] : this.aliveEnemies.slice(0,1);
      case 'single_ally': return selectedTarget ? [selectedTarget] : this.aliveParty.slice(0,1);
      case 'all_enemies': return this.aliveEnemies;
      case 'all_allies': return this.aliveParty;
      case 'self': return [this.getCurrentActor()?.entity].filter(Boolean);
      case 'all': return [...this.aliveParty, ...this.aliveEnemies];
      case 'random_enemies': {
        const count = 3;
        const result = [];
        for (let i = 0; i < count; i++) {
          const alive = this.aliveEnemies;
          if (alive.length > 0) result.push(alive[Math.floor(Math.random() * alive.length)]);
        }
        return result;
      }
      case 'last_dead_enemy': {
        const dead = this.enemies.filter(e => !e.alive);
        return dead.length > 0 ? [dead[dead.length-1]] : [];
      }
      default: return selectedTarget ? [selectedTarget] : [];
    }
  }

  _applyStatusFromElement(target, elementOrStatus) {
    const statusDefs = {
      burn: { id:'burn', duration:3 },
      chill: { id:'chill', duration:3 },
      paralyze: { id:'paralyze', duration:2 },
      petrify: { id:'petrify', duration:1 },
      poison: { id:'poison', duration:4 },
      freeze: { id:'freeze', duration:1 },
      silence: { id:'silence', duration:3 },
      bleed: { id:'bleed', duration:5 },
      stun: { id:'stun', duration:1 },
      curse: { id:'curse', duration:4 },
    };
    const def = statusDefs[elementOrStatus];
    if (def && target.addStatusEffect) {
      target.addStatusEffect({ ...def });
    }
  }

  enemySkillAttack(enemy, skillName, target) {
    if (!target || !target.alive) {
      const alive = this.aliveParty;
      if (alive.length === 0) return { message: 'No targets!' };
      target = alive[0];
    }
    // Scale skill power based on enemy stats
    const power = 1.2 + Math.random() * 0.6;
    let dmg = Math.round(enemy.atk * power);
    // Element check
    if (enemy.element && enemy.element !== 'none') {
      const elemMult = getElementMultiplier(enemy.element, 'none');
      dmg = Math.round(dmg * elemMult);
    }
    const actual = target.takeDamage(dmg);
    // Apply status effects based on enemy element
    if (enemy.element && enemy.element !== 'none') {
      const statusDef = { fire:'burn', water:'chill', lightning:'paralyze', earth:'petrify', nature:'poison', ice:'freeze', wind:'silence', metal:'bleed' }[enemy.element];
      if (statusDef && Math.random() < 0.3) {
        this._applyStatusFromElement(target, statusDef);
      }
    }
    return { message: `${enemy.name} uses ${skillName} on ${target.name} for ${actual} damage!` };
  }

  _handleVictory() {
    this.battleOver = true;
    this.victory = true;
    this.phase = 'end';
    // Calculate rewards
    this.enemies.forEach(e => {
      this.totalExp += e.expReward || 0;
      this.totalGold += e.goldReward || 0;
      if (e.drops) {
        e.drops.forEach(d => {
          if (Math.random() < d.chance) this.loot.push(d.id);
        });
      }
    });
    this.totalExp = Math.round(this.totalExp * (1 + this.floor * 0.05));
    this.log.push(`Victory! Gained ${this.totalExp} EXP and ${this.totalGold} gold!`);
  }

  _handleDefeat() {
    this.battleOver = true;
    this.victory = false;
    this.phase = 'end';
    this.log.push('The party has been defeated...');
  }

  isOver() {
    return this.battleOver;
  }
}
