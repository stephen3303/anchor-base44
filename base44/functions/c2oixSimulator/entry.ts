import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import {
  C2OIX,
  LOCAL,
  LOCAL_FUNCTION,
  SIM_TRAFFIC,
  callPeer,
  clip,
  ensureServer,
  messageCounts,
  nowIso,
  patchServer,
  serverRow,
  splitList,
} from "../../shared/simTraffic.ts";

/**
 * The external C2OIX server simulator.
 *
 * It holds a repository of example messages and hands the next one to the local
 * server only when an operator releases it — a beat never releases traffic. When
 * the local server is not reachable the message is not lost: it is held here as
 * deferred, and handed over when the local server asks for the backlog on reconnect.
 *
 * Actions: status, heartbeat, seed, feed, tick, release, backlog, receive, reset.
 */

const SERVER = C2OIX;

/** The next message waiting in the repository, in the order it was loaded. */
const nextQueued = async (base44) => {
  const { items } = await base44.asServiceRole.entities.SimMessage.filter(
    { status: "queued" },
    { sort: "sequence", limit: 1 },
  );
  return (items || [])[0] || null;
};

const reportExternalStatus = async (base44) => {
  const row = await ensureServer(base44, SERVER);
  return { ok: true, server: row, counts: await messageCounts(base44), next: await nextQueued(base44), at: nowIso() };
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
  return { ok: true, server: row };
};

/** Hand one message to the local server; hold it here as deferred if it cannot take it. */
const handOver = async (base44, message, peer) => {
  const attempts = (message.attempts || 0) + 1;
  const at = nowIso();
  if (!peer || peer.online === false) {
    await base44.asServiceRole.entities.SimMessage.update(message.id, {
      status: "deferred",
      attempts,
      attempted_at: at,
      last_error: "Local server not reachable — held at C2OIX",
    });
    return "deferred";
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
    return "deferred";
  }
};

/** The beat. Handover is a release by the operator, never a beat. */
const tickExternal = async (base44) => {
  const beat = await beatExternal(base44);
  return { ...beat, handed: 0, deferred: 0 };
};

/** One message released by the operator: the next in the repository. */
const releaseExternal = async (base44, user) => {
  const row = await ensureServer(base44, SERVER);
  if (row.online === false) return { ok: false, error: "The C2OIX server is stopped" };
  if (row.feed_active === false) return { ok: false, error: "The C2OIX feed is stopped" };

  const message = await nextQueued(base44);
  if (!message) {
    return { ok: true, released: 0, deferred: 0, note: "Nothing is queued at C2OIX", counts: await messageCounts(base44) };
  }

  const outcome = await handOver(base44, message, await serverRow(base44, LOCAL));
  await patchServer(base44, SERVER, {
    last_beat_at: nowIso(),
    note:
      outcome === "handed"
        ? `Released ${message.reference} to the local server`
        : `Held ${message.reference} — the local server is not reachable`,
    updated_by_name: user?.full_name || user?.email || "",
  });

  return {
    ok: true,
    released: outcome === "handed" ? 1 : 0,
    deferred: outcome === "deferred" ? 1 : 0,
    message: { reference: message.reference, subject: message.subject, precedence: message.precedence },
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
    if (action === "seed") return Response.json(await seed(base44, body));
    if (action === "feed") return Response.json(await feed(base44, body));
    if (action === "tick") return Response.json(await tickExternal(base44));
    if (action === "release") return Response.json(await releaseExternal(base44, user));
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