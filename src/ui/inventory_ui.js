import { CLASSES } from '../data/classes.js';
import { RACES } from '../data/races.js';
import { SKILLS } from '../data/skills.js';
import { SPELLS } from '../data/spells.js';

const SLOT_ORDER = ['weapon','head','chest','legs','boots'];
const SLOT_LABELS = { weapon:'Weapon', head:'Head', chest:'Chest', legs:'Legs', boots:'Boots' };

export class InventoryUI {
  constructor(game) {
    this.game = game;
    this.tab = 'items'; // items, equipment, spells, status
    this.selectedItem = 0;
    this.selectedMember = 0;
    this.selectedSlot = 'weapon';
    this.selectedEquipItem = 0;
    this.returnState = 'DUNGEON';
    this.scrollOffset = 0;
    this.subTab = 'items';
  }

  onEnter(data) {
    this.returnState = data?.returnState || 'DUNGEON';
    this.tab = 'items';
    this.selectedItem = 0;
    this.scrollOffset = 0;
  }

  update(dt) {
    const input = this.game.input;
    const W = this.game.canvas.width, H = this.game.canvas.height;
    if (input.isKeyJustPressed('Escape') || input.isKeyJustPressed('KeyI')) {
      this.game.setState(this.returnState);
      return;
    }
    if (input.isKeyJustPressed('KeyQ')) {
      this.selectedMember = (this.selectedMember - 1 + this.game.party.members.length) % this.game.party.members.length;
    }
    if (input.isKeyJustPressed('KeyE')) {
      this.selectedMember = (this.selectedMember + 1) % this.game.party.members.length;
    }
    // Tab selection
    const tabs = ['items','equipment','spells','status'];
    tabs.forEach((t, i) => {
      if (input.isClickIn(10 + i * 110, 50, 105, 32)) { this.tab = t; this.selectedItem = 0; this.scrollOffset = 0; }
    });
    // Arrow navigation
    switch(this.tab) {
      case 'items':     this._updateItemsTab(input, W, H); break;
      case 'equipment': this._updateEquipTab(input, W, H); break;
      case 'spells':    this._updateSpellsTab(input, W, H); break;
      case 'status':    break;
    }
  }

  _updateItemsTab(input, W, H) {
    const items = this.game.party.inventory.getAllItems();
    const maxItems = 8;
    if (input.isKeyJustPressed('ArrowDown')) this.selectedItem = Math.min(items.length - 1, this.selectedItem + 1);
    if (input.isKeyJustPressed('ArrowUp')) this.selectedItem = Math.max(0, this.selectedItem - 1);
    // Adjust scroll
    if (this.selectedItem >= this.scrollOffset + maxItems) this.scrollOffset = this.selectedItem - maxItems + 1;
    if (this.selectedItem < this.scrollOffset) this.scrollOffset = this.selectedItem;
    // Click items
    items.slice(this.scrollOffset, this.scrollOffset + maxItems).forEach((item, vi) => {
      if (input.isClickIn(10, 100 + vi * 50, 400, 46)) {
        this.selectedItem = vi + this.scrollOffset;
      }
    });
    // Use/Equip button
    if (input.isKeyJustPressed('Enter') || input.isClickIn(W - 150, H - 100, 140, 44)) {
      const item = items[this.selectedItem];
      if (item) this._useOrEquipItem(item);
    }
    // Drop (sell in town)
    if (input.isKeyJustPressed('Delete') || input.isClickIn(W - 150, H - 145, 140, 44)) {
      const item = items[this.selectedItem];
      if (item) {
        this.game.party.inventory.removeItem(item.id, 1);
        this.selectedItem = Math.max(0, this.selectedItem - 1);
      }
    }
  }

  _useOrEquipItem(itemEntry) {
    const item = itemEntry.data || {};
    const member = this.game.party.members[this.selectedMember];
    if (!member) return;
    if (item.type === 'weapon' || item.type === 'armor') {
      member.equip(item);
      this.game.party.inventory.removeItem(itemEntry.id, 1);
      // Return old equipment to inventory if any
      const slot = item.type === 'weapon' ? 'weapon' : item.slot;
      // Already equipped, swap happened in equip()
    } else if (item.type === 'consumable' && (this.returnState === 'DUNGEON' || true)) {
      // Use in menu (outside of battle)
      this._useConsumable(item, member);
      this.game.party.inventory.removeItem(itemEntry.id, 1);
    }
  }

