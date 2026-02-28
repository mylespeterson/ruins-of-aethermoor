// Weapons
export const WEAPONS = {
  iron_sword:     { id:'iron_sword', name:'Iron Sword', type:'weapon', weaponType:'sword', atk:12, price:50, tier:1, description:'A basic iron sword.' },
  iron_axe:       { id:'iron_axe', name:'Iron Axe', type:'weapon', weaponType:'axe', atk:13, price:55, tier:1, description:'A basic iron axe.' },
  wooden_staff:   { id:'wooden_staff', name:'Wooden Staff', type:'weapon', weaponType:'staff', atk:8, int:2, price:45, tier:1, description:'A wooden magic staff.' },
  short_bow:      { id:'short_bow', name:'Short Bow', type:'weapon', weaponType:'bow', atk:10, dex:1, price:50, tier:1, description:'A light bow.' },
  iron_dagger:    { id:'iron_dagger', name:'Iron Dagger', type:'weapon', weaponType:'dagger', atk:9, spd:2, price:40, tier:1, description:'A quick iron dagger.' },
  basic_katana:   { id:'basic_katana', name:'Basic Katana', type:'weapon', weaponType:'katana', atk:13, dex:1, price:55, tier:1, description:'A simple katana.' },
  iron_hammer:    { id:'iron_hammer', name:'Iron Hammer', type:'weapon', weaponType:'hammer', atk:15, spd:-1, price:60, tier:1, description:'A heavy iron hammer.' },
  iron_mace:      { id:'iron_mace', name:'Iron Mace', type:'weapon', weaponType:'mace', atk:11, con:1, price:50, tier:1, description:'A solid iron mace.' },
  wooden_orb:     { id:'wooden_orb', name:'Wooden Orb', type:'weapon', weaponType:'orb', atk:6, int:3, mp:10, price:40, tier:1, description:'A focusing orb.' },
  apprentice_wand:{ id:'apprentice_wand', name:'Apprentice Wand', type:'weapon', weaponType:'wand', atk:7, int:2, price:45, tier:1, description:'A beginner\'s wand.' },
  // Tier 2 (floor 5+)
  steel_sword:    { id:'steel_sword', name:'Steel Sword', type:'weapon', weaponType:'sword', atk:22, price:150, tier:2, floorUnlock:5, description:'A sharp steel sword.' },
  steel_axe:      { id:'steel_axe', name:'Steel Axe', type:'weapon', weaponType:'axe', atk:24, price:160, tier:2, floorUnlock:5, description:'A sturdy steel axe.' },
  ash_staff:      { id:'ash_staff', name:'Ash Staff', type:'weapon', weaponType:'staff', atk:14, int:5, mp:20, price:140, tier:2, floorUnlock:5, description:'Staff of ash wood.' },
  composite_bow:  { id:'composite_bow', name:'Composite Bow', type:'weapon', weaponType:'bow', atk:20, dex:2, price:150, tier:2, floorUnlock:5, description:'A composite bow.' },
  steel_dagger:   { id:'steel_dagger', name:'Steel Dagger', type:'weapon', weaponType:'dagger', atk:18, spd:3, price:140, tier:2, floorUnlock:5, description:'A swift steel dagger.' },
  refined_katana: { id:'refined_katana', name:'Refined Katana', type:'weapon', weaponType:'katana', atk:23, dex:2, price:160, tier:2, floorUnlock:5, description:'A refined katana.' },
  // Tier 3 (floor 15+)
  mithril_sword:  { id:'mithril_sword', name:'Mithril Sword', type:'weapon', weaponType:'sword', atk:38, price:400, tier:3, floorUnlock:15, description:'A mithril sword.' },
  mithril_axe:    { id:'mithril_axe', name:'Mithril Axe', type:'weapon', weaponType:'axe', atk:40, price:420, tier:3, floorUnlock:15, description:'A mithril axe.' },
  crystal_staff:  { id:'crystal_staff', name:'Crystal Staff', type:'weapon', weaponType:'staff', atk:24, int:10, mp:40, price:380, tier:3, floorUnlock:15, description:'A crystal-tipped staff.' },
  ebony_bow:      { id:'ebony_bow', name:'Ebony Bow', type:'weapon', weaponType:'bow', atk:35, dex:4, price:400, tier:3, floorUnlock:15, description:'A bow of ebony wood.' },
  // Tier 4 (floor 25+)
  adamantite_sword:{ id:'adamantite_sword', name:'Adamantite Sword', type:'weapon', weaponType:'sword', atk:60, price:900, tier:4, floorUnlock:25, description:'Virtually indestructible sword.' },
  void_staff:     { id:'void_staff', name:'Void Staff', type:'weapon', weaponType:'staff', atk:40, int:18, mp:60, price:880, tier:4, floorUnlock:25, description:'A staff of void energy.' },
  // Tier 5 (floor 40+)
  dragon_blade:   { id:'dragon_blade', name:'Dragon Blade', type:'weapon', weaponType:'sword', atk:90, int:10, price:2000, tier:5, floorUnlock:40, description:'Forged from dragon bone.' },
  starmetal_wand: { id:'starmetal_wand', name:'Starmetal Wand', type:'weapon', weaponType:'wand', atk:60, int:25, mp:80, price:1900, tier:5, floorUnlock:40, description:'Crafted from fallen stars.' },
  // Fist weapon
  iron_knuckles:  { id:'iron_knuckles', name:'Iron Knuckles', type:'weapon', weaponType:'fist', atk:10, str:1, price:45, tier:1, description:'Iron knuckle dusters.' },
  bronze_totem:   { id:'bronze_totem', name:'Bronze Totem', type:'weapon', weaponType:'totem', atk:8, wis:2, price:48, tier:1, description:'A carved totem.' },
  short_sword:    { id:'short_sword', name:'Short Sword', type:'weapon', weaponType:'short_sword', atk:10, price:42, tier:1, description:'A short sword.' },
  bo_staff:       { id:'bo_staff', name:'Bo Staff', type:'weapon', weaponType:'bo_staff', atk:9, dex:1, price:42, tier:1, description:'A fighting staff.' },
  great_sword:    { id:'great_sword', name:'Iron Greatsword', type:'weapon', weaponType:'great_sword', atk:18, str:1, spd:-2, price:70, tier:1, description:'A large two-handed sword.' },
  scythe:         { id:'scythe', name:'Iron Scythe', type:'weapon', weaponType:'scythe', atk:16, int:1, price:65, tier:1, description:'A wicked scythe.' },
  nodachi:        { id:'nodachi', name:'Nodachi', type:'weapon', weaponType:'nodachi', atk:17, str:1, price:65, tier:1, description:'A long two-handed katana.' },
  instrument:     { id:'instrument', name:'Lute', type:'weapon', weaponType:'instrument', atk:6, wis:2, price:45, tier:1, description:'A musical instrument.' },
};

