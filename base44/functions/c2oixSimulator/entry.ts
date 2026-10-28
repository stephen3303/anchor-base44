import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import {
  C2OIX,
  LOCAL,
  LOCAL_FUNCTION,
  SIM_TRAFFIC,
  AUDIT_FUNCTION,
  callPeer,
  circuitDown,
  clip,
  ensureServer,
  messageCounts,
  nowIso,
  patchServer,
  randomIntervalMs,
  serverRow,
  splitList,
} from "../../shared/simTraffic.ts";

/**
 * The external C2OIX server simulator.
 *
 * It holds a repository of example messages and hands them to the local server at
 * random intervals. When the local server is not reachable the message is not lost:
 * it is held here as deferred, and handed over when the local server asks for the
 * backlog on reconnect.
 *
 * Actions: status, heartbeat, seed, feed, tick, drop, backlog, receive, reset.
 */

const SERVER = C2OIX;
/** One handover per tick, so arrivals trickle in rather than arrive in a block. */
const MAX_PER_TICK = 1;
/** The most an operator can force out in one press. */
const MAX_PER_DROP = 10;

const nextDue = async (base44) => {
  const { items } = await base44.asServiceRole.entities.SimMessage.filter(
    { status: "queued" },
    { sort: "scheduled_for", limit: 5 },
  );
  return (items || []).find((message) => message.scheduled_for) || null;
};

const reportExternalStatus = async (base44) => {
  const row = await ensureServer(base44, SERVER);
  return { ok: true, server: row, counts: await messageCounts(base44), next: await nextDue(base44), at: nowIso() };
};

/** The external server answering a beat from the local server. */
const beatExternal = async (base44) => {
  const row = await ensureServer(base44, SERVER);
  const updated = await patchServer(base44, SERVER, {
    online: true,
    last_beat_at: nowIso(),
    beats: (row.beats || 0) + 1,
    last_error: "",
  });
  return { ok: true, server: updated, at: updated.last_beat_at, beats: updated.beats };
};

/** Load the example repository. `force` replaces whatever is held. */
const seed = async (base44, body) => {
  const force = Boolean(body?.force);
  const existing = await base44.asServiceRole.entities.SimMessage.count();
  if (existing > 0 && !force) {
    return { ok: true, seeded: 0, total: existing, skipped: "repository already loaded" };
  }
  if (existing > 0) await base44.asServiceRole.entities.SimMessage.deleteMany({});

  const rows = SIM_TRAFFIC.map((message, index) => ({
    sequence: index + 1,
    reference: message.reference,
    dtg: message.dtg,
    precedence: message.precedence,
    classification: message.classification,
    originator: message.originator,
    action_addressees: splitList(message.action_addressees),
    info_addressees: splitList(message.info_addressees),
    communities: message.communities,
    subject: message.subject,
    body: message.body,
    size_kb: message.size_kb,
    status: "queued",
    scheduled_for: "",
    attempts: 0,
    last_error: "",
  }));
  await base44.asServiceRole.entities.SimMessage.bulkCreate(rows);
  await patchServer(base44, SERVER, { feed_active: true, note: "Example traffic loaded — feed running" });
  return { ok: true, seeded: rows.length, total: rows.length };
};

const feed = async (base44, body) => {
  const active = body?.active !== false;
  const row = await patchServer(base44, SERVER, {
    feed_active: active,
    note: active ? "Feed started" : "Feed stopped",
  });
  if (body?.audit) {
    await audit(base44, active ? "C2OIX automatic feed started." : "C2OIX automatic feed stopped; traffic moves only when an operator drops it.");
  }
  return { ok: true, server: row };
};

/**
 * Record an operator's hand on the simulator in the audit chain. Written here, on
 * the server, so the action cannot happen without its record; a failed write is
 * reported back rather than undoing what was done.
 */
const audit = async (base44, detail) => {
  try {
    await callPeer(base44, AUDIT_FUNCTION, {
      action: "traffic_released",
      target_type: "simulator",
      target_reference: "C2OIX server",
      detail,
    });
    return true;
  } catch (error) {
    return false;
  }
};

