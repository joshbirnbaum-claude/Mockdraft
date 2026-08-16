import { customAlphabet } from 'nanoid';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
export const generateRoomCode = customAlphabet(ROOM_CODE_ALPHABET, 6);

const idAlphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const generateId = customAlphabet(idAlphabet, 12);

const TEAM_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b',
];

export function colorForSlot(index: number): string {
  return TEAM_COLORS[index % TEAM_COLORS.length];
}
