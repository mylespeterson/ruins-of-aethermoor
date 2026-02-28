import { Battle } from '../combat/battle.js';
import { SKILLS } from '../data/skills.js';
import { SPELLS } from '../data/spells.js';
import { ELEMENT_COLORS } from '../combat/elements.js';
import { STATUS_EFFECTS } from '../combat/status_effects.js';

export class BattleUI {
  constructor(game) {
    this.game = game;
    this.battle = null;
    this.phase = 'select_action'; // select_action, select_skill, select_spell, select_target, select_item, animating, result
    this.selectedPartyMember = 0;
    this.actionIndex = 0;
    this.skillIndex = 0;
    this.spellIndex = 0;
    this.itemIndex = 0;
    this.selectedTarget = 0;
    this.targetList = [];
    this.animTime = 0;
    this.floatingTexts = [];
    this.logScroll = 0;
    this.turnDelay = 0;
    this.autoEnemyTurn = false;
    this.pendingAction = null;
    this.resultTimer = 0;
  }

  onEnter(data) {
    const { enemies } = data;
    this.battle = new Battle(this.game.party, enemies, this.game.currentFloor);
    this.phase = 'select_action';
    this.actionIndex = 0;
    this.skillIndex = 0;
    this.spellIndex = 0;
    this.selectedTarget = 0;
    this.floatingTexts = [];
    this.animTime = 0;
    this.turnDelay = 0;
    this._syncCurrentActor();
  }

  _syncCurrentActor() {
    const actor = this.battle.getCurrentActor();
    if (!actor) return;
    if (actor.isPlayer) {
      this.phase = 'select_action';
      this.actionIndex = 0;
      // Find index in party
      this.selectedPartyMember = this.game.party.members.indexOf(actor.entity);
    } else {
      this.phase = 'enemy_turn';
    }
  }

  update(dt) {
    this.animTime += dt;
    this.turnDelay = Math.max(0, this.turnDelay - dt);
    // Update floating texts
    this.floatingTexts = this.floatingTexts.filter(t => {
      t.y -= 30 * dt;
      t.alpha -= dt * 0.8;
      return t.alpha > 0;
    });
    if (this.battle.isOver()) {
      this.resultTimer += dt;
      if (this.resultTimer > 1.5 || this.game.input.wasClicked() || this.game.input.isKeyJustPressed('Enter')) {
        if (this.battle.fled) {
          this.game.setState('DUNGEON');
        } else {
          this.game.endBattle(this.battle.victory);
        }
      }
      return;
    }
    if (this.turnDelay > 0) return;
    if (this.phase === 'enemy_turn') {
      this.turnDelay = 0.8;
      const result = this.battle.executeEnemyTurn();
      this._addLog(this.battle.log[this.battle.log.length - 1] || '');
      if (this.battle.isOver()) { this.resultTimer = 0; return; }
      this._syncCurrentActor();
      return;
    }
    const input = this.game.input;
    const W = this.game.canvas.width, H = this.game.canvas.height;
    switch(this.phase) {
      case 'select_action':   this._updateSelectAction(input, W, H); break;
      case 'select_skill':    this._updateSelectSkill(input, W, H); break;
      case 'select_spell':    this._updateSelectSpell(input, W, H); break;
      case 'select_item':     this._updateSelectItem(input, W, H); break;
      case 'select_target':   this._updateSelectTarget(input, W, H); break;
    }
  }

