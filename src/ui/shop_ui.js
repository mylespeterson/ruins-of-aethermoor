import { Shop } from '../systems/shop.js';
import { ELEMENT_COLORS } from '../combat/elements.js';

export class ShopUI {
  constructor(game) {
    this.game = game;
    this.shop = null;
    this.tab = 'buy';
    this.selectedItem = 0;
    this.scrollOffset = 0;
    this.message = '';
    this.messageTimer = 0;
    this.buyQty = 1;
  }

  onEnter(data) {
    const shopType = data?.shopType || 'potion';
    this.shop = new Shop(shopType, this.game.currentFloor);
    this.tab = 'buy';
    this.selectedItem = 0;
    this.scrollOffset = 0;
    this.message = '';
    this.buyQty = 1;
  }

  update(dt) {
    if (this.messageTimer > 0) this.messageTimer -= dt;
    const input = this.game.input;
    const W = this.game.canvas.width, H = this.game.canvas.height;
    if (input.isKeyJustPressed('Escape')) { this.game.setState('TOWN'); return; }
    // Tab switch
    if (input.isClickIn(10, 50, 150, 35)) { this.tab = 'buy'; this.selectedItem = 0; this.scrollOffset = 0; }
    if (input.isClickIn(170, 50, 150, 35)) { this.tab = 'sell'; this.selectedItem = 0; this.scrollOffset = 0; }
    if (this.tab === 'buy') this._updateBuy(input, W, H);
    else this._updateSell(input, W, H);
  }

  _updateBuy(input, W, H) {
    const items = this.shop.inventory;
    if (input.isKeyJustPressed('ArrowDown')) {
      this.selectedItem = Math.min(items.length - 1, this.selectedItem + 1);
      this._clampScroll(items.length, 8);
    }
    if (input.isKeyJustPressed('ArrowUp')) {
      this.selectedItem = Math.max(0, this.selectedItem - 1);
      this._clampScroll(items.length, 8);
    }
    items.slice(this.scrollOffset, this.scrollOffset + 8).forEach((item, vi) => {
      if (input.isClickIn(10, 100 + vi * 52, W * 0.58, 48)) {
        this.selectedItem = vi + this.scrollOffset;
      }
    });
    if (input.isKeyJustPressed('Enter') || input.isClickIn(W - 145, H - 100, 135, 40)) {
      const item = items[this.selectedItem];
      if (item) {
        const result = this.shop.buy(this.game.party, item.id, 1);
        this.message = result.success ? `Bought ${item.name}!` : result.reason;
        this.messageTimer = 2;
      }
    }
  }

  _updateSell(input, W, H) {
    const items = this.shop.getSellableItems(this.game.party);
    if (input.isKeyJustPressed('ArrowDown')) {
      this.selectedItem = Math.min(items.length - 1, this.selectedItem + 1);
      this._clampScroll(items.length, 8);
    }
    if (input.isKeyJustPressed('ArrowUp')) {
      this.selectedItem = Math.max(0, this.selectedItem - 1);
      this._clampScroll(items.length, 8);
    }
    items.slice(this.scrollOffset, this.scrollOffset + 8).forEach((item, vi) => {
      if (input.isClickIn(10, 100 + vi * 52, W * 0.58, 48)) {
        this.selectedItem = vi + this.scrollOffset;
      }
    });
    if (input.isKeyJustPressed('Enter') || input.isClickIn(W - 145, H - 100, 135, 40)) {
      const item = items[this.selectedItem];
      if (item) {
        const result = this.shop.sell(this.game.party, item.id, 1);
        this.message = result.success ? `Sold for ${result.sellPrice}g!` : result.reason;
        this.messageTimer = 2;
      }
    }
  }

  _clampScroll(total, visible) {
    if (this.selectedItem >= this.scrollOffset + visible) this.scrollOffset = this.selectedItem - visible + 1;
    if (this.selectedItem < this.scrollOffset) this.scrollOffset = this.selectedItem;
    this.scrollOffset = Math.max(0, Math.min(Math.max(0, total - visible), this.scrollOffset));
  }

