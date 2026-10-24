import { useEffect, useState } from 'react';
import moment from 'moment';
import { cn } from '@/lib/utils';

const format = (ms) => {
  const totalMinutes = Math.floor(Math.abs(ms) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours >= 1) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m`;
};

/**
 * Acknowledgement deadline read-out. Deliberately coarse (30s) — a ticking
 * per-second deadline in the operator's face adds anxiety without adding
 * information. Always paired with the absolute Zulu time next to it.
 */
export default function Countdown({ due, className }) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const remaining = moment.utc(due).valueOf() - nowMs;
  const overdue = remaining < 0;

  return (
    <span
      className={cn(
        'anchor-mono whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.06em]',
        overdue ? 'text-lifecycle-cancelled' : 'text-mutedink',
        className,
      )}
    >
      {overdue ? 'Overdue ' : 'Due in '}
      {format(remaining)}
    </span>
  );
}