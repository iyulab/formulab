/**
 * OEE (Overall Equipment Effectiveness) Types
 */
export interface OeeRawData {
  plannedTime: number;    // minutes - total planned production time
  runTime: number;        // minutes - actual run time (excludes downtime)
  totalCount: number;     // pieces - total units produced
  goodCount: number;      // pieces - good quality units
  idealCycleTime: number; // minutes per piece - ideal production rate
}

export interface OeeInput {
  rawData: OeeRawData;
}

export interface OeeResult {
  factors: {
    availability: number;  // 0-1 ratio
    performance: number;   // 0-1 ratio
    quality: number;       // 0-1 ratio
    oee: number;           // 0-1 ratio
  };
  percentages: {
    availability: number;  // 0-100 %
    performance: number;   // 0-100 %
    quality: number;       // 0-100 %
    oee: number;           // 0-100 %
  };
}

/**
 * Cpk (Process Capability Index) Types
 */
export interface CpkInput {
  usl: number;    // upper specification limit
  lsl: number;    // lower specification limit
  mean: number;   // process mean
  stdDev: number; // standard deviation
}

export interface CpkResult {
  cp: number;     // process capability (potential)
  cpk: number;    // process capability index (actual)
  cpu: number;    // upper process capability
  cpl: number;    // lower process capability
  sigmaLevel: number; // sigma level (min of upper and lower z-scores)
}

/**
 * Cycle Time Analysis Types
 */
export interface CycleTimeInput {
  measurements: number[];  // cycle time measurements
  target?: number;         // optional target cycle time
}

export interface CycleTimeResult {
  count: number;     // number of measurements
  average: number;   // arithmetic mean
  min: number;       // minimum value
  max: number;       // maximum value
  range: number;     // max - min
  stdDev: number;    // sample standard deviation
  cv: number;        // coefficient of variation (%)
}

/**
 * Takt Time Types
 */
export type TimeUnit = 'seconds' | 'minutes' | 'hours';

export interface TaktTimeInput {
  availableTime: number;  // available production time
  demand: number;         // customer demand (units)
  timeUnit: TimeUnit;     // time unit for availableTime
}

export interface TaktTimeResult {
  taktTime: number;       // time per unit (in same unit as input)
  maxRatePerHour: number; // maximum units per hour
}
