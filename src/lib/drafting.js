/**
 * Draft lifecycle, routing selection and route construction.
 *
 * Routing is admin-defined: a workflow matches on message type and originator,
 * the most specific match wins, and the chain always ends at a release authority.
 * Every transition writes an append-only RoutingEvent.
 */

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

/** Materialise the workflow into the step-by-step route carried on the draft. */
export const buildRoute = (workflow) =>
  [...(workflow?.steps || [])]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((step, index) => ({
      order: index + 1,
      title: step.title || `Step ${index + 1}`,
      duty: step.duty || '',
      assignee_email: step.assignee_email || '',
      assignee_name: step.assignee_name || '',
      action: step.action === 'release' ? 'release' : 'review',
      status: index === 0 ? 'current' : 'pending',
      acted_at: '',
      comment: '',
    }));

export const routeEmails = (route) =>
  [...new Set((route || []).map((s) => s.assignee_email).filter(Boolean))];

export const isReleaseAuthority = (authorities, email) =>
  (authorities || []).some((a) => a.active !== false && a.user_email === email);

export const releaseAuthorityFor = (authorities, email) =>
  (authorities || []).find((a) => a.active !== false && a.user_email === email) || null;

export const currentRouteStep = (draft) =>
  (draft?.routing_steps || []).find((s) => s.status === 'current') || null;

export const draftReferenceLine = (draft) =>
  `${draft?.message_type || 'DRAFT'} ${draft?.subject || 'Untitled'}`;

/** The draft is editable only while it has not entered routing, or after a kick-back. */
export const isEditable = (draft) =>
  !draft || draft.draft_status === 'drafting' || draft.draft_status === 'returned';