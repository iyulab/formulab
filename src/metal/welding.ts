import type { WeldingInput, WeldingResult, WeldingRod, WeldingBaseMetal } from './types.js';

// Electrode database by base metal
const ELECTRODES: Record<WeldingBaseMetal, WeldingRod[]> = {
  mildSteel: [
    { designation: 'E6010', awsClass: 'AWS A5.1', characteristics: 'Deep penetration, all positions, DC+' },
    { designation: 'E6013', awsClass: 'AWS A5.1', characteristics: 'Light penetration, AC/DC, easy arc start' },
    { designation: 'E7018', awsClass: 'AWS A5.1', characteristics: 'Low hydrogen, high strength, all positions' },
    { designation: 'E7024', awsClass: 'AWS A5.1', characteristics: 'High deposition, flat/horizontal only' },
  ],
  lowAlloySteel: [
    { designation: 'E7018-A1', awsClass: 'AWS A5.5', characteristics: 'Low hydrogen, 0.5% Mo, creep resistance' },
    { designation: 'E8018-B2', awsClass: 'AWS A5.5', characteristics: 'Low hydrogen, 1.25Cr-0.5Mo, high temperature' },
    { designation: 'E9018-B3', awsClass: 'AWS A5.5', characteristics: 'Low hydrogen, 2.25Cr-1Mo, high temp service' },
  ],
  stainlessSteel: [
    { designation: 'E308L-16', awsClass: 'AWS A5.4', characteristics: 'For 304/304L SS, low carbon, all positions' },
    { designation: 'E309L-16', awsClass: 'AWS A5.4', characteristics: 'Dissimilar metals, SS to carbon steel' },
    { designation: 'E316L-16', awsClass: 'AWS A5.4', characteristics: 'For 316/316L SS, Mo added, corrosion resistance' },
  ],
  castIron: [
    { designation: 'ENi-CI', awsClass: 'AWS A5.15', characteristics: '99% Ni core, machinable, cold welding' },
    { designation: 'ENiFe-CI', awsClass: 'AWS A5.15', characteristics: 'Ni-Fe core, stronger, large castings' },
    { designation: 'ESt', awsClass: 'AWS A5.15', characteristics: 'Steel core, economical, non-machinable' },
  ],
  aluminum: [
    { designation: 'E4043', awsClass: 'AWS A5.3', characteristics: '5% Si, general purpose, 6xxx series' },
    { designation: 'E5356', awsClass: 'AWS A5.3', characteristics: '5% Mg, higher strength, 5xxx series' },
  ],
};

// All-position electrodes
const ALL_POSITION = new Set(['E6010', 'E6013', 'E7018', 'E7018-A1', 'E8018-B2', 'E9018-B3', 'E308L-16', 'E309L-16', 'E316L-16', 'ENi-CI', 'ENiFe-CI', 'ESt', 'E4043', 'E5356']);

// Thickness to rod diameter mapping (mm)
function getRodDiameter(thickness: number): number {
  if (thickness <= 3) return 2.5;
  if (thickness <= 6) return 3.2;
  if (thickness <= 12) return 4.0;
  if (thickness <= 20) return 5.0;
  return 6.0;
}

/**
 * Recommend welding electrodes based on base metal and joint parameters.
 */
export function welding(input: WeldingInput): WeldingResult {
  const { baseMetal, position, thickness } = input;

  if (thickness <= 0) {
    return { recommendations: [], rodDiameter: 0, currentRange: { min: 0, max: 0 }, notes: [] };
  }

  const allRods = ELECTRODES[baseMetal] || [];

  // Filter by position
  const isAllPosition = position === 'flat' || position === 'horizontal';
  const recommendations = isAllPosition
    ? allRods
    : allRods.filter(r => ALL_POSITION.has(r.designation));

  const rodDiameter = getRodDiameter(thickness);

  // Current range: diameter x (25 to 45) A/mm
  const currentMin = Math.round(rodDiameter * 25);
  const currentMax = Math.round(rodDiameter * 45);

  const notes: string[] = [];
  if (baseMetal === 'aluminum') {
    notes.push('Preheat 150-200°C recommended for thick sections');
    notes.push('Use AC or DCEP polarity');
  }
  if (baseMetal === 'castIron') {
    notes.push('Preheat 200-300°C to prevent cracking');
    notes.push('Use short beads and peening technique');
  }
  if (baseMetal === 'stainlessSteel') {
    notes.push('Minimize heat input to prevent sensitization');
  }

  return {
    recommendations,
    rodDiameter,
    currentRange: { min: currentMin, max: currentMax },
    notes,
  };
}
