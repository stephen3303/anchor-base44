import moment from 'moment';
import {
  ADDRESS_LIMIT,
  AMPLIFIED_KINDS,
  LINE_LIMIT,
  SUBJECT_FIRST_LIMIT,
  SUBJECT_NEXT_LIMIT,
  REF_KINDS,
  refLabel,
  splitOfficeCodes,
} from '@/lib/ntp';

/**
 * Validates a draft against NTP 3(J). Each finding cites the paragraph it comes from.
 * "error" findings block submission and release; "warning" findings are advisory.
 */

const up = (v) => String(v || '').toUpperCase();
const BAD_TEXT = /[^A-Z0-9 \n".,:()?\-/]/g;
const unique = (list) => [...new Set(list)];
const badChars = (text) => unique(up(text).match(BAD_TEXT) || []).map((c) => (c === '\t' ? 'TAB' : c));

export function validateDraft(draft, { source } = {}) {
  const issues = [];
  const add = (severity, ref, message, field) => issues.push({ severity, ref, message, field });
  const classified = draft.classification && draft.classification !== 'UNCLASSIFIED';
  const action = draft.action_addressees || [];
  const info = draft.info_addressees || [];
  const refs = draft.references || [];
  const paras = (draft.paragraphs || []).map((p) => String(p || '').trim()).filter(Boolean);

  // Originator — FM line (¶603a)
  const from = String(draft.originator || '').trim();
  if (!from) add('error', '¶603a', 'The FM line is empty. Name the originating command.', 'originator');
  else if (from.length > ADDRESS_LIMIT)
    add('error', '¶603a', `The FM line is ${from.length} characters. The limit is ${ADDRESS_LIMIT}, and continuation lines are not allowed.`, 'originator');

  // Addressees (¶602, ¶603b)
  if (!action.length) add('error', '¶603b', 'Add at least one action (TO) addressee.', 'action_addressees');
  [...action.map((a) => ['TO', a]), ...info.map((a) => ['INFO', a])].forEach(([line, entry]) => {
    const { pla, codes } = splitOfficeCodes(entry);
    if (/[^A-Z0-9 ]/.test(pla))
      add('error', '¶602a8', `${line} ${entry}: punctuation is prohibited in a PLA.`, 'addressees');
    if (/\d/.test(pla))
      add('warning', '¶602a6', `${line} ${pla}: numbers in a PLA are spelled out (ELEVEN, TWO ZERO).`, 'addressees');
    if (up(entry).length > ADDRESS_LIMIT && !codes)
      add('error', '¶603b', `${line} ${pla}: longer than ${ADDRESS_LIMIT} characters.`, 'addressees');
    if (codes !== null) {
      const bad = codes.split('/').filter((c) => c.length < 2 || c.length > 12 || /\s/.test(c));
      if (!codes || bad.length)
        add('error', '¶602b2', `${line} ${pla}: office codes are 2-12 characters, no spaces, in the form //N6/N61//.`, 'addressees');
    } else if (/\s[A-Z]{2}$/.test(pla)) {
      add('warning', '¶602b1', `${line} ${pla}: shore activities carry office codes in GENADMIN messages.`, 'addressees');
    }
  });
  const toSet = new Set(action.map((a) => splitOfficeCodes(a).pla));
  info.forEach((a) => {
    if (toSet.has(splitOfficeCodes(a).pla))
      add('warning', '¶603b', `${splitOfficeCodes(a).pla} appears as both action and information addressee.`, 'addressees');
  });

  // Precedence (¶304, ¶503)
  if (draft.traffic_class !== 'OPS') {
    if (draft.precedence === 'FLASH')
      add('error', '¶304', 'Administrative messages are never FLASH. PRIORITY is the normal ceiling.', 'precedence');
    if (draft.precedence === 'IMMEDIATE')
      add('warning', '¶503', 'IMMEDIATE on an administrative message is reserved for death, serious illness or serious injury.', 'precedence');
  }

  // SSIC (¶706)
  const ssic = up(draft.ssic).trim();
  if (!/^N\d{5}$/.test(ssic))
    add('error', '¶706b', 'An SSIC is required: the letter N and five digits, for example N02300.', 'ssic');
  else if (ssic === 'N00000' && draft.precedence === 'ROUTINE' && !classified)
    add('warning', '¶706a', 'N00000 is for high-precedence, service or specially handled traffic. Find the right SSIC in SECNAVINST 5210.11.', 'ssic');

  // General message title (¶306d)
  if (draft.general_message_id && !/^[A-Z]{3,}\s\d{3}\/\d{2}$/.test(up(draft.general_message_id).trim()))
    add('error', '¶306d', 'A general message number is the title, a three-digit serial, a slant and two year digits: ALNAV 032/26.', 'general_message_id');

  // DTG (¶504)
  if (draft.dtg) {
    if (!/^\d{6}Z [A-Z]{3} \d{2}$/.test(draft.dtg)) add('error', '¶504', 'The DTG must read DDHHMMZ MON YY.', 'dtg');
    else if (draft.dtg.slice(2, 6) === '0000')
      add('error', '¶504', '0000Z is never used. Use 0001Z.', 'dtg');
  }

  // Subject (¶710, Annex A)
  const subject = String(draft.subject || '').trim();
  if (!subject) add('error', 'A102h', 'The subject set is mandatory.', 'subject');
  else {
    if (subject.length > SUBJECT_FIRST_LIMIT + SUBJECT_NEXT_LIMIT)
      add('error', 'Fig A-2', `The subject is ${subject.length} characters. SUBJ allows ${SUBJECT_FIRST_LIMIT} plus one ${SUBJECT_NEXT_LIMIT} character continuation.`, 'subject');
    if (subject.includes('/'))
      add('error', 'A102f3', 'A single slant is a field marker and cannot be used in the subject.', 'subject');
    const bad = badChars(subject);
    if (bad.length) add('error', 'A102g', `Characters not allowed in GENADMIN: ${bad.join(' ')}`, 'subject');
    if (classified && !/\((U|C|S|TS)\)\s*$/.test(up(subject)))
      add('error', '¶710b', 'In a classified message the subject ends with its marking: (U), (C) or (S).', 'subject');
  }

  // References (¶711, Annex A l)
  refs.forEach((r, i) => {
    const label = refLabel(i);
    const kind = up(r.kind);
    if (!String(r.value || '').trim()) add('error', 'A102l', `REF ${label} has no originator or date-time group.`, 'references');
    if (r.ref_label && r.ref_label !== label)
      add('error', 'A102l', `References are serialised alphabetically: this one should be ${label}, not ${r.ref_label}.`, 'references');
    if (kind && !REF_KINDS.includes(kind))
      add('warning', 'A102l', `REF ${label}: type "${r.kind}" is not MSG, DOC, LTR, TEL, CON or a USMTF name.`, 'references');
    if (AMPLIFIED_KINDS.includes(kind || 'MSG') && !String(r.amplifying || '').trim())
      add('error', 'A102l', `REF ${label} must be explained in the AMPN/NARR amplification.`, 'references');
    if (String(r.value || '').split('/').length > 3)
      add('warning', 'A102f3', `REF ${label}: too many field markers in the reference.`, 'references');
  });
  if (draft.derived_from_message_id && !refs.some((r) => r.message_id === draft.derived_from_message_id))
    add('warning', '¶711', 'A derived message cites the original as a reference.', 'references');

  // Point of contact (¶712, Fig A-2)
  const poc = (name, v, min, max, label) => {
    const len = String(v || '').trim().length;
    if (!len) add('error', '¶712', `Point of contact ${label} is required in GENADMIN messages.`, 'poc');
    else if (len < min || len > max) add('error', 'Fig A-2', `POC ${label} must be ${min}-${max} characters.`, 'poc');
  };
  poc('name', draft.poc_name, 1, 20, 'name');
  poc('rank', draft.poc_rank, 2, 4, 'rank or rate');
  poc('phone', draft.poc_phone, 3, 15, 'phone number');
  if (String(draft.poc_location || '').length > 15) add('error', 'Fig A-2', 'POC location is at most 15 characters.', 'poc');

  // Remarks (¶713)
  if (!paras.length) add('error', '¶713', 'The remarks set is mandatory. Add a paragraph.', 'paragraphs');
  const text = paras.join('\n');
  const bad = badChars(text);
  if (bad.length)
    add('error', '¶713e', `Characters not authorised in GENADMIN: ${bad.join(' ')}. Spell out or abbreviate (CMA, PD, ...).`, 'paragraphs');
  if (text.includes('//'))
    add('error', 'A102g', 'Double slants are reserved as the end-of-set marker. Remove them from the text.', 'paragraphs');
  if (text.split(/\s+/).some((w) => w.length > LINE_LIMIT))
    add('error', 'A102b', `A single word is longer than ${LINE_LIMIT} characters and cannot be wrapped.`, 'paragraphs');
  if (classified) {
    const unmarked = paras.filter((p) => !/^\((U|C|S|TS)\)/i.test(p)).length;
    if (unmarked)
      add('warning', '¶713d', `${unmarked} paragraph(s) lack a classification symbol such as (C) or (S).`, 'paragraphs');
  }

  // Declassification (¶714)
  const decl = up(draft.decl).trim();
  if (classified) {
    if (!decl) add('error', '¶714', 'A classified message needs a declassification instruction: DECL/X1 to X8 or a date.', 'decl');
    else if (/^X[1-8]$/.test(decl)) {
      // exemption category, valid as written
    } else if (!/^\d{2}[A-Z]{3}\d{2}$/.test(decl)) {
      add('error', '¶714', 'Use DDMMMYY, or X1 through X8.', 'decl');
    } else {
      const date = moment.utc(decl, 'DDMMMYY');
      if (!date.isValid() || date.isAfter(moment.utc().add(10, 'years')))
        add('error', '¶714', 'A declassification date must be under ten years from origination.', 'decl');
    }
  } else if (decl) {
    add('warning', 'Fig A-1', 'DECL is not used on unclassified messages.', 'decl');
  }

  // Cancellation (¶403b)
  if (draft.derivation_type === 'cancellation') {
    if (info.length)
      add('error', '¶403b', 'A cancellation goes to the same addressees as the original, and all must now be action addressees.', 'addressees');
    if (source && up(subject) !== up(source.subject))
      add('warning', '¶403b', 'A cancellation carries a subject identical to the message it cancels.', 'subject');
    if (!/CANCEL/i.test(text)) add('warning', '¶403b', 'Say what is cancelled: for example "CANCEL REF A."', 'paragraphs');
  }

  return issues;
}

export const errorsOf = (issues) => issues.filter((i) => i.severity === 'error');