/**
 * Metal Weight Types
 */
export type MetalShape = 'plate' | 'round' | 'pipe' | 'angle';
export type MaterialName = 'steel' | 'stainless304' | 'aluminum' | 'copper' | 'brass' | 'titanium';

interface MetalWeightBase {
  length: number;           // mm
  materialName: MaterialName;
}

export type MetalWeightInput = MetalWeightBase & (
  | { shape: 'plate'; width: number; thickness: number }
  | { shape: 'round'; diameter: number }
  | { shape: 'pipe'; outerDiameter: number; innerDiameter: number }
  | { shape: 'angle'; width: number; height: number; thickness: number }
);

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

export interface SpringbackInput {
  thickness: number;        // mm (T)
  bendRadius: number;       // mm (R_i, inside radius of the tool)
  bendAngle: number;        // degrees (0 < angle < 180), the target angle after unloading
  material?: BendingMaterial;  // preset yield strength / Young's modulus (default mildSteel)
  yieldStrength?: number;   // MPa — required when material is 'custom'
  elasticModulus?: number;  // GPa — required when material is 'custom'
}

export interface SpringbackResult {
  springbackFactor: number; // Ks = R_i / R_f, 0 < Ks ≤ 1 on the model domain x < 0.5 (1 = no springback; may display as 0 at 4 dp very near the boundary)
  finalRadius: number;      // mm (R_f, radius after unloading)
  springbackAngle: number;  // degrees the bend opens up on unloading
  overbendAngle: number;    // degrees to bend to so the part lands on the target angle
  overbendExceeds180: boolean; // true when the required tool angle is ≥ 180° — the target angle is not reachable in a single bend (the model's honest prediction, disclosed rather than hidden)
  radiusBelow2T: boolean;   // true when R_i ≤ 2·T — below the model's stated validity (neutral axis no longer at mid-thickness); values are still computed but grow less accurate
  yieldStrength: number;    // MPa (used)
  elasticModulus: number;   // GPa (used)
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
  blankDiameter?: number;   // mm (for calculating draw ratio)
  drawRatio?: number;       // 0.6-1.2 (d/D ratio)
  frictionCoefficient?: number; // 0.05-0.15, default 0.1
  blankHolderPressure?: number; // MPa (2-5 MPa typical)
  dieRadius?: number;       // mm (die corner radius)
  reductionPercent?: number; // % reduction per draw (for multi-draw)
  // Combined (array of operations)
  operations?: PressOperation[];
}

export interface PressTonnageResult {
  blankingForce: number;    // kN
  bendingForce: number;     // kN
  drawingForce: number;     // kN
  blankHolderForce: number; // kN
  totalForce: number;       // kN
  recommendedPress: number; // tons (with safety factor)
  drawRatio: number;        // Actual d/D ratio used
  numberOfDraws: number;    // Estimated draws needed
  breakdown: {
    operation: string;
    force: number;
  }[];
  warnings: string[];
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

interface BoltBase {
  diameter: number;      // mm
  pitch: number;         // mm
  kFactor: number;       // nut factor
  tensileStrength: number; // MPa
}

export type BoltInput = BoltBase & (
  | { mode: 'torqueToPreload'; torque: number }
  | { mode: 'preloadToTorque'; preload: number }
);

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
  outOfTableRange: boolean; // true when the input fell outside the ASTM E140 table
                            // (e.g. HRC 20–68) and the result was clamped to the boundary
                            // row — the returned values are NOT equivalent to the input
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
  youngsModulus: number;    // GPa (E) — elastic modulus; needed by springback/deflection
  elongation: number;       // %
  hardness: string;         // e.g., "HB 200"
  thermalConductivity: number; // W/(m-K)
  meltingPoint: number;     // C
}

