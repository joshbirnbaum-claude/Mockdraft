import type { RoomState } from '../../../shared/types.js';

export interface RoomInternal extends RoomState {
  authTokens: Map<string, string>; // teamId -> secret
  draftedPlayerIds: Set<string>;
  botWildness: Map<string, number>; // teamId -> personality multiplier
  queues: Map<string, string[]>; // teamId -> preferred player id queue (for autopick)
  timer: NodeJS.Timeout | null;
  lastActivityAt: number;
}

export function sanitizeRoom(room: RoomInternal): RoomState {
  const {
    code, hostTeamId, settings, teams, status, draftOrderTeamIds,
    picks, currentOverallPick, totalPicks, pickDeadline, createdAt,
  } = room;
  return {
    code, hostTeamId, settings, teams, status, draftOrderTeamIds,
    picks, currentOverallPick, totalPicks, pickDeadline, createdAt,
  };
}
