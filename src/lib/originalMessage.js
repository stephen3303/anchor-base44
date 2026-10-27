import {
  CLASSIFICATION_SHORT,
  numberedParagraphs,
  receivedDecl,
  receivedMsgid,
  receivedPoc,
  receivedRefs,
  subjectLines,
  wrapLines,
} from '@/lib/ntp';

/**
 * The complete original message text, exactly as received.
 *
 * Composed from the whole record: classification with SSIC, general message
 * title, MSGID, the SUBJ set, every REF set with its AMPN or NARR, the POC set,
 * every paragraph of the remarks and the DECL set, closing with BT and NNNN.
 * Nothing is abbreviated, excerpted or reordered — this is the full official text.
 */

const up = (value) => String(value || '').toUpperCase();

export const buildOriginalMessage = (message) => {
  if (!message) return '';
  const lines = [];

  lines.push(`${CLASSIFICATION_SHORT[message.classification] || 'UNCLAS'} //${up(message.ssic) || '-'}//`);
  if (message.general_message_id) lines.push('', up(message.general_message_id));
  lines.push('', receivedMsgid(message), '');
  lines.push(...subjectLines(message.subject));

  const refs = receivedRefs(message.references);
  if (refs.length) lines.push('', ...refs);

  if (message.poc) lines.push('', receivedPoc(message.poc));

  const body = numberedParagraphs((message.sections || []).map((section) => section.body));
  lines.push('', wrapLines(`RMKS/${body || '1. [REMARKS]'}//`));

  const decl = receivedDecl(message);
  if (decl) lines.push('', decl);

  lines.push('', 'BT', 'NNNN');
  return lines.join('\n');
};