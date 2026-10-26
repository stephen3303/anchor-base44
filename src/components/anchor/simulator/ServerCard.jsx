import { cn } from '@/lib/utils';

const TONE = {
  up: { chip: 'border-lifecycle-active/40 bg-lifecycle-active/5 text-lifecycle-active', dot: 'bg-[#2FBF71]' },
  attention: { chip: 'border-gold/70 bg-gold/15 text-navy-800', dot: 'bg-gold' },
  error: { chip: 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/10 text-lifecycle-cancelled', dot: 'bg-[#C8102E]' },
};

/** One simulated server: what it is, what state it is in, and the controls for it. */
export default function ServerCard({ title, subtitle, tone, stateLabel, meta, facts, error, children }) {
  const style = TONE[tone] || TONE.attention;

  return (
    <div className="rounded-md border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-full', style.dot)} />
        <h2 className="text-[13.5px] font-semibold text-ink">{title}</h2>
        <span
          className={cn(
            'rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em]',
            style.chip,
          )}
        >
          {stateLabel}
        </span>
        {meta && <span className="anchor-mono ml-auto text-[11px] text-mutedink">{meta}</span>}
      </div>

      <p className="mt-1.5 text-[12px] leading-relaxed text-mutedink">{subtitle}</p>

      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {(facts || []).map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mutedink">{fact.label}</dt>
            <dd className="anchor-mono mt-0.5 truncate text-[12px] text-ink" title={String(fact.value)}>
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>

      {error && (
        <p className="mt-2 rounded-sm border border-lifecycle-cancelled/40 bg-lifecycle-cancelled/5 px-2.5 py-1.5 text-[11.5px] leading-snug text-lifecycle-cancelled">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}