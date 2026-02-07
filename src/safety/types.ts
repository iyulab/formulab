// Fall Clearance Types
export interface FallClearanceInput {
  lanyardLength: number;       // m - length of lanyard/SRL
  decelerationDistance: number; // m - deceleration device activation distance
  harnessStretch: number;      // m - harness/body stretch under load
  workerHeight: number;        // m - D-ring to feet distance (~1.5m typical)
  safetyFactor: number;        // m - additional safety buffer (ANSI recommends 0.9m)
  anchorHeight: number;        // m - anchor point height above feet level
  rescueClearance?: number;    // m - clearance for rescue operations (default 0.9m per ANSI Z359.4)
  obstacleHeight?: number;     // m - height of lowest obstacle/ground level (default 0)
}

export interface FallClearanceResult {
  totalFallDistance: number;   // m - total vertical distance of fall
  minimumHeight: number;       // m - minimum required anchor height
  rescueClearance: number;     // m - rescue operation clearance used
  freeSpaceRequired: number;   // m - total space needed below anchor
  clearanceAboveObstacle: number; // m - space between worker and obstacle (positive = safe)
  isAdequate: boolean | null;
  warnings: string[];
}

// NIOSH Lifting Types
export type CouplingQuality = 'good' | 'fair' | 'poor';
export type WorkDuration = 'short' | 'medium' | 'long';

export interface NioshInput {
  horizontalDistance: number;  // cm
  verticalDistance: number;    // cm
  verticalTravel: number;      // cm
  asymmetryAngle: number;      // degrees
  frequency: number;           // lifts per minute
  duration: WorkDuration;
  coupling: CouplingQuality;
  loadWeight: number;          // kg
}

export interface NioshResult {
  rwl: number;
  liftingIndex: number;
  hm: number;
  vm: number;
  dm: number;
  am: number;
  fm: number;
  cm: number;
  riskLevel: 'low' | 'moderate' | 'high';
}

// Noise Exposure Types
export interface NoiseExposure {
  soundLevel: number;  // dB(A)
  duration: number;    // hours
}

export interface NoiseExposureInput {
  exposures: NoiseExposure[];
}

export interface NoiseExposureResult {
  dose: number;
  twa: number;
  status: 'compliant' | 'actionRequired' | 'exceeds';
}

// WBGT Types
export type WorkloadIntensity = 'light' | 'moderate' | 'heavy' | 'veryHeavy';

export interface WbgtInput {
  dryBulbTemp: number;     // C
  wetBulbTemp: number;     // C
  globeTemp: number;       // C
  isOutdoor: boolean;
  workload: WorkloadIntensity;
  isAcclimatized: boolean;
}

export interface WbgtResult {
  wbgt: number;
  threshold: number;
  status: 'safe' | 'caution' | 'danger';
}

// HAVS (Hand-Arm Vibration Syndrome) Types
export interface ToolExposure {
  vibrationMagnitude: number;  // m/s² (a_hv - vibration total value)
  exposureTime: number;        // hours per day
}

export interface HavsInput {
  tools: ToolExposure[];       // Array of tool exposures
}

export interface HavsResult {
  a8: number;                  // Daily exposure A(8) in m/s²
  partialExposures: number[];  // Partial A(8) for each tool
  percentEAV: number;          // Percentage of EAV (2.5 m/s²)
  percentELV: number;          // Percentage of ELV (5 m/s²)
  exposurePoints: number;      // Exposure points (100 = EAV)
  status: 'safe' | 'action' | 'limit';
  maxDailyExposure: number;    // Maximum safe exposure time at current level (hours)
}

// Ventilation Rate Types (OSHA/ACGIH/ASHRAE)
export type VentilationActivityLevel = 'sedentary' | 'light' | 'moderate' | 'heavy';
export type SpaceType = 'office' | 'classroom' | 'retail' | 'restaurant' | 'industrial' | 'warehouse' | 'gym' | 'custom';

