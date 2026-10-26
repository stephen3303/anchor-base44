import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { recordAudit } from '@/lib/audit';

const CHANNELS = [
  ['in_app', 'In-app'],
  ['email', 'Email'],
];

const PRECEDENCE = [
  ['flash', 'FLASH'],
  ['immediate', 'IMMEDIATE'],
  ['priority', 'PRIORITY'],
  ['routine', 'ROUTINE'],
];

const DEFAULTS = {
  in_app: true,
  email: true,
  digest: 'real_time',
  flash: true,
  immediate: true,
  priority: true,
  routine: false,
};

/**
 * Preferences govern how traffic reaches a user. Mandatory acknowledgements are
 * deliberately absent: they are owed regardless of any preference here.
 */
export default function NotificationPreferences({ user, onSaved }) {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPrefs({ ...DEFAULTS, ...(user?.notification_preferences || {}) });
  }, [user?.notification_preferences]);

  const set = (patch) => setPrefs((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    setBusy(true);
    try {
      await base44.auth.updateMe({ notification_preferences: prefs });
      await recordAudit({
        action: 'profile_updated',
        target_type: 'user',
        target_reference: user?.email || '',
        detail: `Notification preferences updated — ${prefs.in_app ? 'in-app' : ''}${prefs.email ? ' + email' : ''}, ${
          prefs.digest
        }`,
      });
      toast({ title: 'Preferences saved', description: 'Delivery preferences recorded against your account.' });
      onSaved?.(prefs);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Channels</p>
        <div className="mt-2 flex flex-wrap gap-4">
          {CHANNELS.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-[12.5px] text-ink">
              <Checkbox checked={Boolean(prefs[key])} onCheckedChange={(checked) => set({ [key]: Boolean(checked) })} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Digest</p>
        <Select value={prefs.digest} onValueChange={(value) => set({ digest: value })}>
          <SelectTrigger className="mt-1 h-9 w-[220px] border-line text-[12.5px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="real_time">Real-time</SelectItem>
            <SelectItem value="daily">Daily digest</SelectItem>
            <SelectItem value="weekly">Weekly digest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Notify me for precedence</p>
        <div className="mt-2 flex flex-wrap gap-4">
          {PRECEDENCE.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-[12.5px] text-ink">
              <Checkbox checked={Boolean(prefs[key])} onCheckedChange={(checked) => set({ [key]: Boolean(checked) })} />
              {label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-mutedink">
          Turning a precedence off stops notifications, not delivery: mandatory traffic still surfaces on Home and in the
          alert strip, and an acknowledgement obligation still applies.
        </p>
      </div>

      <Button size="sm" className="h-9 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600" onClick={save} disabled={busy}>
        <Save className="h-3.5 w-3.5" />
        {busy ? 'Saving…' : 'Save preferences'}
      </Button>
    </div>
  );
}