import {
  CLASSIFICATION_SHORT,
  numberedParagraphs,
  receivedDecl,
  receivedMsgid,
  receivedPoc,
  receivedRefs,
} from '@/lib/ntp';

/**
 * The message as it arrived — plain teletype text.
 *
 * Routing header, classification with SSIC, general message title, MSGID,
 * subject, REF sets with their AMPN or NARR, POC, every paragraph and the DECL
 * set when one was recorded, in the order received. No rendering, no headings
 * and nothing removed.
 */

const up = (value) => String(value || '').toUpperCase();
const PROSIGN = { FLASH: 'Z', IMMEDIATE: 'O', PRIORITY: 'P', ROUTINE: 'R' };

const splitAddresses = (value) =>
  String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const buildReceivedText = (message) => {
  if (!message) return '';
  const lines = [];

  lines.push(`${PROSIGN[up(message.precedence)] || 'R'} ${message.dtg} ZYB`);
  lines.push(`FM ${up(message.originator)}`);

  const action = splitAddresses(message.to);
  action.forEach((entry, i) => lines.push(`${i === 0 ? 'TO  ' : '    '}${entry}`));

  const info = splitAddresses(message.info);
  info.forEach((entry, i) => lines.push(`${i === 0 ? 'INFO' : '    '} ${entry}`));

  lines.push('BT');
  lines.push(`${CLASSIFICATION_SHORT[message.classification] || 'UNCLAS'} //${up(message.ssic) || '-'}//`);
  if (message.general_message_id) lines.push('', up(message.general_message_id));
  lines.push('', receivedMsgid(message), '');
  lines.push(`SUBJ/${up(message.subject)}//`);

  const refs = receivedRefs(message.references);
  if (refs.length) lines.push('', ...refs);

  if (message.poc) lines.push('', receivedPoc(message.poc));

  lines.push('');
  lines.push(numberedParagraphs((message.sections || []).map((section) => section.body)));

  const decl = receivedDecl(message);
  if (decl) lines.push('', decl);

  lines.push('', 'BT', 'NNNN');

  return lines.join('\n');
};