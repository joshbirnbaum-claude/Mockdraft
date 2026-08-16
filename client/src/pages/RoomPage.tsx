import { useParams, Link } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { usePlayers } from '../hooks/usePlayers';
import JoinGate from '../components/JoinGate';
import Lobby from '../components/Lobby';
import DraftRoom from '../components/DraftRoom/DraftRoom';
import ResultsPage from './ResultsPage';

export default function RoomPage() {
  const { code = '' } = useParams();
  const { room, seat, phase, results, join, updateSettings, setReady, rename, start, pick, setQueue } = useRoom(code.toUpperCase());
  const { players, loading: playersLoading } = usePlayers();

  if (phase === 'loading' || (room && playersLoading)) {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-500">Loading room…</div>;
  }

  if (phase === 'not-found' || !room) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="mb-2 font-display text-2xl font-bold text-white">Room not found</h1>
        <p className="mb-6 text-slate-400">That draft room doesn't exist or has expired.</p>
        <Link to="/" className="rounded-lg bg-accent-500 px-4 py-2 font-display font-semibold text-field-950">
          Back home
        </Link>
      </div>
    );
  }

  if (phase === 'need-join') {
    return <JoinGate room={room} onJoin={join} />;
  }

  if (room.status === 'complete') {
    if (!results) {
      return <div className="flex min-h-[60vh] items-center justify-center text-slate-500">Grading rosters…</div>;
    }
    return <ResultsPage room={room} results={results} myTeamId={seat?.teamId ?? null} />;
  }

  if (room.status === 'lobby') {
    return (
      <Lobby room={room} myTeamId={seat!.teamId} onReady={setReady} onRename={rename} onSettings={updateSettings} onStart={start} />
    );
  }

  return <DraftRoom room={room} myTeamId={seat?.teamId ?? null} players={players} onPick={pick} onSetQueue={setQueue} />;
}
