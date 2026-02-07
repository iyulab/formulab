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

/**
 * DIM Weight (Dimensional Weight) Types
 */
export type CarrierType = 'domestic_air' | 'international_air' | 'ground';

export interface DimWeightInput {
  length: number;      // cm
  width: number;       // cm
  height: number;      // cm
  actualWeight: number; // kg
  carrier: CarrierType;
}

export interface DimWeightResult {
  dimensionalWeight: number;   // kg
  actualWeight: number;        // kg
  billableWeight: number;      // kg
  dimFactor: number;           // DIM factor used
  isDimWeightHigher: boolean;  // true if dimensional > actual
}

/**
 * Fill Rate Types
 */
export type FillRateMode = 'order' | 'line';

export interface FillRateInput {
  mode: FillRateMode;
  totalOrders: number;           // Total orders or lines
  filledComplete: number;        // Orders/lines filled complete
}

export interface FillRateResult {
  fillRate: number;              // Fill rate percentage (0-100)
  shortfallRate: number;         // 1 - fill rate (percentage)
  filledComplete: number;        // Echo input
  shortfall: number;             // Orders/lines not filled complete
}

export interface ServiceLevelInput {
  demandStdDev: number;          // Standard deviation of demand during lead time
  safetyStock: number;           // Current safety stock level
}

export interface ServiceLevelResult {
  zScore: number;                // Z-score for the safety stock
  serviceLevel: number;          // Service level percentage (0-100)
  stockoutProbability: number;   // Probability of stockout (percentage)
}

/**
 * Freight Class Types
 */
export interface FreightClassInput {
  weight: number;      // lbs
  length: number;      // inches
  width: number;       // inches
  height: number;      // inches
}

export interface FreightClassResult {
  density: number;            // lbs per cubic foot
  freightClass: number;       // NMFC class (50-500)
  className: string;          // Descriptive name
  volumeCuFt: number;         // Volume in cubic feet
}

/**
 * Kanban Types
 */
export interface KanbanInput {
  dailyDemand: number;       // D: daily demand (units)
  leadTime: number;          // L: lead time (days)
  safetyFactor: number;      // S: safety factor (decimal, e.g., 0.1 for 10%)
  containerQuantity: number; // C: container/bin quantity (units per container)
}

export interface KanbanResult {
  numberOfKanbans: number;        // Number of kanban cards
  numberOfKanbansRounded: number; // Rounded up to nearest integer
  demandDuringLeadTime: number;   // D × L
  safetyStock: number;            // D × L × S
  totalRequirement: number;       // D × L × (1 + S)
}

/**
 * 3D Pallet Loading Types
 */
export type PalletStandard = 'eur' | 'us' | 'cn' | 'jp' | 'custom';

export type RotationConstraint = 'full' | 'layered' | 'fixed';

export interface BoxType3D {
  id: string;
  length: number;              // mm
  width: number;               // mm
  height: number;              // mm
  weight: number;              // kg
  quantity: number;
  canRotate: RotationConstraint;
  color?: string;              // hex color for visualization
}

export interface Pallet3DInput {
  palletStandard: PalletStandard;
  maxStackHeight: number;      // mm (default 1500)
  maxPayload: number;          // kg (default 1200)
  boxes: BoxType3D[];          // max 5 types
  customLength?: number;       // mm
  customWidth?: number;        // mm
}

export interface PlacedBox3D {
  boxTypeId: string;
  position: { x: number; y: number; z: number };
  dimensions: { l: number; w: number; h: number };
  rotationId: number;          // 0-5 for 6 possible rotations
  color: string;
  weight: number;
}

export interface Pallet3DResult {
  placed: PlacedBox3D[];
  unplaced: { boxTypeId: string; count: number }[];
  utilization: {
    volumePercent: number;
    weightPercent: number;
    floorPercent: number;
  };
  centerOfGravity: {
    x: number;
    y: number;
    z: number;
    isBalanced: boolean;
  };
  metrics: {
    totalWeight: number;       // kg
    totalBoxes: number;
    totalLayers: number;
    maxHeight: number;         // mm
    wastedVolume: number;      // mm³
  };
  palletDimensions: {
    length: number;
    width: number;
    height: number;
  };
  warnings: string[];
}

