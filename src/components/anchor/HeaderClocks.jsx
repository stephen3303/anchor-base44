import useNow from '@/hooks/useNow';
import useTimeZone from '@/hooks/useTimeZone';
import { zoneAbbreviation, zoneTime, zuluTime } from '@/lib/time';

const ROW = 'anchor-mono flex items-baseline justify-end gap-1.5 text-[11px] leading-[1.5] text-navy-100/65';
const LABEL = 'text-[8.5px] font-semibold uppercase tracking-[0.14em]';

/** Both clocks the watch reads: filed time in Zulu, and the same instant on the operator's clock. */
export default function HeaderClocks() {
  const now = useNow();
  const { zone, label, followsHost } = useTimeZone();

  return (
    <div
      className="text-right"
      title={followsHost ? 'Local time follows this computer' : `Local time set to ${label}`}
    >
      <p className={ROW}>
        <span className={`${LABEL} text-gold/75`}>Zulu</span>
        <span>{zuluTime(now, { seconds: true })}Z</span>
      </p>
      <p className={ROW}>
        <span className={`${LABEL} text-navy-100/40`}>Local</span>
        <span>
          {zoneTime(now, zone, { seconds: true })} {zoneAbbreviation(zone, now)}
        </span>
      </p>
    </div>
  );
}