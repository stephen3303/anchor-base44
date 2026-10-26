import { HOST_ZONE } from '@/lib/time';

/**
 * The local zone this operator reads, held outside React so the header clock, the
 * lists and the profile agree the moment it is changed. "host" follows whatever
 * computer the operator has signed in on; anything else is an IANA zone saved on
 * the profile. The record itself is never affected.
 */
export const FOLLOW_HOST = 'host';

const listeners = new Set();
let preference = FOLLOW_HOST;

export const getZonePreference = () => preference;

export const subscribeZone = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const setZonePreference = (value) => {
  const next = value || FOLLOW_HOST;
  if (next === preference) return;
  preference = next;
  listeners.forEach((listener) => listener());
};

/** The zone a preference resolves to on this machine. */
export const resolveZone = (value) => (!value || value === FOLLOW_HOST ? HOST_ZONE : value);