  _useConsumable(item, member) {
    if (item.effect === 'heal_hp') member.heal(item.value || 60);
    else if (item.effect === 'heal_mp') member.restoreMp(item.value || 40);
    else if (item.effect === 'cure_status') member.removeStatusEffect(item.status);
    else if (item.effect === 'revive') member.revive(item.value || 0.25);
    else if (item.effect === 'heal_all') { member.heal(9999); member.restoreMp(9999); }
    else if (item.effect === 'heal_hp_all') this.game.party.members.forEach(m => m.heal(item.value));
  }

  _getEquippableItems(member, slot) {
    if (!member) return [];
    return this.game.party.inventory.getAllItems().filter(item => {
      const d = item.data || {};
      if (slot === 'weapon') return d.type === 'weapon';
      return d.type === 'armor' && d.slot === slot;
    });
  }

  _itemScore(item, classId) {
    const d = item || {};
    const cls = CLASSES[classId] || {};
    const primary = cls.primaryStats || [];
    let score = 0;
    score += (d.atk || 0) * 2;
    score += (d.def || 0) * 1.5;
    score += (d.str || 0) * (primary.includes('str') ? 2 : 1);
    score += (d.dex || 0) * (primary.includes('dex') ? 2 : 1);
    score += (d.int || 0) * (primary.includes('int') ? 2 : 1);
    score += (d.wis || 0) * (primary.includes('wis') ? 2 : 1);
    score += (d.con || 0) * 1.5;
    score += (d.spd || 0);
    score += (d.hp || 0) * 0.5;
    score += (d.mp || 0) * 0.3;
    return score;
  }

  _autoEquip(member) {
    SLOT_ORDER.forEach(slot => {
      const candidates = this._getEquippableItems(member, slot);
      if (candidates.length === 0) return;
      const current = member.equipment[slot];
      const currentScore = current ? this._itemScore(current, member.classId) : -1;
      let bestItem = null, bestScore = currentScore;
      candidates.forEach(entry => {
        const score = this._itemScore(entry.data || {}, member.classId);
        if (score > bestScore) { bestScore = score; bestItem = entry; }
      });
      if (bestItem) {
        if (current) this.game.party.inventory.addItem(current.id, 1, current);
        member.equip(bestItem.data);
        this.game.party.inventory.removeItem(bestItem.id, 1);
      }
    });
  }

  _updateEquipTab(input, W, H) {
    const member = this.game.party.members[this.selectedMember];
    const slotList = SLOT_ORDER;

    // Slot navigation
    slotList.forEach((slot, i) => {
      if (input.isClickIn(10, 100 + i * 48, 205, 44)) {
        if (this.selectedSlot !== slot) { this.selectedSlot = slot; this.selectedEquipItem = 0; }
      }
    });
    if (input.isKeyJustPressed('ArrowUp')) {
      const idx = SLOT_ORDER.indexOf(this.selectedSlot);
      this.selectedSlot = SLOT_ORDER[Math.max(0, idx - 1)];
      this.selectedEquipItem = 0;
    }
    if (input.isKeyJustPressed('ArrowDown')) {
      const idx = SLOT_ORDER.indexOf(this.selectedSlot);
      this.selectedSlot = SLOT_ORDER[Math.min(SLOT_ORDER.length - 1, idx + 1)];
      this.selectedEquipItem = 0;
    }

    // Item picker navigation
    const equippable = this._getEquippableItems(member, this.selectedSlot);
    equippable.forEach((item, i) => {
      if (input.isClickIn(W * 0.46 + 5, 110 + i * 52, W * 0.54 - 20, 48)) {
        this.selectedEquipItem = i;
      }
    });
    if (input.isKeyJustPressed('ArrowRight')) this.selectedEquipItem = Math.min(equippable.length - 1, this.selectedEquipItem + 1);
    if (input.isKeyJustPressed('ArrowLeft')) this.selectedEquipItem = Math.max(0, this.selectedEquipItem - 1);

    // Equip selected item (Enter)
    if (input.isKeyJustPressed('Enter')) {
      const entry = equippable[this.selectedEquipItem];
      if (entry && member) {
        const old = member.equipment[this.selectedSlot];
        member.equip(entry.data);
        this.game.party.inventory.removeItem(entry.id, 1);
        if (old) this.game.party.inventory.addItem(old.id, 1, old);
        this.selectedEquipItem = 0;
      }
    }

    // Equip via button click
    if (input.isClickIn(W - 150, H - 145, 140, 40)) {
      const entry = equippable[this.selectedEquipItem];
      if (entry && member) {
        const old = member.equipment[this.selectedSlot];
        member.equip(entry.data);
        this.game.party.inventory.removeItem(entry.id, 1);
        if (old) this.game.party.inventory.addItem(old.id, 1, old);
        this.selectedEquipItem = 0;
      }
    }

    // Unequip
    if (input.isKeyJustPressed('Delete') || input.isClickIn(W - 150, H - 100, 140, 40)) {
      if (member) {
        const item = member.unequip(this.selectedSlot);
        if (item) this.game.party.inventory.addItem(item.id, 1, item);
      }
    }

    // Auto-equip (R key or button)
    if (input.isKeyJustPressed('KeyR') || input.isClickIn(W - 150, H - 55, 140, 40)) {
      if (member) this._autoEquip(member);
    }
  }

