import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { recordAudit } from '@/lib/audit';
import { WORKSTATION_LINKS, loadWorkstationLinks, nodeByKey } from '@/lib/topology';

/**
 * The workstation links of the demonstration diagram, and the actions that break
 * and restore them. The circuit is not here: it is the command's own link state.
 */
export default function useTopology() {
  const [rows, setRows] = useState([]);
  const [servers, setServers] = useState({});
  const [traffic, setTraffic] = useState({});
  const [busy, setBusy] = useState('');
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const [linkRows, { items: serverRows }, queued, deferred, ingested, held, transmitted] = await Promise.all([
      loadWorkstationLinks(),
      base44.entities.SimServer.list({ limit: 10 }),
      base44.entities.SimMessage.count({ status: 'queued' }),
      base44.entities.SimMessage.count({ status: 'deferred' }),
      base44.entities.SimMessage.count({ status: 'ingested' }),
      base44.entities.SimTransmission.count({ status: 'held' }),
      base44.entities.SimTransmission.count({ status: 'transmitted' }),
    ]);
    setRows(linkRows);
    setServers(Object.fromEntries((serverRows || []).map((row) => [row.server, row])));
    setTraffic({ queued, deferred, ingested, held, transmitted });
  }, []);

  useEffect(() => {
    load().finally(() => setReady(true));
  }, [load]);

  useEffect(() => {
    const off = [
      base44.entities.NetworkLink.subscribe(load),
      base44.entities.SimServer.subscribe(load),
      base44.entities.SimMessage.subscribe(load),
      base44.entities.SimTransmission.subscribe(load),
    ];
    return () => off.forEach((unsubscribe) => unsubscribe());
  }, [load]);

  /** Report one workstation link. Every report is appended to the audit chain. */
  const reportLink = useCallback(
    async (key, state, note) => {
      const definition = WORKSTATION_LINKS.find((link) => link.key === key);
      const row = rows.find((item) => item.link_key === key);
      setBusy(key);
      try {
        const me = await base44.auth.me();
        const payload = {
          state,
          note: note || '',
          reported_at: new Date().toISOString(),
          reported_by_name: me?.full_name || me?.email || '',
          reported_by_email: me?.email || '',
        };
        const saved = row
          ? await base44.entities.NetworkLink.update(row.id, payload)
          : await base44.entities.NetworkLink.create({ link_key: key, label: definition.label, ...payload });

        await recordAudit({
          action: 'link_reported',
          target_type: 'link',
          target_id: saved.id,
          target_reference: definition.label,
          detail:
            state === 'up'
              ? `${nodeByKey(definition.to).name} reported connected to the ANCHOR server.`
              : `${nodeByKey(definition.to).name} reported unable to reach the ANCHOR server; work is held at that workstation.`,
        });
        return saved;
      } finally {
        setBusy('');
        await load();
      }
    },
    [rows, load],
  );

  const restoreAll = useCallback(async () => {
    setBusy('all');
    try {
      const me = await base44.auth.me();
      const at = new Date().toISOString();
      const payload = {
        state: 'up',
        note: 'All connections restored from the network topology demonstration.',
        reported_at: at,
        reported_by_name: me?.full_name || me?.email || '',
        reported_by_email: me?.email || '',
      };
      await Promise.all(rows.map((row) => base44.entities.NetworkLink.update(row.id, payload)));
      await recordAudit({
        action: 'link_reported',
        target_type: 'link',
        target_reference: 'Workstation links',
        detail: 'All three workstation links reported restored to the ANCHOR server.',
      });
    } finally {
      setBusy('');
      await load();
    }
  }, [rows, load]);

  return { rows, servers, busy, ready, load, reportLink, restoreAll, traffic };
}