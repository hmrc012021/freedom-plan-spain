import { cn } from '@/lib/utils';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneStyles: Record<BadgeTone, string> = {
  success: 'bg-petrol-50 text-petrol-600 border-petrol-100 dark:bg-petrol-900/40 dark:text-petrol-100 dark:border-petrol-600/40',
  warning: 'bg-amber-100 text-amber-500 border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-400',
  danger: 'bg-brick-400/10 text-brick-500 border-brick-400/30 dark:text-brick-400',
  info: 'bg-petrol-100 text-petrol-600 border-petrol-400/20 dark:bg-petrol-900/40 dark:text-petrol-100',
  neutral: 'bg-slate/10 text-slate border-slate/20',
};

const statusToneMap: Record<string, BadgeTone> = {
  paid: 'success',
  booked: 'success',
  reserved: 'info',
  estimated: 'neutral',
  optional: 'neutral',
  cancelled: 'danger',
  researching: 'warning',
  'need-booking': 'warning',
  planned: 'info',
  idea: 'neutral',
  'need-tickets': 'warning',
  'need-reservation': 'warning',
  refundable: 'success',
  'non-refundable': 'danger',
  partial: 'warning',
};

export function statusTone(status: string): BadgeTone {
  return statusToneMap[status] ?? 'neutral';
}

export function Badge({ children, tone, className }: { children: React.ReactNode; tone?: BadgeTone; className?: string }) {
  const t = tone ?? 'neutral';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize tracking-wide',
        toneStyles[t],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={statusTone(status)} className={className}>
      {status.replace(/-/g, ' ')}
    </Badge>
  );
}
