/**
 * Starting points for a new draft: the baseline record every draft begins from,
 * a derivation from an existing message, and a reply to one.
 *
 * A corrected copy, update or cancellation is issued only by the command that
 * originated the message — no command releases changes to another command's
 * traffic — so only this command's own messages are eligible for those three.
 * Any message may be answered.
 */
import { EFFECT_ON_SOURCE } from '@/lib/drafting';
import { compactDtg } from '@/lib/ntp';

/** The command that owns this ANCHOR instance. */
export const COMMAND_ORIGINATOR = 'COMSUBLANT NORFOLK VA';

export const BASE_DRAFT = {
  draft_status: 'drafting',
  precedence: 'ROUTINE',
  classification: 'UNCLASSIFIED',
  traffic_class: 'ADMIN',
  message_type: 'COMSUBLANT MSG',
  originator: COMMAND_ORIGINATOR,
  action_addressees: [],
  info_addressees: [],
  subject: '',
  references: [],
  paragraphs: [''],
  derivation_type: 'original',
  effect_on_source: 'none',
  version: 1,
  current_step: 0,
  routed_to_emails: [],
};

export const isOwnMessage = (message) => message?.originator === COMMAND_ORIGINATOR;

export const splitAddressees = (value) =>
  (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

/** Reference value per NTP 3(J) Annex A: originator / date-time group. */
export const referenceValue = (message) => `${message.originator}/${compactDtg(message.dtg)}`;

/** REF A, linked to the message being answered, amended or cancelled. */
export const sourceReference = (message) => ({
  ref_label: 'A',
  kind: 'MSG',
  value: referenceValue(message),
  message_id: message.id,
  title: message.subject,
  amplifying: `${message.reference}, ${message.subject}`,
});

const DERIVATION_OPENING = {
  corrected_copy:
    'This corrected copy replaces the original in its entirety. The error in the original is corrected as follows: ',
  update:
    'This message amends the original. Paragraphs changed are listed below; all other direction in the original remains in effect.',
  cancellation: 'CANCEL REF A.',
};

const DERIVATION_SUBJECT = {
  corrected_copy: (message) => message.subject,
  update: (message) => `${message.subject} — UPDATE`,
  // NTP 3(J) ¶403b: a cancellation carries the subject of the message it cancels.
  cancellation: (message) => message.subject,
};

/** A corrected copy, update or cancellation of a message this command originated. */
export const derivationDraft = (message, type) => ({
  subject: DERIVATION_SUBJECT[type](message),
  message_type: message.type,
  precedence: message.precedence,
  classification: message.classification,
  originator: message.originator,
  // ¶403b: every addressee of a cancelled message becomes an action addressee.
  action_addressees:
    type === 'cancellation'
      ? [...splitAddressees(message.to), ...splitAddressees(message.info)]
      : splitAddressees(message.to),
  info_addressees: type === 'cancellation' ? [] : splitAddressees(message.info),
  references: [sourceReference(message)],
  paragraphs: type === 'cancellation' ? [DERIVATION_OPENING[type]] : [DERIVATION_OPENING[type], ''],
  derivation_type: type,
  effect_on_source: EFFECT_ON_SOURCE[type] || 'none',
  derived_from_message_id: message.id,
  derived_from_reference: message.reference,
});

/**
 * A reply. It goes back to the originator, keeps the subject line, and carries
 * the message being answered as REF A. A reply is an original — it changes
 * nothing on the record it cites.
 */
export const responseDraft = (message) => ({
  subject: message.subject,
  message_type: message.type,
  precedence: message.precedence,
  classification: message.classification,
  originator: BASE_DRAFT.originator,
  action_addressees: splitAddressees(message.originator),
  info_addressees: [...splitAddressees(message.to), ...splitAddressees(message.info)],
  references: [sourceReference(message)],
  paragraphs: [''],
  derivation_type: 'original',
  effect_on_source: 'none',
});