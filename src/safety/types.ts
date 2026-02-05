// Fall Clearance Types
export interface FallClearanceInput {
  lanyardLength: number;       // m
  decelerationDistance: number; // m
  harnessStretch: number;      // m
  workerHeight: number;        // m
  safetyFactor: number;        // m
  anchorHeight: number;        // m (above feet)
}

export interface FallClearanceResult {
  totalFallDistance: number;
  minimumHeight: number;
  isAdequate: boolean | null;
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
