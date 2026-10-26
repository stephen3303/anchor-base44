import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HardDrive, Radio, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatZulu } from '@/data/anchorSampleData';
import useConnectivity from '@/hooks/useConnectivity';
import ReportLinkDialog from '@/components/anchor/ReportLinkDialog';

const TONE = {
  up: { chip: 'border-lifecycle-active/40 bg-lifecycle-active/5 text-lifecycle-active', dot: 'bg-[#2FBF71]' },
  attention: { chip: 'border-gold/70 bg-gold/15 text-navy-800', dot: 'bg-gold' },
  error: { chip: 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/10 text-lifecycle-cancelled', dot: 'bg-[#C8102E]' },
};

const LinkRow = ({ title, tone, stateLabel, description, meta }) => {
  const style = TONE[tone] || TONE.attention;
  return (
    <div
      className={cn(
        'rounded-sm border p-3',
        tone === 'error' ? 'border-lifecycle-cancelled/40 bg-lifecycle-cancelled/5' : 'border-line bg-white',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-full', style.dot)} />
        <span className="text-[13px] font-semibold text-ink">{title}</span>
        <span
          className={cn(
            'rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em]',
            style.chip,
          )}
        >
          {stateLabel}
        </span>
        {meta && <span className="anchor-mono ml-auto text-[11px] text-mutedink">{meta}</span>}
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-mutedink">{description}</p>
    </div>
  );
};

/** The two links at the command, and the control that reports the circuit. */
export default function ConnectivityPanel({ queueLength }) {
  const { local, external, circuit, offline, checkedAt, checkLocal, checking, report, busy } = useConnectivity();
  const [open, setOpen] = useState(false);

  const circuitLabel = circuit?.external_label || 'C2OIX circuit';
  const serverDown = local === 'down';

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <LinkRow
          title={circuit?.local_label || 'Command Server'}
          tone={serverDown ? 'error' : 'up'}
          stateLabel={serverDown ? 'Not available' : 'Connected'}
          meta={checkedAt ? `checked ${formatZulu(checkedAt)}` : null}
          description={
            serverDown
              ? 'Local ANCHOR server not available. This workstation cannot reach the command server at this command, so traffic cannot be read or written until it answers. Work already on screen stays visible; nothing new is recorded. Use Re-check once the server is back.'
              : 'The local ANCHOR server at this command is answering. It holds the message database, so traffic is readable and every action — drafting, routing, filing — is recorded here. This link is expected to be up whenever the portal is open.'
          }
        />

        <LinkRow
          title={circuitLabel}
          tone={offline && !serverDown ? 'attention' : 'up'}
          stateLabel={offline && !serverDown ? 'Down' : 'Up'}
          meta={circuit?.reported_at ? `reported ${formatZulu(circuit.reported_at)}` : null}
          description={
            offline && !serverDown
              ? `Offline mode. The local ANCHOR server is up, so work continues: traffic stays readable and drafts can be written, routed and released. Anything that has to leave the command waits here for the circuit.${circuit?.note ? ` Reported note: ${circuit.note}` : ''}`
              : 'Traffic flows in and out of the command. Releases transmit as they are released and acknowledgements are recorded as they are given.'
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="h-9 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600"
          onClick={() => setOpen(true)}
        >
          <Radio className="h-3.5 w-3.5" aria-hidden="true" />
          Report circuit state
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 gap-1.5 border-line text-[12.5px]"
          onClick={checkLocal}
          disabled={checking}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', checking && 'animate-spin')} aria-hidden="true" />
          {checking ? 'Checking…' : 'Re-check ANCHOR server'}
        </Button>
        {queueLength > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-mutedink">
            <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
            {queueLength} action{queueLength === 1 ? '' : 's'} held for the circuit
          </span>
        )}
        <Link to="/offline" className="ml-auto text-[11.5px] font-semibold text-navy-600 underline underline-offset-2">
          Transmission queue
        </Link>
      </div>

      <ReportLinkDialog open={open} onOpenChange={setOpen} circuit={circuit} onReport={report} busy={busy} />
    </div>
  );
}