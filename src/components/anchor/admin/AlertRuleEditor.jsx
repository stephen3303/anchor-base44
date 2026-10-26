import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { recordAudit } from '@/lib/audit';
import { COMMUNITIES, MESSAGE_TYPES, PRECEDENCE_ORDER } from '@/data/anchorSampleData';

const EMPTY = {
  name: '',
  description: '',
  priority: 10,
  ack_required: false,
  ack_window_hours: 12,
  escalate_to_role: 'Watch Officer',
  escalate_after_hours: 4,
  match_precedence: [],
  match_types: [],
  match_communities: [],
};

const toCsv = (list) => (list || []).join(', ');
const fromCsv = (text) =>
  text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

/** One rule: the conditions, the acknowledgement window and the escalation path. */
export default function AlertRuleEditor({ rule, open, onOpenChange, onSaved }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, ...(rule || {}) });
  }, [open, rule]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        priority: Number(form.priority) || 10,
        active: form.active !== false,
        ack_required: Boolean(form.ack_required),
        ack_window_hours: Number(form.ack_window_hours) || 0,
        escalate_to_role: form.escalate_to_role.trim(),
        escalate_after_hours: Number(form.escalate_after_hours) || 0,
        match_precedence: form.match_precedence,
        match_types: form.match_types,
        match_communities: form.match_communities,
        created_by_name: user?.full_name || user?.email || '',
      };
      const saved = rule?.id
        ? await base44.entities.AlertRule.update(rule.id, payload)
        : await base44.entities.AlertRule.create(payload);

      await recordAudit({
        action: 'alert_rule_changed',
        target_type: 'alert_rule',
        target_id: saved.id,
        target_reference: saved.name,
        detail: `${rule?.id ? 'Updated' : 'Created'} — ${
          saved.ack_required ? `acknowledgement required within ${saved.ack_window_hours}h` : 'delivery only'
        }`,
      });

      toast({ title: rule?.id ? 'Alert rule updated' : 'Alert rule created', description: saved.name });
      onSaved(saved);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const listField = (label, key, hint) => (
    <div>
      <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">{label}</Label>
      <Input
        value={toCsv(form[key])}
        onChange={(e) => set({ [key]: fromCsv(e.target.value) })}
        placeholder={hint}
        className="mt-1 h-9 border-line text-[12.5px]"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[16px]">{rule?.id ? 'Edit alert rule' : 'New alert rule'}</DialogTitle>
          <DialogDescription className="text-[12.5px]">
            An empty condition matches everything. The window is measured from the time a message is received.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Rule name</Label>
            <Input
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              className="mt-1 h-9 border-line text-[12.5px]"
            />
          </div>

          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={2}
              className="mt-1 border-line text-[12.5px]"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {listField('Precedence', 'match_precedence', PRECEDENCE_ORDER.join(', '))}
            {listField('Message types', 'match_types', MESSAGE_TYPES.slice(0, 3).join(', '))}
            {listField('Communities', 'match_communities', COMMUNITIES.slice(0, 3).join(', '))}
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Priority</Label>
              <Input
                type="number"
                value={form.priority}
                onChange={(e) => set({ priority: e.target.value })}
                className="mt-1 h-9 border-line text-[12.5px]"
              />
            </div>
          </div>

          <div className="rounded-sm border border-line bg-page/70 p-3">
            <label className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
              <Checkbox
                checked={Boolean(form.ack_required)}
                onCheckedChange={(checked) => set({ ack_required: Boolean(checked) })}
              />
              Acknowledgement required
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">
                  Window (hours)
                </Label>
                <Input
                  type="number"
                  value={form.ack_window_hours}
                  onChange={(e) => set({ ack_window_hours: e.target.value })}
                  disabled={!form.ack_required}
                  className="mt-1 h-9 border-line text-[12.5px]"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">
                  Escalate to
                </Label>
                <Input
                  value={form.escalate_to_role}
                  onChange={(e) => set({ escalate_to_role: e.target.value })}
                  disabled={!form.ack_required}
                  className="mt-1 h-9 border-line text-[12.5px]"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">
                  Escalate after (hours)
                </Label>
                <Input
                  type="number"
                  value={form.escalate_after_hours}
                  onChange={(e) => set({ escalate_after_hours: e.target.value })}
                  disabled={!form.ack_required}
                  className="mt-1 h-9 border-line text-[12.5px]"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-[12.5px] text-ink">
            <Checkbox checked={form.active !== false} onCheckedChange={(checked) => set({ active: Boolean(checked) })} />
            Rule is active
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-9 border-line text-[12.5px]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-9 bg-navy-800 text-[12.5px]"
            onClick={save}
            disabled={busy || !form.name.trim()}
          >
            {busy ? 'Saving…' : 'Save rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}