  _updateSpellsTab(input, W, H) {
    // Buy/equip spells from magic shop - here we show learned spells
    if (input.isKeyJustPressed('ArrowDown')) this.selectedItem = Math.min(20, this.selectedItem + 1);
    if (input.isKeyJustPressed('ArrowUp')) this.selectedItem = Math.max(0, this.selectedItem - 1);
    this.game.party.members.forEach((m, i) => {
      if (input.isClickIn(10 + i * 95, 52, 90, 32)) { this.selectedMember = i; }
    });
    // Learn spell scroll from inventory
    const member = this.game.party.members[this.selectedMember];
    if (!member) return;
    const spellScrolls = this.game.party.inventory.getAllItems().filter(i => i.data?.type === 'magic');
    spellScrolls.forEach((scroll, i) => {
      if (input.isClickIn(10, 100 + i * 45, 280, 40) && input.wasClicked()) {
        // Learn the spell
        const spellId = scroll.id;
        if (!member.learnedSpells.includes(spellId)) {
          member.learnedSpells.push(spellId);
          this.game.party.inventory.removeItem(spellId, 1);
        }
      }
    });
  }

  render(r) {
    const W = r.width, H = r.height;
    r.drawGradientBG(0, 0, W, H, '#080818', '#14102a');
    r.drawTextCentered('INVENTORY', W/2, 12, '#aaaaff', 22, 'monospace', true);
    // Tabs
    const tabs = [['items','Items'],['equipment','Equip'],['spells','Spells'],['status','Status']];
    tabs.forEach(([id, label], i) => {
      const active = this.tab === id;
      r.drawRoundRect(10 + i * 110, 50, 105, 32, 4,
        active ? '#2a2a6a' : '#141428', active ? '#aaaaff' : '#445566', active ? 2 : 1);
      r.drawTextCentered(label, 62 + i * 110, 58, active ? '#ffffff' : '#888899', 15);
    });
    // Member selector
    r.drawText('Member:', W - 300, 12, '#888899', 13);
    this.game.party.members.forEach((m, i) => {
      const active = this.selectedMember === i;
      r.drawRoundRect(W - 240 + i * 62, 8, 58, 24, 3,
        active ? '#2a2a6a' : '#141428', active ? '#aaaaff' : '#334455', active ? 2 : 1);
      r.drawTextCentered(m.name.slice(0,5), W - 211 + i * 62, 12, active ? '#fff' : '#888', 12);
    });
    switch(this.tab) {
      case 'items':     this._renderItemsTab(r, W, H); break;
      case 'equipment': this._renderEquipTab(r, W, H); break;
      case 'spells':    this._renderSpellsTab(r, W, H); break;
      case 'status':    this._renderStatusTab(r, W, H); break;
    }
    r.drawText('ESC/I: Close  Q/E: Switch member', 10, H - 22, '#555566', 13);
  }

