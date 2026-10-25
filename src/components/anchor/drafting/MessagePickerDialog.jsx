import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import PrecedenceBadge from '@/components/anchor/PrecedenceBadge';
import { SAMPLE_MESSAGES } from '@/data/anchorSampleData';

/** Picks an official message so the reference line links to it. */
export default function MessagePickerDialog({ open, onOpenChange, onPick }) {
  const [q, setQ] = useState('');

  const rows = SAMPLE_MESSAGES.filter((m) =>
    `${m.reference} ${m.subject} ${m.originator}`.toLowerCase().includes(q.toLowerCase()),
  ).slice(0, 40);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[16px]">Link a reference to an official message</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-mutedink" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference, subject or originator"
            className="pl-8 text-[13px]"
          />
        </div>
        <ul className="anchor-scroll max-h-[380px] divide-y divide-line overflow-y-auto rounded-md border border-line">
          {rows.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(m);
                  onOpenChange(false);
                  setQ('');
                }}
                className="w-full px-3 py-2.5 text-left anchor-row hover:bg-navy-100/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <PrecedenceBadge precedence={m.precedence} />
                  <span className="anchor-mono text-[10.5px] text-mutedink">{m.reference}</span>
                  <span className="anchor-mono text-[10.5px] text-mutedink">· {m.dtg}</span>
                </div>
                <p className="mt-1 text-[12.5px] font-medium leading-snug text-ink">{m.subject}</p>
                <p className="text-[11px] text-mutedink">{m.originator}</p>
              </button>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="px-3 py-6 text-center text-[12px] text-mutedink">No message matches that search.</li>
          )}
        </ul>
        <p className="text-[11px] text-mutedink">
          Linking a reference makes the line clickable in the message and in the record view. Free-text references are
          allowed for traffic not held in ANCHOR.
        </p>
        <Link to="/messages" className="text-[12px] font-semibold text-navy-600 underline underline-offset-2">
          Browse the full message set
        </Link>
      </DialogContent>
    </Dialog>
  );
}