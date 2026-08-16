import { useMemo } from 'react';
import { allPickLocations } from '../../lib/draftMath';
import { POSITION_COLORS } from '../../lib/positions';
import type { Player, RoomState } from '../../../../shared/types';

interface Props {
  room: RoomState;
  playersById: Map<string, Player>;
  myTeamId: string | null;
}

export default function DraftBoard({ room, playersById, myTeamId }: Props) {
  const locations = useMemo(() => allPickLocations(room), [room.totalPicks, room.draftOrderTeamIds, room.settings]);
  const picksByOverall = useMemo(() => new Map(room.picks.map((p) => [p.overallPick, p])), [room.picks]);
  const rounds = useMemo(() => {
    const max = Math.max(1, ...locations.map((l) => l.round));
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [locations]);

  const teamsInOrder = room.draftOrderTeamIds.map((id) => room.teams.find((t) => t.id === id)).filter(Boolean) as RoomState['teams'];

  return (
    <div className="overflow-auto scrollbar-thin">
      <table className="w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="w-8 sticky left-0 z-10 bg-field-950" />
            {teamsInOrder.map((t) => (
              <th key={t.id} className="min-w-[92px] px-1 pb-1 text-center font-normal">
                <div
                  className={`truncate rounded-md px-1.5 py-1 text-[11px] font-semibold ${
                    t.id === myTeamId ? 'text-accent-300' : 'text-slate-300'
                  }`}
                  style={{ background: `${t.avatarColor}22`, border: `1px solid ${t.avatarColor}55` }}
                  title={t.name}
                >
                  {t.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rounds.map((round) => (
            <tr key={round}>
              <td className="sticky left-0 z-10 bg-field-950 text-center text-[11px] font-semibold text-slate-500">{round}</td>
              {teamsInOrder.map((t) => {
                const loc = locations.find((l) => l.round === round && l.teamId === t.id);
                if (!loc) return <td key={t.id} />;
                const pick = picksByOverall.get(loc.overallPick);
                const player = pick ? playersById.get(pick.playerId) : null;
                const isCurrent = room.status === 'drafting' && room.currentOverallPick === loc.overallPick;
                return (
                  <td key={t.id} className="p-0">
                    <div
                      className={`min-w-[92px] rounded-md border px-1.5 py-1 ${
                        isCurrent
                          ? 'border-accent-400 bg-accent-500/10 pulse-ring'
                          : player
                            ? 'border-white/10 bg-white/[0.03]'
                            : 'border-white/5 bg-transparent'
                      }`}
                    >
                      {player ? (
                        <>
                          <div className="flex items-center gap-1">
                            <span
                              className={`rounded border px-1 text-[9px] font-bold leading-tight ${POSITION_COLORS[player.position]}`}
                            >
                              {player.position}
                            </span>
                            <span className="text-[9px] text-slate-500">{loc.overallPick}</span>
                          </div>
                          <div className="truncate text-[11px] font-medium text-slate-200">{player.name}</div>
                        </>
                      ) : (
                        <div className="py-1.5 text-center text-[10px] text-slate-600">{isCurrent ? 'on clock' : '—'}</div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
