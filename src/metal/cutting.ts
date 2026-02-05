import { roundTo } from '../utils.js';
import type { CuttingInput, CuttingResult } from './types.js';

/**
 * Calculate cutting parameters for machining operations.
 *
 * RPM = 1000 x Vc / (pi x D)
 * Feed rate = RPM x feed x (teeth for milling)
 * MRR = material removal rate in cm3/min
 */
export function cutting(input: CuttingInput): CuttingResult {
  const { operation, cuttingSpeed, toolDiameter } = input;

  if (toolDiameter <= 0) {
    return { rpm: 0, feedRate: 0, mrr: 0 };
  }

  // RPM = 1000 x Vc / (pi x D)
  const rpm = (1000 * cuttingSpeed) / (Math.PI * toolDiameter);

  let feedRate: number;
  let mrr: number;

  switch (operation) {
    case 'turning': {
      const f = input.feedPerRev ?? 0;
      const ap = input.depthOfCut ?? 0;
      feedRate = rpm * f; // mm/min
      // MRR = Vc x f x ap (cm3/min) - simplified: feedRate x ap / 1000
      mrr = (feedRate * ap) / 1000;
      break;
    }
    case 'milling': {
      const fz = input.feedPerTooth ?? 0;
      const z = input.numberOfTeeth ?? 1;
      const ap = input.depthOfCut ?? 0;
      const ae = input.widthOfCut ?? 0;
      feedRate = rpm * fz * z; // mm/min
      // MRR = ae x ap x Vf / 1000 (cm3/min)
      mrr = (ae * ap * feedRate) / 1000;
      break;
    }
    case 'drilling': {
      const f = input.feedPerRev ?? 0;
      const d = toolDiameter;
      feedRate = rpm * f;
      // MRR = pi/4 x D^2 x f x n / 1000
      mrr = (Math.PI / 4) * (d * d) * f * rpm / 1000;
      break;
    }
  }

  return {
    rpm: roundTo(rpm, 0),
    feedRate: roundTo(feedRate, 1),
    mrr: roundTo(mrr, 2),
  };
}
