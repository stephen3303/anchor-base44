/**
 * ANCHOR — local sample traffic set (UNCLASSIFIED // PROTOTYPE).
 *
 * SAMPLE DATA ONLY. Every message, unit, name and body below is fictional and
 * generated in the browser; nothing here is read from C2OIX or any live source.
 * Times are generated relative to "now" so the prototype always shows live-looking
 * countdowns and DTGs. C2OIX ingestion, acknowledgement persistence and the audit
 * chain replace this module in the next build step.
 */
import moment from 'moment';

const now = moment.utc();
const at = (minutes) => now.clone().add(minutes, 'minutes');
const iso = (t) => t.toISOString();
const dtgOf = (t) => `${t.format('DDHHmm')}Z ${t.format('MMM').toUpperCase()} ${t.format('YY')}`;

export const formatZulu = (value) => `${moment.utc(value).format('DD MMM YY HH:mm')}Z`;
export const formatShort = (value) => `${moment.utc(value).format('DD MMM HH:mm')}Z`;
export const formatDate = (value) => moment.utc(value).format('DD MMM YY');

export const CURRENT_USER = {
  full_name: 'LT Taylor',
  rank: 'LT',
  unit: 'COMSUBLANT',
  command: 'COMSUBLANT Staff',
  role: 'Watch Officer',
  email: 'taylor@comsublant.example.mil',
};

export const PRECEDENCE_ORDER = ['FLASH', 'IMMEDIATE', 'PRIORITY', 'ROUTINE'];

export const MESSAGE_TYPES = [
  'NAVADMIN',
  'ALNAV',
  'OPNAVINST',
  'MARADMIN',
  'NAVSEAINST',
  'COMSUBLANT MSG',
  'COMSUBFOR INST',
  'FLEET MSG',
  'SAFETY MSG',
];

export const COMMUNITIES = [
  'Submarine Warfare',
  'Readiness',
  'Cybersecurity',
  'Safety',
  'Personnel',
  'Training & Education',
  'Maintenance',
  'Policy',
];

