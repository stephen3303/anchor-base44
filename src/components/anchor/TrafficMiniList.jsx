import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import PrecedenceBadge, { PRECEDENCE_RULE } from './PrecedenceBadge';
import LifecycleBadge from './LifecycleBadge';
import { formatShort } from '@/data/anchorSampleData';
import Dtg from './Dtg';

export default function TrafficMiniList({ messages }) {
  return (
    <ul className="divide-y divide-line/70">
      {messages.map((m) => (
        <li key={m.id}>
          <Link to="/messages" className="flex items-start gap-3 py-2.5 anchor-row hover:bg-navy-100/40">
            <span
              aria-hidden="true"
              className={cn('mt-0.5 h-full w-[3px] shrink-0 self-stretch rounded-full border-l-[3px]', PRECEDENCE_RULE[m.precedence])}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <PrecedenceBadge precedence={m.precedence} />
                <Dtg value={m.dtg} className="text-[10.5px] text-mutedink" />
                {m.read_state !== 'read' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-navy-600" title="Unread" />
                )}
              </div>
              <p
                className={cn(
                  'mt-1 truncate text-[13px] leading-snug',
                  m.lifecycle === 'CANCELLED'
                    ? 'text-mutedink line-through decoration-lifecycle-cancelled decoration-2'
                    : 'font-medium text-ink',
                )}
              >
                {m.subject}
              </p>
              <p className="mt-0.5 truncate font-mono text-[10.5px] text-mutedink">
                {m.reference} · {m.originator} · received {formatShort(m.received)}
              </p>
            </div>
            {m.lifecycle !== 'ACTIVE' && <LifecycleBadge lifecycle={m.lifecycle} className="shrink-0" />}
          </Link>
        </li>
      ))}
    </ul>
  );
}