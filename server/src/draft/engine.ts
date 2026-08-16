import type { Server } from 'socket.io';
import type { DraftSettings, Pick, Player, TeamSlot } from '../../../shared/types.js';
import { DEFAULT_SETTINGS, MAX_TEAMS, MIN_TEAMS, MIN_PICK_SECONDS, MAX_PICK_SECONDS, totalRosterSize } from '../../../shared/rosterPresets.js';
import { generateId, generateRoomCode, colorForSlot } from '../utils/id.js';
import { ADP_PLAYERS, PLAYERS_BY_ID } from '../data/adp.js';
import { locateOverallPick } from '../../../shared/draftOrder.js';
import { selectBotPick, makeWildness } from './botAI.js';
import { gradeDraft } from './grading.js';
import { sanitizeRoom, type RoomInternal } from '../rooms/roomInternal.js';

export class EngineError extends Error {}

const BOT_PICK_DELAY_MIN_MS = 700;
const BOT_PICK_DELAY_MAX_MS = 1800;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function sanitizeSettings(s: Partial<DraftSettings>): DraftSettings {
  const merged: DraftSettings = { ...DEFAULT_SETTINGS, ...s, roster: { ...DEFAULT_SETTINGS.roster, ...s.roster } };
  merged.teamCount = clamp(Math.round(merged.teamCount), MIN_TEAMS, MAX_TEAMS);
  merged.pickTimeSeconds = clamp(Math.round(merged.pickTimeSeconds), MIN_PICK_SECONDS, MAX_PICK_SECONDS);
  merged.botVariance = clamp(merged.botVariance, 0, 1);
  (['QB', 'RB', 'WR', 'TE', 'FLEX', 'DST', 'K', 'BENCH'] as const).forEach((k) => {
    merged.roster[k] = clamp(Math.round(merged.roster[k] ?? 0), 0, 10);
  });
  if (totalRosterSize(merged) < 1) merged.roster.BENCH = 1;
  return merged;
}

function makeTeams(settings: DraftSettings, existing: TeamSlot[] = []): TeamSlot[] {
  const teams: TeamSlot[] = [];
  for (let i = 0; i < settings.teamCount; i++) {
    const prior = existing[i];
    if (prior) {
      teams.push(prior);
    } else {
      teams.push({
        id: generateId(),
        slotIndex: i,
        name: `Team ${i + 1}`,
        isBot: true,
        ownerId: null,
        ready: true,
        avatarColor: colorForSlot(i),
      });
    }
  }
  return teams;
}

export class DraftEngine {
  private rooms = new Map<string, RoomInternal>();

  constructor(private io: Server) {
    setInterval(() => this.sweepStaleRooms(), 30 * 60 * 1000).unref();
  }

  private sweepStaleRooms() {
    const cutoff = Date.now() - 12 * 60 * 60 * 1000;
    for (const [code, room] of this.rooms) {
      if (room.lastActivityAt < cutoff) {
        if (room.timer) clearTimeout(room.timer);
        this.rooms.delete(code);
      }
    }
  }

  private touch(room: RoomInternal) {
    room.lastActivityAt = Date.now();
  }

  getRoom(code: string): RoomInternal | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  private requireRoom(code: string): RoomInternal {
    const room = this.getRoom(code);
    if (!room) throw new EngineError('Room not found');
    return room;
  }

  private requireAuth(room: RoomInternal, teamId: string, authToken: string) {
    const expected = room.authTokens.get(teamId);
    if (!expected || expected !== authToken) throw new EngineError('Not authorized for this team');
  }

  private broadcast(room: RoomInternal) {
    this.io.to(room.code).emit('room:state', sanitizeRoom(room));
  }

  createRoom(hostName: string, settingsInput: Partial<DraftSettings>) {
    const settings = sanitizeSettings(settingsInput);
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();

    const teams = makeTeams(settings);
    const hostTeam = teams[0];
    hostTeam.isBot = false;
    hostTeam.name = hostName.slice(0, 24) || 'Host';
    hostTeam.ready = false;
    const authToken = generateId();

    const room: RoomInternal = {
      code,
      hostTeamId: hostTeam.id,
      settings,
      teams,
      status: 'lobby',
      draftOrderTeamIds: teams.map((t) => t.id),
      picks: [],
      currentOverallPick: 1,
      totalPicks: settings.teamCount * totalRosterSize(settings),
      pickDeadline: null,
      createdAt: Date.now(),
      authTokens: new Map([[hostTeam.id, authToken]]),
      draftedPlayerIds: new Set(),
      botWildness: new Map(),
      queues: new Map(),
      timer: null,
      lastActivityAt: Date.now(),
    };
    this.rooms.set(code, room);
    return { room, teamId: hostTeam.id, authToken };
  }

