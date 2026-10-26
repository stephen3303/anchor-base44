import { useState } from 'react';
import { cn } from '@/lib/utils';
import useConnectivity from '@/hooks/useConnectivity';
import ReportLinkDialog from './ReportLinkDialog';

const LAMP_TONE = {
  up: 'bg-[#2FBF71] shadow-[0_0_0_3px_rgba(47,191,113,0.18)]',
  down: 'bg-gold',
  unknown: 'bg-navy-100/40',
};

const Lamp = ({ state, label, title }) => (
  <span className="flex items-center gap-1.5" title={title}>
    <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', LAMP_TONE[state] || LAMP_TONE.unknown)} />
    <span className="hidden text-[10px] font-semibold uppercase tracking-[0.1em] text-navy-100/80 sm:inline">
      {label}
    </span>
  </span>
);

/**
 * Both links, in the header, because they are separate facts: the command server
 * the portal is served by, and the C2OIX circuit that carries traffic out.
 * The control reports the circuit; the command server state is measured.
 */
export default function LinkStatus() {
  const { local, external, circuit, offline, report, busy } = useConnectivity();
  const [open, setOpen] = useState(false);

  const localState = local === 'down' ? 'down' : local === 'up' ? 'up' : 'unknown';
  const externalState = external === 'up' ? 'up' : 'down';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={
          offline
            ? `Offline mode — ${circuit?.external_label || 'C2OIX circuit'} down. The command server is up: work continues, transmission is held.`
            : `Normal operations — command server and ${circuit?.external_label || 'C2OIX circuit'} both up.`
        }
        className={cn(
          'flex items-center gap-3 rounded-sm border px-2 py-1.5 transition-colors',
          offline
            ? 'border-gold/60 bg-gold/15 hover:bg-gold/25'
            : 'border-white/15 hover:border-white/30',
        )}
      >
        <Lamp
          state={localState}
          label="CMD SRV"
          title={
            localState === 'down'
              ? 'Command server unreachable'
              : localState === 'up'
                ? 'Command server up — the message database is reachable'
                : 'Command server state not yet measured'
          }
        />
        <span className="h-3 w-px bg-white/20" aria-hidden="true" />
        <Lamp
          state={externalState}
          label="C2OIX"
          title={externalState === 'up' ? 'C2OIX circuit up' : 'C2OIX circuit down — offline mode'}
        />
        {offline && (
          <span className="rounded-sm bg-gold/25 px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em] text-gold">
            Offline
          </span>
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