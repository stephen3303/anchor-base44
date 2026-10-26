import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import PrecedenceBadge from '../PrecedenceBadge';
import RosterList from './RosterList';
import { formatZulu } from '@/data/anchorSampleData';

const STATE = {
  pending: { label: 'Within window', className: 'border-line bg-white text-mutedink' },
  overdue: { label: 'Overdue', className: 'border-lifecycle-amended/50 bg-[#FFF6DE] text-lifecycle-amended' },
  escalated: { label: 'Escalated', className: 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/10 text-lifecycle-cancelled' },
};

export default function AccountabilityRow({ row, commandWide }) {
  const [open, setOpen] = useState(false);
  const state = STATE[row.state] || STATE.pending;
  const message = row.message;

  return (
    <div className="rounded-sm border border-line bg-white">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 px-3 py-2.5">
        <PrecedenceBadge precedence={message.precedence} />
        <div className="min-w-[220px] flex-1">
          <Link
            to={`/messages/${message.id}`}
            className="text-[13px] font-semibold leading-snug text-ink underline decoration-line underline-offset-2 hover:decoration-navy-600"
          >
            {message.subject}
          </Link>
          <p className="mt-0.5 text-[11px] text-mutedink">
            <span className="anchor-mono">{message.reference}</span> · {message.alert_rule} · due{' '}
            <span className="anchor-mono">{formatZulu(message.ack_due)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11.5px] text-ink">
            <strong className="anchor-mono text-[13px]">{row.acknowledgedCount}</strong>
            <span className="text-mutedink"> / {row.expectedCount} acknowledged</span>
          </span>
          <span className="text-[11px] text-mutedink">
            {row.readOnlyCount} read only · {row.notOpenedCount} not opened
          </span>
          <span
            className={cn(
              'rounded-sm border px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-[0.1em]',
              state.className,
            )}
          >
            {state.label}
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 rounded-sm px-1.5 py-1 text-[11px] font-semibold text-navy-600 transition-colors hover:bg-navy-100/60"
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Roster
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-page/60 px-3 py-2">
          <RosterList roster={row.roster} commandWide={commandWide} />
          {row.missing.length > 0 && commandWide && (
            <p className="mt-2 text-[11.5px] text-mutedink">
              Outstanding: {row.missing.map((person) => person.name).join(', ')} · escalation role{' '}
              {message.escalate_to_role}
            </p>
          )}
        </div>
      )}
    </div>
  );
}