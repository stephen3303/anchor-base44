import { useMemo, useState } from 'react';
import { Check, ClipboardCopy, Download, FileCheck2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { buildStatement, fileFault, updateFault } from '@/lib/diagnostics';

/**
 * One fault, rendered as the statement that goes to shore side.
 * Used both by the fault boundary and by the diagnostics panel, so it carries no
 * dependency on the app shell — it must draw even when the screen has stopped.
 */
export default function FaultStatement({ fault, onFiled, className }) {
  const [doing, setDoing] = useState(fault.doing || '');
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [filing, setFiling] = useState(false);
  const [filed, setFiled] = useState(fault.filed_reference || '');
  const [fileError, setFileError] = useState('');

  const statement = useMemo(() => buildStatement({ ...fault, doing }), [fault, doing]);

  const copy = async () => {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(statement);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch (error) {
      setCopyFailed(true);
    }
  };

  const download = () => {
    const blob = new Blob([statement], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fault.reference}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const file = async () => {
    setFiling(true);
    setFileError('');
    try {
      const saved = doing !== (fault.doing || '') ? updateFault(fault.id, { doing }) : fault;
      const event = await fileFault(saved);
      if (!event) {
        setFileError('The command server did not take the entry. Copy the statement instead.');
        return;
      }
      const updated = updateFault(fault.id, { filed_at: event.recorded_at, filed_reference: `AUD-${event.seq}` });
      setFiled(updated?.filed_reference || '');
      onFiled?.(event);
    } finally {
      setFiling(false);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="rounded-md border border-line bg-white">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-2.5">
          <span className="anchor-mono text-[12px] font-semibold text-ink">{fault.reference}</span>
          <span className="text-[11.5px] text-mutedink">
            {fault.meaning.split('.')[0]}.
          </span>
        </header>

        <div className="space-y-3 px-4 py-3">
          <p className="text-[12.5px] leading-relaxed text-ink">{fault.meaning}</p>
          {fault.guidance && (
            <p className="text-[12px] leading-relaxed text-mutedink">{fault.guidance}</p>
          )}

          <div>
            <label
              htmlFor={`fault-doing-${fault.id}`}
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-navy-800"
            >
              What you were doing when it happened
            </label>
            <Textarea
              id={`fault-doing-${fault.id}`}
              value={doing}
              onChange={(event) => setDoing(event.target.value)}
              rows={2}
              placeholder="e.g. Opened the draft workspace and pressed Submit for routing"
              className="mt-1.5 text-[12.5px]"
            />
            <p className="mt-1 text-[11px] text-mutedink">
              Shore side reads this first. Name the screen, what you pressed, and what you expected.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" className="h-9 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
              {copied ? 'Statement copied' : 'Copy statement'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 border-line text-[12.5px]"
              onClick={download}
            >
              <Download className="h-3.5 w-3.5" />
              Save as text file
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 border-line text-[12.5px]"
              onClick={file}
              disabled={filing || Boolean(filed)}
            >
              {filed ? <FileCheck2 className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
              {filed ? `Filed ${filed}` : filing ? 'Filing…' : 'File on command server'}
            </Button>
          </div>

          {copyFailed && (
            <p className="text-[11.5px] text-lifecycle-cancelled">
              This browser would not copy for you. Select the statement below and copy it by hand.
            </p>
          )}
          {fileError && <p className="text-[11.5px] text-lifecycle-cancelled">{fileError}</p>}
          {filed && (
            <p className="text-[11.5px] text-mutedink">
              A one-line summary is now on the audit chain. The full statement still has to go to shore side.
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-navy-800">
          Statement to send
        </p>
        <pre className="anchor-scroll mt-1.5 max-h-[420px] overflow-auto rounded-md border border-line bg-navy-950 px-4 py-3 text-[11.5px] leading-[1.6] text-navy-100">
          {statement}
        </pre>
      </div>
    </div>
  );
}