export const SAMPLE_MESSAGES = [
  {
    id: 'msg-001',
    reference: 'NAVADMIN 234/26',
    dtg: dtgOf(at(-372)),
    received: iso(at(-368)),
    subject: 'SUBMARINE DEPLOYMENT READINESS REPORTING REQUIREMENTS',
    type: 'NAVADMIN',
    originator: 'CNO WASHINGTON DC',
    to: 'ALCOMSUBLANT',
    info: 'COMNAVSEASYSCOM, COMSUBFOR, COMUSFLTFORCOM',
    source: 'C2OIX',
    precedence: 'IMMEDIATE',
    classification: 'UNCLASSIFIED',
    lifecycle: 'ACTIVE',
    relates_to: [],
    replaced_by: null,
    communities: ['Readiness', 'Submarine Warfare'],
    sections: [
      {
        heading: 'Purpose',
        body:
          'This message establishes revised deployment readiness reporting requirements for all submarine forces in the Atlantic and Pacific. It supersedes unit-level reporting conventions adopted locally since the previous reporting cycle.',
      },
      {
        heading: 'Reporting requirements',
        body:
          'Commands will report material, manning and training readiness against the enclosed matrix not later than seven days prior to departure from the operating area.\n\nReporting will be submitted through the chain of command with a copy to the force readiness cell. Interim reporting is required within 24 hours of any change in readiness condition.',
      },
      {
        heading: 'Suspense',
        body:
          'First reports under this message are due to COMSUBLANT N4 by the suspense date below. Questions may be directed to the force readiness desk during normal working hours.',
      },
    ],
    attachments: [
      { name: 'ENCLOSURE-1-READINESS-MATRIX.xlsx', size: '218 KB', kind: 'XLSX' },
      { name: 'ENCLOSURE-2-REPORTING-CHECKLIST.pdf', size: '96 KB', kind: 'PDF' },
    ],
    ack_required: true,
    ack_due: iso(at(184)),
    acknowledged_at: null,
    read_state: 'new',
    starred: false,
    action_item: {
      text: 'Submit updated readiness matrix to COMSUBLANT N4',
      suspense: iso(at(2880)),
      assigned_to: 'N4 Readiness Cell',
    },
    c2oix_id: 'C2OIX-2026-1024-0417',
    sha256: '9f2c41ab7de6f0c1b3a58e7d204c6f19ab83d5e0741c62ff8d30b9a4c7e5126d',
    size_kb: 412,
    retention: '5 years',
    ai_summary:
      'Revises submarine deployment readiness reporting: report material, manning and training status against an enclosed matrix seven days before leaving the operating area, and submit an interim report within 24 hours of any readiness change. First reports are due to the force readiness cell by the attached suspense date.',
  },
  {
    id: 'msg-002',
    reference: 'COMSUBLANT MSG 118/26',
    dtg: dtgOf(at(-1180)),
    received: iso(at(-1174)),
    subject: 'CYBERSECURITY CONTROLS UPDATE',
    type: 'COMSUBLANT MSG',
    originator: 'COMSUBLANT NORFOLK VA',
    to: 'ALCOMSUBLANT',
    info: 'COMSUBFOR, NAVIFOR',
    source: 'C2OIX',
    precedence: 'PRIORITY',
    classification: 'UNCLASSIFIED',
    lifecycle: 'CORRECTED',
    relates_to: ['COMSUBLANT MSG 121/26'],
    replaced_by: 'COMSUBLANT MSG 121/26',
    communities: ['Cybersecurity', 'Policy'],
    sections: [
      {
        heading: 'Purpose',
        body:
          'This message directs implementation of updated baseline cybersecurity controls across submarine force networks and connected maintenance enclaves.',
      },
      {
        heading: 'Applicability',
        body:
          'Controls apply to all commands operating affected enclaves. Enclave owners will confirm implementation status through the command compliance tracker.',
      },
    ],
    attachments: [{ name: 'CYBER-CONTROLS-BASELINE-v2.pdf', size: '1.2 MB', kind: 'PDF' }],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'read',
    starred: false,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1023-0912',
    sha256: '1d77b3409ac5e28f6b1c04de9a7f5523c8b0e6d3411a7f90be2c85d6a47019cf',
    size_kb: 1180,
    retention: '3 years',
    ai_summary:
      'Directs implementation of updated baseline cybersecurity controls across submarine force networks and connected maintenance enclaves, with implementation status confirmed in the command compliance tracker. A corrected copy follows this message.',
  },
  {
    id: 'msg-003',
    reference: 'COMSUBLANT MSG 121/26',
    dtg: dtgOf(at(-410)),
    received: iso(at(-404)),
    subject: 'CYBERSECURITY CONTROLS UPDATE (CORRECTED COPY)',
    type: 'COMSUBLANT MSG',
    originator: 'COMSUBLANT NORFOLK VA',
    to: 'ALCOMSUBLANT',
    info: 'COMSUBFOR, NAVIFOR',
    source: 'C2OIX',
    precedence: 'PRIORITY',
    classification: 'UNCLASSIFIED',
    lifecycle: 'ACTIVE',
    relates_to: ['COMSUBLANT MSG 118/26'],
    replaced_by: null,
    communities: ['Cybersecurity', 'Policy'],
    sections: [
      {
        heading: 'Corrected copy',
        body:
          'This corrected copy replaces COMSUBLANT MSG 118/26 in its entirety. The implementation deadline in paragraph 3 was stated incorrectly in the original; all other direction is unchanged.',
      },
      {
        heading: 'Implementation',
        body:
          'Enclave owners will complete implementation of the baseline controls and confirm status through the command compliance tracker. Interim exceptions require written justification to the force cybersecurity office.',
      },
    ],
    attachments: [{ name: 'CYBER-CONTROLS-BASELINE-v2-1.pdf', size: '1.2 MB', kind: 'PDF' }],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'unread',
    starred: false,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1024-0388',
    sha256: '6b41e0c8a9d2371f5c04b8e7a216d3f90c85be41d7a3926f0e5c184ba7d203ef',
    size_kb: 1184,
    retention: '3 years',
    ai_summary:
      'Corrected copy that replaces the earlier cybersecurity controls message in full: the implementation deadline was misstated in the original and every other requirement is unchanged. Owners confirm completion in the command compliance tracker.',
  },
  {
    id: 'msg-004',
    reference: 'FLEET MSG 091/26',
    dtg: dtgOf(at(-268)),
    received: iso(at(-262)),
    subject: 'SUBMARINE SAFETY STAND-DOWN GUIDANCE',
    type: 'FLEET MSG',
    originator: 'COMUSFLTFORCOM NORFOLK VA',
    to: 'ALCOMSUBLANT',
    info: 'COMNAVSAFECEN, COMSUBFOR',
    source: 'C2OIX',
    precedence: 'FLASH',
    classification: 'UNCLASSIFIED',
    lifecycle: 'ACTIVE',
    relates_to: [],
    replaced_by: null,
    communities: ['Safety', 'Submarine Warfare'],
    sections: [
      {
        heading: 'Immediate action',
        body:
          'All submarines will conduct a safety stand-down within 24 hours to review recent findings involving high-pressure air systems and associated test procedures.',
      },
      {
        heading: 'Scope',
        body:
          'The stand-down covers engineering department watchstanders, maintenance personnel and supervisory watch officers.\n\nCommands will document completion, including attendance and discussion points, and report through the chain of command.',
      },
      {
        heading: 'Acknowledgement',
        body:
          'Commanding officers will acknowledge receipt of this message by the suspense time below. No reply or endorsement is required beyond acknowledgement.',
      },
    ],
    attachments: [{ name: 'STANDDOWN-TALKING-POINTS.pdf', size: '142 KB', kind: 'PDF' }],
    ack_required: true,
    ack_due: iso(at(-148)),
    acknowledged_at: null,
    read_state: 'unread',
    starred: true,
    action_item: {
      text: 'Document and report safety stand-down completion',
      suspense: iso(at(1440)),
      assigned_to: 'Command Safety Officer',
    },
    c2oix_id: 'C2OIX-2026-1024-0355',
    sha256: 'c4a9e7b12f05d38a6741be90c3d5a2f8716b0e4d95c3a1f7208de64b9a51c3d0',
    size_kb: 268,
    retention: '7 years',
    ai_summary:
      'Directs a safety stand-down within 24 hours for all submarines following high-pressure air system findings, covering engineering watchstanders, maintenance personnel and supervisory watch officers. Commands document and report completion, and commanding officers acknowledge the message by the stated suspense.',
  },
  {
    id: 'msg-005',
    reference: 'COMSUBFOR INST 3300.2',
    dtg: dtgOf(at(-4380)),
    received: iso(at(-4370)),
    subject: 'DEPLOYMENT READINESS REPORTING (INTERIM)',
    type: 'COMSUBFOR INST',
    originator: 'COMSUBFOR',
    to: 'ALCOMSUBLANT',
    info: 'COMSUBLANT, COMSUBPAC',
    source: 'C2OIX',
    precedence: 'ROUTINE',
    classification: 'UNCLASSIFIED',
    lifecycle: 'SUPERSEDED',
    relates_to: ['COMSUBFOR INST 3300.3'],
    replaced_by: 'COMSUBFOR INST 3300.3',
    communities: ['Readiness', 'Policy'],
    sections: [
      {
        heading: 'Interim guidance',
        body:
          'This interim instruction established reporting formats pending publication of the permanent instruction. It is superseded by COMSUBFOR INST 3300.3.',
      },
    ],
    attachments: [],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'read',
    starred: false,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1021-0044',
    sha256: '2f8b45c0de91a6738c024be75d3f19a0c8b47e62d05a31f9c7e28b4610da59f7',
    size_kb: 144,
    retention: 'Permanent',
    ai_summary:
      'Interim readiness reporting formats issued pending the permanent instruction. Superseded by COMSUBFOR INST 3300.3 and retained for historical reference only.',
  },
  {
    id: 'msg-006',
    reference: 'COMSUBFOR INST 3300.3',
    dtg: dtgOf(at(-960)),
    received: iso(at(-954)),
    subject: 'DEPLOYMENT READINESS REPORTING',
    type: 'COMSUBFOR INST',
    originator: 'COMSUBFOR',
    to: 'ALCOMSUBLANT',
    info: 'COMSUBLANT, COMSUBPAC',
    source: 'C2OIX',
    precedence: 'ROUTINE',
    classification: 'UNCLASSIFIED',
    lifecycle: 'ACTIVE',
    relates_to: ['COMSUBFOR INST 3300.2'],
    replaced_by: null,
    communities: ['Readiness', 'Policy'],
    sections: [
      {
        heading: 'Purpose',
        body:
          'This instruction publishes the permanent deployment readiness reporting standard and cancels the interim guidance previously issued.',
      },
      {
        heading: 'Reporting standard',
        body:
          'Readiness reporting follows a common format across submarine forces with quarterly validation by the force readiness cell.',
      },
    ],
    attachments: [{ name: '3300-3-REPORTING-STANDARD.pdf', size: '384 KB', kind: 'PDF' }],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'read',
    starred: false,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1023-1120',
    sha256: '8c02d5f7ba194e3608d7c14a29be5037f1d68c04a7e3529bd80c7614fe203a8b',
    size_kb: 384,
    retention: 'Permanent',
    ai_summary:
      'Publishes the permanent deployment readiness reporting standard, cancels the interim guidance, and requires quarterly validation of reports by the force readiness cell.',
  },
  {
    id: 'msg-007',
    reference: 'ALNAV 074/26',
    dtg: dtgOf(at(-3180)),
    received: iso(at(-3172)),
    subject: 'HOLIDAY LEAVE POLICY',
    type: 'ALNAV',
    originator: 'SECNAV WASHINGTON DC',
    to: 'ALNAV',
    info: 'CNO WASHINGTON DC',
    source: 'C2OIX',
    precedence: 'PRIORITY',
    classification: 'UNCLASSIFIED',
    lifecycle: 'CANCELLED',
    relates_to: ['ALNAV 078/26'],
    replaced_by: 'ALNAV 078/26',
    communities: ['Personnel', 'Policy'],
    sections: [
      {
        heading: 'Cancellation',
        body:
          'This message is cancelled in its entirety and has no force. Do not execute the leave-scheduling direction contained in the original text.',
      },
    ],
    attachments: [],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'read',
    starred: false,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1022-0131',
    sha256: '5e13a9c47b206df185b0e93d7c421fa60b8de53719a4c2076fb385d9140e2ac7',
    size_kb: 96,
    retention: '3 years',
    ai_summary:
      'Cancelled in its entirety with no force. The leave-scheduling direction in the original text must not be executed; the replacement message governs.',
  },
  {
    id: 'msg-008',
    reference: 'ALNAV 078/26',
    dtg: dtgOf(at(-1420)),
    received: iso(at(-1414)),
    subject: 'HOLIDAY LEAVE POLICY',
    type: 'ALNAV',
    originator: 'SECNAV WASHINGTON DC',
    to: 'ALNAV',
    info: 'CNO WASHINGTON DC',
    source: 'C2OIX',
    precedence: 'PRIORITY',
    classification: 'UNCLASSIFIED',
    lifecycle: 'ACTIVE',
    relates_to: ['ALNAV 074/26'],
    replaced_by: null,
    communities: ['Personnel', 'Policy'],
    sections: [
      {
        heading: 'Policy',
        body:
          'This message reissues holiday leave policy and cancels the earlier version. Commands will balance leave requests against watch and maintenance requirements.',
      },
      {
        heading: 'Implementation',
        body:
          'Commanding officers retain approval authority and will publish local leave windows consistent with this policy.',
      },
    ],
    attachments: [{ name: 'LEAVE-PLANNING-WORKSHEET.xlsx', size: '74 KB', kind: 'XLSX' }],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'unread',
    starred: false,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1023-0745',
    sha256: 'a70c2e91d5b438f0627ab1c9e0d34f85712be06cd9a4f3182b05e7d6149ac3f2',
    size_kb: 208,
    retention: '3 years',
    ai_summary:
      'Reissues holiday leave policy and cancels the earlier version. Commands balance leave requests against watch and maintenance requirements, and commanding officers publish local leave windows consistent with the policy.',
  },
  {
    id: 'msg-009',
    reference: 'COMSUBLANT MSG 109/26',
    dtg: dtgOf(at(-2960)),
    received: iso(at(-2952)),
    subject: 'PORT VISIT COORDINATION',
    type: 'COMSUBLANT MSG',
    originator: 'COMSUBLANT NORFOLK VA',
    to: 'ALCOMSUBLANT',
    info: 'COMUSFLTFORCOM',
    source: 'C2OIX',
    precedence: 'PRIORITY',
    classification: 'UNCLASSIFIED',
    lifecycle: 'AMENDED',
    relates_to: ['COMSUBLANT MSG 116/26'],
    replaced_by: 'COMSUBLANT MSG 116/26',
    communities: ['Submarine Warfare', 'Policy'],
    sections: [
      {
        heading: 'Coordination',
        body:
          'This message established port visit coordination requirements for units in the Atlantic operating area, including notification timelines for host-nation support requests.',
      },
    ],
    attachments: [],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'read',
    starred: false,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1022-0688',
    sha256: 'd3f7082b95a1c4e6f02d8b3741a9c5e08d62b17fa4c39e5027b8d16a4c0e9f35',
    size_kb: 132,
    retention: '3 years',
    ai_summary:
      'Established port visit coordination requirements for Atlantic units, including notification timelines for host-nation support requests. Amendment 1 replaces this message.',
  },
  {
    id: 'msg-010',
    reference: 'COMSUBLANT MSG 116/26',
    dtg: dtgOf(at(-680)),
    received: iso(at(-676)),
    subject: 'PORT VISIT COORDINATION — AMENDMENT 1',
    type: 'COMSUBLANT MSG',
    originator: 'COMSUBLANT NORFOLK VA',
    to: 'ALCOMSUBLANT',
    info: 'COMUSFLTFORCOM',
    source: 'C2OIX',
    precedence: 'PRIORITY',
    classification: 'UNCLASSIFIED',
    lifecycle: 'ACTIVE',
    relates_to: ['COMSUBLANT MSG 109/26'],
    replaced_by: null,
    communities: ['Submarine Warfare', 'Policy'],
    sections: [
      {
        heading: 'Amendment',
        body:
          'Paragraph 4 is amended: notification for host-nation support requests is now required before arrival window confirmation rather than after.',
      },
      {
        heading: 'Unchanged direction',
        body:
          'All other direction in COMSUBLANT MSG 109/26 remains in effect. Units already in a coordinated port visit will apply the amended timeline on a best-effort basis.',
      },
    ],
    attachments: [],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'read',
    starred: false,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1024-0261',
    sha256: '7ab410c3e92d5f806b13c7402ad9e5f18c64bd0a37912ef5c08d6b4a21f9037e',
    size_kb: 138,
    retention: '3 years',
    ai_summary:
      'Amends paragraph 4 of the port visit coordination message: host-nation support notification is now required before arrival window confirmation. All other direction stands; units mid-coordination apply the amended timeline best-effort.',
  },
  {
    id: 'msg-011',
    reference: 'COMSUBLANT INST 1414.1',
    dtg: dtgOf(at(-5400)),
    received: iso(at(-5390)),
    subject: 'WATCH TEAM QUALIFICATION STANDARDS',
    type: 'COMSUBLANT MSG',
    originator: 'COMSUBLANT NORFOLK VA',
    to: 'ALCOMSUBLANT',
    info: 'COMSUBFOR',
    source: 'C2OIX',
    precedence: 'ROUTINE',
    classification: 'UNCLASSIFIED',
    lifecycle: 'ACTIVE',
    relates_to: [],
    replaced_by: null,
    communities: ['Training & Education', 'Submarine Warfare'],
    sections: [
      {
        heading: 'Standards',
        body:
          'Establishes qualification standards for watch teams, including required drill performance and supervisory sign-off before independent watchstanding.',
      },
      {
        heading: 'Validation',
        body:
          'Qualification records are validated annually by the training department and reviewed during external assessment.',
      },
    ],
    attachments: [{ name: 'WATCH-QUALIFICATION-CARD.pdf', size: '310 KB', kind: 'PDF' }],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'read',
    starred: true,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1020-0921',
    sha256: '0e94b7f21c6a35d8048be9172f53c0da8617be4c935a2f708d16b4e29c05a7f1',
    size_kb: 310,
    retention: 'Permanent',
    ai_summary:
      'Establishes watch team qualification standards covering drill performance and supervisory sign-off before independent watchstanding, with annual validation of qualification records by the training department.',
  },
  {
    id: 'msg-012',
    reference: 'NAVSEAINST 4790.1',
    dtg: dtgOf(at(-7600)),
    received: iso(at(-7588)),
    subject: 'MAINTENANCE AVAILABILITY REPORTING',
    type: 'NAVSEAINST',
    originator: 'COMNAVSEASYSCOM WASHINGTON DC',
    to: 'ALNAV',
    info: 'COMSUBLANT, COMSUBPAC',
    source: 'C2OIX',
    precedence: 'ROUTINE',
    classification: 'UNCLASSIFIED',
    lifecycle: 'ACTIVE',
    relates_to: [],
    replaced_by: null,
    communities: ['Maintenance', 'Readiness'],
    sections: [
      {
        heading: 'Reporting',
        body:
          'Availability status, growth work and projected completion dates will be reported weekly through the maintenance reporting system.',
      },
      {
        heading: 'Exceptions',
        body:
          'Schedule changes greater than five working days require notification to the type commander with supporting justification.',
      },
    ],
    attachments: [],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'read',
    starred: false,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1019-0302',
    sha256: 'b6205de1c7f943a08d71be35c0429fa6d1837e0c54912bf6a087d3e4c9125ba0',
    size_kb: 176,
    retention: '5 years',
    ai_summary:
      'Requires weekly reporting of availability status, growth work and projected completion dates, and notification to the type commander for any schedule change greater than five working days.',
  },
  {
    id: 'msg-013',
    reference: 'NAVADMIN 226/26',
    dtg: dtgOf(at(-2200)),
    received: iso(at(-2194)),
    subject: 'OFFICIAL RECORDS MANAGEMENT REMINDER',
    type: 'NAVADMIN',
    originator: 'CNO WASHINGTON DC',
    to: 'ALNAV',
    info: 'SECNAV WASHINGTON DC',
    source: 'C2OIX',
    precedence: 'ROUTINE',
    classification: 'UNCLASSIFIED',
    lifecycle: 'ACTIVE',
    relates_to: [],
    replaced_by: null,
    communities: ['Policy', 'Personnel'],
    sections: [
      {
        heading: 'Reminder',
        body:
          'Commands will review retention and disposition practices for official records, including message traffic held outside authoritative repositories.',
      },
    ],
    attachments: [],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'read',
    starred: false,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1023-0207',
    sha256: '3c81f0a6d29b74e5c0138fa7b6d24e90a7c518bd3f60e21a9d5b73c8640e2fa9',
    size_kb: 88,
    retention: '3 years',
    ai_summary:
      'Reminds commands to review retention and disposition of official records, including message traffic held outside authoritative repositories.',
  },
  {
    id: 'msg-014',
    reference: 'MARADMIN 512/26',
    dtg: dtgOf(at(-12200)),
    received: iso(at(-12188)),
    subject: 'TRAINING QUOTA REALIGNMENT',
    type: 'MARADMIN',
    originator: 'HQMC WASHINGTON DC',
    to: 'ALNAV',
    info: 'CNO WASHINGTON DC',
    source: 'C2OIX',
    precedence: 'ROUTINE',
    classification: 'UNCLASSIFIED',
    lifecycle: 'EXPIRED',
    relates_to: [],
    replaced_by: null,
    communities: ['Training & Education', 'Personnel'],
    sections: [
      {
        heading: 'Expired direction',
        body:
          'This message realigned training quotas for the previous fiscal quarter and has expired. Retained for reference only; no action is required.',
      },
    ],
    attachments: [],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'read',
    starred: false,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1017-0155',
    sha256: 'f2b7a408c1e6395d70b84a2e9c153f6d80a7b421ce96038f5d17a2be604c9d31',
    size_kb: 112,
    retention: '1 year',
    ai_summary:
      'Expired direction that realigned training quotas for the previous fiscal quarter. Retained for reference only; no action required.',
  },
  {
    id: 'msg-015',
    reference: 'SAFETY MSG 044/26',
    dtg: dtgOf(at(-560)),
    received: iso(at(-552)),
    subject: 'HIGH-PRESSURE AIR SYSTEM INSPECTION FINDINGS',
    type: 'SAFETY MSG',
    originator: 'COMNAVSAFECEN NORFOLK VA',
    to: 'ALNAV',
    info: 'COMSUBLANT, COMSUBFOR',
    source: 'C2OIX',
    precedence: 'IMMEDIATE',
    classification: 'UNCLASSIFIED',
    lifecycle: 'ACTIVE',
    relates_to: ['FLEET MSG 091/26'],
    replaced_by: null,
    communities: ['Safety', 'Maintenance'],
    sections: [
      {
        heading: 'Findings',
        body:
          'Inspection identified recurring discrepancies in high-pressure air system relief valve testing and associated record keeping across several units.',
      },
      {
        heading: 'Required action',
        body:
          'Units will verify relief valve test records and re-test where documentation is incomplete. Findings will be reported to the safety center through the chain of command.',
      },
    ],
    attachments: [{ name: 'HP-AIR-FINDINGS-SUMMARY.pdf', size: '620 KB', kind: 'PDF' }],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'unread',
    starred: false,
    action_item: {
      text: 'Verify high-pressure air relief valve test records',
      suspense: iso(at(4320)),
      assigned_to: 'Engineering Department',
    },
    c2oix_id: 'C2OIX-2026-1024-0299',
    sha256: '84cf02d7a95b31e6c8d04f27b1a5e6390d7c48b2f61e390ac5b27d804e16c3f8',
    size_kb: 620,
    retention: '7 years',
    ai_summary:
      'Reports recurring discrepancies in high-pressure air relief valve testing and record keeping. Units verify test records, re-test where documentation is incomplete, and report findings through the chain of command.',
  },
  {
    id: 'msg-016',
    reference: 'OPNAVINST 5510.1',
    dtg: dtgOf(at(-9100)),
    received: iso(at(-9090)),
    subject: 'OPSEC PROGRAM REVIEW SCHEDULE',
    type: 'OPNAVINST',
    originator: 'OPNAV WASHINGTON DC',
    to: 'ALNAV',
    info: 'COMSUBLANT, COMSUBPAC',
    source: 'C2OIX',
    precedence: 'ROUTINE',
    classification: 'UNCLASSIFIED',
    lifecycle: 'ACTIVE',
    relates_to: [],
    replaced_by: null,
    communities: ['Policy', 'Cybersecurity'],
    sections: [
      {
        heading: 'Schedule',
        body:
          'Publishes the annual operations security program review schedule and assigns review responsibilities by command.',
      },
    ],
    attachments: [],
    ack_required: false,
    ack_due: null,
    acknowledged_at: null,
    read_state: 'read',
    starred: false,
    action_item: null,
    c2oix_id: 'C2OIX-2026-1018-0614',
    sha256: '5ad91e0cb7f384a2c60de5917b03af4c8e12d6790b53ac4f1e9028d6b7c04a11',
    size_kb: 124,
    retention: '5 years',
    ai_summary:
      'Publishes the annual operations security program review schedule and assigns review responsibilities by command.',
  },
];

