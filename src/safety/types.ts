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