  joinRoom(code: string, name: string, requestedTeamId?: string) {
    const room = this.requireRoom(code);
    if (room.status !== 'lobby') throw new EngineError('Draft already underway in this room');

    let target: TeamSlot | undefined;
    if (requestedTeamId) {
      target = room.teams.find((t) => t.id === requestedTeamId && t.isBot);
      if (!target) throw new EngineError('That seat is unavailable');
    } else {
      target = room.teams.find((t) => t.isBot);
      if (!target) throw new EngineError('Room is full');
    }

    target.isBot = false;
    target.name = name.slice(0, 24) || `Team ${target.slotIndex + 1}`;
    target.ready = false;
    const authToken = generateId();
    room.authTokens.set(target.id, authToken);
    this.touch(room);
    this.broadcast(room);
    return { room, teamId: target.id, authToken };
  }

  peek(code: string) {
    const room = this.requireRoom(code);
    return room;
  }

  rejoin(code: string, teamId: string, authToken: string) {
    const room = this.requireRoom(code);
    this.requireAuth(room, teamId, authToken);
    return room;
  }

  updateSettings(code: string, teamId: string, authToken: string, settingsInput: Partial<DraftSettings>) {
    const room = this.requireRoom(code);
    this.requireAuth(room, teamId, authToken);
    if (teamId !== room.hostTeamId) throw new EngineError('Only the host can change settings');
    if (room.status !== 'lobby') throw new EngineError('Cannot change settings after the draft starts');

    const settings = sanitizeSettings({ ...room.settings, ...settingsInput });
    const humanIndexes = room.teams.filter((t) => !t.isBot).map((t) => t.slotIndex);
    const minAllowed = humanIndexes.length ? Math.max(...humanIndexes) + 1 : MIN_TEAMS;
    settings.teamCount = clamp(settings.teamCount, Math.max(minAllowed, MIN_TEAMS), MAX_TEAMS);

    room.settings = settings;
    room.teams = makeTeams(settings, room.teams);
    room.draftOrderTeamIds = room.teams.map((t) => t.id);
    room.totalPicks = settings.teamCount * totalRosterSize(settings);
    this.touch(room);
    this.broadcast(room);
    return room;
  }

  setReady(code: string, teamId: string, authToken: string, ready: boolean) {
    const room = this.requireRoom(code);
    this.requireAuth(room, teamId, authToken);
    if (room.status !== 'lobby') throw new EngineError('Draft already started');
    const team = room.teams.find((t) => t.id === teamId);
    if (!team) throw new EngineError('Team not found');
    team.ready = ready;
    this.touch(room);
    this.broadcast(room);

    const humans = room.teams.filter((t) => !t.isBot);
    if (room.settings.autoStartWhenReady && humans.length > 0 && humans.every((t) => t.ready)) {
      this.startDraft(code, room.hostTeamId, room.authTokens.get(room.hostTeamId)!, true);
    }
    return room;
  }

  renameTeam(code: string, teamId: string, authToken: string, name: string) {
    const room = this.requireRoom(code);
    this.requireAuth(room, teamId, authToken);
    const team = room.teams.find((t) => t.id === teamId);
    if (!team) throw new EngineError('Team not found');
    team.name = name.slice(0, 24) || team.name;
    this.touch(room);
    this.broadcast(room);
    return room;
  }

  switchSlot(code: string, teamId: string, authToken: string, targetTeamId: string) {
    const room = this.requireRoom(code);
    this.requireAuth(room, teamId, authToken);
    if (room.status !== 'lobby') throw new EngineError('Cannot change slots after the draft starts');
    if (targetTeamId === teamId) throw new EngineError('You are already in that slot');

    const current = room.teams.find((t) => t.id === teamId);
    const target = room.teams.find((t) => t.id === targetTeamId);
    if (!current) throw new EngineError('Team not found');
    // First come, first served: only an open (bot) slot can be claimed.
    if (!target || !target.isBot) throw new EngineError('That slot is already taken');

    const newAuthToken = generateId();
    target.isBot = false;
    target.name = current.name;
    target.ready = false;

    current.isBot = true;
    current.name = `Team ${current.slotIndex + 1}`;
    current.ready = true;

    room.authTokens.delete(teamId);
    room.authTokens.set(targetTeamId, newAuthToken);
    if (room.hostTeamId === teamId) room.hostTeamId = targetTeamId;

    this.touch(room);
    this.broadcast(room);
    return { room, teamId: targetTeamId, authToken: newAuthToken };
  }

  setQueue(code: string, teamId: string, authToken: string, playerIds: string[]) {
    const room = this.requireRoom(code);
    this.requireAuth(room, teamId, authToken);
    room.queues.set(teamId, playerIds);
    this.touch(room);
    return room;
  }

  startDraft(code: string, teamId: string, authToken: string, skipHostCheck = false) {
    const room = this.requireRoom(code);
    this.requireAuth(room, teamId, authToken);
    if (!skipHostCheck && teamId !== room.hostTeamId) throw new EngineError('Only the host can start the draft');
    if (room.status !== 'lobby') throw new EngineError('Draft already started');

    // draftOrderTeamIds already tracks slot order (see makeTeams / updateSettings) —
    // slot position IS draft position, so whoever claimed slot #4 in the lobby
    // picks 4th overall. No shuffling here.
    room.status = 'drafting';
    room.currentOverallPick = 1;
    room.picks = [];
    room.draftedPlayerIds.clear();
    for (const team of room.teams) room.botWildness.set(team.id, makeWildness());

    this.touch(room);
    this.broadcast(room);
    this.advance(room);
    return room;
  }

