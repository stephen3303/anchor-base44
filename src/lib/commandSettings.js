import { base44 } from '@/api/base44Client';

/**
 * Command-wide transmission settings.
 *
 * One record governs every message the command transmits: the case the prose is
 * set in, and the local message control sequence that numbers released traffic.
 * The sequence is assigned once, at release, in release order — never on a draft,
 * and never on submission.
 */

export const DEFAULT_COMMAND_SETTINGS = {
  text_case: 'upper',
  sequence_prefix: '#',
  sequence_digits: 4,
  next_sequence: 1,
};

export const TEXT_CASE = [
  { value: 'upper', label: 'Capitals', note: 'Every transmitted message is set in capitals.' },
  { value: 'mixed', label: 'As typed', note: 'The drafter’s capitalisation transmits unchanged.' },
];

/** Missing record, or fields an older record never carried. */
export const withDefaults = (setting) => ({ ...DEFAULT_COMMAND_SETTINGS, ...(setting || {}) });

const digitsOf = (settings) => {
  const digits = Math.trunc(Number(settings.sequence_digits));
  return Number.isFinite(digits) && digits > 0 && digits <= 8 ? digits : DEFAULT_COMMAND_SETTINGS.sequence_digits;
};

/** "0001" — the message serial number carried in the MSGID. */
export const formatMsn = (value, setting) => {
  const settings = withDefaults(setting);
  const n = Math.max(0, Math.trunc(Number(value) || 0));
  return String(n).padStart(digitsOf(settings), '0');
};

/** "#0001" — the local message control sequence. */
export const formatSequence = (value, setting) => {
  const settings = withDefaults(setting);
  return `${settings.sequence_prefix ?? '#'}${formatMsn(value, settings)}`;
};

/** The null placeholder for a field the command has not assigned yet. */
export const nullSequence = (setting) => {
  const settings = withDefaults(setting);
  return `${settings.sequence_prefix ?? '#'}${'-'.repeat(digitsOf(settings))}`;
};

/** The number the next release takes, and the counter value to store after it. */
export const nextAssignment = (setting) => {
  const settings = withDefaults(setting);
  const n = Math.max(1, Math.trunc(Number(settings.next_sequence) || 1));
  return {
    msn: formatMsn(n, settings),
    local_sequence: formatSequence(n, settings),
    next_sequence: n + 1,
  };
};

export const loadCommandSettings = async () => {
  const rows = await base44.entities.CommandSetting.list();
  return rows?.[0] || null;
};