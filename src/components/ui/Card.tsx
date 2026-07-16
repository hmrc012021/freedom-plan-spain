import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-petrol-100 bg-white/70 backdrop-blur-sm p-5 shadow-sm shadow-petrol-900/5',
        'dark:bg-dark-surface dark:border-dark-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-3 flex items-center justify-between', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('font-display text-[15px] font-medium tracking-tight text-ink dark:text-paper-dim', className)}>
      {children}
    </h3>
  );
}
