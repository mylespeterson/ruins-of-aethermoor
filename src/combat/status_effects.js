// Status effect definitions and tick logic
export const STATUS_EFFECTS = {
  burn:     { id:'burn',     name:'Burn',     color:'#ff4400', icon:'🔥', duration:3, tickDamage: (maxHp) => Math.round(maxHp * 0.05) },
  chill:    { id:'chill',    name:'Chill',    color:'#88ddff', icon:'❄️', duration:3, spdMult:0.7 },
  paralyze: { id:'paralyze', name:'Paralyze', color:'#ffff00', icon:'⚡', duration:2, skipChance:0.25 },
  petrify:  { id:'petrify',  name:'Petrify',  color:'#886633', icon:'🗿', duration:1, skipTurn:true, dmgVulnerability:1.25 },
  poison:   { id:'poison',   name:'Poison',   color:'#44cc44', icon:'☠️', duration:4, tickDamage: (maxHp) => Math.round(maxHp * 0.08) },
  freeze:   { id:'freeze',   name:'Freeze',   color:'#88ddff', icon:'🧊', duration:1, skipTurn:true, shatterBonus:1.5 },
  silence:  { id:'silence',  name:'Silence',  color:'#aaddff', icon:'🔇', duration:3, preventMagic:true },
  bleed:    { id:'bleed',    name:'Bleed',    color:'#cc0000', icon:'💉', duration:5, tickDamage: (maxHp, stacks) => Math.round(maxHp * 0.03 * stacks) },
  stun:     { id:'stun',     name:'Stun',     color:'#ffaa00', icon:'💫', duration:1, skipTurn:true },
  sleep:    { id:'sleep',    name:'Sleep',    color:'#8888ff', icon:'💤', duration:2, skipTurn:true, wakeOnHit:true },
  curse:    { id:'curse',    name:'Curse',    color:'#8844aa', icon:'👁️', duration:4, statMult:0.8 },
  blind:    { id:'blind',    name:'Blind',    color:'#333333', icon:'👁', duration:2, hitPenalty:0.4 },
  mark:     { id:'mark',     name:'Marked',   color:'#ff8800', icon:'🎯', duration:4, dmgBonus:0.2 },
  taunt:    { id:'taunt',    name:'Taunting', color:'#ff4444', icon:'⚔️', duration:3 },
};

export function tickStatusEffects(entity) {
  const results = [];
  entity.statusEffects = entity.statusEffects.filter(effect => {
    const def = STATUS_EFFECTS[effect.id];
    if (!def) return false;
    // Apply tick damage
    if (def.tickDamage) {
      const dmg = def.tickDamage(entity.maxHp, effect.stacks || 1);
      entity.hp = Math.max(0, entity.hp - dmg);
      if (entity.hp <= 0) {
        entity.alive = false;
        entity.hp = 0;
      }
      results.push({ type: effect.id, amount: dmg, target: entity.name });
    }
    effect.duration--;
    return effect.duration > 0;
  });
  return results;
}

export function canActWithStatus(entity) {
  for (const effect of entity.statusEffects) {
    const def = STATUS_EFFECTS[effect.id];
    if (!def) continue;
    if (def.skipTurn) return false;
    if (def.skipChance && Math.random() < def.skipChance) return false;
  }
  return entity.alive;
}

export function getSpeedModifier(entity) {
  let mult = 1;
  for (const effect of entity.statusEffects) {
    const def = STATUS_EFFECTS[effect.id];
    if (def && def.spdMult) mult *= def.spdMult;
  }
  return mult;
}

export function getMagicAllowed(entity) {
  return !entity.statusEffects.some(e => e.id === 'silence');
}

export function getDmgVulnerability(entity) {
  let mult = 1;
  for (const effect of entity.statusEffects) {
    const def = STATUS_EFFECTS[effect.id];
    if (def && def.dmgVulnerability) mult *= def.dmgVulnerability;
    // Shatter bonus if frozen
    if (def && def.shatterBonus) mult *= def.shatterBonus;
  }
  return mult;
}
