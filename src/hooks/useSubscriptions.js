import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * The command's feeds. Reading is open to the staff; requesting, pausing and
 * deciding are constrained by the record's own access rules.
 */
export default function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await base44.entities.Subscription.list({ sort: '-created_date' });
      if (alive) {
        setSubscriptions(Array.isArray(rows) ? rows : rows?.items || []);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(
    () =>
      base44.entities.Subscription.subscribe((event) => {
        if (event.type === 'create') {
          setSubscriptions((prev) => (prev.some((s) => s.id === event.data.id) ? prev : [event.data, ...prev]));
        }
        if (event.type === 'update') {
          setSubscriptions((prev) => prev.map((s) => (s.id === event.data.id ? event.data : s)));
        }
      }),
    [],
  );

  const request = useCallback(async (payload) => {
    const row = await base44.entities.Subscription.create(payload);
    setSubscriptions((prev) => [row, ...prev]);
    return row;
  }, []);

  const update = useCallback(async (id, patch) => {
    const row = await base44.entities.Subscription.update(id, patch);
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? row : s)));
    return row;
  }, []);

  return { subscriptions, loading, request, update };
}