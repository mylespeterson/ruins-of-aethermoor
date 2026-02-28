export const CLASSES = {
  warrior: {
    id: 'warrior', name: 'Warrior', role: 'Tank/DPS',
    primaryStats: ['str','con'], weaponTypes: ['sword','axe','hammer'],
    armorType: 'heavy',
    uniqueMechanic: { name: 'Shield Wall', description: 'Reduces party damage 30% for 2 turns' },
    statGrowth: { hp: 12, mp: 3, str: 3, dex: 1, int: 0, wis: 1, con: 3, spd: 1 },
    baseStats: { hp: 60, mp: 20, str: 10, dex: 6, int: 4, wis: 5, con: 10, spd: 6 },
    skills: ['slash','power_strike','taunt','shield_wall','cleave','warcry','earthquake_slam','titans_fury']
  },
  mage: {
    id: 'mage', name: 'Mage', role: 'Magic DPS',
    primaryStats: ['int'], weaponTypes: ['staff','wand'],
    armorType: 'cloth',
    uniqueMechanic: { name: 'Arcane Mastery', description: 'Cast 2 elements per turn' },
    statGrowth: { hp: 5, mp: 12, str: 0, dex: 1, int: 4, wis: 2, con: 1, spd: 2 },
    baseStats: { hp: 30, mp: 60, str: 4, dex: 6, int: 12, wis: 7, con: 4, spd: 7 },
    skills: ['fire_bolt','ice_shard','lightning_bolt','arcane_shield','firaga','blizzaga','thundaga','meteor']
  },
  ranger: {
    id: 'ranger', name: 'Ranger', role: 'DPS/Support',
    primaryStats: ['dex'], weaponTypes: ['bow','dagger'],
    armorType: 'medium',
    uniqueMechanic: { name: 'Mark Prey', description: 'Party +20% damage to marked target' },
    statGrowth: { hp: 7, mp: 5, str: 1, dex: 4, int: 1, wis: 2, con: 2, spd: 3 },
    baseStats: { hp: 40, mp: 30, str: 6, dex: 12, int: 5, wis: 6, con: 6, spd: 10 },
    skills: ['quick_shot','poison_arrow','mark_prey','evasion','multi_shot','snipe','arrow_rain','phantom_arrow']
  },
  cleric: {
    id: 'cleric', name: 'Cleric', role: 'Healer/Support',
    primaryStats: ['wis'], weaponTypes: ['mace','staff'],
    armorType: 'medium',
    uniqueMechanic: { name: 'Divine Grace', description: 'Heal + cleanse status effects' },
    statGrowth: { hp: 7, mp: 9, str: 1, dex: 1, int: 2, wis: 4, con: 2, spd: 1 },
    baseStats: { hp: 40, mp: 50, str: 5, dex: 5, int: 6, wis: 12, con: 6, spd: 5 },
    skills: ['heal','cure','protect','divine_grace','holy_light','resurrect','mass_heal','divine_intervention']
  },
  rogue: {
    id: 'rogue', name: 'Rogue', role: 'DPS/Utility',
    primaryStats: ['dex'], weaponTypes: ['dagger','short_sword'],
    armorType: 'light',
    uniqueMechanic: { name: 'Backstab', description: 'Crits deal 3x damage' },
    statGrowth: { hp: 6, mp: 4, str: 1, dex: 4, int: 1, wis: 1, con: 1, spd: 4 },
    baseStats: { hp: 35, mp: 25, str: 7, dex: 13, int: 5, wis: 4, con: 5, spd: 12 },
    skills: ['stab','poison_blade','smoke_bomb','backstab','shadow_step','assassinate','fan_of_knives','death_mark']
  },
  paladin: {
    id: 'paladin', name: 'Paladin', role: 'Tank/Healer',
    primaryStats: ['str','wis'], weaponTypes: ['sword','mace'],
    armorType: 'heavy',
    uniqueMechanic: { name: 'Holy Shield', description: 'Barrier absorbs and reflects 25%' },
    statGrowth: { hp: 10, mp: 7, str: 2, dex: 1, int: 1, wis: 3, con: 3, spd: 1 },
    baseStats: { hp: 55, mp: 40, str: 8, dex: 5, int: 5, wis: 9, con: 9, spd: 5 },
    skills: ['smite','lay_on_hands','protect','holy_shield','divine_smite','aura_of_courage','judgment','divine_wrath']
  },
  necromancer: {
    id: 'necromancer', name: 'Necromancer', role: 'Magic DPS/Summoner',
    primaryStats: ['int'], weaponTypes: ['staff','orb'],
    armorType: 'cloth',
    uniqueMechanic: { name: 'Raise Dead', description: 'Summon defeated enemy as ally' },
    statGrowth: { hp: 5, mp: 11, str: 0, dex: 1, int: 4, wis: 2, con: 1, spd: 2 },
    baseStats: { hp: 30, mp: 60, str: 3, dex: 6, int: 13, wis: 7, con: 4, spd: 6 },
    skills: ['shadow_bolt','drain_life','summon_skeleton','raise_dead','curse','bone_shield','death_coil','army_of_the_dead']
  },
  berserker: {
    id: 'berserker', name: 'Berserker', role: 'DPS',
    primaryStats: ['str'], weaponTypes: ['axe','hammer'],
    armorType: 'medium',
    uniqueMechanic: { name: 'Frenzy', description: 'Each kill gives +5% ATK for rest of battle' },
    statGrowth: { hp: 11, mp: 3, str: 4, dex: 2, int: 0, wis: 0, con: 2, spd: 2 },
    baseStats: { hp: 55, mp: 15, str: 13, dex: 7, int: 3, wis: 3, con: 8, spd: 7 },
    skills: ['wild_swing','rage','reckless_blow','frenzy','bloodlust','whirlwind','rampage','unstoppable_force']
  },
  elementalist: {
    id: 'elementalist', name: 'Elementalist', role: 'Magic DPS',
    primaryStats: ['int'], weaponTypes: ['staff','orb','wand'],
    armorType: 'cloth',
    uniqueMechanic: { name: 'Elemental Shift', description: 'Change active element 1/turn, +30% spells' },
    statGrowth: { hp: 5, mp: 12, str: 0, dex: 1, int: 4, wis: 3, con: 1, spd: 2 },
    baseStats: { hp: 30, mp: 65, str: 3, dex: 6, int: 13, wis: 8, con: 4, spd: 7 },
    skills: ['elemental_bolt','elemental_shift','elemental_shield','fusion_cast','elemental_storm','primal_surge','elemental_mastery','cataclysm']
  },
  bard: {
    id: 'bard', name: 'Bard', role: 'Support/DPS',
    primaryStats: ['wis','dex'], weaponTypes: ['instrument','dagger'],
    armorType: 'light',
    uniqueMechanic: { name: 'Battle Hymn', description: 'Party-wide stat buffs for 3 turns' },
    statGrowth: { hp: 6, mp: 8, str: 1, dex: 2, int: 2, wis: 3, con: 1, spd: 3 },
    baseStats: { hp: 36, mp: 45, str: 5, dex: 9, int: 7, wis: 10, con: 5, spd: 9 },
    skills: ['inspire','discordant_note','battle_hymn','lullaby','requiem','ballad_of_haste','symphony_of_war','magnum_opus']
  },
  monk: {
    id: 'monk', name: 'Monk', role: 'DPS/Support',
    primaryStats: ['dex','str'], weaponTypes: ['fist','bo_staff'],
    armorType: 'light',
    uniqueMechanic: { name: 'Chi Strike', description: 'Attacks ignore enemy armor' },
    statGrowth: { hp: 8, mp: 5, str: 2, dex: 3, int: 1, wis: 2, con: 2, spd: 4 },
    baseStats: { hp: 45, mp: 30, str: 8, dex: 11, int: 5, wis: 7, con: 7, spd: 11 },
    skills: ['palm_strike','meditate','flurry_of_blows','chi_strike','iron_fist','chakra_heal','hundred_fists','nirvana_strike']
  },
  summoner: {
    id: 'summoner', name: 'Summoner', role: 'Summoner/Support',
    primaryStats: ['int','wis'], weaponTypes: ['staff','orb'],
    armorType: 'cloth',
    uniqueMechanic: { name: 'Conjure', description: 'Summon elemental spirits' },
    statGrowth: { hp: 5, mp: 11, str: 0, dex: 1, int: 3, wis: 4, con: 1, spd: 2 },
    baseStats: { hp: 30, mp: 60, str: 3, dex: 5, int: 11, wis: 11, con: 4, spd: 6 },
    skills: ['summon_wisp','elemental_pact','summon_golem','conjure','summon_phoenix','astral_projection','summon_dragon','grand_summoning']
  },
  dark_knight: {
    id: 'dark_knight', name: 'Dark Knight', role: 'Tank/DPS',
    primaryStats: ['str','int'], weaponTypes: ['great_sword','scythe'],
    armorType: 'heavy',
    uniqueMechanic: { name: 'Blood Price', description: 'Sacrifice 15% HP for massive dark damage' },
    statGrowth: { hp: 9, mp: 7, str: 3, dex: 1, int: 2, wis: 1, con: 2, spd: 1 },
    baseStats: { hp: 50, mp: 40, str: 11, dex: 5, int: 9, wis: 5, con: 8, spd: 5 },
    skills: ['dark_slash','blood_price','shadow_armor','soul_drain','abyssal_strike','dark_aura','doom_blade','oblivion']
  },
  alchemist: {
    id: 'alchemist', name: 'Alchemist', role: 'Support/DPS',
    primaryStats: ['int','wis'], weaponTypes: ['thrown','dagger'],
    armorType: 'medium',
    uniqueMechanic: { name: 'Transmute', description: 'Combine 2 items mid-battle' },
    statGrowth: { hp: 6, mp: 8, str: 1, dex: 2, int: 3, wis: 3, con: 2, spd: 2 },
    baseStats: { hp: 36, mp: 48, str: 5, dex: 7, int: 10, wis: 10, con: 6, spd: 7 },
    skills: ['throw_vial','brew_potion','acid_splash','transmute','volatile_mixture','philosophers_shield','elixir_of_life','magnum_opus_alch']
  },
  samurai: {
    id: 'samurai', name: 'Samurai', role: 'DPS',
    primaryStats: ['str','dex'], weaponTypes: ['katana','nodachi'],
    armorType: 'medium',
    uniqueMechanic: { name: 'Iaijutsu', description: 'Counter-attack first when targeted +50% damage' },
    statGrowth: { hp: 8, mp: 4, str: 3, dex: 3, int: 1, wis: 1, con: 2, spd: 3 },
    baseStats: { hp: 45, mp: 25, str: 10, dex: 11, int: 5, wis: 5, con: 7, spd: 10 },
    skills: ['slash_draw','focus','crescent_moon','iaijutsu','blade_dance','bushido_spirit','cherry_blossom_cut','final_strike']
  },
  witch_doctor: {
    id: 'witch_doctor', name: 'Witch Doctor', role: 'Support/DPS',
    primaryStats: ['wis','int'], weaponTypes: ['totem','staff'],
    armorType: 'cloth',
    uniqueMechanic: { name: 'Hex', description: 'Stack up to 3 debuffs on one enemy' },
    statGrowth: { hp: 5, mp: 10, str: 0, dex: 1, int: 3, wis: 4, con: 1, spd: 2 },
    baseStats: { hp: 30, mp: 58, str: 4, dex: 6, int: 10, wis: 12, con: 4, spd: 6 },
    skills: ['hex_bolt','minor_hex','healing_totem','hex','voodoo_doll','spirit_walk','mass_hex','ancestral_wrath']
  }
};
