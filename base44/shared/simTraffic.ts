/**
 * The two server simulators, and the example traffic the external one serves.
 *
 *   C2OIX server  — the external server. It holds a repository of example messages
 *                   and hands them over at random intervals, the way live traffic
 *                   arrives: never on the hour, never in a block.
 *   Local server  — the ANCHOR server at this command. It heartbeats the external
 *                   server, ingests what is handed over, and holds everything that
 *                   has to leave the command until the circuit is back.
 *
 * Both write through the service role: they stand in for machines, not people.
 */

export const C2OIX = "c2oix";
export const LOCAL = "local";

export const C2OIX_FUNCTION = "c2oixSimulator";
export const LOCAL_FUNCTION = "localServerSimulator";

export const SERVER_LABEL = {
  [C2OIX]: "C2OIX server",
  [LOCAL]: "Local ANCHOR server",
};

/** Arrivals are spread across this window, so no two land together. */
export const INTERVAL_MIN_MS = 20000;
export const INTERVAL_MAX_MS = 180000;

export const nowIso = () => new Date().toISOString();

export const randomIntervalMs = () =>
  INTERVAL_MIN_MS + Math.floor(Math.random() * (INTERVAL_MAX_MS - INTERVAL_MIN_MS));

export const splitList = (value) =>
  (Array.isArray(value) ? value : String(value || "").split(","))
    .map((entry) => String(entry).trim())
    .filter(Boolean);

export const clip = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** The row that carries one simulated server's state, created on first use. */
export const serverRow = async (base44, server) => {
  const { items } = await base44.asServiceRole.entities.SimServer.filter({ server }, { limit: 1 });
  return (items || [])[0] || null;
};

export const ensureServer = async (base44, server, patch = {}) => {
  const existing = await serverRow(base44, server);
  if (existing) return existing;
  return base44.asServiceRole.entities.SimServer.create({
    server,
    label: SERVER_LABEL[server],
    online: true,
    feed_active: false,
    beats: 0,
    received: 0,
    ...patch,
  });
};

export const patchServer = async (base44, server, patch) => {
  const row = await ensureServer(base44, server);
  return base44.asServiceRole.entities.SimServer.update(row.id, patch);
};

/**
 * One simulator calling the other. The response is unwrapped and a refusal is
 * raised as an error, so a caller can treat "the other server did not take it"
 * as a plain failure — which is what holds a message or a transmission back.
 */
export const callPeer = async (base44, functionName, payload) => {
  const response = await base44.functions.invoke(functionName, payload);
  const body = response?.data || response;
  if (body?.error) throw new Error(body.error);
  return body;
};

/** The three workstations the local server serves, and the link that reaches each. */
export const WORKSTATIONS = [
  { key: "ws1", link: "anchor-ws1" },
  { key: "ws2", link: "anchor-ws2" },
  { key: "ws3", link: "anchor-ws3" },
];

/**
 * Whether the circuit between the two servers is down. Either the local server has
 * been disconnected or the command has reported the circuit down: in both cases
 * nothing leaves C2OIX.
 */
export const circuitDown = async (base44) => {
  const local = await serverRow(base44, LOCAL);
  if (local && local.online === false) return true;
  const { items } = await base44.asServiceRole.entities.LinkState.list({ sort: "-created_date", limit: 1 });
  const state = (items || [])[0];
  return Boolean(state && state.external_up === false);
};

/**
 * The local server handing what it has ingested on to each workstation whose link
 * is up. A workstation that is cut off gets nothing; what it is owed waits on the
 * local server and goes the moment its link is back.
 */
export const deliverToWorkstations = async (base44) => {
  const { items: links } = await base44.asServiceRole.entities.NetworkLink.list({ limit: 50 });
  const reachable = WORKSTATIONS.filter(
    (station) => (links || []).find((row) => row.link_key === station.link)?.state !== "down",
  );
  if (!reachable.length) return 0;

  const { items } = await base44.asServiceRole.entities.SimMessage.filter(
    { status: "ingested" },
    { sort: "ingested_at", limit: 200 },
  );
  const at = nowIso();
  const patches = [];
  for (const message of items || []) {
    const deliveries = { ...(message.deliveries || {}) };
    const owed = reachable.filter((station) => !deliveries[station.key]);
    if (!owed.length) continue;
    owed.forEach((station) => {
      deliveries[station.key] = at;
    });
    patches.push({ id: message.id, deliveries });
  }
  if (patches.length) await base44.asServiceRole.entities.SimMessage.bulkUpdate(patches);
  return patches.length;
};

