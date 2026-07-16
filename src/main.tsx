import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyAccent, getStoredAccentId } from '@/lib/accentPreference'

// Apply the saved per-device accent before first paint.
applyAccent(getStoredAccentId())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
