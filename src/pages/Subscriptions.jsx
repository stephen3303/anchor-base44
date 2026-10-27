import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionCard from '@/components/anchor/SectionCard';
import SubscriptionCard from '@/components/anchor/subscriptions/SubscriptionCard';
import RequestSubscriptionDialog from '@/components/anchor/subscriptions/RequestSubscriptionDialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import useSubscriptions from '@/hooks/useSubscriptions';
import useTemplates from '@/hooks/useTemplates';
import { recordAudit } from '@/lib/audit';
import { CATEGORIES, canPause } from '@/lib/subscriptions';
import { cn } from '@/lib/utils';

export default function Subscriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscriptions, loading, request, update } = useSubscriptions();
  const { templates } = useTemplates();
  const [category, setCategory] = useState('all');
  const [requestOpen, setRequestOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const visible = useMemo(
    () => (category === 'all' ? subscriptions : subscriptions.filter((s) => s.category === category)),
    [subscriptions, category],
  );

  const mine = visible.filter((s) => s.requested_by_email && s.requested_by_email === user?.email);
  const command = visible.filter((s) => !s.requested_by_email || s.requested_by_email !== user?.email);
  const pendingCount = subscriptions.filter((s) => s.status === 'pending').length;

  const togglePause = async (subscription) => {
    if (!canPause(subscription)) {
      toast({
        title: 'This feed cannot be paused',
        description: `${subscription.name} is a command baseline feed.`,
      });
      return;
    }
    setBusy(true);
    try {
      const next = subscription.status === 'paused' ? 'active' : 'paused';
      const row = await update(subscription.id, { status: next });
      await recordAudit({
        action: 'subscription_paused',
        target_type: 'subscription',
        target_id: row.id,
        target_reference: row.name,
        detail: next === 'paused' ? 'Feed paused by the subscriber' : 'Feed resumed by the subscriber',
      });
      toast({
        title: next === 'paused' ? 'Feed paused' : 'Feed resumed',
        description: `${row.name} · ${next === 'paused' ? 'no further delivery' : 'delivery restored'}.`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 anchor-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-mutedink">Act</p>
          <h1 className="mt-1 font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">
            Subscriptions
          </h1>
          <p className="mt-1 text-[13px] text-mutedink">
            {subscriptions.length} feeds · {pendingCount} awaiting approval · mandatory traffic is delivered by alert
            rule, not here
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600"
          onClick={() => setRequestOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Request a subscription
        </Button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Feed categories" className="rounded-md border border-line bg-white p-2 shadow-sm">
          <ul className="space-y-0.5">
            {['all', ...CATEGORIES].map((item) => {
              const count =
                item === 'all' ? subscriptions.length : subscriptions.filter((s) => s.category === item).length;
              return (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => setCategory(item)}
                    aria-pressed={category === item}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-left text-[12.5px] transition-colors',
                      category === item ? 'bg-navy-800 font-semibold text-white' : 'text-ink hover:bg-navy-100/70',
                    )}
                  >
                    <span className="truncate">{item === 'all' ? 'All categories' : item}</span>
                    <span className="anchor-mono text-[11px] opacity-80">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-5">
          <SectionCard title="My requests" hint="Feeds you asked for">
            {mine.length === 0 ? (
              <p className="text-[12.5px] text-mutedink">
                You have no open request. Use “Request a subscription” to ask for a feed; an administrator decides.
              </p>
            ) : (
              <div className="space-y-2.5">
                {mine.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onTogglePause={togglePause}
                    busy={busy}
                    templates={templates}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Command feeds" hint="Available across the command">
            {loading ? (
              <p className="text-[12.5px] text-mutedink">Reading the feed list…</p>
            ) : command.length === 0 ? (
              <p className="text-[12.5px] text-mutedink">No feed in this category.</p>
            ) : (
              <div className="space-y-2.5">
                {command.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onTogglePause={togglePause}
                    busy={busy}
                    templates={templates}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <RequestSubscriptionDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        onRequest={request}
        templates={templates}
      />
    </div>
  );
}