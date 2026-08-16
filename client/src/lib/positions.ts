import type { Position, SlotType } from '../../../shared/types';

export const POSITION_COLORS: Record<Position, string> = {
  QB: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  RB: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  WR: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  TE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  DST: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  K: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

export const SLOT_ORDER: SlotType[] = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'DST', 'K', 'BENCH'];

export const SLOT_LABELS: Record<SlotType, string> = {
  QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE', FLEX: 'FLEX', DST: 'D/ST', K: 'K', BENCH: 'BENCH',
};

export function eligibleForSlot(position: Position, slot: SlotType): boolean {
  if (slot === 'BENCH') return true;
  if (slot === 'FLEX') return position === 'RB' || position === 'WR' || position === 'TE';
  return position === slot;
}
