import { cn } from '@/lib/utils';

export default function SectionCard({ title, hint, action, children, className }) {
  return (
    <section className={cn('rounded-md border border-line bg-white shadow-sm', className)}>
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-800">{title}</h2>
        {hint && <span className="text-[11px] text-mutedink">{hint}</span>}
        {action && <span className="ml-auto text-[12px] font-semibold">{action}</span>}
      </header>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}