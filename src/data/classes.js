export const CLASSES = {
  warrior: {
    id: 'warrior', name: 'Warrior', role: 'Tank/DPS',
    primaryStats: ['str','con'], weaponTypes: ['sword','axe','hammer'],
    armorType: 'heavy',
    uniqueMechanic: { name: 'Shield Wall', description: 'Reduces party damage 30% for 2 turns' },
    statGrowth: { hp: 12, mp: 3, str: 3, dex: 1, int: 0, wis: 1, con: 3, spd: 1 },
    baseStats: { hp: 60, mp: 20, str: 10, dex: 6, int: 4, wis: 5, con: 10, spd: 6 },
    skills: ['slash','battle_stance','power_strike','whirling_strike','taunt','provoke','shield_wall','cleave','shield_bash','armor_crush','warcry','relentless_assault','earthquake_slam','fortress_stance','titans_fury','berserker_oath']
  },
  mage: {
    id: 'mage', name: 'Mage', role: 'Magic DPS',
    primaryStats: ['int'], weaponTypes: ['staff','wand'],
    armorType: 'cloth',
    uniqueMechanic: { name: 'Arcane Mastery', description: 'Cast 2 elements per turn' },
    statGrowth: { hp: 5, mp: 12, str: 0, dex: 1, int: 4, wis: 2, con: 1, spd: 2 },
    baseStats: { hp: 30, mp: 60, str: 4, dex: 6, int: 12, wis: 7, con: 4, spd: 7 },
    skills: ['fire_bolt','mana_tap','ice_shard','wind_slash','lightning_bolt','spell_focus','arcane_shield','chain_lightning','firaga','frost_nova','blizzaga','flare','thundaga','time_stop','meteor','ultima']
  },
  ranger: {
    id: 'ranger', name: 'Ranger', role: 'DPS/Support',
    primaryStats: ['dex'], weaponTypes: ['bow','dagger'],
    armorType: 'medium',
    uniqueMechanic: { name: 'Mark Prey', description: 'Party +20% damage to marked target' },
    statGrowth: { hp: 7, mp: 5, str: 1, dex: 4, int: 1, wis: 2, con: 2, spd: 3 },
    baseStats: { hp: 40, mp: 30, str: 6, dex: 12, int: 5, wis: 6, con: 6, spd: 10 },
    skills: ['quick_shot','eagle_eye','poison_arrow','caltrops','mark_prey','aimed_shot','evasion','leg_shot','multi_shot','barrage','snipe','concussive_shot','arrow_rain','fire_arrow_rain','phantom_arrow','death_from_above']
  },
  cleric: {
    id: 'cleric', name: 'Cleric', role: 'Healer/Support',
    primaryStats: ['wis'], weaponTypes: ['mace','staff'],
    armorType: 'medium',
    uniqueMechanic: { name: 'Divine Grace', description: 'Heal + cleanse status effects' },
    statGrowth: { hp: 7, mp: 9, str: 1, dex: 1, int: 2, wis: 4, con: 2, spd: 1 },
    baseStats: { hp: 40, mp: 50, str: 5, dex: 5, int: 6, wis: 12, con: 6, spd: 5 },
    skills: ['heal','minor_heal','cure','bless','protect','sanctuary','divine_grace','group_cure','holy_light','barrier','resurrect','holy_word','mass_heal','rejuvenate','divine_intervention','miracle']
  },
  rogue: {
    id: 'rogue', name: 'Rogue', role: 'DPS/Utility',
    primaryStats: ['dex'], weaponTypes: ['dagger','short_sword'],
    armorType: 'light',
    uniqueMechanic: { name: 'Backstab', description: 'Crits deal 3x damage' },
    statGrowth: { hp: 6, mp: 4, str: 1, dex: 4, int: 1, wis: 1, con: 1, spd: 4 },
    baseStats: { hp: 35, mp: 25, str: 7, dex: 13, int: 5, wis: 4, con: 5, spd: 12 },
    skills: ['stab','pick_pocket','poison_blade','cripple','smoke_bomb','throw_dagger','backstab','dirty_fighting','shadow_step','expose_weakness','assassinate','shadow_meld','fan_of_knives','hemorrhage','death_mark','one_shot']
  },
  paladin: {
    id: 'paladin', name: 'Paladin', role: 'Tank/Healer',
    primaryStats: ['str','wis'], weaponTypes: ['sword','mace'],
    armorType: 'heavy',
    uniqueMechanic: { name: 'Holy Shield', description: 'Barrier absorbs and reflects 25%' },
    statGrowth: { hp: 10, mp: 7, str: 2, dex: 1, int: 1, wis: 3, con: 3, spd: 1 },
    baseStats: { hp: 55, mp: 40, str: 8, dex: 5, int: 5, wis: 9, con: 9, spd: 5 },
    skills: ['smite','holy_strike','lay_on_hands','sacred_ground','protect','rebuke','holy_shield','consecration','divine_smite','divine_protection','aura_of_courage','holy_chain','judgment','shield_of_faith','divine_wrath','crusader_oath']
  },
  necromancer: {
    id: 'necromancer', name: 'Necromancer', role: 'Magic DPS/Summoner',
    primaryStats: ['int'], weaponTypes: ['staff','orb'],
    armorType: 'cloth',
    uniqueMechanic: { name: 'Raise Dead', description: 'Summon defeated enemy as ally' },
    statGrowth: { hp: 5, mp: 11, str: 0, dex: 1, int: 4, wis: 2, con: 1, spd: 2 },
    baseStats: { hp: 30, mp: 60, str: 3, dex: 6, int: 13, wis: 7, con: 4, spd: 6 },
    skills: ['shadow_bolt','dark_pulse','drain_life','bone_spear','summon_skeleton','life_tap','raise_dead','plague','curse','corpse_explosion','bone_shield','wither','death_coil','lich_form','army_of_the_dead','death_and_decay']
  },
  berserker: {
    id: 'berserker', name: 'Berserker', role: 'DPS',
    primaryStats: ['str'], weaponTypes: ['axe','hammer'],
    armorType: 'medium',
    uniqueMechanic: { name: 'Frenzy', description: 'Each kill gives +5% ATK for rest of battle' },
    statGrowth: { hp: 11, mp: 3, str: 4, dex: 2, int: 0, wis: 0, con: 2, spd: 2 },
    baseStats: { hp: 55, mp: 15, str: 13, dex: 7, int: 3, wis: 3, con: 8, spd: 7 },
    skills: ['wild_swing','bull_rush','rage','battle_shout','reckless_blow','headbutt','frenzy','berserker_charge','bloodlust','endure','whirlwind','blood_frenzy','rampage','titan_slam','unstoppable_force','godlike_rage']
  },
  elementalist: {
    id: 'elementalist', name: 'Elementalist', role: 'Magic DPS',
    primaryStats: ['int'], weaponTypes: ['staff','orb','wand'],
    armorType: 'cloth',
    uniqueMechanic: { name: 'Elemental Shift', description: 'Change active element 1/turn, +30% spells' },
    statGrowth: { hp: 5, mp: 12, str: 0, dex: 1, int: 4, wis: 3, con: 1, spd: 2 },
    baseStats: { hp: 30, mp: 65, str: 3, dex: 6, int: 13, wis: 8, con: 4, spd: 7 },
    skills: ['elemental_bolt','water_jet','elemental_shift','earth_tremor','elemental_shield','elemental_infusion','fusion_cast','twin_elements','elemental_storm','vortex','primal_surge','overload','elemental_mastery','elemental_cascade','cataclysm','world_ender']
  },
  bard: {
    id: 'bard', name: 'Bard', role: 'Support/DPS',
    primaryStats: ['wis','dex'], weaponTypes: ['instrument','dagger'],
    armorType: 'light',
    uniqueMechanic: { name: 'Battle Hymn', description: 'Party-wide stat buffs for 3 turns' },
    statGrowth: { hp: 6, mp: 8, str: 1, dex: 2, int: 2, wis: 3, con: 1, spd: 3 },
    baseStats: { hp: 36, mp: 45, str: 5, dex: 9, int: 7, wis: 10, con: 5, spd: 9 },
    skills: ['inspire','soothing_melody','discordant_note','war_chant','battle_hymn','dissonance','lullaby','aria_of_healing','requiem','battle_cry','ballad_of_haste','siren_song','symphony_of_war','finale','magnum_opus','grand_finale']
  },
  monk: {
    id: 'monk', name: 'Monk', role: 'DPS/Support',
    primaryStats: ['dex','str'], weaponTypes: ['fist','bo_staff'],
    armorType: 'light',
    uniqueMechanic: { name: 'Chi Strike', description: 'Attacks ignore enemy armor' },
    statGrowth: { hp: 8, mp: 5, str: 2, dex: 3, int: 1, wis: 2, con: 2, spd: 4 },
    baseStats: { hp: 45, mp: 30, str: 8, dex: 11, int: 5, wis: 7, con: 7, spd: 11 },
    skills: ['palm_strike','ki_charge','meditate','deflect','flurry_of_blows','pressure_point','chi_strike','steel_skin','iron_fist','whirlwind_kick','chakra_heal','void_palm','hundred_fists','tiger_stance','nirvana_strike','dragon_ascent']
  },
  summoner: {
    id: 'summoner', name: 'Summoner', role: 'Summoner/Support',
    primaryStats: ['int','wis'], weaponTypes: ['staff','orb'],
    armorType: 'cloth',
    uniqueMechanic: { name: 'Conjure', description: 'Summon elemental spirits' },
    statGrowth: { hp: 5, mp: 11, str: 0, dex: 1, int: 3, wis: 4, con: 1, spd: 2 },
    baseStats: { hp: 30, mp: 60, str: 3, dex: 5, int: 11, wis: 11, con: 4, spd: 6 },
    skills: ['summon_wisp','spirit_bond','elemental_pact','summon_fairy','summon_golem','beast_call','conjure','dimensional_rift','summon_phoenix','arcane_beast','astral_projection','celestial_guardian','summon_dragon','prism_summon','grand_summoning','leviathan']
  },
  dark_knight: {
    id: 'dark_knight', name: 'Dark Knight', role: 'Tank/DPS',
    primaryStats: ['str','int'], weaponTypes: ['great_sword','scythe'],
    armorType: 'heavy',
    uniqueMechanic: { name: 'Blood Price', description: 'Sacrifice 15% HP for massive dark damage' },
    statGrowth: { hp: 9, mp: 7, str: 3, dex: 1, int: 2, wis: 1, con: 2, spd: 1 },
    baseStats: { hp: 50, mp: 40, str: 11, dex: 5, int: 9, wis: 5, con: 8, spd: 5 },
    skills: ['dark_slash','shadow_step_dk','blood_price','dark_pulse_dk','shadow_armor','siphon','soul_drain','unholy_aura','abyssal_strike','void_blade','dark_aura','necrotic_strike','doom_blade','shadow_world','oblivion','apocalypse']
  },
  alchemist: {
    id: 'alchemist', name: 'Alchemist', role: 'Support/DPS',
    primaryStats: ['int','wis'], weaponTypes: ['thrown','dagger'],
    armorType: 'medium',
    uniqueMechanic: { name: 'Transmute', description: 'Combine 2 items mid-battle' },
    statGrowth: { hp: 6, mp: 8, str: 1, dex: 2, int: 3, wis: 3, con: 2, spd: 2 },
    baseStats: { hp: 36, mp: 48, str: 5, dex: 7, int: 10, wis: 10, con: 6, spd: 7 },
    skills: ['throw_vial','flash_bomb','brew_potion','corrosive_vial','acid_splash','stimulant','transmute','smoke_screen','volatile_mixture','poison_cloud','philosophers_shield','nullify_element','elixir_of_life','unstable_compound','magnum_opus_alch','philosopher_stone_skill']
  },
  samurai: {
    id: 'samurai', name: 'Samurai', role: 'DPS',
    primaryStats: ['str','dex'], weaponTypes: ['katana','nodachi'],
    armorType: 'medium',
    uniqueMechanic: { name: 'Iaijutsu', description: 'Counter-attack first when targeted +50% damage' },
    statGrowth: { hp: 8, mp: 4, str: 3, dex: 3, int: 1, wis: 1, con: 2, spd: 3 },
    baseStats: { hp: 45, mp: 25, str: 10, dex: 11, int: 5, wis: 5, con: 7, spd: 10 },
    skills: ['slash_draw','quick_draw','focus','keen_edge','crescent_moon','thousand_cuts','iaijutsu','death_blow','blade_dance','genji_cut','bushido_spirit','void_strike','cherry_blossom_cut','mirror_blade','final_strike','musou_no_tachi']
  },
  witch_doctor: {
    id: 'witch_doctor', name: 'Witch Doctor', role: 'Support/DPS',
    primaryStats: ['wis','int'], weaponTypes: ['totem','staff'],
    armorType: 'cloth',
    uniqueMechanic: { name: 'Hex', description: 'Stack up to 3 debuffs on one enemy' },
    statGrowth: { hp: 5, mp: 10, str: 0, dex: 1, int: 3, wis: 4, con: 1, spd: 2 },
    baseStats: { hp: 30, mp: 58, str: 4, dex: 6, int: 10, wis: 12, con: 4, spd: 6 },
    skills: ['hex_bolt','fetish','minor_hex','plague_curse','healing_totem','soul_harvest','hex','locust_swarm','voodoo_doll','acid_rain','spirit_walk','spirit_barrage','mass_hex','death_curse','ancestral_wrath','rain_of_toads']
  }
};
