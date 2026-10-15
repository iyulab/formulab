import type { ConfinedSpaceInput, ConfinedSpaceResult } from './types.js';
import { requireFinite } from '../utils.js';
import { inputRangeError } from '../errors.js';
import { Notes } from '../diagnostics.js';

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
 *
 * @throws {RangeError} oxygenPercent outside 0–100, or any gas reading
 *   (lelPercent, h2sPpm, coPpm, customGas fields) is negative.
 * @remarks A reading of 0 is a valid (and possibly catastrophic) measurement,
 *   so zero values are accepted; only physically impossible values throw.
 */
export function confinedSpace(input: ConfinedSpaceInput): ConfinedSpaceResult {
  requireFinite('confinedSpace', input);
  const { oxygenPercent, lelPercent, h2sPpm, coPpm, customGas } = input;

  if (oxygenPercent < 0 || oxygenPercent > 100) {
    throw inputRangeError('oxygenPercent must be between 0 and 100', {
      code: 'parameter_out_of_range', parameter: 'oxygenPercent', min: 0, max: 100, got: oxygenPercent,
    });
  }
  if (lelPercent < 0) {
    throw inputRangeError('lelPercent must not be negative', {
      code: 'parameter_out_of_range', parameter: 'lelPercent', min: 0, got: lelPercent,
    });
  }
  if (h2sPpm != null && h2sPpm < 0) {
    throw inputRangeError('h2sPpm must not be negative', {
      code: 'parameter_out_of_range', parameter: 'h2sPpm', min: 0, got: h2sPpm,
    });
  }
  if (coPpm != null && coPpm < 0) {
    throw inputRangeError('coPpm must not be negative', {
      code: 'parameter_out_of_range', parameter: 'coPpm', min: 0, got: coPpm,
    });
  }
  if (customGas && (customGas.concentration < 0 || customGas.pel <= 0 || customGas.idlh <= 0)) {
    throw new RangeError('customGas concentration must not be negative and pel/idlh must be greater than 0');
  }

  const notes = new Notes();

  // Oxygen assessment
  let oxygenStatus: ConfinedSpaceResult['oxygenStatus'];
  if (oxygenPercent >= 19.5 && oxygenPercent <= 23.5) {
    oxygenStatus = 'safe';
  } else if (oxygenPercent < 19.5) {
    oxygenStatus = 'deficient';
    notes.add(`Oxygen deficient: ${oxygenPercent}% (minimum 19.5%)`, {
      code: 'oxygen_deficient', parameter: 'oxygenPercent', got: oxygenPercent, min: 19.5,
    });
  } else {
    oxygenStatus = 'enriched';
    notes.add(`Oxygen enriched: ${oxygenPercent}% (maximum 23.5%)`, {
      code: 'oxygen_enriched', parameter: 'oxygenPercent', got: oxygenPercent, max: 23.5,
    });
  }

  // LEL assessment
  let lelStatus: ConfinedSpaceResult['lelStatus'];
  if (lelPercent < 10) {
    lelStatus = 'safe';
  } else if (lelPercent <= 25) {
    lelStatus = 'caution';
    notes.add(`LEL elevated: ${lelPercent}% (action level 10%)`, {
      code: 'gas_elevated', parameter: 'lelPercent', got: lelPercent, max: 10,
    });
  } else {
    lelStatus = 'danger';
    notes.add(`LEL dangerous: ${lelPercent}% (exceeds 25%)`, {
      code: 'gas_above_limit', parameter: 'lelPercent', got: lelPercent, max: 25,
    });
  }

  // H₂S assessment
  let h2sStatus: ConfinedSpaceResult['h2sStatus'] = null;
  if (h2sPpm != null) {
    if (h2sPpm < 10) {
      h2sStatus = 'safe';
    } else if (h2sPpm <= 20) {
      h2sStatus = 'caution';
      notes.add(`H₂S elevated: ${h2sPpm} ppm (PEL ceiling 20 ppm)`, {
        code: 'gas_elevated', parameter: 'h2sPpm', got: h2sPpm, max: 10,
      });
    } else if (h2sPpm <= 100) {
      h2sStatus = 'danger';
      notes.add(`H₂S dangerous: ${h2sPpm} ppm (exceeds PEL)`, {
        code: 'gas_above_limit', parameter: 'h2sPpm', got: h2sPpm, max: 20,
      });
    } else {
      h2sStatus = 'idlh';
      notes.add(`H₂S IDLH: ${h2sPpm} ppm (IDLH = 100 ppm)`, {
        code: 'gas_idlh', parameter: 'h2sPpm', got: h2sPpm, max: 100,
      });
    }
  }

  // CO assessment
  let coStatus: ConfinedSpaceResult['coStatus'] = null;
  if (coPpm != null) {
    if (coPpm < 25) {
      coStatus = 'safe';
    } else if (coPpm <= 50) {
      coStatus = 'caution';
      notes.add(`CO elevated: ${coPpm} ppm (PEL 50 ppm)`, {
        code: 'gas_elevated', parameter: 'coPpm', got: coPpm, max: 25,
      });
    } else if (coPpm <= 1200) {
      coStatus = 'danger';
      notes.add(`CO dangerous: ${coPpm} ppm (exceeds PEL)`, {
        code: 'gas_above_limit', parameter: 'coPpm', got: coPpm, max: 50,
      });
    } else {
      coStatus = 'idlh';
      notes.add(`CO IDLH: ${coPpm} ppm (IDLH = 1200 ppm)`, {
        code: 'gas_idlh', parameter: 'coPpm', got: coPpm, max: 1200,
      });
    }
  }

  // Custom gas assessment
  let customGasStatus: ConfinedSpaceResult['customGasStatus'] = null;
  if (customGas) {
    if (customGas.concentration >= customGas.idlh) {
      customGasStatus = 'idlh';
      notes.add(`${customGas.name} IDLH: ${customGas.concentration} (IDLH = ${customGas.idlh})`, {
        code: 'gas_idlh', parameter: 'customGas', name: customGas.name, got: customGas.concentration, max: customGas.idlh,
      });
    } else if (customGas.concentration >= customGas.pel) {
      customGasStatus = 'exceeds_pel';
      notes.add(`${customGas.name} exceeds PEL: ${customGas.concentration} (PEL = ${customGas.pel})`, {
        code: 'gas_above_limit', parameter: 'customGas', name: customGas.name, got: customGas.concentration, max: customGas.pel,
      });
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
    warnings: notes.warnings,
    diagnostics: notes.diagnostics,
  };
}
