import moment from 'moment';

/**
 * Acknowledgement records.
 *
 * An acknowledgement is an audited fact, not UI state: one append-only row per
 * acknowledgement, holding the Zulu time it was given and whether it met the
 * deadline it was measured against. Reading or starring a message is not an
 * acknowledgement, and a row is never edited — the command corrects one, a user
 * cannot withdraw it.
 */

/** The row a confirmation writes. */
export const acknowledgementPayload = ({ message, user, at }) => {
  const acknowledged_at = at || moment.utc().toISOString();
  const due = message?.ack_due || '';
  return {
    message_id: message.id,
    message_reference: message.reference || '',
    message_subject: message.subject || '',
    precedence: message.precedence || '',
    due_at: due,
    acknowledged_at,
    ack_status: due && moment.utc(acknowledged_at).isAfter(moment.utc(due)) ? 'late' : 'on_time',
    user_name: user?.full_name || user?.email || '',
  };
};