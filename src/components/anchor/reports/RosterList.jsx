import { Check, Minus } from 'lucide-react';
import { formatZulu } from '@/data/anchorSampleData';

/** Who has acknowledged, who has only read it, and who has not opened it. */
export default function RosterList({ roster, commandWide }) {
  if (!commandWide) {
    return (
      <p className="text-[11.5px] text-mutedink">
        This view counts your own acknowledgement. The command-wide roster is available to administrators.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {roster.map((person) => (
        <li key={person.email} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5">
          <span className="text-[12px] text-ink">{person.name}</span>
          <span className="anchor-mono text-[10.5px] text-mutedink">{person.email}</span>
          <span className="ml-auto flex items-center gap-3">
            {person.acknowledged ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-lifecycle-active">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {person.late ? 'acknowledged late' : 'acknowledged'}
                {person.acknowledgedAt && (
                  <span className="anchor-mono font-normal text-mutedink">{formatZulu(person.acknowledgedAt)}</span>
                )}
              </span>
            ) : person.read ? (
              <span className="text-[11px] font-semibold text-lifecycle-amended">read only — not acknowledged</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-mutedink">
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                not opened
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}