import { useEffect, useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionCard from '@/components/anchor/SectionCard';
import AuditFilters from '@/components/anchor/audit/AuditFilters';
import AuditTable from '@/components/anchor/audit/AuditTable';
import IntegrityPanel from '@/components/anchor/audit/IntegrityPanel';
import { useAuth } from '@/lib/AuthContext';
import { AUDIT_ACTION_LABEL } from '@/lib/audit';

const ALL = 'all';

export default function Audit() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', action: ALL, category: ALL });

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    (async () => {
      try {
        const { items } = await base44.entities.AuditEvent.list({ sort: '-seq', limit: 200 });
        if (alive) setEvents(items || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isAdmin]);

  const visible = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
    return events.filter((event) => {
      if (filters.action !== ALL && event.action !== filters.action) return false;
      if (filters.category !== ALL && event.category !== filters.category) return false;
      if (!needle) return true;
      return [event.actor_name, event.actor_email, event.target_reference, event.detail]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [events, filters]);

  const byAction = useMemo(() => {
    const counts = new Map();
    events.forEach((event) => counts.set(event.action, (counts.get(event.action) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [events]);

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-[680px] anchor-fade-in">
        <div className="rounded-md border border-line bg-white p-6 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-sm border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-mutedink">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Administrator access
          </span>
          <h1 className="mt-3 font-heading text-[22px] font-semibold tracking-tight text-ink">Audit and integrity</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-mutedink">
            The audit log is readable by administrators. Your own actions are still written to the chain — the log is
            create-only and has no update or delete path for anyone, administrators included.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 anchor-fade-in">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-mutedink">Govern</p>
        <h1 className="mt-1 font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">
          Audit and integrity
        </h1>
        <p className="mt-1 text-[13px] text-mutedink">
          {events.length} events held · append-only, hash-chained, administrator-readable
        </p>
      </header>

      <IntegrityPanel events={events} />

      <AuditFilters value={filters} onChange={setFilters} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
        <SectionCard
          title="Audit log"
          hint={`${visible.length} of ${events.length} events shown`}
        >
          {loading ? (
            <p className="text-[13px] text-mutedink">Reading the audit log…</p>
          ) : (
            <AuditTable events={visible} />
          )}
        </SectionCard>

        <SectionCard title="Events by action" hint="Whole log">
          {byAction.length === 0 ? (
            <p className="text-[13px] text-mutedink">No events yet.</p>
          ) : (
            <ul className="space-y-2">
              {byAction.map(([action, count]) => (
                <li key={action} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                  <span className="text-ink">{AUDIT_ACTION_LABEL[action] || action}</span>
                  <span className="anchor-mono font-semibold text-ink">{count}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-relaxed text-mutedink">
            Consequential actions are audited: opening a record, acknowledging, running a search, printing, subscription
            decisions, alert rule changes, queued actions synchronised and profile changes. Routine viewing is not
            logged row by row.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}