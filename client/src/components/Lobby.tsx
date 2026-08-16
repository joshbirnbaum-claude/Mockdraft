import { useState } from 'react';
import SettingsForm from './SettingsForm';
import type { DraftSettings, RoomState } from '../../../shared/types';

interface Props {
  room: RoomState;
  myTeamId: string;
  onReady: (ready: boolean) => Promise<unknown>;
  onRename: (name: string) => Promise<unknown>;
  onSwitchSlot: (targetTeamId: string) => Promise<unknown>;
  onSettings: (settings: Partial<DraftSettings>) => Promise<unknown>;
  onStart: () => Promise<unknown>;
}

export default function Lobby({ room, myTeamId, onReady, onRename, onSwitchSlot, onSettings, onStart }: Props) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const me = room.teams.find((t) => t.id === myTeamId)!;
  const isHost = myTeamId === room.hostTeamId;
  const humans = room.teams.filter((t) => !t.isBot);
  const allReady = humans.length > 0 && humans.every((t) => t.ready);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  }

  function flashCopied(which: 'code' | 'link') {
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  function copyCode() {
    navigator.clipboard?.writeText(room.code).catch(() => {});
    flashCopied('code');
  }

  function copyLink() {
    const url = `${window.location.origin}/room/${room.code}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    flashCopied('link');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-accent-400">Room code — share this to invite friends</p>
          <button
            onClick={copyCode}
            title="Click to copy room code"
            className="group flex items-center gap-2 rounded-md -ml-1 px-1 py-0.5 hover:bg-white/5"
          >
            <h1 className="font-display text-4xl font-bold tracking-[0.2em] text-white">{room.code}</h1>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-400 opacity-0 transition group-hover:opacity-100">
              {copied === 'code' ? 'Copied!' : 'Copy'}
            </span>
          </button>
        </div>
        <button
          onClick={copyLink}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
        >
          {copied === 'link' ? 'Link copied!' : 'Copy invite link'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="mb-1 font-display text-sm font-semibold uppercase tracking-wide text-slate-400">
              Draft slots ({humans.length}/{room.settings.teamCount} filled)
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              Slot number = draft position. First come, first served — switch to any open slot below.
            </p>
            <ul className="space-y-2">
              {room.teams.map((t) => (
                <li
                  key={t.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                    t.id === myTeamId ? 'border-accent-500/40 bg-accent-500/5' : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.avatarColor }} />
                    <span className="text-xs text-slate-500">#{t.slotIndex + 1}</span>
                    {editingName && t.id === myTeamId ? (
                      <input
                        autoFocus
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        onBlur={() => {
                          setEditingName(false);
                          if (nameDraft.trim() && nameDraft !== t.name) run('rename', () => onRename(nameDraft.trim()));
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        maxLength={24}
                        className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-sm"
                      />
                    ) : (
                      <button
                        disabled={t.id !== myTeamId}
                        onClick={() => {
                          setNameDraft(t.name);
                          setEditingName(true);
                        }}
                        className={`text-sm font-medium ${t.isBot ? 'text-slate-500' : 'text-slate-100'} ${t.id === myTeamId ? 'hover:underline' : ''}`}
                      >
                        {t.name}
                        {t.id === room.hostTeamId && ' 👑'}
                        {t.id === myTeamId && ' (you)'}
                      </button>
                    )}
                    {t.isBot && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                        Bot
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {t.isBot && t.id !== myTeamId && (
                      <button
                        disabled={busy === `switch-${t.id}`}
                        onClick={() => run(`switch-${t.id}`, () => onSwitchSlot(t.id))}
                        className="rounded-md border border-accent-500/30 bg-accent-500/10 px-2 py-0.5 text-[11px] font-medium text-accent-300 hover:bg-accent-500/20 disabled:opacity-50"
                      >
                        Take slot #{t.slotIndex + 1}
                      </button>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        t.ready ? 'bg-accent-500/15 text-accent-400' : 'bg-white/5 text-slate-500'
                      }`}
                    >
                      {t.isBot ? 'Auto-fills' : t.ready ? 'Ready' : 'Not ready'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <p className="mb-3 text-sm text-slate-400">
              Every open seat drafts as a bot using ESPN PPR ADP. Fill more seats or start whenever you're ready.
            </p>
            {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}
            <div className="flex gap-3">
              <button
                disabled={busy === 'ready'}
                onClick={() => run('ready', () => onReady(!me.ready))}
                className={`flex-1 rounded-lg py-2.5 font-display font-semibold transition ${
                  me.ready ? 'border border-white/15 bg-white/5 text-white hover:bg-white/10' : 'bg-accent-500 text-field-950 hover:bg-accent-400'
                }`}
              >
                {me.ready ? 'Unready' : "I'm ready"}
              </button>
              {isHost && (
                <button
                  disabled={busy === 'start'}
                  onClick={() => run('start', onStart)}
                  className="flex-1 rounded-lg border border-accent-500/40 bg-accent-500/10 py-2.5 font-display font-semibold text-accent-300 hover:bg-accent-500/20"
                >
                  Start draft now
                </button>
              )}
            </div>
            {room.settings.autoStartWhenReady && (
              <p className="mt-3 text-center text-xs text-slate-500">
                {allReady ? 'Everyone is ready — starting…' : 'Auto-starts the instant every human seat is ready.'}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card p-5">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-slate-400">
              Settings {!isHost && <span className="normal-case text-slate-600">(host only)</span>}
            </h2>
            <SettingsForm
              value={room.settings}
              disabled={!isHost}
              onChange={(next) => isHost && run('settings', () => onSettings(next))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
