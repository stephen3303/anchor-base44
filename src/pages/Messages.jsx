import { useEffect, useMemo, useRef, useState } from 'react';
import MessageFilters from '@/components/anchor/MessageFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MessageTable from '@/components/anchor/MessageTable';
import MessagePreviewPane from '@/components/anchor/MessagePreviewPane';
import { SAMPLE_MESSAGES, unreadCount } from '@/data/anchorSampleData';

const ALL = 'all';
const ROW_LIMITS = ['25', '50', '100', ALL];

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
  const [rowLimit, setRowLimit] = useState(ALL);
  const previewRef = useRef(null);

  const filtered = useMemo(() => rows.filter((m) => matches(m, filters)), [rows, filters]);
  const visible = useMemo(
    () => (rowLimit === ALL ? filtered : filtered.slice(0, Number(rowLimit))),
    [filtered, rowLimit],
  );
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
    // Below the xl breakpoint the record opens under the list, so bring it into view.
    if (!window.matchMedia('(min-width: 1280px)').matches) {
      window.setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
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
      </header>

      <MessageFilters value={filters} onChange={setFilters} />

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11.5px] text-mutedink">
          Showing {visible.length} of {filtered.length} matching records
        </p>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="row-limit" className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-mutedink">
            Rows
          </label>
          <Select value={rowLimit} onValueChange={setRowLimit}>
            <SelectTrigger id="row-limit" className="h-8 w-[110px] border-line text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROW_LIMITS.map((limit) => (
                <SelectItem key={limit} value={limit}>
                  {limit === ALL ? 'All' : limit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={selected ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]' : 'grid gap-4'}>
        <MessageTable
          messages={visible}
          selectedId={selectedId}
          onSelect={selectMessage}
          onToggleStar={toggleStar}
        />
        {selected && (
          <div ref={previewRef} className="min-w-0 scroll-mt-[104px] xl:sticky xl:top-[110px] xl:self-start">
            <MessagePreviewPane message={selected} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
  );
}