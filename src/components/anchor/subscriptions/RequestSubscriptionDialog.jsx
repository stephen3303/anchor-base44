import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { recordAudit } from '@/lib/audit';
import { CATEGORIES, FREQUENCY_LABEL, feedCoverage } from '@/lib/subscriptions';
import { SAMPLE_MESSAGES } from '@/data/anchorSampleData';
import TemplateCriteriaPicker from '@/components/anchor/subscriptions/TemplateCriteriaPicker';

/**
 * Users create requests only. A request stays Pending Approval until an
 * administrator decides, and the justification travels with it.
 */
export default function RequestSubscriptionDialog({ open, onOpenChange, onRequest, templates = [] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    category: CATEGORIES[0],
    frequency: 'daily',
    communities: '',
    templateIds: [],
    inApp: true,
    email: false,
    justification: '',
  });
  const [busy, setBusy] = useState(false);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const communities = () =>
    form.communities
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

  const toggleTemplate = (id) =>
    set({ templateIds: form.templateIds.includes(id) ? form.templateIds.filter((entry) => entry !== id) : [...form.templateIds, id] });

  const coverage = feedCoverage(
    { status: 'active', criteria_template_ids: form.templateIds, criteria_communities: communities() },
    SAMPLE_MESSAGES,
    templates,
  );

  const templateNames = templates
    .filter((template) => form.templateIds.includes(template.id))
    .map((template) => template.name);

  const submit = async () => {
    setBusy(true);
    try {
      const channels = [form.inApp ? 'in_app' : null, form.email ? 'email' : null].filter(Boolean);
      const row = await onRequest({
        name: form.name.trim(),
        category: form.category,
        description: templateNames.length
          ? `Requested feed following the tags of ${templateNames.join(', ')}`
          : `Requested feed covering ${form.communities.trim() || form.category}`,
        frequency: form.frequency,
        status: 'pending',
        mandatory: false,
        channels: channels.length ? channels : ['in_app'],
        criteria_template_ids: form.templateIds,
        criteria_communities: communities(),
        justification: form.justification.trim(),
        requested_by_name: user?.full_name || '',
        requested_by_email: user?.email || '',
      });

      await recordAudit({
        action: 'subscription_requested',
        target_type: 'subscription',
        target_id: row.id,
        target_reference: row.name,
        detail: form.justification.trim(),
      });

      toast({ title: 'Request submitted', description: `${row.name} · pending administrator approval.` });
      onOpenChange(false);
      setForm({ ...form, name: '', communities: '', templateIds: [], justification: '' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-[16px]">Request a subscription</DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Requests are approved by an administrator. Mandatory traffic is delivered by alert rule and is not a
            subscription — it cannot be muted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Feed name</Label>
            <Input
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              className="mt-1 h-9 border-line text-[12.5px]"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Category</Label>
              <Select value={form.category} onValueChange={(v) => set({ category: v })}>
                <SelectTrigger className="mt-1 h-9 border-line text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">Frequency</Label>
              <Select value={form.frequency} onValueChange={(v) => set({ frequency: v })}>
                <SelectTrigger className="mt-1 h-9 border-line text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABEL).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">
              Follow by template tag
            </Label>
            <p className="mb-1 mt-0.5 text-[11px] leading-snug text-mutedink">
              A tagged template claims its traffic whatever the subject line says, so the feed keeps working when an
              originator rewords it.
            </p>
            <TemplateCriteriaPicker templates={templates} selected={form.templateIds} onToggle={toggleTemplate} />
          </div>

          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">
              Communities covered — broad fallback
            </Label>
            <Input
              value={form.communities}
              onChange={(e) => set({ communities: e.target.value })}
              placeholder="Cybersecurity, Policy"
              className="mt-1 h-9 border-line text-[12.5px]"
            />
          </div>

          <div className="rounded-sm border border-line bg-secondary/40 px-3 py-2.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mutedink">Would deliver</p>
            <p className="mt-1 text-[12px] text-ink">
              {coverage.length} of {SAMPLE_MESSAGES.length} messages held in the traffic set
            </p>
            {coverage.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {coverage.slice(0, 3).map((message) => (
                  <li key={message.id} className="anchor-mono text-[11px] text-mutedink">
                    {message.reference} — {message.subject}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-[12.5px] text-ink">
              <Checkbox checked={form.inApp} onCheckedChange={(checked) => set({ inApp: Boolean(checked) })} />
              In-app
            </label>
            <label className="flex items-center gap-2 text-[12.5px] text-ink">
              <Checkbox checked={form.email} onCheckedChange={(checked) => set({ email: Boolean(checked) })} />
              Email
            </label>
          </div>

          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedink">
              Justification — required
            </Label>
            <Textarea
              value={form.justification}
              onChange={(e) => set({ justification: e.target.value })}
              rows={3}
              placeholder="Why this feed is needed for the watch or the department"
              className="mt-1 border-line text-[12.5px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-9 border-line text-[12.5px]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-9 bg-navy-800 text-[12.5px]"
            onClick={submit}
            disabled={busy || !form.name.trim() || !form.justification.trim()}
          >
            {busy ? 'Submitting…' : 'Submit request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}