import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildReceivedText } from '@/lib/receivedText';

/**
 * Plain text view: the message exactly as it was received, monospace and
 * unformatted. Read-only — the record text is never edited.
 */
export default function MessagePlainTextView({ message }) {
  const [copied, setCopied] = useState(false);
  const text = buildReceivedText(message);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="rounded-md border border-line bg-white shadow-sm">
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-6">
        <h2 className="font-heading text-[12px] font-semibold uppercase tracking-[0.16em] text-navy-800">
          Plain text — as received
        </h2>
        <span className="anchor-mono text-[11px] text-mutedink">{message.reference}</span>
        <Button variant="outline" size="sm" className="ml-auto h-7 gap-1.5 border-line text-[11.5px]" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy text'}
        </Button>
      </header>

      <div className="px-4 py-4 sm:px-6">
        <pre className="official-text anchor-mono anchor-scroll overflow-x-auto rounded-sm border border-line bg-navy-950/[0.03] p-3 text-[12.5px] leading-relaxed text-ink">
          {text}
        </pre>
      </div>
    </section>
  );
}