import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { recordAudit } from '@/lib/audit';
import { PERSONNEL_STATUS, RANK_SUGGESTIONS, fullName, shortName } from '@/lib/personnel';

const BLANK = {
  first_name: '',
  middle_name: '',
  last_name: '',
  rank: '',
  position: '',
  email: '',
  status: 'active',
  notes: '',
};

const field = (label, key, form, setForm, placeholder, extra = {}) => (
  <div className="space-y-1.5">
    <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">{label}</Label>
    <Input
      value={form[key]}
      onChange={(event) => setForm({ ...form, [key]: event.target.value })}
      placeholder={placeholder}
      className="h-9 text-[13px]"
      {...extra}
    />
  </div>
);

/** Add or edit one person on the command roster. */
export default function PersonnelEditor({ person, open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(person ? { ...BLANK, ...person } : BLANK);
    setError('');
  }, [person, open]);

  const save = async () => {
    const payload = {
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim(),
      last_name: form.last_name.trim(),
      rank: form.rank.trim(),
      position: form.position.trim(),
      email: form.email.trim(),
      status: form.status || 'active',
      notes: form.notes.trim(),
    };

    if (!payload.first_name || !payload.last_name || !payload.rank || !payload.position) {
      setError('First name, last name, rank and position are required.');
      return;
    }

    setBusy(true);
    try {
      const saved = person?.id
        ? await base44.entities.Personnel.update(person.id, payload)
        : await base44.entities.Personnel.create(payload);

      await recordAudit({
        action: 'personnel_changed',
        target_type: 'personnel',
        target_id: saved.id,
        target_reference: shortName(saved),
        detail: `${person?.id ? 'Updated' : 'Added'} ${fullName(saved)} — ${payload.rank}, ${payload.position}`,
      });

      toast({
        title: person?.id ? 'Personnel record updated' : 'Personnel added',
        description: `${shortName(saved)} — ${payload.position}`,
      });
      onSaved?.(saved);
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError?.message || 'The record could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] border-line">
        <DialogHeader>
          <DialogTitle className="font-heading text-[17px] text-ink">
            {person?.id ? 'Edit personnel record' : 'Add personnel'}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-mutedink">
            Name is held in separate fields so it can be sorted, searched and addressed correctly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {field('First name', 'first_name', form, setForm, 'Marcus', { autoFocus: true })}
            {field('Middle name', 'middle_name', form, setForm, 'A.')}
            {field('Last name', 'last_name', form, setForm, 'Whitfield')}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {field('Rank', 'rank', form, setForm, 'CDR', { list: 'personnel-rank-options' })}
            {field('Position', 'position', form, setForm, 'Commanding Officer')}
          </div>
          <datalist id="personnel-rank-options">
            {RANK_SUGGESTIONS.map((rank) => (
              <option key={rank} value={rank} />
            ))}
          </datalist>

          <div className="grid gap-3 sm:grid-cols-2">
            {field('Email', 'email', form, setForm, 'name@comsublant.example.mil', { type: 'email' })}
            <div className="space-y-1.5">
              <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERSONNEL_STATUS.map((entry) => (
                    <SelectItem key={entry.value} value={entry.value} className="text-[13px]">
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Qualification, billet detail, relief date"
              className="min-h-[70px] text-[13px]"
            />
          </div>

          {error && <p className="text-[11.5px] font-semibold text-lifecycle-cancelled">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="h-9 border-line text-[12.5px]" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" className="h-9 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600" onClick={save} disabled={busy}>
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {busy ? 'Saving…' : person?.id ? 'Save changes' : 'Add to roster'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}