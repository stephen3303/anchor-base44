import { cn } from '@/lib/utils';

/** Classification banner. Printed on every page of the paper rendition. */
export default function ClassificationStrip({ className }) {
  return (
    <div
      className={cn(
        'flex h-[22px] items-center justify-center bg-navy-950 px-3 text-center text-[9.5px] font-semibold uppercase tracking-[0.34em] text-gold',
        className,
      )}
    >
      Unclassified // Prototype
    </div>
  );
}