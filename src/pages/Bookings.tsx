import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, StatusSelect, ProgressBar } from '@freedom-plan/ui';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { bookingCompletionPct } from '@/lib/calculations';
import { formatDate, uid } from '@/lib/utils';
import type { Booking, BookingCategory, Accommodation, Activity, TransportScenario, LinkedEntityType, BookingReconciliationMode } from '@/types/trip';
import { Plane, TrainFront, BedDouble, Ticket, Car, Bus, UtensilsCrossed, MoreHorizontal, Plus, X, Pencil, Trash2, Check, FileText } from 'lucide-react';

const categoryIcon: Record<Booking['category'], typeof Plane> = {
  flight: Plane,
  train: TrainFront,
  bus: Bus,
  accommodation: BedDouble,
  activity: Ticket,
  'car-rental': Car,
  food: UtensilsCrossed,
  other: MoreHorizontal,
};

const STATUS_OPTIONS: Booking['status'][] = ['need-booking', 'reserved', 'paid'];
const CATEGORY_OPTIONS: BookingCategory[] = ['flight', 'train', 'bus', 'accommodation', 'activity', 'car-rental', 'food', 'other'];
const RECONCILIATION_OPTIONS: { value: BookingReconciliationMode; label: string }[] = [
  { value: 'replace', label: 'Replace the estimate' },
  { value: 'partial', label: 'Partially reduce the estimate' },
  { value: 'additional', label: 'Add on top of the estimate' },
];

// accommodation/activity bookings must point at the budget entry they book
// (see bookings_linked_required_for_item in the DB) -- this is what makes
// "which budget entry does this reduce?" a required step, not optional.
function needsLinkedEntity(category: BookingCategory): boolean {
  return category === 'accommodation' || category === 'activity';
}

// train/bus/car-rental bookings may optionally link to a transport-scenario
// line item so they can reconcile against that plan instead of just adding on.
function canLinkEntity(category: BookingCategory): boolean {
  return needsLinkedEntity(category) || category === 'train' || category === 'bus' || category === 'car-rental';
}

function deriveLinkedEntityType(category: BookingCategory, linkedEntityId: string): LinkedEntityType | undefined {
  if (!linkedEntityId) return undefined;
  if (category === 'accommodation') return 'accommodation';
  if (category === 'activity') return 'activity';
  if (category === 'train' || category === 'bus' || category === 'car-rental') return 'transport_scenario_line_item';
  return undefined;
}

function linkOptionsForCategory(
  category: BookingCategory,
  accommodations: Accommodation[],
  activities: Activity[],
  transportScenarios: TransportScenario[],
): { id: string; label: string }[] {
  if (category === 'accommodation') return accommodations.map((a) => ({ id: a.id, label: a.name }));
  if (category === 'activity') return activities.map((a) => ({ id: a.id, label: a.name }));
  if (category === 'train' || category === 'bus' || category === 'car-rental') {
    return transportScenarios.flatMap((s) =>
      s.lineItems
        .filter((li): li is typeof li & { id: string } => li.id != null)
        .map((li) => ({
          id: li.id,
          label: s.isSelected ? `SELECTED — ${s.name}: ${li.label}` : `${s.name}: ${li.label}`,
        })),
    );
  }
  return [];
}

