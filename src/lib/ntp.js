import moment from 'moment';

/**
 * NTP-style message formatting.
 *
 * Reproduces the shape of a naval message: precedence prosign and DTG, FM/TO/INFO
 * setlines, BT separators, classification line, SUBJ, REF/AMPN setlines, numbered
 * RMKS paragraphs wrapped at the standard line length, and the NNNN terminator.
 * Everything here is derived from the draft record — nothing is inferred from a
 * live circuit, and the rendered text is frozen onto the record at release.
 */

export const PRECEDENCE_PROSIGN = { FLASH: 'Z', IMMEDIATE: 'O', PRIORITY: 'P', ROUTINE: 'R' };
export const CLASSIFICATION_SHORT = { UNCLASSIFIED: 'UNCLAS', CONFIDENTIAL: 'CONFID', SECRET: 'SECRET' };
export const LINE_LIMIT = 69;

export const dtgNow = (value) => {
  const t = value ? moment.utc(value) : moment.utc();
  return `${t.format('DDHHmm')}Z ${t.format('MMM').toUpperCase()} ${t.format('YY')}`;
};

export const refLabel = (index) => String.fromCharCode(65 + index);

/** Wraps long prose at the standard line length, preserving deliberate breaks. */
export const wrapLines = (text, limit = LINE_LIMIT) =>
  String(text || '')
    .split('\n')
    .map((line) => {
      if (line.length <= limit) return line;
      const out = [];
      let current = '';
      line.split(' ').forEach((word) => {
        if (!current) {
          current = word;
        } else if (`${current} ${word}`.length <= limit) {
          current = `${current} ${word}`;
        } else {
          out.push(current);
          current = word;
        }
      });
      if (current) out.push(current);
      return out.join('\n');
    })
    .join('\n');

export const numberedParagraphs = (paragraphs) =>
  (paragraphs || [])
    .map((p) => String(p || '').trim())
    .filter((p) => p.length > 0)
    .map((p, i) => `${i + 1}. ${wrapLines(p).replace(/\n/g, '\n   ')}`)
    .join('\n\n');

export const renderMessage = (draft) => {
  const prosign = PRECEDENCE_PROSIGN[draft.precedence] || 'R';
  const lines = [];
  lines.push(`${prosign} ${draft.dtg || dtgNow()}`);
  lines.push(`FM ${draft.originator || '[originator]'}`);
  lines.push(`TO ${(draft.action_addressees || []).join(', ') || '[action addressees]'}`);
  if ((draft.info_addressees || []).length) {
    lines.push(`INFO ${draft.info_addressees.join(', ')}`);
  }
  lines.push('BT');
  lines.push(`${CLASSIFICATION_SHORT[draft.classification] || 'UNCLAS'} //N03100//`);
  lines.push(`SUBJ: ${draft.subject || '[subject]'}`);
  (draft.references || []).forEach((r) => {
    lines.push(`REF/${r.ref_label}/MSG/${r.value || '[reference]'}//`);
  });
  (draft.references || [])
    .filter((r) => String(r.amplifying || '').trim())
    .forEach((r) => {
      lines.push(`AMPN/REF ${r.ref_label} IS ${String(r.amplifying).trim()}//`);
    });
  lines.push('RMKS/');
  lines.push(numberedParagraphs(draft.paragraphs));
  lines.push('BT');
  lines.push('NNNN');
  return lines.join('\n');
};

/** Flattened official text used for keyword search — never the AI summary. */
export const buildBodyText = (draft) =>
  [
    draft.subject,
    draft.originator,
    (draft.action_addressees || []).join(' '),
    (draft.info_addressees || []).join(' '),
    (draft.references || []).map((r) => `${r.ref_label} ${r.value} ${r.title || ''}`).join(' '),
    (draft.paragraphs || []).join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();