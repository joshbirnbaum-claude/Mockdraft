import { useEffect, useState } from 'react';

interface Props {
  deadline: number | null;
  totalSeconds: number;
  label: string;
}

export default function PickTimer({ deadline, totalSeconds, label }: Props) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [deadline]);

  const remainingMs = deadline ? Math.max(0, deadline - Date.now()) : totalSeconds * 1000;
  const remaining = Math.ceil(remainingMs / 1000);
  const pct = Math.max(0, Math.min(1, remainingMs / (totalSeconds * 1000)));
  const urgent = deadline !== null && remaining <= 10;

  const size = 56;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-white/10" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            strokeLinecap="round"
            className={`fill-none transition-[stroke-dashoffset] duration-200 ${urgent ? 'stroke-rose-400' : 'stroke-accent-400'}`}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - (deadline ? pct : 1))}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold tabular-nums">
          {deadline ? remaining : '∞'}
        </div>
      </div>
      <div>
        <div className={`font-display text-sm font-semibold ${urgent ? 'text-rose-400' : 'text-white'}`}>{label}</div>
        <div className="text-xs text-slate-500">{deadline ? 'on the clock' : 'bot deciding…'}</div>
      </div>
    </div>
  );
}
