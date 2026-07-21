import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-DE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyPrecise(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-DE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(d);
}

export function formatDateFull(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(d);
}

export function uid(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
