import { cn } from '@/lib/utils';
import ClassificationStrip from './ClassificationStrip';

export default function AppFooter({ emcon, className }) {
  return (
    <footer className={cn('mt-8 anchor-no-print', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mutedink sm:px-8">
        <span className="text-navy-800">Secure · Reliable · Mission Ready</span>
        <span className="normal-case tracking-normal text-mutedink/90">
          Sample traffic set · C2OIX ingestion not connected ·{' '}
          {emcon ? 'EMCON mode' : 'Online'}
        </span>
      </div>
      <ClassificationStrip />
    </footer>
  );
}