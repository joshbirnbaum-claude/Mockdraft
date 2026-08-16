import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Player, Position } from '../../../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '../../../shared/data/adp.csv');

function parseCsv(raw: string): Omit<Player, 'posRank'>[] {
  const lines = raw.trim().split('\n');
  const [, ...rows] = lines; // skip header
  return rows
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [rank, name, team, position, bye] = line.split(',');
      return {
        id: `p_${rank.trim()}`,
        name: name.trim(),
        team: team.trim(),
        position: position.trim() as Position,
        adpRank: Number(rank.trim()),
        bye: Number(bye.trim()),
      };
    });
}

// posRank is derived from adpRank order (not CSV line order), so rows can be
// inserted anywhere in the file — e.g. a mid-season trade or a rookie slotted
// into their real ADP tier — without needing to keep the file hand-sorted.
function assignPosRanks(players: Omit<Player, 'posRank'>[]): Player[] {
  const sorted = [...players].sort((a, b) => a.adpRank - b.adpRank);
  const byPosition = new Map<Position, number>();
  return sorted.map((p) => {
    const posRank = (byPosition.get(p.position) ?? 0) + 1;
    byPosition.set(p.position, posRank);
    return { ...p, posRank };
  });
}

export const ADP_PLAYERS: Player[] = assignPosRanks(parseCsv(readFileSync(CSV_PATH, 'utf-8')));

export const PLAYERS_BY_ID: Map<string, Player> = new Map(ADP_PLAYERS.map((p) => [p.id, p]));
