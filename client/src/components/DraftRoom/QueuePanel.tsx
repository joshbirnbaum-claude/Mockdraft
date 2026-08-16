import { POSITION_COLORS } from '../../lib/positions';
import type { Player } from '../../../../shared/types';

interface Props {
  queue: string[];
  playersById: Map<string, Player>;
  onRemove: (playerId: string) => void;
  onMove: (playerId: string, dir: -1 | 1) => void;
}

export default function QueuePanel({ queue, playersById, onRemove, onMove }: Props) {
  if (queue.length === 0) {
    return (
      <div>
        <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Queue</h3>
        <p className="text-xs text-slate-600">
          Star players in the pool to queue them up — if the clock runs out, we'll draft your top queued pick automatically.
        </p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Queue</h3>
      <ol className="space-y-1">
        {queue.map((id, i) => {
          const p = playersById.get(id);
          if (!p) return null;
          return (
            <li key={id} className="flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5">
              <span className="w-4 text-[11px] text-slate-500">{i + 1}</span>
              <span className={`rounded border px-1 text-[9px] font-bold ${POSITION_COLORS[p.position]}`}>{p.position}</span>
              <span className="truncate text-sm text-slate-200">{p.name}</span>
              <div className="ml-auto flex gap-1">
                <button disabled={i === 0} onClick={() => onMove(id, -1)} className="text-slate-500 hover:text-white disabled:opacity-20">
                  ↑
                </button>
                <button disabled={i === queue.length - 1} onClick={() => onMove(id, 1)} className="text-slate-500 hover:text-white disabled:opacity-20">
                  ↓
                </button>
                <button onClick={() => onRemove(id)} className="text-slate-500 hover:text-rose-400">
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
