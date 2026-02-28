// Elemental strength/weakness matrix
// strong = 1.5x, weak = 0.5x, neutral = 1.0x
export const ELEMENT_CHART = {
  fire:      { strong: ['nature','ice'],       weak: ['water','earth'] },
  water:     { strong: ['fire','earth'],        weak: ['lightning','nature'] },
  lightning: { strong: ['water','metal'],       weak: ['earth','wind'] },
  earth:     { strong: ['lightning','fire'],    weak: ['nature','water'] },
  nature:    { strong: ['water','earth'],       weak: ['fire','ice'] },
  ice:       { strong: ['wind','nature'],       weak: ['fire','metal'] },
  wind:      { strong: ['earth','lightning'],   weak: ['ice','metal'] },
  metal:     { strong: ['ice','wind'],          weak: ['lightning','fire'] },
  light:     { strong: ['dark'],               weak: [] },
  dark:      { strong: ['light'],              weak: [] },
  none:      { strong: [],                      weak: [] }
};

export const ELEMENT_STATUS = {
  fire:      { id:'burn',     duration:3, description:'Burning: 5% HP/turn' },
  water:     { id:'chill',    duration:3, description:'Chilled: -30% speed' },
  lightning: { id:'paralyze', duration:2, description:'Paralyzed: 25% skip turn' },
  earth:     { id:'petrify',  duration:1, description:'Petrified: skip turn' },
  nature:    { id:'poison',   duration:4, description:'Poisoned: 8% HP/turn' },
  ice:       { id:'freeze',   duration:1, description:'Frozen: skip turn, shatters' },
  wind:      { id:'silence',  duration:3, description:'Silenced: cannot cast magic' },
  metal:     { id:'bleed',    duration:5, description:'Bleeding: 3% HP/turn (stacks 3x)' },
  light:     null,
  dark:      null,
  none:      null
};

export function getElementMultiplier(attackElement, defenderElement) {
  if (!attackElement || attackElement === 'none') return 1.0;
  if (!defenderElement || defenderElement === 'none') return 1.0;
  const chart = ELEMENT_CHART[attackElement];
  if (!chart) return 1.0;
  if (chart.strong.includes(defenderElement)) return 1.5;
  if (chart.weak.includes(defenderElement)) return 0.5;
  return 1.0;
}

export function getStatusFromElement(element) {
  return ELEMENT_STATUS[element] || null;
}

export const ELEMENT_COLORS = {
  fire:      '#ff4400',
  water:     '#0088ff',
  lightning: '#ffff00',
  earth:     '#886633',
  nature:    '#44cc44',
  ice:       '#88ddff',
  wind:      '#aaddff',
  metal:     '#aaaaaa',
  light:     '#ffffcc',
  dark:      '#8844aa',
  none:      '#888888'
};
