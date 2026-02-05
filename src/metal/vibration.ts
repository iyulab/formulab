import type { VibrationInput, VibrationResult, VibrationMaterial, FrequencyMode } from './types.js';

interface MaterialVibrationProps {
  E: number;    // GPa (Young's modulus)
  rho: number;  // kg/m3 (density)
  G: number;    // GPa (shear modulus)
}

const VIBRATION_MATERIALS: Record<VibrationMaterial, MaterialVibrationProps> = {
  steel: { E: 200, rho: 7850, G: 79 },
  stainless: { E: 193, rho: 8000, G: 77 },
  aluminum: { E: 69, rho: 2700, G: 26 },
  copper: { E: 120, rho: 8930, G: 45 },
  titanium: { E: 105, rho: 4500, G: 42 },
  custom: { E: 200, rho: 7850, G: 79 },
};

/** Characteristic values lambda_n for cantilever beam (first 3 modes) */
const CANTILEVER_LAMBDA = [1.875104, 4.694091, 7.854757];

/** Simply supported beam: lambda_n = n x pi */
const simplySuportedLambda = (n: number): number => n * Math.PI;

/**
 * Calculate natural frequencies for various vibration systems.
 */
export function vibration(input: VibrationInput): VibrationResult {
  const { system, material } = input;

  // Get material properties
  const props = material === 'custom' && input.youngsModulus && input.density
    ? {
        E: input.youngsModulus,
        rho: input.density,
        G: input.shearModulus ?? (input.youngsModulus / 2.6),
      }
    : VIBRATION_MATERIALS[material];

  const materialProps = { E: props.E, rho: props.rho, G: props.G };

  // Spring-mass system (simple case)
  if (system === 'springMass') {
    const k = input.springConstant ?? 0;
    const m = input.mass ?? 0;
    if (k <= 0 || m <= 0) {
      return { frequencies: [], momentOfInertia: 0, crossSectionalArea: 0, materialProps };
    }
    const omega = Math.sqrt(k / m);
    const freq = omega / (2 * Math.PI);
    return {
      frequencies: [{
        mode: 1,
        frequency: roundTo(freq, 2),
        angularFrequency: roundTo(omega, 2),
        period: roundTo(1 / freq, 4),
      }],
      momentOfInertia: 0,
      crossSectionalArea: 0,
      materialProps,
    };
  }

  // Beam systems need geometry
  const L = input.length ?? 0; // mm
  if (L <= 0) {
    return { frequencies: [], momentOfInertia: 0, crossSectionalArea: 0, materialProps };
  }

  // Calculate cross-sectional properties
  let I = 0; // mm4 (second moment of area)
  let A = 0; // mm2 (cross-sectional area)
  let J = 0; // mm4 (polar moment of inertia for torsion)

  const crossSection = input.crossSection ?? 'rectangular';

  switch (crossSection) {
    case 'rectangular': {
      const w = input.width ?? 0;
      const h = input.height ?? 0;
      if (w <= 0 || h <= 0) {
        return { frequencies: [], momentOfInertia: 0, crossSectionalArea: 0, materialProps };
      }
      I = (w * Math.pow(h, 3)) / 12;
      A = w * h;
      // Torsional constant for rectangle (approximate)
      const a = Math.max(w, h) / 2;
      const b = Math.min(w, h) / 2;
      J = a * Math.pow(b, 3) * (16 / 3 - 3.36 * (b / a) * (1 - Math.pow(b / a, 4) / 12));
      break;
    }
    case 'circular': {
      const d = input.diameter ?? 0;
      if (d <= 0) {
        return { frequencies: [], momentOfInertia: 0, crossSectionalArea: 0, materialProps };
      }
      I = (Math.PI * Math.pow(d, 4)) / 64;
      A = (Math.PI * Math.pow(d, 2)) / 4;
      J = (Math.PI * Math.pow(d, 4)) / 32;
      break;
    }
    case 'hollow': {
      const Do = input.outerDiameter ?? 0;
      const Di = input.innerDiameter ?? 0;
      if (Do <= 0 || Di <= 0 || Di >= Do) {
        return { frequencies: [], momentOfInertia: 0, crossSectionalArea: 0, materialProps };
      }
      I = (Math.PI / 64) * (Math.pow(Do, 4) - Math.pow(Di, 4));
      A = (Math.PI / 4) * (Math.pow(Do, 2) - Math.pow(Di, 2));
      J = (Math.PI / 32) * (Math.pow(Do, 4) - Math.pow(Di, 4));
      break;
    }
  }

  // Convert units for calculation
  // E: GPa -> Pa = 10^9, L: mm -> m = 10^-3, I: mm4 -> m4 = 10^-12, A: mm2 -> m2 = 10^-6
  const E_Pa = props.E * 1e9;
  const rho_kgm3 = props.rho;
  const L_m = L / 1000;
  const I_m4 = I * 1e-12;
  const A_m2 = A * 1e-6;
  const G_Pa = props.G * 1e9;
  const J_m4 = J * 1e-12;

  const frequencies: FrequencyMode[] = [];

  if (system === 'shaftDisk') {
    // Torsional vibration: fn = (1/2pi) x sqrt(GJ/LIp)
    // Ip = mass moment of inertia of disk = (1/2) x m x r^2
    const diskMass = input.diskMass ?? 0;
    const diskRadius = (input.diskRadius ?? 0) / 1000; // mm -> m
    if (diskMass <= 0 || diskRadius <= 0) {
      return { frequencies: [], momentOfInertia: roundTo(I, 2), crossSectionalArea: roundTo(A, 2), materialProps };
    }
    const Ip = 0.5 * diskMass * Math.pow(diskRadius, 2); // kg-m2
    const omega = Math.sqrt((G_Pa * J_m4) / (L_m * Ip));
    const freq = omega / (2 * Math.PI);
    frequencies.push({
      mode: 1,
      frequency: roundTo(freq, 2),
      angularFrequency: roundTo(omega, 2),
      period: roundTo(1 / freq, 4),
    });
  } else {
    // Transverse beam vibration
    // fn = (lambda_n^2 / 2piL^2) x sqrt(EI / rhoA)
    const factor = Math.sqrt((E_Pa * I_m4) / (rho_kgm3 * A_m2));
    const lambdas = system === 'cantilever'
      ? CANTILEVER_LAMBDA
      : [1, 2, 3].map(simplySuportedLambda);

    for (let i = 0; i < lambdas.length; i++) {
      const lambda = lambdas[i];
      const omega = (Math.pow(lambda, 2) / Math.pow(L_m, 2)) * factor;
      const freq = omega / (2 * Math.PI);
      frequencies.push({
        mode: i + 1,
        frequency: roundTo(freq, 2),
        angularFrequency: roundTo(omega, 2),
        period: roundTo(1 / freq, 4),
      });
    }
  }

  return {
    frequencies,
    momentOfInertia: roundTo(I, 2),
    crossSectionalArea: roundTo(A, 2),
    materialProps,
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
