import { CraftingSystem } from '../systems/crafting.js';
import { MATERIALS } from '../data/items.js';

const BASE_MATS = ['iron_ingot','steel_ingot','mithril_ingot','adamantite_ingot','dragonbone','leather','chainmail','dragonhide','phoenix_leather','celestial_silk','oak_wood','ash_wood','ebony_wood','yggdrasil_wood','starmetal'];
const CORE_MATS = ['fire_ruby','aqua_pearl','volt_shard','terra_stone','nature_seed','frost_crystal','wind_feather','metal_cog'];
const SCROLL_MATS = ['scroll_vampirism','scroll_haste','scroll_fortitude','scroll_precision','scroll_thorns','scroll_wisdom','scroll_fury','scroll_warding','scroll_fortune','scroll_mastery'];

export class CraftingUI {
  constructor(game) {
    this.game = game;
    this.crafting = new CraftingSystem();
    this.selectedBase = null;
    this.selectedCore = null;
    this.selectedScroll = null;
    this.previewResult = null;
    this.message = '';
    this.messageTimer = 0;
    this.activeSlot = 'base'; // base, core, scroll
    this.returnState = 'TOWN';
  }

  onEnter(data) {
    this.selectedBase = null;
    this.selectedCore = null;
    this.selectedScroll = null;
    this.previewResult = null;
    this.message = '';
    this.activeSlot = 'base';
    this.returnState = data?.returnState || 'TOWN';
  }

  update(dt) {
    if (this.messageTimer > 0) this.messageTimer -= dt;
    const input = this.game.input;
    const W = this.game.canvas.width, H = this.game.canvas.height;
    if (input.isKeyJustPressed('Escape')) { this.game.setState(this.returnState); return; }
    // Select slot
    if (input.isClickIn(50, 110, 160, 50)) this.activeSlot = 'base';
    if (input.isClickIn(240, 110, 160, 50)) this.activeSlot = 'core';
    if (input.isClickIn(430, 110, 160, 50)) this.activeSlot = 'scroll';
    // Material list clicks
    const inventory = this.game.party.inventory;
    const getMats = (list) => list.filter(id => inventory.hasItem(id));
    const listY = 200, listH = 40;
    let matList;
    if (this.activeSlot === 'base') matList = getMats(BASE_MATS);
    else if (this.activeSlot === 'core') matList = getMats(CORE_MATS);
    else matList = getMats(SCROLL_MATS);
    matList.forEach((matId, i) => {
      if (input.isClickIn(10, listY + i * listH, 260, listH - 4)) {
        if (this.activeSlot === 'base') this.selectedBase = matId;
        else if (this.activeSlot === 'core') this.selectedCore = matId;
        else this.selectedScroll = matId;
        this._updatePreview();
      }
    });
    // Clear scroll slot
    if (input.isClickIn(430, 165, 80, 24)) { this.selectedScroll = null; this._updatePreview(); }
    // Craft button
    if (input.isClickIn(W/2 - 80, H - 100, 160, 44)) {
      this._craft();
    }
  }

  _updatePreview() {
    if (!this.selectedBase || !this.selectedCore) {
      this.previewResult = null;
      return;
    }
    const result = this.crafting.findRecipe(this.selectedBase, this.selectedCore, this.selectedScroll);
    this.previewResult = result ? result.result : null;
  }

  _craft() {
    if (!this.selectedBase || !this.selectedCore) {
      this.message = 'Select a base material and elemental core!';
      this.messageTimer = 2;
      return;
    }
    const result = this.crafting.craft(this.game.party.inventory, this.selectedBase, this.selectedCore, this.selectedScroll || null);
    if (result.success) {
      this.message = `Crafted: ${result.item.name}!`;
      this.messageTimer = 3;
      this.selectedBase = null;
      this.selectedCore = null;
      this.selectedScroll = null;
      this.previewResult = null;
    } else {
      this.message = result.reason || 'Crafting failed!';
      this.messageTimer = 2;
    }
  }

