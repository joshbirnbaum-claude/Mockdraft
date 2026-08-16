import type { Player, Position, RosterSettings } from '../../../shared/types.js';

function gaussianNoise(rng: () => number): number {
  // Box-Muller transform
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

interface RemainingNeeds {
  dedicatedRemaining: Record<Position, number>;
  flexRemaining: number;
  picksLeft: number;
}

export function computeRemainingNeeds(
  draftedPositions: Position[],
  roster: RosterSettings,
): RemainingNeeds {
  const counts: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0, DST: 0, K: 0 };
  for (const p of draftedPositions) counts[p]++;

  const dedicatedRemaining: Record<Position, number> = {
    QB: Math.max(0, roster.QB - counts.QB),
    RB: Math.max(0, roster.RB - counts.RB),
    WR: Math.max(0, roster.WR - counts.WR),
    TE: Math.max(0, roster.TE - counts.TE),
    DST: Math.max(0, roster.DST - counts.DST),
    K: Math.max(0, roster.K - counts.K),
  };

  const flexEligibleSurplus =
    Math.max(0, counts.RB - roster.RB) + Math.max(0, counts.WR - roster.WR) + Math.max(0, counts.TE - roster.TE);
  const flexRemaining = Math.max(0, roster.FLEX - flexEligibleSurplus);

  const rosterSize =
    roster.QB + roster.RB + roster.WR + roster.TE + roster.FLEX + roster.DST + roster.K + roster.BENCH;
  const picksLeft = Math.max(0, rosterSize - draftedPositions.length);

  return { dedicatedRemaining, flexRemaining, picksLeft };
}

export interface BotPickParams {
  available: Player[]; // sorted ascending by adpRank, none drafted
  draftedPositionsForTeam: Position[];
  roster: RosterSettings;
  round: number;
  totalRounds: number;
  variance: number; // 0-1, from room settings.botVariance
  wildness: number; // per-bot personality multiplier, ~0.7-1.3
  rng?: () => number;
}

const LATE_ROUND_BUFFER = 3;

export function selectBotPick(params: BotPickParams): Player {
  const { available, draftedPositionsForTeam, roster, round, totalRounds, variance, wildness } = params;
  const rng = params.rng ?? Math.random;
  if (available.length === 0) throw new Error('No available players to draft');

  const needs = computeRemainingNeeds(draftedPositionsForTeam, roster);
  const draftedCounts: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0, DST: 0, K: 0 };
  for (const p of draftedPositionsForTeam) draftedCounts[p]++;

  const isLateEnough = round >= totalRounds - LATE_ROUND_BUFFER;

  // Candidate pool: best available by ADP, plus top few at any position of dedicated need
  // (in case a run pushed them down the ADP-sorted slice we'd otherwise consider).
  const poolSize = 50;
  const candidateSet = new Map<string, Player>();
  for (const p of available.slice(0, poolSize)) candidateSet.set(p.id, p);
  for (const pos of Object.keys(needs.dedicatedRemaining) as Position[]) {
    if (needs.dedicatedRemaining[pos] > 0) {
      const topAtPos = available.filter((p) => p.position === pos).slice(0, 5);
      for (const p of topAtPos) candidateSet.set(p.id, p);
    }
  }

  const baseSigma = 5.5;
  const sigma = baseSigma * (1 + round * 0.12) * (0.35 + variance) * wildness;

  let best: Player | null = null;
  let bestScore = -Infinity;

  for (const player of candidateSet.values()) {
    const noise = gaussianNoise(rng) * sigma;
    let score = -(player.adpRank + noise);

    if (player.position === 'K' || player.position === 'DST') {
      const needed = needs.dedicatedRemaining[player.position] > 0;
      if (!isLateEnough) {
        score -= needed ? 120 : 600;
      }
    } else if (needs.dedicatedRemaining[player.position] > 0) {
      const urgency = needs.dedicatedRemaining[player.position] / Math.max(1, needs.picksLeft);
      score += 45 * needs.dedicatedRemaining[player.position] + 80 * urgency;
    } else if ((player.position === 'RB' || player.position === 'WR' || player.position === 'TE') && needs.flexRemaining > 0) {
      score += 22;
    } else {
      const allowance =
        (roster[player.position as 'QB' | 'RB' | 'WR' | 'TE' | 'DST' | 'K'] ?? 0) +
        (player.position === 'RB' || player.position === 'WR' || player.position === 'TE' ? roster.FLEX : 0) +
        3;
      if (draftedCounts[player.position] >= allowance) score -= 35;
    }

    if (score > bestScore) {
      bestScore = score;
      best = player;
    }
  }

  return best ?? available[0];
}

export function makeWildness(rng: () => number = Math.random): number {
  return 0.7 + rng() * 0.6;
}
