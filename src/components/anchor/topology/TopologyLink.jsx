import { Plug, Unplug } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONE = {
  up: {
    chip: 'border-lifecycle-active/40 bg-lifecycle-active/5 text-lifecycle-active',
    dot: 'bg-[#2FBF71]',
    wire: 'bg-lifecycle-active/60',
  },
  down: {
    chip: 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/10 text-lifecycle-cancelled',
    dot: 'bg-[#C8102E]',
    wire: 'bg-lifecycle-cancelled/70',
  },
  unknown: {
    chip: 'border-gold/70 bg-gold/15 text-navy-800',
    dot: 'bg-gold',
    wire: 'bg-gold/70',
  },
};

const STATE_LABEL = { up: 'Up', down: 'Broken', unknown: 'Unknown' };

/** One connection: its state, and the control that breaks or restores it. */
export default function TopologyLink({ link, busy, onToggle }) {
  const style = TONE[link.state] || TONE.unknown;
  const up = link.state === 'up';
  const working = busy === link.key;

  return (
    <div className="flex w-full flex-col items-center">
      <span aria-hidden="true" className={cn('h-5 w-0.5', style.wire)} />

      <button
        type="button"
        onClick={onToggle}
        disabled={Boolean(busy)}
        title={`${link.label} — ${STATE_LABEL[link.state] || 'Unknown'}. Click to ${up ? 'break' : 'restore'} this connection.`}
        className={cn(
          'w-full max-w-[290px] rounded-md border px-3 py-2 text-left shadow-sm transition-colors',
          up
            ? 'border-line bg-white hover:border-lifecycle-cancelled/60'
            : 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/5 hover:border-lifecycle-cancelled',
          Boolean(busy) && 'opacity-60',
        )}
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full', style.dot)} />
          <span className="truncate text-[12px] font-semibold text-ink">{link.label}</span>
          <span
            className={cn(
              'ml-auto shrink-0 rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em]',
              style.chip,
            )}
          >
            {STATE_LABEL[link.state] || 'Unknown'}
          </span>
        </span>

        <span className="mt-1 flex items-center gap-1.5 text-[11px] text-mutedink">
          {up ? (
            <Unplug className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <Plug className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          )}
          {working ? 'Reporting…' : up ? 'Break this connection' : 'Restore this connection'}
        </span>

        {link.reportedAt && (
          <span className="anchor-mono mt-0.5 block truncate text-[10px] text-mutedink">
            Reported {link.reportedAt}
            {link.reportedBy ? ` · ${link.reportedBy}` : ''}
          </span>
        )}
      </button>

      <span aria-hidden="true" className={cn('h-5 w-0.5', style.wire)} />
    </div>
  );
}