import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SectionCard from '@/components/anchor/SectionCard';
import KpiCard from '@/components/anchor/KpiCard';
import MandatoryAckCard from '@/components/anchor/MandatoryAckCard';
import TrafficMiniList from '@/components/anchor/TrafficMiniList';
import StatusChangeList from '@/components/anchor/StatusChangeList';
import OpenActionList from '@/components/anchor/OpenActionList';
import { useAuth } from '@/lib/AuthContext';
import useAcknowledgements from '@/hooks/useAcknowledgements';
import useMessageStates from '@/hooks/useMessageStates';
import { useToast } from '@/components/ui/use-toast';
import {
  CURRENT_USER,
  SAMPLE_MESSAGES,
  formatZulu,
  isOverdue,
  latestTraffic,
  openActionItems,
  statusChanges,
} from '@/data/anchorSampleData';

const greetingFor = (hour) => {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { pending, acknowledge } = useAcknowledgements(user);
  const { byMessageId, states } = useMessageStates(user);
  const [busy, setBusy] = useState(false);
  const traffic = useMemo(() => latestTraffic(6), []);
  const changes = useMemo(() => statusChanges(), []);
  const actions = useMemo(() => openActionItems(), []);
  const overdue = pending.filter(isOverdue).length;

  // Identity comes from the signed-in user, with the sample identity as a stand-in.
  const identity = {
    full_name: user?.full_name || CURRENT_USER.full_name,
    command: user?.unit ? `${user.unit} Staff` : CURRENT_USER.command,
    duty: user?.duty || user?.role || CURRENT_USER.role,
  };

  // Read state is held per user, so the dashboard agrees with the inbox.
  const unread = useMemo(
    () =>
      SAMPLE_MESSAGES.filter((message) => !byMessageId(message.id)?.read_at && message.read_state !== 'read').length,
    [byMessageId, states],
  );

  const [ackTarget, setAckTarget] = useState(null);

  const confirmAcknowledgement = async () => {
    setBusy(true);
    try {
      const row = await acknowledge(ackTarget);
      setAckTarget(null);
      toast(
        row.queued
          ? {
              title: 'Acknowledgement queued',
              description: `${row.message_reference} · held on this workstation while the command is offline, and recorded when the circuit is restored.`,
            }
          : {
              title: 'Acknowledgement recorded',
              description: `${row.message_reference} · ${formatZulu(row.acknowledged_at)} · ${
                row.ack_status === 'late' ? 'recorded late' : 'recorded on time'
              }.`,
            },
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 anchor-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-mutedink">Watch Officer dashboard</p>
          <h1 className="normal-case mt-1 font-heading text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
            {greetingFor(moment.utc().hour())}, {identity.full_name}
          </h1>
          <p className="mt-1 text-[13px] text-mutedink">
            {identity.command} · {identity.duty} · all times Zulu
          </p>
        </div>
      </header>

      <section
        className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(158px,1fr))]"
        aria-label="Key figures"
      >
        <KpiCard
          label="Mandatory acks"
          value={pending.length}
          note={pending.length ? 'Cannot be muted or deferred' : 'Nothing outstanding'}
          tone={pending.length ? 'attention' : 'quiet'}
        />
        <KpiCard
          label="Overdue"
          value={overdue}
          note={overdue ? 'Past the acknowledgement window' : 'No escalations'}
          tone={overdue ? 'critical' : 'quiet'}
        />
        <KpiCard label="New & unread" value={unread} note="Across all communities" />
        <KpiCard label="Open action items" value={actions.length} note="With a suspense date" />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div className="min-w-0 space-y-5">
          {pending.length > 0 && (
            <SectionCard
              title="Mandatory acknowledgements due"
              hint={`${pending.length} pending · ${overdue} overdue`}
            >
              <div className="space-y-3">
                {pending.map((message) => (
                  <MandatoryAckCard key={message.id} message={message} onAcknowledge={setAckTarget} />
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard
            title="Latest traffic"
            hint={`${unread} new or unread`}
            action={
              <Link
                to="/messages"
                className="text-navy-600 underline decoration-navy-600/30 underline-offset-2 hover:decoration-navy-600"
              >
                Open Messages
              </Link>
            }
          >
            <TrafficMiniList messages={traffic} />
          </SectionCard>
        </div>

        <div className="min-w-0 space-y-5">
          {changes.length > 0 && (
            <SectionCard title="Recent status changes" hint="Amended, corrected, cancelled, superseded">
              <StatusChangeList messages={changes} />
            </SectionCard>
          )}

          {actions.length > 0 && (
            <SectionCard title="Open action items" hint="Sorted by suspense">
              <OpenActionList messages={actions} />
            </SectionCard>
          )}
        </div>
      </div>

      <Dialog open={Boolean(ackTarget)} onOpenChange={(open) => !open && setAckTarget(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Confirm acknowledgement</DialogTitle>
            <DialogDescription className="text-[12.5px]">
              {ackTarget?.reference} · {ackTarget?.precedence} · acknowledgement due {formatZulu(ackTarget?.ack_due)}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-sm border border-line bg-page/70 px-3 py-2.5">
            <p className="text-[13px] font-medium leading-snug text-ink">{ackTarget?.subject}</p>
            <p className="mt-1 text-[11.5px] text-mutedink">{ackTarget?.originator}</p>
          </div>

          <ul className="space-y-1.5 text-[12.5px] text-mutedink">
            <li>• Your acknowledgement is recorded against your account with the Zulu time it was given.</li>
            <li>• An acknowledgement cannot be withdrawn, corrected or delegated after it is recorded.</li>
            <li>• Past the due time, the pending item is shown as overdue and escalates to {ackTarget?.escalate_to_role || 'the escalation role'} per the alert rule.</li>
          </ul>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-line text-[12.5px]"
              onClick={() => setAckTarget(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-9 bg-navy-800 text-[12.5px]"
              onClick={confirmAcknowledgement}
              disabled={busy}
            >
              {busy ? 'Recording…' : 'Confirm acknowledgement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}