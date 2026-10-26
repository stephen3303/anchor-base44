import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_LABEL, shortName } from '@/lib/personnel';
import { cn } from '@/lib/utils';

/**
 * Picks a person from the command roster.
 *
 * Routing and release are based on the personnel records, not on app logins: a
 * step is held by a person, in a rank and a position, and the chain hands off to
 * the email held on that record. So a person with no email on the roster cannot
 * be assigned — they are shown greyed with the reason, never hidden, so the
 * administrator can see who is missing what.
 *
 * `value` is the email the record holds, so a saved step still resolves to the
 * person who holds it.
 */
export default function PersonnelSelect({ personnel, value, onChange, placeholder, className, id }) {
  const people = personnel || [];
  const selected = people.find((person) => person.email && person.email === value) || null;

  return (
    <Select
      value={selected?.id || ''}
      onValueChange={(personId) => onChange(people.find((person) => person.id === personId) || null)}
    >
      <SelectTrigger id={id} className={cn('h-8 text-[12.5px]', className)}>
        <SelectValue placeholder={placeholder || 'Pick from the roster'} />
      </SelectTrigger>
      <SelectContent>
        {people.map((person) => (
          <SelectItem
            key={person.id}
            value={person.id}
            disabled={!person.email}
            className="text-[12.5px]"
          >
            {shortName(person)} — {person.position || 'no position'}
            {person.status && person.status !== 'active' ? ` · ${STATUS_LABEL[person.status] || person.status}` : ''}
            {!person.email ? ' · no email on roster' : ''}
          </SelectItem>
        ))}
        {people.length === 0 && (
          <div className="px-2 py-3 text-[12px] text-mutedink">
            The roster is empty. Add people under Admin → Personnel first.
          </div>
        )}
      </SelectContent>
    </Select>
  );
}