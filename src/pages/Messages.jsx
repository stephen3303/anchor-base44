import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import MessageFilters, { EMPTY_FILTERS } from '@/components/anchor/MessageFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MessageTable from '@/components/anchor/MessageTable';
import MessagePreviewPane from '@/components/anchor/MessagePreviewPane';
import { useAuth } from '@/lib/AuthContext';
import useMessageStates from '@/hooks/useMessageStates';
import { recordAudit } from '@/lib/audit';
import { SAMPLE_MESSAGES } from '@/data/anchorSampleData';

const ALL = 'all';
const ROW_LIMITS = ['25', '50', '100', ALL];

const matches = (message, filters) => {
  if (filters.precedence !== ALL && message.precedence !== filters.precedence) return false;
  if (filters.type !== ALL && message.type !== filters.type) return false;
  if (filters.lifecycle !== ALL && message.lifecycle !== filters.lifecycle) return false;
  if (filters.read !== ALL && message.read_state !== filters.read) return false;
  if (filters.originator !== ALL && message.originator !== filters.originator) return false;
  if (filters.community !== ALL && !(message.communities || []).includes(filters.community)) return false;
  if (filters.since !== ALL && moment.utc(message.received).isBefore(moment.utc().subtract(Number(filters.since), 'hours')))
    return false;
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { markRead, toggleStar: persistStar, byMessageId, states } = useMessageStates(user);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState(null);
  const [rowLimit, setRowLimit] = useState(ALL);
  const previewRef = useRef(null);
  const lastSearch = useRef('');

  // Read and star state is held per user, so a report can tell "acknowledged"
  // apart from "merely read".
  const rows = useMemo(
    () =>
      SAMPLE_MESSAGES.map((message) => {
        const state = byMessageId(message.id);
        return {
          ...message,
          read_state: state?.read_at ? 'read' : message.read_state,
          starred: Boolean(state?.starred),
        };
      }),
    [byMessageId, states],
  );

  const filtered = useMemo(() => rows.filter((m) => matches(m, filters)), [rows, filters]);
  const visible = useMemo(
    () => (rowLimit === ALL ? filtered : filtered.slice(0, Number(rowLimit))),
    [filtered, rowLimit],
  );
  const selected = rows.find((r) => r.id === selectedId) || null;
  const unread = rows.filter((r) => r.read_state !== 'read').length;

  // A search that returns nothing is still a search: record the ones that were run.
  useEffect(() => {
    const query = filters.q.trim();
    if (query.length < 3 || query === lastSearch.current) return undefined;
    const id = window.setTimeout(async () => {
      lastSearch.current = query;
      await recordAudit({
        action: 'search_run',
        target_type: 'search',
        target_reference: query.slice(0, 80),
        detail: `${filtered.length} matching records`,
      });
    }, 1200);
    return () => window.clearTimeout(id);
  }, [filters.q, filtered.length]);

  const selectMessage = async (message) => {
    setSelectedId(message.id);
    await markRead(message);
    await recordAudit({
      action: 'message_opened',
      target_type: 'message',
      target_id: message.id,
      target_reference: message.reference,
      detail: `${message.precedence} traffic opened from the inbox`,
    });
    // Below the xl breakpoint the record opens under the list, so bring it into view.
    if (!window.matchMedia('(min-width: 1280px)').matches) {
      window.setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const toggleStar = async (id) => {
    const message = rows.find((r) => r.id === id);
    if (message) await persistStar(message);
  };

  // Keyboard triage: j and k walk the list, Enter opens the record, Esc closes it.
  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;

      if (event.key === 'Escape') {
        setSelectedId(null);
        return;
      }
      if (event.key === 'Enter' && selectedId) {
        navigate(`/messages/${selectedId}`);
        return;
      }
      if (event.key !== 'j' && event.key !== 'k') return;

      event.preventDefault();
      const index = visible.findIndex((row) => row.id === selectedId);
      const nextIndex = event.key === 'j' ? Math.min(index + 1, visible.length - 1) : Math.max(index - 1, 0);
      const next = visible[index === -1 ? 0 : nextIndex];
      if (next) selectMessage(next);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, selectedId, navigate, rows]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 anchor-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">Messages</h1>
          <p className="mt-1 text-[13px] text-mutedink">
            {filtered.length} of {rows.length} records shown · {unread} new or unread · all times Zulu
          </p>
        </div>
        <p className="text-[11px] text-mutedink">j / k to walk the list · Enter opens the record · Esc closes the preview</p>
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