export const SAMPLE_SUBSCRIPTIONS = [
  {
    id: 'sub-1',
    name: 'Submarine Readiness Traffic',
    category: 'Readiness',
    frequency: 'Real-time',
    status: 'Active',
    mandatory: false,
    channels: ['in_app', 'email'],
  },
  {
    id: 'sub-2',
    name: 'Force-Wide Safety Advisories',
    category: 'Safety',
    frequency: 'Real-time',
    status: 'Active',
    mandatory: true,
    channels: ['in_app', 'email'],
  },
  {
    id: 'sub-3',
    name: 'Cybersecurity Directives',
    category: 'Cybersecurity',
    frequency: 'Daily Digest',
    status: 'Pending Approval',
    mandatory: false,
    channels: ['in_app', 'email'],
    justification:
      'Watch officer needs current control baselines to answer network posture questions on watch.',
    requested_by: 'LT Taylor',
  },
  {
    id: 'sub-4',
    name: 'Maintenance Availability Windows',
    category: 'Maintenance',
    frequency: 'Weekly',
    status: 'Pending Approval',
    mandatory: false,
    channels: ['in_app'],
    justification: 'Supports readiness tracking and N4 input for the weekly brief.',
    requested_by: 'LT Taylor',
  },
  {
    id: 'sub-5',
    name: 'Personnel & Leave Policy',
    category: 'Personnel',
    frequency: 'Daily Digest',
    status: 'Active',
    mandatory: false,
    channels: ['in_app'],
  },
];

