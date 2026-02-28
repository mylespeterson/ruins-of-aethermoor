// Crafting recipes: base material + elemental core + optional enchantment = result
// Tier names based on material tier
const MATERIAL_TIER_NAMES = {
  1: 'Crude', 2: 'Refined', 3: 'Superior', 4: 'Mythic', 5: 'Legendary'
};
const ELEMENT_NAMES = {
  fire:'Flame', water:'Aqua', lightning:'Thunder', earth:'Terra',
  nature:'Nature', ice:'Frost', wind:'Gale', metal:'Steel',
  light:'Holy', dark:'Shadow'
};
const BASE_STATS = {
  iron_ingot:     { type:'weapon', atk:18, tier:1 },
  steel_ingot:    { type:'weapon', atk:30, tier:2 },
  mithril_ingot:  { type:'weapon', atk:48, tier:3 },
  adamantite_ingot:{ type:'weapon', atk:75, tier:4 },
  dragonbone:     { type:'weapon', atk:110, tier:5 },
  leather:        { type:'armor', armorType:'light', def:6, tier:1 },
  chainmail:      { type:'armor', armorType:'medium', def:12, tier:2 },
  dragonhide:     { type:'armor', armorType:'medium', def:22, tier:3 },
  phoenix_leather:{ type:'armor', armorType:'medium', def:35, tier:4 },
  celestial_silk: { type:'armor', armorType:'cloth', def:15, mp:60, tier:5 },
  oak_wood:       { type:'staff', atk:12, int:3, tier:1 },
  ash_wood:       { type:'staff', atk:20, int:6, tier:2 },
  ebony_wood:     { type:'staff', atk:32, int:10, tier:3 },
  yggdrasil_wood: { type:'staff', atk:50, int:16, tier:4 },
  starmetal:      { type:'weapon', atk:100, int:20, tier:5 },
};

const CORES = ['fire_ruby','aqua_pearl','volt_shard','terra_stone','nature_seed','frost_crystal','wind_feather','metal_cog'];
const CORE_ELEMENTS = {
  fire_ruby:'fire', aqua_pearl:'water', volt_shard:'lightning', terra_stone:'earth',
  nature_seed:'nature', frost_crystal:'ice', wind_feather:'wind', metal_cog:'metal'
};
const CORE_BONUSES = {
  fire_ruby:   { element:'fire', atk:5, int:2 },
  aqua_pearl:  { element:'water', mp:20, wis:2 },
  volt_shard:  { element:'lightning', spd:3, dex:2 },
  terra_stone: { element:'earth', def:5, con:2 },
  nature_seed: { element:'nature', hp:20, wis:2 },
  frost_crystal:{ element:'ice', mp:15, int:2 },
  wind_feather:{ element:'wind', spd:4, dex:3 },
  metal_cog:   { element:'metal', atk:4, def:4 },
};

export const CRAFTING_RECIPES = [];

// Generate weapon recipes
Object.entries(BASE_STATS).forEach(([matId, baseData]) => {
  CORES.forEach(coreId => {
    const element = CORE_ELEMENTS[coreId];
    const elemName = ELEMENT_NAMES[element];
    const tierName = MATERIAL_TIER_NAMES[baseData.tier];
    const coreBonuses = CORE_BONUSES[coreId];
    let resultItem;
    if (baseData.type === 'weapon') {
      resultItem = {
        id: `crafted_${matId}_${coreId}`,
        type: 'weapon', weaponType: 'sword',
        name: `${tierName} ${elemName}blade`,
        atk: baseData.atk + (coreBonuses.atk||0),
        int: (baseData.int||0) + (coreBonuses.int||0),
        element, tier: baseData.tier,
        crafted: true, description: `Crafted ${tierName.toLowerCase()} sword with ${element} affinity.`
      };
    } else if (baseData.type === 'staff') {
      resultItem = {
        id: `crafted_${matId}_${coreId}`,
        type: 'weapon', weaponType: 'staff',
        name: `${tierName} ${elemName} Staff`,
        atk: baseData.atk + (coreBonuses.atk||0),
        int: (baseData.int||0) + (coreBonuses.int||0),
        mp: coreBonuses.mp||0,
        element, tier: baseData.tier,
        crafted: true, description: `Crafted ${tierName.toLowerCase()} staff with ${element} affinity.`
      };
    } else { // armor
      resultItem = {
        id: `crafted_${matId}_${coreId}`,
        type: 'armor', armorType: baseData.armorType, slot: 'chest',
        name: `${tierName} ${elemName} Armor`,
        def: baseData.def + (coreBonuses.def||0),
        hp: coreBonuses.hp||0,
        mp: (baseData.mp||0) + (coreBonuses.mp||0),
        con: coreBonuses.con||0,
        element, tier: baseData.tier,
        crafted: true, description: `Crafted ${tierName.toLowerCase()} armor with ${element} affinity.`
      };
    }
    CRAFTING_RECIPES.push({
      id: `recipe_${matId}_${coreId}`,
      inputs: { base: matId, core: coreId, scroll: null },
      result: resultItem,
      description: `Craft ${resultItem.name}`
    });
    // With enchantment scrolls
    const scrollEffects = ['vampirism','haste','fortitude','precision','thorns','wisdom','fury','warding','fortune','mastery'];
    scrollEffects.forEach(effect => {
      const enchantedResult = { ...resultItem,
        id: `crafted_${matId}_${coreId}_${effect}`,
        name: `${resultItem.name} of ${effect.charAt(0).toUpperCase()+effect.slice(1)}`,
        enchantment: effect,
        crafted: true
      };
      // Apply enchantment bonuses
      if (effect === 'vampirism') enchantedResult.lifesteal = 0.1;
      if (effect === 'haste') enchantedResult.spd = (enchantedResult.spd||0) + 3;
      if (effect === 'fortitude') enchantedResult.con = (enchantedResult.con||0) + 3;
      if (effect === 'precision') enchantedResult.critChance = 0.05;
      if (effect === 'thorns') enchantedResult.thorns = 0.15;
      if (effect === 'wisdom') enchantedResult.wis = (enchantedResult.wis||0) + 3;
      if (effect === 'fury') enchantedResult.atk = (enchantedResult.atk||0) + 8;
      if (effect === 'warding') enchantedResult.def = (enchantedResult.def||0) + 5;
      if (effect === 'fortune') enchantedResult.goldBonus = 0.1;
      if (effect === 'mastery') enchantedResult.expBonus = 0.1;
      CRAFTING_RECIPES.push({
        id: `recipe_${matId}_${coreId}_${effect}`,
        inputs: { base: matId, core: coreId, scroll: `scroll_${effect}` },
        result: enchantedResult,
        description: `Craft ${enchantedResult.name}`
      });
    });
  });
});
