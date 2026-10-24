import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import LifecycleBadge from './LifecycleBadge';
import { formatShort, messageByReference } from '@/data/anchorSampleData';

export default function StatusChangeList({ messages }) {
  return (
    <ul className="divide-y divide-line/70">
      {messages.map((m) => {
        const replacement = m.replaced_by ? messageByReference(m.replaced_by) : null;
        return (
          <li key={m.id} className="py-3">
            <div className="flex flex-wrap items-center gap-2">
              <LifecycleBadge lifecycle={m.lifecycle} />
              <span className="anchor-mono text-[10.5px] text-mutedink">
                {m.reference} · {formatShort(m.received)}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] font-medium leading-snug text-ink">{m.subject}</p>
            {replacement && (
              <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-navy-600">
                <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                <Link to="/messages" className="font-semibold underline decoration-navy-600/30 underline-offset-2">
                  {m.lifecycle === 'CANCELLED' ? 'Superseded by' : 'Replaced by'} {replacement.reference}
                </Link>
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}