// Armor
const armorSlots = ['head','chest','legs','boots'];
const armorTypes = ['cloth','light','medium','heavy'];
const armorBases = {
  cloth:  { def:2, mp:15 },
  light:  { def:5, spd:1 },
  medium: { def:9 },
  heavy:  { def:14, spd:-1 }
};
const tiers = [
  { name:'', mult:1, price:40, floorUnlock:0 },
  { name:'Reinforced ', mult:2, price:120, floorUnlock:5 },
  { name:'Mithril ', mult:3.5, price:350, floorUnlock:15 },
  { name:'Adamantite ', mult:6, price:800, floorUnlock:25 },
  { name:'Legendary ', mult:10, price:1800, floorUnlock:40 }
];

export const ARMOR = {};
armorTypes.forEach(aType => {
  armorSlots.forEach(slot => {
    tiers.forEach((t, ti) => {
      const id = `${t.name.trim().toLowerCase() || 'basic'}_${aType}_${slot}`.replace(/ /g,'_');
      const base = armorBases[aType];
      ARMOR[id] = {
        id, type:'armor', armorType:aType, slot,
        name:`${t.name}${aType.charAt(0).toUpperCase()+aType.slice(1)} ${slot.charAt(0).toUpperCase()+slot.slice(1)}`,
        def: Math.round(base.def * t.mult),
        mp: base.mp ? Math.round(base.mp * t.mult) : 0,
        spd: base.spd || 0,
        price: t.price,
        tier: ti+1,
        floorUnlock: t.floorUnlock,
        description: `${t.name}${aType} armor for ${slot}.`
      };
    });
  });
});

