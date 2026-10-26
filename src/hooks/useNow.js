import { useEffect, useState } from 'react';

/** A ticking clock for readouts that must stay current: header clocks, zone previews. */
export default function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}