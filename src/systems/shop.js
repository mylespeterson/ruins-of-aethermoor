import { getWeaponShopInventory, getArmorShopInventory, getPotionShopInventory, getMagicShopInventory, getMaterialShopInventory } from '../data/shop_data.js';

export class Shop {
  constructor(type, floor = 1) {
    this.type = type;
    this.floor = floor;
    this.inventory = this._loadInventory(type, floor);
  }

  _loadInventory(type, floor) {
    switch(type) {
      case 'weapon':   return getWeaponShopInventory(floor);
      case 'armor':    return getArmorShopInventory(floor);
      case 'potion':   return getPotionShopInventory();
      case 'magic':    return getMagicShopInventory(floor);
      case 'material': return getMaterialShopInventory();
      default:         return [];
    }
  }

  buy(party, itemId, quantity = 1) {
    const item = this.inventory.find(i => i.id === itemId);
    if (!item) return { success: false, reason: 'Item not available.' };
    if (item.stock !== -1 && item.stock < quantity) return { success: false, reason: 'Not enough stock.' };
    const totalCost = item.price * quantity;
    if (party.gold < totalCost) return { success: false, reason: `Not enough gold! Need ${totalCost}g.` };
    party.gold -= totalCost;
    party.inventory.addItem(itemId, quantity, item);
    if (item.stock !== -1) item.stock -= quantity;
    return { success: true, item, totalCost };
  }

  sell(party, itemId, quantity = 1) {
    if (!party.inventory.hasItem(itemId, quantity)) return { success: false, reason: 'Item not in inventory.' };
    const invItem = party.inventory.findItem(itemId);
    if (!invItem) return { success: false, reason: 'Item not found.' };
    const sellPrice = Math.floor((invItem.price || 10) * 0.5) * quantity;
    party.inventory.removeItem(itemId, quantity);
    party.gold += sellPrice;
    return { success: true, sellPrice };
  }

  getSellableItems(party) {
    return party.inventory.getAllItems().filter(i => i.data && i.data.price);
  }

  getSellPrice(item) {
    return Math.floor((item.price || 10) * 0.5);
  }
}
