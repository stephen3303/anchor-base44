import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HardDrive } from 'lucide-react';
import SectionCard from '@/components/anchor/SectionCard';
import ConnectivityPanel from '@/components/anchor/offline/ConnectivityPanel';
import DiagnosticsPanel from '@/components/anchor/diagnostics/DiagnosticsPanel';
import SyncQueueTable from '@/components/anchor/offline/SyncQueueTable';
import useConnectivity from '@/hooks/useConnectivity';
import { readQueue } from '@/lib/syncQueue';
import { SAMPLE_MESSAGES, unreadCount } from '@/data/anchorSampleData';

export default function Offline() {
  const { offline } = useConnectivity();
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
          Connectivity and transmission
        </h1>
        <p className="mt-1 text-[13px] text-mutedink">
          The command server this portal is served by, the C2OIX circuit, and what waits for it
        </p>
      </header>

      <SectionCard
        title="Links at this command"
        hint="The command server is measured; the circuit is reported by the watch"
      >
        <ConnectivityPanel queueLength={held.length} />
        <p className="mt-3 text-[11.5px] leading-relaxed text-mutedink">
          Testing: the external C2OIX server and the local ANCHOR server can be driven from{' '}
          <Link to="/simulators" className="font-semibold text-navy-600 underline underline-offset-2">
            Server simulators
          </Link>
          .
        </p>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="What continues" hint="Held on the command server, so it works with the circuit down">
          <div className="flex items-start gap-3">
            <HardDrive className="mt-0.5 h-4 w-4 text-navy-800" aria-hidden="true" />
            <div>
              <p className="text-[13px] text-ink">
                {SAMPLE_MESSAGES.length} records held on the command server · {unreadCount()} new or unread
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-mutedink">
                Reading traffic, drafting, routing between staff, releasing and filing all continue while the circuit
                is down, because every one of them is recorded on the command server at this command. An offline
                document cache on the workstation is deferred beyond the pilot, so this is graceful degradation
                rather than a copy of the database held on the desk.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="What waits for the circuit" hint="Replayed in this order on restore">
          <ol className="space-y-1.5 text-[12.5px] text-ink">
            <li>1. Acknowledgements — they carry a deadline and escalate when late.</li>
            <li>
              2. Transmissions — a released message waits here; its DTG, MSN and local sequence are assigned when it
              actually transmits, never while it waits.
            </li>
          </ol>
          <p className="mt-2 text-[12px] leading-relaxed text-mutedink">
            Each replay is written to the audit chain, so an action taken without the circuit is still accountable,
            and the release authority on the record is the one who released it.
          </p>
        </SectionCard>
      </div>

      <SectionCard title="Transmission queue" hint="Held on this workstation">
        <SyncQueueTable offline={offline} />
        <p className="mt-3 text-[11.5px] leading-relaxed text-mutedink">
          The queue survives a reload of this workstation but not a move to another one. A queue held on the command
          server follows with C2OIX ingest; until then a held release can simply be released again from the draft.
        </p>
      </SectionCard>

      <SectionCard
        title="Fault statements"
        hint="What to send the supporting activity when the portal fails"
      >
        <DiagnosticsPanel />
      </SectionCard>
    </div>
  );
}