import moment from 'moment';
import { nullSequence, withDefaults } from '@/lib/commandSettings';

/**
 * Message formatting per NTP 3(J), Telecommunications Users Manual.
 *
 * Output follows the USMTF GENADMIN sequence (Annex A, Figure A-2):
 *   DTG line, FM / TO / INFO, BT, classification + SSIC, [general message title],
 *   MSGID, SUBJ, REF, AMPN or NARR, POC, RMKS, DECL, BT, #serial, NNNN.
 * Every line is at most 69 characters, every set ends with "//", and addressee
 * lines respect the 55 character PLA limit with office-code continuation lines
 * indented five spaces.
 *
 * Prose follows the command's configured text case (capitals by default); the DTG,
 * the MSGID serial and the local control sequence are assigned at release, so an
 * unreleased draft renders the "-" null placeholder in their place. The rendered
 * text is frozen at release.
 */

/** The null placeholder for a field the command has not assigned (¶504, Annex A). */
const NULL_FIELD = '-';

export const PRECEDENCE_PROSIGN = { FLASH: 'Z', IMMEDIATE: 'O', PRIORITY: 'P', ROUTINE: 'R' };
/** Classified markings are spelled with a space after each character (¶702a). */
export const CLASSIFICATION_SHORT = {
  UNCLASSIFIED: 'UNCLAS',
  CONFIDENTIAL: 'C O N F I D E N T I A L',
  SECRET: 'S E C R E T',
};
export const LINE_LIMIT = 69;
export const ADDRESS_LIMIT = 55;
export const SUBJECT_FIRST_LIMIT = 64;
export const SUBJECT_NEXT_LIMIT = 68;

export const REF_KINDS = ['MSG', 'DOC', 'LTR', 'TEL', 'CON', 'GENADMIN'];
/** Reference types that must be explained in an AMPN or NARR set (Annex A, A102l). */
export const AMPLIFIED_KINDS = ['MSG', 'DOC', 'LTR', 'TEL', 'CON'];

const up = (value) => String(value || '').toUpperCase();

export const normalizeKind = (kind) => {
  const k = up(kind);
  return REF_KINDS.includes(k) ? k : 'MSG';
};

/** "CNO WASHINGTON DC//N6/N61//" -> { pla: "CNO WASHINGTON DC", codes: "N6/N61" } */
export const splitOfficeCodes = (entry) => {
  const text = up(entry).trim();
  const i = text.indexOf('//');
  if (i < 0) return { pla: text, codes: null };
  return { pla: text.slice(0, i).trim(), codes: text.slice(i + 2).replace(/\/\/\s*$/, '') };
};

/** "101358Z JUN 26" -> "101358ZJUN26" for REF sets. */
export const compactDtg = (dtg) => {
  const m = String(dtg || '').match(/(\d{6})Z\s*([A-Za-z]{3})\s*(\d{2})/);
  return m ? `${m[1]}Z${m[2].toUpperCase()}${m[3]}` : String(dtg || '');
};

