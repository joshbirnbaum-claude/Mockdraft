import { gradeColorClasses } from '../../lib/grade';
import type { TeamGrade } from '../../../../shared/types';

interface Props {
  grade: TeamGrade;
  isMe: boolean;
  selected: boolean;
  onSelect: () => void;
}

export default function GradeCard({ grade, isMe, selected, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className={`card w-full p-4 text-left transition ${selected ? 'ring-2 ring-accent-400' : 'hover:border-white/20'} ${
        isMe ? 'border-accent-500/40' : ''
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="truncate text-sm font-semibold text-white">
            {grade.teamName} {isMe && <span className="text-accent-400">(you)</span>}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">{grade.isBot ? 'Bot' : 'Human'}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border font-display text-lg font-bold ${gradeColorClasses(grade.letterGrade)}`}>
          {grade.letterGrade}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
        <div>
          <p className="text-slate-500">Starter value</p>
          <p className="font-semibold text-slate-200">{grade.starterValue.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-slate-500">Value vs ADP</p>
          <p className={`font-semibold ${grade.avgValueOverAdp >= 0 ? 'text-accent-400' : 'text-rose-400'}`}>
            {grade.avgValueOverAdp >= 0 ? '+' : ''}
            {grade.avgValueOverAdp.toFixed(1)}
          </p>
        </div>
      </div>
    </button>
  );
}
