import { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, StatusBadge } from '@freedom-plan/ui';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { scoreAccommodation, bookingsFor, reconcileEstimate, isBookingConfirmed } from '@/lib/calculations';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { AmenityAvailability, KitchenRequirement } from '@/types/trip';
import { UtensilsCrossed, ParkingCircle, Coffee, AlertTriangle, Star } from 'lucide-react';
import { differenceInCalendarDays, parseISO, addDays, format } from 'date-fns';

const KITCHEN_REQUIREMENTS: KitchenRequirement[] = ['required', 'preferred', 'not-required'];

// "unknown" (null/undefined) must be a real, selectable option -- never
// silently coerced to "no". A plain checkbox can't represent that.
function amenityValue(v: AmenityAvailability): 'unknown' | 'yes' | 'no' {
  return v === true ? 'yes' : v === false ? 'no' : 'unknown';
}
function parseAmenity(v: string): AmenityAvailability {
  return v === 'yes' ? true : v === 'no' ? false : null;
}

function AmenitySelect({ value, onChange }: { value: AmenityAvailability; onChange: (v: AmenityAvailability) => void }) {
  return (
    <select
      value={amenityValue(value)}
      onChange={(e) => onChange(parseAmenity(e.target.value))}
      className="mt-0.5 w-full rounded-md border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 text-[12.5px] text-ink dark:text-paper-dim"
    >
      <option value="unknown">Unknown</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  );
}

function amenityBadgeClass(v: AmenityAvailability) {
  if (v === true) return 'border-petrol-400/30 text-petrol-500';
  if (v === false) return 'border-slate/20 text-slate';
  return 'border-amber-400/30 text-amber-500';
}
function amenityLabel(v: AmenityAvailability, name: string) {
  if (v === true) return name;
  if (v === false) return `No ${name.toLowerCase()}`;
  return `${name} unknown`;
}

