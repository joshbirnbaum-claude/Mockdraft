import { call, SERVER_HTTP_URL } from './socket';
import type { DraftSettings, DraftResults, Player, RoomState } from '../../../shared/types';

export interface SeatResult {
  room: RoomState;
  teamId: string;
  authToken: string;
}

export const RoomApi = {
  create: (hostName: string, settings: Partial<DraftSettings>) =>
    call<SeatResult>('room:create', { hostName, settings }),

  join: (code: string, name: string, teamId?: string) =>
    call<SeatResult>('room:join', { code, name, teamId }),

  peek: (code: string) => call<{ room: RoomState }>('room:peek', { code }),

  rejoin: (code: string, teamId: string, authToken: string) =>
    call<{ room: RoomState }>('room:rejoin', { code, teamId, authToken }),

  updateSettings: (code: string, teamId: string, authToken: string, settings: Partial<DraftSettings>) =>
    call<{ room: RoomState }>('room:updateSettings', { code, teamId, authToken, settings }),

  setReady: (code: string, teamId: string, authToken: string, ready: boolean) =>
    call<{ room: RoomState }>('room:setReady', { code, teamId, authToken, ready }),

  rename: (code: string, teamId: string, authToken: string, name: string) =>
    call<{ room: RoomState }>('room:rename', { code, teamId, authToken, name }),

  switchSlot: (code: string, teamId: string, authToken: string, targetTeamId: string) =>
    call<SeatResult>('room:switchSlot', { code, teamId, authToken, targetTeamId }),

  start: (code: string, teamId: string, authToken: string) =>
    call<{ room: RoomState }>('room:start', { code, teamId, authToken }),

  pick: (code: string, teamId: string, authToken: string, playerId: string) =>
    call<{ room: RoomState }>('draft:pick', { code, teamId, authToken, playerId }),

  setQueue: (code: string, teamId: string, authToken: string, playerIds: string[]) =>
    call<unknown>('draft:setQueue', { code, teamId, authToken, playerIds }),

  results: (code: string) => call<DraftResults>('draft:results', { code }),
};

let playersCache: Player[] | null = null;
export async function fetchPlayers(): Promise<Player[]> {
  if (playersCache) return playersCache;
  const res = await fetch(`${SERVER_HTTP_URL}/api/players`);
  if (!res.ok) throw new Error('Failed to load player pool');
  playersCache = (await res.json()) as Player[];
  return playersCache;
}

export type { DraftResults };
