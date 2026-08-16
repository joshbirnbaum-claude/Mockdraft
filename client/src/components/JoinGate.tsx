import { useState } from 'react';
import { loadDisplayName } from '../api/session';
import type { RoomState } from '../../../shared/types';

interface Props {
  room: RoomState;
  onJoin: (name: string, teamId?: string) => Promise<void>;
}

export default function JoinGate({ room, onJoin }: Props) {
  const [name, setName] = useState(loadDisplayName());
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openSeats = room.teams.filter((t) => t.isBot);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name');
    setBusy(true);
    setError(null);
    try {
      await onJoin(name.trim(), selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="card p-6 shadow-glow">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-accent-400">Room {room.code}</p>
        <h1 className="mb-1 font-display text-2xl font-bold text-white">
          {room.teams.find((t) => t.id === room.hostTeamId)?.name}'s draft
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          {room.settings.teamCount}-team {room.settings.draftType} draft &middot; {room.settings.scoring.replace('_', ' ')} &middot;{' '}
          {room.settings.pickTimeSeconds}s clock &middot; {room.teams.filter((t) => !t.isBot).length}/{room.settings.teamCount} joined
        </p>

        {room.status !== 'lobby' ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            This draft has already {room.status === 'complete' ? 'finished' : 'started'}. You can still spectate.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Your name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent-500/50"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                Pick a seat (optional)
              </label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                <button
                  type="button"
                  onClick={() => setSelected(undefined)}
                  className={`rounded-md border px-2 py-2 text-xs ${
                    selected === undefined ? 'border-accent-500 bg-accent-500/10 text-accent-300' : 'border-white/10 bg-white/5 text-slate-400'
                  }`}
                >
                  Any open
                </button>
                {room.teams.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    disabled={!t.isBot}
                    onClick={() => setSelected(t.id)}
                    className={`rounded-md border px-2 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-30 ${
                      selected === t.id ? 'border-accent-500 bg-accent-500/10 text-accent-300' : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    #{t.slotIndex + 1} {t.isBot ? '' : t.name}
                  </button>
                ))}
              </div>
              {openSeats.length === 0 && <p className="mt-2 text-xs text-rose-400">Room is full — try another code.</p>}
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              disabled={busy || openSeats.length === 0}
              className="w-full rounded-lg bg-accent-500 py-2.5 font-display font-semibold text-field-950 transition hover:bg-accent-400 disabled:opacity-50"
            >
              {busy ? 'Joining…' : 'Join draft'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
