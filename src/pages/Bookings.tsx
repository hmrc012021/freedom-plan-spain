import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { bookingCompletionPct } from '@/lib/calculations';
import { formatDate, uid } from '@/lib/utils';
import type { Booking, BookingCategory } from '@/types/trip';
import { Plane, TrainFront, BedDouble, Ticket, Car, MoreHorizontal, Plus, X } from 'lucide-react';

const categoryIcon: Record<Booking['category'], typeof Plane> = {
  flight: Plane,
  train: TrainFront,
  accommodation: BedDouble,
  activity: Ticket,
  'car-rental': Car,
  other: MoreHorizontal,
};

const STATUS_OPTIONS = ['paid', 'booked', 'reserved', 'researching', 'need-booking', 'cancelled'];
const CATEGORY_OPTIONS: BookingCategory[] = ['flight', 'train', 'accommodation', 'activity', 'car-rental', 'other'];

export default function Bookings() {
  const trip = useTrip();
  const updateBooking = useTripStore((s) => s.updateBooking);
  const addBooking = useTripStore((s) => s.addBooking);
  const completion = bookingCompletionPct(trip);

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<BookingCategory>('other');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<Booking['status']>('need-booking');
  const [date, setDate] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');

  const grouped = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    for (const b of trip.bookings) {
      groups[b.category] = groups[b.category] ?? [];
      groups[b.category].push(b);
    }
    return groups;
  }, [trip.bookings]);

  function resetForm() {
    setLabel('');
    setCategory('other');
    setCost('');
    setStatus('need-booking');
    setDate('');
    setConfirmationNumber('');
    setShowForm(false);
  }

  function handleAdd() {
    if (!label.trim()) return;
    addBooking({
      id: uid('bk'),
      label: label.trim(),
      category,
      status,
      cost: cost.trim() === '' ? undefined : Number(cost),
      date: date.trim() === '' ? undefined : date,
      confirmationNumber: confirmationNumber.trim() === '' ? undefined : confirmationNumber.trim(),
    });
    resetForm();
  }

  return (
    <AppShell title="Bookings">
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Overall completion</CardTitle>
          <span className="font-mono-num text-lg font-semibold text-petrol-500">{completion}%</span>
        </CardHeader>
        <ProgressBar value={completion} />
      </Card>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Add a booking</CardTitle>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-petrol-600"
            >
              <Plus size={13} /> New booking
            </button>
          )}
        </CardHeader>

        {showForm && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-[12px] text-slate">
                Label
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Cordoba accommodation"
                  className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px] text-ink dark:text-paper-dim outline-none focus:border-petrol-400"
                />
              </label>
              <label className="text-[12px] text-slate">
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BookingCategory)}
                  className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] text-slate">
                Cost ({trip.currency})
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 font-mono-num text-[13px] text-ink dark:text-paper-dim outline-none focus:border-petrol-400"
                />
              </label>
              <label className="text-[12px] text-slate">
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Booking['status'])}
                  className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] text-slate">
                Date (optional)
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px] text-ink dark:text-paper-dim outline-none focus:border-petrol-400"
                />
              </label>
              <label className="text-[12px] text-slate">
                Confirmation number (optional)
                <input
                  value={confirmationNumber}
                  onChange={(e) => setConfirmationNumber(e.target.value)}
                  placeholder="e.g. ABC123"
                  className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px] text-ink dark:text-paper-dim outline-none focus:border-petrol-400"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdd}
                disabled={!label.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-petrol-600 disabled:opacity-40"
              >
                <Plus size={13} /> Add booking
              </button>
              <button
                onClick={resetForm}
                className="flex items-center gap-1.5 rounded-lg border border-petrol-100 dark:border-dark-border px-3 py-1.5 text-[12.5px] text-slate hover:bg-petrol-50 dark:hover:bg-dark-border"
              >
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-5">
        {Object.entries(grouped).map(([category, bookings]) => {
          const Icon = categoryIcon[category as Booking['category']];
          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon size={15} className="text-petrol-500" />
                  <CardTitle>{category.replace(/-/g, ' ')}</CardTitle>
                </div>
              </CardHeader>
              <div className="space-y-2">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-petrol-50 dark:border-dark-border/60 px-3 py-2.5"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-ink dark:text-paper-dim">{b.label}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-slate">
                        {b.date && <span>{formatDate(b.date)}</span>}
                        {b.confirmationNumber && <span className="font-mono-num">{b.confirmationNumber}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-mono-num text-[13px] text-ink dark:text-paper-dim">
                        <span className="text-slate text-[11px]">{trip.currency}</span>
                        <input
                          type="number"
                          value={b.cost ?? ''}
                          placeholder="—"
                          onChange={(e) =>
                            updateBooking(b.id, { cost: e.target.value === '' ? undefined : Number(e.target.value) })
                          }
                          className="w-20 rounded-md bg-transparent px-1.5 py-0.5 text-right outline-none hover:bg-petrol-50 dark:hover:bg-dark-border focus:bg-petrol-50 dark:focus:bg-dark-border"
                        />
                      </span>
                      <select
                        value={b.status}
                        onChange={(e) => updateBooking(b.id, { status: e.target.value as Booking['status'] })}
                        className="rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1 text-[12px]"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
                        ))}
                      </select>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
