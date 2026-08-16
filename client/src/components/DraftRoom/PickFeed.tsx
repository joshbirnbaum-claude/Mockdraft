import { POSITION_COLORS } from '../../lib/positions';
import type { Pick, Player, TeamSlot } from '../../../../shared/types';

interface Props {
  picks: Pick[];
  playersById: Map<string, Player>;
  teamsById: Map<string, TeamSlot>;
}

export default function PickFeed({ picks, playersById, teamsById }: Props) {
  const recent = [...picks].sort((a, b) => b.overallPick - a.overallPick).slice(0, 25);
  return (
    <div>
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Recent picks</h3>
      <ul className="space-y-1.5">
        {recent.map((pick) => {
          const p = playersById.get(pick.playerId);
          const t = teamsById.get(pick.teamId);
          if (!p || !t) return null;
          return (
            <li key={pick.overallPick} className="flex items-center gap-2 text-xs">
              <span className="w-8 shrink-0 text-slate-600">{pick.overallPick}.</span>
              <span className={`rounded border px-1 text-[9px] font-bold ${POSITION_COLORS[p.position]}`}>{p.position}</span>
              <span className="truncate text-slate-200">{p.name}</span>
              <span className="ml-auto flex items-center gap-1 truncate text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.avatarColor }} />
                {t.name}
                {pick.autopicked && <span className="text-slate-600">(auto)</span>}
              </span>
            </li>
          );
        })}
        {recent.length === 0 && <p className="text-xs text-slate-600">No picks yet.</p>}
      </ul>
    </div>
  );
}