/** DDHHMMZ MON YY. 0000Z is never used; 0001Z stands in (¶504). */
export const dtgNow = (value) => {
  const t = value ? moment.utc(value) : moment.utc();
  const hm = t.format('HHmm') === '0000' ? '0001' : t.format('HHmm');
  return `${t.format('DD')}${hm}Z ${t.format('MMM').toUpperCase()} ${t.format('YY')}`;
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

/** One addressee as heading lines: long entries continue on office-code boundaries, indented five spaces. */
export const addresseeLines = (entry) => {
  let rest = up(entry).trim();
  const out = [];
  while (rest.length > ADDRESS_LIMIT) {
    const cut = rest.slice(0, ADDRESS_LIMIT).lastIndexOf('/');
    if (cut <= 0) break;
    out.push(rest.slice(0, cut + 1));
    rest = rest.slice(cut + 1);
  }
  out.push(rest);
  return out.map((line, i) => (i ? `     ${line}` : line));
};

const addressBlock = (prosign, list) =>
  list.flatMap((entry, i) => {
    const lines = addresseeLines(entry);
    return i === 0 ? [`${prosign} ${lines[0]}`, ...lines.slice(1)] : lines;
  });

/** SUBJ set; a long subject continues on a second line that starts with a field marker. */
export const subjectLines = (subject, transform = up) => {
  const s = transform(subject).trim() || '[SUBJECT]';
  if (s.length <= SUBJECT_FIRST_LIMIT) return [`SUBJ/${s}//`];
  let cut = s.lastIndexOf(' ', SUBJECT_FIRST_LIMIT);
  if (cut <= 0) cut = SUBJECT_FIRST_LIMIT;
  return [`SUBJ/${s.slice(0, cut).trim()}`, `/${s.slice(cut).trim()}//`];
};

const cleanAmplification = (ref, transform = up) =>
  transform(ref.amplifying)
    .replace(/^\s*REF\s+[A-Z]\s+IS\s+/, '')
    .replace(/[.\s]+$/, '')
    .trim();

/** MSGID set of a received record: MSGID/GENADMIN/<PLA>/<MSN>/<MON YY>// */
export const receivedMsgid = (message) => {
  const pla = splitOfficeCodes(message.originator).pla || '-';
  const month = (String(message.dtg || '').match(/Z\s*([A-Z]{3})\s*(\d{2})/) || []).slice(1).join(' ') || '-';
  return `MSGID/GENADMIN/${pla}/${up(message.msn) || '-'}/${month}//`;
};

/** POC set: POC/<NAME>/<RANK>/<LOCATION>/-/TEL: <PHONE>// */
export const receivedPoc = (poc) =>
  `POC/${up(poc.name) || '-'}/${up(poc.rank) || '-'}/${up(poc.location) || '-'}/-/TEL: ${up(poc.phone) || '-'}//`;

/** The POC on one line for the record metadata block. */
export const pocSummary = (poc) => (poc ? `${poc.rank} ${poc.name}, ${poc.location} · ${poc.phone}` : '');

/** DECL set; a record carries it when the command recorded a declaration. */
export const receivedDecl = (message) => (message.decl ? `DECL/${up(message.decl)}//` : null);

/** REF sets in order, with the AMPN or NARR line that explains them (Annex A, A102l). */
export const receivedRefs = (references) => {
  const refs = references || [];
  const lines = refs.map((r, i) => wrapLines(`REF/${refLabel(i)}/${normalizeKind(r.kind)}/${up(r.value)}//`));
  const explained = refs.map((r, i) => ({ r, i })).filter(({ r }) => cleanAmplification(r));
  if (refs.length === 1 && explained.length) {
    lines.push(wrapLines(`AMPN/REF A IS ${cleanAmplification(refs[0])}.//`));
  } else if (refs.length > 1 && explained.length) {
    const narr = explained.map(({ r, i }) => `REF ${refLabel(i)} IS ${cleanAmplification(r)}.`).join(' ');
    lines.push(wrapLines(`NARR/${narr}//`));
  }
  return lines;
};

export const numberedParagraphs = (paragraphs) =>
  (paragraphs || [])
    .map((p) => String(p || '').trim())
    .filter((p) => p.length > 0)
    .map((p, i) => `${i + 1}. ${wrapLines(up(p))}`)
    .join('\n\n');

export const renderMessage = (draft, setting) => {
  const settings = withDefaults(setting);
  /** Prose follows the command text case; addresses, SSIC and codes stay capitals. */
  const t = (value) => (settings.text_case === 'mixed' ? String(value ?? '') : up(value));
  const dtg = draft.dtg || NULL_FIELD;
  const prosign = PRECEDENCE_PROSIGN[draft.precedence] || 'R';
  const month = (String(draft.dtg || '').match(/Z\s*([A-Z]{3})/) || [])[1] || NULL_FIELD;
  const originator = splitOfficeCodes(draft.originator).pla || '[ORIGINATOR]';
  const refs = draft.references || [];
  const lines = [];

  lines.push(`${prosign} ${dtg}${draft.traffic_class === 'OPS' ? '' : ' ZYB'}`);
  lines.push(`FM ${up(draft.originator).trim() || '[ORIGINATOR]'}`);
  const action = draft.action_addressees || [];
  lines.push(...addressBlock('TO', action.length ? action : ['[ACTION ADDRESSEES]']));
  if ((draft.info_addressees || []).length) lines.push(...addressBlock('INFO', draft.info_addressees));
  lines.push('BT');

  lines.push(`${CLASSIFICATION_SHORT[draft.classification] || 'UNCLAS'} //${up(draft.ssic) || '[SSIC]'}//`);
  if (draft.general_message_id) lines.push('', up(draft.general_message_id));
  lines.push('', `MSGID/GENADMIN/${originator}/${draft.msn || NULL_FIELD}/${month}//`);
  lines.push('', ...subjectLines(draft.subject, t));

  if (refs.length) lines.push('');
  refs.forEach((r, i) => {
    lines.push(wrapLines(`REF/${refLabel(i)}/${normalizeKind(r.kind)}/${up(r.value) || '[REFERENCE]'}//`));
  });

  const explained = refs.map((r, i) => ({ r, i })).filter(({ r }) => cleanAmplification(r));
  if (refs.length === 1 && explained.length) {
    lines.push('', wrapLines(`AMPN/REF A IS ${cleanAmplification(refs[0], t)}.//`));
  } else if (refs.length > 1 && explained.length) {
    const narr = explained.map(({ r, i }) => `REF ${refLabel(i)} IS ${cleanAmplification(r, t)}.`).join(' ');
    lines.push('', wrapLines(`NARR/${narr}//`));
  }

  const phone = up(draft.poc_phone).trim();
  lines.push(
    '',
    wrapLines(
      `POC/${t(draft.poc_name).trim() || '[NAME]'}/${t(draft.poc_rank).trim() || '[RANK]'}/${
        t(draft.poc_location).trim() || NULL_FIELD
      }/-/TEL: ${phone || '[PHONE]'}//`,
    ),
  );

  const paras = (draft.paragraphs || []).map((p) => t(String(p || '').trim())).filter(Boolean);
  if (draft.released_by_name) {
    const role = draft.release_authority_designation ? `, ${t(draft.release_authority_designation)}` : '';
    paras.push(`RELEASED BY ${t(draft.released_by_name)}${role}.`);
  }
  const body = paras.length ? paras.map((p, i) => `${i + 1}. ${p}`).join('\n\n') : '1. [REMARKS]';
  lines.push('', wrapLines(`RMKS/${body}//`));

  if (draft.classification && draft.classification !== 'UNCLASSIFIED') {
    lines.push('', `DECL/${t(draft.decl) || '[DECL]'}//`);
  }

  lines.push('', 'BT', draft.local_sequence || nullSequence(settings), 'NNNN');
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