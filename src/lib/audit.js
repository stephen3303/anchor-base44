import { base44 } from '@/api/base44Client';

/**
 * Client side of the audit chain.
 *
 * Events are appended by a backend function, never written from the browser: the
 * log is create-only through that one path, readable by administrators, and has
 * no update or delete route for anyone. The hash chain gives tamper evidence —
 * it does not claim to make the table technically immutable.
 */
export const AUDIT_GENESIS = 'GENESIS';

export const AUDIT_ACTION_LABEL = {
  message_opened: 'Record opened',
  search_run: 'Search run',
  record_printed: 'Record printed',
  acknowledgement_recorded: 'Acknowledgement recorded',
  subscription_requested: 'Subscription requested',
  subscription_paused: 'Subscription paused or resumed',
  subscription_decided: 'Subscription decided',
  alert_rule_changed: 'Alert rule changed',
  personnel_changed: 'Personnel record changed',
  link_reported: 'Link state reported',
  sync_replayed: 'Queued action synchronised',
  turnover_saved: 'Watch turnover saved',
  profile_updated: 'Profile updated',
  system_fault: 'System fault reported',
};

export const canonicalPayload = (row) =>
  JSON.stringify([
    row.seq,
    row.actor_email || '',
    row.action,
    row.target_reference || '',
    row.detail || '',
    row.recorded_at,
    row.prev_hash,
  ]);

export const chainHash = async (payload) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

/** Append one event. Never let a failed audit entry break the action itself. */
export const recordAudit = async (payload) => {
  try {
    const response = await base44.functions.invoke('recordAuditEvent', payload);
    return response?.data?.event || null;
  } catch (error) {
    return null;
  }
};

/** Recompute the chain over every row and name the first row that does not fit. */
export const verifyChain = async (rows) => {
  const ordered = [...rows].sort((a, b) => (a.seq || 0) - (b.seq || 0));
  let previousHash = AUDIT_GENESIS;

  for (let index = 0; index < ordered.length; index += 1) {
    const row = ordered[index];
    if (row.seq !== index + 1) {
      return { ok: false, checked: index, breakAt: row.seq, reason: 'Sequence gap — events are missing or reordered.' };
    }
    if ((row.prev_hash || AUDIT_GENESIS) !== previousHash) {
      return { ok: false, checked: index, breakAt: row.seq, reason: 'Previous-event hash does not match — a row was altered or removed.' };
    }
    const expected = await chainHash(canonicalPayload(row));
    if (expected !== row.hash) {
      return { ok: false, checked: index, breakAt: row.seq, reason: 'Row hash does not match its contents — the event was altered.' };
    }
    previousHash = row.hash;
  }

  return { ok: true, checked: ordered.length, breakAt: null, reason: null };
};