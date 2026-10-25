import { useState } from 'react';
import { Check, Copy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildOriginalMessage } from '@/lib/originalMessage';

/**
 * The complete official message, shown in full. Read-only: the record text is
 * never edited, and nothing here is abbreviated or replaced by AI content.
 */
export default function MessageOriginalText({ message }) {
  const [copied, setCopied] = useState(false);
  const text = buildOriginalMessage(message);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="border-t border-line px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-mutedink">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          Complete original message
        </h2>
        <span className="text-[10.5px] text-mutedink">· full text, no excerpt</span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-7 gap-1.5 border-line text-[11.5px]"
          onClick={copy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy full text'}
        </Button>
      </div>

      <pre className="official-text anchor-mono anchor-scroll mt-2 overflow-x-auto rounded-sm border border-line bg-navy-950/[0.03] p-3 text-[12.5px] text-ink">
        {text}
      </pre>

      <p className="mt-2 text-[11px] leading-snug text-mutedink">
        Every paragraph of the message as received, in order and in full. Read-only — the record text is never edited.
      </p>
    </section>
  );
}