// Consumables
export const CONSUMABLES = {
  health_potion:   { id:'health_potion', name:'Health Potion', type:'consumable', effect:'heal_hp', value:60, price:25, description:'Restore 60 HP.' },
  mana_potion:     { id:'mana_potion', name:'Mana Potion', type:'consumable', effect:'heal_mp', value:40, price:30, description:'Restore 40 MP.' },
  antidote:        { id:'antidote', name:'Antidote', type:'consumable', effect:'cure_status', status:'poison', price:15, description:'Cure poison.' },
  eye_drops:       { id:'eye_drops', name:'Eye Drops', type:'consumable', effect:'cure_status', status:'blind', price:15, description:'Cure blindness.' },
  smelling_salts:  { id:'smelling_salts', name:'Smelling Salts', type:'consumable', effect:'cure_status', status:'sleep', price:20, description:'Wake from sleep.' },
  phoenix_down:    { id:'phoenix_down', name:'Phoenix Down', type:'consumable', effect:'revive', value:0.25, price:100, description:'Revive a fallen ally.' },
  elixir:          { id:'elixir', name:'Elixir', type:'consumable', effect:'heal_all', value:9999, price:500, description:'Fully restore HP and MP.' },
  ether:           { id:'ether', name:'Ether', type:'consumable', effect:'heal_mp', value:80, price:60, description:'Restore 80 MP.' },
  bomb:            { id:'bomb', name:'Bomb', type:'consumable', effect:'damage_enemy', element:'fire', value:80, price:40, description:'Deal 80 fire damage to one enemy.' },
  smoke_bomb_item: { id:'smoke_bomb_item', name:'Smoke Bomb', type:'consumable', effect:'flee_boost', price:30, description:'Boost flee chance significantly.' },
  hi_potion:       { id:'hi_potion', name:'Hi-Potion', type:'consumable', effect:'heal_hp', value:150, price:75, description:'Restore 150 HP.' },
  mega_potion:     { id:'mega_potion', name:'Mega Potion', type:'consumable', effect:'heal_hp_all', value:100, price:200, description:'Restore 100 HP to all allies.' },
  turbo_ether:     { id:'turbo_ether', name:'Turbo Ether', type:'consumable', effect:'heal_mp', value:150, price:150, description:'Restore 150 MP.' },
  elixir_lite:     { id:'elixir_lite', name:'Elixir Lite', type:'consumable', effect:'heal_hp', value:300, price:200, description:'Restore 300 HP.' },
};

