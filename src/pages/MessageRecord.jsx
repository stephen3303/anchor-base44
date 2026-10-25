import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Link2, Paperclip, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ClassificationStrip from '@/components/anchor/ClassificationStrip';
import PrecedenceBadge from '@/components/anchor/PrecedenceBadge';
import LifecycleBadge from '@/components/anchor/LifecycleBadge';
import { SAMPLE_MESSAGES, formatZulu, messageByReference } from '@/data/anchorSampleData';
import { EFFECT_LABEL } from '@/lib/drafting';
import MessageActionBar from '@/components/anchor/MessageActionBar';
import MessageOriginalText from '@/components/anchor/MessageOriginalText';
import MessagePlainTextView from '@/components/anchor/MessagePlainTextView';

const VIEWS = [
  { id: 'record', label: 'Record view' },
  { id: 'plain', label: 'Plain text' },
];

const Meta = ({ label, value }) => (
  <div>
    <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedink">{label}</dt>
    <dd className="anchor-mono mt-0.5 text-[12px] text-ink">{value || '—'}</dd>
  </div>
);

/** Read-only official record. Reference lines resolve to the messages they cite. */
export default function MessageRecord() {
  const { id } = useParams();
  const [superseding, setSuperseding] = useState([]);
  const [view, setView] = useState('record');

  const message = SAMPLE_MESSAGES.find((m) => m.id === id) || null;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { items } = await base44.entities.DraftMessage.filter(
          { derived_from_message_id: id, draft_status: 'released' },
          { sort: '-created_date', limit: 20 },
        );
        if (alive) setSuperseding(items || []);
      } catch (error) {
        if (alive) setSuperseding([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (!message) {
    return (
      <div className="mx-auto w-full max-w-[640px] anchor-fade-in">
        <div className="rounded-md border border-line bg-white p-6 shadow-sm">
          <h1 className="font-heading text-[20px] font-semibold text-ink">Message not found</h1>
          <p className="mt-2 text-[13px] text-mutedink">
            No official record matches that identifier in this set. Released drafts are held in Drafting.
          </p>
          <Link to="/messages" className="mt-4 inline-block text-[12.5px] font-semibold text-navy-600 underline underline-offset-2">
            Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  const replacement = message.replaced_by ? messageByReference(message.replaced_by) : null;
  const related = (message.relates_to || []).map((ref) => ({ ref, target: messageByReference(ref) }));

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-4 anchor-fade-in">
      <ClassificationStrip />

      <div className="flex flex-wrap items-center gap-2">
        <Link to="/messages" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-navy-600">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Messages
        </Link>
        <div className="ml-auto inline-flex overflow-hidden rounded-sm border border-line">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setView(option.id)}
              aria-pressed={view === option.id}
              className={
                view === option.id
                  ? 'bg-navy-800 px-3 py-1.5 text-[11.5px] font-semibold text-white'
                  : 'bg-white px-3 py-1.5 text-[11.5px] font-semibold text-mutedink transition-colors hover:bg-navy-100/60'
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'plain' ? (
        <MessagePlainTextView message={message} />
      ) : (
      <article className="rounded-md border border-line bg-white shadow-sm">
        <header className="space-y-2 border-b border-line px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <PrecedenceBadge precedence={message.precedence} />
            <LifecycleBadge lifecycle={message.lifecycle} />
            <span className="anchor-mono text-[11px] text-mutedink">{message.reference}</span>
            <span className="anchor-mono text-[11px] text-mutedink">· {message.dtg}</span>
            <span className="anchor-mono text-[11px] text-mutedink">· {message.type}</span>
          </div>
          <h1 className="font-heading text-[21px] font-semibold leading-tight tracking-tight text-ink sm:text-[24px]">
            {message.subject}
          </h1>
          <p className="text-[12px] text-mutedink">
            Immutable official record. Status changes arrive as newer messages — this text is never edited.
          </p>
          <MessageActionBar message={message} />
        </header>

        {(replacement || superseding.length > 0) && (
          <div className="border-b border-line bg-gold/10 px-4 py-3 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-800">
              {message.lifecycle !== 'ACTIVE' ? `Marked ${message.lifecycle}` : 'Superseded'}
            </p>
            <ul className="mt-1 space-y-1">
              {replacement && (
                <li className="text-[12.5px] text-ink">
                  {replacement.reference} — {replacement.subject}{' '}
                  <Link to={`/messages/${replacement.id}`} className="font-semibold text-navy-600 underline underline-offset-2">
                    open
                  </Link>
                </li>
              )}
              {superseding.map((draft) => (
                <li key={draft.id} className="text-[12.5px] text-ink">
                  {EFFECT_LABEL[draft.effect_on_source] || 'REPLACED'} by released{' '}
                  {draft.derivation_type === 'cancellation' ? 'cancellation' : 'message'} — {draft.subject}{' '}
                  <Link to={`/drafting/${draft.id}`} className="font-semibold text-navy-600 underline underline-offset-2">
                    open
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="px-4 py-4 sm:px-6">
          <dl className="grid gap-3 sm:grid-cols-3">
            <Meta label="DTG" value={message.dtg} />
            <Meta label="Received" value={formatZulu(message.received)} />
            <Meta label="Originator (FM)" value={message.originator} />
            <Meta label="Action (TO)" value={message.to} />
            <Meta label="Info" value={message.info} />
            <Meta label="Communities" value={(message.communities || []).join(', ')} />
          </dl>

        </div>

        <MessageOriginalText message={message} />

        {related.length > 0 && (
          <div className="border-t border-line px-4 py-4 sm:px-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mutedink">References</h2>
            <ul className="mt-2 space-y-1.5">
              {related.map(({ ref, target }) => (
                <li key={ref} className="flex flex-wrap items-center gap-2 text-[12.5px]">
                  <span className="anchor-mono text-mutedink">{ref}</span>
                  {target ? (
                    <Link
                      to={`/messages/${target.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-navy-600 underline decoration-navy-600/30 underline-offset-2"
                    >
                      <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {target.subject}
                    </Link>
                  ) : (
                    <span className="text-mutedink">not held in ANCHOR</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(message.attachments || []).length > 0 && (
          <div className="border-t border-line px-4 py-4 sm:px-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mutedink">Attachments</h2>
            <ul className="mt-2 space-y-1.5">
              {message.attachments.map((file) => (
                <li key={file.name} className="flex items-center gap-2 text-[12.5px] text-ink">
                  <Paperclip className="h-3.5 w-3.5 text-mutedink" aria-hidden="true" />
                  <span className="anchor-mono">{file.name}</span>
                  <span className="text-[11.5px] text-mutedink">
                    {file.kind} · {file.size}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-line bg-ai/5 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="rounded-sm border border-ai/40 bg-ai/10 px-1.5 py-[2px] text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ai">
              AI-generated summary — not authoritative
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink">{message.ai_summary}</p>
          <p className="mt-1.5 text-[11px] text-mutedink">
            Generated text, held apart from the official record. Never part of the record and never printed with it.
          </p>
        </div>

        <div className="border-t border-line px-4 py-4 sm:px-6">
          <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-mutedink">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Integrity
          </h2>
          <dl className="mt-2 grid gap-3 sm:grid-cols-2">
            <Meta label="C2OIX identifier" value={message.c2oix_id} />
            <Meta label="Retention" value={message.retention} />
            <Meta label="Size" value={`${message.size_kb} KB`} />
            <Meta label="SHA-256" value={message.sha256} />
          </dl>
          <p className="mt-3 text-[11px] leading-snug text-mutedink">
            The print rendition with classification markings on every page and the metadata rail arrive with the record
            view build step.
          </p>
        </div>
      </article>
      )}

      <ClassificationStrip />
    </div>
  );
}