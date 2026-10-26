import { CornerUpLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EFFECT_LABEL, DERIVATION_LABEL } from '@/lib/drafting';

/** What this derived message does to the message it cites, stated plainly. */
export default function DerivationNotice({ draft, sourceMessage }) {
  if (!draft || draft.derivation_type === 'original' || !draft.derived_from_reference) return null;

  const effect = EFFECT_LABEL[draft.effect_on_source];
  const released = draft.draft_status === 'released';

  return (
    <div className="flex flex-wrap items-start gap-2.5 rounded-sm border border-gold/50 bg-gold/10 px-3 py-2.5">
      <CornerUpLeft className="mt-0.5 h-4 w-4 shrink-0 text-navy-800" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-[12px] leading-snug text-ink">
        <p className="font-semibold">
          {DERIVATION_LABEL[draft.derivation_type]} of {draft.derived_from_reference}
          {effect ? ` — on release the original is marked ${effect}` : ''}
        </p>
        <p className="mt-0.5 text-mutedink">
          {effect
            ? released
              ? 'Released. The original record now shows this message as its replacement.'
              : 'Not yet released. The original record is unchanged until this message is released.'
            : 'This message carries the original as its reference and does not change it.'}
          {sourceMessage ? ` ${sourceMessage.subject}` : ''}
        </p>
        {draft.derived_from_message_id && (
          <Link
            to={`/messages/${draft.derived_from_message_id}`}
            className="mt-1 inline-block text-[11.5px] font-semibold text-navy-600 underline decoration-navy-600/30 underline-offset-2"
          >
            Open the original message
          </Link>
        )}
      </div>
    </div>
  );
}