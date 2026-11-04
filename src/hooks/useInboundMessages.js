import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { OPERATOR_WORKSTATION, receivedAtWorkstation, toInboxMessage } from '@/lib/inboundMessages';

/**
 * The traffic the ANCHOR server has received from C2OIX, as read at the operator's
 * workstation. New arrivals appear as they are ingested.
 */
export default function useInboundMessages() {
  const [received, setReceived] = useState([]);
  const [link, setLink] = useState({ state: 'unknown', reportedAt: '' });

  const load = useCallback(async () => {
    const [page, links] = await Promise.all([
      base44.entities.SimMessage.filter({ status: 'ingested' }, { sort: '-ingested_at', limit: 50 }),
      base44.entities.NetworkLink.filter({ link_key: OPERATOR_WORKSTATION.key }, { limit: 1 }),
    ]);
    setReceived((page?.items || []).map(toInboxMessage));
    const row = (links?.items || [])[0];
    setLink({ state: row?.state || 'unknown', reportedAt: row?.reported_at || '' });
  }, []);

  useEffect(() => {
    load().catch(() => setReceived([]));
    return base44.entities.SimMessage.subscribe(() => {
      load().catch(() => {});
    });
  }, [load]);

  const messages = useMemo(() => receivedAtWorkstation(received, link), [received, link]);

  return { messages, workstation: OPERATOR_WORKSTATION, link, reload: load };
}