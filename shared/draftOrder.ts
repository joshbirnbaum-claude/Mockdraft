import type { DraftType } from './types.js';

export function isRoundReversed(round: number, draftType: DraftType, thirdRoundReversal: boolean): boolean {
  if (draftType === 'linear') return false;
  if (!thirdRoundReversal) return round % 2 === 0;
  if (round === 1) return false;
  if (round === 2) return true;
  return round % 2 === 1;
}

export interface PickLocation {
  round: number;
  pickInRound: number;
  teamId: string;
}

export function locateOverallPick(
  overallPick: number,
  draftOrderTeamIds: string[],
  draftType: DraftType,
  thirdRoundReversal: boolean,
): PickLocation {
  const teamCount = draftOrderTeamIds.length;
  const round = Math.floor((overallPick - 1) / teamCount) + 1;
  const pickInRound = ((overallPick - 1) % teamCount) + 1;
  const reversed = isRoundReversed(round, draftType, thirdRoundReversal);
  const idx = reversed ? teamCount - pickInRound : pickInRound - 1;
  return { round, pickInRound, teamId: draftOrderTeamIds[idx] };
}
