import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import useTimeZone from '@/hooks/useTimeZone';
import { parseDtg, zoneAbbreviation, zoneTime, zuluTime } from '@/lib/time';
import { cn } from '@/lib/utils';

const LABEL = 'w-[34px] shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em]';

/**
 * A message's DTG as a date and time, in the Zulu time it was filed in. Hovering
 * shows the same instant on the operator's own clock — the record does not change,
 * only the clock it is read against.
 */
export default function Dtg({ value, className }) {
  const { zone, label, followsHost } = useTimeZone();
  const instant = parseDtg(value);

  if (!instant) return <span className={cn('anchor-mono', className)}>{value || '—'}</span>;

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'anchor-mono cursor-help underline decoration-dotted decoration-line underline-offset-2',
              className,
            )}
          >
            {zuluTime(instant)}Z
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={6}
          className="w-[268px] border border-white/15 bg-navy-950 px-3 py-2 text-navy-100 shadow-xl"
        >
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gold">DTG {value}</p>
          <div className="mt-1.5 space-y-1">
            <p className="flex items-baseline gap-2">
              <span className={cn(LABEL, 'text-navy-100/50')}>Zulu</span>
              <span className="anchor-mono text-[11.5px]">{zuluTime(instant, { seconds: true })}Z</span>
            </p>
            <p className="flex items-baseline gap-2">
              <span className={cn(LABEL, 'text-navy-100/50')}>Local</span>
              <span className="anchor-mono text-[11.5px] text-gold">
                {zoneTime(instant, zone, { seconds: true })} {zoneAbbreviation(zone, instant)}
              </span>
            </p>
          </div>
          <p className="mt-1.5 border-t border-white/10 pt-1.5 text-[9.5px] leading-snug text-navy-100/55">
            {label}
            {followsHost ? ' · follows this computer' : ''}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}