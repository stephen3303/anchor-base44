import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { recordAudit } from '@/lib/audit';
import useNow from '@/hooks/useNow';
import useTimeZone from '@/hooks/useTimeZone';
import { FOLLOW_HOST, resolveZone } from '@/lib/timeZone';
import {
  ZONE_GROUPS,
  ZONE_OPTIONS,
  zoneAbbreviation,
  zoneLabel,
  zoneOffset,
  zoneTime,
  zuluTime,
} from '@/lib/time';

function Readout({ label, value, note, highlight }) {
  return (
    <div className="rounded-md border border-line bg-page/70 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedink">{label}</p>
      <p className={`anchor-mono mt-1 text-[15px] ${highlight ? 'text-navy-800' : 'text-ink'}`}>{value}</p>
      <p className="mt-0.5 text-[10.5px] leading-snug text-mutedink">{note}</p>
    </div>
  );
}

/**
 * Where the operator's own clock reads from. Official times stay Zulu; this only
 * decides which clock they are shown against.
 */
export default function TimeZonePanel({ user }) {
  const { preference, hostZone, setPreference } = useTimeZone();
  const { toast } = useToast();
  const now = useNow();
  const [zone, setZone] = useState(preference);
  const [busy, setBusy] = useState(false);

  useEffect(() => setZone(preference), [preference]);

  const preview = resolveZone(zone);
  const dirty = zone !== preference;
  const known = zone === FOLLOW_HOST || ZONE_OPTIONS.some((option) => option.value === zone);
  const options = known ? ZONE_OPTIONS : [...ZONE_OPTIONS, { group: 'Standard', value: zone, label: zone }];

  const save = async () => {
    setBusy(true);
    try {
      await base44.auth.updateMe({ time_zone: zone });
      setPreference(zone);
      await recordAudit({
        action: 'profile_updated',
        target_type: 'user',
        target_reference: user?.email || '',
        detail: `Local time zone set to ${zone === FOLLOW_HOST ? `this computer (${hostZone})` : zone}`,
      });
      toast({
        title: 'Time zone saved',
        description:
          zone === FOLLOW_HOST
            ? `Local time now follows this computer (${hostZone}).`
            : `Local time now reads ${zoneLabel(zone)}.`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Readout
          label="Zulu — as filed"
          value={`${zuluTime(now, { seconds: true })}Z`}
          note="Every DTG and every audit entry is recorded in this time."
        />
        <Readout
          label={`Local — ${zoneAbbreviation(preview, now)}`}
          value={zoneTime(now, preview, { seconds: true })}
          note={`${zoneLabel(preview)} · ${zoneOffset(preview, now)}`}
          highlight
        />
      </div>

      <div>
        <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Local time zone</Label>
        <Select value={zone} onValueChange={setZone}>
          <SelectTrigger className="mt-1 h-9 w-full max-w-[420px] border-line text-[12.5px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FOLLOW_HOST}>Sync with this computer — {hostZone}</SelectItem>
            {ZONE_GROUPS.map((group) => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {options
                  .filter((option) => option.group === group)
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} — {option.value}
                    </SelectItem>
                  ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          className="h-9 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600"
          onClick={save}
          disabled={busy || !dirty}
        >
          <Save className="h-3.5 w-3.5" />
          {busy ? 'Saving…' : 'Save time zone'}
        </Button>
        {dirty && <p className="text-[11.5px] font-medium text-gold-dark">Preview — not saved yet</p>}
      </div>

      <p className="text-[11.5px] leading-relaxed text-mutedink">
        Official times are always Zulu. The zone set here changes only how times are shown to you: hovering a DTG in a
        message list shows that instant on your own clock.
      </p>
    </div>
  );
}