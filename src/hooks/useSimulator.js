import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { c2oix, localServer } from '@/lib/simulator';

/**
 * The simulator state: the two servers, the repository they move, and the queue
 * that waits for the circuit. Every screen that asks reads the same rows, and the
 * rows are live — both servers write them from the server side.
 */
export default function useSimulator() {
  const [servers, setServers] = useState({});
  const [messages, setMessages] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [busy, setBusy] = useState('');
  const [lastPulse, setLastPulse] = useState(null);

  const load = useCallback(async () => {
    const [{ items: serverRows }, { items: messageRows }, { items: transmissionRows }] = await Promise.all([
      base44.entities.SimServer.list({ limit: 10 }),
      base44.entities.SimMessage.list({ sort: 'sequence', limit: 100 }),
      base44.entities.SimTransmission.list({ sort: '-created_date', limit: 50 }),
    ]);
    setServers(Object.fromEntries((serverRows || []).map((row) => [row.server, row])));
    setMessages(messageRows || []);
    setTransmissions(transmissionRows || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = [
      base44.entities.SimServer.subscribe(load),
      base44.entities.SimMessage.subscribe(load),
      base44.entities.SimTransmission.subscribe(load),
    ];
    return () => unsubscribe.forEach((off) => off());
  }, [load]);

  const run = useCallback(
    async (key, work) => {
      setBusy(key);
      try {
        return await work();
      } finally {
        setBusy('');
        await load();
      }
    },
    [load],
  );

  /** One pass: the local server beats and holds, then the external server hands over. */
  const pulse = useCallback(
    () =>
      run('pulse', async () => {
        await localServer('tick');
        const result = await c2oix('tick');
        setLastPulse({ at: new Date().toISOString(), result });
        return result;
      }),
    [run],
  );

  return { servers, messages, transmissions, busy, lastPulse, load, run, pulse };
}