/** The repository counted by where each message has got to. */
export const messageCounts = async (base44) => {
  const [queued, deferred, ingested] = await Promise.all([
    base44.asServiceRole.entities.SimMessage.count({ status: "queued" }),
    base44.asServiceRole.entities.SimMessage.count({ status: "deferred" }),
    base44.asServiceRole.entities.SimMessage.count({ status: "ingested" }),
  ]);
  return { queued, deferred, ingested, total: queued + deferred + ingested };
};

/**
 * The repository of example messages held by the external server. Written in the
 * setline and paragraph form the portal reads, so a handover is a whole message
 * and not a fragment.
 */
export const SIM_TRAFFIC = [
  {
    reference: "CSL-2614-0187",
    dtg: "260842ZOCT26",
    precedence: "PRIORITY",
    classification: "UNCLASSIFIED",
    originator: "COMSUBLANT NORFOLK VA",
    action_addressees: "COMSUBRON TWO, COMSUBRON SIX, SUBRON EIGHT",
    info_addressees: "COMSUBFOR, COMSUBPAC",
    communities: "OPS, ADMIN",
    size_kb: 4.2,
    subject: "SUBMARINE READINESS REPORTING SCHEDULE CHANGE",
    body: "1. Effective 01 NOV 26, unit readiness reports are due to this headquarters by 1200Z each Monday.\n2. Reports submitted after 1200Z will be carried in the following rollup.\n3. Commanding officers are responsible for the accuracy of the data submitted under this schedule.",
  },
  {
    reference: "CSF-2614-0092",
    dtg: "260915ZOCT26",
    precedence: "IMMEDIATE",
    classification: "CONFIDENTIAL",
    originator: "COMSUBFOR NORFOLK VA",
    action_addressees: "COMSUBLANT NORFOLK VA, COMSUBPAC PEARL HARBOR HI",
    info_addressees: "COMUSFLTFORCOM",
    communities: "OPS",
    size_kb: 3.1,
    subject: "EXERCISE TASKING SERIAL TWO FOUR SEVEN",
    body: "1. Units named in REF A will report material readiness for the serial not later than 48 hours before the underway date.\n2. Any unit unable to meet the serial is to advise this headquarters by the fastest means available.\n3. This serial is a graded event.",
  },
  {
    reference: "CSL-2614-0191",
    dtg: "261103ZOCT26",
    precedence: "ROUTINE",
    classification: "UNCLASSIFIED",
    originator: "COMSUBLANT NORFOLK VA",
    action_addressees: "ALL SUBMARINE UNITS",
    info_addressees: "COMSUBFOR",
    communities: "ADMIN",
    size_kb: 2.4,
    subject: "MANDATORY TRAINING REPORTING FOR NOVEMBER",
    body: "1. November training completion is reported through the command training system not later than 30 NOV 26.\n2. Departments with open items will be scheduled for a review with the training officer.\n3. Direct questions to the command training officer.",
  },
  {
    reference: "NVA-2614-0455",
    dtg: "261330ZOCT26",
    precedence: "ROUTINE",
    classification: "UNCLASSIFIED",
    originator: "NAVIFOR NORFOLK VA",
    action_addressees: "ALL NAVY INSTALLATIONS",
    info_addressees: "OPNAV",
    communities: "ADMIN",
    size_kb: 5.6,
    subject: "ANNUAL INFORMATION ASSURANCE TRAINING REQUIREMENT",
    body: "1. All hands are to complete the annual information assurance training before 31 DEC 26.\n2. Completion is recorded automatically when the course is finished in the learning system.\n3. Supervisors will confirm completion for personnel on leave or temporary duty.",
  },
  {
    reference: "CSF-2614-0098",
    dtg: "261545ZOCT26",
    precedence: "FLASH",
    classification: "UNCLASSIFIED",
    originator: "COMSUBFOR NORFOLK VA",
    action_addressees: "COMSUBLANT NORFOLK VA, COMSUBPAC PEARL HARBOR HI, SUBRON EIGHT",
    info_addressees: "COMUSFLTFORCOM, OPNAV",
    communities: "OPS",
    size_kb: 1.9,
    subject: "SEVERE WEATHER ADVISORY FOR NORFOLK OPERATING AREA",
    body: "1. A tropical system is forecast to affect the Norfolk operating area within 72 hours.\n2. Units in port will complete heavy weather mooring before 1200Z 27 OCT 26.\n3. Units at sea will report position and material condition on the next scheduled report.",
  },
  {
    reference: "CSL-2614-0203",
    dtg: "261820ZOCT26",
    precedence: "ROUTINE",
    classification: "UNCLASSIFIED",
    originator: "COMSUBLANT NORFOLK VA",
    action_addressees: "COMSUBRON TWO",
    info_addressees: "COMSUBFOR",
    communities: "ADMIN, SUPPLY",
    size_kb: 3.8,
    subject: "SPARE PARTS REQUIREMENT VALIDATION",
    body: "1. The consolidated spare parts requirement for the fourth quarter is enclosed by reference.\n2. Units will validate quantities and return corrections not later than 05 NOV 26.\n3. Requirements not validated by that date will be carried forward without change.",
  },
  {
    reference: "CSP-2614-0311",
    dtg: "262040ZOCT26",
    precedence: "PRIORITY",
    classification: "UNCLASSIFIED",
    originator: "COMSUBPAC PEARL HARBOR HI",
    action_addressees: "ALL SUBMARINE UNITS",
    info_addressees: "COMSUBFOR, COMSUBLANT NORFOLK VA",
    communities: "SUPPLY",
    size_kb: 4.4,
    subject: "SUPPLY ROUTING CHANGE FOR PACIFIC UNITS",
    body: "1. Effective 01 NOV 26, routine supply requisitions for Pacific units route through the Pearl Harbor supply center.\n2. Requisitions already in the system are not affected.\n3. Units will report any requisition held more than 30 days to the supply officer.",
  },
  {
    reference: "NVA-2614-0461",
    dtg: "262210ZOCT26",
    precedence: "ROUTINE",
    classification: "UNCLASSIFIED",
    originator: "NAVIFOR NORFOLK VA",
    action_addressees: "ALL NAVY INSTALLATIONS",
    info_addressees: "OPNAV",
    communities: "ADMIN",
    size_kb: 2.9,
    subject: "PERSONNEL TRANSFER CYCLE GUIDANCE",
    body: "1. Transfer orders for the summer cycle will be issued beginning 01 FEB 27.\n2. Commands will review the projected rotation list and report discrepancies to the detailer.\n3. Requests for relief by name are not considered under this cycle.",
  },
  {
    reference: "CSF-2614-0104",
    dtg: "262355ZOCT26",
    precedence: "IMMEDIATE",
    classification: "UNCLASSIFIED",
    originator: "COMSUBFOR NORFOLK VA",
    action_addressees: "COMSUBLANT NORFOLK VA",
    info_addressees: "COMSUBPAC PEARL HARBOR HI",
    communities: "OPS",
    size_kb: 2.1,
    subject: "ARRIVAL REPORT REQUIRED FOR RETURNING UNITS",
    body: "1. Units returning from tasking will submit an arrival report within four hours of mooring.\n2. The report will state material condition, personnel status and any outstanding maintenance.\n3. Significant discrepancies will be carried in the next readiness rollup.",
  },
  {
    reference: "CSL-2614-0212",
    dtg: "270130ZOCT26",
    precedence: "ROUTINE",
    classification: "UNCLASSIFIED",
    originator: "COMSUBLANT NORFOLK VA",
    action_addressees: "ALL SUBMARINE UNITS",
    info_addressees: "COMSUBFOR",
    communities: "ADMIN",
    size_kb: 3.3,
    subject: "COMMAND INSPECTION SCHEDULE SECOND QUARTER",
    body: "1. The inspection schedule for the second quarter is published by reference.\n2. Commands will confirm receipt and report any conflict within ten days.\n3. Inspection teams will arrive the evening before the scheduled date.",
  },
];