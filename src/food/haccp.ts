import type { HaccpCategory, HaccpInput, HaccpResult, HaccpCheckItem } from './types.js';

const CHECKLIST_DATA: Record<HaccpCategory, HaccpCheckItem[]> = {
  receiving: [
    { id: 'RCV-01', checkpoint: 'Cold food temperature', standard: 'Below 5°C upon delivery', corrective: 'Reject shipment if above 5°C', critical: true },
    { id: 'RCV-02', checkpoint: 'Frozen food temperature', standard: 'Below -18°C upon delivery', corrective: 'Reject if above -18°C or signs of thawing', critical: true },
    { id: 'RCV-03', checkpoint: 'Packaging integrity', standard: 'No tears, dents, swelling, or leaks', corrective: 'Reject damaged packages', critical: false },
    { id: 'RCV-04', checkpoint: 'Supplier certification', standard: 'Valid HACCP/GMP certificate on file', corrective: 'Request updated certificate; hold product', critical: false },
    { id: 'RCV-05', checkpoint: 'Expiry date check', standard: 'Sufficient remaining shelf life per policy', corrective: 'Reject short-dated or expired products', critical: true },
  ],
  storage: [
    { id: 'STR-01', checkpoint: 'FIFO rotation', standard: 'First In, First Out; oldest stock used first', corrective: 'Re-organize stock; discard expired items', critical: false },
    { id: 'STR-02', checkpoint: 'Temperature monitoring', standard: 'Refrigerator 0–5°C, Freezer below -18°C', corrective: 'Adjust equipment; relocate food if unsafe', critical: true },
    { id: 'STR-03', checkpoint: 'Cross-contamination separation', standard: 'Raw and cooked stored separately; raw below cooked', corrective: 'Rearrange storage; discard contaminated items', critical: true },
    { id: 'STR-04', checkpoint: 'Pest control', standard: 'No signs of pest activity; traps inspected weekly', corrective: 'Contact pest control; deep clean area', critical: false },
    { id: 'STR-05', checkpoint: 'Cleaning schedule', standard: 'Storage areas cleaned per documented schedule', corrective: 'Perform immediate cleaning; update log', critical: false },
  ],
  preparation: [
    { id: 'PRP-01', checkpoint: 'Hand washing', standard: 'Wash hands 20 sec with soap before handling food', corrective: 'Re-wash hands; retrain staff', critical: true },
    { id: 'PRP-02', checkpoint: 'Surface sanitization', standard: 'Sanitize surfaces with approved solution before use', corrective: 'Stop preparation; sanitize and re-clean', critical: true },
    { id: 'PRP-03', checkpoint: 'Thawing procedure', standard: 'Thaw in refrigerator (below 5°C), not at room temp', corrective: 'Discard improperly thawed food', critical: true },
    { id: 'PRP-04', checkpoint: 'Cross-contamination prevention', standard: 'Separate cutting boards/utensils for raw and cooked', corrective: 'Replace contaminated utensils; re-sanitize', critical: true },
  ],
  cooking: [
    { id: 'CK-01', checkpoint: 'Poultry internal temperature', standard: 'Minimum 74°C internal temperature', corrective: 'Continue cooking until 74°C reached', critical: true },
    { id: 'CK-02', checkpoint: 'Ground meat internal temperature', standard: 'Minimum 71°C internal temperature', corrective: 'Continue cooking until 71°C reached', critical: true },
    { id: 'CK-03', checkpoint: 'Fish internal temperature', standard: 'Minimum 63°C internal temperature', corrective: 'Continue cooking until 63°C reached', critical: true },
    { id: 'CK-04', checkpoint: 'Reheating temperature', standard: 'Minimum 74°C within 2 hours', corrective: 'Discard if 74°C not reached within 2 hours', critical: true },
    { id: 'CK-05', checkpoint: 'Time monitoring', standard: 'Record cooking start/end times per batch', corrective: 'Verify temperature; extend cooking if needed', critical: false },
  ],
  cooling: [
    { id: 'CL-01', checkpoint: '2-stage cooling: Stage 1', standard: '60°C to 21°C within 2 hours', corrective: 'Discard if not cooled to 21°C in 2 hours', critical: true },
    { id: 'CL-02', checkpoint: '2-stage cooling: Stage 2', standard: '21°C to 5°C within 4 hours', corrective: 'Discard if not cooled to 5°C in 4 hours', critical: true },
    { id: 'CL-03', checkpoint: 'Container size', standard: 'Use shallow containers (depth ≤7.5 cm) for rapid cooling', corrective: 'Transfer to smaller containers immediately', critical: false },
    { id: 'CL-04', checkpoint: 'Labeling', standard: 'Label with product name, date, and use-by date', corrective: 'Label immediately; discard unlabeled items after 24h', critical: false },
  ],
  serving: [
    { id: 'SRV-01', checkpoint: 'Hot holding temperature', standard: 'Maintain above 60°C', corrective: 'Reheat to 74°C or discard', critical: true },
    { id: 'SRV-02', checkpoint: 'Cold holding temperature', standard: 'Maintain below 5°C', corrective: 'Discard if above 5°C for more than 30 minutes', critical: true },
    { id: 'SRV-03', checkpoint: '4-hour rule', standard: 'Discard food held in danger zone (5–60°C) over 4 hours', corrective: 'Discard food immediately', critical: true },
    { id: 'SRV-04', checkpoint: 'Utensil separation', standard: 'Separate serving utensils for each dish', corrective: 'Replace cross-used utensils; sanitize', critical: false },
    { id: 'SRV-05', checkpoint: 'Display temperature monitoring', standard: 'Check and log display temps every 30 minutes', corrective: 'Adjust display unit; remove food if unsafe', critical: true },
  ],
};

const ALL_CATEGORIES: HaccpCategory[] = ['receiving', 'storage', 'preparation', 'cooking', 'cooling', 'serving'];

/**
 * Get all HACCP categories in process order
 *
 * @returns Array of HACCP category identifiers
 */
export function getCategories(): HaccpCategory[] {
  return ALL_CATEGORIES;
}

/**
 * Get HACCP checklist for a specific category
 *
 * Returns checklist items with checkpoints, standards, corrective actions,
 * and critical control point indicators.
 *
 * @param input - HACCP input with category selection
 * @returns HACCP result with checklist items, or null for invalid category
 */
export function haccp(input: HaccpInput): HaccpResult | null {
  const items = CHECKLIST_DATA[input.category];
  if (!items) return null;

  return {
    category: input.category,
    items,
  };
}
