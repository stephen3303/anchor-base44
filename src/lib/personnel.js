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

/** How a person stands on the roster today, as a routing chain sees it. */
export const ROSTER_STATE = {
  active: { label: 'Active', className: 'text-lifecycle-active' },
  leave: { label: 'On leave', className: 'text-lifecycle-amended' },
  detached: { label: 'Detached', className: 'text-lifecycle-cancelled' },
  absent: { label: 'Not on the roster', className: 'text-mutedink' },
};

export const personById = (personnel, id) => (personnel || []).find((person) => person.id === id) || null;

export const personByEmail = (personnel, email) => {
  const needle = String(email || '').trim().toLowerCase();
  if (!needle) return null;
  return (personnel || []).find((person) => person.email && person.email.trim().toLowerCase() === needle) || null;
};

/** The roster record behind a step or a designation: by recorded person, then by email. */
export const findPerson = (personnel, { personnel_id, email } = {}) =>
  personById(personnel, personnel_id) || personByEmail(personnel, email);

/**
 * A step or a designation resolved against the roster as it stands now.
 *
 * The rank, name and position come from the person's record rather than from the
 * copy stored when the step was written, so a promotion, a change of position or a
 * detachment shows on the chain the moment it is recorded — and a person who has
 * left the command is visible as detached rather than silently still holding a step.
 */
export const resolveHolder = (entry, personnel) => {
  const person = findPerson(personnel, {
    personnel_id: entry?.personnel_id,
    email: entry?.assignee_email || entry?.user_email,
  });
  const state = person ? person.status || 'active' : 'absent';
  return {
    person,
    state,
    label: ROSTER_STATE[state]?.label || state,
    name: person ? shortName(person) : entry?.assignee_name || entry?.user_name || '',
    duty: person ? person.position || '' : entry?.duty || entry?.designation || '',
  };
};

/** One route step with its holder resolved live. Display only — never persisted as is. */
export const resolveStep = (step, personnel) => {
  const holder = resolveHolder(step, personnel);
  return {
    ...step,
    holder,
    holder_name: holder.name,
    holder_duty: holder.duty,
    holder_state: holder.state,
    holder_label: holder.label,
  };
};

export const resolveRoute = (steps, personnel) => (steps || []).map((step) => resolveStep(step, personnel));

/** A holder detached from the command cannot act: the step has to be re-held first. */
export const detachedSteps = (steps, personnel) =>
  resolveRoute(steps, personnel).filter((step) => step.holder_state === 'detached');

export const matchesSearch = (person, term) => {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return [person.first_name, person.middle_name, person.last_name, person.rank, person.position, person.email]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
};