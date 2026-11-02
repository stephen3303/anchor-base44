/**
 * A template claims traffic by its content.
 *
 * Subject terms are checked against the subject line, body terms against the
 * message text; both are matched without regard to case, and a term list left
 * empty places no condition. Type, community, precedence and originator stay
 * available as secondary tags that narrow the claim, but they are not what
 * tells two classes of traffic apart — the wording does.
 *
 * Two uses follow from the same tags: a matched template can open a draft in its
 * own format, or validate the incoming message it claimed.
 */

export const USE_LABEL = {
  both: 'Draft and validate',
  draft: 'Draft only',
  validate: 'Validate only',
};

const up = (value) => String(value ?? '').trim().toUpperCase();

/** The message text a body term is matched against: every paragraph, heading included. */
export const messageBodyText = (message) =>
  (message?.sections || [])
    .map((section) => `${section?.heading || ''} ${section?.body || ''}`)
    .join(' ')
    .trim();

export const TAG_GROUPS = [
  { key: 'tag_message_types', label: 'Message type', kind: 'value', read: (message) => message?.type },
  { key: 'tag_originators', label: 'Originator', kind: 'value', read: (message) => message?.originator },
  { key: 'tag_communities', label: 'Community', kind: 'overlap', read: (message) => message?.communities },
  { key: 'tag_precedence', label: 'Precedence', kind: 'value', read: (message) => message?.precedence },
  { key: 'tag_subject_keywords', label: 'Subject term', kind: 'keyword', read: (message) => message?.subject },
  { key: 'tag_body_keywords', label: 'Body term', kind: 'keyword', read: (message) => messageBodyText(message) },
];

const KEYWORD_GROUPS = TAG_GROUPS.filter((group) => group.kind === 'keyword');

export const tagValues = (template, key) =>
  (template?.[key] || []).map((value) => String(value).trim()).filter(Boolean);

/** Content terms — subject and body — are what actually identify a template. */
export const taggedTermGroups = (template) => KEYWORD_GROUPS.filter((group) => tagValues(template, group.key).length);

export const populatedTagGroups = (template) => TAG_GROUPS.filter((group) => tagValues(template, group.key).length > 0);

/** A group left untagged places no condition on the traffic. */
export const tagGroupMatches = (group, template, message) => {
  const wanted = tagValues(template, group.key).map(up);
  if (!wanted.length) return true;
  if (group.kind === 'keyword') {
    const text = up(group.read(message));
    return wanted.some((term) => text.includes(term));
  }
  if (group.kind === 'overlap') {
    const held = (message?.communities || []).map(up);
    return wanted.some((value) => held.includes(value));
  }
  return wanted.includes(up(group.read(message)));
};

/** Every tagged group must hold. An untagged template claims nothing. */
export const templateMatches = (template, message) => {
  const groups = populatedTagGroups(template);
  if (!groups.length || !message) return false;
  return groups.every((group) => tagGroupMatches(group, template, message));
};

const termCount = (template) =>
  KEYWORD_GROUPS.reduce((sum, group) => sum + tagValues(template, group.key).length, 0);

const specificity = (template) => populatedTagGroups(template).length * 100 + termCount(template);

const matchedGroupCount = (template, message) =>
  populatedTagGroups(template).filter((group) => tagGroupMatches(group, template, message)).length;

export const templateUse = (template) => template?.trigger_use || 'both';

const usable = (templates, use) =>
  (templates || [])
    .filter((template) => template.active !== false && populatedTagGroups(template).length > 0)
    .filter((template) => !use || templateUse(template) === 'both' || templateUse(template) === use);

/** Templates that fully claim the message, most specific first. */
export const templatesFor = (message, templates = [], use) =>
  usable(templates, use)
    .filter((template) => templateMatches(template, message))
    .sort((a, b) => specificity(b) - specificity(a) || String(a.name).localeCompare(String(b.name)));

export const templateFor = (message, templates = [], use) => templatesFor(message, templates, use)[0] || null;

/**
 * The template a message most likely belongs to, for validation. A subject or
 * body term is a direct claim, so at least one tagged term must be found in the
 * message; otherwise the closest template is taken and the failing tags are
 * reported as non-conformance.
 */
export const templateCandidate = (message, templates = [], use) => {
  if (!message) return null;
  const claims = usable(templates, use).filter((template) => {
    const groups = taggedTermGroups(template);
    if (groups.length) {
      return groups.some((group) => tagGroupMatches(group, template, message));
    }
    return matchedGroupCount(template, message) > 0;
  });

  return (
    claims.sort(
      (a, b) =>
        matchedGroupCount(b, message) - matchedGroupCount(a, message) ||
        specificity(b) - specificity(a) ||
        String(a.name).localeCompare(String(b.name)),
    )[0] || null
  );
};

/** The tag groups that identified the message, for display. */
export const matchReasons = (template, message) =>
  populatedTagGroups(template).map((group) => {
    const wanted = tagValues(template, group.key);
    let hit;
    if (group.kind === 'keyword') {
      const text = up(group.read(message));
      hit = wanted.filter((term) => text.includes(up(term)));
    } else if (group.kind === 'overlap') {
      hit = wanted.filter((value) => (message?.communities || []).map(up).includes(up(value)));
    } else {
      hit = [group.read(message)];
    }
    return { key: group.key, label: group.label, detail: hit.filter(Boolean).join(', ') || 'no match' };
  });

/**
 * Does the incoming message satisfy the template that claimed it? Each tagged
 * group is checked, then the setlines, the addressees, any required references
 * and the paragraph structure.
 */
export const validateAgainstTemplate = (message, template) => {
  if (!message || !template) return { template: null, checks: [], failures: 0, conforms: false };

  const checks = populatedTagGroups(template).map((group) => ({
    key: group.key,
    label: group.label,
    pass: tagGroupMatches(group, template, message),
    detail:
      group.kind === 'keyword'
        ? tagValues(template, group.key).join(', ')
        : group.kind === 'overlap'
          ? (message.communities || []).join(', ') || 'none set'
          : String(group.read(message) || 'not set'),
  }));

  checks.push({
    key: 'setlines',
    label: 'Setlines',
    pass: Boolean(message.subject && message.type && message.originator && message.precedence),
    detail: [message.type, message.precedence].filter(Boolean).join(' · ') || 'incomplete',
  });

  checks.push({
    key: 'action',
    label: 'Action addressees',
    pass: Boolean(String(message.to || '').trim()),
    detail: message.to || 'none set',
  });

  if (template.include_references) {
    checks.push({
      key: 'references',
      label: 'References',
      pass: (message.relates_to || []).length > 0,
      detail: (message.relates_to || []).join(', ') || 'none cited',
    });
  }

  const paragraphs = (message.sections || []).length;
  checks.push({
    key: 'paragraphs',
    label: 'Paragraph structure',
    pass: paragraphs > 0,
    detail: `${paragraphs} paragraph${paragraphs === 1 ? '' : 's'}`,
  });

  const failures = checks.filter((check) => !check.pass).length;
  return { template, checks, failures, conforms: failures === 0 };
};

/** A draft opened from a template, optionally against the message that matched it. */
export const templateDraft = (template, message) => ({
  subject: template?.default_subject || message?.subject || '',
  message_type: template?.message_type || 'COMSUBLANT MSG',
  action_addressees: template?.default_action_addressees?.length
    ? template.default_action_addressees
    : message?.originator
      ? [message.originator]
      : [],
  paragraphs: [...(template?.default_paragraphs || [''])],
  template_id: template?.id,
  template_name: template?.name,
  template_class: template?.template_class,
});