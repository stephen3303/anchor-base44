import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, FilePlus2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { BASE_DRAFT } from '@/lib/draftPrefill';
import {
  USE_LABEL,
  templateCandidate,
  templateDraft,
  templateUse,
  validateAgainstTemplate,
} from '@/lib/templateMatch';
import TemplateTagSummary from './TemplateTagSummary';
import { cn } from '@/lib/utils';

/**
 * The template that claims this message, and whether the message conforms to it.
 * Shown beside the record, never inside it: the official text is not annotated.
 */
export default function TemplateEvaluation({ message, templates, user }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const template = useMemo(() => templateCandidate(message, templates), [message, templates]);
  const { checks, failures, conforms } = useMemo(() => validateAgainstTemplate(message, template), [message, template]);

  const canDraft = template && templateUse(template) !== 'validate';

  const openDraft = async () => {
    setBusy(true);
    try {
      const record = await base44.entities.DraftMessage.create({
        ...BASE_DRAFT,
        ...templateDraft(template, message),
        creator_name: user?.full_name || '',
      });
      navigate(`/drafting/${record.id}`);
    } catch (error) {
      toast({ title: 'Could not start the draft', description: 'The draft was not created. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-4 rounded-sm border border-line bg-secondary/40 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[10.5px] font-semibold tracking-[0.14em] text-mutedink">Template check</h2>
        {template && (
          <span className="text-[12px] font-semibold text-ink">{template.name}</span>
        )}
        {template && (
          <span
            className={cn(
              'rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em]',
              conforms
                ? 'border-lifecycle-active/40 bg-lifecycle-active/5 text-lifecycle-active'
                : 'border-precedence-flash/50 bg-precedence-flash/5 text-precedence-flash',
            )}
          >
            {conforms ? 'Conforms' : `${failures} check${failures === 1 ? '' : 's'} fail`}
          </span>
        )}
        {template && (
          <span className="text-[10.5px] uppercase tracking-[0.08em] text-mutedink">{USE_LABEL[templateUse(template)]}</span>
        )}
      </div>

      {!template ? (
        <p className="mt-1.5 text-[11.5px] leading-snug text-mutedink">
          No template tag claims this message. Tag a template by message type, originator, community or precedence to
          validate traffic of this kind.
        </p>
      ) : (
        <>
          <TemplateTagSummary template={template} className="mt-1.5" />
          <ul className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {checks.map((check) => (
              <li key={check.key} className="flex items-start gap-1.5 text-[11.5px] leading-snug">
                {check.pass ? (
                  <Check className="mt-[2px] h-3 w-3 shrink-0 text-lifecycle-active" aria-hidden="true" />
                ) : (
                  <X className="mt-[2px] h-3 w-3 shrink-0 text-precedence-flash" aria-hidden="true" />
                )}
                <span className={check.pass ? 'text-ink' : 'font-semibold text-ink'}>
                  {check.label}
                  <span className="anchor-mono font-normal text-mutedink"> — {check.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          {canDraft && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2.5 h-8 gap-1.5 border-line text-[12px]"
              onClick={openDraft}
              disabled={busy}
            >
              <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
              Draft from {template.name}
            </Button>
          )}
        </>
      )}
    </section>
  );
}