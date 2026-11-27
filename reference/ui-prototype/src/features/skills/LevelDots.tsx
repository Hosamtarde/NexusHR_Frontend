import { cn } from '@/lib/cn'

const levels = [1, 2, 3, 4, 5]

export function LevelDots({ level, label }: { level: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={label ?? String(level)}>
      {levels.map((value) => (
        <span key={value} className={cn('size-2 rounded-full', value <= level ? 'bg-brand-600' : 'bg-ink-200')} />
      ))}
    </span>
  )
}