export interface MaterialSpec {
  density: number;
  tensileStrength: number;
  yieldStrength: number;
  youngsModulus: number;    // GPa
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
  poissonRatio: number;       // does NOT affect the result: for the same-material,
                              // solid-shaft model the nu terms cancel (see pressFit
                              // JSDoc). Retained for the material spec and the
                              // deferred dissimilar-material model.
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
  outOfTableRange: boolean; // true when the input fell outside the ISO 1302 table
                            // (Ra 0.025-50, Rz 0.1-200, N 1-12) and the result was snapped to
                            // the boundary grade — the returned values are NOT equivalent to
                            // the input (nearest-grade snapping WITHIN the table is by design
                            // and not flagged)
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

/**
 * Stable code for the preheat-temperature source, for i18n by consumers.
 * Maps 1:1 to the human-readable `preheatTemp.source` string.
 */
export type WeldPreheatSourceCode = 'awsTable' | 'awsJudgment' | 'engineeringJudgment';

/**
 * Stable codes for {@link WeldHeatResult.recommendationCodes}. Each maps to the
 * corresponding English sentence in `recommendations`, allowing consumers to
 * localise the advice while interpolating the supplied `params`.
 */
export type WeldRecommendationCode =
  | 'preheat'
  | 'fastCooling'
  | 'slowCooling'
  | 'increaseHeatInput'
  | 'highHeatInput'
  | 'lowHydrogenConsumables'
  | 'keepConsumablesDry'
  | 'pwht'
  | 'highHazHardness'
  | 'hazHardnessCapped'
  | 'stainlessInterpass'
  | 'stainlessFiller'
  | 'castIronNiFiller'
  | 'castIronPeen'
  | 'castIronButter';

/**
 * Machine-readable form of a single recommendation: a stable `code` plus the
 * interpolation `params` used in the matching English `recommendations` string.
 */
export interface WeldRecommendation {
  code: WeldRecommendationCode;
  params: Record<string, number | string>;
}

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
  carbonEquivalentPcm: number; // CE (Pcm) for low-alloy steels
  coolingTime_t85: number;     // seconds - time to cool from 800°C to 500°C
  coolingTimeClamped: boolean; // true when raw t8/5 fell outside the model range (0.5-300 s) and
                               // coolingTime_t85 is the boundary value, not the prediction
  coolingRate: number;         // °C/s - average cooling rate in critical range
  preheatTemp: {
    min: number;               // C
    max: number;               // C
    source: string;            // Reference standard used (human-readable, English)
    sourceCode: WeldPreheatSourceCode; // Stable code for i18n
  };
  interpassTemp: {
    min: number;               // C
    max: number;               // C
  };
  hazHardnessMax: number;      // HV
  hazHardnessClamped: boolean; // true when the Yurioka prediction fell outside the model range
                               // (150-700 HV) and hazHardnessMax is the boundary value — at the
                               // 700 ceiling treat it as a lower bound (stainless/cast iron hit this)
  crackingRisk: CrackingRisk;
  hydrogenLevel: 'low' | 'medium' | 'high'; // Required hydrogen control
  /** Human-readable English advice. */
  recommendations: string[];
  /** Machine-readable form of `recommendations`, parallel by index, for i18n. */
  recommendationCodes: WeldRecommendation[];
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

/**
 * Weld Strength Types
 *
 * Filler-metal electrode classification. The numeric part is the minimum tensile
 * strength of the deposited weld metal in ksi (E70 = 70 ksi). {@link weldStrength}
 * maps each to an SI value; see FEXX table in weldStrength.ts.
 */
export type WeldElectrodeClass = 'E60' | 'E70' | 'E80' | 'E90' | 'E100' | 'E110';

export interface WeldStrengthInput {
  legSize: number;              // mm — equal-leg fillet leg length
  weldLength: number;           // mm — total effective weld length
  weldCount?: number;           // number of welds sharing the load (default 1)
  electrode: WeldElectrodeClass;
  appliedLoad: number;          // N — applied shear load (0 = capacity-only query)
}

export interface WeldStrengthResult {
  throat: number;               // mm — effective throat, 0.707 x leg
  effectiveArea: number;        // mm^2 — throat x length x count
  allowableShearStress: number; // MPa — AISC ASD, 0.30 x FEXX
  allowableLoad: number;        // N — weld capacity, Fw x Aw
  actualStress: number;         // MPa — appliedLoad / Aw
  utilization: number;          // ratio — actualStress / Fw (>1 = overloaded)
  minRequiredLeg: number;       // mm — smallest equal leg that carries appliedLoad
  isSafe: boolean;              // utilization <= 1
}

/**
 * Column Buckling (Euler) Types
 *
 * Idealized end-restraint condition → effective-length factor K (AISC theoretical):
 * pinned-pinned 1.0, fixed-fixed 0.5, fixed-free 2.0, fixed-pinned 0.7.
 */
export type ColumnEndCondition = 'pinned-pinned' | 'fixed-fixed' | 'fixed-free' | 'fixed-pinned';

export interface ColumnBucklingInput {
  youngsModulus: number;   // MPa — elastic modulus E
  momentOfInertia: number; // mm^4 — least (weak-axis) second moment of area I
  area: number;            // mm^2 — cross-sectional area A
  length: number;          // mm — unbraced column length L
  endCondition: ColumnEndCondition;
  yieldStrength: number;   // MPa — yield strength sigma_y (sets the elastic/inelastic transition)
}

export interface ColumnBucklingResult {
  effectiveLengthFactor: number; // K from end condition
  effectiveLength: number;       // mm — K x L
  criticalLoad: number;          // N — Euler Pcr = pi^2 E I / (K L)^2
  criticalStress: number;        // MPa — sigma_cr = Pcr / A
  radiusOfGyration: number;      // mm — r = sqrt(I / A)
  slendernessRatio: number;      // KL / r
  transitionSlenderness: number; // Cc = pi x sqrt(2 E / sigma_y)
  yieldLoad: number;             // N — squash load A x sigma_y (reference)
  isElastic: boolean;            // slenderness >= Cc — Euler valid (false = short column, Euler over-predicts)
}

/**
 * Beam Deflection Types
 *
 * Support condition and load type for an elastic, prismatic (constant EI) beam.
 * The concentrated (point) load acts at the canonical maximum-deflection location for
 * each support — midspan for simple/fixed, the free end for cantilever — so that a
 * combined uniform+point case superposes at a single point (linear-elastic, exact).
 */
export type BeamSupportType = 'simple' | 'cantilever' | 'fixed';
export type BeamLoadType = 'uniform' | 'concentrated' | 'combined';

export interface BeamDeflectionInput {
  support: BeamSupportType;
  loadType: BeamLoadType;
  span: number;                 // mm — beam span/length L
  youngsModulus: number;        // MPa — elastic modulus E
  momentOfInertia: number;      // mm^4 — second moment of area I about the bending axis
  uniformLoad?: number;         // N/mm — distributed load w (uniform/combined)
  pointLoad?: number;           // N — concentrated load P at the canonical location (concentrated/combined)
  deflectionLimitRatio: number; // serviceability limit denominator, e.g. 360 → allowable = L/360
}

export interface BeamDeflectionResult {
  maxDeflection: number;         // mm — maximum deflection δ_max
  maxDeflectionLocation: number; // mm — distance from the left/fixed end where δ_max occurs
  allowableDeflection: number;   // mm — serviceability limit, span / deflectionLimitRatio
  deflectionRatio: number;       // δ_max / allowable (>1 = fails the serviceability limit)
  isSafe: boolean;               // δ_max <= allowable
}

/**
 * A single sampled point of the elastic deflected shape v(x), for visualizing the
 * bent beam. Same shape functions that produce {@link BeamDeflectionResult.maxDeflection}
 * (its max equals maxDeflection by construction) — no second physics.
 */
export interface BeamDeflectionCurvePoint {
  position: number;   // mm — x from the left/fixed end
  deflection: number; // mm — v(x), downward positive
}

/**
 * Material Grade Converter Types
 */
export type MaterialStandard = 'ASTM' | 'EN' | 'JIS' | 'GB' | 'KS';

export interface MaterialGradeConverterInput {
  standard: MaterialStandard;
  grade: string;
}

export interface MaterialGradeConverterResult {
  astm: string | null;
  en: string | null;
  jis: string | null;
  gb: string | null;
  ks: string | null;
  category: string;
  notes: string;
}

/**
 * Pipe Spec Types
 */
export type PipeStandard = 'ANSI' | 'DN';
export type PipeSchedule = 'SCH5' | 'SCH10' | 'SCH40' | 'SCH80' | 'SCH160' | 'XXS';

export interface PipeSpecInput {
  standard: PipeStandard;
  nominalSize: string;
  schedule: PipeSchedule;
}

export interface PipeSpecResult {
  nominalSize: string;
  outerDiameter: number;      // mm
  wallThickness: number;      // mm
  innerDiameter: number;      // mm
  weightPerMeter: number;     // kg/m (steel)
  crossSectionArea: number;   // mm²
  internalArea: number;       // mm²
}

/**
 * Flange Spec Types
 */
export type FlangeStandard = 'ASME_B16_5' | 'EN_1092_1';
export type PressureClass = '150' | '300' | '600' | '900' | '1500' | '2500';

export interface FlangeSpecInput {
  standard: FlangeStandard;
  pressureClass: PressureClass;
  nominalSize: string;
}

export interface FlangeSpecResult {
  nominalSize: string;
  pressureClass: string;
  outerDiameter: number;      // mm
  thickness: number;          // mm
  boltCircleDiameter: number; // mm
  boltHoles: number;
  boltSize: string;
  raisedFaceDiameter: number; // mm
  weight: number;             // kg (approx)
}
