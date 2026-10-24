import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import PrecedenceBadge from './PrecedenceBadge';
import { formatDate, isOverdue } from '@/data/anchorSampleData';
import moment from 'moment';

export default function OpenActionList({ messages }) {
  return (
    <ul className="divide-y divide-line/70">
      {messages.map((m) => {
        const late = moment.utc(m.action_item.suspense).isBefore(moment.utc());
        return (
          <li key={m.id} className="py-3">
            <div className="flex flex-wrap items-center gap-2">
              <PrecedenceBadge precedence={m.precedence} />
              <span className="anchor-mono text-[10.5px] text-mutedink">{m.reference}</span>
              {isOverdue(m) && (
                <span className="rounded-sm bg-lifecycle-cancelled/10 px-1.5 py-[2px] text-[9.5px] font-semibold uppercase tracking-[0.08em] text-lifecycle-cancelled">
                  ack overdue
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-ink">{m.action_item.text}</p>
            <p className={cn('mt-1 flex items-center gap-1.5 text-[11.5px]', late ? 'text-lifecycle-cancelled' : 'text-mutedink')}>
              <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
              Suspense {formatDate(m.action_item.suspense)} · {m.action_item.assigned_to}
            </p>
          </li>
        );
      })}
    </ul>
  );
}