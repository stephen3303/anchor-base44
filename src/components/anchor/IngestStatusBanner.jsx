import { Link } from 'react-router-dom';
import { PlugZap } from 'lucide-react';

/**
 * Ingestion health. The pilot holds a local sample traffic set, and this states
 * that plainly rather than implying live traffic.
 */
export default function IngestStatusBanner() {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-line bg-navy-100/60 px-4 py-1.5 text-[11.5px] text-ink anchor-no-print">
      <PlugZap className="h-3.5 w-3.5 shrink-0 text-mutedink" aria-hidden="true" />
      <span className="font-semibold uppercase tracking-[0.1em]">C2OIX ingestion — not connected</span>
      <span className="text-mutedink">
        Reading the local sample traffic set. Live ingest, the read rollup and server-side escalation follow.
      </span>
      <Link
        to="/offline"
        className="ml-auto shrink-0 font-semibold text-navy-600 underline decoration-navy-600/30 underline-offset-2"
      >
        Connectivity
      </Link>
    </div>
  );
}