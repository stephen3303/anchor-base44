import { cn } from '@/lib/utils';

const MAP = {
  ACTIVE: { dot: 'bg-lifecycle-active', className: 'border-lifecycle-active/45 text-lifecycle-active' },
  AMENDED: { dot: 'bg-lifecycle-amended', className: 'border-lifecycle-amended/45 text-lifecycle-amended' },
  CORRECTED: { dot: 'bg-lifecycle-amended', className: 'border-lifecycle-amended/45 text-lifecycle-amended' },
  SUPERSEDED: { dot: 'bg-lifecycle-superseded', className: 'border-line text-mutedink' },
  EXPIRED: { dot: 'bg-lifecycle-superseded', className: 'border-line text-mutedink' },
  CANCELLED: { dot: 'bg-lifecycle-cancelled', className: 'border-lifecycle-cancelled/45 text-lifecycle-cancelled' },
};

export default function LifecycleBadge({ lifecycle, className }) {
  const style = MAP[lifecycle] || MAP.ACTIVE;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.1em]',
        style.className,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {lifecycle}
    </span>
  );
}