export interface VentilationRateInput {
  roomLength: number;       // m
  roomWidth: number;        // m
  roomHeight: number;       // m
  occupants: number;        // number of people
  activityLevel: VentilationActivityLevel;
  spaceType: SpaceType;
  customAch?: number;       // custom ACH for 'custom' space type
}

export interface VentilationRateResult {
  roomVolume: number;       // m³
  requiredAch: number;      // air changes per hour
  cfm: number;              // cubic feet per minute
  m3PerHour: number;        // m³/h
  litersPerSecond: number;  // L/s
  cfmPerPerson: number;     // CFM per occupant
}

// Respirator MUC Types
export type RespiratorType =
  | 'filtering-facepiece'      // APF = 10 (N95, P100)
  | 'half-mask'                // APF = 10 (elastomeric half-mask)
  | 'full-facepiece'           // APF = 50 (full-face APR)
  | 'powered-half-mask'        // APF = 50 (PAPR with half-mask)
  | 'powered-hood'             // APF = 25 (PAPR with hood/helmet)
  | 'powered-full-facepiece'   // APF = 1000 (PAPR with full facepiece)
  | 'supplied-air-half'        // APF = 10 (SAR half-mask, demand mode)
  | 'supplied-air-full'        // APF = 50 (SAR full-face, demand mode)
  | 'supplied-air-full-pd'     // APF = 1000 (SAR full-face, pressure-demand)
  | 'scba-pd';                 // APF = 10000 (SCBA pressure-demand)

export interface RespiratorInput {
  concentration: number;       // Workplace concentration (ppm or mg/m³)
  oel: number;                 // Occupational Exposure Limit (same units)
  respiratorType: RespiratorType;
}

export interface RespiratorResult {
  muc: number;                 // Maximum Use Concentration (same units as input)
  apf: number;                 // Assigned Protection Factor
  hazardRatio: number;         // Concentration / OEL
  requiredAPF: number;         // Minimum APF needed for protection
  protectionAdequate: boolean; // Is selected respirator adequate?
  safetyMargin: number;        // How much APF exceeds requirement (ratio)
}

/**
 * Ladder Angle Calculator Types (OSHA 4:1 rule)
 */
export interface LadderAngleInput {
  ladderLength: number;     // m
  height?: number;          // m (wall contact height)
  baseDistance?: number;     // m (base from wall)
}

export interface LadderAngleResult {
  angle: number;              // degrees
  height: number;             // m
  baseDistance: number;        // m
  ladderLength: number;       // m
  idealBaseDistance: number;   // m (for 75.5° at given height)
  reachHeight: number;        // m (height + ~1m)
  isCompliant: boolean;       // 70°–80°
  warnings: string[];
}

/**
 * Illuminance Calculator Types (Lumen Method)
 */
export interface IlluminanceInput {
  roomLength: number;           // m
  roomWidth: number;            // m
  luminaireHeight: number;      // m (from floor)
  workplaneHeight?: number;     // m, default 0.85
  targetLux: number;            // lux
  lumensPerLuminaire: number;   // lm
  wattsPerLuminaire?: number;   // W (for power density)
  cu?: number;                  // 0-1, coefficient of utilization
  mf?: number;                  // 0-1, maintenance factor, default 0.8
}

export interface IlluminanceResult {
  fixturesNeeded: number;       // count (rounded up)
  actualLux: number;            // lux (with rounded fixture count)
  roomIndex: number;
  totalLumens: number;          // lm
  powerDensity: number | null;  // W/m²
  recommendedSpacing: number;   // m (max spacing = 1.5 × Hm)
}

/**
 * Thermal Comfort (PMV/PPD) Types — ISO 7730
 */
export interface ThermalComfortInput {
  airTemp: number;            // °C
  radiantTemp: number;        // °C
  airVelocity: number;       // m/s
  relativeHumidity: number;  // %
  metabolicRate: number;      // met (1 met = 58.15 W/m²)
  clothingInsulation: number; // clo (1 clo = 0.155 m²·K/W)
}