  _renderItemsTab(r, W, H) {
    const items = this.game.party.inventory.getAllItems();
    r.drawBorderBox(5, 90, W * 0.55, H - 115, 'Items');
    r.drawText(`Gold: ${this.game.party.gold}g`, 10, 95, '#ffdd44', 15, 'left', 'monospace', true);
    if (items.length === 0) {
      r.drawTextCentered('Inventory empty', W * 0.28, H/2, '#888899', 16);
    }
    const maxItems = 8;
    items.slice(this.scrollOffset, this.scrollOffset + maxItems).forEach((item, vi) => {
      const realIdx = vi + this.scrollOffset;
      const by = 110 + vi * 50;
      const sel = realIdx === this.selectedItem;
      const hov = this.game.input.isMouseOver(10, by, W * 0.55 - 10, 46);
      const iData = item.data || {};
      r.drawRoundRect(10, by, W * 0.55 - 10, 46, 4,
        sel ? '#1e2050' : hov ? '#161635' : '#10101e', sel ? '#6666cc' : '#334455', 1);
      r.drawText(iData.name || item.id.replace(/_/g,' '), 18, by + 6, sel ? '#fff' : '#cccccc', 14, 'left', 'monospace', sel);
      r.drawText(`x${item.quantity}`, 18, by + 24, '#aaaacc', 12);
      r.drawText(iData.type || '', W * 0.3, by + 6, '#888899', 12);
      if (iData.price) r.drawText(`${iData.price}g`, W * 0.45, by + 6, '#ffdd44', 12);
    });
    // Scroll indicator
    if (items.length > maxItems) {
      r.drawText(`${this.scrollOffset+1}-${Math.min(items.length, this.scrollOffset+maxItems)} of ${items.length}`, 10, 515, '#666677', 12);
    }
    // Item details panel
    const sel = items[this.selectedItem];
    r.drawBorderBox(W * 0.56, 90, W * 0.44 - 5, H - 115, 'Item Details');
    if (sel) {
      const iData = sel.data || {};
      r.drawText(iData.name || sel.id, W * 0.57, 105, '#ffdd88', 18, 'left', 'monospace', true);
      r.drawText(iData.description || '', W * 0.57, 128, '#aaaacc', 13);
      const stats = [];
      if (iData.atk) stats.push(`ATK +${iData.atk}`);
      if (iData.def) stats.push(`DEF +${iData.def}`);
      if (iData.int) stats.push(`INT +${iData.int}`);
      if (iData.str) stats.push(`STR +${iData.str}`);
      if (iData.dex) stats.push(`DEX +${iData.dex}`);
      if (iData.wis) stats.push(`WIS +${iData.wis}`);
      if (iData.con) stats.push(`CON +${iData.con}`);
      if (iData.spd) stats.push(`SPD ${iData.spd > 0 ? '+':''}${iData.spd}`);
      if (iData.hp) stats.push(`HP +${iData.hp}`);
      if (iData.mp) stats.push(`MP +${iData.mp}`);
      stats.forEach((s, i) => r.drawText(s, W * 0.57, 150 + i * 20, '#88ccff', 13));
      if (iData.element) r.drawText(`Element: ${iData.element}`, W * 0.57, 150 + stats.length * 20, '#ffaa44', 13);
      if (iData.enchantment) r.drawText(`Enchant: ${iData.enchantment}`, W * 0.57, 172 + stats.length * 20, '#aa88ff', 13);
    }
    // Buttons
    const hov1 = this.game.input.isMouseOver(W - 145, H - 145, 135, 38);
    const hov2 = this.game.input.isMouseOver(W - 145, H - 100, 135, 38);
    r.drawButton(W - 145, H - 145, 135, 38, sel ? `Use/Equip` : 'Use/Equip', hov1, false, !sel);
    r.drawButton(W - 145, H - 100, 135, 38, 'Discard', hov2, false, !sel);
  }

