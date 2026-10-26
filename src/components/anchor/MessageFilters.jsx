import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COMMUNITIES, MESSAGE_TYPES, PRECEDENCE_ORDER, SAMPLE_MESSAGES } from '@/data/anchorSampleData';

const LIFECYCLES = ['ACTIVE', 'AMENDED', 'CORRECTED', 'CANCELLED', 'SUPERSEDED', 'EXPIRED'];
const READ_STATES = ['new', 'unread', 'read'];
const SINCE = [
  ['all', 'Any time'],
  ['24', 'Last 24 hours'],
  ['72', 'Last 72 hours'],
  ['168', 'Last 7 days'],
];
const ALL = 'all';

const toOptions = (values) => [...new Set(values)].sort();

const EMPTY = {
  q: '',
  precedence: ALL,
  type: ALL,
  lifecycle: ALL,
  read: ALL,
  originator: ALL,
  community: ALL,
  since: ALL,
};

/** One search surface: keyword over the official text, plus the structured filters. */
export default function MessageFilters({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const isFiltered = Object.keys(EMPTY).some((key) => value[key] !== EMPTY[key]);

  return (
    <div className="rounded-md border border-line bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedink" />
          <Input
            value={value.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search subject, reference, originator or official text"
            className="h-9 border-line pl-8 text-[13px]"
            aria-label="Search message traffic"
          />
        </div>

        <Select value={value.precedence} onValueChange={(v) => set({ precedence: v })}>
          <SelectTrigger className="h-9 w-[150px] border-line text-[12.5px]" aria-label="Filter by precedence">
            <SelectValue placeholder="Precedence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All precedence</SelectItem>
            {PRECEDENCE_ORDER.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.type} onValueChange={(v) => set({ type: v })}>
          <SelectTrigger className="h-9 w-[168px] border-line text-[12.5px]" aria-label="Filter by message type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {MESSAGE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.lifecycle} onValueChange={(v) => set({ lifecycle: v })}>
          <SelectTrigger className="h-9 w-[158px] border-line text-[12.5px]" aria-label="Filter by lifecycle">
            <SelectValue placeholder="Lifecycle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All lifecycle</SelectItem>
            {LIFECYCLES.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.read} onValueChange={(v) => set({ read: v })}>
          <SelectTrigger className="h-9 w-[144px] border-line text-[12.5px]" aria-label="Filter by read state">
            <SelectValue placeholder="Read state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any read state</SelectItem>
            {READ_STATES.map((r) => (
              <SelectItem key={r} value={r}>
                {r === 'new' ? 'New' : r === 'unread' ? 'Unread' : 'Read'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.originator} onValueChange={(v) => set({ originator: v })}>
          <SelectTrigger className="h-9 w-[190px] border-line text-[12.5px]" aria-label="Filter by originator">
            <SelectValue placeholder="Originator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All originators</SelectItem>
            {toOptions(SAMPLE_MESSAGES.map((m) => m.originator)).map((originator) => (
              <SelectItem key={originator} value={originator}>
                {originator}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.community} onValueChange={(v) => set({ community: v })}>
          <SelectTrigger className="h-9 w-[176px] border-line text-[12.5px]" aria-label="Filter by community">
            <SelectValue placeholder="Community" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All communities</SelectItem>
            {COMMUNITIES.map((community) => (
              <SelectItem key={community} value={community}>
                {community}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.since} onValueChange={(v) => set({ since: v })}>
          <SelectTrigger className="h-9 w-[150px] border-line text-[12.5px]" aria-label="Filter by received date">
            <SelectValue placeholder="Received" />
          </SelectTrigger>
          <SelectContent>
            {SINCE.map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-[12.5px] text-mutedink hover:text-ink"
            onClick={() => onChange({ ...EMPTY })}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
      <p className="mt-2 text-[11px] text-mutedink">
        Keyword search covers the official text and metadata. AI summaries are never searched and never appear in a
        search snippet.
      </p>
    </div>
  );
}

export const ALL_VALUE = ALL;
export const EMPTY_FILTERS = EMPTY;