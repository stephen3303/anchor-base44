import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import {
  C2OIX_FUNCTION,
  LOCAL,
  callPeer,
  clip,
  ensureServer,
  nowIso,
  patchServer,
} from "../../shared/simTraffic.ts";

/**
 * The local ANCHOR server simulator.
 *
 * It heartbeats the external C2OIX server, ingests what is handed to it, and holds
 * every released message that has to leave the command until the circuit is back.
 * On reconnect it asks the external server for the whole deferred backlog, ingests
 * it, and then starts pushing the held releases for transmit.
 *
 * Actions: status, heartbeat, connect, disconnect, tick, receive, drain, reset.
 */

const SERVER = LOCAL;

const reportLocalStatus = async (base44) => {
  const row = await ensureServer(base44, SERVER);
  const held = await base44.asServiceRole.entities.SimTransmission.count({ status: "held" });
  return { ok: true, server: row, held, at: nowIso() };
};

/** The local server beating the circuit: it calls the external server and reports the result. */
const beatLink = async (base44) => {
  const row = await ensureServer(base44, SERVER);
  const started = Date.now();
  let peerOk = true;
  let failure = "";

  try {
    await callPeer(base44, C2OIX_FUNCTION, { action: "heartbeat" });
  } catch (error) {
    peerOk = false;
    failure = clip(String(error?.message || error), 200);
  }

  const latency = Date.now() - started;
  const at = nowIso();
  const patch = {
    last_beat_at: at,
    beats: (row.beats || 0) + 1,
    peer_state: peerOk ? "up" : "down",
    peer_beat_at: at,
    peer_latency_ms: latency,
    last_error: peerOk ? "" : failure,
  };
  // A beat that fails while the server believes it is connected means the circuit dropped.
  if (!peerOk && row.online !== false) patch.online = false;

  const updated = await patchServer(base44, SERVER, patch);
  return { ok: true, server: updated, online: updated.online !== false, peer_ok: peerOk, latency };
};

/** Record messages as received and held on the command server. */
const ingest = async (base44, ids) => {
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (!unique.length) return 0;
  const { items } = await base44.asServiceRole.entities.SimMessage.filter({ id: { $in: unique } }, { limit: 200 });
  const at = nowIso();
  const patches = (items || []).map((message) => ({
    id: message.id,
    status: "ingested",
    ingested_at: at,
    dispatched_at: message.dispatched_at || at,
    last_error: "",
  }));
  if (!patches.length) return 0;
  await base44.asServiceRole.entities.SimMessage.bulkUpdate(patches);
  return patches.length;
};

/** One message handed over by the external server. */
const ingestInbound = async (base44, body) => {
  const messageId = typeof body?.message_id === "string" ? body.message_id : "";
  if (!messageId) return { error: "No message supplied" };
  const ingested = await ingest(base44, [messageId]);
  if (!ingested) return { error: "Message not held by the repository" };
  const row = await ensureServer(base44, SERVER);
  await patchServer(base44, SERVER, { received: (row.received || 0) + 1, note: "Message ingested" });
  return { ok: true, ingested, at: nowIso() };
};

/** Everything the external server held while this server was away. */
const pullBacklog = async (base44) => {
  try {
    const payload = await callPeer(base44, C2OIX_FUNCTION, { action: "backlog" });
    const items = payload?.items || [];
    const ingested = await ingest(base44, items.map((message) => message.id));
    return { requested: items.length, ingested };
  } catch (error) {
    return { requested: 0, ingested: 0, error: clip(String(error?.message || error), 200) };
  }
};

