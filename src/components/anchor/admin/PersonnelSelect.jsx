import { STATUS_LABEL, shortName } from '@/lib/personnel';
import SearchableSelect from './SearchableSelect';

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
 * person who holds it. Typing filters on rank, name, position and email.
 */
export default function PersonnelSelect({ personnel, value, onChange, placeholder, className }) {
  const people = personnel || [];
  const selected = people.find((person) => person.email && person.email === value) || null;

  const options = people.map((person) => {
    const status =
      person.status && person.status !== 'active' ? ` · ${STATUS_LABEL[person.status] || person.status}` : '';
    return {
      value: person.id,
      label: `${shortName(person)} — ${person.position || 'no position'}${status}${
        person.email ? '' : ' · no email on roster'
      }`,
      keywords: [
        person.rank,
        person.first_name,
        person.middle_name,
        person.last_name,
        person.position,
        person.email,
        STATUS_LABEL[person.status],
      ]
        .filter(Boolean)
        .join(' '),
      disabled: !person.email,
    };
  });

  return (
    <SearchableSelect
      options={options}
      value={selected?.id || ''}
      onChange={(personId) => onChange(people.find((person) => person.id === personId) || null)}
      placeholder={placeholder || 'Pick from the roster'}
      searchPlaceholder="Type a rank, name or position…"
      emptyText={
        people.length
          ? 'No one on the roster matches.'
          : 'The roster is empty. Add people under Admin → Personnel first.'
      }
      className={className}
    />
  );
}