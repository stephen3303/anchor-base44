import { useEffect, useState } from 'react';
import { ArrowRight, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import CommaListInput from '@/components/anchor/drafting/CommaListInput';
import { MESSAGE_TYPES, STEP_ACTIONS, DUTY_SUGGESTIONS } from '@/data/draftOptions';
import { cn } from '@/lib/utils';

const emptyStep = (order) => ({ order, title: '', duty: '', assignee_email: '', assignee_name: '', action: 'review' });

/** Defines a routing chain: what it matches on, and who holds each step. */
export default function RoutingWorkflowEditor({ workflow, users, onSave, onCancel, busy }) {
  const [form, setForm] = useState(() => ({
    name: '',
    description: '',
    active: true,
    match_message_types: [],
    match_originators: [],
    steps: [emptyStep(1), { ...emptyStep(2), action: 'release' }],
  }));

  useEffect(() => {
    if (workflow) {
      setForm({
        name: workflow.name || '',
        description: workflow.description || '',
        active: workflow.active !== false,
        match_message_types: workflow.match_message_types || [],
        match_originators: workflow.match_originators || [],
        steps: (workflow.steps || []).length ? workflow.steps : [emptyStep(1)],
      });
    }
  }, [workflow]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const setStep = (index, patch) =>
    set({ steps: form.steps.map((s, i) => (i === index ? { ...s, ...patch } : s)) });

  const toggleType = (type) =>
    set({
      match_message_types: form.match_message_types.includes(type)
        ? form.match_message_types.filter((t) => t !== type)
        : [...form.match_message_types, type],
    });

  const canSave = form.name.trim() && form.steps.some((s) => s.assignee_email);

  return (
    <div className="space-y-4 rounded-md border border-navy-600/40 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Workflow name</Label>
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Force message release" className="h-9 text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Originators (blank = any)</Label>
          <CommaListInput value={form.match_originators} onChange={(v) => set({ match_originators: v })} placeholder="COMSUBLANT NORFOLK VA" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={2}
          placeholder="What this chain is for and who it applies to"
          className="text-[12.5px]"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">
          Message types this applies to (none selected = any type)
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {MESSAGE_TYPES.map((t) => {
            const on = form.match_message_types.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={cn(
                  'rounded-sm border px-2 py-1 text-[11px] font-semibold transition-colors',
                  on ? 'border-navy-600 bg-navy-600 text-white' : 'border-line bg-white text-mutedink hover:border-navy-600/50',
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Routing chain</Label>
        {form.steps.map((step, index) => (
          <div key={index} className="rounded-sm border border-line bg-secondary/40 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="anchor-mono flex h-5 w-5 items-center justify-center rounded-full bg-navy-800 text-[10px] font-bold text-white">
                {index + 1}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-mutedink" aria-hidden="true" />
              <span className="text-[11.5px] text-mutedink">
                {step.action === 'release' ? 'Final step — release' : 'Review step'}
              </span>
              {form.steps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => set({ steps: form.steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })) })}
                  className="ml-auto h-7 px-2"
                  title="Remove step"
                >
                  <Trash2 className="h-3.5 w-3.5 text-lifecycle-cancelled" />
                </Button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={step.title}
                onChange={(e) => setStep(index, { title: e.target.value })}
                placeholder="Step name (e.g. N3 review)"
                className="h-8 text-[12.5px]"
              />
              <Input
                value={step.duty}
                onChange={(e) => setStep(index, { duty: e.target.value })}
                placeholder={DUTY_SUGGESTIONS.join(' / ')}
                className="h-8 text-[12.5px]"
              />
              <Select
                value={step.assignee_email || ''}
                onValueChange={(v) => {
                  const person = users.find((u) => u.email === v);
                  setStep(index, { assignee_email: v, assignee_name: person?.full_name || v });
                }}
              >
                <SelectTrigger className="h-8 text-[12.5px]">
                  <SelectValue placeholder="Assign to a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.email} value={u.email} className="text-[12.5px]">
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={step.action} onValueChange={(v) => setStep(index, { action: v })}>
                <SelectTrigger className="h-8 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STEP_ACTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value} className="text-[12.5px]">
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => set({ steps: [...form.steps, emptyStep(form.steps.length + 1)] })}
          className="gap-1.5 text-[12px]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add step
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <Button type="button" size="sm" onClick={() => onSave(form)} disabled={busy || !canSave} className="gap-1.5 text-[12.5px]">
          <Save className="h-3.5 w-3.5" aria-hidden="true" />
          Save workflow
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-[12.5px]">
          Cancel
        </Button>
        {!form.steps.some((s) => s.action === 'release') && (
          <p className="text-[11.5px] font-semibold text-precedence-immediate">
            This chain has no release step — nothing would reach a release authority.
          </p>
        )}
      </div>
    </div>
  );
}