  render(r) {
    const W = r.width, H = r.height;
    r.drawGradientBG(0, 0, W, H, '#080814', '#12102a');
    const shopNames = { weapon:'Weapon Shop', armor:'Armor Shop', potion:'Potion Shop', magic:'Magic Shop', material:'Material Shop' };
    const name = shopNames[this.shop?.type] || 'Shop';
    r.drawTextCentered(name, W/2, 12, '#ffdd88', 24, 'monospace', true);
    r.drawText(`💰 ${this.game.party.gold}g`, W - 150, 12, '#ffdd44', 18, 'left', 'monospace', true);
    // Tabs
    r.drawRoundRect(10, 50, 150, 35, 5, this.tab === 'buy' ? '#2a2a6a' : '#141428', this.tab === 'buy' ? '#aaaaff' : '#445566', this.tab === 'buy' ? 2 : 1);
    r.drawTextCentered('Buy', 85, 58, this.tab === 'buy' ? '#ffffff' : '#888899', 16);
    r.drawRoundRect(170, 50, 150, 35, 5, this.tab === 'sell' ? '#2a2a6a' : '#141428', this.tab === 'sell' ? '#aaaaff' : '#445566', this.tab === 'sell' ? 2 : 1);
    r.drawTextCentered('Sell', 245, 58, this.tab === 'sell' ? '#ffffff' : '#888899', 16);
    if (this.tab === 'buy') this._renderBuy(r, W, H);
    else this._renderSell(r, W, H);
    // Message
    if (this.messageTimer > 0) {
      const alpha = Math.min(1, this.messageTimer * 2);
      r.ctx.save(); r.ctx.globalAlpha = alpha;
      r.drawRoundRect(W/2-200, H - 55, 400, 32, 6, '#1a1a3a', '#5566aa', 1);
      r.drawTextCentered(this.message, W/2, H - 48, '#ffffff', 15);
      r.ctx.restore();
    }
    r.drawText('ESC: Leave  Enter/Click: Buy/Sell  Arrows: Navigate', 10, H - 22, '#555566', 13);
  }

  _renderBuy(r, W, H) {
    const items = this.shop.inventory;
    r.drawBorderBox(5, 90, W * 0.62, H - 115, 'Available Items');
    items.slice(this.scrollOffset, this.scrollOffset + 8).forEach((item, vi) => {
      const realIdx = vi + this.scrollOffset;
      const by = 100 + vi * 52;
      const sel = realIdx === this.selectedItem;
      const canAfford = this.game.party.gold >= item.price;
      const hov = this.game.input.isMouseOver(10, by, W * 0.62 - 10, 48);
      r.drawRoundRect(10, by, W * 0.62 - 10, 48, 4,
        sel ? '#1e2050' : hov ? '#161635' : '#10101e',
        sel ? '#6666cc' : '#334455', 1);
      r.drawText(item.name || item.id, 18, by + 6, canAfford ? (sel ? '#fff':'#ccc') : '#664444', 14, 'left', 'monospace', sel);
      // Stats summary
      const stats = [];
      if (item.atk) stats.push(`ATK+${item.atk}`);
      if (item.def) stats.push(`DEF+${item.def}`);
      if (item.int) stats.push(`INT+${item.int}`);
      if (item.effect) stats.push(item.effect.replace(/_/g,' '));
      if (item.element) stats.push(item.element);
      if (item.tier) stats.push(`T${item.tier}`);
      r.drawText(stats.join('  '), 18, by + 27, '#888899', 12);
      r.drawText(`${item.price}g`, W * 0.55, by + 6, canAfford ? '#ffdd44' : '#cc4444', 14);
    });
    if (items.length > 8) r.drawText(`${this.scrollOffset+1}-${Math.min(items.length, this.scrollOffset+8)} of ${items.length}`, 15, H - 120, '#666677', 12);
    // Item detail
    const selItem = items[this.selectedItem];
    r.drawBorderBox(W * 0.63, 90, W * 0.37 - 5, H - 115, 'Details');
    if (selItem) {
      r.drawText(selItem.name || selItem.id, W * 0.64, 108, '#ffdd88', 17, 'left', 'monospace', true);
      r.drawText(selItem.description || '', W * 0.64, 132, '#aaaacc', 13);
      const statList = [];
      if (selItem.atk) statList.push(`ATK +${selItem.atk}`);
      if (selItem.def) statList.push(`DEF +${selItem.def}`);
      if (selItem.int) statList.push(`INT +${selItem.int}`);
      if (selItem.str) statList.push(`STR +${selItem.str}`);
      if (selItem.dex) statList.push(`DEX +${selItem.dex}`);
      if (selItem.wis) statList.push(`WIS +${selItem.wis}`);
      if (selItem.con) statList.push(`CON +${selItem.con}`);
      if (selItem.spd) statList.push(`SPD ${selItem.spd>0?'+':''}${selItem.spd}`);
      if (selItem.hp) statList.push(`HP +${selItem.hp}`);
      if (selItem.mp) statList.push(`MP +${selItem.mp}`);
      statList.forEach((s, i) => r.drawText(s, W * 0.64, 155 + i * 20, '#88ccff', 13));
      if (selItem.element) r.drawText(`Element: ${selItem.element}`, W * 0.64, 155 + statList.length * 20 + 5, ELEMENT_COLORS[selItem.element] || '#ffaa44', 13);
      // Power vs current equipment
      const member = this.game.party.members[0];
      if (member && selItem.type === 'weapon') {
        const current = member.equipment.weapon;
        const diff = (selItem.atk || 0) - (current?.atk || 0);
        r.drawText(`vs equipped: ${diff >= 0 ? '+':''  }${diff} ATK`, W * 0.64, H - 155, diff >= 0 ? '#44ff88' : '#ff4444', 14);
      }
      r.drawText(`Price: ${selItem.price}g`, W * 0.64, H - 130, '#ffdd44', 16, 'left', 'monospace', true);
    }
    const canBuy = selItem && this.game.party.gold >= selItem.price;
    const hov = this.game.input.isMouseOver(W - 145, H - 100, 135, 40);
    r.drawButton(W - 145, H - 100, 135, 40, 'Buy', hov, false, !canBuy);
  }

