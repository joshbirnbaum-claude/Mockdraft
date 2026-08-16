export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'DST' | 'K';

export interface Player {
  id: string;
  name: string;
  team: string;
  position: Position;
  adpRank: number;
  posRank: number;
  bye: number;
}

export type SlotType = 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'DST' | 'K' | 'BENCH';

export interface RosterSettings {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number;
  DST: number;
  K: number;
  BENCH: number;
}

export type DraftType = 'snake' | 'linear';
export type ScoringType = 'PPR' | 'HALF_PPR' | 'STANDARD';

export interface DraftSettings {
  teamCount: number;
  roster: RosterSettings;
  draftType: DraftType;
  pickTimeSeconds: number;
  scoring: ScoringType;
  botVariance: number; // 0 (chalk, follows ADP tightly) - 1 (wild, big deviation)
  thirdRoundReversal: boolean;
  autoStartWhenReady: boolean;
}

export interface TeamSlot {
  id: string;
  slotIndex: number;
  name: string;
  isBot: boolean;
  ownerId: string | null;
  ready: boolean;
  avatarColor: string;
}

export interface Pick {
  overallPick: number;
  round: number;
  pickInRound: number;
  teamId: string;
  playerId: string;
  madeAt: number;
  autopicked: boolean;
}

export type RoomStatus = 'lobby' | 'drafting' | 'complete';

export interface RoomState {
  code: string;
  hostTeamId: string;
  settings: DraftSettings;
  teams: TeamSlot[];
  status: RoomStatus;
  draftOrderTeamIds: string[];
  picks: Pick[];
  currentOverallPick: number;
  totalPicks: number;
  pickDeadline: number | null;
  createdAt: number;
}

export interface GradedPick {
  pick: Pick;
  player: Player;
  valueOverAdp: number; // adpRank - overallPick; positive = steal, negative = reach
  tag: 'steal' | 'reach' | 'fair';
}

export interface TeamGrade {
  teamId: string;
  teamName: string;
  isBot: boolean;
  letterGrade: string;
  score: number; // z-score based
  starterValue: number;
  benchValue: number;
  avgValueOverAdp: number;
  bestPick: GradedPick | null;
  worstPick: GradedPick | null;
  starters: Record<SlotType, GradedPick[]>;
  bench: GradedPick[];
  allPicks: GradedPick[];
}

export interface DraftResults {
  teamGrades: TeamGrade[];
}

// Socket event payloads

export interface CreateRoomRequest {
  hostName: string;
  settings: DraftSettings;
}

export interface CreateRoomResponse {
  room: RoomState;
  teamId: string;
  authToken: string;
}

export interface JoinRoomRequest {
  code: string;
  name: string;
  teamId?: string; // claim a specific open/bot slot, otherwise first open slot
}

export interface JoinRoomResponse {
  room: RoomState;
  teamId: string;
  authToken: string;
}

export interface RejoinRoomRequest {
  code: string;
  teamId: string;
  authToken: string;
}

export interface ErrorResponse {
  message: string;
}
