import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink, FileSearch, Link2, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import PrecedenceBadge from './PrecedenceBadge';
import LifecycleBadge from './LifecycleBadge';
import { formatZulu, messageByReference } from '@/data/anchorSampleData';
import Dtg from './Dtg';

function MetaRow({ label, children }) {
  return (
    <div className="flex gap-3 py-1.5">
      <dt className="w-[86px] shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-mutedink">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-[12.5px] text-ink">{children}</dd>
    </div>
  );
}

export default function MessagePreviewPane({ message, onClose }) {
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const shareUrl = message ? `${window.location.origin}/messages/${message.id}` : '';

  // Nothing is shown until a record is selected — no placeholder card.
  if (!message) return null;

  const replacement = message.replaced_by ? messageByReference(message.replaced_by) : null;
  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copied',
      description: `${message.reference} link copied. Sharing does not release or forward the traffic.`,
    });
  };

  return (
    <div className="flex max-h-[calc(100vh-190px)] flex-col overflow-hidden rounded-md border border-line bg-white shadow-sm">
      <header className="border-b border-line bg-navy-100/50 px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <PrecedenceBadge precedence={message.precedence} />
            <LifecycleBadge lifecycle={message.lifecycle} />
            <span className="anchor-mono text-[10.5px] text-mutedink">{message.reference}</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="ml-auto rounded-sm p-1 text-mutedink transition-colors hover:bg-white hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <h2 className="normal-case mt-2 text-[15px] font-semibold leading-snug text-ink">{message.subject}</h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 anchor-scroll">
        {replacement && (
          <div className="mb-3 rounded-sm border border-gold/50 bg-[#FFF6DE] px-3 py-2 text-[12px] text-ink">
            This record is marked <strong>{message.lifecycle}</strong>. The current version is{' '}
            <Link to="/messages" className="font-semibold text-navy-600 underline underline-offset-2">
              {replacement.reference}
            </Link>
            .
          </div>
        )}

        <dl className="border-b border-line pb-2">
          <MetaRow label="Originator">{message.originator}</MetaRow>
          <MetaRow label="DTG">
            <Dtg value={message.dtg} className="text-[11.5px] text-ink" />
          </MetaRow>
          <MetaRow label="Received">{formatZulu(message.received)}</MetaRow>
          <MetaRow label="Communities">{message.communities.join(' · ')}</MetaRow>
        </dl>

        {/* Official text always renders first and never contains AI content. */}
        <div className="border-t border-line pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-navy-800">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Official text — verbatim, uneditable
          </p>
          {message.sections.map((section) => (
            <div key={section.heading} className="mb-3.5 last:mb-0">
              <h3 className="normal-case text-[12px] font-semibold tracking-[0.08em] text-ink">{section.heading}</h3>
              <p className="official-text mt-1 font-mono text-[13px] text-ink">{section.body}</p>
            </div>
          ))}
        </div>

        {message.attachments.length > 0 && (
          <div className="mt-2 border-t border-line pt-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Attachments</p>
            <ul className="mt-1.5 space-y-1">
              {message.attachments.map((a) => (
                <li key={a.name} className="flex items-center gap-2 text-[12px] text-ink">
                  <span className="anchor-mono truncate">{a.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10.5px] text-mutedink">{a.size}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI summary: own panel, labelled, below official text, excluded from print and snippets. */}
        {message.ai_summary && (
          <div className="anchor-ai-panel mt-4 rounded-md border border-dashed border-ai/55 bg-ai/[0.04] px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ai">
              <FileSearch className="h-3.5 w-3.5" aria-hidden="true" />
              AI-generated summary — not authoritative
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink">{message.ai_summary}</p>
          </div>
        )}

        <dl className="mt-4 border-t border-line pt-3">
          <MetaRow label="C2OIX">
            <span className="anchor-mono text-[11.5px]">{message.c2oix_id}</span>
          </MetaRow>
          <MetaRow label="SHA-256">
            <span className="anchor-mono break-all text-[10.5px]">
              {message.sha256 ? `${message.sha256.slice(0, 32)}…` : 'not held for this record'}
            </span>
          </MetaRow>
          <MetaRow label="Size">
            <span className="anchor-mono text-[11.5px]">
              {message.size_kb} KB · retention {message.retention}
            </span>
          </MetaRow>
          <MetaRow label="Source">
            <span className="anchor-mono text-[11.5px]">{message.source}</span>
          </MetaRow>
        </dl>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-line bg-white px-4 py-3">
        <Button asChild size="sm" className="h-8 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600">
          <Link to={`/messages/${message.id}`}>
            Open full record
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-line text-[12.5px]"
          onClick={() => setShareOpen(true)}
        >
          <Link2 className="h-3.5 w-3.5" />
          Share link
        </Button>
        <span className="ml-auto text-[10.5px] text-mutedink">
          Release and forwarding remain with the DRA
        </span>
      </footer>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Share a link to this record</DialogTitle>
            <DialogDescription className="text-[12.5px]">
              Sharing a link is not a release. The recipient must be authorised for this command and community, and
              every access is audited.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={shareUrl} className="anchor-mono h-9 border-line text-[11.5px]" />
            <Button
              type="button"
              size="sm"
              className="h-9 shrink-0 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600"
              onClick={copyLink}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 border-line text-[12.5px]" onClick={() => setShareOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}