  _renderSell(r, W, H) {
    const items = this.shop.getSellableItems(this.game.party);
    r.drawBorderBox(5, 90, W * 0.62, H - 115, 'Your Items');
    if (items.length === 0) {
      r.drawTextCentered('No sellable items', W * 0.31, 250, '#888899', 16);
    }
    items.slice(this.scrollOffset, this.scrollOffset + 8).forEach((item, vi) => {
      const realIdx = vi + this.scrollOffset;
      const by = 100 + vi * 52;
      const sel = realIdx === this.selectedItem;
      const hov = this.game.input.isMouseOver(10, by, W * 0.62 - 10, 48);
      const iData = item.data || {};
      r.drawRoundRect(10, by, W * 0.62 - 10, 48, 4,
        sel ? '#1e2050' : hov ? '#161635' : '#10101e', sel ? '#6666cc' : '#334455', 1);
      r.drawText(iData.name || item.id.replace(/_/g,' '), 18, by + 6, sel ? '#fff':'#ccc', 14, 'left', 'monospace', sel);
      r.drawText(`x${item.quantity}`, 18, by + 27, '#aaaacc', 12);
      r.drawText(`${this.shop.getSellPrice(iData)}g`, W * 0.55, by + 6, '#ffdd44', 14);
    });
    const selItem = items[this.selectedItem];
    r.drawBorderBox(W * 0.63, 90, W * 0.37 - 5, H - 115, 'Sell Price');
    if (selItem) {
      const iData = selItem.data || {};
      r.drawText(iData.name || selItem.id, W * 0.64, 108, '#ffdd88', 17, 'left', 'monospace', true);
      r.drawText(iData.description || '', W * 0.64, 132, '#aaaacc', 13);
      r.drawText(`Sell for: ${this.shop.getSellPrice(iData)}g`, W * 0.64, H - 130, '#ffdd44', 18, 'left', 'monospace', true);
      r.drawText(`(50% of ${iData.price || 10}g)`, W * 0.64, H - 108, '#888899', 13);
    }
    const hov = this.game.input.isMouseOver(W - 145, H - 100, 135, 40);
    r.drawButton(W - 145, H - 100, 135, 40, 'Sell', hov, false, !selItem);
  }
}
