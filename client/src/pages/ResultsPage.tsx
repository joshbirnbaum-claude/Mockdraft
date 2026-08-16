import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GradeCard from '../components/Results/GradeCard';
import TeamDetail from '../components/Results/TeamDetail';
import type { DraftResults, RoomState } from '../../../shared/types';

interface Props {
  room: RoomState;
  results: DraftResults;
  myTeamId: string | null;
}

export default function ResultsPage({ room, results, myTeamId }: Props) {
  const [selected, setSelected] = useState<string | null>(myTeamId);

  useEffect(() => {
    if (!selected) setSelected(myTeamId ?? results.teamGrades[0]?.teamId ?? null);
  }, [myTeamId, results, selected]);

  const active = results.teamGrades.find((g) => g.teamId === selected) ?? results.teamGrades[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-accent-400">Draft complete</p>
          <h1 className="font-display text-3xl font-bold text-white">Room {room.code} results</h1>
        </div>
        <Link
          to="/"
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
        >
          Start another mock
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {results.teamGrades.map((g) => (
          <GradeCard key={g.teamId} grade={g} isMe={g.teamId === myTeamId} selected={g.teamId === active?.teamId} onSelect={() => setSelected(g.teamId)} />
        ))}
      </div>

      {active && <TeamDetail grade={active} />}
    </div>
  );
}
