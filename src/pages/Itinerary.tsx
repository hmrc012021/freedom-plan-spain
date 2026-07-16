import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { useTrip, useTripStore } from '@/store/useTripStore';
import { formatDateFull } from '@/lib/utils';
import type { ItineraryDay } from '@/types/trip';
import { Plane, TrainFront, Bus, Car, MapPin, Ticket, Pencil, Trash2, Plus, X, Check } from 'lucide-react';

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
  const updateItineraryDay = useTripStore((s) => s.updateItineraryDay);
  const removeItineraryDay = useTripStore((s) => s.removeItineraryDay);
  const addItineraryDay = useTripStore((s) => s.addItineraryDay);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <AppShell title="Itinerary">
      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-petrol-100 dark:bg-dark-border sm:left-[19px]" />
        <div className="space-y-4">
          {trip.itineraryDays.map((day, idx) => {
            const legs = trip.transportLegs.filter((l) => day.transportLegIds.includes(l.id));
            const activities = trip.activities.filter((a) => day.activityIds.includes(a.id));
            const acc = trip.accommodations.find((a) => a.id === day.accommodationId);
            const isEditing = editingId === day.id;

            return (
              <div key={day.id} className="relative flex gap-4 sm:gap-5">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-petrol-500 font-mono-num text-[11px] font-semibold text-paper sm:h-10 sm:w-10">
                  {idx + 1}
                </div>
                <Card className="flex-1">
                  {isEditing ? (
                    <DayEditor
                      day={day}
                      onSave={(patch) => {
                        updateItineraryDay(day.id, patch);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => {
                        if (confirm(`Delete the ${day.city} day on ${day.date}?`)) {
                          removeItineraryDay(day.id);
                          setEditingId(null);
                        }
                      }}
                    />
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-display text-[15px] font-medium text-ink dark:text-paper-dim">
                            {day.city}
                          </div>
                          <div className="font-mono-num text-[11px] text-slate">{formatDateFull(day.date)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {acc && (
                            <span className="text-[11.5px] text-slate">
                              Staying: <span className="text-ink-soft dark:text-paper-dim/80">{acc.name}</span>
                            </span>
                          )}
                          <button
                            onClick={() => setEditingId(day.id)}
                            className="rounded-md p-1 text-slate hover:bg-petrol-50 dark:hover:bg-dark-border"
                            title="Edit day"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
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
                    </>
                  )}
                </Card>
              </div>
            );
          })}
        </div>

        <div className="relative mt-4 flex gap-4 sm:gap-5">
          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center sm:h-10 sm:w-10" />
          <div className="flex-1">
            {showAddForm ? (
              <Card>
                <NewDayForm
                  defaultCity={trip.itineraryDays.at(-1)?.city ?? ''}
                  onAdd={(day) => {
                    addItineraryDay(day);
                    setShowAddForm(false);
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </Card>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-petrol-100 dark:border-dark-border py-3 text-[13px] font-medium text-slate hover:border-petrol-400 hover:text-petrol-500"
              >
                <Plus size={14} /> Add day
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function DayEditor({
  day,
  onSave,
  onCancel,
  onDelete,
}: {
  day: ItineraryDay;
  onSave: (patch: { date: string; city: string; notes?: string }) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [date, setDate] = useState(day.date);
  const [city, setCity] = useState(day.city);
  const [notes, setNotes] = useState(day.notes ?? '');

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-slate">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
        <label className="text-[11px] text-slate">
          City
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
      </div>
      <label className="text-[11px] text-slate">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
        />
      </label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSave({ date, city, notes: notes.trim() || undefined })}
          className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-petrol-600"
        >
          <Check size={13} /> Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg border border-petrol-100 dark:border-dark-border px-3 py-1.5 text-[12px] text-slate hover:bg-petrol-50 dark:hover:bg-dark-border"
        >
          <X size={13} /> Cancel
        </button>
        <button
          onClick={onDelete}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-brick-400/30 px-3 py-1.5 text-[12px] font-medium text-brick-500 hover:bg-brick-400/10"
        >
          <Trash2 size={13} /> Delete day
        </button>
      </div>
    </div>
  );
}

function NewDayForm({
  defaultCity,
  onAdd,
  onCancel,
}: {
  defaultCity: string;
  onAdd: (day: { date: string; city: string; notes?: string }) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState('');
  const [city, setCity] = useState(defaultCity);
  const [notes, setNotes] = useState('');

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-slate">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
        <label className="text-[11px] text-slate">
          City
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
      </div>
      <label className="text-[11px] text-slate">
        Notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
        />
      </label>
      <div className="flex items-center gap-2">
        <button
          disabled={!date || !city.trim()}
          onClick={() => onAdd({ date, city: city.trim(), notes: notes.trim() || undefined })}
          className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-petrol-600 disabled:opacity-40"
        >
          <Plus size={13} /> Add day
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg border border-petrol-100 dark:border-dark-border px-3 py-1.5 text-[12px] text-slate hover:bg-petrol-50 dark:hover:bg-dark-border"
        >
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );
}
