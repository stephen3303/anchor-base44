import { useEffect, useState } from 'react';
import { HardDrive } from 'lucide-react';
import SectionCard from '@/components/anchor/SectionCard';
import EmconControl from '@/components/anchor/offline/EmconControl';
import SyncQueueTable from '@/components/anchor/offline/SyncQueueTable';
import useEmcon from '@/hooks/useEmcon';
import { readQueue } from '@/lib/syncQueue';
import { SAMPLE_MESSAGES, unreadCount } from '@/data/anchorSampleData';

export default function Offline() {
  const [emcon, setEmcon] = useEmcon();
  const [held, setHeld] = useState(readQueue);

  useEffect(() => {
    const id = window.setInterval(() => setHeld(readQueue()), 2000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 anchor-fade-in">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-mutedink">Act</p>
        <h1 className="mt-1 font-heading text-[24px] font-semibold tracking-tight text-ink sm:text-[27px]">
          EMCON and synchronisation
        </h1>
        <p className="mt-1 text-[13px] text-mutedink">
          A global mode with a queue — what is held locally, and what waits for the network
        </p>
      </header>

      <SectionCard title="Mode and connectivity" hint="One flag for the whole workstation">
        <EmconControl emcon={emcon} onChange={setEmcon} queueLength={held.length} />
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Held locally" hint="Readable without the network">
          <div className="flex items-start gap-3">
            <HardDrive className="mt-0.5 h-4 w-4 text-navy-800" aria-hidden="true" />
            <div>
              <p className="text-[13px] text-ink">
                {SAMPLE_MESSAGES.length} records held in the command traffic set · {unreadCount()} new or unread
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-mutedink">
                The traffic set is held by the application, not cached by this workstation: an offline document cache is
                deferred beyond the pilot, so EMCON keeps received traffic readable rather than storing it here.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Sync priority" hint="Acknowledgements first">
          <ol className="space-y-1.5 text-[12.5px] text-ink">
            <li>1. Acknowledgements — they carry a deadline and escalate when late.</li>
            <li>2. Annotations — held behind acknowledgements.</li>
          </ol>
          <p className="mt-2 text-[12px] leading-relaxed text-mutedink">
            Each replay is written to the audit chain, so a synchronised action is accountable even though it was taken
            without the network.
          </p>
        </SectionCard>
      </div>

      <SectionCard title="Synchronisation" hint="Queued actions on this workstation">
        <SyncQueueTable emcon={emcon} />
      </SectionCard>
    </div>
  );
}