  _renderEquipTab(r, W, H) {
    const member = this.game.party.members[this.selectedMember];
    if (!member) return;

    // Left panel: equipped slots
    r.drawBorderBox(5, 90, W * 0.45, H - 115, 'Equipped');
    r.drawText(`${member.name} — ${CLASSES[member.classId]?.name || member.classId}`, 15, 105, '#ffdd88', 14, 'left', 'monospace', true);
    SLOT_ORDER.forEach((slot, i) => {
      const by = 126 + i * 48;
      const item = member.equipment[slot];
      const sel = this.selectedSlot === slot;
      const hov = this.game.input.isMouseOver(10, by, W * 0.45 - 10, 44);
      r.drawRoundRect(10, by, W * 0.45 - 10, 44, 4,
        sel ? '#1e2050' : hov ? '#161635' : '#10101e', sel ? '#6666cc' : '#334455', 1);
      r.drawText(`[${SLOT_LABELS[slot]}]`, 18, by + 4, '#888899', 11);
      r.drawText(item ? (item.name || item.id) : '(empty)', 18, by + 19, item ? '#ffffff' : '#555566', 13);
      if (item) {
        const parts = [];
        if (item.atk) parts.push(`ATK+${item.atk}`);
        if (item.def) parts.push(`DEF+${item.def}`);
        if (item.str) parts.push(`STR+${item.str}`);
        if (item.int) parts.push(`INT+${item.int}`);
        if (item.dex) parts.push(`DEX+${item.dex}`);
        r.drawText(parts.slice(0, 3).join(' '), W * 0.28, by + 19, '#88aacc', 11);
      }
    });

    // Right panel: item picker for selected slot
    r.drawBorderBox(W * 0.46, 90, W * 0.54 - 5, H - 115, `${SLOT_LABELS[this.selectedSlot]} — Available`);
    const equippable = this._getEquippableItems(member, this.selectedSlot);
    const currentEquipped = member.equipment[this.selectedSlot];
    if (equippable.length === 0) {
      r.drawTextCentered('No items in inventory', W * 0.73, 180, '#555566', 14);
      r.drawTextCentered(`for this slot`, W * 0.73, 200, '#555566', 13);
    }
    const maxVisible = Math.floor((H - 200) / 52);
    equippable.slice(0, maxVisible).forEach((entry, i) => {
      const d = entry.data || {};
      const by = 110 + i * 52;
      const sel = this.selectedEquipItem === i;
      const hov = this.game.input.isMouseOver(W * 0.46 + 5, by, W * 0.54 - 20, 48);
      r.drawRoundRect(W * 0.46 + 5, by, W * 0.54 - 20, 48, 4,
        sel ? '#1e2050' : hov ? '#161635' : '#10101e', sel ? '#6666cc' : '#445566', 1);
      r.drawText(d.name || entry.id.replace(/_/g, ' '), W * 0.46 + 14, by + 4, sel ? '#fff' : '#cccccc', 13);

      // Stat comparison
      const stats = ['atk','def','str','dex','int','wis','con'];
      let cx = W * 0.46 + 14, cy = by + 22;
      stats.forEach(stat => {
        const newVal = d[stat] || 0;
        const oldVal = currentEquipped ? (currentEquipped[stat] || 0) : 0;
        if (newVal === 0 && oldVal === 0) return;
        const diff = newVal - oldVal;
        const color = diff > 0 ? '#44ff88' : diff < 0 ? '#ff6666' : '#aaaacc';
        const sign = diff > 0 ? '+' : '';
        r.drawText(`${stat.toUpperCase()}${sign}${diff !== 0 ? diff : newVal}`, cx, cy, color, 11);
        cx += 56;
        if (cx > W - 30) { cx = W * 0.46 + 14; cy += 14; }
      });
    });

    // Action buttons
    const hasSelItem = equippable[this.selectedEquipItem] !== undefined;
    const hovEquip = this.game.input.isMouseOver(W - 150, H - 145, 140, 40);
    const hovUnequip = this.game.input.isMouseOver(W - 150, H - 100, 140, 40);
    const hovAuto = this.game.input.isMouseOver(W - 150, H - 55, 140, 40);
    r.drawButton(W - 150, H - 145, 140, 40, 'Equip [Enter]', hovEquip, false, !hasSelItem);
    r.drawButton(W - 150, H - 100, 140, 40, 'Unequip [Del]', hovUnequip, false, !currentEquipped);
    r.drawButton(W - 150, H - 55, 140, 40, 'Auto-Equip [R]', hovAuto);
  }

