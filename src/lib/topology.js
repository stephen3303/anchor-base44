import { base44 } from '@/api/base44Client';
import { formatZulu } from '@/data/anchorSampleData';

/**
 * The command's links drawn as a diagram: two servers and the three workstations
 * they serve.
 *
 * The circuit between the two servers is not held here — it is the command's own
 * link state, the same row every screen reports from. Only the three workstation
 * links are held in this entity, so the diagram can be broken one link at a time.
 */

export const NODES = [
  {
    key: 'c2oix',
    kind: 'server',
    code: 'C2OIX',
    name: 'External C2OIX server',
    detail: 'Outside the command. Holds the repository of traffic and hands it over the circuit.',
  },
  {
    key: 'anchor',
    kind: 'server',
    code: 'ANCHOR',
    name: 'Local ANCHOR server',
    detail: 'At this command. Serves every workstation with the message database and the audit chain.',
  },
  { key: 'ws1', kind: 'client', code: 'WS-01', name: 'Watch Officer workstation', detail: 'Watch floor.' },
  { key: 'ws2', kind: 'client', code: 'WS-02', name: 'Traffic desk workstation', detail: 'Traffic office.' },
  { key: 'ws3', kind: 'client', code: 'WS-03', name: 'Drafting workstation', detail: 'Drafting desk.' },
];

export const WORKSTATION_LINKS = [
  { key: 'anchor-ws1', label: 'WS-01 link', to: 'ws1' },
  { key: 'anchor-ws2', label: 'WS-02 link', to: 'ws2' },
  { key: 'anchor-ws3', label: 'WS-03 link', to: 'ws3' },
];

export const CIRCUIT_KEY = 'c2oix-anchor';

export const nodeByKey = (key) => NODES.find((node) => node.key === key);

/** Read the workstation links, creating any that are missing on first use. */
export const loadWorkstationLinks = async () => {
  const { items } = await base44.entities.NetworkLink.list({ limit: 50 });
  const known = new Set((items || []).map((row) => row.link_key));
  const missing = WORKSTATION_LINKS.filter((link) => !known.has(link.key));
  if (!missing.length) return items || [];

  await base44.entities.NetworkLink.bulkCreate(
    missing.map((link) => ({
      link_key: link.key,
      label: link.label,
      state: 'up',
      note: 'Link up at the start of the demonstration.',
    })),
  );
  const settled = await base44.entities.NetworkLink.list({ limit: 50 });
  return settled.items || [];
};

const bySequence = (a, b) => (a.sequence || 0) - (b.sequence || 0);
const latest = (list, key) => list.reduce((best, item) => (!best || key(item) > key(best) ? item : best), null);
const order = (message) => String(message.sequence || 0).padStart(5, '0');

const shown = (label, message, at, empty) =>
  message
    ? { label, reference: message.reference, subject: message.subject, precedence: message.precedence, at }
    : { label, empty };

/**
 * Where the simulated traffic is. A message that has not left C2OIX has not been
 * transmitted: it is either still queued there, or released while the circuit was
 * down and waiting there for it. The local server holds what it has ingested, and
 * each workstation holds what the local server has handed it.
 */
export const deriveTraffic = (messages, circuitUp) => {
  const all = messages || [];
  const queued = all.filter((message) => message.status === 'queued').sort(bySequence);
  const waiting = all.filter((message) => message.status === 'deferred').sort(bySequence);
  const ingested = all.filter((message) => message.status === 'ingested');
  // The message the next drop sends: what is waiting goes first once the circuit is up.
  const next = circuitUp ? waiting[0] || queued[0] || null : queued[0] || null;

  const stations = Object.fromEntries(
    WORKSTATION_LINKS.map((link) => {
      const delivered = ingested.filter((message) => message.deliveries?.[link.to]);
      return [
        link.to,
        {
          count: delivered.length,
          owed: ingested.length - delivered.length,
          last: latest(delivered, (message) => `${message.deliveries[link.to]}|${message.ingested_at || ''}|${order(message)}`),
        },
      ];
    }),
  );

  return {
    queued,
    waiting,
    ingested,
    next,
    atC2oix: queued.length + waiting.length,
    lastIngested: latest(ingested, (message) => `${message.ingested_at || ''}|${order(message)}`),
    stations,
    total: all.length,
  };
};

