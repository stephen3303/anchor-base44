import { Pencil, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';

const matchSummary = (workflow) => {
  const types = workflow.match_message_types || [];
  const originators = workflow.match_originators || [];
  const typeText = types.length ? types.join(', ') : 'any message type';
  const origText = originators.length ? ` · originator ${originators.join(', ')}` : '';
  return `${typeText}${origText}`;
};

export default function RoutingWorkflowList({ workflows, onEdit, onToggle, busy }) {
  return (
    <ul className="divide-y divide-line/70">
      {workflows.map((workflow) => (
        <li key={workflow.id} className="flex items-start gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[12.5px] font-semibold text-ink">{workflow.name}</p>
              <span
                className={
                  workflow.active === false
                    ? 'rounded-sm border border-line bg-secondary px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em] text-mutedink'
                    : 'rounded-sm border border-lifecycle-active/40 bg-lifecycle-active/10 px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em] text-lifecycle-active'
                }
              >
                {workflow.active === false ? 'Inactive' : 'Active'}
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-mutedink">{matchSummary(workflow)}</p>
            <p className="mt-1 text-[11.5px] text-ink">
              {(workflow.steps || [])
                .map((s) => `${s.title || 'Step'} — ${s.assignee_name || 'unassigned'}${s.action === 'release' ? ' (release)' : ''}`)
                .join(' → ') || 'No steps defined'}
            </p>
            {workflow.description && <p className="mt-0.5 text-[11.5px] leading-snug text-mutedink">{workflow.description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(workflow)} className="h-8 gap-1.5 px-2 text-[11.5px]">
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onToggle(workflow)}
              disabled={busy}
              className="h-8 gap-1.5 px-2 text-[11.5px]"
              title={workflow.active === false ? 'Activate' : 'Deactivate'}
            >
              <Power className="h-3.5 w-3.5" aria-hidden="true" />
              {workflow.active === false ? 'Activate' : 'Deactivate'}
            </Button>
          </div>
        </li>
      ))}
      {workflows.length === 0 && (
        <li className="px-4 py-4 text-[12px] text-mutedink">
          No routing workflows defined. Drafts cannot be submitted until one matches.
        </li>
      )}
    </ul>
  );
}