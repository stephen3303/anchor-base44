import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RepositoryTable from '@/components/anchor/simulator/RepositoryTable';
import TransmissionTable from '@/components/anchor/simulator/TransmissionTable';
import { cn } from '@/lib/utils';

const COPY = {
  c2oix: {
    title: 'C2OIX message queue',
    description:
      'Traffic the external server still holds for this command: queued for hand-over, or deferred because the last attempt did not get through.',
    empty: 'Nothing is waiting at the external server for this command.',
  },
  anchor: {
    title: 'ANCHOR message queue',
    description:
      'What the local server is holding: traffic received for a workstation that cannot take it yet, and released messages waiting for the circuit.',
    empty: 'The local server is holding nothing.',
  },
};

/** One server's queue, read from the same rows the server simulators keep. */
export default function NodeQueueDialog({ nodeKey, open, onOpenChange }) {
  const [messages, setMessages] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [reading, setReading] = useState(false);

  const copy = COPY[nodeKey] || COPY.anchor;

  const read = useCallback(async () => {
    setReading(true);
    try {
      if (nodeKey === 'c2oix') {
        const { items } = await base44.entities.SimMessage.filter(
          { status: { $in: ['queued', 'deferred'] } },
          { sort: 'sequence', limit: 100 },
        );
        setMessages(items || []);
        setTransmissions([]);
      } else {
        const [{ items: held }, { items: inbound }] = await Promise.all([
          base44.entities.SimTransmission.filter({ status: 'held' }, { sort: '-created_date', limit: 100 }),
          // Traffic that reached the ANCHOR server and is still waiting for a workstation.
          base44.entities.SimMessage.filter(
            { status: 'ingested', delivered_at: '' },
            { sort: 'sequence', limit: 100 },
          ),
        ]);
        setTransmissions(held || []);
        setMessages(inbound || []);
      }
    } finally {
      setReading(false);
    }
  }, [nodeKey]);

  useEffect(() => {
    if (open) read();
  }, [open, read]);

  const queued = [...messages, ...transmissions];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto border-line bg-white">
        <DialogHeader>
          <DialogTitle className="font-heading text-[18px] font-semibold tracking-tight text-ink">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] leading-relaxed text-mutedink">{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="anchor-mono text-[11px] uppercase tracking-[0.12em] text-mutedink">
            {reading ? 'Reading the queue…' : `${queued.length} waiting`}
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-[12px] text-mutedink"
            onClick={read}
            disabled={reading}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', reading && 'animate-spin')} aria-hidden="true" />
            Refresh
          </Button>
        </div>

        {!reading && queued.length === 0 && (
          <p className="rounded-sm border border-line bg-secondary/40 px-3 py-6 text-center text-[12.5px] text-mutedink">
            {copy.empty}
          </p>
        )}

        {!reading && nodeKey === 'c2oix' && messages.length > 0 && <RepositoryTable messages={messages} />}

        {!reading && nodeKey === 'anchor' && messages.length > 0 && (
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-800">
              Waiting for a workstation
            </p>
            <div className="mt-1.5">
              <RepositoryTable messages={messages} />
            </div>
          </div>
        )}

        {!reading && nodeKey === 'anchor' && transmissions.length > 0 && (
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-800">Held for transmit</p>
            <div className="mt-1.5">
              <TransmissionTable transmissions={transmissions} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}