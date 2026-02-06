/**
 * True Position (GD&T) Types
 */
export interface TruePositionInput {
  actualX: number;           // mm — measured X coordinate
  actualY: number;           // mm — measured Y coordinate
  nominalX: number;          // mm — nominal X coordinate
  nominalY: number;          // mm — nominal Y coordinate
  tolerance?: number;        // mm — diametral tolerance zone
  featureSize?: number;      // mm — actual feature size (for MMC bonus)
  mmcSize?: number;          // mm — MMC size (for bonus tolerance)
}

export interface TruePositionResult {
  truePosition: number;      // mm — diametral TP = 2×√(Δx²+Δy²)
  deviationX: number;        // mm
  deviationY: number;        // mm
  radialDeviation: number;   // mm — √(Δx²+Δy²)
  inTolerance?: boolean;     // if tolerance provided
  mmcBonus?: number;         // mm — bonus tolerance
  effectiveTolerance?: number; // mm — tolerance + bonus
}

/**
 * Bolt Circle Types
 */
export interface BoltCircleInput {
  boltCircleDiameter: number; // mm — bolt circle diameter (BCD)
  numberOfHoles: number;      // integer ≥ 2
  startAngle?: number;        // degrees — angle of first hole from +X axis (default 0)
}

export interface BoltHole {
  holeNumber: number;
  angle: number;              // degrees
  x: number;                  // mm
  y: number;                  // mm
}

export interface BoltCircleResult {
  radius: number;             // mm — bolt circle radius
  holes: BoltHole[];
  angularSpacing: number;     // degrees between holes
}

/**
 * Sine Bar Height Types
 */
export interface SineBarHeightInput {
  angle: number;              // degrees — desired angle
  sineBarLength: number;      // mm — sine bar center distance (e.g., 100, 125, 200, 250)
  roundToBlock?: number;      // mm — gauge block rounding increment (e.g., 0.001)
}

export interface SineBarHeightResult {
  height: number;             // mm — exact gauge height = L×sin(θ)
  roundedHeight?: number;     // mm — rounded to nearest block
  actualAngle?: number;       // degrees — arcsin(roundedHeight/L)
  angleError?: number;        // degrees — actualAngle - desired angle
}

/**
 * Radial Chip Thinning Types
 */
export interface RadialChipThinningInput {
  toolDiameter: number;       // mm (D)
  radialDepthOfCut: number;   // mm (ae) — must be < D/2 for thinning effect
  chipLoadTarget: number;     // mm/tooth (fz) — desired effective chip load
}

export interface RadialChipThinningResult {
  adjustedFeedPerTooth: number; // mm/tooth — compensated fz
  chipThinningFactor: number;   // ratio (>1 when ae < D/2)
  effectiveChipLoad: number;    // mm/tooth — verification of target
}

/**
 * Tool Deflection Types
 */
export type ToolMaterial = 'carbide' | 'hss';

export interface ToolDeflectionInput {
  toolDiameter: number;       // mm (d)
  stickout: number;           // mm (L) — unsupported length
  cuttingForce: number;       // N (F)
  material?: ToolMaterial;    // default 'carbide'
  youngsModulus?: number;     // GPa — custom override
}

export interface ToolDeflectionResult {
  deflection: number;         // mm (δ)
  momentOfInertia: number;    // mm⁴ (I)
  stiffness: number;          // N/mm (k = F/δ)
  youngsModulus: number;      // GPa (E used)
}

/**
 * Cusp Height Types
 */
export interface CuspHeightInput {
  toolRadius: number;         // mm (r) — ball end mill radius
  stepover: number;           // mm — distance between adjacent passes
}

export interface CuspHeightResult {
  cuspHeight: number;         // mm (h) — scallop height
  surfaceRoughness: number;   // μm Ra (approximate)
}

/**
 * Effective Diameter Types (Ball End Mill)
 */
export interface EffectiveDiameterInput {
  toolDiameter: number;       // mm (D) — ball end mill diameter
  axialDepthOfCut: number;    // mm (ap)
}

