import { gradeColorClasses } from '../../lib/grade';
import { POSITION_COLORS, SLOT_LABELS, SLOT_ORDER } from '../../lib/positions';
import type { TeamGrade } from '../../../../shared/types';

interface Props {
  grade: TeamGrade;
}

const TAG_STYLES: Record<string, string> = {
  steal: 'text-accent-400 bg-accent-500/10 border-accent-500/30',
  reach: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  fair: 'text-slate-400 bg-white/5 border-white/10',
};

export default function TeamDetail({ grade }: Props) {
  return (
    <div className="card p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white">{grade.teamName}</h2>
          <p className="text-xs text-slate-500">
            Starters {grade.starterValue.toFixed(0)} &middot; Bench {grade.benchValue.toFixed(0)} &middot; Avg value vs ADP{' '}
            <span className={grade.avgValueOverAdp >= 0 ? 'text-accent-400' : 'text-rose-400'}>
              {grade.avgValueOverAdp >= 0 ? '+' : ''}
              {grade.avgValueOverAdp.toFixed(1)}
            </span>
          </p>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl border font-display text-2xl font-bold ${gradeColorClasses(grade.letterGrade)}`}>
          {grade.letterGrade}
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {grade.bestPick && (
          <div className="rounded-lg border border-accent-500/30 bg-accent-500/5 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-accent-400">Best value</p>
            <p className="text-sm text-slate-200">
              {grade.bestPick.player.name} &middot; Pick {grade.bestPick.pick.overallPick}, ADP {grade.bestPick.player.adpRank} (+
              {grade.bestPick.valueOverAdp})
            </p>
          </div>
        )}
        {grade.worstPick && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-rose-400">Biggest reach</p>
            <p className="text-sm text-slate-200">
              {grade.worstPick.player.name} &middot; Pick {grade.worstPick.pick.overallPick}, ADP {grade.worstPick.player.adpRank} (
              {grade.worstPick.valueOverAdp})
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-slate-500">Starting lineup</h3>
          <ul className="space-y-1">
            {SLOT_ORDER.filter((s) => s !== 'BENCH').flatMap((slot) =>
              grade.starters[slot].map((gp, i) => (
                <li key={`${slot}-${i}`} className="flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5 text-sm">
                  <span className="w-11 text-[10px] font-bold uppercase text-slate-500">{SLOT_LABELS[slot]}</span>
                  <span className={`rounded border px-1 text-[9px] font-bold ${POSITION_COLORS[gp.player.position]}`}>{gp.player.position}</span>
                  <span className="truncate text-slate-200">{gp.player.name}</span>
                  <span className={`ml-auto rounded border px-1.5 py-0.5 text-[10px] ${TAG_STYLES[gp.tag]}`}>
                    Pick {gp.pick.overallPick}
                  </span>
                </li>
              )),
            )}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-slate-500">Bench &amp; full board</h3>
          <ul className="space-y-1">
            {grade.allPicks.map((gp) => (
              <li key={gp.pick.overallPick} className="flex items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5 text-sm">
                <span className="w-8 shrink-0 text-[10px] text-slate-500">R{gp.pick.round}</span>
                <span className={`rounded border px-1 text-[9px] font-bold ${POSITION_COLORS[gp.player.position]}`}>{gp.player.position}</span>
                <span className="truncate text-slate-200">{gp.player.name}</span>
                <span className={`ml-auto rounded border px-1.5 py-0.5 text-[10px] ${TAG_STYLES[gp.tag]}`}>
                  {gp.tag === 'steal' ? 'Steal' : gp.tag === 'reach' ? 'Reach' : 'Fair'} ({gp.valueOverAdp >= 0 ? '+' : ''}
                  {gp.valueOverAdp})
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
