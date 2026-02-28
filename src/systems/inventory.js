import { WEAPONS, ARMOR, CONSUMABLES, MATERIALS, ENCHANTMENT_SCROLLS } from '../data/items.js';

const ALL_ITEMS = { ...WEAPONS, ...ARMOR, ...CONSUMABLES, ...MATERIALS, ...ENCHANTMENT_SCROLLS };

export class Inventory {
  constructor(capacity = 60) {
    this.items = []; // [{ id, quantity, data }]
    this.capacity = capacity;
  }

  addItem(itemId, quantity = 1, customData = null) {
    const def = ALL_ITEMS[itemId] || customData || { id: itemId, name: itemId, type: 'misc' };
    const stackable = def.type === 'consumable' || def.type === 'material' || def.type === 'enchantment';
    if (stackable) {
      const existing = this.items.find(i => i.id === itemId);
      if (existing) {
        existing.quantity = Math.min(99, existing.quantity + quantity);
        return true;
      }
    }
    if (this.items.length >= this.capacity && !stackable) return false;
    this.items.push({ id: itemId, quantity, data: def });
    return true;
  }

  removeItem(itemId, quantity = 1) {
    const idx = this.items.findIndex(i => i.id === itemId);
    if (idx === -1) return false;
    this.items[idx].quantity -= quantity;
    if (this.items[idx].quantity <= 0) this.items.splice(idx, 1);
    return true;
  }

  findItem(itemId) {
    const entry = this.items.find(i => i.id === itemId);
    return entry ? entry.data || ALL_ITEMS[itemId] || { id: itemId, name: itemId } : null;
  }

  hasItem(itemId, qty = 1) {
    const entry = this.items.find(i => i.id === itemId);
    return entry ? entry.quantity >= qty : false;
  }

  getItemCount(itemId) {
    const entry = this.items.find(i => i.id === itemId);
    return entry ? entry.quantity : 0;
  }

  getItemsByType(type) {
    return this.items.filter(i => {
      const def = i.data || ALL_ITEMS[i.id];
      return def && def.type === type;
    });
  }

  getAllItems() {
    return this.items.map(i => ({
      ...i,
      data: i.data || ALL_ITEMS[i.id] || { id: i.id, name: i.id, type: 'misc' }
    }));
  }

  serialize() {
    return { items: this.items.map(i => ({ id: i.id, quantity: i.quantity })) };
  }

  static deserialize(data) {
    const inv = new Inventory();
    (data.items || []).forEach(i => inv.addItem(i.id, i.quantity));
    return inv;
  }
}
