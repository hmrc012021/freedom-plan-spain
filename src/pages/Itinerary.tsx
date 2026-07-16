import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { useTrip } from '@/store/useTripStore';
import { formatDateFull } from '@/lib/utils';
import { Plane, TrainFront, Bus, Car, MapPin, Ticket } from 'lucide-react';

const modeIcon = {
  flight: Plane,
  train: TrainFront,
  bus: Bus,
  car: Car,
  walk: MapPin,
  taxi: Car,
};

export default function Itinerary() {
  const trip = useTrip();

  return (
    <AppShell title="Itinerary">
      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-petrol-100 dark:bg-dark-border sm:left-[19px]" />
        <div className="space-y-4">
          {trip.itineraryDays.map((day, idx) => {
            const legs = trip.transportLegs.filter((l) => day.transportLegIds.includes(l.id));
            const activities = trip.activities.filter((a) => day.activityIds.includes(a.id));
            const acc = trip.accommodations.find((a) => a.id === day.accommodationId);

            return (
              <div key={day.date} className="relative flex gap-4 sm:gap-5">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-petrol-500 font-mono-num text-[11px] font-semibold text-paper sm:h-10 sm:w-10">
                  {idx + 1}
                </div>
                <Card className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-display text-[15px] font-medium text-ink dark:text-paper-dim">
                        {day.city}
                      </div>
                      <div className="font-mono-num text-[11px] text-slate">{formatDateFull(day.date)}</div>
                    </div>
                    {acc && (
                      <span className="text-[11.5px] text-slate">
                        Staying: <span className="text-ink-soft dark:text-paper-dim/80">{acc.name}</span>
                      </span>
                    )}
                  </div>

                  {day.notes && (
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-soft dark:text-paper-dim/80">{day.notes}</p>
                  )}

                  {(legs.length > 0 || activities.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {legs.map((l) => {
                        const Icon = modeIcon[l.mode];
                        return (
                          <span
                            key={l.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-petrol-100 dark:border-dark-border px-2.5 py-1 text-[11.5px] text-ink-soft dark:text-paper-dim/80"
                          >
                            <Icon size={12} />
                            {l.from} → {l.to}
                            {l.departTime && <span className="font-mono-num text-slate">{l.departTime}</span>}
                            <StatusBadge status={l.status} />
                          </span>
                        );
                      })}
                      {activities.map((a) => (
                        <span
                          key={a.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-petrol-100 dark:border-dark-border px-2.5 py-1 text-[11.5px] text-ink-soft dark:text-paper-dim/80"
                        >
                          <Ticket size={12} />
                          {a.name}
                          {a.time && <span className="font-mono-num text-slate">{a.time}</span>}
                          <StatusBadge status={a.status} />
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
