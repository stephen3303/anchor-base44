import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
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
import { useToast } from '@/components/ui/use-toast';
import CommaListInput from '@/components/anchor/drafting/CommaListInput';
import { MESSAGE_TYPES } from '@/data/draftOptions';

const FIELD = 'text-[13px]';
const LABEL = 'text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink';

const EMPTY = {
  name: '',
  template_class: 'standard',
  message_type: 'COMSUBLANT MSG',
  description: '',
  guidance: '',
  default_subject: '',
  action_addressees: [],
  prompts: '',
};

/** Builds a template from scratch: nothing is captured from an existing message. */
export default function NewTemplateDialog({ open, onOpenChange, onCreated }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setForm(EMPTY);
  }, [open]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', description: 'Give the template a name before creating it.' });
      return;
    }
    setBusy(true);
    const prompts = form.prompts
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    try {
      await base44.entities.MessageTemplate.create({
        name: form.name.trim(),
        template_class: form.template_class,
        message_type: form.message_type,
        description: form.description.trim(),
        guidance: form.guidance.trim(),
        include_references: false,
        default_subject: form.default_subject.trim(),
        default_action_addressees: form.action_addressees,
        paragraph_prompts: prompts,
        default_paragraphs: prompts.map(() => ''),
        active: true,
      });
      toast({
        title: 'Template created',
        description: `${form.name.trim()} is now offered when starting a draft.`,
      });
      onOpenChange(false);
      onCreated?.();
    } catch (error) {
      toast({
        title: 'Could not create the template',
        description: 'Only an administrator may publish a template.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[16px]">New template</DialogTitle>
          <DialogDescription className="text-[12px] leading-snug text-mutedink">
            An empty template. Fill in the setlines and the paragraph prompts a drafter will be guided by — nothing is
            captured from an existing message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={LABEL}>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Arrival Report"
              className={FIELD}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className={LABEL}>Class</Label>
              <Select value={form.template_class} onValueChange={(v) => set({ template_class: v })}>
                <SelectTrigger className={FIELD}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic — free text</SelectItem>
                  <SelectItem value="standard">Standard — guided paragraphs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className={LABEL}>Message type</Label>
              <Select value={form.message_type} onValueChange={(v) => set({ message_type: v })}>
                <SelectTrigger className={FIELD}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESSAGE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={LABEL}>Default subject</Label>
            <Input
              value={form.default_subject}
              onChange={(e) => set({ default_subject: e.target.value })}
              placeholder="Leave blank to type the subject on each draft"
              className={FIELD}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={LABEL}>Default action addressees (TO)</Label>
            <CommaListInput
              value={form.action_addressees}
              onChange={(v) => set({ action_addressees: v })}
              placeholder="COMSUBLANT, COMSUBFOR"
            />
          </div>

          <div className="space-y-1.5">
            <Label className={LABEL}>Paragraph prompts — one per line</Label>
            <Textarea
              value={form.prompts}
              onChange={(e) => set({ prompts: e.target.value })}
              rows={4}
              placeholder={'Purpose\nDiscussion\nAction required'}
              className={FIELD}
            />
            <p className="text-[11px] leading-snug text-mutedink">
              Each line becomes a numbered paragraph, shown to the drafter as the prompt for that paragraph.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className={LABEL}>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={2}
              placeholder="What this template is for, and when it is used."
              className={FIELD}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={LABEL}>Guidance</Label>
            <Textarea
              value={form.guidance}
              onChange={(e) => set({ guidance: e.target.value })}
              rows={2}
              placeholder="Drafting guidance shown beneath the template when starting a draft."
              className={FIELD}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={busy}>
            Create template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}