import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, Inbox } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import DraftRow from '@/components/anchor/drafting/DraftRow';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'action', label: 'Awaiting my action' },
  { key: 'mine', label: 'My drafts' },
  { key: 'routing', label: 'In routing' },
  { key: 'released', label: 'Released' },
];

const EMPTY = {
  action: 'Nothing is waiting on you. Drafts appear here when a routing step is assigned to you.',
  mine: 'You have not started a draft yet.',
  routing: 'No drafts are in routing.',
  released: 'Nothing has been released yet.',
};

export default function Drafting() {
  const [drafts, setDrafts] = useState([]);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('action');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ items }, me] = await Promise.all([
          base44.entities.DraftMessage.list({ sort: '-updated_date', limit: 100 }),
          base44.auth.me(),
        ]);
        if (!alive) return;
        setDrafts(items || []);
        setUser(me);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => {
    // Ownership anchors on the creator id, which is always stamped on the record.
    const isMine = (d) => d.created_by_id === user?.id || (user?.email && d.created_by === user.email);
    return drafts.filter((d) => {
      if (tab === 'action') {
        if (d.draft_status === 'in_routing') return d.assigned_to_email === user?.email;
        if (d.draft_status === 'returned') return isMine(d);
        return false;
      }
      if (tab === 'mine') return isMine(d);
      if (tab === 'routing') return d.draft_status === 'in_routing' || d.draft_status === 'submitted';
      return d.draft_status === 'released';
    });
  }, [drafts, tab, user]);

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 anchor-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">Drafting</h1>
          <p className="mt-1 text-[13px] text-mutedink">
            Draft in standard naval message format, route it through the chain defined by the command, and release it
            from the release authority. All times Zulu.
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 text-[12.5px]">
          <Link to="/drafting/new">
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            New draft
          </Link>
        </Button>
      </header>

      <div className="flex flex-wrap gap-1.5 border-b border-line pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-sm px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
              tab === t.key ? 'bg-navy-800 text-white' : 'text-mutedink hover:bg-navy-100',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-line bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center gap-2 px-4 py-8 text-[12.5px] text-mutedink">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-navy-600" />
            Loading drafts…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Inbox className="h-6 w-6 text-mutedink" aria-hidden="true" />
            <p className="max-w-md text-[12.5px] leading-snug text-mutedink">{EMPTY[tab]}</p>
          </div>
        ) : (
          <ul>
            {rows.map((d) => (
              <DraftRow key={d.id} draft={d} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}