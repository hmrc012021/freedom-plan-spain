import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPinned,
  Wallet,
  BedDouble,
  Route,
  ClipboardCheck,
  Ticket,
  Backpack,
  Settings as SettingsIcon,
  Plane,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTrip } from '@/store/useTripStore';
import { daysUntilDeparture } from '@/lib/calculations';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/itinerary', label: 'Itinerary', icon: MapPinned },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/accommodation', label: 'Accommodation', icon: BedDouble },
  { to: '/transport', label: 'Transport', icon: Route },
  { to: '/bookings', label: 'Bookings', icon: ClipboardCheck },
  { to: '/activities', label: 'Activities', icon: Ticket },
  { to: '/packing', label: 'Packing', icon: Backpack },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const trip = useTrip();
  const days = daysUntilDeparture(trip);

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-petrol-500 text-paper">
            <Plane size={16} strokeWidth={2.2} />
          </div>
          <div>
            <div className="font-display text-[15px] font-semibold leading-none text-ink dark:text-paper-dim">
              {trip.name}
            </div>
            <div className="mt-0.5 font-mono-num text-[10px] uppercase tracking-wider text-slate">
              {days >= 0 ? `T-minus ${days} days` : 'In progress'}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
                isActive
                  ? 'bg-petrol-500 text-paper shadow-sm'
                  : 'text-ink-soft hover:bg-petrol-50 dark:text-paper-dim/70 dark:hover:bg-dark-border/60'
              )
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 pb-5 pt-3">
        <div className="rounded-xl border border-dashed border-petrol-100 dark:border-dark-border px-3 py-2.5 text-[11px] leading-relaxed text-slate">
          Everything here is stored locally in your browser. Export a backup anytime from Settings.
        </div>
      </div>
    </div>
  );
}
