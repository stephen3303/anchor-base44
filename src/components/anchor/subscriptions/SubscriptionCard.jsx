import { Pause, Play, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CHANNEL_LABEL, criteriaLabel, FREQUENCY_LABEL, STATUS_LABEL } from '@/lib/subscriptions';

const STATUS_STYLE = {
  active: 'border-lifecycle-active/40 bg-lifecycle-active/5 text-lifecycle-active',
  paused: 'border-line bg-page text-mutedink',
  pending: 'border-lifecycle-amended/50 bg-[#FFF6DE] text-lifecycle-amended',
  denied: 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/5 text-lifecycle-cancelled',
};

export default function SubscriptionCard({ subscription, onTogglePause, busy }) {
  const status = STATUS_STYLE[subscription.status] || STATUS_STYLE.paused;
  const pausable = !subscription.mandatory && (subscription.status === 'active' || subscription.status === 'paused');

  return (
    <article className="rounded-md border border-line bg-white px-3.5 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-[13.5px] font-semibold text-ink">{subscription.name}</h3>
        <span className={cn('rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em]', status)}>
          {STATUS_LABEL[subscription.status] || subscription.status}
        </span>
        {subscription.mandatory && (
          <span className="inline-flex items-center gap-1 rounded-sm border border-gold/60 bg-gold/10 px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em] text-navy-800">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Cannot be paused
          </span>
        )}
      </div>

      <p className="mt-1 text-[12px] text-mutedink">{subscription.description}</p>
      <p className="mt-1.5 text-[11.5px] text-mutedink">
        {subscription.category} · {FREQUENCY_LABEL[subscription.frequency]} · {criteriaLabel(subscription)}
        {subscription.channels?.length
          ? ` · ${subscription.channels.map((channel) => CHANNEL_LABEL[channel] || channel).join(' + ')}`
          : ''}
      </p>

      {subscription.status === 'pending' && subscription.justification && (
        <p className="mt-1.5 text-[11.5px] text-ink">Justification: {subscription.justification}</p>
      )}
      {subscription.status === 'denied' && subscription.decision_comment && (
        <p className="mt-1.5 text-[11.5px] text-lifecycle-cancelled">Denied: {subscription.decision_comment}</p>
      )}

      {pausable && (
        <Button
          size="sm"
          variant="outline"
          className="mt-2.5 h-8 gap-1.5 border-line text-[12px]"
          onClick={() => onTogglePause(subscription)}
          disabled={busy}
        >
          {subscription.status === 'paused' ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          {subscription.status === 'paused' ? 'Resume feed' : 'Pause feed'}
        </Button>
      )}
    </article>
  );
}