import { MESSAGE_TYPES, PRECEDENCE_ORDER } from '@/data/anchorSampleData';

export { MESSAGE_TYPES };

export const PRECEDENCES = PRECEDENCE_ORDER;

export const CLASSIFICATIONS = ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET'];

export const DERIVATION_OPTIONS = [
  { value: 'corrected_copy', label: 'Corrected copy', note: 'Reissues the message in full with the error corrected. Supersedes the original.' },
  { value: 'update', label: 'Update / amendment', note: 'Amends specific paragraphs. All other direction in the original stands.' },
  { value: 'cancellation', label: 'Cancellation', note: 'Cancels the message in its entirety with no force.' },
];

export const STEP_ACTIONS = [
  { value: 'review', label: 'Review and endorse' },
  { value: 'release', label: 'Release authority' },
];

export const DUTY_SUGGESTIONS = [
  'Action Officer',
  'Department Head',
  'Operations Officer',
  'Executive Officer',
  'Commanding Officer',
];

export const ADDRESSEE_SUGGESTIONS = [
  'ALCOMSUBLANT',
  'ALNAV',
  'COMSUBFOR',
  'COMSUBPAC',
  'COMUSFLTFORCOM',
  'COMNAVSEASYSCOM',
  'NAVIFOR',
];