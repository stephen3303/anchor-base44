import { useState } from 'react';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MESSAGE_TYPES } from '@/data/draftOptions';
import { shortName } from '@/lib/personnel';
import PersonnelSelect from './PersonnelSelect';
import SearchableSelect from './SearchableSelect';

/**
 * Who may release. The commanding officer holds it inherently and may designate
 * subordinates, optionally limited to a set of message types.
 *
 * Designations are made from the personnel records, so the authority is held by a
 * person in a rank and a position — and the record's email is what the release is
 * checked against when they sign in.
 */
export default function ReleaseAuthorityPanel({ authorities, personnel, onAdd, onRemove, busy }) {
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [scope, setScope] = useState('all');
  const [isCo, setIsCo] = useState(false);
  const [error, setError] = useState('');

  const add = () => {
    const person = (personnel || []).find((p) => p.email && p.email === email);
    if (!person || !designation.trim()) {
      setError('Pick a person from the roster and give the designation they hold.');
      return;
    }
    setError('');
    onAdd({
      user_email: person.email,
      user_name: shortName(person),
      designation: designation.trim(),
      is_commanding_officer: isCo,
      scope_message_types: scope === 'all' ? [] : [scope],
      active: true,
    });
    setEmail('');
    setDesignation('');
    setScope('all');
    setIsCo(false);
  };

  return (
    <section className="rounded-md border border-line bg-white shadow-sm">
      <header className="border-b border-line px-4 py-3">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <ShieldCheck className="h-4 w-4 text-navy-600" aria-hidden="true" />
          Release authority
        </h3>
      </header>

      <ul className="divide-y divide-line/70">
        {authorities.map((a) => (
          <li key={a.id} className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-ink">
                {a.user_name}
                {a.is_commanding_officer ? ' · commanding officer' : ''}
                {a.active === false ? ' · inactive' : ''}
              </p>
              <p className="text-[11.5px] text-mutedink">
                {a.designation} · {(a.scope_message_types || []).length ? a.scope_message_types.join(', ') : 'all message types'}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(a)} disabled={busy} className="h-8 px-2" title="Remove designation">
              <Trash2 className="h-4 w-4 text-lifecycle-cancelled" />
            </Button>
          </li>
        ))}
        {authorities.length === 0 && (
          <li className="px-4 py-4 text-[12px] text-mutedink">
            No release authority designated. Nothing can be released until one is set.
          </li>
        )}
      </ul>

      <div className="space-y-3 border-t border-line bg-secondary/40 px-4 py-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">
              Person on the roster
            </Label>
            <PersonnelSelect
              personnel={personnel}
              value={email}
              onChange={(person) => {
                if (!person) return;
                setEmail(person.email);
                setDesignation(person.position || '');
                setIsCo(/commanding officer/i.test(person.position || ''));
              }}
              placeholder="Select from the roster"
              className="h-9 text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Designation</Label>
            <Input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Commanding Officer, XO, CDO"
              className="h-9 text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mutedink">Authority scope</Label>
            <SearchableSelect
              options={[
                { value: 'all', label: 'All message types' },
                ...MESSAGE_TYPES.map((t) => ({ value: t, label: t })),
              ]}
              value={scope}
              onChange={setScope}
              placeholder="All message types"
              searchPlaceholder="Type a message type…"
              className="h-9 text-[13px]"
            />
          </div>
        </div>

        {error && <p className="text-[11.5px] font-semibold text-lifecycle-cancelled">{error}</p>}
        {!(personnel || []).length && (
          <p className="text-[11.5px] text-mutedink">
            The roster is empty. Release authority is designated from the personnel records, so add people under Admin →
            Personnel first.
          </p>
        )}

        <Button type="button" size="sm" onClick={add} disabled={busy} className="gap-1.5 text-[12.5px]">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Designate release authority
        </Button>
      </div>
    </section>
  );
}