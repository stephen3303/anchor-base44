import { Link } from 'react-router-dom';
import { PlugZap } from 'lucide-react';

/**
 * Ingestion health. The pilot reads a sample traffic set from the command server,
 * and this states that plainly rather than implying live traffic.
 */
export default function IngestStatusBanner() {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-line bg-navy-100/60 px-4 py-1.5 text-[11.5px] text-ink anchor-no-print">
      <PlugZap className="h-3.5 w-3.5 shrink-0 text-mutedink" aria-hidden="true" />
      <span className="font-semibold uppercase tracking-[0.1em]">C2OIX feed — sample traffic set</span>
      <span className="text-mutedink">
        This portal is served by, and writes to, the command server. Live ingest, the read rollup and server-side
        escalation follow.
      </span>
      <Link
        to="/network-topology"
        className="ml-auto shrink-0 font-semibold text-navy-600 underline decoration-navy-600/30 underline-offset-2"
      >
        Connectivity
      </Link>
    </div>
  );
}