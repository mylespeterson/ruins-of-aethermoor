import { WEAPONS, ARMOR, CONSUMABLES, MATERIALS } from './items.js';
import { SPELLS } from './spells.js';

// Filter by floorUnlock
function filterByFloor(items, floor) {
  return Object.values(items).filter(item => !item.floorUnlock || item.floorUnlock <= floor);
}

export function getWeaponShopInventory(floor) {
  return filterByFloor(WEAPONS, floor).map(item => ({ ...item, stock:-1 }));
}

export function getArmorShopInventory(floor) {
  return filterByFloor(ARMOR, floor).map(item => ({ ...item, stock:-1 }));
}

export function getPotionShopInventory() {
  return Object.values(CONSUMABLES).map(item => ({ ...item, stock:99 }));
}

export function getMagicShopInventory(floor) {
  const tier = Math.min(4, 1 + Math.floor(floor / 12));
  return Object.values(SPELLS)
    .filter(s => s.tier <= tier)
    .map(s => ({ ...s, stock:-1 }));
}

export function getMaterialShopInventory() {
  const ids = ['iron_ingot','steel_ingot','fire_ruby','aqua_pearl','volt_shard','terra_stone','nature_seed','frost_crystal','wind_feather','metal_cog'];
  return ids.map(id => ({ ...MATERIALS[id], stock:99 }));
}

export const SHOP_TYPES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  POTION: 'potion',
  MAGIC: 'magic',
  MATERIAL: 'material'
};
