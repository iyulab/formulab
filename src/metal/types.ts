/**
 * Metal Weight Types
 */
export type MetalShape = 'plate' | 'round' | 'pipe' | 'angle';

export interface MetalWeightInput {
  shape: MetalShape;
  length: number;           // mm
  materialName: string;     // density key (steel, aluminum, etc.)
  // Plate
  width?: number;           // mm
  thickness?: number;       // mm
  // Round
  diameter?: number;        // mm
  // Pipe
  outerDiameter?: number;   // mm
  innerDiameter?: number;   // mm
  // Angle
  height?: number;          // mm
}

export interface MetalWeightResult {
  weight: number;           // kg
  volume: number;           // cm3
  density: number;          // g/cm3
}

/**
 * Bending Types
 */
export type BendingMaterial = 'mildSteel' | 'stainless304' | 'aluminum5052' | 'aluminum6061' | 'custom';
export type ShapeType = 'lShape' | 'uShape';

export interface BendAllowanceInput {
  thickness: number;        // mm
  bendAngle: number;        // degrees (0-180)
  insideRadius: number;     // mm
  kFactor?: number;         // 0.3-0.5 (optional)
  material?: BendingMaterial;
}

export interface BendAllowanceResult {
  bendAllowance: number;    // mm
  bendDeduction: number;    // mm
  outsideSetback: number;   // mm
  kFactor: number;          // used or default
  recommendedVDie: number;  // mm (8 x thickness)
  minBendRadius: number;    // mm
  warnings: string[];
}

export interface FlatPatternInput {
  shapeType: ShapeType;
  thickness: number;        // mm
  bendAngle: number;        // degrees
  insideRadius: number;     // mm
  kFactor?: number;         // optional
  material?: BendingMaterial;
  flangeA: number;          // mm
  flangeB: number;          // mm
  flangeC?: number;         // mm (for U-shape)
}

export interface FlatPatternResult {
  flatLength: number;       // mm
  bendAllowance: number;    // mm
  bendDeduction: number;    // mm
  kFactor: number;
}

export interface KFactorReverseInput {
  thickness: number;        // mm
  bendAngle: number;        // degrees
  insideRadius: number;     // mm
  measuredFlatLength: number; // mm
  legA: number;             // mm
  legB: number;             // mm
}

export interface KFactorReverseResult {
  kFactor: number;
}

/**
 * Press Tonnage Types
 */
export type PressOperation = 'blanking' | 'bending' | 'drawing' | 'combined';
export type BendType = 'air' | 'bottoming' | 'coining';

export interface PressTonnageInput {
  operation: PressOperation;
  thickness: number;        // mm
  tensileStrength: number;  // MPa
  shearStrength: number;    // MPa
  safetyFactor?: number;    // 1.1-1.5, default 1.25
  // Blanking/Piercing
  cuttingPerimeter?: number; // mm
  // Bending
  bendLength?: number;      // mm
  dieOpening?: number;      // mm (V-die width)
  bendType?: BendType;
  // Drawing
  punchDiameter?: number;   // mm
  drawRatio?: number;       // 0.6-1.2
  // Combined (array of operations)
  operations?: PressOperation[];
}

export interface PressTonnageResult {
  blankingForce: number;    // kN
  bendingForce: number;     // kN
  drawingForce: number;     // kN
  totalForce: number;       // kN
  recommendedPress: number; // tons (with safety factor)
  breakdown: {
    operation: string;
    force: number;
  }[];
}

/**
 * Bearing Types
 */
export type BearingType = 'ball' | 'roller';

export interface BearingInput {
  bearingType: BearingType;
  dynamicLoadRating: number; // C, kN
  equivalentLoad: number;    // P, kN
  rpm: number;               // rotational speed
}

export interface BearingResult {
  l10: number;      // L10 life in million revolutions
  l10h: number;     // L10 life in hours
  lifeExponent: number; // p value (3 for ball, 10/3 for roller)
}

