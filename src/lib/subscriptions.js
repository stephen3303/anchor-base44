/**
 * Subscriptions are user-requested topic feeds. Mandatory delivery is *not* a
 * subscription — that belongs to the alert rules — so nothing here can require an
 * acknowledgement, and a command baseline feed cannot be paused.
 */
export const FREQUENCY_LABEL = { real_time: 'Real-time', daily: 'Daily digest', weekly: 'Weekly' };
export const STATUS_LABEL = { active: 'Active', pending: 'Pending approval', denied: 'Denied', paused: 'Paused' };

export const CHANNEL_LABEL = { in_app: 'In-app', email: 'Email' };

export const CATEGORIES = [
  'Readiness',
  'Submarine Warfare',
  'Cybersecurity',
  'Safety',
  'Personnel',
  'Training & Education',
  'Maintenance',
  'Policy',
];

const overlaps = (list, values) => !list || list.length === 0 || (values || []).some((v) => list.includes(v));

export const subscriptionMatches = (subscription, message) =>
  overlaps(subscription.criteria_types, [message.type]) &&
  overlaps(subscription.criteria_communities, message.communities) &&
  overlaps(subscription.criteria_precedence, [message.precedence]) &&
  (!subscription.criteria_originators?.length || subscription.criteria_originators.includes(message.originator));

/** Feeds that would have delivered this message to the signed-in user. */
export const activeFeedsFor = (subscriptions, message) =>
  subscriptions.filter((s) => s.status === 'active' && subscriptionMatches(s, message));

export const canPause = (subscription) => !subscription.mandatory;

export const criteriaLabel = (subscription) => {
  const parts = [];
  if (subscription.criteria_communities?.length) parts.push(subscription.criteria_communities.join(', '));
  if (subscription.criteria_types?.length) parts.push(subscription.criteria_types.join(', '));
  if (subscription.criteria_precedence?.length) parts.push(subscription.criteria_precedence.join(', '));
  return parts.length ? parts.join(' · ') : 'All traffic';
};