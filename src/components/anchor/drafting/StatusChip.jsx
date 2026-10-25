import { DRAFT_STATUS } from '@/lib/drafting';
import { cn } from '@/lib/utils';

export default function StatusChip({ status, className }) {
  const meta = DRAFT_STATUS[status] || DRAFT_STATUS.drafting;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-1.5 py-[2px] text-[9.5px] font-semibold uppercase tracking-[0.1em]',
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}