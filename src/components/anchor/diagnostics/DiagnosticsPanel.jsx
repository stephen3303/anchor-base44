import { useEffect, useState } from 'react';
import moment from 'moment';
import { AlertTriangle, ClipboardList, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  clearFaults,
  readFaults,
  recordOperatorReport,
  subscribeFaults,
} from '@/lib/diagnostics';
import FaultStatement from './FaultStatement';

const KIND_TONE = {
  screen: 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/10 text-lifecycle-cancelled',
  link: 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/10 text-lifecycle-cancelled',
  server: 'border-lifecycle-cancelled/50 bg-lifecycle-cancelled/10 text-lifecycle-cancelled',
  credential: 'border-gold/70 bg-gold/15 text-navy-800',
  permission: 'border-gold/70 bg-gold/15 text-navy-800',
  rejected: 'border-gold/70 bg-gold/15 text-navy-800',
  throttled: 'border-gold/70 bg-gold/15 text-navy-800',
  missing: 'border-gold/70 bg-gold/15 text-navy-800',
  reported: 'border-navy-600/40 bg-navy-100 text-navy-800',
  unknown: 'border-line bg-page text-mutedink',
};

const KIND_LABEL = {
  screen: 'screen',
  link: 'link',
  server: 'server',
  credential: 'credential',
  permission: 'permission',
  rejected: 'rejected',
  throttled: 'throttled',
  missing: 'missing',
  reported: 'reported',
  unknown: 'fault',
};

/**
 * Everything that has faulted on this workstation, and the statement for each.
 *
 * Kept on the workstation so a fault survives a reload: the watchstander can
 * crash, reload, and still produce the statement shore side needs.
 */
export default function DiagnosticsPanel() {
  const [faults, setFaults] = useState(readFaults);
  const [selectedId, setSelectedId] = useState(null);
  const [reporting, setReporting] = useState(false);
  const [description, setDescription] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => subscribeFaults(setFaults), []);

  const selected = faults.find((fault) => fault.id === selectedId) || faults[0] || null;

  const submitReport = () => {
    const fault = recordOperatorReport(description);
    setDescription('');
    setReporting(false);
    setSelectedId(fault.id);
  };

  const clear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearFaults();
    setConfirmClear(false);
    setSelectedId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-ink">
          {faults.length === 0
            ? 'No faults recorded on this workstation.'
            : `${faults.length} fault${faults.length === 1 ? '' : 's'} recorded on this workstation`}
        </span>
        <Button
          size="sm"
          className="ml-auto h-9 gap-1.5 bg-navy-800 text-[12.5px] hover:bg-navy-600"
          onClick={() => setReporting((open) => !open)}
        >
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          Report a fault
        </Button>
        {faults.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className={cn('h-9 text-[12.5px]', confirmClear && 'border-lifecycle-cancelled/60 text-lifecycle-cancelled')}
            onClick={clear}
            onBlur={() => setConfirmClear(false)}
          >
            {confirmClear ? 'Confirm clear' : 'Clear log'}
          </Button>
        )}
      </div>

      {reporting && (
        <div className="rounded-md border border-line bg-page px-4 py-3">
          <label
            htmlFor="fault-description"
            className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-navy-800"
          >
            What went wrong
          </label>
          <Textarea
            id="fault-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="e.g. The release button greyed out after I approved the second routing step"
            className="mt-1.5 bg-white text-[12.5px]"
          />
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              className="h-9 bg-navy-800 text-[12.5px] hover:bg-navy-600"
              onClick={submitReport}
              disabled={!description.trim()}
            >
              Build the statement
            </Button>
            <span className="text-[11px] text-mutedink">
              The statement will carry the links, the release and the account as they are now.
            </span>
          </div>
        </div>
      )}

      {faults.length > 0 && (
        <ul className="divide-y divide-line rounded-md border border-line bg-white">
          {faults.map((fault) => {
            const isSelected = selected?.id === fault.id;
            return (
              <li key={fault.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(fault.id)}
                  className={cn(
                    'anchor-row flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5 text-left',
                    isSelected ? 'bg-navy-100' : 'hover:bg-page',
                  )}
                >
                  <span className="anchor-mono text-[11.5px] text-mutedink">
                    {moment.utc(fault.at).format('DD MMM HH:mm:ss[Z]')}
                  </span>
                  <span
                    className={cn(
                      'rounded-sm border px-1.5 py-[1px] text-[9.5px] font-semibold uppercase tracking-[0.1em]',
                      KIND_TONE[fault.kind] || KIND_TONE.unknown,
                    )}
                  >
                    {KIND_LABEL[fault.kind] || 'fault'}
                  </span>
                  <span className="anchor-mono text-[11.5px] font-semibold text-ink">{fault.reference}</span>
                  <span className="text-[11.5px] text-mutedink">{fault.where}</span>
                  {fault.filed_reference && (
                    <span className="ml-auto text-[10.5px] font-semibold uppercase tracking-[0.1em] text-lifecycle-active">
                      filed {fault.filed_reference}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected ? (
        <FaultStatement fault={selected} onFiled={() => setSelectedId(selected.id)} />
      ) : (
        <div className="flex items-start gap-2.5 rounded-md border border-line bg-page px-4 py-3">
          <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-navy-800" aria-hidden="true" />
          <p className="text-[12px] leading-relaxed text-mutedink">
            Nothing has faulted since this workstation was last cleared. When something does, the statement appears
            here with the screen, the failure and the state of both links, ready to copy or save as a text file and
            pass to the supporting activity.
          </p>
        </div>
      )}

      <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-mutedink">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Statements are held on this workstation only, and survive a reload but not a move to another workstation. Copy
        or save the statement before leaving the desk.
      </p>
    </div>
  );
}