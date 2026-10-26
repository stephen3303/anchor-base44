import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { mandatoryAcks } from '@/data/anchorSampleData';
import { acknowledgementPayload } from '@/lib/acknowledgements';

/**
 * Mandatory acknowledgements owed by the signed-in user, live.
 *
 * The obligation comes from the alert rule on the message; what is stored is the
 * acknowledgement itself. Rows are read back so an acknowledgement survives a
 * reload, and the subscription keeps the header strip and the dashboard in step
 * the moment one is recorded.
 */
export default function useAcknowledgements(user) {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await base44.entities.Acknowledgement.list({ sort: '-acknowledged_at' });
      if (alive) setRecords(Array.isArray(rows) ? rows : rows?.items || []);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(
    () =>
      base44.entities.Acknowledgement.subscribe((event) => {
        if (event.type !== 'create') return;
        setRecords((prev) => (prev.some((r) => r.id === event.data.id) ? prev : [event.data, ...prev]));
      }),
    [],
  );

  const acknowledgedIds = useMemo(
    () => new Set(records.filter((r) => r.created_by === user?.email).map((r) => r.message_id)),
    [records, user?.email],
  );

  // Mandatory traffic is still the sample set until C2OIX ingestion is connected.
  const pending = useMemo(() => mandatoryAcks().filter((m) => !acknowledgedIds.has(m.id)), [acknowledgedIds]);

  const acknowledge = useCallback(
    async (message) => {
      const row = await base44.entities.Acknowledgement.create(acknowledgementPayload({ message, user }));
      setRecords((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
      return row;
    },
    [user],
  );

  return { records, pending, acknowledge };
}