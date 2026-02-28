export const ELEMENTS = ['fire','water','lightning','earth','nature','ice','wind','metal','light','dark'];

export const SPELLS = {};

// Tier names
const TIERS = ['T1','T2','T3','T4'];
const TIER_NAMES = {
  fire: ['Ember','Fireball','Firestorm','Inferno'],
  water: ['Water Jet','Tidal Wave','Maelstrom','Tsunami'],
  lightning: ['Spark','Thunderbolt','Lightning Storm','Thunder God'],
  earth: ['Rock Throw','Earthquake','Landslide','Cataclysm Earth'],
  nature: ['Thorn Whip','Vine Snare','Nature\'s Wrath','World Tree'],
  ice: ['Frost Shard','Blizzard','Glacial Burst','Absolute Zero'],
  wind: ['Gust','Cyclone','Twister','Tempest'],
  metal: ['Iron Shard','Steel Slash','Metal Storm','Adamantite Barrage'],
  light: ['Holy Bolt','Sacred Light','Divine Radiance','Judgement Day'],
  dark: ['Shadow Bolt','Darkness','Void Pulse','Oblivion']
};

const TIER_COSTS = [6, 15, 30, 55];
const TIER_POWERS = [1.0, 1.8, 2.8, 4.2];
const TIER_PRICES = [100, 300, 700, 1500];

ELEMENTS.forEach(elem => {
  TIER_NAMES[elem].forEach((spellName, i) => {
    const id = `${elem}_t${i+1}`;
    SPELLS[id] = {
      id, name: spellName, element: elem,
      tier: i+1, mpCost: TIER_COSTS[i],
      power: TIER_POWERS[i],
      target: i >= 2 ? 'all_enemies' : 'single',
      type: 'magic',
      price: TIER_PRICES[i],
      description: `${spellName}: ${elem} magic (Tier ${i+1})`
    };
    // Add status effects for elements
    const statusMap = {fire:'burn',water:'chill',lightning:'paralyze',earth:'petrify',nature:'poison',ice:'freeze',wind:'silence',metal:'bleed'};
    if (statusMap[elem] && Math.random() > 0.5) {
      SPELLS[id].statusEffect = statusMap[elem];
      SPELLS[id].statusChance = 0.2 + i * 0.05;
    }
  });
});

// Healing spells
SPELLS['heal_t1'] = { id:'heal_t1', name:'Cure', type:'heal', mpCost:8, power:1.5, target:'single_ally', price:100, description:'Restore HP to one ally.' };
SPELLS['heal_t2'] = { id:'heal_t2', name:'Cura', type:'heal', mpCost:18, power:2.5, target:'single_ally', price:300, description:'Restore more HP to one ally.' };
SPELLS['heal_t3'] = { id:'heal_t3', name:'Curaga', type:'heal', mpCost:35, power:4.0, target:'single_ally', price:700, description:'Greatly restore HP.' };
SPELLS['heal_all_t1'] = { id:'heal_all_t1', name:'Mend All', type:'heal', mpCost:20, power:1.2, target:'all_allies', price:300, description:'Heal all party members.' };
SPELLS['heal_all_t2'] = { id:'heal_all_t2', name:'Regen', type:'heal', mpCost:30, power:1.8, target:'all_allies', price:700, description:'Heal all party members greatly.' };
SPELLS['revive_t1'] = { id:'revive_t1', name:'Raise', type:'revive', mpCost:40, power:0.3, target:'single_ally', price:700, description:'Revive fallen ally at 30% HP.' };
SPELLS['revive_t2'] = { id:'revive_t2', name:'Arise', type:'revive', mpCost:65, power:0.6, target:'single_ally', price:1500, description:'Revive fallen ally at 60% HP.' };
