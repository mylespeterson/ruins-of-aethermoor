export const RACES = {
  human: {
    id: 'human', name: 'Human',
    description: 'Versatile and adaptable, humans excel in all fields.',
    hpMod: 1.0, mpMod: 1.0,
    statMods: { str: 1, dex: 1, int: 1, wis: 1, con: 1 },
    passive: { name: 'Adaptable', description: '+10% EXP gained', type: 'exp_bonus', value: 0.10 }
  },
  elf: {
    id: 'elf', name: 'Elf',
    description: 'Ancient beings with keen magical aptitude.',
    hpMod: 0.95, mpMod: 1.15,
    statMods: { str: -1, dex: 2, int: 3, wis: 2, con: -1 },
    passive: { name: 'Arcane Blood', description: '+15% MP regen after battle', type: 'mp_regen', value: 0.15 }
  },
  dwarf: {
    id: 'dwarf', name: 'Dwarf',
    description: 'Stout warriors with iron constitution.',
    hpMod: 1.15, mpMod: 0.90,
    statMods: { str: 3, dex: -1, int: -1, wis: 1, con: 3 },
    passive: { name: 'Stoneborn', description: '+20% Earth resistance', type: 'element_resist', element: 'earth', value: 0.20 }
  },
  orc: {
    id: 'orc', name: 'Orc',
    description: 'Fearsome warriors who grow stronger under pressure.',
    hpMod: 1.10, mpMod: 0.85,
    statMods: { str: 4, dex: 1, int: -2, wis: -1, con: 3 },
    passive: { name: 'Bloodrage', description: '+15% damage below 30% HP', type: 'low_hp_damage', value: 0.15 }
  },
  feykin: {
    id: 'feykin', name: 'Feykin',
    description: 'Touched by fey magic, masters of arcane arts.',
    hpMod: 0.90, mpMod: 1.20,
    statMods: { str: -2, dex: 3, int: 4, wis: 2, con: -2 },
    passive: { name: 'Fey Touched', description: '+10% magic damage', type: 'magic_damage', value: 0.10 }
  },
  halfling: {
    id: 'halfling', name: 'Halfling',
    description: 'Small but nimble, blessed with extraordinary luck.',
    hpMod: 0.95, mpMod: 1.05,
    statMods: { str: -1, dex: 4, int: 1, wis: 2, con: 0 },
    passive: { name: 'Lucky', description: '+10% crit chance and dodge', type: 'luck', value: 0.10 }
  },
  dragonborn: {
    id: 'dragonborn', name: 'Dragonborn',
    description: 'Descendants of dragons with an innate elemental breath.',
    hpMod: 1.10, mpMod: 1.05,
    statMods: { str: 3, dex: -1, int: 2, wis: 0, con: 2 },
    passive: { name: 'Dragon Breath', description: 'Free elemental attack once per battle', type: 'dragon_breath', value: 1 }
  },
  undead: {
    id: 'undead', name: 'Undead',
    description: 'The living dead, tougher than life itself.',
    hpMod: 1.20, mpMod: 0.95,
    statMods: { str: 2, dex: -1, int: 1, wis: -2, con: 4 },
    passive: { name: 'Undying', description: 'Revive once per dungeon at 10% HP', type: 'revive', value: 0.10 }
  },
  celestial: {
    id: 'celestial', name: 'Celestial',
    description: 'Beings of divine light with powerful healing.',
    hpMod: 0.95, mpMod: 1.25,
    statMods: { str: -2, dex: 1, int: 3, wis: 4, con: -1 },
    passive: { name: 'Divine Light', description: 'Healing 20% more effective', type: 'heal_bonus', value: 0.20 }
  },
  demon: {
    id: 'demon', name: 'Demon',
    description: 'Infernal beings who sacrifice life for power.',
    hpMod: 1.05, mpMod: 1.10,
    statMods: { str: 3, dex: 2, int: 2, wis: -3, con: 1 },
    passive: { name: 'Infernal Pact', description: 'Sacrifice 10% HP to boost next spell 25%', type: 'hp_to_spell', value: 0.25 }
  },
  beastkin: {
    id: 'beastkin', name: 'Beastkin',
    description: 'Half-beast warriors with feral instincts.',
    hpMod: 1.05, mpMod: 0.95,
    statMods: { str: 2, dex: 3, int: -1, wis: 1, con: 2 },
    passive: { name: 'Feral Instinct', description: 'Always acts first in ambush', type: 'ambush_first', value: 1 }
  },
  golem: {
    id: 'golem', name: 'Golem',
    description: 'Living stone constructs with immense durability.',
    hpMod: 1.25, mpMod: 0.80,
    statMods: { str: 4, dex: -3, int: -2, wis: 0, con: 5 },
    passive: { name: 'Living Stone', description: 'Immune to Bleed and Poison', type: 'status_immune', immuneTo: ['bleed','poison'], value: 1 }
  }
};
