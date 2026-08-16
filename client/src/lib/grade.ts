export function gradeColorClasses(letter: string): string {
  if (letter.startsWith('A')) return 'text-accent-400 border-accent-500/40 bg-accent-500/10';
  if (letter.startsWith('B')) return 'text-sky-400 border-sky-500/40 bg-sky-500/10';
  if (letter.startsWith('C')) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
}
