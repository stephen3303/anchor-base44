import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PrecedenceBadge from '@/components/anchor/PrecedenceBadge';
import StatusChip from './StatusChip';
import { currentRouteStep } from '@/lib/drafting';
import { formatShort } from '@/data/anchorSampleData';

export default function DraftRow({ draft }) {
  const step = currentRouteStep(draft);
  const total = (draft.routing_steps || []).length;

  return (
    <li>
      <Link
        to={`/drafting/${draft.id}`}
        className="flex items-start gap-3 border-b border-line/70 px-3 py-3 anchor-row hover:bg-navy-100/50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PrecedenceBadge precedence={draft.precedence} />
            <StatusChip status={draft.draft_status} />
            <span className="anchor-mono text-[10.5px] text-mutedink">{draft.message_type || 'DRAFT'}</span>
            {total > 0 && (
              <span className="anchor-mono text-[10.5px] text-mutedink">
                step {draft.current_step || 1} of {total}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] font-medium leading-snug text-ink">{draft.subject || 'Untitled draft'}</p>
          <p className="mt-0.5 text-[11.5px] text-mutedink">
            {draft.originator || 'No originator'}
            {step ? ` · with ${step.assignee_name || 'unassigned'}${step.duty ? ` (${step.duty})` : ''}` : ''}
            {draft.released_at ? ` · released ${formatShort(draft.released_at)}` : ''}
          </p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-mutedink" aria-hidden="true" />
      </Link>
    </li>
  );
}