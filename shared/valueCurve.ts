import type { Position } from './types';

// Approximate positional value decay curves used ONLY for relative grading
// (steal/reach analysis, starter strength, bench depth). These are not real
// projections — they're a monotonic proxy shaped like typical positional
// scarcity so grading feels sensible, tuned so points-per-position roughly
// mirror real PPR scoring drop-off.
const CURVE: Record<Position, { base: number; decay: number }> = {
  QB: { base: 320, decay: 0.05 },
  RB: { base: 300, decay: 0.085 },
  WR: { base: 280, decay: 0.07 },
  TE: { base: 220, decay: 0.11 },
  DST: { base: 90, decay: 0.15 },
  K: { base: 130, decay: 0.05 },
};

/** Value for a player based on their rank within their own position (1-indexed). */
export function positionalValue(position: Position, posRank: number): number {
  const { base, decay } = CURVE[position];
  return base * Math.exp(-decay * (posRank - 1));
}
