/**
 * Assignment Problem Types (Hungarian Algorithm)
 */
export type AssignmentObjective = 'minimize' | 'maximize';

export interface AssignmentInput {
  matrix: number[][];
  rowLabels: string[];
  colLabels: string[];
  objective: AssignmentObjective;
}

export interface AssignmentPair {
  row: number;
  col: number;
  rowLabel: string;
  colLabel: string;
  cost: number;
}

export interface AssignmentResult {
  totalCost: number;
  assignments: AssignmentPair[];
  unassignedRows: string[];
  unassignedCols: string[];
}

/**
 * Unit Conversion Types
 */
export type UnitCategory = 'length' | 'weight' | 'volume' | 'temperature' | 'pressure' | 'area' | 'speed';

export interface UnitDef {
  id: string;
  labelKey: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

export interface UnitInput {
  category: UnitCategory;
  fromUnit: string;
  toUnit: string;
  value: number;
}

export interface ConversionEntry {
  unitId: string;
  value: number;
}

export interface UnitResult {
  toValue: number;
  allConversions: ConversionEntry[];
}
