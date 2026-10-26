import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { recordAudit } from '@/lib/audit';

/** Rank, unit and duty are user fields, because real PKI is not connected in the pilot. */
export default function IdentityForm({ user, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ rank: '', unit: '', duty: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({
      rank: user?.rank || '',
      unit: user?.unit || '',
      duty: user?.duty || '',
    });
  }, [user?.rank, user?.unit, user?.duty]);

  const save = async () => {
    setBusy(true);
    try {
      await base44.auth.updateMe({
        rank: form.rank.trim(),
        unit: form.unit.trim(),
        duty: form.duty.trim(),
      });
      await recordAudit({
        action: 'profile_updated',
        target_type: 'user',
        target_reference: user?.email || '',
        detail: `Identity fields updated — ${form.rank} ${form.unit} ${form.duty}`.trim(),
      });
      toast({ title: 'Profile saved', description: 'Rank, unit and duty recorded against your account.' });
      onSaved?.(form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Rank</Label>
          <Input
            value={form.rank}
            onChange={(e) => setForm({ ...form, rank: e.target.value })}
            placeholder="LT"
            className="mt-1 h-9 border-line text-[12.5px]"
          />
        </div>
        <div>
          <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Unit</Label>
          <Input
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="COMSUBLANT"
            className="mt-1 h-9 border-line text-[12.5px]"
          />
        </div>
        <div>
          <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Duty</Label>
          <Input
            value={form.duty}
            onChange={(e) => setForm({ ...form, duty: e.target.value })}
            placeholder="Watch Officer"
            className="mt-1 h-9 border-line text-[12.5px]"
          />
        </div>
      </div>

      <Button size="sm" className="h-9 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600" onClick={save} disabled={busy}>
        <Save className="h-3.5 w-3.5" />
        {busy ? 'Saving…' : 'Save identity'}
      </Button>
      <p className="text-[11.5px] text-mutedink">
        Role is granted by an administrator and cannot be changed here.
      </p>
    </div>
  );
}