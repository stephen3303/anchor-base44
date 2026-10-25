import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Link2Off, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REF_KINDS, normalizeKind, refLabel } from '@/lib/ntp';
import { referenceValue } from '@/lib/draftPrefill';
import MessagePickerDialog from './MessagePickerDialog';

/**
 * REF lines. A reference is either linked to an official message (so it renders as a
 * link to that record) or carried as free text for traffic ANCHOR does not hold.
 */
export default function DraftReferenceEditor({ references, onChange, disabled }) {
  const [pickerIndex, setPickerIndex] = useState(null);
  const rows = references || [];

  const relabel = (list) => list.map((r, i) => ({ ...r, ref_label: refLabel(i) }));
  const update = (index, patch) => onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const add = () => onChange([...rows, { ref_label: refLabel(rows.length), kind: 'MSG', value: '', message_id: '', title: '', amplifying: '' }]);
  const remove = (index) => onChange(relabel(rows.filter((_, i) => i !== index)));

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="rounded-sm border border-dashed border-line px-3 py-3 text-[12px] text-mutedink">
          No references. Add one to cite prior traffic — the reference becomes a link to that message.
        </p>
      )}

      {rows.map((ref, index) => (
        <div key={index} className="rounded-sm border border-line bg-secondary/40 p-3">
          <div className="flex items-start gap-2">
            <span className="anchor-mono mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-navy-800 text-[11px] font-bold text-white">
              {ref.ref_label}
            </span>

            <div className="min-w-0 flex-1 space-y-2">
              <Select value={normalizeKind(ref.kind)} onValueChange={(v) => update(index, { kind: v })} disabled={disabled}>
                <SelectTrigger className="h-8 w-[116px] text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REF_KINDS.map((k) => (
                    <SelectItem key={k} value={k} className="text-[12px]">
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {ref.message_id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="anchor-mono text-[12px] font-semibold text-ink">{ref.value}</span>
                  <Link
                    to={`/messages/${ref.message_id}`}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-navy-600 underline decoration-navy-600/30 underline-offset-2"
                  >
                    <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Open linked message
                  </Link>
                  <span className="truncate text-[11.5px] text-mutedink">{ref.title}</span>
                </div>
              ) : (
                <Input
                  value={ref.value}
                  onChange={(e) => update(index, { value: e.target.value })}
                  disabled={disabled}
                  placeholder="ORIGINATOR/DTG, e.g. CNO WASHINGTON DC/201311ZDEC96"
                  className="anchor-mono h-8 text-[12px]"
                />
              )}

              <Input
                value={ref.amplifying || ''}
                onChange={(e) => update(index, { amplifying: e.target.value })}
                disabled={disabled}
                placeholder="AMPN: what this reference is (required for MSG, DOC, LTR, TEL, CON)"
                className="h-8 text-[12px]"
              />
            </div>

            {!disabled && (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => (ref.message_id ? update(index, { message_id: '', title: '' }) : setPickerIndex(index))}
                  title={ref.message_id ? 'Unlink from message' : 'Link to an official message'}
                  className="h-8 px-2"
                >
                  {ref.message_id ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} title="Remove reference" className="h-8 px-2">
                  <Trash2 className="h-4 w-4 text-lifecycle-cancelled" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}

      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5 text-[12px]">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add reference
        </Button>
      )}

      <MessagePickerDialog
        open={pickerIndex !== null}
        onOpenChange={(open) => !open && setPickerIndex(null)}
        onPick={(m) =>
          update(pickerIndex, {
            message_id: m.id,
            title: m.subject,
            kind: 'MSG',
            value: referenceValue(m),
            amplifying: rows[pickerIndex]?.amplifying || `${m.reference}, ${m.subject}`,
          })
        }
      />
    </div>
  );
}