/** Give every unscheduled message an arrival time, spread over random intervals. */
const schedule = async (base44) => {
  const { items } = await base44.asServiceRole.entities.SimMessage.filter(
    { status: "queued" },
    { sort: "sequence", limit: 100 },
  );
  const pending = (items || []).filter((message) => !message.scheduled_for);
  if (!pending.length) return 0;
  let cursor = Date.now();
  const patches = pending.map((message) => {
    cursor += randomIntervalMs();
    return { id: message.id, scheduled_for: new Date(cursor).toISOString() };
  });
  await base44.asServiceRole.entities.SimMessage.bulkUpdate(patches);
  return patches.length;
};

/** Beat, then hand over whatever is due — or hold it if the local server is down. */
const tickExternal = async (base44) => {
  const beat = await beatExternal(base44);
  const row = await serverRow(base44, SERVER);
  if (row && row.online === false) return { ...beat, skipped: "server stopped" };
  if (!row || row.feed_active === false) return { ...beat, skipped: "feed stopped" };

  const scheduled = await schedule(base44);

  const { items } = await base44.asServiceRole.entities.SimMessage.filter(
    { status: "queued", scheduled_for: { $lte: nowIso() } },
    { sort: "scheduled_for", limit: MAX_PER_TICK + 4 },
  );
  // Judged the same way as a drop, so the feed never sends while the command reports the circuit down.
  const down = await circuitDown(base44);
  // With the circuit up, anything still waiting here goes before new traffic.
  const { items: waiting } = down
    ? { items: [] }
    : await base44.asServiceRole.entities.SimMessage.filter({ status: "deferred" }, { sort: "sequence", limit: MAX_PER_TICK });
  const due = (waiting || []).length
    ? waiting.slice(0, MAX_PER_TICK)
    : (items || []).filter((message) => message.scheduled_for).slice(0, MAX_PER_TICK);
  let handed = 0;
  let deferred = 0;

  for (const message of due) {
    const outcome = await handOver(base44, message, down, "Local server not reachable — held at C2OIX");
    if (outcome === "handed") handed += 1;
    if (outcome === "held") deferred += 1;
  }

  return { ...beat, scheduled, handed, deferred, due: due.length, counts: await messageCounts(base44) };
};

/**
 * Hand one message to the local server, or hold it here as deferred when the local
 * server cannot take it. The message is read again first: if a drop and the feed
 * both picked it, the second one finds it gone and leaves it alone.
 * Returns "handed", "held" or "skipped".
 */
const handOver = async (base44, picked, peerDown, heldReason) => {
  const { items: fresh } = await base44.asServiceRole.entities.SimMessage.filter({ id: picked.id }, { limit: 1 });
  const message = (fresh || [])[0];
  if (!message || message.status !== picked.status) return "skipped";
  const attempts = (message.attempts || 0) + 1;
  const at = nowIso();
  if (peerDown) {
    await base44.asServiceRole.entities.SimMessage.update(message.id, {
      status: "deferred",
      attempts,
      attempted_at: at,
      last_error: heldReason,
    });
    return "held";
  }
  try {
    await callPeer(base44, LOCAL_FUNCTION, { action: "receive", message_id: message.id });
    // The local server has recorded it as ingested; this only notes the handover.
    await base44.asServiceRole.entities.SimMessage.update(message.id, {
      attempts,
      attempted_at: at,
      dispatched_at: at,
      last_error: "",
    });
    return "handed";
  } catch (error) {
    await base44.asServiceRole.entities.SimMessage.update(message.id, {
      status: "deferred",
      attempts,
      attempted_at: at,
      last_error: clip(String(error?.message || error), 200),
    });
    return "held";
  }
};

/**
 * The operator forcing C2OIX to send the next messages now, whatever their schedule.
 *
 * With the circuit up, what is waiting here goes first, then the queue in order.
 * With the circuit down, the next queued messages are released but cannot leave:
 * they are held here as deferred, waiting for the circuit, and go when the local
 * server reconnects and asks for the backlog.
 *
 * Driving the queue by hand stops the automatic feed, so nothing moves between
 * the operator's clicks.
 */
