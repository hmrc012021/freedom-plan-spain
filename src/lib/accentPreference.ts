// Accent color is a PERSONAL, per-device preference -- stored only in this
// browser's localStorage, never written to Supabase. Two people editing the
// same trip on their own laptops can each run a different accent without
// affecting what the other person sees. This is a deliberate exception to
// "everything lives in Supabase": accent color isn't trip data, it's a
// display preference of whoever is currently looking at the screen.

export interface AccentPreset {
  id: string;
  label: string;
  swatch: string; // representative hex for the picker UI
  vars: {
    50: string;
    100: string;
    400: string;
    500: string;
    600: string;
    900: string;
  };
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'pink',
    label: 'Pink',
    swatch: '#FF2D93',
    vars: { 50: '#FFE9F3', 100: '#FFC7E1', 400: '#FF4FA6', 500: '#FF2D93', 600: '#D40F72', 900: '#6B0A3C' },
  },
  {
    id: 'cyan',
    label: 'Cyan',
    swatch: '#00D1E0',
    vars: { 50: '#E3FBFD', 100: '#B3F2F7', 400: '#22D9E8', 500: '#00D1E0', 600: '#0AA3B0', 900: '#064952' },
  },
  {
    id: 'amber',
    label: 'Amber',
    swatch: '#E8A33D',
    vars: { 50: '#FBEACB', 100: '#F6D89A', 400: '#EFB158', 500: '#E8A33D', 600: '#B87F22', 900: '#5C3F0F' },
  },
  {
    id: 'green',
    label: 'Green',
    swatch: '#2FBE7A',
    vars: { 50: '#E4F9EE', 100: '#B7EFD1', 400: '#48CE8F', 500: '#2FBE7A', 600: '#1E9660', 900: '#0F4A30' },
  },
  {
    id: 'violet',
    label: 'Violet',
    swatch: '#8B5CF6',
    vars: { 50: '#F1EBFE', 100: '#DBCAFC', 400: '#A17BF8', 500: '#8B5CF6', 600: '#6D3FD1', 900: '#371F6B' },
  },
  {
    id: 'petrol',
    label: 'Petrol (original)',
    swatch: '#0F5257',
    vars: { 50: '#EAF3F3', 100: '#CFE4E4', 400: '#1D7A80', 500: '#0F5257', 600: '#0B3F43', 900: '#082B2E' },
  },
];

const STORAGE_KEY = 'trip-companion-accent';

export function getStoredAccentId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ACCENT_PRESETS[0].id;
  } catch {
    return ACCENT_PRESETS[0].id;
  }
}

export function applyAccent(id: string) {
  const preset = ACCENT_PRESETS.find((p) => p.id === id) ?? ACCENT_PRESETS[0];
  const root = document.documentElement;
  root.style.setProperty('--color-petrol-50', preset.vars[50]);
  root.style.setProperty('--color-petrol-100', preset.vars[100]);
  root.style.setProperty('--color-petrol-400', preset.vars[400]);
  root.style.setProperty('--color-petrol-500', preset.vars[500]);
  root.style.setProperty('--color-petrol-600', preset.vars[600]);
  root.style.setProperty('--color-petrol-900', preset.vars[900]);
  try {
    localStorage.setItem(STORAGE_KEY, preset.id);
  } catch {
    // localStorage unavailable (private browsing, etc.) -- accent still
    // applies for this session, just won't persist across reloads.
  }
}