export default function Accommodation() {
  const trip = useTrip();
  const updateAccommodation = useTripStore((s) => s.updateAccommodation);

  const scored = useMemo(
    () =>
      trip.accommodations
        .map((acc) => ({ acc, score: scoreAccommodation(acc, trip) }))
        .sort((a, b) => parseISO(a.acc.checkIn).getTime() - parseISO(b.acc.checkIn).getTime()),
    [trip]
  );

  return (
    <AppShell title="Accommodation">
      <div className="mb-4 rounded-xl border border-dashed border-petrol-100 dark:border-dark-border bg-petrol-50/40 dark:bg-dark-surface p-3.5 text-[12.5px] leading-relaxed text-ink-soft dark:text-paper-dim/80">
        Priority order: <b>kitchen</b> → <b>location</b> → <b>parking</b> → <b>value</b> → <b>price</b>. This app never
        optimizes for the lowest nightly rate alone — every score below weighs meal savings and parking savings
        against the nominal rate. Kitchen/parking/breakfast start as <b>Unknown</b>, not "No" — only a confirmed
        answer counts against a property.
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {scored.map(({ acc, score }) => {
          const nights = Math.max(differenceInCalendarDays(parseISO(acc.checkOut), parseISO(acc.checkIn)), 1);
          // No status field of its own -- an accommodation is a budget entry
          // reconciled against every booking linked to it (see calculations.ts
          // reconcileEstimate). Status shown is the most-advanced linked
          // booking's status, or "Not booked yet" if none exist.
          const linkedBookings = bookingsFor(trip, acc.id);
          const displayBooking =
            linkedBookings.find((b) => b.status === 'paid') ??
            linkedBookings.find((b) => b.status === 'reserved') ??
            linkedBookings[0];
          const { forecast, confirmedAmount } = reconcileEstimate(acc.cost, linkedBookings);
          const hasConfirmedBooking = linkedBookings.some((b) => isBookingConfirmed(b.status));

          return (
            <Card key={acc.id} className={acc.needsOptimization ? 'border-brick-400/40' : undefined}>
              <CardHeader>
                <div>
                  <CardTitle>{acc.name}</CardTitle>
                  <div className="mt-0.5 text-[12px] text-slate">
                    {acc.city} · {formatDate(acc.checkIn)} – {formatDate(acc.checkOut)} · {nights} nights
                  </div>
                  {displayBooking?.address && <div className="mt-0.5 text-[11.5px] text-slate">{displayBooking.address}</div>}
                </div>
                {displayBooking ? (
                  <StatusBadge status={displayBooking.status} />
                ) : (
                  <span className="inline-flex items-center rounded-full border border-slate/20 px-2.5 py-0.5 text-[11px] font-medium text-slate">
                    Not booked yet
                  </span>
                )}
              </CardHeader>

              {acc.needsOptimization && (
                <div className="mb-3 flex items-start gap-2 rounded-lg bg-brick-400/10 px-3 py-2 text-[12.5px] text-brick-500">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  Previous booking cancelled — needs re-optimization for a replacement with a kitchen.
                </div>
              )}
              {acc.isException && (
                <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-100 dark:bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-500">
                  <Star size={14} className="mt-0.5 shrink-0" />
                  {acc.exceptionReason}
                </div>
              )}

              <div className="mb-3 flex flex-wrap items-center gap-2 text-[11.5px]">
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1', amenityBadgeClass(acc.hasKitchen))}>
                  <UtensilsCrossed size={12} /> {amenityLabel(acc.hasKitchen, 'Kitchen')}
                </span>
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1', amenityBadgeClass(acc.hasParking))}>
                  <ParkingCircle size={12} /> {amenityLabel(acc.hasParking, 'Parking')}
                </span>
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1', amenityBadgeClass(acc.hasBreakfast))}>
                  <Coffee size={12} /> {amenityLabel(acc.hasBreakfast, 'Breakfast')}
                </span>
                <span className="inline-flex items-center rounded-full border border-petrol-100 dark:border-dark-border px-2.5 py-1 text-slate">
                  Kitchen {(acc.kitchenRequirement ?? 'required').replace(/-/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-xl bg-petrol-50/60 dark:bg-dark-border/40 p-3 text-center">
                <div>
                  <div className="font-mono-num text-lg font-semibold text-ink dark:text-paper-dim">{score.score}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate">Score /100</div>
                </div>
                <div>
                  <div className="font-mono-num text-lg font-semibold text-ink dark:text-paper-dim">
                    {formatCurrency(score.effectiveCostPerNight, trip.currency)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-slate">Effective/night</div>
                </div>
                <div>
                  <div className="font-mono-num text-lg font-semibold text-ink dark:text-paper-dim">
                    {formatCurrency(forecast, trip.currency)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-slate">
                    {hasConfirmedBooking ? 'Total cost (booked)' : 'Total cost (estimate)'}
                  </div>
                </div>
              </div>
              {hasConfirmedBooking && confirmedAmount !== forecast && (
                <div className="mt-1.5 text-[11px] text-slate">
                  {formatCurrency(confirmedAmount, trip.currency)} confirmed by booking, rest still forecast.
                </div>
              )}

              <ul className="mt-3 space-y-1 text-[12px] leading-relaxed text-slate">
                {score.reasoning.map((r, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-petrol-400">·</span>
                    {r}
                  </li>
                ))}
              </ul>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-petrol-100 dark:border-dark-border pt-3">
                <label className="text-[12px] text-slate">
                  Check-in
                  <input
                    type="date"
                    value={acc.checkIn}
                    onChange={(e) => {
                      // Preserve the current night count -- shift check-out
                      // along with check-in rather than leaving it fixed.
                      const newCheckOut = format(addDays(parseISO(e.target.value), nights), 'yyyy-MM-dd');
                      updateAccommodation(acc.id, { checkIn: e.target.value, checkOut: newCheckOut });
                    }}
                    className="mt-0.5 w-full rounded-md border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 text-[12.5px] text-ink dark:text-paper-dim"
                  />
                </label>
                <label className="text-[12px] text-slate">
                  Nights
                  <input
                    type="number"
                    min={1}
                    value={nights}
                    onChange={(e) => {
                      const nextNights = Math.max(Number(e.target.value) || 1, 1);
                      updateAccommodation(acc.id, { checkOut: format(addDays(parseISO(acc.checkIn), nextNights), 'yyyy-MM-dd') });
                    }}
                    className="mt-0.5 w-full rounded-md border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 font-mono-num text-ink dark:text-paper-dim"
                  />
                </label>
                <label className="text-[12px] text-slate">
                  Check-out
                  <input
                    type="date"
                    min={format(addDays(parseISO(acc.checkIn), 1), 'yyyy-MM-dd')}
                    value={acc.checkOut}
                    onChange={(e) => updateAccommodation(acc.id, { checkOut: e.target.value })}
                    className="mt-0.5 w-full rounded-md border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 text-[12.5px] text-ink dark:text-paper-dim"
                  />
                </label>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-[12px] text-slate">
                  Cost total (estimate)
                  <input
                    type="number"
                    value={acc.cost}
                    onChange={(e) => updateAccommodation(acc.id, { cost: Number(e.target.value) })}
                    className="mt-0.5 w-full rounded-md border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 font-mono-num text-ink dark:text-paper-dim"
                  />
                </label>
                <label className="text-[12px] text-slate">
                  Paid
                  <input
                    type="number"
                    value={acc.paid}
                    onChange={(e) => updateAccommodation(acc.id, { paid: Number(e.target.value) })}
                    className="mt-0.5 w-full rounded-md border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 font-mono-num text-ink dark:text-paper-dim"
                  />
                </label>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-[12px] text-slate">
                  Kitchen requirement
                  <select
                    value={acc.kitchenRequirement ?? 'required'}
                    onChange={(e) => updateAccommodation(acc.id, { kitchenRequirement: e.target.value as KitchenRequirement })}
                    className="mt-0.5 w-full rounded-md border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 text-[12.5px] text-ink dark:text-paper-dim"
                  >
                    {KITCHEN_REQUIREMENTS.map((r) => (
                      <option key={r} value={r}>{r.replace(/-/g, ' ')}</option>
                    ))}
                  </select>
                </label>
                <label className="text-[12px] text-slate">
                  Actual kitchen
                  <AmenitySelect value={acc.hasKitchen} onChange={(v) => updateAccommodation(acc.id, { hasKitchen: v })} />
                </label>
                <label className="text-[12px] text-slate">
                  Parking
                  <AmenitySelect value={acc.hasParking} onChange={(v) => updateAccommodation(acc.id, { hasParking: v })} />
                </label>
                <label className="text-[12px] text-slate">
                  Breakfast
                  <AmenitySelect value={acc.hasBreakfast} onChange={(v) => updateAccommodation(acc.id, { hasBreakfast: v })} />
                </label>
              </div>

              <label className="mt-3 block text-[12px] text-slate">
                Notes
                <textarea
                  value={acc.notes ?? ''}
                  onChange={(e) => updateAccommodation(acc.id, { notes: e.target.value || undefined })}
                  rows={3}
                  placeholder="Confirmation details, nearby supermarket, directions, etc."
                  className="mt-0.5 w-full rounded-md border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 text-[12.5px] leading-relaxed text-ink dark:text-paper-dim"
                />
              </label>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