// A cost figure always displays with 2 decimal places (160 -> "160.00"),
// even though it's live-editable. Reformatting the controlled value on every
// keystroke would fight the cursor mid-type, so raw text is kept while
// focused and only reformatted to 2 decimals on blur/display.
function CostInput({ value, onCommit }: { value: number | undefined; onCommit: (v: number | undefined) => void }) {
  const [text, setText] = useState(value !== undefined ? value.toFixed(2) : '');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(value !== undefined ? value.toFixed(2) : '');
  }, [value, focused]);

  return (
    <input
      type="number"
      step="0.01"
      value={text}
      placeholder="—"
      onFocus={() => setFocused(true)}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        setFocused(false);
        const trimmed = text.trim();
        if (trimmed === '') {
          onCommit(undefined);
          return;
        }
        const num = Number(trimmed);
        if (!Number.isNaN(num)) {
          onCommit(num);
          setText(num.toFixed(2));
        } else {
          setText(value !== undefined ? value.toFixed(2) : '');
        }
      }}
      className="w-24 rounded-md bg-transparent px-1.5 py-0.5 text-right outline-none hover:bg-petrol-50 dark:hover:bg-dark-border focus:bg-petrol-50 dark:focus:bg-dark-border"
    />
  );
}

function EntityPicker({
  category,
  accommodations,
  activities,
  transportScenarios,
  value,
  onChange,
}: {
  category: BookingCategory;
  accommodations: Accommodation[];
  activities: Activity[];
  transportScenarios: TransportScenario[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (!canLinkEntity(category)) return null;
  const required = needsLinkedEntity(category);
  const options = linkOptionsForCategory(category, accommodations, activities, transportScenarios);
  const questionLabel =
    category === 'accommodation' || category === 'activity'
      ? `Which ${category} is this?`
      : 'Link to a transport plan item (optional)';
  return (
    <label className="text-[12px] text-slate">
      {questionLabel} {required && <span className="text-brick-500">*</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
      >
        <option value="">{required ? 'Select one…' : 'None (unplanned)'}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function ReconciliationFields({
  currency,
  linkedEntityId,
  reconciliationMode,
  setReconciliationMode,
  reconciledAmount,
  setReconciledAmount,
}: {
  currency: string;
  linkedEntityId: string;
  reconciliationMode: BookingReconciliationMode;
  setReconciliationMode: (v: BookingReconciliationMode) => void;
  reconciledAmount: string;
  setReconciledAmount: (v: string) => void;
}) {
  if (!linkedEntityId) return null;
  return (
    <>
      <label className="text-[12px] text-slate">
        Reconciliation
        <select
          value={reconciliationMode}
          onChange={(e) => setReconciliationMode(e.target.value as BookingReconciliationMode)}
          className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
        >
          {RECONCILIATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      {reconciliationMode === 'partial' && (
        <label className="text-[12px] text-slate">
          Amount of estimate reduced ({currency})
          <input
            type="number"
            value={reconciledAmount}
            onChange={(e) => setReconciledAmount(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 font-mono-num text-[13px]"
          />
        </label>
      )}
    </>
  );
}

export default function Bookings() {
  const trip = useTrip();
  const updateBooking = useTripStore((s) => s.updateBooking);
  const addBooking = useTripStore((s) => s.addBooking);
  const removeBooking = useTripStore((s) => s.removeBooking);
  const completion = bookingCompletionPct(trip);

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<BookingCategory>('other');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<Booking['status']>('need-booking');
  const [date, setDate] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [documentLink, setDocumentLink] = useState('');
  const [linkedEntityId, setLinkedEntityId] = useState('');
  const [reconciliationMode, setReconciliationMode] = useState<BookingReconciliationMode>('replace');
  const [reconciledAmount, setReconciledAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    for (const b of trip.bookings) {
      groups[b.category] = groups[b.category] ?? [];
      groups[b.category].push(b);
    }
    for (const category of Object.keys(groups)) {
      groups[category].sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1; // undated bookings sort last
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
      });
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
    setDocumentLink('');
    setLinkedEntityId('');
    setReconciliationMode('replace');
    setReconciledAmount('');
    setShowForm(false);
  }

  const canAdd = label.trim() !== '' && (!needsLinkedEntity(category) || linkedEntityId !== '');

  function handleAdd() {
    if (!canAdd) return;
    const linkedEntityType = deriveLinkedEntityType(category, linkedEntityId);
    const mode: BookingReconciliationMode = linkedEntityType ? reconciliationMode : 'unplanned';
    addBooking({
      id: uid('bk'),
      label: label.trim(),
      category,
      status,
      cost: cost.trim() === '' ? undefined : Number(cost),
      date: date.trim() === '' ? undefined : date,
      confirmationNumber: confirmationNumber.trim() === '' ? undefined : confirmationNumber.trim(),
      documentLink: documentLink.trim() === '' ? undefined : documentLink.trim(),
      linkedEntityId: linkedEntityType ? linkedEntityId : undefined,
      linkedEntityType,
      reconciliationMode: mode,
      reconciledAmount: mode === 'partial' && reconciledAmount.trim() !== '' ? Number(reconciledAmount) : undefined,
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
                  onChange={(e) => {
                    setCategory(e.target.value as BookingCategory);
                    setLinkedEntityId('');
                    setReconciliationMode('replace');
                    setReconciledAmount('');
                  }}
                  className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
                  ))}
                </select>
              </label>
              <EntityPicker
                category={category}
                accommodations={trip.accommodations}
                activities={trip.activities}
                transportScenarios={trip.transportScenarios}
                value={linkedEntityId}
                onChange={setLinkedEntityId}
              />
              <ReconciliationFields
                currency={trip.currency}
                linkedEntityId={linkedEntityId}
                reconciliationMode={reconciliationMode}
                setReconciliationMode={setReconciliationMode}
                reconciledAmount={reconciledAmount}
                setReconciledAmount={setReconciledAmount}
              />
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
              <label className="text-[12px] text-slate">
                Document link (optional)
                <input
                  value={documentLink}
                  onChange={(e) => setDocumentLink(e.target.value)}
                  placeholder="e.g. Google Drive link to the PDF"
                  className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px] text-ink dark:text-paper-dim outline-none focus:border-petrol-400"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdd}
                disabled={!canAdd}
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
                {bookings.map((b) =>
                  editingId === b.id ? (
                    <div key={b.id} className="rounded-lg border border-petrol-100 dark:border-dark-border px-3 py-3">
                      <BookingEditor
                        booking={b}
                        currency={trip.currency}
                        accommodations={trip.accommodations}
                        activities={trip.activities}
                        transportScenarios={trip.transportScenarios}
                        onSave={(patch) => {
                          updateBooking(b.id, patch);
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                        onDelete={() => {
                          if (confirm(`Delete "${b.label}"?`)) {
                            removeBooking(b.id);
                            setEditingId(null);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      key={b.id}
                      className="grid grid-cols-1 items-start gap-2 rounded-lg border border-petrol-50 dark:border-dark-border/60 px-3 py-2.5 sm:grid-cols-[1fr_100px_150px_28px] sm:items-center sm:gap-3"
                    >
                      <div>
                        <div className="text-[13px] font-medium text-ink dark:text-paper-dim">{b.label}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-slate">
                          {b.date && <span>{formatDate(b.date)}</span>}
                          {b.confirmationNumber && <span className="font-mono-num">{b.confirmationNumber}</span>}
                          {b.documentLink && (
                            <a href={b.documentLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-petrol-500 hover:underline">
                              <FileText size={11} /> Document
                            </a>
                          )}
                        </div>
                      </div>
                      <span className="flex items-center justify-end gap-1 font-mono-num text-[13px] text-ink dark:text-paper-dim">
                        <span className="text-slate text-[11px]">{trip.currency}</span>
                        <CostInput value={b.cost} onCommit={(cost) => updateBooking(b.id, { cost })} />
                      </span>
                      <StatusSelect
                        value={b.status}
                        options={STATUS_OPTIONS}
                        onChange={(status) => updateBooking(b.id, { status: status as Booking['status'] })}
                        className="w-full text-center"
                      />
                      <button
                        onClick={() => setEditingId(b.id)}
                        className="justify-self-end rounded-md p-1 text-slate hover:bg-petrol-50 dark:hover:bg-dark-border sm:justify-self-center"
                        title="Edit booking"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  ),
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}

function BookingEditor({
  booking,
  currency,
  accommodations,
  activities,
  transportScenarios,
  onSave,
  onCancel,
  onDelete,
}: {
  booking: Booking;
  currency: string;
  accommodations: Accommodation[];
  activities: Activity[];
  transportScenarios: TransportScenario[];
  onSave: (patch: Partial<Booking>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(booking.label);
  const [category, setCategory] = useState<BookingCategory>(booking.category);
  const [cost, setCost] = useState(booking.cost?.toString() ?? '');
  const [paidAmount, setPaidAmount] = useState(booking.paidAmount?.toString() ?? '');
  const [date, setDate] = useState(booking.date ?? '');
  const [confirmationNumber, setConfirmationNumber] = useState(booking.confirmationNumber ?? '');
  const [documentLink, setDocumentLink] = useState(booking.documentLink ?? '');
  const [linkedEntityId, setLinkedEntityId] = useState(booking.linkedEntityId ?? '');
  const [reconciliationMode, setReconciliationMode] = useState<BookingReconciliationMode>(
    booking.reconciliationMode ?? (booking.linkedEntityId ? 'replace' : 'unplanned'),
  );
  const [reconciledAmount, setReconciledAmount] = useState(booking.reconciledAmount?.toString() ?? '');

  const canSave = label.trim() !== '' && (!needsLinkedEntity(category) || linkedEntityId !== '');

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-[11px] text-slate">
          Label
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
        <label className="text-[11px] text-slate">
          Category
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as BookingCategory);
              setLinkedEntityId('');
              setReconciliationMode('replace');
              setReconciledAmount('');
            }}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
            ))}
          </select>
        </label>
        <EntityPicker
          category={category}
          accommodations={accommodations}
          activities={activities}
          transportScenarios={transportScenarios}
          value={linkedEntityId}
          onChange={setLinkedEntityId}
        />
        <ReconciliationFields
          currency={currency}
          linkedEntityId={linkedEntityId}
          reconciliationMode={reconciliationMode}
          setReconciliationMode={setReconciliationMode}
          reconciledAmount={reconciledAmount}
          setReconciledAmount={setReconciledAmount}
        />
        <label className="text-[11px] text-slate">
          Cost ({currency})
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 font-mono-num text-[13px]"
          />
        </label>
        <label className="text-[11px] text-slate">
          Paid amount ({currency})
          <input
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 font-mono-num text-[13px]"
          />
        </label>
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
          Confirmation number
          <input
            value={confirmationNumber}
            onChange={(e) => setConfirmationNumber(e.target.value)}
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
        <label className="text-[11px] text-slate">
          Document link
          <input
            value={documentLink}
            onChange={(e) => setDocumentLink(e.target.value)}
            placeholder="e.g. Google Drive link to the PDF"
            className="mt-1 w-full rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2.5 py-1.5 text-[13px]"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            const linkedEntityType = deriveLinkedEntityType(category, linkedEntityId);
            const mode: BookingReconciliationMode = linkedEntityType ? reconciliationMode : 'unplanned';
            onSave({
              label: label.trim(),
              category,
              cost: cost.trim() === '' ? undefined : Number(cost),
              paidAmount: paidAmount.trim() === '' ? undefined : Number(paidAmount),
              date: date || undefined,
              confirmationNumber: confirmationNumber.trim() || undefined,
              documentLink: documentLink.trim() || undefined,
              linkedEntityId: linkedEntityType ? linkedEntityId : undefined,
              linkedEntityType,
              reconciliationMode: mode,
              reconciledAmount: mode === 'partial' && reconciledAmount.trim() !== '' ? Number(reconciledAmount) : undefined,
            });
          }}
          disabled={!canSave}
          className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-petrol-600 disabled:opacity-40"
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
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}
