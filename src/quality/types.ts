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

/**
 * AQL (Acceptable Quality Level) Types
 */
export type InspectionLevel = 'I' | 'II' | 'III' | 'S-1' | 'S-2' | 'S-3' | 'S-4';

export interface AqlInput {
  /** Lot size (number of units in the batch) */
  lotSize: number;
  /** Acceptable Quality Level (e.g., 0.065, 0.1, 0.25, 0.4, 0.65, 1.0, 1.5, 2.5, 4.0, 6.5) */
  aqlLevel: number;
  /** Inspection level (I, II, III for general; S-1 to S-4 for special) */
  inspectionLevel: InspectionLevel;
}

export interface AqlResult {
  /** Sample size code letter */
  sampleCode: string;
  /** Number of samples to inspect */
  sampleSize: number;
  /** Accept number (max defects to accept) */
  acceptNumber: number;
  /** Reject number (min defects to reject) */
  rejectNumber: number;
  /** Sampling percentage of lot */
  samplingPercent: number;
}

/**
 * Downtime Cost Types
 */
export interface DowntimeInput {
  hourlyRate: number;            // $/hr equipment cost
  laborCostPerHour: number;      // $/hr labor
  downtimeMinutes: number;       // minutes
  plannedProductionUnits: number; // units/hr
  unitPrice: number;             // $/unit revenue
}

export interface DowntimeResult {
  downtimeHours: number;
  lostUnits: number;
  laborCost: number;       // $
  equipmentCost: number;   // $
  lostRevenue: number;     // $
  totalCost: number;       // $
}

/**
 * DPMO (Defects Per Million Opportunities) Types
 */
export interface DpmoInput {
  defects: number;        // number of defects
  units: number;          // number of units inspected
  opportunities: number;  // defect opportunities per unit
}

export interface DpmoResult {
  dpmo: number;         // defects per million opportunities
  sigmaLevel: number;   // process sigma level
  yield: number;        // yield percentage (0-100)
  dpu: number;          // defects per unit
  defectRate: number;   // defect rate percentage
}

/**
 * Line Balancing Types
 */
export interface BalancingTask {
  id: string;
  name: string;
  time: number;
  predecessors: string[];
}

export interface LineBalancingInput {
  tasks: BalancingTask[];
  cycleTime: number;
}

export interface WorkStation {
  id: number;
  tasks: { id: string; name: string; time: number }[];
  totalTime: number;
  idleTime: number;
}

export interface PositionalWeight {
  id: string;
  name: string;
  time: number;
  weight: number;
}

export interface LineBalancingResult {
  stations: WorkStation[];
  numStations: number;
  theoreticalMin: number;
  lineEfficiency: number;
  balanceDelay: number;
  smoothnessIndex: number;
  positionalWeights: PositionalWeight[];
}

/**
 * MTBF (Mean Time Between Failures) Types
 */
export interface MtbfInput {
  /** Total operating time in hours */
  totalOperatingTime: number;
  /** Total repair/downtime in hours */
  totalRepairTime: number;
  /** Number of failures */
  numberOfFailures: number;
}

export interface MtbfResult {
  /** Mean Time Between Failures (hours) */
  mtbf: number;
  /** Mean Time To Repair (hours) */
  mttr: number;
  /** Availability (0-100 %) */
  availability: number;
  /** Failure rate (failures per hour) */
  failureRate: number;
  /** Reliability at time T (using exponential distribution), where T = MTBF */
  reliabilityAtMtbf: number;
}

/**
 * Ppk (Process Performance Index) Types
 */
export interface PpkInput {
  usl: number;     // upper spec limit
  lsl: number;     // lower spec limit
  mean: number;    // overall process mean
  stdDev: number;  // overall (long-term) standard deviation
}

export interface PpkResult {
  pp: number;               // process performance (spread)
  ppk: number;              // process performance index
  ppUpper: number;          // upper process performance (Ppu)
  ppLower: number;          // lower process performance (Ppl)
  withinSpecPercent: number; // percentage within spec
  sigma: number;            // sigma level
}

/**
 * PPM (Parts Per Million) Conversion Types
 */
export type ConvertFrom = 'defectRate' | 'ppm' | 'sigma';

export interface PpmInput {
  convertFrom: ConvertFrom;
  value: number;
}

export interface PpmResult {
  defectRate: number;   // percentage (0-100)
  ppm: number;          // parts per million
  dpmo: number;         // defects per million opportunities
  sigma: number;        // sigma level
  yieldRate: number;    // percentage (0-100)
}

/**
 * RPN (Risk Priority Number) Types
 */
export interface RpnInput {
  severity: number;    // 1-10 scale
  occurrence: number;  // 1-10 scale
  detection: number;   // 1-10 scale
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RpnResult {
  rpn: number;          // 1-1000
  riskLevel: RiskLevel;
  severityScore: number;
  occurrenceScore: number;
  detectionScore: number;
}

/**
 * Control Chart (SPC) Types
 */
export type ControlChartType = 'xbarR' | 'xbarS';

export interface ControlChartInput {
  chartType: ControlChartType;
  subgroups: number[][];     // each inner array is one subgroup of measurements
}

export interface ControlLimit {
  centerLine: number;
  ucl: number;
  lcl: number;
}

export interface SubgroupStat {
  index: number;
  mean: number;
  range?: number;
  stdDev?: number;
  outOfControl: boolean;
}

export interface ControlChartResult {
  chartType: ControlChartType;
  subgroupSize: number;
  xBarLimits: ControlLimit;
  rOrSLimits: ControlLimit;
  subgroupStats: SubgroupStat[];
  grandMean: number;
  sigmaEstimate: number;
  outOfControlPoints: number[];
  processCapable: boolean;
}

/**
 * Yield (FPY/RTY) Types
 */
export interface YieldInput {
  /** Array of process steps, each containing [goodUnits, totalUnits] */
  steps: Array<{ good: number; total: number }>;
}

export interface YieldResult {
  /** First Pass Yield for each step (0-100 %) */
  fpyPerStep: number[];
  /** Average FPY across all steps (0-100 %) */
  averageFpy: number;
  /** Rolled Throughput Yield = product of all FPYs (0-100 %) */
  rty: number;
  /** Total input units (first step) */
  totalInput: number;
  /** Expected output after all steps */
  expectedOutput: number;
}
