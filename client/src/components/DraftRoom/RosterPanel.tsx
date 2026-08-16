import { assignRosterSlots, rosterSlotList } from '../../lib/draftMath';
import { POSITION_COLORS, SLOT_LABELS } from '../../lib/positions';
import type { Player, RoomState } from '../../../../shared/types';

interface Props {
  room: RoomState;
  teamId: string;
  players: Player[];
  title?: string;
}

export default function RosterPanel({ room, teamId, players, title = 'Your roster' }: Props) {
  const slots = rosterSlotList(room);
  const assigned = assignRosterSlots(room, teamId, players);
  const cursors: Record<string, number> = {};

  return (
    <div>
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <ul className="space-y-1">
        {slots.map((slot, i) => {
          const idx = cursors[slot] ?? 0;
          cursors[slot] = idx + 1;
          const player = assigned[slot][idx];
          return (
            <li
              key={`${slot}-${i}`}
              className="flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
            >
              <span className="w-11 shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {SLOT_LABELS[slot]}
              </span>
              {player ? (
                <>
                  <span className={`rounded border px-1 text-[9px] font-bold ${POSITION_COLORS[player.position]}`}>
                    {player.position}
                  </span>
                  <span className="truncate text-sm text-slate-100">{player.name}</span>
                  <span className="ml-auto text-[10px] text-slate-500">Bye {player.bye}</span>
                </>
              ) : (
                <span className="text-sm text-slate-600">Empty</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
