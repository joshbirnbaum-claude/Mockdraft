import { locateOverallPick } from '../../../shared/draftOrder';
import { eligibleForSlot, SLOT_ORDER } from './positions';
import type { Player, RoomState, SlotType } from '../../../shared/types';

export function allPickLocations(room: RoomState) {
  const out: { overallPick: number; round: number; pickInRound: number; teamId: string }[] = [];
  for (let overallPick = 1; overallPick <= room.totalPicks; overallPick++) {
    out.push({ overallPick, ...locateOverallPick(overallPick, room.draftOrderTeamIds, room.settings.draftType, room.settings.thirdRoundReversal) });
  }
  return out;
}

export function currentLocation(room: RoomState) {
  if (room.status !== 'drafting') return null;
  return locateOverallPick(room.currentOverallPick, room.draftOrderTeamIds, room.settings.draftType, room.settings.thirdRoundReversal);
}

export function draftedPlayerIds(room: RoomState): Set<string> {
  return new Set(room.picks.map((p) => p.playerId));
}

export function availablePlayers(room: RoomState, players: Player[]): Player[] {
  const drafted = draftedPlayerIds(room);
  return players.filter((p) => !drafted.has(p.id));
}

export function picksForTeam(room: RoomState, teamId: string) {
  return room.picks.filter((p) => p.teamId === teamId).sort((a, b) => a.overallPick - b.overallPick);
}

/** Greedy best-effort lineup assignment for live roster display (mirrors server grading logic loosely). */
export function assignRosterSlots(
  room: RoomState,
  teamId: string,
  players: Player[],
): Record<SlotType, Player[]> {
  const byId = new Map(players.map((p) => [p.id, p]));
  const teamPlayers = picksForTeam(room, teamId)
    .map((p) => byId.get(p.playerId))
    .filter((p): p is Player => !!p);

  const slots: Record<SlotType, Player[]> = { QB: [], RB: [], WR: [], TE: [], FLEX: [], DST: [], K: [], BENCH: [] };
  const remaining = [...teamPlayers].sort((a, b) => a.adpRank - b.adpRank);
  const roster = room.settings.roster;

  const fillOrder: SlotType[] = ['QB', 'RB', 'WR', 'TE', 'DST', 'K', 'FLEX'];
  for (const slot of fillOrder) {
    const need = slot === 'FLEX' ? roster.FLEX : roster[slot as 'QB' | 'RB' | 'WR' | 'TE' | 'DST' | 'K'];
    for (let i = 0; i < need; i++) {
      const idx = remaining.findIndex((p) => eligibleForSlot(p.position, slot));
      if (idx === -1) break;
      slots[slot].push(remaining[idx]);
      remaining.splice(idx, 1);
    }
  }
  slots.BENCH = remaining;
  return slots;
}

export function rosterSlotList(room: RoomState): SlotType[] {
  const roster = room.settings.roster;
  const list: SlotType[] = [];
  SLOT_ORDER.forEach((slot) => {
    const count = slot === 'BENCH' ? roster.BENCH : roster[slot as keyof typeof roster];
    for (let i = 0; i < count; i++) list.push(slot);
  });
  return list;
}
