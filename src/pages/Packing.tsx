import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTripStore, useTrip } from '@/store/useTripStore';
import { uid } from '@/lib/utils';
import type { PackingItem } from '@/types/trip';
import { Plus, Trash2 } from 'lucide-react';

export default function Packing() {
  const trip = useTrip();
  const togglePackingItem = useTripStore((s) => s.togglePackingItem);
  const addPackingItem = useTripStore((s) => s.addPackingItem);
  const removePackingItem = useTripStore((s) => s.removePackingItem);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<'shared' | 'personal'>('shared');
  const [newTraveller, setNewTraveller] = useState(trip.travellers[0]?.id ?? '');

  const shared = trip.packingItems.filter((p) => p.category === 'shared');
  const personalByTraveller = trip.travellers.map((t) => ({
    traveller: t,
    items: trip.packingItems.filter((p) => p.category === 'personal' && p.travellerId === t.id),
  }));

  function pct(items: PackingItem[]) {
    if (items.length === 0) return 0;
    return Math.round((items.filter((i) => i.checked).length / items.length) * 100);
  }

  function handleAdd() {
    if (!newLabel.trim()) return;
    addPackingItem({
      id: uid('pk'),
      label: newLabel.trim(),
      category: newCategory,
      travellerId: newCategory === 'personal' ? newTraveller : undefined,
      checked: false,
    });
    setNewLabel('');
  }

  return (
    <AppShell title="Packing">
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Add item</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Rain jacket"
            className="flex-1 min-w-[160px] rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-3 py-1.5 text-[13px] outline-none focus:border-petrol-400"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as 'shared' | 'personal')}
            className="rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1.5 text-[13px]"
          >
            <option value="shared">Shared</option>
            <option value="personal">Personal</option>
          </select>
          {newCategory === 'personal' && (
            <select
              value={newTraveller}
              onChange={(e) => setNewTraveller(e.target.value)}
              className="rounded-lg border border-petrol-100 dark:border-dark-border bg-transparent px-2 py-1.5 text-[13px]"
            >
              {trip.travellers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-lg bg-petrol-500 px-3 py-1.5 text-[12.5px] font-medium text-paper hover:bg-petrol-600"
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shared</CardTitle>
            <span className="font-mono-num text-xs text-slate">{pct(shared)}%</span>
          </CardHeader>
          <ProgressBar value={pct(shared)} className="mb-3" />
          <ItemList items={shared} onToggle={togglePackingItem} onRemove={removePackingItem} />
        </Card>

        {personalByTraveller.map(({ traveller, items }) => (
          <Card key={traveller.id}>
            <CardHeader>
              <CardTitle>{traveller.name}</CardTitle>
              <span className="font-mono-num text-xs text-slate">{pct(items)}%</span>
            </CardHeader>
            <ProgressBar value={pct(items)} className="mb-3" />
            <ItemList items={items} onToggle={togglePackingItem} onRemove={removePackingItem} />
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function ItemList({
  items,
  onToggle,
  onRemove,
}: {
  items: PackingItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) return <p className="text-[12.5px] text-slate">Nothing here yet.</p>;
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.id} className="group flex items-center justify-between rounded-lg px-1.5 py-1 hover:bg-petrol-50/60 dark:hover:bg-dark-border/40">
          <label className="flex flex-1 items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggle(item.id)}
              className="accent-petrol-500"
            />
            <span className={item.checked ? 'text-slate line-through' : 'text-ink-soft dark:text-paper-dim/80'}>
              {item.label}
            </span>
          </label>
          <button
            onClick={() => onRemove(item.id)}
            className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-slate hover:text-brick-500"
            aria-label="Remove item"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
