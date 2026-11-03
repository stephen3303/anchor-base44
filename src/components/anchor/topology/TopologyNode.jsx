import { ListOrdered, Monitor, Send, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NodePipes from './NodePipes';

const TONE = {
  up: {
    border: 'border-line',
    chip: 'border-lifecycle-active/40 bg-lifecycle-active/5 text-lifecycle-active',
    dot: 'bg-[#2FBF71]',
  },
  down: {
    border: 'border-lifecycle-cancelled/60',
    chip: 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/10 text-lifecycle-cancelled',
    dot: 'bg-[#C8102E]',
  },
  unknown: {
    border: 'border-gold/60',
    chip: 'border-gold/70 bg-gold/15 text-navy-800',
    dot: 'bg-gold',
  },
};

/** One node of the diagram: what it is, what state it is in, and the facts that show it. */
export default function TopologyNode({ node, busy, onShowQueue, onRelease }) {
  const style = TONE[node.status] || TONE.unknown;
  const Icon = node.kind === 'server' ? Server : Monitor;

  return (
    <div className={cn('w-full rounded-md border bg-white p-3 shadow-sm', style.border)}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-navy-800" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold leading-tight text-ink">{node.name}</p>
          <p className="anchor-mono text-[10px] uppercase tracking-[0.14em] text-mutedink">{node.code}</p>
        </div>
        <span
          className={cn(
            'ml-auto flex shrink-0 items-center gap-1.5 rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em]',
            style.chip,
          )}
        >
          <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
          {node.statusLabel}
        </span>
      </div>

      <p className="mt-1.5 text-[11.5px] leading-relaxed text-mutedink">{node.detail}</p>

      {node.statusNote && (
        <p className={cn('mt-1.5 rounded-sm border px-2 py-1 text-[11px] leading-snug', style.chip)}>{node.statusNote}</p>
      )}

      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {node.facts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-mutedink">{fact.label}</dt>
            <dd className="anchor-mono mt-0.5 truncate text-[11.5px] text-ink" title={String(fact.value)}>
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>

      {node.pipes && <NodePipes pipes={node.pipes} />}

      {(onRelease || onShowQueue) && (
        <div className="mt-2.5 flex flex-col gap-1.5">
          {onRelease && (
            <Button size="sm" className="h-7 w-full gap-1.5 px-2 text-[11px]" onClick={onRelease} disabled={busy}>
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              Release next message
            </Button>
          )}

          {onShowQueue && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full gap-1.5 border-line px-2 text-[11px] text-navy-800 hover:bg-navy-100/60"
              onClick={onShowQueue}
            >
              <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
              Show message queue
            </Button>
          )}
        </div>
      )}
    </div>
  );
}