  render(r) {
    const W = r.width, H = r.height;
    r.drawGradientBG(0, 0, W, H, '#080818', '#140a28');
    r.drawTextCentered('⚒ CRAFTING STATION ⚒', W/2, 15, '#ffdd88', 26, 'monospace', true);
    r.drawText('Combine materials to forge powerful items!', 15, 50, '#888899', 15);
    // Slot panels
    this._renderSlot(r, 50, 110, 160, 50, 'Base Material', this.selectedBase, this.activeSlot === 'base');
    r.drawTextCentered('+', 225, 128, '#ffdd44', 28);
    this._renderSlot(r, 240, 110, 160, 50, 'Elemental Core', this.selectedCore, this.activeSlot === 'core');
    r.drawTextCentered('+', 415, 128, '#ffdd44', 28);
    this._renderSlot(r, 430, 110, 160, 50, 'Enchant Scroll', this.selectedScroll, this.activeSlot === 'scroll');
    r.drawText('(optional)', 432, 165, '#666677', 11);
    if (this.selectedScroll) {
      const hov = this.game.input.isMouseOver(510, 165, 60, 24);
      r.drawButton(510, 165, 60, 24, 'Clear', hov);
    }
    r.drawTextCentered('▼', 310, 170, '#888899', 18);
    // Preview
    r.drawBorderBox(50, 195, 560, 90, 'Crafted Item Preview');
    if (this.previewResult) {
      const item = this.previewResult;
      r.drawText(item.name, 60, 210, '#ffdd88', 18, 'left', 'monospace', true);
      const stats = [];
      if (item.atk) stats.push(`ATK +${item.atk}`);
      if (item.def) stats.push(`DEF +${item.def}`);
      if (item.int) stats.push(`INT +${item.int}`);
      if (item.element) stats.push(`[${item.element}]`);
      if (item.enchantment) stats.push(`[${item.enchantment}]`);
      if (item.lifesteal) stats.push(`lifesteal ${(item.lifesteal*100).toFixed(0)}%`);
      if (item.critChance) stats.push(`+crit ${(item.critChance*100).toFixed(0)}%`);
      r.drawText(stats.join('  '), 60, 236, '#88ccff', 14);
      r.drawText(item.description || '', 60, 258, '#aaaacc', 13);
    } else if (this.selectedBase && this.selectedCore) {
      r.drawTextCentered('No recipe found for this combination.', 330, 240, '#cc6644', 15);
    } else {
      r.drawTextCentered('Select materials above to preview result', 330, 240, '#666677', 15);
    }
    // Material list
    const inventory = this.game.party.inventory;
    const allLists = { base: BASE_MATS, core: CORE_MATS, scroll: SCROLL_MATS };
    const currentList = allLists[this.activeSlot].filter(id => inventory.hasItem(id));
    r.drawBorderBox(5, 300, 280, H - 340, 'Materials in Inventory');
    r.drawText(`${this.activeSlot.toUpperCase()} (click slot to change category)`, 12, 308, '#888899', 12);
    if (currentList.length === 0) {
      r.drawText('None in inventory', 12, 335, '#666677', 14);
    }
    currentList.forEach((matId, i) => {
      const mat = MATERIALS[matId] || { name: matId.replace(/_/g,' ') };
      const qty = inventory.getItemCount(matId);
      const selVal = this.activeSlot === 'base' ? this.selectedBase : this.activeSlot === 'core' ? this.selectedCore : this.selectedScroll;
      const sel = selVal === matId;
      const hov = this.game.input.isMouseOver(10, 325 + i * 38, 260, 34);
      r.drawRoundRect(10, 325 + i * 38, 260, 34, 4,
        sel ? '#2a2a6a' : hov ? '#161635' : '#10101e', sel ? '#aaaaff' : '#334455', 1);
      r.drawText(mat.name || matId, 18, 333 + i * 38, sel ? '#fff' : '#ccc', 13);
      r.drawText(`x${qty}`, 250, 333 + i * 38, '#aaaacc', 12, 'right');
    });
    // All available recipes
    r.drawBorderBox(290, 300, W - 295, H - 340, 'Available Recipes');
    const available = this.crafting.getAvailableRecipes(inventory);
    if (available.length === 0) {
      r.drawText('Gather materials to unlock recipes.', 298, 320, '#666677', 14);
    }
    available.slice(0, 8).forEach((recipe, i) => {
      const by = 322 + i * 38;
      const hov = this.game.input.isMouseOver(295, by, W - 300, 34);
      if (hov && this.game.input.wasClicked()) {
        this.selectedBase = recipe.inputs.base;
        this.selectedCore = recipe.inputs.core;
        this.selectedScroll = recipe.inputs.scroll;
        this._updatePreview();
      }
      r.drawRoundRect(295, by, W - 300, 34, 4, hov ? '#161635' : '#10101e', '#334455', 1);
      r.drawText(recipe.result.name, 302, by + 7, '#ddddcc', 13);
      const scrollNote = recipe.inputs.scroll ? ` + scroll` : '';
      r.drawText(`${recipe.inputs.base}+${recipe.inputs.core}${scrollNote}`, 302, by + 22, '#666677', 10);
    });
    if (available.length > 8) r.drawText(`...+${available.length-8} more`, 298, H - 50, '#666677', 12);
    // Craft button
    const canCraft = this.previewResult && this.selectedBase && this.selectedCore;
    const hov = this.game.input.isMouseOver(W/2 - 80, H - 100, 160, 44);
    r.drawButton(W/2 - 80, H - 100, 160, 44, '⚒ Craft!', hov, false, !canCraft);
    // Message
    if (this.messageTimer > 0) {
      const alpha = Math.min(1, this.messageTimer * 2);
      r.ctx.save(); r.ctx.globalAlpha = alpha;
      r.drawRoundRect(W/2-200, H - 55, 400, 30, 6, '#1a1a3a', '#5566aa', 1);
      r.drawTextCentered(this.message, W/2, H - 49, '#ffffff', 14);
      r.ctx.restore();
    }
    r.drawText('ESC: Back  Click to select materials  Craft to forge!', 10, H - 22, '#555566', 13);
  }

  _renderSlot(r, x, y, w, h, label, value, active) {
    const matName = value ? (MATERIALS[value]?.name || value.replace(/_/g,' ')) : '(empty)';
    r.drawRoundRect(x, y, w, h, 6,
      active ? '#1e2050' : '#141428', active ? '#ffdd44' : '#445566', active ? 2 : 1);
    r.drawText(label, x + 5, y + 4, '#888899', 11);
    r.drawText(matName, x + 5, y + 22, value ? '#ffffff' : '#556677', 14, 'left', 'monospace', !!value);
  }
}
