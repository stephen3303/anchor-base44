import { useEffect, useState } from 'react';
import { Radio, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TEXT_CASE, formatSequence, withDefaults } from '@/lib/commandSettings';
import SearchableSelect from './SearchableSelect';

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">{label}</Label>
    {children}
    {hint && <p className="text-[11px] leading-snug text-mutedink">{hint}</p>}
  </div>
);

/**
 * The settings every transmitted message obeys: the case its prose is set in and
 * the local message control sequence that numbers released traffic.
 */
export default function CommandSettingsPanel({ setting, disabled, busy, onSave }) {
  const [form, setForm] = useState(() => withDefaults(setting));

  useEffect(() => {
    setForm(withDefaults(setting));
  }, [setting]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const dirty = JSON.stringify(form) !== JSON.stringify(withDefaults(setting));

  return (
    <section className="rounded-md border border-line bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <Radio className="h-4 w-4 text-navy-600" aria-hidden="true" />
          Command settings
        </h3>
        <div className="flex items-center gap-2">
          <span className="anchor-mono text-[11.5px] text-mutedink">next {formatSequence(form.next_sequence, form)}</span>
          <Button
            type="button"
            size="sm"
            onClick={() => onSave(form)}
            disabled={disabled || busy || !dirty}
            className="gap-1.5 text-[12.5px]"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            Save
          </Button>
        </div>
      </header>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Field label="Text case" hint="Applies to the subject, remarks, POC and declassification as transmitted.">
          <SearchableSelect
            options={TEXT_CASE.map((option) => ({
              value: option.value,
              label: `${option.label} — ${option.note}`,
              keywords: option.note,
            }))}
            value={form.text_case}
            onChange={(v) => set({ text_case: v })}
            disabled={disabled}
            searchPlaceholder="Type to filter…"
            className="h-9 text-[13px]"
          />
        </Field>

        <Field
          label="Next sequence number"
          hint="Assigned to the next release, in release order, as both the MSGID serial and the local control sequence."
        >
          <Input
            type="number"
            min="1"
            value={form.next_sequence}
            onChange={(e) => set({ next_sequence: e.target.value })}
            disabled={disabled}
            className="anchor-mono h-9 text-[13px]"
          />
        </Field>
      </div>
    </section>
  );
}