import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { formatZulu } from '@/data/anchorSampleData';

const CHOICE = ({ active, title, hint, onClick, tone }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex-1 rounded-sm border px-3 py-2.5 text-left transition-colors',
      active ? tone : 'border-line bg-white hover:border-navy-600/40',
    )}
  >
    <span className="block text-[12.5px] font-semibold text-ink">{title}</span>
    <span className="mt-0.5 block text-[11.5px] leading-snug text-mutedink">{hint}</span>
  </button>
);

/**
 * Reporting the C2OIX circuit. The circuit is a link state the watch reports —
 * it is not a policy change, so it sits with the watch rather than in Admin.
 */
export default function ReportLinkDialog({ open, onOpenChange, circuit, onReport, busy }) {
  const [up, setUp] = useState(true);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setUp(circuit ? circuit.external_up !== false : true);
    setNote(circuit?.note || '');
  }, [open, circuit]);

  const label = circuit?.external_label || 'C2OIX circuit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] border-line">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-[17px] text-ink">
            <Radio className="h-4 w-4 text-navy-600" aria-hidden="true" />
            Report {label}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-mutedink">
            {circuit?.reported_at
              ? `Last reported ${formatZulu(circuit.reported_at)}${circuit.reported_by_name ? ` by ${circuit.reported_by_name}` : ''}.`
              : 'Not reported yet — the command is treating the circuit as up.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <CHOICE
              active={up}
              tone="border-lifecycle-active/50 bg-lifecycle-active/5"
              title="Circuit is up"
              hint="Traffic flows in and out. Transmissions leave the command as they are released."
              onClick={() => setUp(true)}
            />
            <CHOICE
              active={!up}
              tone="border-gold/70 bg-gold/15"
              title="Circuit is down"
              hint="Offline mode. The command server stays up, work continues, transmission is held."
              onClick={() => setUp(false)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">
              Note (optional)
            </Label>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Cause, circuit reference, estimated restore"
              className="min-h-[64px] text-[13px]"
            />
          </div>

          <p className="rounded-sm border border-line bg-secondary/50 px-3 py-2 text-[11.5px] leading-snug text-mutedink">
            Reporting the circuit does not change the message record. While the circuit is down, releases and
            acknowledgements are held for transmission and go out, in order, when it is restored.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="h-9 border-line text-[12.5px]"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-9 bg-navy-800 text-[12.5px] hover:bg-navy-600"
            disabled={busy}
            onClick={async () => {
              await onReport(up, note);
              onOpenChange(false);
            }}
          >
            {busy ? 'Reporting…' : up ? 'Report circuit up' : 'Report circuit down'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}