/**
 * Bolt Types
 */
export type BoltCalculationMode = 'torqueToPreload' | 'preloadToTorque';
export type LubricationCondition = 'dry' | 'oiled' | 'moly' | 'ptfe' | 'custom';

export interface BoltInput {
  mode: BoltCalculationMode;
  diameter: number;      // mm
  pitch: number;         // mm
  torque?: number;       // N-m (for torqueToPreload)
  preload?: number;      // kN (for preloadToTorque)
  kFactor: number;       // nut factor
  tensileStrength: number; // MPa
}

export interface BoltResult {
  torque: number;               // N-m
  preload: number;              // kN
  preloadN: number;             // N
  stressArea: number;           // mm^2
  tensileStress: number;        // MPa
  strengthUtilization: number;  // %
  kFactor: number;
  recommendedMaxPreload: number; // kN
}

/**
 * Cutting Types
 */
export type CuttingOperation = 'turning' | 'milling' | 'drilling';

export interface CuttingInput {
  operation: CuttingOperation;
  cuttingSpeed: number;     // m/min (Vc)
  toolDiameter: number;     // mm (D)
  feedPerTooth?: number;    // mm/tooth (fz) - for milling
  feedPerRev?: number;      // mm/rev (f) - for turning/drilling
  numberOfTeeth?: number;   // Z - for milling
  depthOfCut?: number;      // mm (ap)
  widthOfCut?: number;      // mm (ae) - for milling
}

export interface CuttingResult {
  rpm: number;
  feedRate: number;   // mm/min (Vf)
  mrr: number;        // cm3/min (material removal rate)
}

/**
 * Cutting Stock Types
 */
export type CuttingAlgorithm = 'ffd' | 'bfd';

export interface CuttingPiece {
  length: number;
  quantity: number;
  label?: string;
}

export interface CuttingStockInput {
  stockLength: number;
  kerf: number;          // default 3mm
  pieces: CuttingPiece[];
  algorithm: CuttingAlgorithm;
}

export interface CuttingPattern {
  pieces: { length: number; label: string }[];
  usedLength: number;
  waste: number;
  wastePercent: number;
}

export interface CuttingStockResult {
  stocksUsed: number;
  totalWaste: number;
  totalKerfLoss: number;
  wastePercent: number;
  utilizationPercent: number;
  patterns: CuttingPattern[];
}

/**
 * Gear Types
 */
export type GearCalculationMode = 'fromModule' | 'fromPitchDiameter';

export interface GearInput {
  mode: GearCalculationMode;
  module?: number;          // m, mm
  teethGear1?: number;      // z1
  teethGear2?: number;      // z2 (optional for pair)
  pitchDiameter?: number;   // d, mm
  numberOfTeeth?: number;   // z
}

export interface GearResult {
  module: number;           // m, mm
  pitchDiameter1: number;   // d1 = m x z1, mm
  pitchDiameter2?: number;  // d2 = m x z2, mm
  centerDistance?: number;  // a = (z1 + z2) x m / 2, mm
  addendum: number;         // ha = m, mm
  dedendum: number;         // hf = 1.25 x m, mm
  circularPitch: number;    // p = pi x m, mm
  baseCircleDiameter1: number; // db1, mm
}

/**
 * Hardness Types
 */
export type HardnessScale = 'HRC' | 'HB' | 'HV' | 'Shore';

export interface HardnessInput {
  fromScale: HardnessScale;
  value: number;
}

export interface HardnessResult {
  HRC: number;
  HB: number;
  HV: number;
  Shore: number;
}

/**
 * Material Types
 */
export type MaterialCategory = 'steel' | 'stainless' | 'aluminum' | 'copper' | 'titanium';

export interface MaterialInput {
  category: MaterialCategory;
  grade: string;
}

