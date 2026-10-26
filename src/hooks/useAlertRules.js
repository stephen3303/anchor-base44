import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_ALERT_RULES } from '@/lib/alertRules';

/**
 * The alert rules in force. Until an administrator edits them, the command
 * defaults stand in, so mandatory traffic is never silently empty.
 */
export default function useAlertRules() {
  const [rules, setRules] = useState(DEFAULT_ALERT_RULES);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await base44.entities.AlertRule.list({ sort: 'priority' });
        const items = Array.isArray(rows) ? rows : rows?.items || [];
        if (alive && items.length) setRules(items);
      } catch (error) {
        // Defaults stand in.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return rules;
}