/**
 * Traffic the ANCHOR server has received from C2OIX, shown as inbox records.
 *
 * The repository hands messages over in setline form; the inbox reads whole
 * records. Nothing official is invented here: the setlines, the subject and the
 * body come from the message as received, and the fields the portal does not
 * hold for received traffic (POC, attachments, an AI summary) stay empty.
 */

/** The workstation this operator sits at: the Watch Officer's, WS-01. */
export const OPERATOR_WORKSTATION = {
  key: 'anchor-ws1',
  code: 'WS-01',
  label: 'Watch Officer workstation',
};

/** The inbox identifier of a received message, so it never collides with the local set. */
export const inboundId = (simId) => `sim-${simId}`;

const list = (value) =>
  (Array.isArray(value) ? value : String(value || '').split(','))
    .map((entry) => String(entry).trim())
    .filter(Boolean);

/** The body as the numbered paragraphs it was sent in. */
const sectionsOf = (body) => {
  const lines = String(body || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [{ heading: 'Remarks', body: '—' }];

  return lines.map((line, index) => {
    const numbered = line.match(/^(\d+)\.\s*(.*)$/);
    if (numbered) return { heading: `Paragraph ${numbered[1]}`, body: numbered[2] };
    return { heading: index === 0 ? 'Remarks' : `Paragraph ${index + 1}`, body: line };
  });
};

/** One message from the C2OIX repository, read as an inbox record. */
export const toInboxMessage = (sim) => ({
  id: inboundId(sim.id),
  sim_id: sim.id,
  inbound: true,
  reference: sim.reference || '',
  ssic: '',
  msn: '',
  general_message_id: sim.reference || '',
  decl: null,
  poc: null,
  references: [],
  dtg: sim.dtg || '',
  received: sim.ingested_at || sim.dispatched_at || sim.created_date || '',
  subject: sim.subject || '',
  type: 'FLEET MSG',
  originator: sim.originator || '',
  to: list(sim.action_addressees).join(', '),
  info: list(sim.info_addressees).join(', '),
  source: 'C2OIX',
  precedence: sim.precedence || 'ROUTINE',
  classification: sim.classification || 'UNCLASSIFIED',
  lifecycle: 'ACTIVE',
  relates_to: [],
  replaced_by: null,
  communities: list(sim.communities),
  sections: sectionsOf(sim.body),
  attachments: [],
  ack_required: false,
  ack_due: null,
  acknowledged_at: null,
  read_state: 'new',
  starred: false,
  action_item: null,
  c2oix_id: sim.reference || '',
  sha256: '',
  size_kb: sim.size_kb || 0,
  retention: 'per command schedule',
  ai_summary: null,
});

/**
 * What the operator's workstation shows: a workstation cut off from the ANCHOR
 * server receives nothing, so traffic ingested while the link was down is held
 * by the server and appears once the link is back.
 */
export const receivedAtWorkstation = (messages, link) => {
  if (link.state !== 'down' || !link.reportedAt) return messages;
  const cut = new Date(link.reportedAt).getTime();
  if (Number.isNaN(cut)) return messages;
  return messages.filter((message) => new Date(message.received).getTime() < cut);
};