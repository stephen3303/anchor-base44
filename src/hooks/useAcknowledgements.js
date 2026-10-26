import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { SAMPLE_MESSAGES } from '@/data/anchorSampleData';
import { acknowledgementPayload } from '@/lib/acknowledgements';
import { resolveMandatory } from '@/lib/alertRules';
import { enqueue } from '@/lib/syncQueue';
import { readEmcon } from '@/lib/emcon';
import { recordAudit } from '@/lib/audit';
import useAlertRules from '@/hooks/useAlertRules';

/**
 * Mandatory acknowledgements owed by the signed-in user, live.
 *
 * The obligation is computed from the alert rules; what is stored is the
 * acknowledgement itself. In EMCON the acknowledgement is queued on the
 * workstation instead of being recorded, and replays when the network returns.
 */
export default function useAcknowledgements(user) {
  const rules = useAlertRules();
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
  const pending = useMemo(
    () => resolveMandatory(SAMPLE_MESSAGES, rules).filter((m) => !acknowledgedIds.has(m.id)),
    [acknowledgedIds, rules],
  );

  const acknowledge = useCallback(
    async (message) => {
      const payload = acknowledgementPayload({ message, user });

      if (readEmcon()) {
        const queued = enqueue({
          operation: 'acknowledgement',
          label: `${message.reference} acknowledgement`,
          target_reference: message.reference || '',
          payload,
        });
        return { ...payload, queued: true, queued_at: queued.queued_at };
      }

      const row = await base44.entities.Acknowledgement.create(payload);
      setRecords((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
      await recordAudit({
        action: 'acknowledgement_recorded',
        target_type: 'message',
        target_id: message.id,
        target_reference: message.reference || '',
        detail: `${row.ack_status === 'late' ? 'Recorded late' : 'Recorded on time'} against ${message.alert_rule || 'the alert rule'}`,
      });
      return row;
    },
    [user],
  );

  return { records, pending, acknowledge };
}