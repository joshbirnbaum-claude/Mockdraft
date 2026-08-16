import type { GradedPick, Pick, Player, RoomState, SlotType, TeamGrade } from '../../../shared/types.js';
import { positionalValue } from '../../../shared/valueCurve.js';

const STEAL_THRESHOLD = 8;
const REACH_THRESHOLD = -8;

function tagFor(valueOverAdp: number): 'steal' | 'reach' | 'fair' {
  if (valueOverAdp >= STEAL_THRESHOLD) return 'steal';
  if (valueOverAdp <= REACH_THRESHOLD) return 'reach';
  return 'fair';
}

function value(gp: GradedPick): number {
  return positionalValue(gp.player.position, gp.player.posRank);
}

function letterForZ(z: number): string {
  if (z >= 1.5) return 'A+';
  if (z >= 1.0) return 'A';
  if (z >= 0.6) return 'A-';
  if (z >= 0.3) return 'B+';
  if (z >= 0.0) return 'B';
  if (z >= -0.3) return 'B-';
  if (z >= -0.6) return 'C+';
  if (z >= -1.0) return 'C';
  if (z >= -1.5) return 'C-';
  if (z >= -2.0) return 'D';
  return 'F';
}

export function gradeDraft(room: RoomState, playersById: Map<string, Player>): TeamGrade[] {
  const picksByTeam = new Map<string, Pick[]>();
  for (const pick of room.picks) {
    const arr = picksByTeam.get(pick.teamId) ?? [];
    arr.push(pick);
    picksByTeam.set(pick.teamId, arr);
  }

  const roster = room.settings.roster;

  const raw = room.teams.map((team) => {
    const teamPicks = (picksByTeam.get(team.id) ?? []).slice().sort((a, b) => a.overallPick - b.overallPick);
    const gradedPicks: GradedPick[] = teamPicks.map((pick) => {
      const player = playersById.get(pick.playerId)!;
      const valueOverAdp = player.adpRank - pick.overallPick;
      return { pick, player, valueOverAdp, tag: tagFor(valueOverAdp) };
    });

    const starters: Record<SlotType, GradedPick[]> = {
      QB: [], RB: [], WR: [], TE: [], FLEX: [], DST: [], K: [], BENCH: [],
    };
    const byValueDesc = gradedPicks.slice().sort((a, b) => value(b) - value(a));
    const remaining = new Set(byValueDesc);

    (['QB', 'RB', 'WR', 'TE', 'DST', 'K'] as const).forEach((pos) => {
      const need = roster[pos];
      const picks = byValueDesc.filter((gp) => gp.player.position === pos && remaining.has(gp)).slice(0, need);
      picks.forEach((gp) => {
        starters[pos].push(gp);
        remaining.delete(gp);
      });
    });

    const flexCandidates = byValueDesc
      .filter((gp) => ['RB', 'WR', 'TE'].includes(gp.player.position) && remaining.has(gp))
      .slice(0, roster.FLEX);
    flexCandidates.forEach((gp) => {
      starters.FLEX.push(gp);
      remaining.delete(gp);
    });

    const bench = byValueDesc.filter((gp) => remaining.has(gp));
    starters.BENCH = bench;

    const starterValue = (Object.keys(starters) as SlotType[])
      .filter((s) => s !== 'BENCH')
      .reduce((sum, s) => sum + starters[s].reduce((a, gp) => a + value(gp), 0), 0);
    const benchValue = bench.reduce((a, gp) => a + value(gp), 0);
    const avgValueOverAdp = gradedPicks.length
      ? gradedPicks.reduce((a, gp) => a + gp.valueOverAdp, 0) / gradedPicks.length
      : 0;

    let bestPick: GradedPick | null = null;
    let worstPick: GradedPick | null = null;
    for (const gp of gradedPicks) {
      if (!bestPick || gp.valueOverAdp > bestPick.valueOverAdp) bestPick = gp;
      if (!worstPick || gp.valueOverAdp < worstPick.valueOverAdp) worstPick = gp;
    }

    const rawScore = starterValue + benchValue * 0.25 + avgValueOverAdp * 3;

    return { team, gradedPicks, starters, bench, starterValue, benchValue, avgValueOverAdp, bestPick, worstPick, rawScore };
  });

  const scores = raw.map((r) => r.rawScore);
  const mean = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / (scores.length || 1);
  const stddev = Math.sqrt(variance) || 1;

  return raw
    .map((r): TeamGrade => {
      const z = (r.rawScore - mean) / stddev;
      return {
        teamId: r.team.id,
        teamName: r.team.name,
        isBot: r.team.isBot,
        letterGrade: letterForZ(z),
        score: z,
        starterValue: r.starterValue,
        benchValue: r.benchValue,
        avgValueOverAdp: r.avgValueOverAdp,
        bestPick: r.bestPick,
        worstPick: r.worstPick,
        starters: r.starters,
        bench: r.bench,
        allPicks: r.gradedPicks,
      };
    })
    .sort((a, b) => b.score - a.score);
}
