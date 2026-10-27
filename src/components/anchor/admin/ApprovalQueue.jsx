import { useState } from 'react';
import moment from 'moment';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import useSubscriptions from '@/hooks/useSubscriptions';
import useTemplates from '@/hooks/useTemplates';
import { recordAudit } from '@/lib/audit';
import { criteriaLabel, FREQUENCY_LABEL } from '@/lib/subscriptions';

/**
 * Subscription approval queue. Users create requests only; the decision, the
 * comment and the approver are recorded, and every decision is audited.
 */
export default function ApprovalQueue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscriptions, update } = useSubscriptions();
  const { templates } = useTemplates();
  const [decision, setDecision] = useState(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const pending = subscriptions.filter((s) => s.status === 'pending');
  const decided = subscriptions.filter((s) => s.status === 'denied' || (s.status !== 'pending' && s.decision_comment));

  const decide = async () => {
    const approved = decision.approve;
    setBusy(true);
    try {
      const row = await update(decision.subscription.id, {
        status: approved ? 'active' : 'denied',
        decision_comment: comment.trim(),
        approver_name: user?.full_name || user?.email || '',
        decided_at: moment.utc().toISOString(),
      });
      await recordAudit({
        action: 'subscription_decided',
        target_type: 'subscription',
        target_id: row.id,
        target_reference: row.name,
        detail: `${approved ? 'Approved' : 'Denied'} — ${comment.trim()}`,
      });
      setDecision(null);
      setComment('');
      toast({
        title: approved ? 'Subscription approved' : 'Subscription denied',
        description: `${row.name} · decision recorded against your account.`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[13px] font-semibold text-ink">
          Pending requests
          <span className="ml-2 rounded-full bg-gold/85 px-1.5 py-[1px] text-[10px] font-semibold text-navy-950">
            {pending.length}
          </span>
        </h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-mutedink">No subscription request is awaiting a decision.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {pending.map((subscription) => (
              <li key={subscription.id} className="rounded-sm border border-line bg-white px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink">{subscription.name}</span>
                  <span className="rounded-sm border border-line px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-[0.1em] text-mutedink">
                    {subscription.category}
                  </span>
                  <span className="anchor-mono ml-auto text-[11px] text-mutedink">
                    {FREQUENCY_LABEL[subscription.frequency]} · {criteriaLabel(subscription, templates)}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] text-mutedink">
                  Requested by {subscription.requested_by_name || subscription.requested_by_email || 'unknown'}
                </p>
                <p className="mt-1.5 text-[12.5px] text-ink">{subscription.justification}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 bg-navy-800 text-[12px] hover:bg-navy-600"
                    onClick={() => {
                      setDecision({ subscription, approve: true });
                      setComment('');
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 border-line text-[12px] text-lifecycle-cancelled"
                    onClick={() => {
                      setDecision({ subscription, approve: false });
                      setComment('');
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Deny
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {decided.length > 0 && (
        <div className="border-t border-line pt-3">
          <h2 className="text-[13px] font-semibold text-ink">Recent decisions</h2>
          <ul className="mt-2 space-y-1.5">
            {decided.map((subscription) => (
              <li key={subscription.id} className="text-[12.5px] text-ink">
                <span className="font-semibold">{subscription.name}</span>
                <span className="text-mutedink">
                  {' '}
                  · {subscription.status === 'denied' ? 'denied' : 'approved'} by {subscription.approver_name || '—'}
                  {subscription.decided_at ? ` · ${moment.utc(subscription.decided_at).format('DD MMM YY HH:mm')}Z` : ''}
                </span>
                {subscription.decision_comment && (
                  <span className="block text-[11.5px] text-mutedink">“{subscription.decision_comment}”</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={Boolean(decision)} onOpenChange={(open) => !open && setDecision(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              {decision?.approve ? 'Approve subscription' : 'Deny subscription'}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              {decision?.subscription.name} · the decision, your name and this comment are recorded and audited.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={decision?.approve ? 'Basis for approval' : 'Reason for denial — required'}
            className="border-line text-[12.5px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="h-9 border-line text-[12.5px]" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-9 bg-navy-800 text-[12.5px]"
              onClick={decide}
              disabled={busy || (decision && !decision.approve && !comment.trim())}
            >
              {busy ? 'Recording…' : decision?.approve ? 'Approve request' : 'Deny request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}