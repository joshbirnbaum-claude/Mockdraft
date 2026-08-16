import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PickTimer from './PickTimer';
import DraftBoard from './DraftBoard';
import PlayerPool from './PlayerPool';
import RosterPanel from './RosterPanel';
import QueuePanel from './QueuePanel';
import PickFeed from './PickFeed';
import { availablePlayers, currentLocation, nextPickOverallForTeam } from '../../lib/draftMath';
import type { Player, RoomState } from '../../../../shared/types';

interface Props {
  room: RoomState;
  myTeamId: string | null;
  players: Player[];
  onPick: (playerId: string) => Promise<unknown>;
  onSetQueue: (playerIds: string[]) => Promise<unknown>;
}

export default function DraftRoom({ room, myTeamId, players, onPick, onSetQueue }: Props) {
  const [queue, setQueue] = useState<string[]>([]);
  const [busyPlayerId, setBusyPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [boardExpanded, setBoardExpanded] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const teamsById = useMemo(() => new Map(room.teams.map((t) => [t.id, t])), [room.teams]);
  const pool = useMemo(() => availablePlayers(room, players), [room, players]);
  const loc = currentLocation(room);
  const onClockTeam = loc ? teamsById.get(loc.teamId) : null;
  const isMyTurn = !!myTeamId && loc?.teamId === myTeamId;
  const nextMyPick = useMemo(
    () => (myTeamId ? nextPickOverallForTeam(room, myTeamId) : null),
    [room.status, room.currentOverallPick, room.draftOrderTeamIds, room.settings, myTeamId],
  );
  const picksUntilMyTurn = nextMyPick !== null && nextMyPick > room.currentOverallPick ? nextMyPick - room.currentOverallPick : null;

  useEffect(() => {
    setQueue((q) => q.filter((id) => pool.some((p) => p.id === id)));
  }, [pool]);

  function queueChange(next: string[]) {
    setQueue(next);
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => onSetQueue(next).catch(() => {}), 300);
  }

  function toggleQueue(playerId: string) {
    queueChange(queue.includes(playerId) ? queue.filter((id) => id !== playerId) : [...queue, playerId]);
  }

  function moveQueue(playerId: string, dir: -1 | 1) {
    const idx = queue.indexOf(playerId);
    const next = [...queue];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    queueChange(next);
  }

  async function draft(playerId: string) {
    setBusyPlayerId(playerId);
    setError(null);
    try {
      await onPick(playerId);
      setQueue((q) => q.filter((id) => id !== playerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pick failed');
    } finally {
      setBusyPlayerId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-field-900/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-300">
            ← Home
          </Link>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Room {room.code} &middot; Round {loc?.round ?? '—'} of{' '}
              {Math.ceil(room.totalPicks / room.settings.teamCount)} &middot; Pick {room.currentOverallPick}/{room.totalPicks}
            </p>
            <p className="font-display text-sm font-semibold text-white">
              {isMyTurn ? "You're on the clock!" : `${onClockTeam?.name ?? '—'} is picking`}
            </p>
          </div>
        </div>
        <PickTimer deadline={room.pickDeadline} totalSeconds={room.settings.pickTimeSeconds} label={onClockTeam?.name ?? ''} />
      </div>

      {error && <p className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="card flex h-[62vh] flex-col overflow-hidden lg:col-span-8">
          <PlayerPool
            players={pool}
            canDraft={isMyTurn}
            busyPlayerId={busyPlayerId}
            queue={queue}
            picksUntilMyTurn={picksUntilMyTurn}
            onDraft={draft}
            onToggleQueue={toggleQueue}
          />
        </div>
        <div className="card space-y-6 overflow-auto p-4 lg:col-span-4 lg:h-[62vh]">
          {myTeamId && <RosterPanel room={room} teamId={myTeamId} players={players} />}
          <QueuePanel queue={queue} playersById={playersById} onRemove={(id) => toggleQueue(id)} onMove={moveQueue} />
          <PickFeed picks={room.picks} playersById={playersById} teamsById={teamsById} />
        </div>
      </div>

      <div className="card mt-4 p-4">
        <button onClick={() => setBoardExpanded((v) => !v)} className="mb-3 text-xs font-medium text-accent-400 hover:underline">
          {boardExpanded ? 'Collapse full board ▲' : 'Show full draft board ▼'}
        </button>
        <div className={boardExpanded ? '' : 'max-h-64 overflow-auto'}>
          <DraftBoard room={room} playersById={playersById} myTeamId={myTeamId} />
        </div>
      </div>
    </div>
  );
}