export interface MaterialResult {
  grade: string;
  category: string;
  density: number;          // g/cm3
  tensileStrength: number;  // MPa
  yieldStrength: number;    // MPa
  elongation: number;       // %
  hardness: string;         // e.g., "HB 200"
  thermalConductivity: number; // W/(m-K)
  meltingPoint: number;     // C
}

export interface MaterialSpec {
  density: number;
  tensileStrength: number;
  yieldStrength: number;
  elongation: number;
  hardness: string;
  thermalConductivity: number;
  meltingPoint: number;
}

/**
 * Press-Fit Types
 */
export interface PressFitInput {
  shaftDiameter: number;      // mm
  holeDiameter: number;       // mm
  hubOuterDiameter: number;   // mm
  contactLength: number;      // mm
  youngsModulus: number;      // GPa
  poissonRatio: number;
  frictionCoefficient: number;
}

export interface PressFitResult {
  interference: number;       // mm
  interfacePressure: number;  // MPa
  assemblyForce: number;      // N
  assemblyForceKN: number;    // kN
  holdingTorque: number;      // N-m
  axialHoldingForce: number;  // N
  hubHoopStress: number;      // MPa
  shaftRadialStress: number;  // MPa
}

/**
 * Roughness Types
 */
export type RoughnessScale = 'Ra' | 'Rz' | 'N';

export interface RoughnessInput {
  fromScale: RoughnessScale;
  value: number;
}

export interface RoughnessResult {
  ra: number;    // um
  rz: number;    // um
  nClass: number; // N1-N12
  rms: number;   // um (Rq)
}

/**
 * Screw Types
 */
export type PitchType = 'coarse' | 'fine';

export interface ScrewInput {
  designation: string;  // e.g., 'M10'
  pitchType: PitchType;
}

export interface ScrewResult {
  designation: string;
  nominalDiameter: number;
  pitch: number;
  minorDiameter: number;
  tapDrill: number;
  clearanceClose: number;
  clearanceFree: number;
}

export interface ScrewSpec {
  nominal: number;
  coarsePitch: number;
  finePitch: number;
  clearanceClose: number;
  clearanceFree: number;
}

/**
 * Spring Types
 */
export type SpringMaterial = 'musicWire' | 'stainless302' | 'phosphorBronze' | 'berylliumCopper';

export interface SpringInput {
  wireDiameter: number;     // d, mm
  meanCoilDiameter: number; // D, mm
  activeCoils: number;      // n
  force?: number;           // P, N (optional)
  material?: SpringMaterial;
}

export interface SpringResult {
  springRate: number;       // k, N/mm
  springIndex: number;      // C = D/d
  stressCorrectionFactor: number; // Ks (Wahl factor)
  shearStress?: number;     // tau, MPa (if force provided)
  shearModulus: number;     // G, MPa
}

/**
 * Tap Types
 */
export type ThreadStandard = 'metric' | 'unc' | 'unf';

export interface TapInput {
  standard: ThreadStandard;
  majorDiameter: number;    // mm
  pitch: number;            // mm (or TPI for unified)
  threadPercentage?: number; // default 75%
}

export interface TapResult {
  tapDrillSize: number;     // mm
  minorDiameter: number;    // mm
  pitchDiameter: number;    // mm
  threadPercentage: number; // %
  threadHeight: number;     // H, mm
}

/**
 * Thread Types
 */
export type ThreadType = 'metric' | 'unified';

export interface ThreadInput {
  type: ThreadType;
  size: string;
}

export interface ThreadResult {
  size: string;
  majorDiameter: number;
  pitch: number;       // mm (metric) or TPI (unified)
  tapDrill: number;    // mm
  minorDiameter: number;
  pitchDiameter: number;
}

export interface ThreadSpec {
  majorDiameter: number;
  pitch: number;
  tapDrill: number;
  minorDiameter: number;
  pitchDiameter: number;
}

/**
 * Tolerance Types
 */
export type FitType = 'hole' | 'shaft';

