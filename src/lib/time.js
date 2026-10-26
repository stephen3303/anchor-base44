import moment from 'moment';

/**
 * Zulu and local time.
 *
 * A DTG is filed as DDHHMMZ MON YY ("230332Z OCT 26") and is always Zulu. The watch
 * reads its own clock, so the same instant can be shown in the operator's zone
 * without touching the record. The zone comes from the profile (or follows the host
 * computer), which is why local formatting goes through Intl rather than moment's
 * own host conversion — the two can differ.
 */

/** The zone of the machine in front of the operator: what "this computer" resolves to. */
export const HOST_ZONE = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (error) {
    return 'UTC';
  }
})();

const MONTHS = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

/** "230332Z OCT 26" -> the instant as a UTC moment, or null when the field is not a DTG. */
export const parseDtg = (dtg) => {
  const match = String(dtg || '')
    .trim()
    .match(/^(\d{2})(\d{2})(\d{2})(\d{2})?Z\s*([A-Za-z]{3})\s*(\d{2})$/);
  if (!match) return null;

  const month = MONTHS[match[5].toUpperCase()];
  if (month === undefined) return null;

  const instant = moment.utc({
    year: 2000 + Number(match[6]),
    month,
    day: Number(match[1]),
    hour: Number(match[2]),
    minute: Number(match[3]),
    second: Number(match[4] || 0),
  });
  return instant.isValid() ? instant : null;
};

const toDate = (value) => (moment.isMoment(value) ? value.toDate() : value instanceof Date ? value : new Date(value));

/** "23 OCT 26 03:32" — Zulu, as the record is filed. */
export const zuluTime = (value, { seconds = false } = {}) => {
  const instant = moment.isMoment(value) ? moment.utc(value.valueOf()) : moment.utc(value);
  return instant.format(seconds ? 'DD MMM YY HH:mm:ss' : 'DD MMM YY HH:mm').toUpperCase();
};

/** "23 OCT 26 23:32" — the same instant on the operator's clock. */
export const zoneTime = (value, zone, { seconds = false } = {}) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
    hourCycle: 'h23',
  })
    .formatToParts(toDate(value))
    .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});

  const time = `${parts.hour}:${parts.minute}${seconds ? `:${parts.second}` : ''}`;
  return `${parts.day} ${String(parts.month || '').toUpperCase()} ${parts.year} ${time}`;
};

const zoneNamePart = (value, zone, style) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: style }).formatToParts(toDate(value));
  return (parts.find((part) => part.type === 'timeZoneName') || {}).value || '';
};

/** "EDT", "GMT+3" — what the watch says out loud. */
export const zoneAbbreviation = (zone, value = new Date()) => zoneNamePart(value, zone, 'short') || zone;

/** "UTC-04:00" — needed where the abbreviation is ambiguous. */
export const zoneOffset = (zone, value = new Date()) => zoneNamePart(value, zone, 'longOffset').replace('GMT', 'UTC');

export const ZONE_GROUPS = ['United States', 'Overseas', 'Standard'];

export const ZONE_OPTIONS = [
  { group: 'United States', value: 'America/New_York', label: 'Eastern' },
  { group: 'United States', value: 'America/Chicago', label: 'Central' },
  { group: 'United States', value: 'America/Denver', label: 'Mountain' },
  { group: 'United States', value: 'America/Phoenix', label: 'Arizona' },
  { group: 'United States', value: 'America/Los_Angeles', label: 'Pacific' },
  { group: 'United States', value: 'America/Anchorage', label: 'Alaska' },
  { group: 'United States', value: 'Pacific/Honolulu', label: 'Hawaii' },
  { group: 'United States', value: 'America/Puerto_Rico', label: 'Atlantic' },
  { group: 'Overseas', value: 'Europe/London', label: 'United Kingdom' },
  { group: 'Overseas', value: 'Europe/Rome', label: 'Italy' },
  { group: 'Overseas', value: 'Europe/Madrid', label: 'Spain' },
  { group: 'Overseas', value: 'Asia/Bahrain', label: 'Bahrain' },
  { group: 'Overseas', value: 'Africa/Djibouti', label: 'Djibouti' },
  { group: 'Overseas', value: 'Asia/Seoul', label: 'Korea' },
  { group: 'Overseas', value: 'Asia/Tokyo', label: 'Japan' },
  { group: 'Overseas', value: 'Asia/Manila', label: 'Philippines' },
  { group: 'Overseas', value: 'Pacific/Guam', label: 'Guam' },
  { group: 'Overseas', value: 'Australia/Darwin', label: 'Australia (Darwin)' },
  { group: 'Standard', value: 'UTC', label: 'Zulu (UTC)' },
];

export const zoneLabel = (zone) => (ZONE_OPTIONS.find((option) => option.value === zone) || {}).label || zone;