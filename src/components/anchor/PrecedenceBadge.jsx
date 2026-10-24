import { cn } from '@/lib/utils';

/**
 * Precedence is encoded twice: by colour AND by glyph + label, so meaning
 * survives greyscale printing and colour-vision deficiency.
 */
const MAP = {
  FLASH: {
    glyph: '▲▲',
    className: 'border-precedence-flash bg-precedence-flash text-white',
  },
  IMMEDIATE: {
    glyph: '▲',
    className: 'border-precedence-immediate bg-precedence-immediate text-white',
  },
  PRIORITY: {
    glyph: '●',
    className: 'border-precedence-priority bg-white text-precedence-priority',
  },
  ROUTINE: {
    glyph: '○',
    className: 'border-line bg-white text-mutedink',
  },
};

export const PRECEDENCE_RULE = {
  FLASH: 'border-l-precedence-flash',
  IMMEDIATE: 'border-l-precedence-immediate',
  PRIORITY: 'border-l-precedence-priority',
  ROUTINE: 'border-l-precedence-routine',
};

export default function PrecedenceBadge({ precedence, className }) {
  const style = MAP[precedence] || MAP.ROUTINE;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-1.5 py-[3px] font-mono text-[10px] font-semibold uppercase tracking-[0.06em]',
        style.className,
        className,
      )}
    >
      <span aria-hidden="true" className="text-[7px] leading-none">
        {style.glyph}
      </span>
      {precedence}
    </span>
  );
}