import { escalationState, resolveMandatory } from './alertRules';

/**
 * Acknowledgement accountability.
 *
 * "Acknowledged" and "merely read" are counted separately, because reading a
 * message is not acknowledging it. The expected roster is the command's users
 * for an administrator; for everyone else it is the signed-in user, and the
 * screen says so rather than implying a command-wide count.
 */
export const accountabilityFor = ({
  messages = [],
  rules = [],
  acknowledgements = [],
  readStates = [],
  users = [],
  selfEmail = '',
  selfName = '',
}) => {
  const roster = users.length
    ? users.map((u) => ({ email: u.email, name: u.full_name || u.email }))
    : selfEmail
      ? [{ email: selfEmail, name: selfName || selfEmail }]
      : [];

  return resolveMandatory(messages, rules).map((message) => {
    const acks = acknowledgements.filter((a) => a.message_id === message.id);
    const ackedEmails = new Set(acks.map((a) => a.created_by));
    const readEmails = new Set(
      readStates.filter((s) => s.message_id === message.id && s.read_at).map((s) => s.created_by),
    );

    const rows = roster.map((person) => ({
      ...person,
      acknowledged: ackedEmails.has(person.email),
      read: readEmails.has(person.email),
      acknowledgedAt: acks.find((a) => a.created_by === person.email)?.acknowledged_at || null,
      late: acks.find((a) => a.created_by === person.email)?.ack_status === 'late',
    }));

    return {
      message,
      state: escalationState(message),
      roster: rows,
      expectedCount: rows.length,
      acknowledgedCount: rows.filter((r) => r.acknowledged).length,
      readOnlyCount: rows.filter((r) => r.read && !r.acknowledged).length,
      notOpenedCount: rows.filter((r) => !r.read && !r.acknowledged).length,
      missing: rows.filter((r) => !r.acknowledged),
      lastAcknowledgedAt: acks.length
        ? acks.map((a) => a.acknowledged_at).sort().slice(-1)[0]
        : null,
    };
  });
};