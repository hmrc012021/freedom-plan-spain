// Accent color is a PERSONAL, per-device preference -- stored only in this
// browser's localStorage, never written to Supabase. Two people editing the
// same trip on their own laptops can each run a different accent without
// affecting what the other person sees. This is a deliberate exception to
// "everything lives in Supabase": accent color isn't trip data, it's a
// display preference of whoever is currently looking at the screen.
//
// The storage/apply mechanism itself lives in @freedom-plan/ui so every
// Freedom Plan app shares the exact same implementation; only the presets
// and CSS variable names below are Spain-specific.

import { createAccentPreference, type AccentPreset } from '@freedom-plan/ui';

export type { AccentPreset };

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'pink',
    label: 'Pink',
    swatch: '#FF2D93',
    vars: {
      'color-petrol-50': '#FFE9F3',
      'color-petrol-100': '#FFC7E1',
      'color-petrol-400': '#FF4FA6',
      'color-petrol-500': '#FF2D93',
      'color-petrol-600': '#D40F72',
      'color-petrol-900': '#6B0A3C',
    },
  },
  {
    id: 'cyan',
    label: 'Cyan',
    swatch: '#00D1E0',
    vars: {
      'color-petrol-50': '#E3FBFD',
      'color-petrol-100': '#B3F2F7',
      'color-petrol-400': '#22D9E8',
      'color-petrol-500': '#00D1E0',
      'color-petrol-600': '#0AA3B0',
      'color-petrol-900': '#064952',
    },
  },
  {
    id: 'amber',
    label: 'Amber',
    swatch: '#E8A33D',
    vars: {
      'color-petrol-50': '#FBEACB',
      'color-petrol-100': '#F6D89A',
      'color-petrol-400': '#EFB158',
      'color-petrol-500': '#E8A33D',
      'color-petrol-600': '#B87F22',
      'color-petrol-900': '#5C3F0F',
    },
  },
  {
    id: 'green',
    label: 'Green',
    swatch: '#2FBE7A',
    vars: {
      'color-petrol-50': '#E4F9EE',
      'color-petrol-100': '#B7EFD1',
      'color-petrol-400': '#48CE8F',
      'color-petrol-500': '#2FBE7A',
      'color-petrol-600': '#1E9660',
      'color-petrol-900': '#0F4A30',
    },
  },
  {
    id: 'violet',
    label: 'Violet',
    swatch: '#8B5CF6',
    vars: {
      'color-petrol-50': '#F1EBFE',
      'color-petrol-100': '#DBCAFC',
      'color-petrol-400': '#A17BF8',
      'color-petrol-500': '#8B5CF6',
      'color-petrol-600': '#6D3FD1',
      'color-petrol-900': '#371F6B',
    },
  },
  {
    id: 'petrol',
    label: 'Petrol (original)',
    swatch: '#0F5257',
    vars: {
      'color-petrol-50': '#EAF3F3',
      'color-petrol-100': '#CFE4E4',
      'color-petrol-400': '#1D7A80',
      'color-petrol-500': '#0F5257',
      'color-petrol-600': '#0B3F43',
      'color-petrol-900': '#082B2E',
    },
  },
];

const { getStoredAccentId, applyAccent } = createAccentPreference({
  storageKey: 'trip-companion-accent',
  presets: ACCENT_PRESETS,
});

export { getStoredAccentId, applyAccent };
