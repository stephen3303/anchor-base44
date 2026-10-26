import { ruleFor } from './alertRules';
import { activeFeedsFor } from './subscriptions';

/**
 * "Why am I seeing this?" — answered from the rules and feeds that are in force,
 * so a user can always account for the traffic in front of them.
 */
export const deliveryReasons = (message, { rules = [], subscriptions = [] } = {}) => {
  const reasons = [];
  const rule = ruleFor(message, rules);

  if (rule) {
    reasons.push({
      kind: 'rule',
      label: rule.name,
      mandatory: true,
      note: rule.ack_required
        ? `Mandatory delivery — acknowledgement owed within ${rule.ack_window_hours}h. Cannot be muted.`
        : 'Mandatory delivery — cannot be muted.',
    });
  }

  activeFeedsFor(subscriptions, message).forEach((feed) => {
    reasons.push({
      kind: 'subscription',
      label: feed.name,
      mandatory: Boolean(feed.mandatory),
      note: feed.mandatory ? 'Command baseline feed — cannot be paused.' : 'You requested this feed.',
    });
  });

  if (reasons.length === 0) {
    reasons.push({
      kind: 'manual',
      label: 'Command traffic set',
      mandatory: false,
      note: 'Held in the command traffic set; no alert rule or subscription matched.',
    });
  }

  return reasons;
};