export interface ThermalComfortResult {
  pmv: number;                // -3 to +3
  ppd: number;                // %
  category: 'A' | 'B' | 'C' | 'outside';
  sensation: 'cold' | 'cool' | 'slightly_cool' | 'neutral' | 'slightly_warm' | 'warm' | 'hot';
}

/**
 * REBA (Rapid Entire Body Assessment) Types
 */
export interface RebaInput {
  trunkAngle: number;         // degrees from neutral
  trunkTwisted: boolean;
  trunkSideBent: boolean;
  neckAngle: number;          // degrees
  neckTwisted: boolean;
  neckSideBent: boolean;
  legSupport: 'bilateral' | 'unilateral';
  kneeFlexion: number;        // degrees
  upperArmAngle: number;      // degrees
  shoulderRaised: boolean;
  armAbducted: boolean;
  armSupported: boolean;
  lowerArmAngle: number;      // degrees
  wristAngle: number;         // degrees
  wristTwisted: boolean;
  load: number;               // kg
  shockForce: boolean;
  staticPosture: boolean;
  repeatedSmallRange: boolean;
  rapidLargeChange: boolean;
}

export interface RebaResult {
  trunkScore: number;
  neckScore: number;
  legScore: number;
  upperArmScore: number;
  lowerArmScore: number;
  wristScore: number;
  scoreA: number;
  scoreB: number;
  scoreC: number;
  rebaScore: number;
  riskLevel: 'negligible' | 'low' | 'medium' | 'high' | 'very_high';
  actionLevel: number;        // 0-4
}

/**
 * Arc Flash Types — IEEE 1584 / NFPA 70E
 */
export interface ArcFlashInput {
  voltage: number;            // V (208-15000)
  boltedFaultCurrent: number; // kA
  workingDistance: number;     // mm
  faultClearingTime: number;  // seconds
  gapBetweenConductors: number; // mm
  enclosureType: 'open' | 'box' | 'mcc' | 'panel' | 'cable';
}

export interface ArcFlashResult {
  arcCurrent: number;         // kA
  incidentEnergy: number;     // cal/cm²
  arcFlashBoundary: number;   // mm
  ppeCategory: 0 | 1 | 2 | 3 | 4;
  hazardLevel: 'safe' | 'danger' | 'extreme';
  requiredPPE: string;
}

/**
 * Confined Space Atmospheric Assessment Types — OSHA 29 CFR 1910.146
 */
export interface ConfinedSpaceInput {
  oxygenPercent: number;
  lelPercent: number;         // % of LEL
  h2sPpm?: number;
  coPpm?: number;
  customGas?: {
    name: string;
    concentration: number;
    pel: number;
    idlh: number;
  };
}

export interface ConfinedSpaceResult {
  oxygenStatus: 'safe' | 'deficient' | 'enriched';
  lelStatus: 'safe' | 'caution' | 'danger';
  h2sStatus: 'safe' | 'caution' | 'danger' | 'idlh' | null;
  coStatus: 'safe' | 'caution' | 'danger' | 'idlh' | null;
  customGasStatus: 'safe' | 'exceeds_pel' | 'idlh' | null;
  overallStatus: 'safe' | 'caution' | 'danger' | 'idlh';
  entryPermitted: boolean;
  warnings: string[];
}

/**
 * LEL (Lower Explosive Limit) Mixed Gas Types — Le Chatelier's Rule
 */
export interface GasComponent {
  name: string;
  concentration: number;      // % by volume
  lel: number;                // % (LEL of pure gas)
}

export interface LelInput {
  gases: GasComponent[];
  temperature?: number;       // °C, default 25
  pressure?: number;          // kPa, default 101.325
}

export interface LelResult {
  mixtureLel: number;         // %
  totalConcentration: number; // %
  percentOfLel: number;       // %
  status: 'safe' | 'caution' | 'danger';
  safetyMargin: number;       // remaining % before LEL
  contributions: { name: string; fraction: number }[];
}