export interface EffectiveDiameterResult {
  effectiveDiameter: number;  // mm (Deff)
  effectiveRpm: number;       // RPM — optional: if cuttingSpeed provided
}

/**
 * Boring Bar Deflection Types
 */
export type BoringBarMaterial = 'carbide' | 'steel' | 'heavyMetal';

export interface BoringBarDeflectionInput {
  barDiameter: number;        // mm (d)
  overhang: number;           // mm (L) — unsupported length
  cuttingForce: number;       // N (F)
  material?: BoringBarMaterial; // default 'steel'
  youngsModulus?: number;     // GPa — custom override
}

export interface BoringBarDeflectionResult {
  deflection: number;         // mm (δ)
  momentOfInertia: number;    // mm⁴ (I)
  stiffness: number;          // N/mm
  ldRatio: number;            // L/D ratio — ideally < 4
  youngsModulus: number;      // GPa (E used)
  recommendation: string;     // guidance based on L/D
}

/**
 * Thread Over Wires (3-Wire Method) Types
 */
export type ThreadAngle = 60 | 55 | 29 | 30;

export interface ThreadOverWiresInput {
  majorDiameter: number;      // mm (d)
  pitch: number;              // mm (P)
  threadAngle?: ThreadAngle;  // degrees — default 60 (metric/unified)
  wireSize?: number;          // mm (W) — custom wire diameter; if omitted, best wire used
}

export interface ThreadOverWiresResult {
  measurementOverWires: number;  // mm (M)
  bestWireSize: number;          // mm — P / (cos(α/2)) for 60° = P/√3 ≈ 0.57735P
  pitchDiameter: number;        // mm (d₂ = d - 0.6495P for 60°)
  wireSize: number;             // mm — actual wire size used
}

/**
 * Gauge Block Stack Types
 */
export interface GaugeBlockStackInput {
  targetDimension: number;    // mm — target dimension to build
  availableSet?: 'metric47' | 'metric88' | 'inch81'; // default 'metric47'
}

export interface GaugeBlockStackResult {
  targetDimension: number;    // mm
  blocks: number[];           // mm — selected blocks in assembly order
  totalDimension: number;     // mm — sum of selected blocks
  error: number;              // mm — |total - target|
  blockCount: number;         // number of blocks used
}

/**
 * Triangle Solver Types
 */
export interface TriangleSolverInput {
  a?: number;                 // side a (opposite angle A)
  b?: number;                 // side b (opposite angle B)
  c?: number;                 // side c (opposite angle C)
  A?: number;                 // angle A in degrees
  B?: number;                 // angle B in degrees
  C?: number;                 // angle C in degrees
}

export interface TriangleSolverResult {
  a: number;                  // side a
  b: number;                  // side b
  c: number;                  // side c
  A: number;                  // angle A (degrees)
  B: number;                  // angle B (degrees)
  C: number;                  // angle C (degrees)
  area: number;               // area (Heron's formula or 0.5ab sinC)
  perimeter: number;
}

/**
 * Cycle Time Estimator Types
 */
export interface CycleTimeOperation {
  type: 'cutting' | 'rapid' | 'toolChange' | 'dwell';
  distance?: number;          // mm — travel distance (for cutting/rapid)
  feedRate?: number;          // mm/min — feed rate (for cutting)
  rapidRate?: number;         // mm/min — rapid traverse rate (for rapid, default 10000)
  time?: number;              // seconds — fixed time (for toolChange/dwell)
}

export interface CycleTimeEstimatorInput {
  operations: CycleTimeOperation[];
  setupTime?: number;         // seconds — one-time setup
  partCount?: number;         // number of parts (default 1)
}

export interface CycleTimeEstimatorResult {
  cuttingTime: number;        // seconds
  rapidTime: number;          // seconds
  toolChangeTime: number;     // seconds
  dwellTime: number;          // seconds
  cycleTime: number;          // seconds — per part
  totalTime: number;          // seconds — setup + cycleTime × partCount
  utilization: number;        // % — cuttingTime / cycleTime × 100
}
