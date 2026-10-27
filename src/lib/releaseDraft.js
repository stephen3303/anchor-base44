import { base44 } from '@/api/base44Client';
import { buildBodyText, dtgNow, renderMessage } from './ntp';
import { nextAssignment } from './commandSettings';

/**
 * Release a draft: the one place a release happens.
 *
 * The DTG, the MSGID serial and the local message control sequence are assigned
 * here, in release order, and never on a draft. The transmitted text is frozen and
 * an append-only RoutingEvent records who released it and as what.
 *
 * Used by the drafting desk when the circuit is up, and by the transmission queue
 * when a release is held for the circuit and replayed on restore.
 */
export const releaseDraft = async ({ draft, authority, actor, settings, now = new Date().toISOString() }) => {
  const step = (draft.routing_steps || []).find((s) => s.status === 'current') || null;
  const steps = (draft.routing_steps || []).map((s) =>
    s.order === step?.order ? { ...s, status: 'released', acted_at: now } : s,
  );

  const actorName = actor?.full_name || actor?.email || '';
  const designation = authority?.designation || 'release authority';

  const assignment = nextAssignment(settings);
  const dtg = dtgNow(now);

  const released = {
    ...draft,
    dtg,
    msn: assignment.msn,
    local_sequence: assignment.local_sequence,
    released_by_name: actorName,
    release_authority_designation: designation,
  };
  const rendered = renderMessage(released, settings);

  if (settings?.id) {
    await base44.entities.CommandSetting.update(settings.id, {
      next_sequence: assignment.next_sequence,
      updated_by_name: actorName,
    });
  }

  const fields = {
    routing_steps: steps,
    draft_status: 'released',
    dtg,
    msn: assignment.msn,
    local_sequence: assignment.local_sequence,
    rendered_text: rendered,
    released_at: now,
    released_by_email: actor?.email || '',
    released_by_name: actorName,
    release_authority_designation: designation,
    release_authority_personnel_id: authority?.personnel_id || '',
    assigned_to_email: '',
    assigned_to_name: '',
    assigned_duty: '',
    body_text: buildBodyText(released),
  };

  await base44.entities.DraftMessage.update(draft.id, fields);

  await base44.entities.RoutingEvent.create({
    draft_id: draft.id,
    draft_subject: draft.subject,
    draft_reference: draft.message_type || 'DRAFT',
    routed_to_emails: draft.routed_to_emails || [],
    actor_email: actor?.email || '',
    actor_name: actorName,
    event_type: 'released',
    from_status: 'in_routing',
    to_status: 'released',
    step_order: step?.order ?? null,
    step_title: step?.title || '',
    comment: `Released as ${designation} · ${assignment.local_sequence} · ${dtg}. The transmitted text is frozen.`,
    visible_to_all: true,
  });

  return { draft: { ...draft, ...fields }, assignment, dtg, rendered };
};