// Materials
export const MATERIALS = {
  iron_ingot:    { id:'iron_ingot', name:'Iron Ingot', type:'material', category:'metal', tier:1, price:30, description:'Common iron.' },
  steel_ingot:   { id:'steel_ingot', name:'Steel Ingot', type:'material', category:'metal', tier:2, price:80, description:'Refined steel.' },
  mithril_ingot: { id:'mithril_ingot', name:'Mithril Ingot', type:'material', category:'metal', tier:3, price:200, description:'Rare mithril.' },
  adamantite_ingot:{ id:'adamantite_ingot', name:'Adamantite Ingot', type:'material', category:'metal', tier:4, price:500, description:'Extremely hard metal.' },
  dragonbone:    { id:'dragonbone', name:'Dragonbone', type:'material', category:'metal', tier:5, price:1200, description:'Dragon bone fragment.' },
  leather:       { id:'leather', name:'Leather', type:'material', category:'organic', tier:1, price:25, description:'Common leather.' },
  chainmail:     { id:'chainmail', name:'Chainmail Scraps', type:'material', category:'organic', tier:2, price:70, description:'Chainmail scraps.' },
  dragonhide:    { id:'dragonhide', name:'Dragonhide', type:'material', category:'organic', tier:3, price:180, description:'Dragon hide.' },
  phoenix_leather:{ id:'phoenix_leather', name:'Phoenix Leather', type:'material', category:'organic', tier:4, price:450, description:'Rare phoenix leather.' },
  celestial_silk:{ id:'celestial_silk', name:'Celestial Silk', type:'material', category:'organic', tier:5, price:1100, description:'Silk from celestial beings.' },
  oak_wood:      { id:'oak_wood', name:'Oak Wood', type:'material', category:'wood', tier:1, price:20, description:'Common oak wood.' },
  ash_wood:      { id:'ash_wood', name:'Ash Wood', type:'material', category:'wood', tier:2, price:60, description:'Ash wood.' },
  ebony_wood:    { id:'ebony_wood', name:'Ebony Wood', type:'material', category:'wood', tier:3, price:160, description:'Ebony wood.' },
  yggdrasil_wood:{ id:'yggdrasil_wood', name:'Yggdrasil Branch', type:'material', category:'wood', tier:4, price:400, description:'Branch from Yggdrasil.' },
  starmetal:     { id:'starmetal', name:'Starmetal', type:'material', category:'wood', tier:5, price:1000, description:'Metal from fallen stars.' },
  // Elemental cores
  fire_ruby:     { id:'fire_ruby', name:'Fire Ruby', type:'material', category:'core', element:'fire', price:50, description:'Glowing ruby with fire essence.' },
  aqua_pearl:    { id:'aqua_pearl', name:'Aqua Pearl', type:'material', category:'core', element:'water', price:50, description:'Pearl with water essence.' },
  volt_shard:    { id:'volt_shard', name:'Volt Shard', type:'material', category:'core', element:'lightning', price:50, description:'Crackling lightning shard.' },
  terra_stone:   { id:'terra_stone', name:'Terra Stone', type:'material', category:'core', element:'earth', price:50, description:'Earth essence stone.' },
  nature_seed:   { id:'nature_seed', name:'Nature Seed', type:'material', category:'core', element:'nature', price:50, description:'Seed pulsing with life.' },
  frost_crystal: { id:'frost_crystal', name:'Frost Crystal', type:'material', category:'core', element:'ice', price:50, description:'Crystal of pure ice.' },
  wind_feather:  { id:'wind_feather', name:'Wind Feather', type:'material', category:'core', element:'wind', price:50, description:'Feather from wind spirit.' },
  metal_cog:     { id:'metal_cog', name:'Metal Cog', type:'material', category:'core', element:'metal', price:50, description:'Cog imbued with metal essence.' },
};

// Enchantment Scrolls (dungeon drops only)
export const ENCHANTMENT_SCROLLS = {
  scroll_vampirism: { id:'scroll_vampirism', name:'Scroll of Vampirism', type:'enchantment', effect:'vampirism', description:'Enchant with lifesteal.' },
  scroll_haste:     { id:'scroll_haste', name:'Scroll of Haste', type:'enchantment', effect:'haste', description:'Enchant with haste.' },
  scroll_fortitude: { id:'scroll_fortitude', name:'Scroll of Fortitude', type:'enchantment', effect:'fortitude', description:'Enchant with fortitude.' },
  scroll_precision: { id:'scroll_precision', name:'Scroll of Precision', type:'enchantment', effect:'precision', description:'Enchant with precision.' },
  scroll_thorns:    { id:'scroll_thorns', name:'Scroll of Thorns', type:'enchantment', effect:'thorns', description:'Enchant with thorns.' },
  scroll_wisdom:    { id:'scroll_wisdom', name:'Scroll of Wisdom', type:'enchantment', effect:'wisdom', description:'Enchant with wisdom.' },
  scroll_fury:      { id:'scroll_fury', name:'Scroll of Fury', type:'enchantment', effect:'fury', description:'Enchant with fury.' },
  scroll_warding:   { id:'scroll_warding', name:'Scroll of Warding', type:'enchantment', effect:'warding', description:'Enchant with warding.' },
  scroll_fortune:   { id:'scroll_fortune', name:'Scroll of Fortune', type:'enchantment', effect:'fortune', description:'Enchant with fortune.' },
  scroll_mastery:   { id:'scroll_mastery', name:'Scroll of Mastery', type:'enchantment', effect:'mastery', description:'Enchant with mastery.' },
};
