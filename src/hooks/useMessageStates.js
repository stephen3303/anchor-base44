import { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import { base44 } from '@/api/base44Client';

/**
 * Read and star state — deliberately separate from acknowledgements, because
 * reading a message is not acknowledging it. Held per user, so accountability
 * reports can tell "acknowledged" apart from "merely read".
 */
export default function useMessageStates(user) {
  const [states, setStates] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await base44.entities.MessageUserState.list({ sort: '-created_date' });
      if (alive) setStates(Array.isArray(rows) ? rows : rows?.items || []);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const markRead = useCallback(async (message) => {
    const existing = states.find((s) => s.message_id === message.id);
    if (existing?.read_at) return existing;

    const row = existing
      ? await base44.entities.MessageUserState.update(existing.id, { read_at: moment.utc().toISOString() })
      : await base44.entities.MessageUserState.create({
          message_id: message.id,
          message_reference: message.reference || '',
          user_email: user?.email || '',
          read_at: moment.utc().toISOString(),
        });

    setStates((prev) => [row, ...prev.filter((s) => s.id !== row.id)]);
    return row;
  }, [states, user?.email]);

  const toggleStar = useCallback(async (message) => {
    const existing = states.find((s) => s.message_id === message.id);

    const row = existing
      ? await base44.entities.MessageUserState.update(existing.id, { starred: !existing.starred })
      : await base44.entities.MessageUserState.create({
          message_id: message.id,
          message_reference: message.reference || '',
          user_email: user?.email || '',
          starred: true,
        });

    setStates((prev) => [row, ...prev.filter((s) => s.id !== row.id)]);
    return row;
  }, [states, user?.email]);

  const byMessageId = useCallback((id) => states.find((s) => s.message_id === id) || null, [states]);

  return { states, markRead, toggleStar, byMessageId };
}