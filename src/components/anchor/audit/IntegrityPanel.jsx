import { useState } from 'react';
import moment from 'moment';
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { verifyChain } from '@/lib/audit';

/**
 * Recomputes the chain over the stored rows and names the first row that does
 * not fit — a gap, a broken link or altered contents. Tamper evidence, not a
 * claim of immutability.
 */
export default function IntegrityPanel({ events }) {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checkedAt, setCheckedAt] = useState(null);

  const run = async () => {
    setBusy(true);
    try {
      const outcome = await verifyChain(events);
      setResult(outcome);
      setCheckedAt(moment.utc().toISOString());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-navy-800" aria-hidden="true" />
        <h2 className="text-[12px] font-semibold tracking-[0.14em] text-ink">Integrity check</h2>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto h-8 gap-1.5 border-line text-[12px]"
          onClick={run}
          disabled={busy}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} />
          {busy ? 'Recomputing…' : 'Recompute chain'}
        </Button>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-mutedink">
        Every row carries the hash of the row before it. Recomputing the chain from the stored contents shows whether any
        event was altered, reordered or removed.
      </p>

      {result && (
        <div
          className={cn(
            'mt-3 rounded-sm border px-3 py-2 text-[12.5px]',
            result.ok ? 'border-lifecycle-active/40 bg-lifecycle-active/5 text-ink' : 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/5 text-ink',
          )}
        >
          <p className="flex items-center gap-1.5 font-semibold">
            {result.ok ? (
              <ShieldCheck className="h-4 w-4 text-lifecycle-active" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-lifecycle-cancelled" aria-hidden="true" />
            )}
            {result.ok ? `Chain intact — ${result.checked} events verified` : `First break at event #${result.breakAt}`}
          </p>
          {!result.ok && <p className="mt-1 text-[12px] text-mutedink">{result.reason}</p>}
          {checkedAt && (
            <p className="anchor-mono mt-1 text-[10.5px] text-mutedink">recomputed {moment.utc(checkedAt).format('DD MMM YY HH:mm:ss')}Z</p>
          )}
        </div>
      )}
    </div>
  );
}