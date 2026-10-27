import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/** The published templates, with the tags that identify the traffic they govern. */
export default function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const rows = await base44.entities.MessageTemplate.list({ sort: 'name' });
      setTemplates(Array.isArray(rows) ? rows : rows?.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { templates, loading, reload };
}