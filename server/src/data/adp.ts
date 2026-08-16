import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Player, Position } from '../../../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '../../../shared/data/adp.csv');

function parseCsv(raw: string): Player[] {
  const lines = raw.trim().split('\n');
  const [, ...rows] = lines; // skip header
  const byPosition = new Map<Position, number>();
  return rows
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [rank, name, team, position, bye] = line.split(',');
      const pos = position.trim() as Position;
      const nextPosRank = (byPosition.get(pos) ?? 0) + 1;
      byPosition.set(pos, nextPosRank);
      return {
        id: `p_${rank.trim()}`,
        name: name.trim(),
        team: team.trim(),
        position: pos,
        adpRank: Number(rank.trim()),
        posRank: nextPosRank,
        bye: Number(bye.trim()),
      } satisfies Player;
    });
}

export const ADP_PLAYERS: Player[] = parseCsv(readFileSync(CSV_PATH, 'utf-8')).sort(
  (a, b) => a.adpRank - b.adpRank,
);

export const PLAYERS_BY_ID: Map<string, Player> = new Map(ADP_PLAYERS.map((p) => [p.id, p]));