  private availablePlayers(room: RoomInternal): Player[] {
    return ADP_PLAYERS.filter((p) => !room.draftedPlayerIds.has(p.id));
  }

  private currentTeamId(room: RoomInternal): string {
    const loc = locateOverallPick(
      room.currentOverallPick,
      room.draftOrderTeamIds,
      room.settings.draftType,
      room.settings.thirdRoundReversal,
    );
    return loc.teamId;
  }

  private teamDraftedPositions(room: RoomInternal, teamId: string) {
    return room.picks
      .filter((p) => p.teamId === teamId)
      .map((p) => PLAYERS_BY_ID.get(p.playerId))
      .filter((p): p is Player => !!p)
      .map((p) => p.position);
  }

  private totalRounds(room: RoomInternal): number {
    return totalRosterSize(room.settings);
  }

  private pickPlayerForTeam(room: RoomInternal, teamId: string): Player {
    const available = this.availablePlayers(room);
    const queue = room.queues.get(teamId) ?? [];
    for (const pid of queue) {
      const p = available.find((pl) => pl.id === pid);
      if (p) return p;
    }
    const loc = locateOverallPick(room.currentOverallPick, room.draftOrderTeamIds, room.settings.draftType, room.settings.thirdRoundReversal);
    return selectBotPick({
      available,
      draftedPositionsForTeam: this.teamDraftedPositions(room, teamId),
      roster: room.settings.roster,
      round: loc.round,
      totalRounds: this.totalRounds(room),
      variance: room.settings.botVariance,
      wildness: room.botWildness.get(teamId) ?? 1,
    });
  }

  private applyPick(room: RoomInternal, teamId: string, player: Player, autopicked: boolean) {
    const loc = locateOverallPick(room.currentOverallPick, room.draftOrderTeamIds, room.settings.draftType, room.settings.thirdRoundReversal);
    const pick: Pick = {
      overallPick: room.currentOverallPick,
      round: loc.round,
      pickInRound: loc.pickInRound,
      teamId,
      playerId: player.id,
      madeAt: Date.now(),
      autopicked,
    };
    room.picks.push(pick);
    room.draftedPlayerIds.add(player.id);
    const queue = room.queues.get(teamId);
    if (queue) room.queues.set(teamId, queue.filter((id) => id !== player.id));
  }

  makePick(code: string, teamId: string, authToken: string, playerId: string) {
    const room = this.requireRoom(code);
    this.requireAuth(room, teamId, authToken);
    if (room.status !== 'drafting') throw new EngineError('Draft is not in progress');
    if (this.currentTeamId(room) !== teamId) throw new EngineError('It is not your turn to pick');
    if (room.draftedPlayerIds.has(playerId)) throw new EngineError('That player has already been drafted');
    const player = PLAYERS_BY_ID.get(playerId);
    if (!player) throw new EngineError('Unknown player');

    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }
    this.applyPick(room, teamId, player, false);
    this.touch(room);
    this.advance(room);
    return room;
  }

  private advance(room: RoomInternal) {
    if (room.picks.length >= room.totalPicks) {
      this.finishDraft(room);
      return;
    }

    room.currentOverallPick = room.picks.length + 1;
    const teamId = this.currentTeamId(room);
    const team = room.teams.find((t) => t.id === teamId)!;

    if (team.isBot) {
      room.pickDeadline = null;
      this.broadcast(room);
      const delay = BOT_PICK_DELAY_MIN_MS + Math.random() * (BOT_PICK_DELAY_MAX_MS - BOT_PICK_DELAY_MIN_MS);
      room.timer = setTimeout(() => {
        const player = this.pickPlayerForTeam(room, teamId);
        this.applyPick(room, teamId, player, true);
        this.advance(room);
      }, delay);
    } else {
      room.pickDeadline = Date.now() + room.settings.pickTimeSeconds * 1000;
      this.broadcast(room);
      room.timer = setTimeout(() => {
        const player = this.pickPlayerForTeam(room, teamId);
        this.applyPick(room, teamId, player, true);
        this.advance(room);
      }, room.settings.pickTimeSeconds * 1000);
    }
  }

  getResults(code: string) {
    const room = this.requireRoom(code);
    if (room.status !== 'complete') throw new EngineError('Draft has not finished yet');
    return gradeDraft(sanitizeRoom(room), PLAYERS_BY_ID);
  }

  private finishDraft(room: RoomInternal) {
    room.status = 'complete';
    room.pickDeadline = null;
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }
    this.touch(room);
    this.broadcast(room);
    const results = gradeDraft(sanitizeRoom(room), PLAYERS_BY_ID);
    this.io.to(room.code).emit('draft:complete', { teamGrades: results });
  }
}
