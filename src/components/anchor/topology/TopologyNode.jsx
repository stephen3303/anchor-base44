import { Monitor, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

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

/** How many messages are at the node, and the one message it shows (next to send, or last received). */
function NodeTraffic({ count, message }) {
  return (
    <div className="mt-2 flex items-stretch gap-2">
      <div
        className={cn(
          'flex w-[92px] shrink-0 flex-col justify-center rounded-sm border px-2 py-1.5',
          count.tone === 'attention' ? 'border-gold/60 bg-gold/10' : 'border-line bg-navy-800/[0.03]',
        )}
      >
        <p className="text-[9px] font-semibold uppercase leading-tight tracking-[0.12em] text-mutedink">{count.label}</p>
        <p className="anchor-mono mt-0.5 text-[20px] font-semibold leading-none text-ink" aria-live="polite">
          {count.value}
        </p>
      </div>
      <div className="min-w-0 flex-1 rounded-sm border border-line px-2 py-1.5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-mutedink">{message.label}</p>
        {message.reference ? (
          <>
            <p className="anchor-mono mt-0.5 truncate text-[11.5px] font-semibold text-ink" title={message.reference}>
              {message.reference}
              {message.precedence && <span className="ml-1.5 font-normal text-mutedink">{message.precedence}</span>}
            </p>
            <p className="truncate text-[11px] text-mutedink" title={message.subject}>
              {message.subject}
            </p>
            {message.at && <p className="anchor-mono text-[10px] text-mutedink">{message.at}</p>}
          </>
        ) : (
          <p className="mt-0.5 text-[11.5px] text-mutedink">{message.empty}</p>
        )}
      </div>
    </div>
  );
}

/** One node of the diagram: what it is, what state it is in, and the facts that show it. */
export default function TopologyNode({ node }) {
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

      {node.count && node.message && <NodeTraffic count={node.count} message={node.message} />}
      {node.count?.note && <p className="mt-1 text-[10.5px] text-mutedink">{node.count.note}</p>}

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
    </div>
  );
}