import { DEFAULT_SETTINGS, MAX_TEAMS, MIN_TEAMS, MAX_PICK_SECONDS, MIN_PICK_SECONDS } from '../../../shared/rosterPresets';
import type { DraftSettings, RosterSettings } from '../../../shared/types';

interface Props {
  value: DraftSettings;
  onChange: (next: DraftSettings) => void;
  disabled?: boolean;
  minTeamCount?: number;
}

const ROSTER_FIELDS: { key: keyof RosterSettings; label: string }[] = [
  { key: 'QB', label: 'QB' },
  { key: 'RB', label: 'RB' },
  { key: 'WR', label: 'WR' },
  { key: 'TE', label: 'TE' },
  { key: 'FLEX', label: 'FLEX' },
  { key: 'DST', label: 'D/ST' },
  { key: 'K', label: 'K' },
  { key: 'BENCH', label: 'Bench' },
];

function NumberStepper({ value, onChange, min = 0, max = 10, disabled }: { value: number; onChange: (v: number) => void; min?: number; max?: number; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        className="h-7 w-7 rounded-md border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30"
      >
        −
      </button>
      <span className="w-6 text-center font-display text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        className="h-7 w-7 rounded-md border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

export default function SettingsForm({ value, onChange, disabled, minTeamCount = MIN_TEAMS }: Props) {
  const set = (patch: Partial<DraftSettings>) => onChange({ ...value, ...patch });
  const setRoster = (key: keyof RosterSettings, n: number) =>
    onChange({ ...value, roster: { ...value.roster, [key]: Math.max(0, n) } });

  const totalRounds =
    value.roster.QB + value.roster.RB + value.roster.WR + value.roster.TE + value.roster.FLEX + value.roster.DST + value.roster.K + value.roster.BENCH;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Teams</label>
          <NumberStepper
            value={value.teamCount}
            min={minTeamCount}
            max={MAX_TEAMS}
            disabled={disabled}
            onChange={(v) => set({ teamCount: v })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Pick clock</label>
          <NumberStepper
            value={value.pickTimeSeconds}
            min={MIN_PICK_SECONDS}
            max={MAX_PICK_SECONDS}
            disabled={disabled}
            onChange={(v) => set({ pickTimeSeconds: v })}
          />
          <span className="text-[11px] text-slate-500">seconds</span>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Draft type</label>
          <select
            disabled={disabled}
            value={value.draftType}
            onChange={(e) => set({ draftType: e.target.value as DraftSettings['draftType'] })}
            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm disabled:opacity-50"
          >
            <option value="snake">Snake</option>
            <option value="linear">Linear</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Scoring</label>
          <select
            disabled={disabled}
            value={value.scoring}
            onChange={(e) => set({ scoring: e.target.value as DraftSettings['scoring'] })}
            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm disabled:opacity-50"
          >
            <option value="PPR">PPR</option>
            <option value="HALF_PPR">Half PPR</option>
            <option value="STANDARD">Standard</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Bot variance</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            disabled={disabled}
            value={value.botVariance}
            onChange={(e) => set({ botVariance: Number(e.target.value) })}
            className="w-full accent-accent-500"
          />
          <span className="text-[11px] text-slate-500">
            {value.botVariance < 0.25 ? 'Sticks to ADP' : value.botVariance < 0.65 ? 'Realistic' : 'Wild'}
          </span>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            id="trr"
            type="checkbox"
            disabled={disabled}
            checked={value.thirdRoundReversal}
            onChange={(e) => set({ thirdRoundReversal: e.target.checked })}
            className="h-4 w-4 rounded accent-accent-500"
          />
          <label htmlFor="trr" className="text-sm text-slate-300">
            3rd round reversal
          </label>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Roster construction</label>
          <span className="text-xs text-slate-500">{totalRounds} rounds</span>
        </div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {ROSTER_FIELDS.map((f) => (
            <div key={f.key} className="card px-2 py-2 text-center">
              <div className="mb-1 text-[11px] font-semibold text-slate-400">{f.label}</div>
              <NumberStepper value={value.roster[f.key]} disabled={disabled} onChange={(v) => setRoster(f.key, v)} />
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          disabled={disabled}
          checked={value.autoStartWhenReady}
          onChange={(e) => set({ autoStartWhenReady: e.target.checked })}
          className="h-4 w-4 rounded accent-accent-500"
        />
        Auto-start the instant every human is ready (no waiting on the host)
      </label>
    </div>
  );
}

export { DEFAULT_SETTINGS };
