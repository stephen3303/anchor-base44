import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

/**
 * Mandatory acknowledgement strip. One line, sticky, always actionable —
 * deliberately not a dismissable banner, because these items cannot be muted.
 */
export default function AlertStrip({ pending, overdue, nextDue }) {
  if (!pending) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-gold/50 bg-[#FFF6DE] px-4 py-2 text-[12.5px] text-ink anchor-no-print">
      <AlertTriangle className="h-4 w-4 shrink-0 text-lifecycle-amended" aria-hidden="true" />
      <span className="font-semibold">
        {pending} mandatory acknowledgement{pending === 1 ? '' : 's'} pending
      </span>
      {overdue > 0 && (
        <span className="rounded-sm bg-lifecycle-cancelled px-1.5 py-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
          {overdue} OVERDUE
        </span>
      )}
      {nextDue && <span className="anchor-mono text-[11.5px] text-mutedink">next due {nextDue}</span>}
      <Link
        to="/"
        className="ml-auto shrink-0 font-semibold text-navy-600 underline decoration-navy-600/30 underline-offset-2 hover:decoration-navy-600"
      >
        Review now
      </Link>
    </div>
  );
}