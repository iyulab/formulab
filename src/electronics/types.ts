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

// AWG wire gauge types
export type AwgMaterial = 'copper' | 'aluminum';

export interface AwgInput {
  awg: number;              // AWG gauge number (0-40)
  material: AwgMaterial;
  tempC: number;            // Operating temperature in Celsius
}

export interface AwgResult {
  diameterMm: number;       // Wire diameter in mm
  diameterMils: number;     // Wire diameter in mils
  areaMm2: number;          // Cross-sectional area in mm²
  areaCircularMils: number; // Cross-sectional area in circular mils
  resistancePerM: number;   // Resistance per meter in Ω/m
  resistancePerFt: number;  // Resistance per foot in Ω/ft
  currentCapacity: number;  // Max current for chassis wiring (A)
}

// Capacitor code decoder types
export interface CapacitorCodeInput {
  code: string; // 3-digit code like "104"
}

export interface CapacitorCodeResult {
  picofarads: number;
  nanofarads: number;
  microfarads: number;
  formatted: string;
  significantFigures: number;
  multiplier: number;
}

// LED resistor calculator types
export interface LedResistorInput {
  supplyVoltage: number;      // Vs in volts
  forwardVoltage: number;     // Vf in volts
  forwardCurrent: number;     // If in milliamps
}

export interface LedResistorResult {
  resistance: number;           // Calculated resistance in ohms
  standardResistance: number;   // Nearest standard E24 series value
  powerDissipation: number;     // Power in milliwatts
  actualCurrent: number;        // Actual current with standard resistor (mA)
}

// Stencil aperture calculator types
export type ApertureShape = 'rectangle' | 'circle';
export type ComponentType = 'bga' | 'qfp' | 'chip' | 'sot' | 'general';

export interface StencilInput {
  shape: ApertureShape;
  apertureWidth: number;    // mm (or diameter for circle)
  apertureLength: number;   // mm (ignored for circle)
  stencilThickness: number; // mm
  componentType: ComponentType;
}

export interface StencilResult {
  apertureArea: number;     // mm^2
  wallArea: number;         // mm^2 (perimeter * thickness)
  areaRatio: number;        // aperture area / wall area
  aspectRatio: number;      // aperture width / stencil thickness
  areaRatioOk: boolean;     // >= recommended for component type
  aspectRatioOk: boolean;   // >= recommended for component type
  recommendedAreaRatio: number;
  recommendedAspectRatio: number;
  status: 'good' | 'marginal' | 'poor';
}

// Ohm's Law Calculator types
export type OhmsLawSolveFor = 'voltage' | 'current' | 'resistance' | 'power';

export type OhmsLawInput =
  | { solveFor: 'voltage'; current: number; resistance: number }
  | { solveFor: 'current'; voltage: number; resistance: number }
  | { solveFor: 'resistance'; voltage: number; current: number }
  | { solveFor: 'power'; voltage: number; current: number };

export interface OhmsLawResult {
  voltage: number;     // V
  current: number;     // A
  resistance: number;  // Ω
  power: number;       // W
}

// Via current capacity types
export interface ViaInput {
  holeDiameter: number;     // Via hole diameter in mm
  platingThickness: number; // Copper plating thickness in μm (typically 25μm)
  viaLength: number;        // Via barrel length in mm (board thickness)
  tempRise: number;         // Allowed temperature rise in °C
}

export interface ViaResult {
  currentCapacity: number;      // Maximum current capacity in A
  crossSectionMm2: number;      // Cross-sectional area of copper ring in mm²
  thermalResistance: number;    // Thermal resistance in °C/W
  resistanceMOhm: number;       // Via resistance in mΩ
  powerDissipation: number;     // Power dissipation at max current in mW
}
