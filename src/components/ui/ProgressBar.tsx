import { cn } from '@/lib/utils';

export function ProgressBar({
  value,
  className,
  tone = 'petrol',
}: {
  value: number;
  className?: string;
  tone?: 'petrol' | 'amber' | 'brick';
}) {
  const toneClass = {
    petrol: 'bg-petrol-500',
    amber: 'bg-amber-400',
    brick: 'bg-brick-500',
  }[tone];

  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-petrol-50 dark:bg-dark-border', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', toneClass)}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