const drop = async (base44, body) => {
  const count = Number(body?.count);
  if (!Number.isInteger(count) || count < 1 || count > MAX_PER_DROP) {
    return { error: `Drop between 1 and ${MAX_PER_DROP} messages` };
  }
  const row = await ensureServer(base44, SERVER);
  const feedStopped = row.feed_active !== false;
  if (feedStopped) await patchServer(base44, SERVER, { feed_active: false, note: "Feed stopped — driven by hand" });
  const down = await circuitDown(base44);
  const { items } = await base44.asServiceRole.entities.SimMessage.filter(
    { status: { $in: down ? ["queued"] : ["deferred", "queued"] } },
    { sort: "sequence", limit: 100 },
  );
  const rank = (message) => (message.status === "deferred" ? 0 : 1);
  const next = (items || [])
    .sort((a, b) => rank(a) - rank(b) || (a.sequence || 0) - (b.sequence || 0))
    .slice(0, count);

  let handed = 0;
  let held = 0;
  const refs = [];
  for (const message of next) {
    const outcome = await handOver(base44, message, down, "Circuit down — released and held at C2OIX");
    if (outcome === "skipped") continue;
    refs.push(message.reference);
    if (outcome === "handed") handed += 1;
    else held += 1;
  }
  const released = handed + held;
  const plural = (n) => `${n} ${n === 1 ? "message" : "messages"}`;

  const audited = await audit(
    base44,
    !released
      ? "Drop requested; nothing left in the C2OIX queue."
      : down
        ? `C2OIX forced to release ${plural(released)} (${refs.join(", ")}) with the circuit down; held at C2OIX, not transmitted.`
        : `C2OIX forced to send ${plural(released)} (${refs.join(", ")}): ${handed} handed to the ANCHOR server${held ? `, ${held} held at C2OIX` : ""}.`,
  );

  return {
    ok: true,
    requested: count,
    released,
    handed,
    held,
    circuit: down ? "down" : "up",
    feed_stopped: feedStopped,
    audited,
    counts: await messageCounts(base44),
    at: nowIso(),
  };
};

/** Everything held while the local server was away. */
const backlog = async (base44) => {
  const { items } = await base44.asServiceRole.entities.SimMessage.filter(
    { status: "deferred" },
    { sort: "scheduled_for", limit: 100 },
  );
  const rows = items || [];
  return { ok: true, items: rows, count: rows.length, at: nowIso() };
};

/** Accept a released message transmitted up from the local server, and receipt it. */
const acceptTransmission = async (base44, body) => {
  const transmission = body?.transmission || {};
  const draftId = typeof transmission.draft_id === "string" ? transmission.draft_id : "";
  if (!draftId) return { error: "No transmission supplied" };

  const row = await ensureServer(base44, SERVER);
  const serial = (row.received || 0) + 1;
  await patchServer(base44, SERVER, { received: serial, last_beat_at: nowIso() });
  return {
    ok: true,
    receipt: `C2OIX-${String(serial).padStart(4, "0")}-${Date.now().toString(36).toUpperCase()}`,
    reference: clip(transmission.reference, 80),
    accepted_at: nowIso(),
  };
};

const clearRepository = async (base44) => {
  await base44.asServiceRole.entities.SimMessage.deleteMany({});
  await patchServer(base44, SERVER, {
    feed_active: false,
    online: true,
    beats: 0,
    received: 0,
    note: "Repository cleared",
    last_error: "",
  });
  return { ok: true, cleared: true };
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "status";

    if (action === "status") return Response.json(await reportExternalStatus(base44));
    if (action === "heartbeat") return Response.json(await beatExternal(base44));
    if (action === "seed") {
      const result = await seed(base44, body);
      if (body?.audit && result.seeded) {
        await audit(base44, `Example traffic reloaded: ${result.seeded} messages queued at C2OIX.`);
      }
      return Response.json(result);
    }
    if (action === "feed") return Response.json(await feed(base44, body));
    if (action === "tick") return Response.json(await tickExternal(base44));
    if (action === "drop") {
      const result = await drop(base44, body);
      return Response.json(result, { status: result.error ? 400 : 200 });
    }
    if (action === "backlog") return Response.json(await backlog(base44));
    if (action === "reset") return Response.json(await clearRepository(base44));

    if (action === "receive") {
      const result = await acceptTransmission(base44, body);
      return Response.json(result, { status: result.error ? 400 : 200 });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}