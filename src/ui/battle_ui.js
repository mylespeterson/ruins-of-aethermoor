import { Battle } from '../combat/battle.js';
import { SKILLS } from '../data/skills.js';
import { SPELLS } from '../data/spells.js';
import { ELEMENT_COLORS } from '../combat/elements.js';
import { STATUS_EFFECTS } from '../combat/status_effects.js';

// ─── Layout constants ───────────────────────────────────────────────────────
const PANEL_H       = 210;          // bottom action panel height
const BTN_W         = 130;
const BTN_H         = 38;
const POPUP_ITEMS_PER_COL = 4;
const POPUP_ITEM_H  = 46;           // item row height (including gap)
const POPUP_HEADER  = 38;           // space for title inside popup
const POPUP_FOOTER  = 24;           // space for hint text inside popup
const MAX_LOG_LINES = 6;            // battle log lines kept in memory

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
    // Scroll offsets for long lists
    this.skillScroll = 0;
    this.spellScroll = 0;
    this.itemScroll = 0;
    // Whether the current select_target phase is targeting enemies (vs allies).
    // We use a boolean flag instead of reference-comparing this.targetList to
    // this.battle.aliveEnemies, because aliveEnemies is a getter that returns a
    // new array every call, so === would always be false.
    this.targetIsEnemies = false;
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
    this.skillScroll = 0;
    this.spellScroll = 0;
    this.itemScroll = 0;
    this._syncCurrentActor();
  }

  _syncCurrentActor() {
    const actor = this.battle.getCurrentActor();
    if (!actor) return;
    if (actor.isPlayer) {
      this.phase = 'select_action';
      this.actionIndex = 0;
      this.selectedPartyMember = this.game.party.members.indexOf(actor.entity);
    } else {
      this.phase = 'enemy_turn';
    }
  }

  // ── Shared layout helpers ────────────────────────────────────────────────

  /** Y coordinate of the bottom action panel */
  _panelY(H) { return H - PANEL_H; }

  /** Y coordinate for action button rows inside the panel */
  _actionMenuY(H) { return this._panelY(H) + 8; }

  /**
   * Bounding box of the submenu popup that appears ABOVE the bottom panel.
   * Items are rendered here so they never get clipped by the panel.
   */
  _popupBounds(W, H) {
    const panelY = this._panelY(H);
    const h = POPUP_HEADER + POPUP_ITEMS_PER_COL * POPUP_ITEM_H + POPUP_FOOTER;
    return { x: 10, y: panelY - h - 8, w: W - 20, h };
  }

  /**
   * Returns layout parameters for the popup grid of `count` items.
   * numCols is capped at 5 to keep items readable.
   */
  _popupItemLayout(count, W, H) {
    const pb = this._popupBounds(W, H);
    const numCols = Math.max(1, Math.min(5, Math.ceil(count / POPUP_ITEMS_PER_COL)));
    const colW = Math.floor((pb.w - 20) / numCols);
    return { pb, numCols, colW, itemH: POPUP_ITEM_H, headerH: POPUP_HEADER };
  }

  /** Bounding rect for item i inside the popup. */
  _popupItemRect(i, layout) {
    const col = Math.floor(i / POPUP_ITEMS_PER_COL);
    const row = i % POPUP_ITEMS_PER_COL;
    return {
      x: layout.pb.x + 10 + col * layout.colW,
      y: layout.pb.y + layout.headerH + row * layout.itemH,
      w: layout.colW - 8,
      h: layout.itemH - 4,
    };
  }

  // ── Update: action selection ─────────────────────────────────────────────

  update(dt) {
    this.animTime += dt;
    this.turnDelay = Math.max(0, this.turnDelay - dt);
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
      this.battle.executeEnemyTurn();
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
    // Use the same coordinates as _renderActionMenu
    const menuX = 10, menuY = this._actionMenuY(H);
    actions.forEach((a, i) => {
      const bx = menuX + Math.floor(i / 3) * (BTN_W + 5);
      const by = menuY + (i % 3) * (BTN_H + 4);
      if (input.isClickIn(bx, by, BTN_W, BTN_H)) {
        this.actionIndex = i;
        this._selectAction(a);
      }
    });
    if (input.isKeyJustPressed('ArrowDown')) this.actionIndex = Math.min(5, this.actionIndex + 1);
    if (input.isKeyJustPressed('ArrowUp'))   this.actionIndex = Math.max(0, this.actionIndex - 1);
    if (input.isKeyJustPressed('ArrowRight')) this.actionIndex = Math.min(5, this.actionIndex + 3);
    if (input.isKeyJustPressed('ArrowLeft'))  this.actionIndex = Math.max(0, this.actionIndex - 3);
    if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
      this._selectAction(actions[this.actionIndex]);
    }
  }

  _selectAction(action) {
    switch(action) {
      case 'Attack':
        this.phase = 'select_target';
        this.targetList = this.battle.aliveEnemies;
        this.targetIsEnemies = true;
        this.selectedTarget = 0;
        this.pendingAction = { type: 'attack' };
        break;
      case 'Skill':
        this.phase = 'select_skill';
        this.skillIndex = 0;
        this.skillScroll = 0;
        break;
      case 'Magic':
        this.phase = 'select_spell';
        this.spellIndex = 0;
        this.spellScroll = 0;
        break;
      case 'Item':
        this.phase = 'select_item';
        this.itemIndex = 0;
        this.itemScroll = 0;
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
    if (input.isKeyJustPressed('ArrowDown')) this.skillIndex = Math.min(skills.length - 1, this.skillIndex + 1);
    if (input.isKeyJustPressed('ArrowUp'))   this.skillIndex = Math.max(0, this.skillIndex - 1);
    if (input.isKeyJustPressed('ArrowRight')) this.skillIndex = Math.min(skills.length - 1, this.skillIndex + POPUP_ITEMS_PER_COL);
    if (input.isKeyJustPressed('ArrowLeft'))  this.skillIndex = Math.max(0, this.skillIndex - POPUP_ITEMS_PER_COL);
    // Click detection uses SAME layout as render
    const layout = this._popupItemLayout(skills.length, W, H);
    skills.forEach((sId, i) => {
      const rect = this._popupItemRect(i, layout);
      if (input.isClickIn(rect.x, rect.y, rect.w, rect.h)) {
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
      this.targetList = isAlly ? this.game.party.members : this.battle.aliveEnemies;
      this.targetIsEnemies = !isAlly;
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
    if (input.isKeyJustPressed('ArrowDown')) this.spellIndex = Math.min(Math.max(0, spells.length - 1), this.spellIndex + 1);
    if (input.isKeyJustPressed('ArrowUp'))   this.spellIndex = Math.max(0, this.spellIndex - 1);
    if (input.isKeyJustPressed('ArrowRight')) this.spellIndex = Math.min(Math.max(0, spells.length - 1), this.spellIndex + POPUP_ITEMS_PER_COL);
    if (input.isKeyJustPressed('ArrowLeft'))  this.spellIndex = Math.max(0, this.spellIndex - POPUP_ITEMS_PER_COL);
    // Click detection uses SAME layout as render
    const layout = this._popupItemLayout(spells.length, W, H);
    spells.forEach((sId, i) => {
      const rect = this._popupItemRect(i, layout);
      if (input.isClickIn(rect.x, rect.y, rect.w, rect.h)) {
        this.spellIndex = i;
        const spell = SPELLS[sId];
        if (spell && member.mp >= spell.mpCost) this._executeSpellAction(sId, spell, member);
        else if (spell) this._addLog('Not enough MP!');
      }
    });
    if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
      const sId = spells[this.spellIndex];
      const spell = sId ? SPELLS[sId] : null;
      if (spell && member.mp >= spell.mpCost) this._executeSpellAction(sId, spell, member);
      else if (spell) this._addLog('Not enough MP!');
    }
  }

  _executeSpellAction(spellId, spell, member) {
    member.mp = Math.max(0, member.mp - spell.mpCost);
    let msg = `${member.name} casts ${spell.name}!`;
    const targets = spell.target === 'all_enemies' ? this.battle.aliveEnemies
      : spell.target === 'all_allies' ? this.battle.aliveParty
      : spell.target === 'single_ally' ? [this.battle.aliveParty[0]]
      : [this.battle.aliveEnemies[0]];
    if (spell.type === 'magic') {
      targets.forEach(t => {
        if (!t.alive) return;
        const base = spell.power * (25 + member.int * 2.5);
        const dmg = Math.round(base * (0.9 + Math.random() * 0.2));
        const actual = typeof t.takeDamage === 'function' ? t.takeDamage(dmg) : (t.hp = Math.max(0, t.hp - dmg), t.hp <= 0 && (t.alive = false), dmg);
        this._addFloatingText(t.name, `-${actual}`, ELEMENT_COLORS[spell.element] || '#ffff00');
        msg += ` ${t.name} takes ${actual}!`;
      });
    } else if (spell.type === 'heal') {
      targets.forEach(t => {
        if (!t.alive) return;
        const amt = Math.round(spell.power * (20 + member.wis * 3));
        const actual = t.heal ? t.heal(amt) : 0;
        this._addFloatingText(t.name, `+${actual}`, '#44ff88');
        msg += ` ${t.name} +${actual} HP!`;
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
    if (input.isKeyJustPressed('ArrowDown')) this.itemIndex = Math.min(Math.max(0, items.length - 1), this.itemIndex + 1);
    if (input.isKeyJustPressed('ArrowUp'))   this.itemIndex = Math.max(0, this.itemIndex - 1);
    if (input.isKeyJustPressed('ArrowRight')) this.itemIndex = Math.min(Math.max(0, items.length - 1), this.itemIndex + POPUP_ITEMS_PER_COL);
    if (input.isKeyJustPressed('ArrowLeft'))  this.itemIndex = Math.max(0, this.itemIndex - POPUP_ITEMS_PER_COL);
    // Click detection uses SAME layout as render
    const layout = this._popupItemLayout(items.length, W, H);
    items.forEach((item, i) => {
      const rect = this._popupItemRect(i, layout);
      if (input.isClickIn(rect.x, rect.y, rect.w, rect.h)) {
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
    this.targetIsEnemies = isForEnemy;
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
    if (this.targetIsEnemies) {
      // Click on enemy sprite — same coordinates as render
      this.targetList.forEach((enemy, i) => {
        const ex = this._getEnemyX(i, this.targetList.length);
        const ey = H * 0.12;
        const ew = 90, eh = 110;
        if (input.isClickIn(ex - ew / 2 - 8, ey - 8, ew + 16, eh + 55)) {
          this.selectedTarget = i;
          this._finalizeAction();
        }
      });
    } else {
      // Ally targets in bottom panel — same coords as _renderTargetPrompt
      const panelX = W * 0.34, panelY = this._actionMenuY(H);
      this.targetList.forEach((member, i) => {
        const by = panelY + 30 + i * 44;
        if (input.isClickIn(panelX, by, 300, 40)) {
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
    this._executeAction({ ...this.pendingAction, target });
    this.pendingAction = null;
  }

  _executeAction(action) {
    const result = this.battle.executePlayerAction(action);
    const lastMsg = this.battle.log[this.battle.log.length - 1];
    if (lastMsg) this._addLog(lastMsg);
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
    if (this.battle.log.length > MAX_LOG_LINES) this.battle.log = this.battle.log.slice(-MAX_LOG_LINES);
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

  // ── Render ───────────────────────────────────────────────────────────────

  render(r) {
    const W = r.width, H = r.height;
    // Background
    r.drawGradientBG(0, 0, W, H, '#0a0514', '#1a0a24');
    r.drawRect(0, H * 0.68, W, 3, '#334466');
    for (let i = 0; i < 8; i++) {
      r.ctx.strokeStyle = 'rgba(50,50,100,0.15)'; r.ctx.lineWidth = 1;
      r.ctx.beginPath(); r.ctx.moveTo(0, H * 0.68 + i * 5); r.ctx.lineTo(W, H * 0.68 + i * 5); r.ctx.stroke();
    }

    // ── Enemies ────────────────────────────────────────────────────────────
    const enemies = this.battle.aliveEnemies;
    const isEnemyTargeting = this.phase === 'select_target' && this.targetIsEnemies;
    enemies.forEach((enemy, i) => {
      const ex = this._getEnemyX(i, enemies.length);
      const ey = H * 0.12;
      const ew = 90, eh = 110;
      const isSelected = isEnemyTargeting && this.selectedTarget === i;
      const isHovered = this.game.input.isMouseOver(ex - ew / 2 - 8, ey - 8, ew + 16, eh + 55);

      if (isSelected) {
        // Pulsing glow background
        const pulse = 0.5 + 0.5 * Math.sin(this.animTime * 6);
        r.ctx.save();
        r.ctx.globalAlpha = 0.18 + 0.12 * pulse;
        r.drawRect(ex - ew / 2 - 10, ey - 10, ew + 20, eh + 20, '#ffdd00');
        r.ctx.restore();
        // Bright animated border
        r.ctx.save();
        r.ctx.shadowBlur = 18 + pulse * 12;
        r.ctx.shadowColor = '#ffee00';
        r.drawRoundRect(ex - ew / 2 - 4, ey - 4, ew + 8, eh + 8, 6, null, '#ffee00', 2 + pulse * 1.5);
        r.ctx.restore();
        // "▶ TARGET ◀" banner above enemy
        const bannerW = 100;
        r.drawRoundRect(ex - bannerW / 2, ey - 30, bannerW, 22, 4, '#882200', '#ffaa00', 2);
        r.drawTextCentered('▶ TARGET ◀', ex, ey - 28, '#ffffff', 12, 'monospace', true);
        // Downward triangle pointer
        r.ctx.fillStyle = '#ffaa00';
        r.ctx.beginPath();
        r.ctx.moveTo(ex - 7, ey - 10);
        r.ctx.lineTo(ex + 7, ey - 10);
        r.ctx.lineTo(ex, ey - 2);
        r.ctx.closePath();
        r.ctx.fill();
      } else if (isHovered && isEnemyTargeting) {
        r.ctx.save(); r.ctx.globalAlpha = 0.12;
        r.drawRect(ex - ew / 2, ey, ew, eh, '#ffffff');
        r.ctx.restore();
        r.drawRoundRect(ex - ew / 2, ey, ew, eh, 4, null, '#888888', 1);
      }

      r.drawEnemySprite(enemy, ex - ew / 2, ey, ew, eh, this.animTime);

      // HP bar — wider for readability
      r.drawBar(ex - 50, ey + eh + 6, 100, 11, enemy.hp, enemy.maxHp, '#cc3333', '#2a1010', `${enemy.hp}/${enemy.maxHp}`);

      // Enemy name — more prominent, highlighted when selected
      const nameColor = isSelected ? '#ffee44' : '#dddddd';
      r.drawTextCentered(enemy.name, ex, ey + eh + 22, nameColor, isSelected ? 15 : 13, 'monospace', isSelected);

      // Status icons
      enemy.statusEffects.forEach((e, si) => {
        const def = STATUS_EFFECTS[e.id];
        r.drawText(def ? def.icon : '?', ex - 40 + si * 18, ey - 22, '#ffffff', 14);
      });
    });

    // Dead enemies (faded)
    this.battle.enemies.forEach((enemy, i) => {
      if (enemy.alive) return;
      const ex = this._getEnemyX(i, this.battle.enemies.length);
      r.ctx.save(); r.ctx.globalAlpha = 0.15;
      r.drawEnemySprite(enemy, ex - 45, H * 0.55, 80, 70, 0);
      r.ctx.restore();
    });

    // ── Party (left side) ─────────────────────────────────────────────────
    this.game.party.members.forEach((member, i) => {
      const px = 40, py = H * 0.15 + i * 110;
      const pw = 70, ph = 85;
      const isActive = this.battle.getCurrentActor()?.entity === member;
      const isTargeted = this.phase === 'select_target' && !this.targetIsEnemies && this.selectedTarget === i;
      if (isActive) {
        r.ctx.save(); r.ctx.globalAlpha = 0.2;
        r.drawRect(px - 5, py - 5, pw + 10, ph + 10, '#4488ff');
        r.ctx.restore();
        r.drawRoundRect(px - 5, py - 5, pw + 10, ph + 10, 4, null, '#4488ff', 2);
      }
      if (isTargeted) {
        r.ctx.save(); r.ctx.globalAlpha = 0.25;
        r.drawRect(px - 5, py - 5, pw + 10, ph + 10, '#ffff00');
        r.ctx.restore();
        r.drawRoundRect(px - 5, py - 5, pw + 10, ph + 10, 4, null, '#ffff00', 2);
      }
      r.ctx.save(); r.ctx.globalAlpha = member.alive ? 1 : 0.35;
      r.drawSprite(member.classId, px, py, pw, ph, '#4466cc', this.animTime);
      r.ctx.restore();
      const infoX = px + pw + 8;
      r.drawText(`${member.name}`, infoX, py, member.alive ? '#ffffff' : '#666666', 13, 'left', 'monospace', true);
      r.drawText(`Lv${member.level} ${member.classId}`, infoX, py + 14, '#aaaacc', 11);
      r.drawBar(infoX, py + 28, 110, 10, member.hp, member.maxHp, member.hp / member.maxHp < 0.3 ? '#ff4444' : '#44cc66', '#222', `${member.hp}/${member.maxHp}`);
      r.drawBar(infoX, py + 42, 110, 10, member.mp, member.maxMp, '#4488cc', '#222', `${member.mp}/${member.maxMp}`);
      member.statusEffects.forEach((e, si) => {
        const def = STATUS_EFFECTS[e.id];
        r.drawText(def ? def.icon : '?', infoX + si * 18, py + 56, '#ffffff', 13);
      });
      member.battleBuffs.forEach((b, bi) => {
        r.drawText('↑', infoX + (member.statusEffects.length + bi) * 18, py + 56, '#44ff88', 13);
      });
    });

    // ── Bottom action panel ───────────────────────────────────────────────
    const panelY = this._panelY(H);
    r.drawRoundRect(0, panelY, W, PANEL_H, 0, 'rgba(4,4,18,0.97)', '#334', 1);
    this._renderActionMenu(r, W, H, panelY);

    // ── Battle log (right side of panel) ─────────────────────────────────
    const logX = W * 0.32, logY = panelY + 5;
    r.drawRoundRect(logX, logY, W - logX - 10, 100, 4, 'rgba(8,8,28,0.85)', '#334455', 1);
    const logs = this.battle.log.slice(-MAX_LOG_LINES);
    logs.forEach((line, i) => {
      r.drawText(line, logX + 8, logY + 6 + i * 18,
        i === logs.length - 1 ? '#ffffff' : '#778899', 12);
    });

    // ── Turn indicator ────────────────────────────────────────────────────
    const actor = this.battle.getCurrentActor();
    if (actor) {
      const label = actor.isPlayer
        ? `⚔ ${actor.entity.name}'s turn`
        : `${actor.entity.name} is acting...`;
      r.drawTextCentered(label, W * 0.62, panelY + 115, actor.isPlayer ? '#88aaff' : '#ff8866', 16, 'monospace', true);
    }

    // ── Submenu popup — rendered ABOVE the panel, always on top ──────────
    if (['select_skill','select_spell','select_item'].includes(this.phase)) {
      this._renderSubmenuPopup(r, W, H);
    }

    // ── Floating damage/heal numbers ──────────────────────────────────────
    this.floatingTexts.forEach(ft => {
      r.ctx.save();
      r.ctx.globalAlpha = ft.alpha;
      r.ctx.shadowBlur = 6;
      r.ctx.shadowColor = ft.color;
      r.drawTextCentered(ft.text, W * 0.7, ft.y, ft.color, 26, 'monospace', true);
      r.ctx.restore();
    });

    // ── Battle result overlay ─────────────────────────────────────────────
    if (this.battle.isOver()) {
      r.ctx.save(); r.ctx.globalAlpha = Math.min(0.85, this.resultTimer * 0.7);
      r.drawRect(0, 0, W, H, '#000000');
      r.ctx.restore();
      r.ctx.globalAlpha = Math.min(1, this.resultTimer * 0.7);
      if (this.battle.victory) {
        r.drawTextCentered('VICTORY!', W / 2, H / 2 - 60, '#ffdd44', 52, 'monospace', true);
        r.drawTextCentered(`+${this.battle.totalExp} EXP  +${this.battle.totalGold} Gold`, W / 2, H / 2, '#aaffaa', 24);
        if (this.battle.loot && this.battle.loot.length > 0) {
          r.drawTextCentered(`Loot: ${this.battle.loot.join(', ')}`, W / 2, H / 2 + 35, '#ffcc88', 18);
        }
      } else if (this.battle.fled) {
        r.drawTextCentered('FLED!', W / 2, H / 2, '#aaaaff', 52, 'monospace', true);
      } else {
        r.drawTextCentered('DEFEAT...', W / 2, H / 2, '#ff4444', 52, 'monospace', true);
      }
      r.ctx.globalAlpha = 1;
      r.drawTextCentered('Click or press Enter to continue', W / 2, H / 2 + 80, '#888888', 16);
    }
  }

  // ── Panel rendering ───────────────────────────────────────────────────────

  _renderActionMenu(r, W, H, panelY) {
    const current = this.battle.getCurrentActor();
    const member = current?.isPlayer ? current.entity : null;
    const actions = ['Attack', 'Skill', 'Magic', 'Item', 'Defend', 'Flee'];
    const menuX = 10, menuY = this._actionMenuY(H);
    // Draw action buttons — always visible, dimmed if a submenu is open
    const inSubmenu = ['select_skill','select_spell','select_item'].includes(this.phase);
    actions.forEach((a, i) => {
      const bx = menuX + Math.floor(i / 3) * (BTN_W + 5);
      const by = menuY + (i % 3) * (BTN_H + 4);
      const hov = this.game.input.isMouseOver(bx, by, BTN_W, BTN_H);
      const sel = this.actionIndex === i && this.phase === 'select_action';
      r.ctx.save();
      if (inSubmenu) r.ctx.globalAlpha = 0.45;
      r.drawButton(bx, by, BTN_W, BTN_H, a, hov, sel);
      r.ctx.restore();
    });
    // Right-side context info
    switch(this.phase) {
      case 'select_skill':
      case 'select_spell':
      case 'select_item':
        this._renderSubmenuOpenHint(r, member, W, H, panelY);
        break;
      case 'select_target':
        this._renderTargetPrompt(r, W, H, panelY);
        break;
      default:
        this._renderStatusPanel(r, member, W, H, panelY);
    }
  }

  /** Small hint shown in the panel while the popup is open */
  _renderSubmenuOpenHint(r, member, W, H, panelY) {
    const x = W * 0.34, y = panelY + 8;
    const phaseLabel = { select_skill:'SKILLS', select_spell:'SPELLS', select_item:'ITEMS' }[this.phase] || '';
    r.drawText(`Choosing ${phaseLabel}…`, x, y, '#ffdd88', 16, 'left', 'monospace', true);
    if (member) {
      r.drawText(`${member.name}  MP: ${member.mp}/${member.maxMp}`, x, y + 22, '#88aacc', 13);
    }
    r.drawText('↑↓←→ Navigate   Enter/Click: Use   ESC: Back', x, y + 44, '#556677', 13);
  }

  /** Rendered AFTER the panel so it appears on top */
  _renderSubmenuPopup(r, W, H) {
    const current = this.battle.getCurrentActor();
    const member = current?.isPlayer ? current.entity : null;
    switch(this.phase) {
      case 'select_skill': this._renderSkillMenu(r, member, W, H); break;
      case 'select_spell': this._renderSpellMenu(r, member, W, H); break;
      case 'select_item':  this._renderItemMenu(r, W, H); break;
    }
  }

  _renderSkillMenu(r, member, W, H) {
    if (!member) return;
    const skills = member.learnedSkills || [];
    const layout = this._popupItemLayout(Math.max(skills.length, 1), W, H);
    const pb = layout.pb;

    // Popup backdrop
    r.drawRoundRect(pb.x, pb.y, pb.w, pb.h, 8, 'rgba(4,4,22,0.97)', '#4444cc', 2);

    // Title
    r.drawText('SKILLS', pb.x + 12, pb.y + 8, '#ffdd88', 16, 'left', 'monospace', true);
    r.drawText(`${member.name}  MP ${member.mp}/${member.maxMp}`, pb.x + 95, pb.y + 10, '#88aacc', 13);
    if (skills.length === 0) {
      r.drawTextCentered('No skills learned yet', pb.x + pb.w / 2, pb.y + pb.h / 2 - 8, '#888899', 14);
    }

    skills.forEach((sId, i) => {
      const skill = SKILLS[sId];
      if (!skill) return;
      const rect = this._popupItemRect(i, layout);
      const sel = this.skillIndex === i;
      const hov = this.game.input.isMouseOver(rect.x, rect.y, rect.w, rect.h);
      const canUse = member.mp >= skill.mpCost;

      r.drawRoundRect(rect.x, rect.y, rect.w, rect.h, 5,
        sel ? '#1e2866' : hov ? '#181e50' : '#0e1030',
        sel ? '#88aaff' : canUse ? '#334466' : '#442222', sel ? 2 : 1);

      // Selection arrow
      if (sel) r.drawText('▶', rect.x + 3, rect.y + 7, '#88aaff', 14);
      r.drawText(skill.name, rect.x + (sel ? 18 : 6), rect.y + 6, canUse ? (sel ? '#ffffff' : '#ccddff') : '#886666', 13);

      // MP cost
      const mpText = skill.mpCost > 0 ? `${skill.mpCost}MP` : 'Free';
      r.drawText(mpText, rect.x + rect.w - 44, rect.y + 6, canUse ? '#44aaff' : '#884444', 12);

      // Skill type dot
      const typeColor = skill.type === 'magic' ? '#aa44ff' : skill.type === 'heal' ? '#44ff88' : '#ff8844';
      r.drawRect(rect.x + rect.w - 50, rect.y + 24, 6, 6, typeColor);
    });

    // Footer hint
    r.drawText('↑↓←→ Navigate   Enter/Click: Use   ESC: Back', pb.x + 12, pb.y + pb.h - 20, '#445566', 12);
  }

  _renderSpellMenu(r, member, W, H) {
    if (!member) return;
    const spells = member.learnedSpells || [];
    const layout = this._popupItemLayout(Math.max(spells.length, 1), W, H);
    const pb = layout.pb;

    r.drawRoundRect(pb.x, pb.y, pb.w, pb.h, 8, 'rgba(4,4,22,0.97)', '#8844cc', 2);

    r.drawText('SPELLS', pb.x + 12, pb.y + 8, '#ffdd88', 16, 'left', 'monospace', true);
    r.drawText(`${member.name}  MP ${member.mp}/${member.maxMp}`, pb.x + 100, pb.y + 10, '#88aacc', 13);
    if (spells.length === 0) {
      r.drawTextCentered('No spells learned — visit the Magic Shop!', pb.x + pb.w / 2, pb.y + pb.h / 2 - 8, '#888899', 14);
    }

    spells.forEach((sId, i) => {
      const spell = SPELLS[sId];
      if (!spell) return;
      const rect = this._popupItemRect(i, layout);
      const sel = this.spellIndex === i;
      const hov = this.game.input.isMouseOver(rect.x, rect.y, rect.w, rect.h);
      const canUse = member.mp >= spell.mpCost;
      const elemColor = ELEMENT_COLORS[spell.element] || '#aaaaff';

      r.drawRoundRect(rect.x, rect.y, rect.w, rect.h, 5,
        sel ? '#2a1866' : hov ? '#1e1250' : '#130a30',
        sel ? '#cc88ff' : canUse ? '#553366' : '#442222', sel ? 2 : 1);

      if (sel) r.drawText('▶', rect.x + 3, rect.y + 7, '#cc88ff', 14);
      r.drawText(spell.name, rect.x + (sel ? 18 : 6), rect.y + 6, canUse ? (sel ? '#ffffff' : '#ddccff') : '#886666', 13);

      // Element label
      if (spell.element) {
        r.drawText(spell.element, rect.x + rect.w - 68, rect.y + 6, elemColor, 11);
      }
      r.drawText(`${spell.mpCost}MP`, rect.x + rect.w - 36, rect.y + 6, canUse ? '#aa66ff' : '#884444', 12);

      // Element color bar on left edge
      r.drawRect(rect.x, rect.y + 2, 3, rect.h - 4, elemColor);
    });

    r.drawText('↑↓←→ Navigate   Enter/Click: Cast   ESC: Back', pb.x + 12, pb.y + pb.h - 20, '#445566', 12);
  }

  _renderItemMenu(r, W, H) {
    const items = this.game.party.inventory.getItemsByType('consumable');
    const layout = this._popupItemLayout(Math.max(items.length, 1), W, H);
    const pb = layout.pb;

    r.drawRoundRect(pb.x, pb.y, pb.w, pb.h, 8, 'rgba(4,4,22,0.97)', '#44aa44', 2);

    r.drawText('ITEMS', pb.x + 12, pb.y + 8, '#ffdd88', 16, 'left', 'monospace', true);
    if (items.length === 0) {
      r.drawTextCentered('No consumable items', pb.x + pb.w / 2, pb.y + pb.h / 2 - 8, '#888899', 14);
    }

    items.forEach((item, i) => {
      const rect = this._popupItemRect(i, layout);
      const sel = this.itemIndex === i;
      const hov = this.game.input.isMouseOver(rect.x, rect.y, rect.w, rect.h);
      const iData = item.data || {};

      r.drawRoundRect(rect.x, rect.y, rect.w, rect.h, 5,
        sel ? '#163316' : hov ? '#122212' : '#0a1a0a',
        sel ? '#66ff66' : '#335533', sel ? 2 : 1);

      if (sel) r.drawText('▶', rect.x + 3, rect.y + 7, '#66ff66', 14);
      r.drawText(iData.name || item.id.replace(/_/g, ' '), rect.x + (sel ? 18 : 6), rect.y + 6, sel ? '#ffffff' : '#ccffcc', 13);
      r.drawText(`×${item.quantity}`, rect.x + rect.w - 32, rect.y + 6, '#88ccaa', 12);
      if (iData.description) {
        r.drawText(iData.description.slice(0, 28), rect.x + 6, rect.y + 24, '#667766', 10);
      }
    });

    r.drawText('↑↓←→ Navigate   Enter/Click: Use   ESC: Back', pb.x + 12, pb.y + pb.h - 20, '#445566', 12);
  }

  _renderTargetPrompt(r, W, H, panelY) {
    const x = W * 0.34, y = this._actionMenuY(H);
    const isEnemy = this.targetIsEnemies;
    r.drawText(`Select ${isEnemy ? 'enemy' : 'ally'} target:`, x, y, '#ffdd88', 15, 'left', 'monospace', true);

    if (isEnemy) {
      // Enemy target: show list in panel with HP bars
      this.targetList.forEach((t, i) => {
        const sel = this.selectedTarget === i;
        const by = y + 25 + i * 44;
        const bw = 310;
        const hov = this.game.input.isMouseOver(x, by, bw, 40);
        r.drawRoundRect(x, by, bw, 40, 5,
          sel ? '#332200' : hov ? '#221800' : '#120e00',
          sel ? '#ffee00' : '#664400', sel ? 2 : 1);
        if (sel) r.drawText('▶', x + 4, by + 11, '#ffee00', 14);
        r.drawText(t.name, x + (sel ? 18 : 8), by + 8, sel ? '#ffee44' : '#ffffff', 14, 'left', 'monospace', sel);
        r.drawBar(x + 160, by + 12, 140, 12, t.hp, t.maxHp, '#cc3333', '#2a1010', `${t.hp}/${t.maxHp}`);
      });
    } else {
      // Ally target list
      this.targetList.forEach((t, i) => {
        const sel = this.selectedTarget === i;
        const by = y + 25 + i * 44;
        const bw = 310;
        const hov = this.game.input.isMouseOver(x, by, bw, 40);
        r.drawRoundRect(x, by, bw, 40, 5,
          sel ? '#002233' : hov ? '#001822' : '#000e12',
          sel ? '#44eeff' : '#224455', sel ? 2 : 1);
        if (sel) r.drawText('▶', x + 4, by + 11, '#44eeff', 14);
        r.drawText(t.name, x + (sel ? 18 : 8), by + 8, t.alive ? (sel ? '#aaffff' : '#ffffff') : '#666666', 13, 'left', 'monospace', sel);
        r.drawBar(x + 150, by + 12, 130, 12, t.hp, t.maxHp, t.alive ? '#44cc66' : '#333333', '#1a2210', `${t.hp}/${t.maxHp}`);
      });
    }
    r.drawText('←→ / Click target   Enter: Confirm   ESC: Cancel', x, panelY + PANEL_H - 22, '#445566', 12);
  }

  _renderStatusPanel(r, member, W, H, panelY) {
    if (!member) return;
    const x = W * 0.34, y = this._actionMenuY(H);
    r.drawText(`${member.name}`, x, y, '#aaffcc', 16, 'left', 'monospace', true);
    r.drawText(`Lv${member.level} ${member.classId}`, x + 130, y + 3, '#8899aa', 13);
    r.drawText(`HP: ${member.hp}/${member.maxHp}`, x, y + 22, member.hp / member.maxHp < 0.3 ? '#ff6666' : '#ccffcc', 14);
    r.drawText(`MP: ${member.mp}/${member.maxMp}`, x + 180, y + 22, '#88aaff', 14);
    r.drawText(`ATK: ${member.atk}  DEF: ${member.def}  SPD: ${member.spd}`, x, y + 42, '#aaaacc', 13);
    if (member.battleBuffs.length > 0) {
      r.drawText('Buffs: ' + member.battleBuffs.map(b => b.name || b.effect).join(', '), x, y + 60, '#44ff88', 12);
    }
    r.drawText(`Floor ${this.game.currentFloor}  ·  Enemies: ${this.battle.aliveEnemies.length}`, x, y + 78, '#556677', 12);
    r.drawText('Arrows: Select   Enter/Space: Confirm   Click enemy to attack', x, panelY + PANEL_H - 22, '#445566', 12);
  }
}
