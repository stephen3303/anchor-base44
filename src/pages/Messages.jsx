import { useEffect, useMemo, useState } from 'react';
import MessageFilters from '@/components/anchor/MessageFilters';
import MessageTable from '@/components/anchor/MessageTable';
import MessagePreviewPane from '@/components/anchor/MessagePreviewPane';
import { SAMPLE_MESSAGES, unreadCount } from '@/data/anchorSampleData';

const ALL = 'all';

const matches = (message, filters) => {
  if (filters.precedence !== ALL && message.precedence !== filters.precedence) return false;
  if (filters.type !== ALL && message.type !== filters.type) return false;
  if (filters.lifecycle !== ALL && message.lifecycle !== filters.lifecycle) return false;
  if (filters.read !== ALL && message.read_state !== filters.read) return false;
  if (!filters.q) return true;

  // Keyword search covers the official record only — deliberately never the AI summary.
  const haystack = [
    message.subject,
    message.reference,
    message.originator,
    message.dtg,
    message.communities.join(' '),
    message.sections.map((s) => `${s.heading} ${s.body}`).join(' '),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(filters.q.toLowerCase());
};

export default function Messages() {
  // Local view-model copy so read/star state behaves like an inbox in the prototype.
  const [rows, setRows] = useState(() => SAMPLE_MESSAGES.map((m) => ({ ...m })));
  const [filters, setFilters] = useState({ q: '', precedence: ALL, type: ALL, lifecycle: ALL, read: ALL });
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => rows.filter((m) => matches(m, filters)), [rows, filters]);
  const selected = rows.find((r) => r.id === selectedId) || null;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const selectMessage = (message) => {
    setSelectedId(message.id);
    setRows((prev) => prev.map((r) => (r.id === message.id ? { ...r, read_state: 'read' } : r)));
  };

  const toggleStar = (id) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, starred: !r.starred } : r)));
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 anchor-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">Messages</h1>
          <p className="mt-1 text-[13px] text-mutedink">
            {filtered.length} of {rows.length} records shown · {unreadCount()} new or unread in the inbox · all times
            Zulu
          </p>
        </div>
        <p className="max-w-md text-[11.5px] text-mutedink">
          Official records are immutable. Status changes arrive as newer messages and are shown as labels and links —
          a reply is drafted as a new message, never an edit.
        </p>
      </header>

      <MessageFilters value={filters} onChange={setFilters} />

      <div className={selected ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]' : 'grid gap-4'}>
        <MessageTable
          messages={filtered}
          selectedId={selectedId}
          onSelect={selectMessage}
          onToggleStar={toggleStar}
        />
        {selected && (
          <div className="min-w-0 xl:sticky xl:top-[110px] xl:self-start">
            <MessagePreviewPane message={selected} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
  );
}