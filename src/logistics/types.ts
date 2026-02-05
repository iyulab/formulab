/**
 * Logistics Domain Types
 */

/**
 * CBM (Cubic Meter) Calculation Types
 */
export type CbmLengthUnit = 'mm' | 'cm' | 'm';

export interface CbmInput {
  length: number;
  width: number;
  height: number;
  quantity: number;
  unit: CbmLengthUnit;
}

export interface CbmResult {
  cbmPerUnit: number;  // m³
  totalCbm: number;    // m³
}

/**
 * Container Fit Calculation Types
 */
export interface ContainerDimensions {
  length: number;  // mm
  width: number;   // mm
  height: number;  // mm
}

export interface CargoDimensions {
  length: number;  // mm
  width: number;   // mm
  height: number;  // mm
  weight: number;  // kg
}

export interface ContainerFitInput {
  container: ContainerDimensions;
  cargo: CargoDimensions;
  allowRotation: boolean;
}

export interface BoxOrientation {
  length: number;
  width: number;
  height: number;
}

export interface ContainerFitResult {
  unitsPerLayer: number;
  layers: number;
  totalUnits: number;
  bestOrientation: BoxOrientation;
}

/**
 * EOQ (Economic Order Quantity) Types
 */
export interface EoqInput {
  annualDemand: number;   // units/year
  orderCost: number;      // $/order
  holdingCost: number;    // $/unit/year
}

export interface EoqResult {
  eoq: number;               // units
  ordersPerYear: number;
  orderCycleDays: number;    // days
  annualOrderingCost: number;  // $
  annualHoldingCost: number;   // $
  totalAnnualCost: number;     // $
}

/**
 * Pallet Stack Calculation Types
 */
export interface PalletDimensions {
  length: number;  // mm
  width: number;   // mm
}

export interface BoxDimensions {
  length: number;  // mm
  width: number;   // mm
  height: number;  // mm
}

export interface PalletStackInput {
  pallet: PalletDimensions;
  box: BoxDimensions;
  maxHeight: number;      // mm
  allowRotation: boolean;
}

export interface PalletStackResult {
  boxesPerLayer: number;
  layers: number;
  totalBoxes: number;
  bestOrientation: BoxOrientation;
}

/**
 * Safety Stock Calculation Types
 */
export interface SafetyStockInput {
  avgDemand: number;       // units/day
  demandStdDev: number;    // units/day
  avgLeadTime: number;     // days
  leadTimeStdDev: number;  // days
  serviceLevel: number;    // 0-1
}

export interface SafetyStockResult {
  zScore: number;
  safetyStock: number;        // units
  reorderPoint: number;       // units
  demandDuringLeadTime: number; // units
}
