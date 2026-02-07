import type { ConfinedSpaceInput, ConfinedSpaceResult } from './types.js';

/**
 * Confined Space Atmospheric Assessment — OSHA 29 CFR 1910.146
 *
 * @formula Direct threshold comparison:
 *   - O₂: 19.5–23.5% safe, <19.5% deficient, >23.5% enriched
 *   - LEL: <10% safe, 10-25% caution, >25% danger
 *   - H₂S: <10 ppm safe, 10-20 caution, 20-100 danger, >100 IDLH
 *   - CO: <25 ppm safe, 25-50 caution, 50-1200 danger, >1200 IDLH
 *
 * @reference OSHA 29 CFR 1910.146 — Permit-required confined spaces
 * @reference NIOSH Pocket Guide to Chemical Hazards
 */
export function confinedSpace(input: ConfinedSpaceInput): ConfinedSpaceResult {
  const { oxygenPercent, lelPercent, h2sPpm, coPpm, customGas } = input;
  const warnings: string[] = [];

  // Oxygen assessment
  let oxygenStatus: ConfinedSpaceResult['oxygenStatus'];
  if (oxygenPercent >= 19.5 && oxygenPercent <= 23.5) {
    oxygenStatus = 'safe';
  } else if (oxygenPercent < 19.5) {
    oxygenStatus = 'deficient';
    warnings.push(`Oxygen deficient: ${oxygenPercent}% (minimum 19.5%)`);
  } else {
    oxygenStatus = 'enriched';
    warnings.push(`Oxygen enriched: ${oxygenPercent}% (maximum 23.5%)`);
  }

  // LEL assessment
  let lelStatus: ConfinedSpaceResult['lelStatus'];
  if (lelPercent < 10) {
    lelStatus = 'safe';
  } else if (lelPercent <= 25) {
    lelStatus = 'caution';
    warnings.push(`LEL elevated: ${lelPercent}% (action level 10%)`);
  } else {
    lelStatus = 'danger';
    warnings.push(`LEL dangerous: ${lelPercent}% (exceeds 25%)`);
  }

  // H₂S assessment
  let h2sStatus: ConfinedSpaceResult['h2sStatus'] = null;
  if (h2sPpm != null) {
    if (h2sPpm < 10) {
      h2sStatus = 'safe';
    } else if (h2sPpm <= 20) {
      h2sStatus = 'caution';
      warnings.push(`H₂S elevated: ${h2sPpm} ppm (PEL ceiling 20 ppm)`);
    } else if (h2sPpm <= 100) {
      h2sStatus = 'danger';
      warnings.push(`H₂S dangerous: ${h2sPpm} ppm (exceeds PEL)`);
    } else {
      h2sStatus = 'idlh';
      warnings.push(`H₂S IDLH: ${h2sPpm} ppm (IDLH = 100 ppm)`);
    }
  }

  // CO assessment
  let coStatus: ConfinedSpaceResult['coStatus'] = null;
  if (coPpm != null) {
    if (coPpm < 25) {
      coStatus = 'safe';
    } else if (coPpm <= 50) {
      coStatus = 'caution';
      warnings.push(`CO elevated: ${coPpm} ppm (PEL 50 ppm)`);
    } else if (coPpm <= 1200) {
      coStatus = 'danger';
      warnings.push(`CO dangerous: ${coPpm} ppm (exceeds PEL)`);
    } else {
      coStatus = 'idlh';
      warnings.push(`CO IDLH: ${coPpm} ppm (IDLH = 1200 ppm)`);
    }
  }

  // Custom gas assessment
  let customGasStatus: ConfinedSpaceResult['customGasStatus'] = null;
  if (customGas) {
    if (customGas.concentration >= customGas.idlh) {
      customGasStatus = 'idlh';
      warnings.push(`${customGas.name} IDLH: ${customGas.concentration} (IDLH = ${customGas.idlh})`);
    } else if (customGas.concentration >= customGas.pel) {
      customGasStatus = 'exceeds_pel';
      warnings.push(`${customGas.name} exceeds PEL: ${customGas.concentration} (PEL = ${customGas.pel})`);
    } else {
      customGasStatus = 'safe';
    }
  }

  // Overall status — worst case
  const statuses = [oxygenStatus, lelStatus, h2sStatus, coStatus, customGasStatus].filter(Boolean);
  let overallStatus: ConfinedSpaceResult['overallStatus'] = 'safe';
  if (statuses.includes('idlh')) overallStatus = 'idlh';
  else if (statuses.includes('danger') || oxygenStatus !== 'safe') overallStatus = 'danger';
  else if (statuses.includes('caution') || statuses.includes('exceeds_pel')) overallStatus = 'caution';

  const entryPermitted = overallStatus === 'safe';

  return {
    oxygenStatus,
    lelStatus,
    h2sStatus,
    coStatus,
    customGasStatus,
    overallStatus,
    entryPermitted,
    warnings,
  };
}
