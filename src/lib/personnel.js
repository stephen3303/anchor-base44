/**
 * Command roster helpers.
 *
 * A personnel record is the command's own view of a person — rank, position and
 * the name held as separate fields. It is deliberately separate from an app
 * account: people appear on the roster whether or not they hold a login.
 */

export const PERSONNEL_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'leave', label: 'On leave' },
  { value: 'detached', label: 'Detached' },
];

export const STATUS_LABEL = PERSONNEL_STATUS.reduce((map, entry) => {
  map[entry.value] = entry.label;
  return map;
}, {});

export const STATUS_STYLE = {
  active: 'border-lifecycle-active/40 bg-lifecycle-active/5 text-lifecycle-active',
  leave: 'border-lifecycle-amended/50 bg-[#FFF6DE] text-lifecycle-amended',
  detached: 'border-line bg-page text-mutedink',
};

/** Common ranks, offered as suggestions. The field stays free text. */
export const RANK_SUGGESTIONS = [
  'CAPT',
  'CDR',
  'LCDR',
  'LT',
  'LTJG',
  'ENS',
  'CWO5',
  'CWO4',
  'CWO3',
  'CWO2',
  'CMDCM',
  'OSCM',
  'OSCS',
  'OSC',
  'ETC',
  'ET1',
  'STS1',
  'MM1',
  'IT1',
  'YN1',
  'PS1',
  'HM1',
];

/** "Marcus A. Whitfield" — the full name as held, middle initial kept short. */
export const fullName = (person) =>
  [person?.first_name, person?.middle_name, person?.last_name]
    .map((part) => (part || '').trim())
    .filter(Boolean)
    .join(' ') || 'Unnamed';

/** "CDR Whitfield" — how a person is named in a list or an audit line. */
export const shortName = (person) =>
  [person?.rank, person?.last_name]
    .map((part) => (part || '').trim())
    .filter(Boolean)
    .join(' ') || fullName(person);

export const matchesSearch = (person, term) => {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return [person.first_name, person.middle_name, person.last_name, person.rank, person.position, person.email]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
};