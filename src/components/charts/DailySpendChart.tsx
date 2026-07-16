import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { TripData } from '@/types/trip';
import { expectedDailySpend } from '@/lib/calculations';

export function DailySpendChart({ trip }: { trip: TripData }) {
  const daily = expectedDailySpend(trip).total;

  const data = trip.itineraryDays.map((d) => {
    // Days with check-ins/activities spike slightly above the flat baseline for visual signal.
    const hasActivity = d.activityIds.length > 0;
    const hasTransport = d.transportLegIds.length > 0;
    const multiplier = hasTransport ? 1.4 : hasActivity ? 1.15 : 1;
    return {
      date: formatDate(d.date),
      spend: Math.round(daily * multiplier),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F5257" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0F5257" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CFE4E4" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
        <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} tickFormatter={(v) => `${v}`} />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), trip.currency)}
          contentStyle={{ borderRadius: 12, border: '1px solid #CFE4E4', fontSize: 12, fontFamily: 'Inter' }}
        />
        <Area type="monotone" dataKey="spend" stroke="#0F5257" strokeWidth={2} fill="url(#spendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
