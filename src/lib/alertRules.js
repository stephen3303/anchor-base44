import moment from 'moment';

/**
 * Alert rules own mandatory delivery and the acknowledgement obligation.
 *
 * A rule matches on structured conditions (precedence, type, community,
 * originator). The rule holds the acknowledgement window; the due time is
 * resolved once, per message, from the time it was received — so there is a
 * single source of truth for the deadline and reports become a count.
 */
export const DEFAULT_ALERT_RULES = [
  {
    id: 'rule-flash',
    name: 'FLASH traffic — acknowledgement required',
    description: 'Every FLASH message to this command must be acknowledged by the watch.',
    priority: 1,
    active: true,
    ack_required: true,
    ack_window_hours: 4,
    escalate_to_role: 'Commanding Officer',
    escalate_after_hours: 1,
    match_precedence: ['FLASH'],
  },
  {
    id: 'rule-immediate',
    name: 'IMMEDIATE traffic — acknowledgement required',
    description: 'IMMEDIATE traffic carries an acknowledgement obligation on the duty watch.',
    priority: 2,
    active: true,
    ack_required: true,
    ack_window_hours: 12,
    escalate_to_role: 'Watch Officer',
    escalate_after_hours: 4,
    match_precedence: ['IMMEDIATE'],
  },
  {
    id: 'rule-safety',
    name: 'Force-wide safety advisories',
    description: 'Safety advisories are delivered without a subscription. No acknowledgement is owed.',
    priority: 3,
    active: true,
    ack_required: false,
    ack_window_hours: 0,
    match_communities: ['Safety'],
  },
  {
    id: 'rule-navadmin',
    name: 'Submarine force policy traffic',
    description: 'NAVADMIN policy traffic is delivered to the staff. No acknowledgement is owed.',
    priority: 4,
    active: true,
    ack_required: false,
    ack_window_hours: 0,
    match_types: ['NAVADMIN'],
  },
];

const matchesList = (list, value) => !list || list.length === 0 || list.includes(value);
const overlaps = (list, values) => !list || list.length === 0 || (values || []).some((v) => list.includes(v));

export const ruleMatches = (message, rule) =>
  matchesList(rule.match_precedence, message.precedence) &&
  matchesList(rule.match_types, message.type) &&
  matchesList(rule.match_originators, message.originator) &&
  overlaps(rule.match_communities, message.communities);

/** The highest-priority active rule that governs a message, if any. */
export const ruleFor = (message, rules = []) =>
  rules
    .filter((rule) => rule.active !== false && ruleMatches(message, rule))
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))[0] || null;

/** Messages that owe an acknowledgement, with the deadline resolved from the rule. */
export const resolveMandatory = (messages, rules = []) =>
  messages
    .map((message) => {
      const rule = ruleFor(message, rules);
      if (!rule || !rule.ack_required) return null;
      return {
        ...message,
        ack_required: true,
        ack_due: moment.utc(message.received).add(rule.ack_window_hours || 12, 'hours').toISOString(),
        alert_rule: rule.name,
        alert_rule_id: rule.id,
        escalate_to_role: rule.escalate_to_role || 'Watch Officer',
        escalate_after_hours: rule.escalate_after_hours ?? 4,
      };
    })
    .filter(Boolean)
    .sort((a, b) => moment.utc(a.ack_due).valueOf() - moment.utc(b.ack_due).valueOf());

/** pending · overdue · escalated — derived, never stored. */
export const escalationState = (message) => {
  if (!message?.ack_due) return 'none';
  const now = moment.utc();
  const due = moment.utc(message.ack_due);
  if (now.isBefore(due)) return 'pending';
  if (now.isAfter(due.clone().add(message.escalate_after_hours ?? 4, 'hours'))) return 'escalated';
  return 'overdue';
};