/** Every released message is held for transmit until the external server takes it. */
const queueReleased = async (base44) => {
  const { items: released } = await base44.asServiceRole.entities.DraftMessage.filter(
    { draft_status: "released" },
    { sort: "-released_at", limit: 50 },
  );
  const { items: known } = await base44.asServiceRole.entities.SimTransmission.list({ limit: 200 });
  const seen = new Set((known || []).map((row) => row.draft_id));
  const fresh = (released || []).filter((draft) => !seen.has(draft.id));
  if (!fresh.length) return 0;

  await base44.asServiceRole.entities.SimTransmission.bulkCreate(
    fresh.map((draft) => ({
      draft_id: draft.id,
      reference: `${draft.message_type || "MSG"} ${draft.msn || ""}`.trim(),
      subject: draft.subject || "",
      precedence: draft.precedence || "ROUTINE",
      released_at: draft.released_at || "",
      released_by_name: draft.released_by_name || "",
      rendered_text: draft.rendered_text || draft.body_text || "",
      status: "held",
      attempts: 0,
    })),
  );
  return fresh.length;
};

/** Push what is held up to the external server for transmit. */
const pushHeld = async (base44) => {
  const { items } = await base44.asServiceRole.entities.SimTransmission.filter(
    { status: "held" },
    { sort: "created_date", limit: 50 },
  );
  let transmitted = 0;
  for (const item of items || []) {
    try {
      const payload = await callPeer(base44, C2OIX_FUNCTION, {
        action: "receive",
        transmission: { draft_id: item.draft_id, reference: item.reference, subject: item.subject },
      });
      await base44.asServiceRole.entities.SimTransmission.update(item.id, {
        status: "transmitted",
        transmitted_at: nowIso(),
        receipt: payload?.receipt || "",
        attempts: (item.attempts || 0) + 1,
        last_error: "",
      });
      transmitted += 1;
    } catch (error) {
      await base44.asServiceRole.entities.SimTransmission.update(item.id, {
        attempts: (item.attempts || 0) + 1,
        last_error: clip(String(error?.message || error), 200),
      });
    }
  }
  return transmitted;
};

/** Reconnect: heartbeat, take the whole deferred backlog, then transmit what is held. */
const reconnect = async (base44, body, user) => {
  await ensureServer(base44, SERVER);
  await patchServer(base44, SERVER, {
    online: true,
    note: clip(body?.note, 120) || "Reconnected by the operator",
    updated_by_name: user?.full_name || user?.email || "",
  });

  const beat = await beatLink(base44);
  if (!beat.peer_ok) {
    return { ...beat, ok: false, error: "The C2OIX server did not answer the heartbeat" };
  }

  const backlog = await pullBacklog(base44);
  const queued = await queueReleased(base44);
  const pushed = await pushHeld(base44);
  return { ...beat, ok: true, backlog, queued, pushed };
};

const disconnectLink = async (base44, body, user) => {
  await ensureServer(base44, SERVER);
  const row = await patchServer(base44, SERVER, {
    online: false,
    note: clip(body?.note, 120) || "Disconnected by the operator",
    updated_by_name: user?.full_name || user?.email || "",
  });
  return { ok: true, server: row, online: false };
};

/** Beat, hold anything newly released, and transmit it when the circuit is up. */
const tickLocal = async (base44) => {
  const beat = await beatLink(base44);
  const queued = await queueReleased(base44);
  if (!beat.online) return { ...beat, queued, pushed: 0, held: true };
  const pushed = await pushHeld(base44);
  return { ...beat, queued, pushed };
};

const drain = async (base44) => {
  const queued = await queueReleased(base44);
  const pushed = await pushHeld(base44);
  return { ok: true, queued, pushed };
};

const clearQueue = async (base44) => {
  await base44.asServiceRole.entities.SimTransmission.deleteMany({});
  await patchServer(base44, SERVER, {
    beats: 0,
    received: 0,
    online: true,
    note: "Queue cleared",
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

    if (action === "status") return Response.json(await reportLocalStatus(base44));
    if (action === "heartbeat") return Response.json(await beatLink(base44));
    if (action === "connect") return Response.json(await reconnect(base44, body, user));
    if (action === "disconnect") return Response.json(await disconnectLink(base44, body, user));
    if (action === "tick") return Response.json(await tickLocal(base44));
    if (action === "drain") return Response.json(await drain(base44));
    if (action === "reset") return Response.json(await clearQueue(base44));

    if (action === "receive") {
      const result = await ingestInbound(base44, body);
      return Response.json(result, { status: result.error ? 400 : 200 });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}