const byReceivedDesc = (a, b) => moment.utc(b.received).valueOf() - moment.utc(a.received).valueOf();

export const isOverdue = (message) =>
  Boolean(message.ack_required) &&
  !message.acknowledged_at &&
  moment.utc(message.ack_due).isBefore(moment.utc());

export const mandatoryAcks = () =>
  SAMPLE_MESSAGES.filter((m) => m.ack_required && !m.acknowledged_at).sort((a, b) =>
    moment.utc(a.ack_due).valueOf() - moment.utc(b.ack_due).valueOf(),
  );

export const unreadCount = () => SAMPLE_MESSAGES.filter((m) => m.read_state !== 'read').length;

export const latestTraffic = (limit = 6) => [...SAMPLE_MESSAGES].sort(byReceivedDesc).slice(0, limit);

export const statusChanges = () =>
  SAMPLE_MESSAGES.filter((m) => m.lifecycle !== 'ACTIVE').sort(byReceivedDesc);

export const openActionItems = () =>
  SAMPLE_MESSAGES.filter((m) => m.action_item).sort(
    (a, b) => moment.utc(a.action_item.suspense).valueOf() - moment.utc(b.action_item.suspense).valueOf(),
  );

export const pendingApprovals = () =>
  SAMPLE_SUBSCRIPTIONS.filter((s) => s.status === 'Pending Approval').length;

export const messageByReference = (reference) =>
  SAMPLE_MESSAGES.find((m) => m.reference === reference) || null;