  _updateSelectAction(input, W, H) {
    const actions = ['Attack', 'Skill', 'Magic', 'Item', 'Defend', 'Flee'];
    const menuX = 10, menuY = H - 180, btnH = 36, btnW = 130;
    actions.forEach((a, i) => {
      const bx = menuX + Math.floor(i / 3) * (btnW + 5);
      const by = menuY + (i % 3) * (btnH + 4);
      if (input.isClickIn(bx, by, btnW, btnH)) {
        this.actionIndex = i;
        this._selectAction(a);
      }
    });
    if (input.isKeyJustPressed('ArrowDown')) this.actionIndex = Math.min(5, this.actionIndex + 1);
    if (input.isKeyJustPressed('ArrowUp')) this.actionIndex = Math.max(0, this.actionIndex - 1);
    if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
      this._selectAction(actions[this.actionIndex]);
    }
  }

  _selectAction(action) {
    switch(action) {
      case 'Attack':
        this.phase = 'select_target';
        this.targetList = this.battle.aliveEnemies;
        this.selectedTarget = 0;
        this.pendingAction = { type: 'attack' };
        break;
      case 'Skill':
        this.phase = 'select_skill';
        this.skillIndex = 0;
        break;
      case 'Magic':
        this.phase = 'select_spell';
        this.spellIndex = 0;
        break;
      case 'Item':
        this.phase = 'select_item';
        this.itemIndex = 0;
        break;
      case 'Defend':
        this._executeAction({ type: 'defend' });
        break;
      case 'Flee':
        this._executeAction({ type: 'flee' });
        break;
    }
  }

  _updateSelectSkill(input, W, H) {
    const actor = this.battle.getCurrentActor();
    if (!actor || !actor.isPlayer) { this.phase = 'select_action'; return; }
    const member = actor.entity;
    const skills = member.learnedSkills || [];
    if (input.isKeyJustPressed('Escape')) { this.phase = 'select_action'; return; }
    if (input.isKeyJustPressed('ArrowDown')) this.skillIndex = Math.min(skills.length-1, this.skillIndex + 1);
    if (input.isKeyJustPressed('ArrowUp')) this.skillIndex = Math.max(0, this.skillIndex - 1);
    // Click
    const menuX = 10, menuY = H - 240;
    skills.forEach((sId, i) => {
      if (input.isClickIn(menuX, menuY + i * 34, 260, 30)) {
        this.skillIndex = i;
        this._confirmSkill(sId, member);
      }
    });
    if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
      const sId = skills[this.skillIndex];
      if (sId) this._confirmSkill(sId, member);
    }
  }

  _confirmSkill(skillId, member) {
    const skill = SKILLS[skillId];
    if (!skill) return;
    if (member.mp < skill.mpCost) {
      this._addLog(`Not enough MP! (Need ${skill.mpCost})`);
      return;
    }
    const needsTarget = ['single','single_enemy','single_ally'].includes(skill.target);
    if (needsTarget) {
      this.phase = 'select_target';
      const isAlly = skill.target === 'single_ally';
      this.targetList = isAlly ? this.battle.aliveParty : this.battle.aliveEnemies;
      if (skill.target === 'single_ally') this.targetList = this.game.party.members; // allow revive
      this.selectedTarget = 0;
      this.pendingAction = { type: 'skill', skillId };
    } else {
      this._executeAction({ type: 'skill', skillId, target: null });
    }
  }

  _updateSelectSpell(input, W, H) {
    const actor = this.battle.getCurrentActor();
    if (!actor || !actor.isPlayer) { this.phase = 'select_action'; return; }
    const member = actor.entity;
    const spells = member.learnedSpells || [];
    if (input.isKeyJustPressed('Escape')) { this.phase = 'select_action'; return; }
    if (input.isKeyJustPressed('ArrowDown')) this.spellIndex = Math.min(Math.max(0,spells.length-1), this.spellIndex + 1);
    if (input.isKeyJustPressed('ArrowUp')) this.spellIndex = Math.max(0, this.spellIndex - 1);
    const menuX = 10, menuY = H - 240;
    spells.forEach((sId, i) => {
      if (input.isClickIn(menuX, menuY + i * 34, 260, 30)) {
        this.spellIndex = i;
        const spell = SPELLS[sId];
        if (spell && member.mp >= spell.mpCost) {
          this._executeSpellAction(sId, spell, member);
        }
      }
    });
    if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
      const sId = spells[this.spellIndex];
      const spell = sId ? SPELLS[sId] : null;
      if (spell && member.mp >= spell.mpCost) {
        this._executeSpellAction(sId, spell, member);
      } else if (spell) {
        this._addLog('Not enough MP!');
      }
    }
  }

  _executeSpellAction(spellId, spell, member) {
    member.mp = Math.max(0, member.mp - spell.mpCost);
    // Apply spell effect inline
    let msg = `${member.name} casts ${spell.name}!`;
    const targets = spell.target === 'all_enemies' ? this.battle.aliveEnemies
      : spell.target === 'all_allies' ? this.battle.aliveParty
      : spell.target === 'single_ally' ? [this.battle.aliveParty[0]]
      : spell.target === 'single' ? [this.battle.aliveEnemies[0]]
      : [this.battle.aliveEnemies[0]];
    if (spell.type === 'magic') {
      targets.forEach(t => {
        if (!t.alive) return;
        const base = spell.power * (25 + member.int * 2.5);
        let dmg = Math.round(base * (0.9 + Math.random() * 0.2));
        const actual = typeof t.takeDamage === 'function' ? t.takeDamage(dmg) : (t.hp = Math.max(0, t.hp - dmg), t.hp <= 0 && (t.alive = false), dmg);
        this._addFloatingText(t.name, `-${actual}`, ELEMENT_COLORS[spell.element] || '#ffff00');
        msg += ` ${t.name} takes ${actual} damage!`;
      });
    } else if (spell.type === 'heal') {
      targets.forEach(t => {
        if (!t.alive && spell.type !== 'revive') return;
        const amt = Math.round(spell.power * (20 + member.wis * 3));
        const actual = t.heal ? t.heal(amt) : 0;
        this._addFloatingText(t.name, `+${actual}`, '#44ff88');
        msg += ` ${t.name} restored ${actual} HP!`;
      });
    } else if (spell.type === 'revive') {
      const t = this.game.party.members.find(m => !m.alive);
      if (t) { t.revive(spell.power); msg = `${member.name} revives ${t.name}!`; }
    }
    this._addLog(msg);
    if (!this.battle.isOver()) { this.battle.nextTurn(); this._syncCurrentActor(); }
  }

  _updateSelectItem(input, W, H) {
    const items = this.game.party.inventory.getItemsByType('consumable');
    if (input.isKeyJustPressed('Escape')) { this.phase = 'select_action'; return; }
    if (input.isKeyJustPressed('ArrowDown')) this.itemIndex = Math.min(Math.max(0,items.length-1), this.itemIndex + 1);
    if (input.isKeyJustPressed('ArrowUp')) this.itemIndex = Math.max(0, this.itemIndex - 1);
    const menuX = 10, menuY = H - 240;
    items.forEach((item, i) => {
      if (input.isClickIn(menuX, menuY + i * 34, 260, 30)) {
        this.itemIndex = i;
        this._confirmItem(item.id, item);
      }
    });
    if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
      const item = items[this.itemIndex];
      if (item) this._confirmItem(item.id, item);
    }
  }

  _confirmItem(itemId, item) {
    const def = item.data || {};
    const isForEnemy = def.effect === 'damage_enemy';
    this.phase = 'select_target';
    this.targetList = isForEnemy ? this.battle.aliveEnemies : this.battle.aliveParty;
    this.selectedTarget = 0;
    this.pendingAction = { type: 'item', itemId };
  }

  _updateSelectTarget(input, W, H) {
    if (input.isKeyJustPressed('Escape')) {
      this.phase = 'select_action';
      this.pendingAction = null;
      return;
    }
    if (!this.targetList || this.targetList.length === 0) { this.phase = 'select_action'; return; }
    if (input.isKeyJustPressed('ArrowRight') || input.isKeyJustPressed('ArrowDown')) {
      this.selectedTarget = (this.selectedTarget + 1) % this.targetList.length;
    }
    if (input.isKeyJustPressed('ArrowLeft') || input.isKeyJustPressed('ArrowUp')) {
      this.selectedTarget = (this.selectedTarget - 1 + this.targetList.length) % this.targetList.length;
    }
    // Click on enemy/ally
    const isEnemyTarget = this.targetList === this.battle.aliveEnemies;
    if (isEnemyTarget) {
      this.targetList.forEach((enemy, i) => {
        const ex = this._getEnemyX(i, this.targetList.length);
        const ey = H * 0.12;
        if (input.isClickIn(ex - 45, ey, 90, 120)) {
          this.selectedTarget = i;
          this._finalizeAction();
        }
      });
    } else {
      this.targetList.forEach((member, i) => {
        const bx = 10, by = H - 285 - i * 80;
        if (input.isClickIn(bx, by, 200, 70)) {
          this.selectedTarget = i;
          this._finalizeAction();
        }
      });
    }
    if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
      this._finalizeAction();
    }
  }

  _finalizeAction() {
    if (!this.pendingAction) return;
    const target = this.targetList[this.selectedTarget];
    const action = { ...this.pendingAction, target };
    this._executeAction(action);
    this.pendingAction = null;
  }

  _executeAction(action) {
    const result = this.battle.executePlayerAction(action);
    const lastMsg = this.battle.log[this.battle.log.length - 1];
    if (lastMsg) this._addLog(lastMsg);
    // Add floating texts
    if (result && result.damage && result.target) {
      const color = result.isCrit ? '#ff8800' : '#ffffff';
      this._addFloatingText(result.target.name, `-${result.damage}`, color);
    }
    if (action.type === 'flee' && this.battle.fled) return;
    if (!this.battle.isOver()) {
      this._syncCurrentActor();
    } else {
      this.resultTimer = 0;
    }
  }

  _addLog(msg) {
    if (msg) this.battle.log.push(msg);
    // Keep max 5 lines
    if (this.battle.log.length > 5) this.battle.log = this.battle.log.slice(-5);
  }

  _addFloatingText(name, text, color) {
    this.floatingTexts.push({ name, text, color, y: 100, alpha: 1 });
  }

  _getEnemyX(index, total) {
    const W = this.game.canvas.width;
    const startX = W * 0.55;
    const spacing = Math.min(160, (W * 0.42) / Math.max(1, total));
    return startX + index * spacing + spacing / 2;
  }

  render(r) {
    const W = r.width, H = r.height;
    // Battle background
    r.drawGradientBG(0, 0, W, H, '#0a0514', '#1a0a24');
    // Ground line
    r.drawRect(0, H * 0.68, W, 3, '#334466');
    // Background details
    for (let i = 0; i < 8; i++) {
      r.ctx.strokeStyle = `rgba(50,50,100,0.15)`; r.ctx.lineWidth = 1;
      r.ctx.beginPath(); r.ctx.moveTo(0, H * 0.68 + i * 5); r.ctx.lineTo(W, H * 0.68 + i * 5); r.ctx.stroke();
    }
    // Draw enemies (right side)
    const enemies = this.battle.aliveEnemies;
    enemies.forEach((enemy, i) => {
      const ex = this._getEnemyX(i, enemies.length);
      const ey = H * 0.12;
      const ew = 90, eh = 110;
      // Selection highlight
      if (this.phase === 'select_target' && this.targetList === this.battle.aliveEnemies && this.selectedTarget === i) {
        r.ctx.save(); r.ctx.globalAlpha = 0.3; r.drawRect(ex - ew/2, ey, ew, eh, '#ffff00'); r.ctx.restore();
        r.drawRoundRect(ex - ew/2 - 2, ey - 2, ew + 4, eh + 4, 4, null, '#ffff00', 2);
      }
      r.drawEnemySprite(enemy, ex - ew/2, ey, ew, eh, this.animTime);
      // HP bar
      r.drawBar(ex - 45, ey + eh + 5, 90, 8, enemy.hp, enemy.maxHp, '#cc4444');
      r.drawText(enemy.name, ex, ey + eh + 18, '#cccccc', 12, 'center');
      r.drawText(`${enemy.hp}/${enemy.maxHp}`, ex, ey + eh + 32, '#cc8888', 11, 'center');
      // Status icons
      enemy.statusEffects.forEach((e, si) => {
        const def = STATUS_EFFECTS[e.id];
        r.drawText(def ? def.icon : '?', ex - 40 + si * 18, ey - 20, '#ffffff', 14, 'left');
      });
    });
    // Dead enemies (dimmed)
    this.battle.enemies.forEach((enemy, i) => {
      if (enemy.alive) return;
      const allCount = this.battle.enemies.length;
      const ex = this._getEnemyX(i, allCount);
      r.ctx.save(); r.ctx.globalAlpha = 0.2;
      r.drawEnemySprite(enemy, ex - 45, H * 0.5, 90, 80, this.animTime);
      r.ctx.restore();
    });
    // Draw party (left side)
    this.game.party.members.forEach((member, i) => {
      const px = 40, py = H * 0.15 + i * 110;
      const pw = 70, ph = 85;
      const isActive = this.battle.getCurrentActor()?.entity === member;
      const isTargeted = this.phase === 'select_target' && this.targetList !== this.battle.aliveEnemies && this.selectedTarget === i;
      if (isActive) {
        r.ctx.save(); r.ctx.globalAlpha = 0.2;
        r.drawRect(px - 5, py - 5, pw + 10, ph + 10, '#4488ff');
        r.ctx.restore();
        r.drawRoundRect(px - 5, py - 5, pw + 10, ph + 10, 4, null, '#4488ff', 2);
      }
      if (isTargeted) {
        r.drawRoundRect(px - 5, py - 5, pw + 10, ph + 10, 4, null, '#ffff00', 2);
      }
      const alpha = member.alive ? 1 : 0.35;
      r.ctx.save(); r.ctx.globalAlpha = alpha;
      r.drawSprite(member.classId, px, py, pw, ph, '#4466cc', this.animTime);
      r.ctx.restore();
      // Member info
      const infoX = px + pw + 8;
      r.drawText(`${member.name}`, infoX, py, member.alive ? '#ffffff' : '#666666', 13, 'left', 'monospace', true);
      r.drawText(`Lv${member.level} ${member.classId}`, infoX, py + 14, '#aaaacc', 11);
      r.drawBar(infoX, py + 28, 110, 10, member.hp, member.maxHp, member.hp/member.maxHp < 0.3 ? '#ff4444' : '#44cc66');
      r.drawText(`${member.hp}/${member.maxHp}`, infoX + 115, py + 28, '#cccccc', 9);
      r.drawBar(infoX, py + 42, 110, 10, member.mp, member.maxMp, '#4488cc');
      r.drawText(`${member.mp}/${member.maxMp}`, infoX + 115, py + 42, '#88aacc', 9);
      // Status effects
      member.statusEffects.forEach((e, si) => {
        const def = STATUS_EFFECTS[e.id];
        r.drawText(def ? def.icon : '?', infoX + si * 18, py + 56, '#ffffff', 13, 'left');
      });
      // Buff icons
      member.battleBuffs.forEach((b, bi) => {
        r.drawText('↑', infoX + (member.statusEffects.length + bi) * 18, py + 56, '#44ff88', 13, 'left');
      });
    });
    // Action menu (bottom)
    const menuBg = H - 200;
    r.drawRoundRect(0, menuBg, W, 200, 0, 'rgba(5,5,20,0.95)', '#334', 1);
    this._renderActionMenu(r, W, H, menuBg);
    // Battle log
    const logX = W * 0.32, logY = H - 195;
    r.drawRoundRect(logX, logY, W - logX - 10, 90, 4, 'rgba(10,10,30,0.8)', '#334455', 1);
    const logs = this.battle.log.slice(-4);
    logs.forEach((line, i) => {
      r.drawText(line, logX + 8, logY + 8 + i * 20, i === logs.length-1 ? '#ffffff' : '#888899', 13);
    });
    // Turn indicator
    const actor = this.battle.getCurrentActor();
    if (actor) {
      const label = actor.isPlayer ? `${actor.entity.name}'s turn` : `${actor.entity.name} is acting...`;
      r.drawTextCentered(label, W * 0.6, H - 105, actor.isPlayer ? '#88aaff' : '#ff8866', 16, 'monospace', true);
    }
    // Floating texts
    this.floatingTexts.forEach(ft => {
      r.ctx.save();
      r.ctx.globalAlpha = ft.alpha;
      r.drawTextCentered(ft.text, W * 0.7, ft.y, ft.color, 22, 'monospace', true);
      r.ctx.restore();
    });
    // Battle result overlay
    if (this.battle.isOver()) {
      r.ctx.save(); r.ctx.globalAlpha = Math.min(0.85, this.resultTimer * 0.7);
      r.drawRect(0, 0, W, H, '#000000');
      r.ctx.restore();
      r.ctx.globalAlpha = Math.min(1, this.resultTimer * 0.7);
      if (this.battle.victory) {
        r.drawTextCentered('VICTORY!', W/2, H/2 - 60, '#ffdd44', 52, 'monospace', true);
        r.drawTextCentered(`+${this.battle.totalExp} EXP  +${this.battle.totalGold} Gold`, W/2, H/2, '#aaffaa', 24);
        if (this.battle.loot.length > 0) {
          r.drawTextCentered(`Loot: ${this.battle.loot.join(', ')}`, W/2, H/2 + 35, '#ffcc88', 18);
        }
      } else if (this.battle.fled) {
        r.drawTextCentered('FLED!', W/2, H/2, '#aaaaff', 52, 'monospace', true);
      } else {
        r.drawTextCentered('DEFEAT...', W/2, H/2, '#ff4444', 52, 'monospace', true);
      }
      r.ctx.globalAlpha = 1;
      r.drawTextCentered('Click or press Enter to continue', W/2, H/2 + 80, '#888888', 16);
    }
  }

  _renderActionMenu(r, W, H, menuBgY) {
    const current = this.battle.getCurrentActor();
    const member = current?.isPlayer ? current.entity : null;
    // Left side: action buttons
    const actions = ['Attack', 'Skill', 'Magic', 'Item', 'Defend', 'Flee'];
    const btnH = 36, btnW = 130, menuX = 10, menuY = menuBgY + 8;
    actions.forEach((a, i) => {
      const bx = menuX + Math.floor(i / 3) * (btnW + 5);
      const by = menuY + (i % 3) * (btnH + 4);
      const hov = this.game.input.isMouseOver(bx, by, btnW, btnH);
      const sel = this.actionIndex === i && this.phase === 'select_action';
      r.drawButton(bx, by, btnW, btnH, a, hov, sel);
    });
    // Right side: submenu
    switch(this.phase) {
      case 'select_skill': this._renderSkillMenu(r, member, W, H, menuBgY); break;
      case 'select_spell': this._renderSpellMenu(r, member, W, H, menuBgY); break;
      case 'select_item':  this._renderItemMenu(r, W, H, menuBgY); break;
      case 'select_target': this._renderTargetPrompt(r, W, H, menuBgY); break;
      default: this._renderStatusPanel(r, member, W, H, menuBgY); break;
    }
  }

  _renderSkillMenu(r, member, W, H, menuBgY) {
    if (!member) return;
    const skills = member.learnedSkills || [];
    const menuX = W * 0.32, menuY = menuBgY + 8;
    r.drawText('Skills:', menuX, menuY, '#ffdd88', 16, 'left', 'monospace', true);
    if (skills.length === 0) { r.drawText('No skills yet', menuX, menuY + 25, '#888899', 14); return; }
    const perCol = 3, colW = 240;
    skills.forEach((sId, i) => {
      const skill = SKILLS[sId];
      if (!skill) return;
      const col = Math.floor(i / perCol), row = i % perCol;
      const bx = menuX + col * colW, by = menuY + 20 + row * 34;
      const hov = this.game.input.isMouseOver(bx, by, colW-5, 30);
      const sel = this.skillIndex === i;
      const canUse = member.mp >= skill.mpCost;
      r.drawRoundRect(bx, by, colW - 5, 30, 4,
        sel ? '#2a2a6a' : hov ? '#1e1e4e' : '#141430',
        sel ? '#aaaaff' : canUse ? '#445566' : '#663333', 1);
      r.drawText(skill.name, bx + 5, by + 6, canUse ? (sel ? '#fff' : '#ccc') : '#885555', 13);
      r.drawText(`${skill.mpCost}MP`, bx + colW - 45, by + 6, canUse ? '#4488cc' : '#885555', 12);
    });
    r.drawText('ESC: Back', menuX, menuBgY + 175, '#666677', 13);
  }

  _renderSpellMenu(r, member, W, H, menuBgY) {
    if (!member) return;
    const spells = member.learnedSpells || [];
    const menuX = W * 0.32, menuY = menuBgY + 8;
    r.drawText('Spells:', menuX, menuY, '#ffdd88', 16, 'left', 'monospace', true);
    if (spells.length === 0) {
      r.drawText('No spells learned.', menuX, menuY + 25, '#888899', 14);
      r.drawText('Buy spell scrolls at the Magic Shop!', menuX, menuY + 45, '#666677', 13);
      r.drawText('ESC: Back', menuX, menuBgY + 175, '#666677', 13);
      return;
    }
    spells.forEach((sId, i) => {
      const spell = SPELLS[sId];
      if (!spell) return;
      const bx = menuX, by = menuY + 20 + i * 34;
      const hov = this.game.input.isMouseOver(bx, by, 280, 30);
      const sel = this.spellIndex === i;
      const canUse = member.mp >= spell.mpCost;
      r.drawRoundRect(bx, by, 280, 30, 4,
        sel ? '#2a2a6a' : hov ? '#1e1e4e' : '#141430',
        sel ? '#aaaaff' : '#445566', 1);
      r.drawText(spell.name, bx + 5, by + 6, canUse ? '#ccc' : '#885555', 13);
      r.drawText(spell.element || '', bx + 160, by + 6, ELEMENT_COLORS[spell.element] || '#ffffff', 12);
      r.drawText(`${spell.mpCost}MP`, bx + 230, by + 6, canUse ? '#4488cc' : '#885555', 12);
    });
    r.drawText('ESC: Back', menuX, menuBgY + 175, '#666677', 13);
  }

  _renderItemMenu(r, W, H, menuBgY) {
    const items = this.game.party.inventory.getItemsByType('consumable');
    const menuX = W * 0.32, menuY = menuBgY + 8;
    r.drawText('Items:', menuX, menuY, '#ffdd88', 16, 'left', 'monospace', true);
    if (items.length === 0) { r.drawText('No items', menuX, menuY + 25, '#888899', 14); return; }
    const perCol = 3, colW = 200;
    items.forEach((item, i) => {
      const col = Math.floor(i / perCol), row = i % perCol;
      const bx = menuX + col * colW, by = menuY + 20 + row * 34;
      const hov = this.game.input.isMouseOver(bx, by, colW-5, 30);
      const sel = this.itemIndex === i;
      r.drawRoundRect(bx, by, colW-5, 30, 4, sel ? '#2a2a6a' : hov ? '#1e1e4e' : '#141430', sel ? '#aaaaff' : '#445566', 1);
      const iData = item.data || {};
      r.drawText(iData.name || item.id.replace(/_/g,' '), bx+5, by+6, '#cccccc', 12);
      r.drawText(`x${item.quantity}`, bx+colW-30, by+6, '#88aacc', 12);
    });
    r.drawText('ESC: Back', menuX, menuBgY + 175, '#666677', 13);
  }

  _renderTargetPrompt(r, W, H, menuBgY) {
    const menuX = W * 0.32, menuY = menuBgY + 8;
    const isEnemy = this.targetList === this.battle.aliveEnemies;
    r.drawText(`Select ${isEnemy ? 'enemy' : 'ally'} target:`, menuX, menuY, '#ffdd88', 16, 'left', 'monospace', true);
    this.targetList.forEach((t, i) => {
      const by = menuY + 25 + i * 34;
      const sel = this.selectedTarget === i;
      const hov = this.game.input.isMouseOver(menuX, by, 240, 30);
      r.drawRoundRect(menuX, by, 240, 30, 4, sel ? '#2a2a6a' : hov ? '#1e1e4e' : '#141430', sel ? '#ffff00' : '#445566', 1);
      r.drawText(t.name, menuX + 5, by + 6, '#fff', 13);
      r.drawBar(menuX + 130, by + 8, 100, 10, t.hp, t.maxHp, isEnemy ? '#cc4444' : '#44cc66');
    });
    r.drawText('Arrow keys / click to select  Enter: confirm  ESC: cancel', menuX, menuBgY + 175, '#666677', 12);
  }

  _renderStatusPanel(r, member, W, H, menuBgY) {
    if (!member) return;
    const menuX = W * 0.32, menuY = menuBgY + 8;
    r.drawText(`${member.name} - Lv${member.level} ${member.classId}`, menuX, menuY, '#aaffcc', 16, 'left', 'monospace', true);
    r.drawText(`HP: ${member.hp}/${member.maxHp}   MP: ${member.mp}/${member.maxMp}`, menuX, menuY + 22, '#cccccc', 14);
    r.drawText(`ATK: ${member.atk}  DEF: ${member.def}  SPD: ${member.spd}`, menuX, menuY + 42, '#aaaacc', 13);
    // Show buffs
    if (member.battleBuffs.length > 0) {
      r.drawText('Active buffs: ' + member.battleBuffs.map(b => b.name || b.effect).join(', '), menuX, menuY + 60, '#44ff88', 12);
    }
    // Floor and enemies info
    r.drawText(`Floor ${this.game.currentFloor}  Enemies: ${this.battle.aliveEnemies.length}`, menuX, menuY + 80, '#888899', 13);
    r.drawText('WASD/Arrows: Select  Enter/Space: Confirm  Click to select', menuX, menuBgY + 175, '#666677', 12);
  }
}
