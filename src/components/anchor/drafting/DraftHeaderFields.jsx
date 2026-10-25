import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CLASSIFICATIONS, MESSAGE_TYPES, PRECEDENCES } from '@/data/draftOptions';
import CommaListInput from './CommaListInput';

const Field = ({ label, hint, span, children }) => (
  <div className={span ? 'sm:col-span-2 space-y-1.5' : 'space-y-1.5'}>
    <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">{label}</Label>
    {children}
    {hint && <p className="text-[11px] leading-snug text-mutedink">{hint}</p>}
  </div>
);

export default function DraftHeaderFields({ draft, onChange, disabled }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Message type">
        <Select value={draft.message_type || ''} onValueChange={(v) => onChange({ message_type: v })} disabled={disabled}>
          <SelectTrigger className="h-9 text-[13px]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {MESSAGE_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-[13px]">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Precedence" hint="Sets the prosign on the header line: Z flash, O immediate, P priority, R routine.">
        <Select value={draft.precedence || 'ROUTINE'} onValueChange={(v) => onChange({ precedence: v })} disabled={disabled}>
          <SelectTrigger className="h-9 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRECEDENCES.map((p) => (
              <SelectItem key={p} value={p} className="text-[13px]">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Classification">
        <Select value={draft.classification || 'UNCLASSIFIED'} onValueChange={(v) => onChange({ classification: v })} disabled={disabled}>
          <SelectTrigger className="h-9 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLASSIFICATIONS.map((c) => (
              <SelectItem key={c} value={c} className="text-[13px]">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Originator (FM)">
        <Input
          value={draft.originator || ''}
          onChange={(e) => onChange({ originator: e.target.value })}
          disabled={disabled}
          placeholder="COMSUBLANT NORFOLK VA"
          className="anchor-mono text-[12.5px]"
        />
      </Field>

      <Field label="Subject (SUBJ)" span>
        <Input
          value={draft.subject || ''}
          onChange={(e) => onChange({ subject: e.target.value })}
          disabled={disabled}
          placeholder="DEPLOYMENT READINESS REPORTING REQUIREMENTS"
          className="text-[13px] uppercase"
        />
      </Field>

      <Field label="Action addressees (TO)" span hint="Comma separated. These commands are directed to act.">
        <CommaListInput
          value={draft.action_addressees}
          onChange={(v) => onChange({ action_addressees: v })}
          disabled={disabled}
          placeholder="ALCOMSUBLANT"
        />
      </Field>

      <Field label="Information addressees (INFO)" span hint="Comma separated. These commands are copied for information.">
        <CommaListInput
          value={draft.info_addressees}
          onChange={(v) => onChange({ info_addressees: v })}
          disabled={disabled}
          placeholder="COMSUBFOR, NAVIFOR"
        />
      </Field>
    </div>
  );
}