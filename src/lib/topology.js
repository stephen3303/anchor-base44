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
    detail: 'Outside the command. Holds the repository of traffic and releases it over the circuit when an operator sends it.',
  },
  {
    key: 'anchor',
    kind: 'server',
    code: 'ANCHOR',
    name: 'Local ANCHOR server',
    detail: 'At this command. Serves every workstation with the message database and the audit chain.',
  },
  { key: 'ws1', kind: 'client', code: 'WS-01', name: 'Watch Officer workstation', detail: 'Watch floor.' },
  { key: 'ws2', kind: 'client', code: 'WS-02', name: 'Commanding Officer workstation', detail: 'Commanding Officer.' },
  { key: 'ws3', kind: 'client', code: 'WS-03', name: 'Radio workstation', detail: 'Radio room.' },
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

/**
 * Everything the diagram draws, derived from the link rows, the two servers and the
 * traffic the simulators are holding.
 *
 * Every node carries two pipes: what arrives, and what leaves. "Waiting" is what the
 * node holds right now; "processed" is the running total since the simulators were
 * reset. A pipe is live only while the link that carries it is up.
 */
export const deriveTopology = ({ rows, servers, external, circuit, traffic }) => {
  const circuitUp = external === 'up';
  const c2oix = servers.c2oix;
  const anchor = servers.local;

  const queued = traffic?.queued || 0;
  const deferred = traffic?.deferred || 0;
  const ingested = traffic?.ingested || 0;
  const held = traffic?.held || 0;
  const transmitted = traffic?.transmitted || 0;
  // Everything still sitting in the C2OIX repository, awaiting delivery to this command.
  const inboundPending = queued + deferred;

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
      statusNote: circuitUp ? '' : 'The circuit is down, so nothing at this command can reach the C2OIX server.',
      pipes: {
        // Traffic bound for this command: held here until the circuit can carry it, counted
        // as processed only once the ANCHOR server has ingested it.
        inbound: { waiting: inboundPending, processed: ingested, live: circuitUp },
        // What the command sends up. The external server takes it on arrival, so nothing
        // ever waits outbound here — it is delivered the moment it is transmitted.
        outbound: { waiting: 0, processed: transmitted, live: circuitUp },
      },
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
      pipes: {
        inbound: { waiting: 0, processed: ingested, live: circuitUp },
        outbound: { waiting: held, processed: transmitted, live: circuitUp },
      },
      facts: [
        { label: 'Circuit', value: circuitUp ? 'up' : 'down' },
        { label: 'Workstations reachable', value: `${reachable} of ${links.length}` },
        { label: 'Beats', value: anchor?.beats || 0 },
        { label: 'Messages received', value: anchor?.received || 0 },
      ],
    },
  };

  links.forEach((link) => {
    const linkUp = link.state === 'up';
    nodes[link.to] = {
      ...nodeByKey(link.to),
      status: linkUp ? 'up' : link.state === 'unknown' ? 'unknown' : 'down',
      statusLabel: linkUp ? 'Connected' : link.state === 'unknown' ? 'Unknown' : 'Offline',
      statusNote: linkUp
        ? ''
        : link.state === 'down'
          ? 'This workstation cannot reach the ANCHOR server, so it receives nothing from it: it shows the server-unavailable banner and holds its work locally.'
          : 'No reading yet, so what this workstation is receiving is not known.',
      pipes: {
        // The ANCHOR server can only hand traffic to a workstation it can reach. Cut off,
        // the workstation receives nothing, so it counts none of the command's traffic.
        inbound: { waiting: 0, processed: linkUp ? ingested : 0, live: linkUp },
        outbound: { waiting: 0, processed: 0, live: linkUp },
      },
      facts: [
        { label: 'Reaches ANCHOR', value: linkUp ? 'yes' : 'no' },
        { label: 'State reported', value: link.reportedAt || '—' },
      ],
    };
  });

  return {
    nodes,
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