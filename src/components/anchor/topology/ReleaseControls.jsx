import { Pause, Play, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const BUTTON = 'h-9 gap-1.5 border-line text-[12.5px]';

/**
 * The operator's hand on the C2OIX server: force it to send the next messages now,
 * one or several at a time. With the circuit up they go straight to the ANCHOR
 * server and on to every workstation that can be reached. With the circuit down
 * they are released but cannot leave C2OIX, and wait there for the circuit.
 */
export default function ReleaseControls({ traffic, circuitUp, feedActive, canDrive, busy, onDrop, onFeed, onReload }) {
  const pending = circuitUp ? traffic.atC2oix : traffic.queued.length;
  const disabled = !canDrive || Boolean(busy);

  const drops = [
    { key: 'drop-1', label: 'Drop 1 message', count: 1 },
    { key: 'drop-3', label: 'Drop 3 messages', count: 3 },
    { key: 'drop-all', label: `Drop all (${Math.min(pending, 10)})`, count: Math.min(pending, 10) },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] leading-relaxed text-ink">
        {circuitUp
          ? 'The circuit is up. A drop sends the next message from C2OIX to the ANCHOR server, which hands it on to every workstation it can reach.'
          : 'The circuit is down. A drop releases the next message at C2OIX, but it cannot leave: it waits there, not transmitted, until the circuit is restored.'}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {drops.map((drop) => (
          <Button
            key={drop.key}
            size="sm"
            variant="outline"
            className={cn(BUTTON, drop.key === 'drop-1' && 'border-navy-800/40')}
            onClick={() => onDrop(drop.count, drop.key)}
            disabled={disabled || pending === 0 || drop.count === 0}
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {drop.label}
          </Button>
        ))}

        <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />

        <Button size="sm" variant="outline" className={BUTTON} onClick={() => onFeed(!feedActive)} disabled={disabled}>
          {feedActive ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
          {feedActive ? 'Stop automatic feed' : 'Start automatic feed'}
        </Button>
        <Button size="sm" variant="ghost" className="h-9 gap-1.5 text-[12.5px] text-mutedink" onClick={onReload} disabled={disabled}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reload example traffic
        </Button>
      </div>

      <p className="text-[11.5px] leading-relaxed text-mutedink">
        {canDrive
          ? `${pending} ${pending === 1 ? 'message is' : 'messages are'} ready to drop. ${
              feedActive
                ? 'The automatic feed is running and sends on its own schedule; the first drop stops it so only your clicks move traffic.'
                : 'The automatic feed is stopped, so only these buttons move traffic.'
            } Every drop, feed change and reload is recorded in the audit trail.`
          : 'Only an administrator drives the C2OIX server. The counts above still update live.'}
      </p>
    </div>
  );
}
