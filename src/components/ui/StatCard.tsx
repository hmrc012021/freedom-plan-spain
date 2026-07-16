import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: ReactNode;
  tone?: 'petrol' | 'amber' | 'brick' | 'neutral';
  delay?: number;
}

const trimVar: Record<NonNullable<StatCardProps['tone']>, string> = {
  petrol: 'var(--color-petrol-500)',
  amber: 'var(--color-amber-400)',
  brick: 'var(--color-brick-500)',
  neutral: 'var(--color-slate)',
};

export function StatCard({ label, value, sublabel, icon, tone = 'petrol', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flap rounded-2xl p-5 flex flex-col justify-between min-h-[128px]"
      style={{ ['--flap-trim' as string]: trimVar[tone] }}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] uppercase tracking-[0.14em] opacity-70 font-mono-num">{label}</span>
        {icon && <span className="opacity-80" style={{ color: trimVar[tone] }}>{icon}</span>}
      </div>
      <div>
        <div className="font-mono-num text-3xl font-semibold leading-none">{value}</div>
        {sublabel && <div className="mt-1.5 text-xs opacity-60">{sublabel}</div>}
      </div>
    </motion.div>
  );
}