export interface ToleranceInput {
  nominalSize: number;      // mm
  fitType: FitType;
  deviationLetter: string;  // H, h, g, f, e, d, js, k, m, n, p etc.
  itGrade: number;          // 5-14
}

export interface ToleranceResult {
  designation: string;        // e.g., "50 H7"
  upperDeviation: number;     // um
  lowerDeviation: number;     // um
  maxSize: number;            // mm
  minSize: number;            // mm
  toleranceBand: number;      // um
}

/**
 * Vibration Types
 */
export type VibrationSystem = 'cantilever' | 'simplySupported' | 'shaftDisk' | 'springMass';
export type CrossSection = 'rectangular' | 'circular' | 'hollow';
export type VibrationMaterial = 'steel' | 'stainless' | 'aluminum' | 'copper' | 'titanium' | 'custom';

export interface VibrationInput {
  system: VibrationSystem;
  material: VibrationMaterial;
  length?: number;             // mm
  crossSection?: CrossSection;
  width?: number;              // mm (rectangular)
  height?: number;             // mm (rectangular)
  diameter?: number;           // mm (circular)
  outerDiameter?: number;      // mm (hollow)
  innerDiameter?: number;      // mm (hollow)
  diskMass?: number;           // kg
  diskRadius?: number;         // mm
  springConstant?: number;     // N/m
  mass?: number;               // kg
  youngsModulus?: number;      // GPa
  density?: number;            // kg/m3
  shearModulus?: number;       // GPa
}

export interface FrequencyMode {
  mode: number;
  frequency: number;         // Hz
  angularFrequency: number;  // rad/s
  period: number;            // seconds
}

export interface VibrationResult {
  frequencies: FrequencyMode[];
  momentOfInertia: number;     // mm4
  crossSectionalArea: number;  // mm2
  materialProps: {
    E: number;                 // GPa
    rho: number;               // kg/m3
    G?: number;                // GPa
  };
}

/**
 * Weld Heat Types
 */
export type WeldProcess = 'smaw' | 'gmaw' | 'gtaw' | 'saw';
export type WeldBaseMetal = 'mildSteel' | 'lowAlloySteel' | 'stainlessSteel' | 'castIron';
export type CrackingRisk = 'low' | 'moderate' | 'high' | 'veryHigh';

export interface WeldHeatInput {
  process: WeldProcess;
  voltage: number;             // V
  current: number;             // A
  travelSpeed: number;         // mm/min
  baseMetal: WeldBaseMetal;
  carbon?: number;
  manganese?: number;
  chromium?: number;
  molybdenum?: number;
  vanadium?: number;
  nickel?: number;
  copper?: number;
  silicon?: number;
  thickness: number;           // mm
}

export interface WeldHeatResult {
  heatInput: number;           // kJ/mm
  efficiency: number;          // 0-1
  carbonEquivalent: number;    // CE (IIW)
  preheatTemp: {
    min: number;               // C
    max: number;               // C
  };
  interpassTemp: {
    min: number;               // C
    max: number;               // C
  };
  hazHardnessMax: number;      // HV
  crackingRisk: CrackingRisk;
  recommendations: string[];
}

/**
 * Welding Types
 */
export type WeldingBaseMetal = 'mildSteel' | 'lowAlloySteel' | 'stainlessSteel' | 'castIron' | 'aluminum';
export type JointType = 'butt' | 'fillet' | 'lap' | 'tee';
export type WeldPosition = 'flat' | 'horizontal' | 'vertical' | 'overhead';

export interface WeldingInput {
  baseMetal: WeldingBaseMetal;
  jointType: JointType;
  position: WeldPosition;
  thickness: number;   // mm
}

export interface WeldingRod {
  designation: string;
  awsClass: string;
  characteristics: string;
}

export interface WeldingResult {
  recommendations: WeldingRod[];
  rodDiameter: number;         // mm
  currentRange: { min: number; max: number };  // Amps
  notes: string[];
}
