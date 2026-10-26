import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { AUDIT_GENESIS, canonicalPayload, chainHash } from '../../shared/auditChain.ts';

/**
 * Appends one audit event to the hash chain.
 *
 * Consequential actions only — opening a record, acknowledging, searching,
 * printing, subscription decisions, admin changes, sync replays. The action must
 * be one of the allowlisted names and the actor is taken from the authenticated
 * session, never from the request body, so a caller cannot write an event as
 * somebody else. Rows are created with the service role: users have no create,
 * update or delete path to the audit log at all.
 */
const CATEGORY_BY_ACTION = {
  message_opened: 'read',
  search_run: 'read',
  record_printed: 'read',
  acknowledgement_recorded: 'act',
  subscription_requested: 'act',
  subscription_paused: 'act',
  subscription_decided: 'govern',
  alert_rule_changed: 'admin',
  personnel_changed: 'admin',
  link_reported: 'act',
  sync_replayed: 'system',
  turnover_saved: 'act',
  profile_updated: 'admin',
  system_fault: 'system',
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === 'string' ? body.action : '';
    if (!CATEGORY_BY_ACTION[action]) {
      return Response.json({ error: 'Unknown audit action' }, { status: 400 });
    }

    const clip = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

    const { items } = await base44.asServiceRole.entities.AuditEvent.list({ sort: '-seq', limit: 1 });
    const last = Array.isArray(items) ? items[0] : null;

    const row = {
      seq: (last?.seq || 0) + 1,
      prev_hash: last?.hash || AUDIT_GENESIS,
      action,
      category: CATEGORY_BY_ACTION[action],
      actor_email: user.email || '',
      actor_name: user.full_name || '',
      actor_role: user.duty || user.role || '',
      command: user.unit || '',
      target_type: clip(body?.target_type, 40),
      target_id: clip(body?.target_id, 60),
      target_reference: clip(body?.target_reference, 80),
      detail: clip(body?.detail, 400),
      recorded_at: new Date().toISOString(),
    };
    row.hash = await chainHash(canonicalPayload(row));

    const created = await base44.asServiceRole.entities.AuditEvent.create(row);
    return Response.json({ event: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}