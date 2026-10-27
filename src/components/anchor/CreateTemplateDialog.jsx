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
import { splitAddressees } from '@/lib/draftPrefill';
import TemplateTriggerEditor from '@/components/anchor/templates/TemplateTriggerEditor';

const EMPTY_TAGS = {
  trigger_use: 'both',
  tag_message_types: [],
  tag_originators: [],
  tag_communities: [],
  tag_precedence: [],
  tag_subject_keywords: [],
};

const Captured = ({ label, value }) => (
  <div className="flex gap-2">
    <dt className="w-[96px] shrink-0 text-mutedink">{label}</dt>
    <dd className="anchor-mono min-w-0 break-words">{value}</dd>
  </div>
);

/** Captures the message being viewed as a reusable template. */
export default function CreateTemplateDialog({ open, onOpenChange, message }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [templateClass, setTemplateClass] = useState('standard');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState(EMPTY_TAGS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !message) return;
    setName(message.subject);
    setTemplateClass('standard');
    setDescription(`Captured from ${message.reference} — ${message.subject}`);
    setTags({
      ...EMPTY_TAGS,
      tag_message_types: message.type ? [message.type] : [],
      tag_communities: message.communities || [],
    });
  }, [open, message]);

  const save = async () => {
    if (!name.trim()) {
      toast({ title: 'Name required', description: 'Give the template a name before creating it.' });
      return;
    }
    setBusy(true);
    try {
      await base44.entities.MessageTemplate.create({
        name: name.trim(),
        template_class: templateClass,
        message_type: message.type,
        description: description.trim(),
        guidance: `Captured from ${message.reference}. Originator ${message.originator}.`,
        include_references: (message.relates_to || []).length > 0,
        default_subject: message.subject,
        default_action_addressees: splitAddressees(message.to),
        default_paragraphs: message.sections.map((section) => section.body),
        paragraph_prompts: message.sections.map((section) => section.heading),
        ...tags,
        active: true,
      });
      toast({
        title: 'Template created',
        description: `${name.trim()} is now offered when starting a draft.`,
      });
      onOpenChange(false);
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
          <DialogTitle className="text-[16px]">Create a template from this message</DialogTitle>
          <DialogDescription className="text-[12px] leading-snug text-mutedink">
            The setlines, addressees and paragraph structure of {message?.reference} become the starting point for every
            draft that uses this template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="text-[13px]" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Class</Label>
            <Select value={templateClass} onValueChange={setTemplateClass}>
              <SelectTrigger className="text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic — free text</SelectItem>
                <SelectItem value="standard">Standard — guided paragraphs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-[13px]"
            />
          </div>

          <TemplateTriggerEditor value={tags} onChange={(patch) => setTags((prev) => ({ ...prev, ...patch }))} />

          <div className="rounded-sm border border-line bg-secondary/50 px-3 py-2.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Captured</p>
            <dl className="mt-1.5 space-y-1 text-[11.5px] text-ink">
              <Captured label="Message type" value={message?.type || '—'} />
              <Captured label="Action (TO)" value={message?.to || '—'} />
              <Captured
                label="Paragraphs"
                value={`${(message?.sections || []).length} captured, each heading kept as its prompt`}
              />
            </dl>
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