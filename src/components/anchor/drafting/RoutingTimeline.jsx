import { cn } from '@/lib/utils';
import { STEP_STATUS } from '@/lib/drafting';
import { ROSTER_STATE, resolveRoute } from '@/lib/personnel';
import { formatZulu } from '@/data/anchorSampleData';

/**
 * The route as it stands: each step, who holds it, and where it has got to.
 *
 * Who holds a step is read from the roster each time this renders, so a person on
 * leave or detached from the command is visible on the chain rather than implied.
 */
export default function RoutingTimeline({ draft, personnel }) {
  const steps = resolveRoute(draft?.routing_steps, personnel);

  return (
    <div className="space-y-5">
      <div>
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
                      {step.holder_name || 'Unassigned'}
                      {step.holder_duty ? ` · ${step.holder_duty}` : ''}
                      {step.action === 'release' ? ' · release authority' : ''}
                    </p>
                    {step.holder_state === 'detached' && (
                      <p className={cn('text-[10.5px] font-semibold', ROSTER_STATE.detached.className)}>
                        Detached from the command — this step cannot be worked until it is re-held.
                      </p>
                    )}
                    {step.holder_state === 'leave' && (
                      <p className={cn('text-[10.5px] font-semibold', ROSTER_STATE.leave.className)}>
                        On leave — a covering watchstander acts on this step.
                      </p>
                    )}
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
    </div>
  );
}