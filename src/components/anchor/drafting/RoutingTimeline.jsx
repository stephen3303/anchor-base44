import { Check, CornerUpLeft, FileText, Send, ShieldCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEP_STATUS } from '@/lib/drafting';
import { formatZulu } from '@/data/anchorSampleData';

const EVENT_ICON = {
  created: FileText,
  submitted: Send,
  advanced: Check,
  returned: CornerUpLeft,
  revised: FileText,
  released: ShieldCheck,
  withdrawn: XCircle,
};

/** The route as defined, then the append-only log of what actually happened to it. */
export default function RoutingTimeline({ draft, events }) {
  const steps = draft?.routing_steps || [];

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-mutedink">Routing chain</h4>
        {steps.length === 0 ? (
          <p className="mt-2 rounded-sm border border-dashed border-line px-3 py-3 text-[12px] text-mutedink">
            No route yet. The chain is set when the draft is submitted.
          </p>
        ) : (
          <ol className="mt-2 space-y-1.5">
            {steps.map((step) => {
              const meta = STEP_STATUS[step.status] || STEP_STATUS.pending;
              return (
                <li key={step.order} className="flex items-start gap-2.5 rounded-sm border border-line bg-white px-3 py-2">
                  <span className="anchor-mono mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-mutedink">
                    {step.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-ink">{step.title}</p>
                    <p className="text-[11.5px] text-mutedink">
                      {step.assignee_name || 'Unassigned'}
                      {step.duty ? ` · ${step.duty}` : ''}
                      {step.action === 'release' ? ' · release authority' : ''}
                    </p>
                    {step.acted_at && (
                      <p className="anchor-mono text-[10.5px] text-mutedink">{formatZulu(step.acted_at)}</p>
                    )}
                    {step.comment && (
                      <p className="mt-1 rounded-sm border border-precedence-immediate/30 bg-precedence-immediate/10 px-2 py-1 text-[11.5px] text-ink">
                        {step.comment}
                      </p>
                    )}
                  </div>
                  <span className={cn('shrink-0 text-[10.5px] uppercase tracking-[0.08em]', meta.className)}>{meta.label}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div>
        <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-mutedink">Route log</h4>
        <p className="mt-1 text-[11px] leading-snug text-mutedink">
          Append-only. Every advance, kick-back and release is recorded with the acting user.
        </p>
        <ul className="mt-2 space-y-0">
          {[...(events || [])].reverse().map((event) => {
            const Icon = EVENT_ICON[event.event_type] || FileText;
            return (
              <li key={event.id} className="flex gap-2.5 border-b border-line/70 py-2.5 last:border-b-0">
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mutedink" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-ink">
                    <span className="font-semibold capitalize">{event.event_type}</span>
                    {event.step_title ? ` · ${event.step_title}` : ''}
                    {event.actor_name ? ` · ${event.actor_name}` : ''}
                  </p>
                  {event.comment && <p className="mt-0.5 text-[11.5px] leading-snug text-ink">{event.comment}</p>}
                  <p className="anchor-mono text-[10.5px] text-mutedink">{formatZulu(event.created_date)}</p>
                </div>
              </li>
            );
          })}
          {(events || []).length === 0 && (
            <li className="py-3 text-[12px] text-mutedink">No routing activity recorded yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}