/**
 * Draft lifecycle, routing selection and route construction.
 *
 * Routing is admin-defined: a workflow matches on message type and originator,
 * the most specific match wins, and the chain always ends at a release authority.
 * Every transition writes an append-only RoutingEvent.
 *
 * A route step and a release designation are held by a person on the command roster:
 * the name and position on the chain are resolved from that record each time it is
 * read, and a person detached from the command shows as such instead of quietly
 * still holding a step.
 */

import { findPerson, resolveHolder, shortName } from '@/lib/personnel';

export const DRAFT_STATUS = {
  drafting: {
    label: 'Drafting',
    hint: 'Not yet submitted — editable by the drafter only.',
    className: 'border-line bg-secondary text-mutedink',
  },
  submitted: {
    label: 'Submitted',
    hint: 'Entered the routing chain.',
    className: 'border-navy-600/40 bg-navy-600/10 text-navy-600',
  },
  in_routing: {
    label: 'In routing',
    hint: 'Held by a reviewer — the drafter cannot change the text.',
    className: 'border-gold/60 bg-gold/15 text-navy-800',
  },
  returned: {
    label: 'Returned',
    hint: 'Kicked back for correction with a reviewer comment.',
    className: 'border-precedence-immediate/40 bg-precedence-immediate/10 text-precedence-immediate',
  },
  released: {
    label: 'Released',
    hint: 'Released by the release authority — the record is frozen.',
    className: 'border-lifecycle-active/40 bg-lifecycle-active/10 text-lifecycle-active',
  },
  withdrawn: {
    label: 'Withdrawn',
    hint: 'Withdrawn before release and retained for the record.',
    className: 'border-line bg-secondary text-mutedink',
  },
};

export const STEP_STATUS = {
  pending: { label: 'Pending', className: 'text-mutedink' },
  current: { label: 'Awaiting action', className: 'text-navy-600 font-semibold' },
  endorsed: { label: 'Endorsed', className: 'text-lifecycle-active font-semibold' },
  returned: { label: 'Returned', className: 'text-precedence-immediate font-semibold' },
  released: { label: 'Released', className: 'text-lifecycle-active font-semibold' },
};

export const DERIVATION_LABEL = {
  original: 'Original',
  corrected_copy: 'Corrected copy',
  update: 'Update',
  final: 'Final',
  cancellation: 'Cancellation',
};

/** Lifecycle effect a derived message has on the message it references. */
export const EFFECT_ON_SOURCE = {
  corrected_copy: 'supersede',
  update: 'amend',
  cancellation: 'cancel',
};

export const EFFECT_LABEL = {
  amend: 'AMENDED',
  supersede: 'SUPERSEDED',
  cancel: 'CANCELLED',
};

export const stepActionLabel = (action) => (action === 'release' ? 'Release authority' : 'Review and endorse');

const specificity = (workflow, messageType, originator) => {
  let score = 0;
  const types = workflow.match_message_types || [];
  const originators = workflow.match_originators || [];
  if (types.length) {
    if (!types.includes(messageType)) return -1;
    score += 2;
  }
  if (originators.length) {
    if (!originators.includes(originator)) return -1;
    score += 1;
  }
  return score;
};

/** Most specific active workflow matching this message type and originator. */
export const selectWorkflow = (workflows, { message_type, originator }) =>
  (workflows || [])
    .filter((w) => w.active !== false)
    .map((w) => ({ workflow: w, score: specificity(w, message_type, originator) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score)[0]?.workflow || null;

/**
 * Materialise the workflow into the step-by-step route carried on the draft.
 *
 * Each step carries the roster person who holds it, and their name and position are
 * taken from that record at the moment the route is built — so the chain the draft
 * follows names the people the command actually has.
 */
export const buildRoute = (workflow, personnel) =>
  [...(workflow?.steps || [])]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((step, index) => {
      const person = findPerson(personnel, { personnel_id: step.personnel_id, email: step.assignee_email });
      return {
        order: index + 1,
        title: step.title || `Step ${index + 1}`,
        duty: person ? person.position || '' : step.duty || '',
        personnel_id: person?.id || step.personnel_id || '',
        assignee_email: (person ? person.email : step.assignee_email) || '',
        assignee_name: person ? shortName(person) : step.assignee_name || '',
        action: step.action === 'release' ? 'release' : 'review',
        status: index === 0 ? 'current' : 'pending',
        acted_at: '',
        comment: '',
      };
    });

export const routeEmails = (route) =>
  [...new Set((route || []).map((s) => s.assignee_email).filter(Boolean))];

/**
 * The message templates a designation covers. An empty scope means every template;
 * records written before scoping existed carry the same intent under the older key.
 */
const scopeOf = (authority) => authority?.scope_message_templates || authority?.scope_message_types || [];

export const authorityCoversDraft = (authority, draft) => {
  const scope = scopeOf(authority);
  if (!scope.length) return true;
  return [draft?.template_id, draft?.template_name].filter(Boolean).some((value) => scope.includes(value));
};

export const releaseAuthorityFor = (authorities, email, draft) =>
  (authorities || []).find(
    (a) => a.active !== false && a.user_email === email && (!draft || authorityCoversDraft(a, draft)),
  ) || null;

export const isReleaseAuthority = (authorities, email, draft) =>
  Boolean(releaseAuthorityFor(authorities, email, draft));

/**
 * Whether this user may release this draft: a live designation covering the draft's
 * template, held by a person who is still with the command.
 */
export const releaseGate = (authorities, user, draft, personnel) => {
  const authority = releaseAuthorityFor(authorities, user?.email, draft);
  if (!authority) {
    return {
      ok: false,
      authority: null,
      reason:
        'Only the commanding officer, or a release authority designated for this message template, may release it.',
    };
  }
  const holder = resolveHolder(authority, personnel);
  if (holder.state === 'detached') {
    return {
      ok: false,
      authority,
      reason: `Release authority is held by ${authority.designation}. That person is detached from the command — designate the relief before releasing.`,
    };
  }
  return { ok: true, authority, reason: '' };
};

export const currentRouteStep = (draft) =>
  (draft?.routing_steps || []).find((s) => s.status === 'current') || null;

export const draftReferenceLine = (draft) =>
  `${draft?.message_type || 'DRAFT'} ${draft?.subject || 'Untitled'}`;

/** The draft is editable only while it has not entered routing, or after a kick-back. */
export const isEditable = (draft) =>
  !draft || draft.draft_status === 'drafting' || draft.draft_status === 'returned';

const SCALAR_FIELDS = [
  'precedence',
  'classification',
  'traffic_class',
  'message_type',
  'ssic',
  'general_message_id',
  'poc_name',
  'poc_rank',
  'poc_location',
  'poc_phone',
  'decl',
  'originator',
  'subject',
  'derivation_type',
  'effect_on_source',
  'template_id',
  'template_name',
  'template_class',
  'version',
];

const LIST_FIELDS = ['action_addressees', 'info_addressees', 'references', 'paragraphs'];

/**
 * The fields the drafter owns, shaped as the record stores them. The workspace writes
 * these to the draft as it is edited, so no part of a draft lives only in the page.
 */
export const editableFields = (draft) => {
  const fields = SCALAR_FIELDS.reduce((acc, key) => ({ ...acc, [key]: draft?.[key] ?? null }), {});
  LIST_FIELDS.forEach((key) => {
    fields[key] = draft?.[key] || [];
  });
  return fields;
};