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
      'Released messages the local server is holding for transmit. The circuit takes them in turn, and nothing is lost while it is down.',
    empty: 'The local server is holding nothing for transmit.',
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
        const { items } = await base44.entities.SimTransmission.filter(
          { status: 'held' },
          { sort: '-created_date', limit: 100 },
        );
        setTransmissions(items || []);
        setMessages([]);
      }
    } finally {
      setReading(false);
    }
  }, [nodeKey]);

  useEffect(() => {
    if (open) read();
  }, [open, read]);

  const queued = nodeKey === 'c2oix' ? messages : transmissions;

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

        {!reading &&
          queued.length > 0 &&
          (nodeKey === 'c2oix' ? (
            <RepositoryTable messages={messages} />
          ) : (
            <TransmissionTable transmissions={transmissions} />
          ))}
      </DialogContent>
    </Dialog>
  );
}