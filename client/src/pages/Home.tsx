import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsForm from '../components/SettingsForm';
import { RoomApi } from '../api/rooms';
import { saveSeat, loadDisplayName, saveDisplayName } from '../api/session';
import { DEFAULT_SETTINGS } from '../../../shared/rosterPresets';
import type { DraftSettings } from '../../../shared/types';

export default function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState(loadDisplayName());
  const [settings, setSettings] = useState<DraftSettings>(DEFAULT_SETTINGS);
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Enter your name first');
    setBusy(true);
    try {
      saveDisplayName(name.trim());
      const res = await RoomApi.create(name.trim(), settings);
      saveSeat(res.room.code, { teamId: res.teamId, authToken: res.authToken });
      navigate(`/room/${res.room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setBusy(false);
    }
  }

  function goJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    navigate(`/room/${joinCode.trim().toUpperCase()}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <header className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-400">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
          No lobbies. No waiting. Draft on your terms.
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Instant Mocks</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Spin up a fantasy mock draft room right now. Invite friends, fill the rest with ADP-driven bots, and draft
          the second everyone's ready &mdash; then get your roster graded.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={createRoom} className="card lg:col-span-3 p-6 shadow-glow">
          <h2 className="mb-4 font-display text-lg font-semibold text-white">Create a draft room</h2>
          <div className="mb-5">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Josh"
              maxLength={24}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent-500/50"
            />
          </div>
          <SettingsForm value={settings} onChange={setSettings} />
          {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
          <button
            disabled={busy}
            className="mt-6 w-full rounded-lg bg-accent-500 py-2.5 font-display font-semibold text-field-950 transition hover:bg-accent-400 disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create room'}
          </button>
        </form>

        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={goJoin} className="card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-white">Join a draft</h2>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Room code</label>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="mb-4 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-center font-display text-lg tracking-[0.3em] outline-none focus:border-accent-500/50"
            />
            <button className="w-full rounded-lg border border-white/15 bg-white/5 py-2.5 font-display font-semibold text-white transition hover:bg-white/10">
              Go to room
            </button>
          </form>

          <div className="card space-y-3 p-6 text-sm text-slate-400">
            <h3 className="font-display text-sm font-semibold text-white">How it works</h3>
            <ul className="space-y-2">
              <li>1. Set your league size and roster — every open seat starts as a bot.</li>
              <li>2. Share the room code. Friends claim seats and hit ready.</li>
              <li>3. The draft opens the instant everyone's in — no scheduled start.</li>
              <li>4. Bots draft off ESPN PPR ADP with realistic variance, not a script.</li>
              <li>5. When the last pick is in, every roster gets graded instantly.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
