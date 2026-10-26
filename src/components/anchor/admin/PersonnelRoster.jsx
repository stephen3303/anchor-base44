import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { STATUS_LABEL, STATUS_STYLE, fullName } from '@/lib/personnel';

/** The roster as held: rank, full name, position and status, one person per row. */
export default function PersonnelRoster({ rows, onEdit, onRemove }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((person) => (
        <li key={person.id} className="anchor-row flex flex-wrap items-start gap-x-3 gap-y-2 py-2.5 hover:bg-secondary/40">
          <span className="anchor-mono w-14 shrink-0 pt-[2px] text-[11px] font-semibold uppercase tracking-[0.08em] text-navy-600">
            {person.rank || '—'}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">{fullName(person)}</p>
            <p className="text-[12px] text-mutedink">{person.position || 'No position recorded'}</p>
            {person.email && <p className="anchor-mono text-[11px] text-mutedink">{person.email}</p>}
            {person.notes && <p className="mt-1 text-[11.5px] text-mutedink">{person.notes}</p>}
          </div>

          <span
            className={cn(
              'rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em]',
              STATUS_STYLE[person.status] || STATUS_STYLE.detached,
            )}
          >
            {STATUS_LABEL[person.status] || 'Active'}
          </span>

          <span className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              title="Edit record"
              onClick={() => onEdit(person)}
            >
              <Pencil className="h-4 w-4 text-navy-600" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              title="Remove from roster"
              onClick={() => onRemove(person)}
            >
              <Trash2 className="h-4 w-4 text-lifecycle-cancelled" />
            </Button>
          </span>
        </li>
      ))}
    </ul>
  );
}