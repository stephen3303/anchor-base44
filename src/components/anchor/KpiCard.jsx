import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'border-line text-ink',
  attention: 'border-lifecycle-amended/50 text-lifecycle-amended',
  critical: 'border-lifecycle-cancelled/50 text-lifecycle-cancelled',
  quiet: 'border-line text-mutedink',
};

export default function KpiCard({ label, value, note, tone = 'neutral' }) {
  return (
    <div className={cn('min-w-0 rounded-md border bg-white px-4 py-3 shadow-sm', TONES[tone])}>
      <p className="text-[10px] font-semibold uppercase leading-snug tracking-[0.16em] text-mutedink">{label}</p>
      <p className="anchor-mono mt-1 text-[26px] font-semibold leading-none">{value}</p>
      {note && <p className="mt-1.5 break-words text-[11.5px] leading-snug text-mutedink">{note}</p>}
    </div>
  );
}