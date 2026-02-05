// Reflow profile types
export type PasteType = 'sac305' | 'sn63pb37' | 'sac387' | 'snbi58';

export interface ReflowInput {
  pasteType: PasteType;
}

export interface ReflowResult {
  pasteType: string;
  meltingPoint: number;       // C
  preheatRate: string;        // C/s range
  preheatTemp: string;        // C range
  preheatTime: string;        // seconds range
  soakTemp: string;           // C range
  soakTime: string;           // seconds range
  peakTemp: string;           // C range
  timeAboveLiquidus: string;  // seconds range
  coolingRate: string;        // C/s max
  totalProfileTime: string;   // seconds range
}

// Resistor decoder types
export type BandCount = 4 | 5 | 6;

export type ColorName = 'black' | 'brown' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'violet' | 'grey' | 'white' | 'gold' | 'silver';

export interface ResistorBands {
  bandCount: BandCount;
  bands: ColorName[];
}

export interface ResistorResult {
  resistance: number; // ohms
  tolerance: number;  // percentage
  tempCoeff?: number; // ppm/C (6-band only)
  formatted: string;  // e.g. "4.7k ohm +/-5%"
}

// SMT Takt time types
export interface SmtTaktInput {
  placementRate: number;       // components per hour (cph)
  componentsPerBoard: number;
  boardsPerPanel: number;      // default 1
  setupTimeSec: number;        // default 0
  availableTimeMin: number;    // default 480 (8 hours)
}

export interface SmtTaktResult {
  placementTimeSec: number;
  totalCycleTimeSec: number;
  boardsPerHour: number;
  totalBoardsPerShift: number;
  lineUtilization: number;   // %
}

// Solder paste types
export interface SolderInput {
  padCount: number;
  avgPadArea: number;           // mm2
  stencilThickness: number;     // mm, default 0.12
  transferEfficiency: number;   // 0-1, default 0.85
  density: number;              // g/cm3, default 7.4 (SAC305)
  boardsPerPanel: number;       // default 1
  panelCount: number;
}

export interface SolderResult {
  volumePerBoard: number;    // mm3
  weightPerBoard: number;    // g
  totalVolume: number;       // mm3
  totalWeight: number;       // g
  totalWeightKg: number;     // kg
}

// Trace width types
export type TraceLayer = 'external' | 'internal';

export interface TraceInput {
  current: number;        // Amps
  tempRise: number;       // C (delta above ambient)
  copperWeight: number;   // oz/ft2 (1oz = 35um)
  layer: TraceLayer;
}

export interface TraceResult {
  widthMils: number;      // mils (thousandths of inch)
  widthMm: number;        // mm
  crossSection: number;   // mil2 (cross-sectional area)
  resistance: number;     // Ohm per inch at 25C
  voltageDrop: number;    // V per inch
  powerLoss: number;      // W per inch
}
