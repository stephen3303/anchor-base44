import { cn } from '@/lib/utils';

/**
 * Volume as a proportion of the largest bar — the two measures that matter for
 * watch planning: what kind of traffic, and how urgent.
 */
export default function VolumeBars({ title, hint, items }) {
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink">{title}</h3>
        {hint && <p className="text-[11px] text-mutedink">{hint}</p>}
      </div>
      <ul className="mt-2.5 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
            <div className="min-w-0">
              <p className="truncate text-[12px] text-ink">{item.label}</p>
              <div className="mt-1 h-[6px] w-full overflow-hidden rounded-full bg-navy-100">
                <div
                  className={cn('h-full rounded-full', item.tone === 'critical' ? 'bg-lifecycle-cancelled' : 'bg-navy-600')}
                  style={{ width: `${Math.round((item.count / max) * 100)}%` }}
                />
              </div>
            </div>
            <span className="anchor-mono text-[12px] font-semibold text-ink">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}