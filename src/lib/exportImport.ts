import type { TripData } from '@/types/trip';

export function exportTripJSON(trip: TripData) {
  const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${trip.id}.json`);
}

export function exportBudgetCSV(trip: TripData) {
  const header = ['Label', 'Category', 'Amount', 'Status', 'Refund Policy', 'Date'];
  const rows = trip.expenses.map((e) => [
    e.label,
    e.category,
    e.amount.toFixed(2),
    e.status,
    e.refund,
    e.date ?? '',
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `${trip.id}-budget.csv`);
}

function csvEscape(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readTripJSONFile(file: File): Promise<TripData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as TripData;
        resolve(data);
      } catch {
        reject(new Error('Could not parse this file as trip JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.readAsText(file);
  });
}
