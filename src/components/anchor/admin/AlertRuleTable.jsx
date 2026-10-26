import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AlertRuleEditor from './AlertRuleEditor';
import { cn } from '@/lib/utils';

const conditionLabel = (rule) => {
  const parts = [];
  if (rule.match_precedence?.length) parts.push(rule.match_precedence.join(', '));
  if (rule.match_types?.length) parts.push(rule.match_types.join(', '));
  if (rule.match_communities?.length) parts.push(rule.match_communities.join(', '));
  return parts.length ? parts.join(' · ') : 'All traffic';
};

/** Mandatory delivery and the acknowledgement obligation live here. */
export default function AlertRuleTable({ rules, onSaved }) {
  const [editing, setEditing] = useState(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[13px] font-semibold text-ink">Alert rules in force</h2>
        <Button
          size="sm"
          className="ml-auto h-8 gap-1.5 bg-navy-800 text-[12px] hover:bg-navy-600"
          onClick={() => setEditing({ rule: null })}
        >
          <Plus className="h-3.5 w-3.5" />
          New rule
        </Button>
      </div>

      <ul className="space-y-2">
        {rules.map((rule) => (
          <li key={rule.id} className="rounded-sm border border-line bg-white px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="anchor-mono text-[10.5px] font-semibold text-mutedink">P{rule.priority ?? '—'}</span>
              <span className="text-[13px] font-semibold text-ink">{rule.name}</span>
              <span
                className={cn(
                  'rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em]',
                  rule.active === false
                    ? 'border-line bg-page text-mutedink'
                    : 'border-lifecycle-active/40 bg-lifecycle-active/5 text-lifecycle-active',
                )}
              >
                {rule.active === false ? 'Inactive' : 'Active'}
              </span>
              <span
                className={cn(
                  'rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em]',
                  rule.ack_required
                    ? 'border-lifecycle-amended/50 bg-[#FFF6DE] text-lifecycle-amended'
                    : 'border-line bg-page text-mutedink',
                )}
              >
                {rule.ack_required ? `Ack within ${rule.ack_window_hours}h` : 'Delivery only'}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto h-8 gap-1.5 border-line text-[12px]"
                onClick={() => setEditing({ rule })}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
            <p className="mt-1 text-[12px] text-mutedink">{rule.description}</p>
            <p className="mt-1 text-[11.5px] text-mutedink">
              Condition: <span className="text-ink">{conditionLabel(rule)}</span>
              {rule.ack_required
                ? ` · escalate to ${rule.escalate_to_role || 'Watch Officer'} after ${rule.escalate_after_hours ?? 0}h past due`
                : ''}
            </p>
          </li>
        ))}
      </ul>

      <AlertRuleEditor
        rule={editing?.rule || null}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={onSaved}
      />
    </div>
  );
}