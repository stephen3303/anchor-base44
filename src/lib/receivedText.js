import { CLASSIFICATION_SHORT, numberedParagraphs } from '@/lib/ntp';

/**
 * The message as it arrived — plain teletype text.
 *
 * Routing header, classification, subject, references and every paragraph, in
 * the order received. No rendering, no headings and nothing removed.
 */

const up = (value) => String(value || '').toUpperCase();
const refLabel = (index) => String.fromCharCode(65 + index);
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
  lines.push(CLASSIFICATION_SHORT[message.classification] || 'UNCLAS');
  lines.push('');
  lines.push(`SUBJ/${up(message.subject)}//`);

  const refs = message.relates_to || [];
  if (refs.length) {
    lines.push('');
    refs.forEach((ref, i) => lines.push(`REF/${refLabel(i)}/MSG/${up(ref)}//`));
  }

  lines.push('');
  lines.push(numberedParagraphs((message.sections || []).map((section) => section.body)));
  lines.push('');
  lines.push('BT');
  lines.push('NNNN');

  return lines.join('\n');
};