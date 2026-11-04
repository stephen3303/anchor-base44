import { useState } from 'react';
import moment from 'moment';
import { Check, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClassificationStrip from '@/components/anchor/ClassificationStrip';
import { useAuth } from '@/lib/AuthContext';
import { recordAudit } from '@/lib/audit';
import { renderMessage } from '@/lib/ntp';
import { formatZulu } from '@/data/anchorSampleData';

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * The message as it will transmit. Monospace, line-wrapped at the standard length,
 * with classification markings top and bottom and integrity data on the print copy.
 */
export default function DraftPreview({ draft, settings }) {
  const [copied, setCopied] = useState(false);
  const text = renderMessage(draft, settings);
  const banner = `${(draft.classification || 'UNCLASSIFIED').toUpperCase()} // PROTOTYPE`;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const print = () => {
    const w = window.open('', '_blank', 'width=820,height=920');
    if (!w) return;
    const integrity = draft.sha256 || 'not yet computed — assigned at release';
    w.document.write(`<!doctype html><html><head><title>${escapeHtml(draft.subject || 'Message')}</title>
      <style>
        @page { margin: 18mm; }
        body { font-family: "Courier New", ui-monospace, monospace; font-size: 11pt; color: #000; }
        .banner { text-align: center; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
                  border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 12px; }
        .banner.bottom { border-bottom: none; border-top: 1px solid #000; padding: 4px 0 0; margin: 14px 0 0; }
        pre { white-space: pre-wrap; line-height: 1.5; margin: 0; }
        footer { border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; font-size: 9pt; }
      </style></head><body>
      <div class="banner">${escapeHtml(banner)}</div>
      <pre>${escapeHtml(text)}</pre>
      <div class="banner bottom">${escapeHtml(banner)}</div>
      <footer>ANCHOR official record · ${escapeHtml(draft.draft_status || 'draft')}${
        draft.msn ? ` · MSN ${escapeHtml(draft.msn)}` : ''
      } · integrity ${escapeHtml(integrity)}${
        draft.released_at ? ` · released ${escapeHtml(formatZulu(draft.released_at))}` : ''
      }</footer>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <section className="rounded-md border border-line bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.16em] text-mutedink">Message as it will transmit</h3>
          <p className="anchor-mono mt-0.5 text-[10.5px] text-mutedink">
            {draft.released_at
              ? `DTG ${draft.dtg} · MSN ${draft.msn} · ${draft.local_sequence}`
              : 'DTG, MSN and the control sequence are assigned at release'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button type="button" variant="ghost" size="sm" onClick={copy} className="h-7 gap-1.5 px-2 text-[11.5px]">
            {copied ? <Check className="h-3.5 w-3.5 text-lifecycle-active" /> : null}
            {copied ? 'Copied' : 'Copy text'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={print} className="h-7 gap-1.5 px-2 text-[11.5px]">
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print / PDF
          </Button>
        </div>
      </header>

      <div className="p-3">
        <ClassificationStrip />
        <pre className="anchor-scroll mt-2 max-h-[560px] overflow-auto whitespace-pre-wrap rounded-sm bg-navy-950 px-3 py-3 text-[11.5px] leading-[1.65] text-navy-100">
          {text}
        </pre>
        <div className="mt-2">
          <ClassificationStrip />
        </div>
      </div>
    </section>
  );
}