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
