import { roundTo } from '../utils.js';
import type { TspInput, TspResult, TspNode } from './types.js';

/**
 * Calculate Euclidean distance between two nodes
 */
function dist(a: TspNode, b: TspNode): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Calculate total tour distance
 */
function tourDistance(nodes: TspNode[], tour: number[]): number {
  let d = 0;
  for (let i = 0; i < tour.length; i++) {
    d += dist(nodes[tour[i]], nodes[tour[(i + 1) % tour.length]]);
  }
  return d;
}

/**
 * Nearest neighbor heuristic for TSP
 */
function nearestNeighbor(nodes: TspNode[], start: number): number[] {
  const n = nodes.length;
  const visited = new Uint8Array(n);
  const tour: number[] = [start];
  visited[start] = 1;

  for (let step = 1; step < n; step++) {
    const current = tour[tour.length - 1];
    let bestDist = Infinity;
    let bestIdx = -1;
    for (let j = 0; j < n; j++) {
      if (!visited[j]) {
        const d = dist(nodes[current], nodes[j]);
        if (d < bestDist) { bestDist = d; bestIdx = j; }
      }
    }
    tour.push(bestIdx);
    visited[bestIdx] = 1;
  }
  return tour;
}

/**
 * 2-opt local improvement for TSP
 */
function twoOpt(nodes: TspNode[], tour: number[]): number[] {
  const n = tour.length;
  const result = [...tour];
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue; // skip full reversal
        const a = result[i], b = result[i + 1];
        const c = result[j], d = result[(j + 1) % n];
        const oldDist = dist(nodes[a], nodes[b]) + dist(nodes[c], nodes[d]);
        const newDist = dist(nodes[a], nodes[c]) + dist(nodes[b], nodes[d]);
        if (newDist < oldDist - 1e-10) {
          // reverse segment [i+1 .. j]
          let left = i + 1, right = j;
          while (left < right) {
            [result[left], result[right]] = [result[right], result[left]];
            left++; right--;
          }
          improved = true;
        }
      }
    }
  }
  return result;
}

/**
 * Brute force exact solution for small instances
 */
function bruteForce(nodes: TspNode[]): { tour: number[]; distance: number } | null {
  if (nodes.length > 10) return null;
  const n = nodes.length;
  const indices = Array.from({ length: n - 1 }, (_, i) => i + 1);
  let bestDist = Infinity;
  let bestTour: number[] = [];

  // Generate all permutations of indices (nodes 1..n-1, starting from 0)
  function permute(arr: number[], l: number) {
    if (l === arr.length) {
      const tour = [0, ...arr];
      const d = tourDistance(nodes, tour);
      if (d < bestDist) { bestDist = d; bestTour = [...tour]; }
      return;
    }
    for (let i = l; i < arr.length; i++) {
      [arr[l], arr[i]] = [arr[i], arr[l]];
      permute(arr, l + 1);
      [arr[l], arr[i]] = [arr[i], arr[l]];
    }
  }
  permute(indices, 0);
  return { tour: bestTour, distance: bestDist };
}

/**
 * Solve the Traveling Salesman Problem
 *
 * Uses nearest neighbor heuristic with 2-opt improvement.
 * For small instances (<=10 nodes), also provides optimal solution via brute force.
 *
 * @param input - Array of nodes with x, y coordinates
 * @returns Tour information and distances
 */
export function tsp(input: TspInput): TspResult | null {
  const { nodes } = input;
  if (nodes.length < 2) {
    if (nodes.length === 1) return {
      nnTour: [0], nnDistance: 0, optimizedTour: [0], optimizedDistance: 0,
      improvementPercent: 0,
    };
    return null;
  }
  if (nodes.length === 2) {
    return {
      nnTour: [0, 1], nnDistance: roundTo(2 * dist(nodes[0], nodes[1]), 2),
      optimizedTour: [0, 1], optimizedDistance: roundTo(2 * dist(nodes[0], nodes[1]), 2),
      improvementPercent: 0,
    };
  }

  // Try all starting points for NN, keep best
  let bestNNTour: number[] = [];
  let bestNNDist = Infinity;
  for (let s = 0; s < nodes.length; s++) {
    const tour = nearestNeighbor(nodes, s);
    const d = tourDistance(nodes, tour);
    if (d < bestNNDist) { bestNNDist = d; bestNNTour = tour; }
  }

  // 2-opt improvement
  const optimizedTour = twoOpt(nodes, bestNNTour);
  const optimizedDistance = tourDistance(nodes, optimizedTour);

  const improvementPercent = bestNNDist > 0
    ? roundTo(((bestNNDist - optimizedDistance) / bestNNDist) * 100, 2)
    : 0;

  const result: TspResult = {
    nnTour: bestNNTour,
    nnDistance: roundTo(bestNNDist, 2),
    optimizedTour,
    optimizedDistance: roundTo(optimizedDistance, 2),
    improvementPercent,
  };

  // Brute force for small instances
  const bf = bruteForce(nodes);
  if (bf) {
    result.optimalDistance = roundTo(bf.distance, 2);
    result.optimalityGap = result.optimizedDistance > 0
      ? roundTo(((optimizedDistance - bf.distance) / bf.distance) * 100, 2)
      : 0;
  }

  return result;
}
