import { CLASSIFICATION_SHORT, numberedParagraphs, subjectLines, wrapLines } from '@/lib/ntp';

/**
 * The complete original message text, exactly as received.
 *
 * Composed from the whole record: classification line, SUBJ set, every REF set
 * and every paragraph of the remarks, closing with BT and NNNN. Nothing is
 * abbreviated, excerpted or reordered — this is the full official text.
 */

const up = (value) => String(value || '').toUpperCase();
const refLabel = (index) => String.fromCharCode(65 + index);

export const buildOriginalMessage = (message) => {
  if (!message) return '';
  const lines = [];

  lines.push(CLASSIFICATION_SHORT[message.classification] || 'UNCLAS');
  lines.push('');
  lines.push(...subjectLines(message.subject));

  const refs = message.relates_to || [];
  if (refs.length) {
    lines.push('');
    refs.forEach((ref, i) => lines.push(wrapLines(`REF/${refLabel(i)}/MSG/${up(ref)}//`)));
  }

  const body = numberedParagraphs((message.sections || []).map((section) => section.body));
  lines.push('', wrapLines(`RMKS/${body || '1. [REMARKS]'}//`));

  lines.push('', 'BT', 'NNNN');
  return lines.join('\n');
};