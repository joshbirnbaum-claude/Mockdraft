import { Fragment, useMemo, useState } from 'react';
import { POSITION_COLORS } from '../../lib/positions';
import type { Player, Position } from '../../../../shared/types';

interface Props {
  players: Player[];
  canDraft: boolean;
  busyPlayerId: string | null;
  queue: string[];
  /** Picks remaining until this viewer is next on the clock, or null if not applicable (spectator, already on the clock, etc). */
  picksUntilMyTurn: number | null;
  onDraft: (playerId: string) => void;
  onToggleQueue: (playerId: string) => void;
}

const TABS: ('ALL' | Position)[] = ['ALL', 'QB', 'RB', 'WR', 'TE', 'DST', 'K'];

export default function PlayerPool({ players, canDraft, busyPlayerId, queue, picksUntilMyTurn, onDraft, onToggleQueue }: Props) {
  const [tab, setTab] = useState<'ALL' | Position>('ALL');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (tab !== 'ALL' && p.position !== tab) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [players, tab, search]);

  // Rough estimate of who'll still be on the board at your next turn: assume the
  // next `picksUntilMyTurn` picks (across all teams/positions) go roughly by ADP,
  // so the top N available players right now are the ones likely gone by then.
  const likelyGoneIds = useMemo(() => {
    if (!picksUntilMyTurn) return null;
    return new Set(players.slice(0, picksUntilMyTurn).map((p) => p.id));
  }, [players, picksUntilMyTurn]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search player or team…"
          className="min-w-[160px] flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-accent-500/50"
        />
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                tab === t ? 'bg-accent-500 text-field-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-field-900/95 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">ADP</th>
              <th className="px-3 py-2 font-medium">Player</th>
              <th className="px-3 py-2 font-medium">Pos</th>
              <th className="px-3 py-2 font-medium">Team</th>
              <th className="px-3 py-2 font-medium">Bye</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {(() => {
              let dividerShown = false;
              return filtered.map((p) => {
                const queued = queue.includes(p.id);
                const showDividerBefore = !!likelyGoneIds && !dividerShown && !likelyGoneIds.has(p.id);
                if (showDividerBefore) dividerShown = true;
                return (
                  <Fragment key={p.id}>
                    {showDividerBefore && (
                      <tr>
                        <td colSpan={6} className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-accent-400/40" />
                            <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-accent-400">
                              Your pick likely lands here (~{picksUntilMyTurn} picks)
                            </span>
                            <div className="h-px flex-1 bg-accent-400/40" />
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-white/5 hover:bg-white/[0.03]">
                      <td className="px-3 py-2 text-slate-500">{p.adpRank}</td>
                      <td className="px-3 py-2 font-medium text-slate-100">{p.name}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${POSITION_COLORS[p.position]}`}>
                          {p.position}
                          {p.posRank}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400">{p.team}</td>
                      <td className="px-3 py-2 text-slate-500">{p.bye}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => onToggleQueue(p.id)}
                            title={queued ? 'Remove from queue' : 'Add to queue'}
                            className={`rounded-md border px-2 py-1 text-xs ${
                              queued ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            {queued ? '★' : '☆'}
                          </button>
                          <button
                            disabled={!canDraft || busyPlayerId === p.id}
                            onClick={() => onDraft(p.id)}
                            className="rounded-md bg-accent-500 px-2.5 py-1 text-xs font-semibold text-field-950 transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-600"
                          >
                            {busyPlayerId === p.id ? '…' : 'Draft'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                );
              });
            })()}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-600">
                  No players match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