  _renderSpellsTab(r, W, H) {
    const member = this.game.party.members[this.selectedMember];
    if (!member) return;
    r.drawBorderBox(5, 90, W * 0.55, H - 115, 'Learned Spells');
    r.drawText(`${member.name}'s Spells`, 15, 105, '#ffdd88', 16, 'left', 'monospace', true);
    const spells = member.learnedSpells || [];
    if (spells.length === 0) {
      r.drawTextCentered('No spells learned.', W * 0.28, 200, '#888899', 16);
      r.drawTextCentered('Buy spell scrolls at the Magic Shop', W * 0.28, 225, '#666677', 14);
      r.drawTextCentered('and use them here to learn them!', W * 0.28, 245, '#666677', 14);
    }
    spells.forEach((sId, i) => {
      const spell = SPELLS[sId];
      if (!spell) return;
      const by = 130 + i * 40;
      r.drawRoundRect(10, by, W * 0.55 - 10, 36, 4, '#10101e', '#334455', 1);
      r.drawText(spell.name, 18, by + 8, '#cccccc', 14);
      r.drawText(spell.element || '', W * 0.25, by + 8, '#ffaa44', 13);
      r.drawText(`Tier ${spell.tier}`, W * 0.35, by + 8, '#88aacc', 12);
      r.drawText(`${spell.mpCost}MP`, W * 0.44, by + 8, '#4488cc', 12);
    });
    // Spell scrolls in inventory
    r.drawBorderBox(W * 0.56, 90, W * 0.44 - 5, H - 115, 'Spell Scrolls (Inventory)');
    const scrolls = this.game.party.inventory.getAllItems().filter(i => i.data?.type === 'magic');
    if (scrolls.length === 0) {
      r.drawTextCentered('No scrolls in inventory', W * 0.78, 200, '#888899', 15);
    }
    scrolls.forEach((scroll, i) => {
      const by = 110 + i * 40;
      const hov = this.game.input.isMouseOver(W * 0.57, by, W * 0.44 - 10, 36);
      r.drawRoundRect(W * 0.57, by, W * 0.44 - 10, 36, 4, hov ? '#161635' : '#10101e', '#445566', 1);
      const sData = scroll.data || {};
      r.drawText(sData.name || scroll.id, W * 0.57 + 8, by + 8, '#cccccc', 13);
      r.drawText('Click to learn', W * 0.57 + 8, by + 22, '#888866', 11);
    });
  }

  _renderStatusTab(r, W, H) {
    const member = this.game.party.members[this.selectedMember];
    if (!member) return;
    r.drawBorderBox(5, 90, W - 10, H - 115, 'Character Status');
    r.drawText(`${member.name}  Lv${member.level}  ${RACES[member.raceId]?.name} ${CLASSES[member.classId]?.name}`, 15, 105, '#ffdd88', 18, 'left', 'monospace', true);
    r.drawText(`EXP: ${member.exp} / ${member.expToNext}  Next level in: ${member.expToNext - member.exp} EXP`, 15, 130, '#aaaacc', 14);
    r.drawBar(15, 148, W - 30, 12, member.exp, member.expToNext, '#aa44ff');
    // Stats in two columns
    const col1 = [['STR', member.str], ['DEX', member.dex], ['INT', member.int], ['WIS', member.wis], ['CON', member.con], ['SPD', member.spd]];
    const col2 = [['HP', `${member.hp}/${member.maxHp}`], ['MP', `${member.mp}/${member.maxMp}`], ['ATK', member.atk], ['DEF', member.def], ['CRIT%', (member.critChance*100).toFixed(1)]];
    col1.forEach(([label, val], i) => r.drawText(`${label}: ${val}`, 15, 175 + i * 26, '#cccccc', 15));
    col2.forEach(([label, val], i) => r.drawText(`${label}: ${val}`, W * 0.35, 175 + i * 26, '#cccccc', 15));
    // Skills
    r.drawText('Known Skills:', 15, 345, '#ffdd88', 15, 'left', 'monospace', true);
    member.learnedSkills.forEach((sId, i) => {
      const skill = SKILLS[sId];
      const col = Math.floor(i / 4), row = i % 4;
      r.drawText(`• ${skill ? skill.name : sId}`, 15 + col * 220, 368 + row * 22, '#aaaacc', 13);
    });
    // Status effects
    if (member.statusEffects.length > 0) {
      r.drawText('Active Status:', 15, 465, '#ff8888', 15, 'left', 'monospace', true);
      member.statusEffects.forEach((e, i) => {
        r.drawText(`${e.id} (${e.duration} turns)`, 15 + i * 150, 488, '#ff8888', 13);
      });
    }
    // Race / Class passive
    r.drawText(`Race Passive: ${RACES[member.raceId]?.passive.name} - ${RACES[member.raceId]?.passive.description}`, 15, H - 140, '#aa88ff', 14);
    r.drawText(`Class Special: ${CLASSES[member.classId]?.uniqueMechanic.name} - ${CLASSES[member.classId]?.uniqueMechanic.description}`, 15, H - 118, '#88aaff', 14);
  }
}
