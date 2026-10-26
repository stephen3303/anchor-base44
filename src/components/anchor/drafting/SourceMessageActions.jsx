import { useState } from 'react';
import { Ban, CornerUpLeft, FileText, Flag, LayoutTemplate, RefreshCw } from 'lucide-react';
import { DERIVATION_OPTIONS } from '@/data/draftOptions';
import { isOwnMessage } from '@/lib/draftPrefill';
import CreateTemplateDialog from '@/components/anchor/CreateTemplateDialog';

const ICON = { corrected_copy: RefreshCw, update: FileText, final: Flag, cancellation: Ban };

const BUTTON =
  'rounded-sm border border-line bg-secondary/40 p-3 text-left transition-colors hover:border-navy-600/50 hover:bg-navy-100/50 disabled:opacity-60';

const Action = ({ icon: Icon, label, note, onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={BUTTON}>
    <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
      <Icon className="h-3.5 w-3.5 text-navy-600" aria-hidden="true" />
      {label}
    </span>
    <span className="mt-1 block text-[11.5px] leading-snug text-mutedink">{note}</span>
  </button>
);

/**
 * What a chosen source message supports. No template is applied to a draft made
 * from a message: the message itself sets the setlines, the addressees and the
 * reference, and the action chosen here sets the rest.
 *
 * A corrected copy, update, final or cancellation may only be issued by the
 * command that originated the message; any message may be answered or captured
 * as a template.
 */
export default function SourceMessageActions({ message, busy, canTemplate, onResponse, onDerive }) {
  const [templateOpen, setTemplateOpen] = useState(false);
  const own = isOwnMessage(message);

  return (
    <div className="rounded-md border border-navy-600/40 bg-white p-4 shadow-sm">
      <p className="text-[12.5px] font-semibold text-ink">
        {message.reference} — {message.subject}
      </p>
      <p className="mt-1 text-[11.5px] leading-snug text-mutedink">
        {own
          ? 'Originated by this command. Answer it, capture it as a template, or issue a corrected copy, update, final or cancellation against it. The source is carried as REF A and linked.'
          : `Originated by ${message.originator}. Any message may be answered or captured as a template; a corrected copy, update, final or cancellation may only be issued by the command that originated it.`}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Action
          icon={CornerUpLeft}
          label="Draft response"
          note="Answers the message. Goes back to the originator with the source as REF A."
          onClick={() => onResponse(message)}
          disabled={busy}
        />
        {canTemplate && (
          <Action
            icon={LayoutTemplate}
            label="Create template"
            note="Captures the setlines, addressees and paragraph structure as a reusable template."
            onClick={() => setTemplateOpen(true)}
            disabled={busy}
          />
        )}
        {own &&
          DERIVATION_OPTIONS.map((option) => (
            <Action
              key={option.value}
              icon={ICON[option.value]}
              label={option.label}
              note={option.note}
              onClick={() => onDerive(message, option.value)}
              disabled={busy}
            />
          ))}
      </div>

      <CreateTemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} message={message} />
    </div>
  );
}