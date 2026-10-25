import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">{label}</Label>
    {children}
    {hint && <p className="text-[11px] leading-snug text-mutedink">{hint}</p>}
  </div>
);

/** GENADMIN sets beyond the heading: content class, SSIC, general message title, POC and DECL. */
export default function DraftNtpFields({ draft, onChange, disabled }) {
  const classified = draft.classification && draft.classification !== 'UNCLASSIFIED';
  const text = (key, placeholder, mono = true) => (
    <Input
      value={draft[key] || ''}
      onChange={(e) => onChange({ [key]: e.target.value })}
      disabled={disabled}
      placeholder={placeholder}
      className={mono ? 'anchor-mono text-[12.5px]' : 'text-[13px]'}
    />
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Content" hint="Administrative messages carry ZYB after the DTG and top out at PRIORITY.">
        <Select value={draft.traffic_class || 'ADMIN'} onValueChange={(v) => onChange({ traffic_class: v })} disabled={disabled}>
          <SelectTrigger className="h-9 text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN" className="text-[13px]">Administrative</SelectItem>
            <SelectItem value="OPS" className="text-[13px]">Operational</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="SSIC" hint="N and five digits. N00000 only when finding the SSIC would delay a high-precedence message.">
        {text('ssic', 'N02300')}
      </Field>

      <Field label="General message number (optional)" hint="Echelon I and II commands only, for example ALNAV 032/26.">
        {text('general_message_id', 'ALNAV 032/26')}
      </Field>

      {classified && (
        <Field label="Declassification (DECL)" hint="DDMMMYY under ten years out, or X1 through X8.">
          {text('decl', 'X4')}
        </Field>
      )}

      <div className="sm:col-span-2">
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">
          Point of contact (POC) — required in every GENADMIN
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          {text('poc_name', 'DAVIS', false)}
          {text('poc_rank', 'LT', false)}
          {text('poc_location', 'COMMAND', false)}
          {text('poc_phone', 'DSN 564-1313', false)}
        </div>
        <p className="mt-1.5 text-[11px] text-mutedink">Name · rank or rate · command · phone</p>
      </div>
    </div>
  );
}