import { AUDIT_ACTION_LABEL } from '@/lib/audit';
import { formatZulu } from '@/data/anchorSampleData';

const CATEGORY_LABEL = { read: 'Read', act: 'Act', govern: 'Govern', admin: 'Admin', system: 'System' };

export default function AuditTable({ events }) {
  if (events.length === 0) {
    return (
      <p className="text-[13px] text-mutedink">
        No audit event matches these filters. Events are appended by the audit function; the log is create-only and has
        no update or delete path.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {events.map((event) => (
        <li key={event.id} className="grid gap-x-3 gap-y-1 py-2.5 sm:grid-cols-[54px_132px_minmax(0,1fr)]">
          <span className="anchor-mono text-[11.5px] font-semibold text-navy-600">#{event.seq}</span>
          <span className="anchor-mono text-[11px] text-mutedink">{formatZulu(event.recorded_at)}</span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-ink">
              {AUDIT_ACTION_LABEL[event.action] || event.action}
              <span className="ml-2 rounded-sm border border-line px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em] text-mutedink">
                {CATEGORY_LABEL[event.category] || event.category}
              </span>
            </p>
            <p className="mt-0.5 text-[11.5px] text-mutedink">
              {event.actor_name || event.actor_email}
              {event.actor_role ? ` · ${event.actor_role}` : ''}
              {event.command ? ` · ${event.command}` : ''}
              {event.target_reference ? ` · ${event.target_reference}` : ''}
            </p>
            {event.detail && <p className="mt-0.5 text-[11.5px] text-ink">{event.detail}</p>}
            <p className="anchor-mono mt-1 break-all text-[10px] text-mutedink">
              {event.prev_hash?.slice(0, 10)}… → {event.hash?.slice(0, 16)}…
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}