import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { HOST_ZONE, zoneLabel } from '@/lib/time';
import { FOLLOW_HOST, getZonePreference, resolveZone, setZonePreference, subscribeZone } from '@/lib/timeZone';

/**
 * The zone this operator reads times in: the one saved on their profile, or the
 * host computer when they have asked to follow it.
 */
export default function useTimeZone() {
  const { user } = useAuth();
  const preference = useSyncExternalStore(subscribeZone, getZonePreference, getZonePreference);

  // The profile is the source of truth once the user record is known.
  const saved = user?.time_zone || FOLLOW_HOST;
  useEffect(() => {
    setZonePreference(saved);
  }, [saved]);

  const zone = resolveZone(preference);

  return {
    preference,
    zone,
    hostZone: HOST_ZONE,
    label: zoneLabel(zone),
    followsHost: preference === FOLLOW_HOST,
    setPreference: setZonePreference,
  };
}