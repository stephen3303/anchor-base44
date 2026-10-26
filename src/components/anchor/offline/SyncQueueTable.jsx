import { useEffect, useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { formatZulu } from '@/data/anchorSampleData';
import { orderedForSync, readQueue, removeItem, replayQueue, subscribeQueue } from '@/lib/syncQueue';

/** The queued actions themselves, in the order they will be replayed. */
export default function SyncQueueTable({ emcon }) {
  const { toast } = useToast();
  const [queue, setQueue] = useState(readQueue);
  const [busy, setBusy] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  useEffect(() => subscribeQueue(setQueue), []);

  const sync = async () => {
    setBusy(true);
    try {
      const results = await replayQueue();
      setLastRun(results);
      const ok = results.filter((result) => result.ok).length;
      toast({
        title: ok === results.length ? 'Queue synchronised' : 'Synchronised with errors',
        description: `${ok} of ${results.length} queued action(s) replayed, acknowledgements first.`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink">Pending sync queue</h3>
        <span className="anchor-mono text-[11.5px] text-mutedink">{queue.length} held</span>
        <Button
          size="sm"
          className="ml-auto h-8 gap-1.5 bg-navy-800 text-[12px] hover:bg-navy-600"
          onClick={sync}
          disabled={busy || emcon || queue.length === 0}
          title={emcon ? 'Replaying the queue needs the network — leave EMCON first' : undefined}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} />
          {busy ? 'Synchronising…' : 'Sync now'}
        </Button>
      </div>

      {emcon && queue.length > 0 && (
        <p className="rounded-sm border border-gold/50 bg-[#FFF6DE] px-3 py-2 text-[12px] text-ink">
          Replaying the queue needs the network, so it stays disabled while EMCON is on. Leave EMCON to synchronise.
        </p>
      )}

      {queue.length === 0 ? (
        <p className="text-[12.5px] text-mutedink">
          Nothing is queued. Acknowledgements taken in EMCON are held here until they can be recorded.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {orderedForSync(queue).map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <span className="text-[12.5px] font-semibold text-ink">{item.label}</span>
              <span className="anchor-mono text-[10.5px] uppercase tracking-[0.08em] text-mutedink">
                {item.operation}
              </span>
              <span className="anchor-mono text-[11px] text-mutedink">queued {formatZulu(item.queued_at)}</span>
              {item.attempts > 0 && (
                <span className="text-[11px] text-lifecycle-cancelled">
                  {item.attempts} failed attempt{item.attempts === 1 ? '' : 's'}
                  {item.last_error ? ` — ${item.last_error}` : ''}
                </span>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-7 px-2 text-mutedink hover:text-lifecycle-cancelled"
                onClick={() => removeItem(item.id)}
                aria-label={`Discard ${item.label}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {lastRun && (
        <div className="border-t border-line pt-3 text-[11.5px] text-mutedink">
          <p className="font-semibold text-ink">Last synchronisation</p>
          <ul className="mt-1 space-y-0.5">
            {lastRun.map((result) => (
              <li key={result.id}>
                {result.ok ? '✓' : '✗'} {result.label}
                {result.error ? ` — ${result.error}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}