/** Everything the diagram draws, derived from the link rows, the two servers and the traffic. */
export const deriveTopology = ({ rows, servers, external, circuit, messages }) => {
  const circuitUp = external === 'up';
  const c2oix = servers.c2oix;
  const anchor = servers.local;
  const traffic = deriveTraffic(messages, circuitUp);
  const owedTotal = Object.values(traffic.stations).reduce((sum, station) => sum + station.owed, 0);

  const links = WORKSTATION_LINKS.map((link) => {
    const row = (rows || []).find((item) => item.link_key === link.key);
    return {
      ...link,
      state: row?.state || 'unknown',
      reportedAt: row?.reported_at ? formatZulu(row.reported_at) : '',
      reportedBy: row?.reported_by_name || '',
    };
  });

  const reachable = links.filter((link) => link.state === 'up').length;
  const down = links.filter((link) => link.state === 'down');

  const nodes = {
    c2oix: {
      ...nodeByKey('c2oix'),
      status: circuitUp ? 'up' : 'down',
      statusLabel: circuitUp ? 'Reachable' : 'Unreachable',
      statusNote: circuitUp
        ? ''
        : traffic.waiting.length
          ? `The circuit is down. ${traffic.waiting.length} released ${traffic.waiting.length === 1 ? 'message is' : 'messages are'} waiting here and ${traffic.waiting.length === 1 ? 'has' : 'have'} not been transmitted.`
          : 'The circuit is down, so nothing at this command can reach the C2OIX server.',
      count: {
        label: 'Messages at C2OIX',
        value: traffic.atC2oix,
        note: `${traffic.queued.length} queued · ${traffic.waiting.length} waiting for the circuit`,
        tone: traffic.waiting.length ? 'attention' : 'plain',
      },
      message: shown('Next in queue', traffic.next, '', traffic.atC2oix ? 'Waiting for the circuit' : 'Queue empty'),
      facts: [
        { label: 'Feed', value: c2oix?.feed_active ? 'running' : 'stopped' },
        { label: 'Last beat', value: c2oix?.last_beat_at ? formatZulu(c2oix.last_beat_at) : 'none' },
        { label: 'Reached over', value: circuitUp ? 'the C2OIX circuit' : 'no path — circuit down' },
      ],
    },
    anchor: {
      ...nodeByKey('anchor'),
      status: 'up',
      statusLabel: 'Online',
      statusNote: '',
      count: {
        label: 'Messages at ANCHOR',
        value: traffic.ingested.length,
        note: owedTotal ? `${owedTotal} held for cut-off workstations` : 'All handed on',
        tone: owedTotal ? 'attention' : 'plain',
      },
      message: shown(
        'Last received',
        traffic.lastIngested,
        traffic.lastIngested?.ingested_at ? formatZulu(traffic.lastIngested.ingested_at) : '',
        'Nothing received yet',
      ),
      facts: [
        { label: 'Circuit', value: circuitUp ? 'up' : 'down' },
        { label: 'Workstations reachable', value: `${reachable} of ${links.length}` },
        { label: 'Beats', value: anchor?.beats || 0 },
      ],
    },
  };

  links.forEach((link) => {
    const station = traffic.stations[link.to];
    nodes[link.to] = {
      ...nodeByKey(link.to),
      status: link.state === 'up' ? 'up' : link.state === 'unknown' ? 'unknown' : 'down',
      statusLabel: link.state === 'up' ? 'Connected' : link.state === 'unknown' ? 'Unknown' : 'Offline',
      statusNote:
        link.state === 'down'
          ? 'This workstation cannot reach the ANCHOR server: it shows the server-unavailable banner and holds its work locally.'
          : '',
      count: {
        label: 'Messages here',
        value: station.count,
        note: station.owed ? `${station.owed} waiting at ANCHOR` : 'Up to date',
        tone: station.owed ? 'attention' : 'plain',
      },
      message: shown(
        'Last received',
        station.last,
        station.last ? formatZulu(station.last.deliveries[link.to]) : '',
        'Nothing received yet',
      ),
      facts: [
        { label: 'Reaches ANCHOR', value: link.state === 'up' ? 'yes' : 'no' },
        { label: 'State reported', value: link.reportedAt || '—' },
      ],
    };
  });

  return {
    nodes,
    traffic,
    links,
    down,
    reachable,
    circuitUp,
    circuitLink: {
      key: CIRCUIT_KEY,
      label: circuit?.external_label || 'C2OIX circuit',
      state: circuitUp ? 'up' : 'down',
      reportedAt: circuit?.reported_at ? formatZulu(circuit.reported_at) : '',
      reportedBy: circuit?.reported_by_name || '',
    },
  };
};