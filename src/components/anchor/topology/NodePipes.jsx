import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PIPE = {
  inbound: { label: 'Inbound', Icon: ArrowDownLeft, bar: 'bg-navy-600' },
  outbound: { label: 'Outbound', Icon: ArrowUpRight, bar: 'bg-gold-dark' },
};

/** One direction of a node's traffic: what waits at the node, and what it has moved. */
function Pipe({ kind, data }) {
  const { label, Icon, bar } = PIPE[kind];
  const waiting = data?.waiting || 0;
  const processed = data?.processed || 0;
  const live = data?.live !== false;
  const total = waiting + processed;
  const share = total ? Math.round((waiting / total) * 100) : 0;

  return (
    <div
      className={cn('min-w-0 rounded-sm border border-line bg-secondary/40 px-2 py-1.5', !live && 'opacity-55')}
      title={`${label}: ${waiting} waiting, ${processed} processed${live ? '' : ' — link down'}`}
    >
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3 shrink-0 text-navy-800" aria-hidden="true" />
        <span className="truncate text-[9.5px] font-semibold uppercase tracking-[0.12em] text-navy-800">{label}</span>
      </div>

      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="anchor-mono text-[13px] font-semibold leading-none text-ink">{waiting}</span>
        <span className="text-[9px] uppercase tracking-[0.1em] text-mutedink">waiting</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="anchor-mono text-[11px] leading-none text-mutedink">{processed}</span>
        <span className="text-[9px] uppercase tracking-[0.1em] text-mutedink">processed</span>
      </div>

      <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-line" aria-hidden="true">
        <span className={cn('block h-full rounded-full', bar)} style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

/** The two pipes every node of the diagram carries, inbound and outbound. */
export default function NodePipes({ pipes }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      <Pipe kind="inbound" data={pipes.inbound} />
      <Pipe kind="outbound" data={pipes.outbound} />
    </div>
  );
}