export interface PalletSpec {
  length: number;  // mm
  width: number;   // mm
  name: string;
}

/**
 * Pick Time Types
 */
export type PickMode = 'single' | 'batch';

export interface PickTimeInput {
  mode: PickMode;
  distance: number;           // meters or feet to travel
  speed: number;              // meters/min or feet/min walking speed
  itemsPerOrder: number;      // average items per order
  searchTimePerItem: number;  // seconds to search/locate each item
  pickTimePerItem: number;    // seconds to physically pick each item
  documentationTime: number;  // seconds for documentation per order
  batchSize?: number;         // orders per batch (only for batch mode)
}

export interface PickTimeResult {
  travelTime: number;         // seconds
  searchTime: number;         // seconds
  pickTime: number;           // seconds
  documentationTime: number;  // seconds
  totalTime: number;          // total seconds per order
  totalTimeMinutes: number;   // total minutes per order
  ordersPerHour: number;      // theoretical orders per hour
}

/**
 * Shipping Cost Types
 */
export type ShippingMode = 'ocean_fcl' | 'ocean_lcl' | 'air' | 'express' | 'truck';

export interface ShippingInput {
  mode: ShippingMode;
  weight: number;       // kg
  volume: number;       // m³ (CBM)
  distance?: number;    // km (for truck only)
}

export interface ShippingResult {
  mode: string;
  chargeableWeight: number;  // kg (max of actual vs volumetric)
  volumetricWeight: number;  // kg
  estimatedCost: number;     // USD
  costPerKg: number;         // USD/kg
  transitDays: string;       // range
  notes: string;
}

/**
 * TSP (Traveling Salesman Problem) Types
 */
export interface TspNode {
  x: number;
  y: number;
  label?: string;
}

export interface TspInput {
  nodes: TspNode[];
}

export interface TspResult {
  nnTour: number[];
  nnDistance: number;
  optimizedTour: number[];
  optimizedDistance: number;
  improvementPercent: number;
  optimalDistance?: number;
  optimalityGap?: number;
}

/**
 * Inventory Turnover Types
 */
export interface InventoryTurnoverInput {
  cogs: number;               // $ (cost of goods sold)
  averageInventory: number;   // $ (avg inventory value)
  periodDays?: number;        // default 365
  grossMargin?: number;       // $ (for GMROII)
}

export interface InventoryTurnoverResult {
  turnoverRatio: number;
  daysOfSupply: number;       // days
  weeksOfSupply: number;      // weeks
  gmroii: number | null;      // % (Gross Margin Return on Inventory Investment)
}

/**
 * Forklift Load Capacity Types
 */
export interface LoadCapacityInput {
  ratedCapacity: number;       // kg
  ratedLoadCenter: number;     // mm (typically 500 or 600)
  actualLoadCenter: number;    // mm
  actualLoad?: number;         // kg
  attachmentWeightLoss?: number; // kg (side-shift, clamp etc.)
}

export interface LoadCapacityResult {
  effectiveCapacity: number;    // kg
  loadCenterDerating: number;   // %
  netCapacity: number;          // kg (after attachment loss)
  utilization: number | null;   // % (if actualLoad)
  isOverloaded: boolean | null; // (if actualLoad)
  safetyMargin: number | null;  // kg (if actualLoad)
}

/**
 * ABC Inventory Analysis Types
 */
export interface AbcItem {
  sku: string;
  annualUsage: number;
  unitCost: number;
}

export interface AbcInput {
  items: AbcItem[];
  thresholdA?: number;        // default 80
  thresholdB?: number;        // default 95
}

export interface AbcClassification {
  sku: string;
  annualUsage: number;
  unitCost: number;
  annualValue: number;
  percentage: number;
  cumulative: number;
  rank: number;
  category: 'A' | 'B' | 'C';
}

export interface AbcResult {
  items: AbcClassification[];
  summary: {
    a: { count: number; skuPercentage: number; valuePercentage: number };
    b: { count: number; skuPercentage: number; valuePercentage: number };
    c: { count: number; skuPercentage: number; valuePercentage: number };
  };
  totalItems: number;
  totalValue: number;
}
