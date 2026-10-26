import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AUDIT_ACTION_LABEL } from '@/lib/audit';

const ALL = 'all';
const CATEGORIES = [
  ['read', 'Read'],
  ['act', 'Act'],
  ['govern', 'Govern'],
  ['admin', 'Admin'],
  ['system', 'System'],
];

export default function AuditFilters({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const isFiltered = value.q || value.action !== ALL || value.category !== ALL;

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-md border border-line bg-white p-3 shadow-sm">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedink" />
        <Input
          value={value.q}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="Filter by actor, target or detail"
          className="h-9 border-line pl-8 text-[13px]"
          aria-label="Filter audit events"
        />
      </div>

      <Select value={value.action} onValueChange={(v) => set({ action: v })}>
        <SelectTrigger className="h-9 w-[210px] border-line text-[12.5px]" aria-label="Filter by action">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All actions</SelectItem>
          {Object.entries(AUDIT_ACTION_LABEL).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.category} onValueChange={(v) => set({ category: v })}>
        <SelectTrigger className="h-9 w-[150px] border-line text-[12.5px]" aria-label="Filter by category">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {CATEGORIES.map(([key, label]) => (
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
          onClick={() => onChange({ q: '', action: ALL, category: ALL })}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}

export const ALL_VALUE = ALL;