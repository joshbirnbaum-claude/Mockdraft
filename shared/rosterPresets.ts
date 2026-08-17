import type { DraftSettings } from './types';

export const DEFAULT_SETTINGS: DraftSettings = {
  teamCount: 10,
  roster: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1, BENCH: 6 },
  draftType: 'snake',
  pickTimeSeconds: 60,
  scoring: 'PPR',
  botVariance: 0.3,
  thirdRoundReversal: false,
  autoStartWhenReady: true,
};

export function totalRosterSize(settings: DraftSettings): number {
  const r = settings.roster;
  return r.QB + r.RB + r.WR + r.TE + r.FLEX + r.DST + r.K + r.BENCH;
}

export const MIN_TEAMS = 4;
export const MAX_TEAMS = 16;
export const MIN_PICK_SECONDS = 10;
export const MAX_PICK_SECONDS = 180;
