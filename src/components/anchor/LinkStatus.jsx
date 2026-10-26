import { useState } from 'react';
import { cn } from '@/lib/utils';
import useConnectivity from '@/hooks/useConnectivity';
import ReportLinkDialog from './ReportLinkDialog';

const LAMP_TONE = {
  up: 'bg-[#2FBF71] shadow-[0_0_0_3px_rgba(47,191,113,0.18)]',
  error: 'bg-[#C8102E] shadow-[0_0_0_3px_rgba(200,16,46,0.22)]',
  attention: 'bg-gold',
};

const Lamp = ({ tone, label, title }) => (
  <span className="flex items-center gap-1.5" title={title}>
    <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', LAMP_TONE[tone])} />
    <span className="hidden text-[10px] font-semibold uppercase tracking-[0.1em] text-navy-100/80 sm:inline">
      {label}
    </span>
  </span>
);

/**
 * Both links, in the header, because they are separate facts.
 *
 * The local ANCHOR server is green as a matter of course: this portal is served by
 * it, so it is available. It only turns red when a read against it actually fails,
 * and that is a hard failure the operator is told about in plain words.
 *
 * The C2OIX circuit is reported by the watch, and its loss is Offline mode.
 */
export default function LinkStatus() {
  const { local, external, circuit, offline, report, busy } = useConnectivity();
  const [open, setOpen] = useState(false);

  const serverDown = local === 'down';
  const circuitUp = external === 'up';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={
          serverDown
            ? 'Local ANCHOR server not available'
            : circuitUp
              ? `Normal operations — local ANCHOR server and ${circuit?.external_label || 'C2OIX circuit'} both up.`
              : `Offline mode — ${circuit?.external_label || 'C2OIX circuit'} down. The local ANCHOR server is up: work continues, transmission is held.`
        }
        className={cn(
          'flex items-center gap-3 rounded-sm border px-2 py-1.5 transition-colors',
          serverDown
            ? 'border-[#C8102E]/60 bg-[#C8102E]/20 hover:bg-[#C8102E]/30'
            : offline
              ? 'border-gold/60 bg-gold/15 hover:bg-gold/25'
              : 'border-white/15 hover:border-white/30',
        )}
      >
        <Lamp
          tone={serverDown ? 'error' : 'up'}
          label="ANCHOR SRV"
          title={serverDown ? 'Local ANCHOR server not available' : 'Local ANCHOR server connected'}
        />
        <span className="h-3 w-px bg-white/20" aria-hidden="true" />
        <Lamp
          tone={circuitUp ? 'up' : 'attention'}
          label="C2OIX"
          title={circuitUp ? 'C2OIX circuit up' : 'C2OIX circuit down — offline mode'}
        />
        {serverDown ? (
          <span className="rounded-sm bg-[#C8102E]/30 px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em] text-white">
            Server down
          </span>
        ) : (
          !circuitUp && (
            <span className="rounded-sm bg-gold/25 px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em] text-gold">
              Offline
            </span>
          )
        )}
      </button>

      <ReportLinkDialog
        open={open}
        onOpenChange={setOpen}
        circuit={circuit}
        onReport={report}
        busy={busy}
      />
    </>
  );
}