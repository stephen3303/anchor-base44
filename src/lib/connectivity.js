import moment from 'moment';
import { base44 } from '@/api/base44Client';
import { recordAudit } from './audit';

/**
 * The command has two links, and the portal reports them separately.
 *
 *   Command server — the server at this command that holds the message database.
 *     Its state is measured, not assumed: a periodic read against it, together with
 *     the browser's own network state. While it is up, everything works.
 *
 *   C2OIX circuit — the external link that carries traffic in and out of the
 *     command. While it is down the command is in Offline mode: the command server
 *     is still up, so work continues, and anything that has to leave the command is
 *     held until the circuit is restored.
 *
 * The circuit state is held on the command server itself (one row), so every
 * workstation at the command reads the same state rather than each deciding its own.
 */

const LOCAL_KEY = 'anchor.link.local';
const EVENT = 'anchor:links';
const PROBE_INTERVAL_MS = 30000;

const readStoredLocal = () => {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw === 'up' || raw === 'down' ? raw : 'unknown';
  } catch (error) {
    return 'unknown';
  }
};

let links = {
  local: readStoredLocal(),
  external: 'up',
  browser: typeof navigator === 'undefined' ? true : navigator.onLine,
  checked_at: '',
};

let circuit = null;
let started = false;
let probing = false;
const listeners = new Set();

const publish = () => {
  listeners.forEach((listener) => listener({ links: { ...links }, circuit }));
};

const setLocal = (state) => {
  if (links.local === state) return;
  links = { ...links, local: state, checked_at: moment.utc().toISOString() };
  try {
    window.localStorage.setItem(LOCAL_KEY, state);
  } catch (error) {
    // Storage unavailable — the state still holds for this session.
  }
  publish();
};

/** The circuit is down whenever the circuit is reported down, or there is no network at all. */
const applyExternal = () => {
  const external = circuit && circuit.external_up && links.browser ? 'up' : 'down';
  if (links.external === external) return;
  links = { ...links, external };
  publish();
};

export const readLinks = () => ({ ...links });

export const readCircuit = () => circuit;

/** Offline mode: the C2OIX circuit is down, or the command server cannot be reached. */
export const isOffline = () => links.external !== 'up' || links.local === 'down';

export const subscribeLinks = (handler) => {
  listeners.add(handler);
  return () => listeners.delete(handler);
};

/**
 * Measure the command server. A response means the server answered; a refusal on
 * permission still means it answered, so only a transport failure is a down link.
 */
export const probeLocalServer = async () => {
  if (probing) return links.local === 'up';
  probing = true;
  try {
    await base44.entities.CommandSetting.list({ limit: 1 });
    setLocal('up');
    return true;
  } catch (error) {
    const status = error?.status || error?.response?.status;
    const answered = status === 401 || status === 403;
    setLocal(answered ? 'up' : 'down');
    return answered;
  } finally {
    probing = false;
  }
};

/** Read the command's circuit row, creating it on first use. */
export const loadCircuit = async () => {
  const page = await base44.entities.LinkState.list({ sort: '-created_date', limit: 1 });
  let row = (page?.items || [])[0];
  if (!row) {
    await base44.entities.LinkState.create({ external_up: true });
    // Two workstations may create a row at the same time; both then adopt the newest.
    const settled = await base44.entities.LinkState.list({ sort: '-created_date', limit: 1 });
    row = (settled?.items || [])[0];
  }
  circuit = row || null;
  applyExternal();
  publish();
  return circuit;
};

/** The watch reports the circuit: it is a link state, not a policy, so any user may report it. */
export const reportCircuit = async ({ up, note }) => {
  if (!circuit) await loadCircuit();
  const now = moment.utc().toISOString();
  const me = await base44.auth.me();
  const updated = await base44.entities.LinkState.update(circuit.id, {
    external_up: Boolean(up),
    note: (note || '').trim(),
    reported_at: now,
    reported_by_name: me?.full_name || me?.email || '',
    reported_by_email: me?.email || '',
  });
  circuit = updated;
  applyExternal();
  publish();
  await recordAudit({
    action: 'link_reported',
    target_type: 'link',
    target_id: updated.id,
    target_reference: updated.external_label || 'C2OIX circuit',
    detail: up
      ? `Circuit reported up${updated.note ? ` — ${updated.note}` : ''}. Transmission resumed.`
      : `Circuit reported down${updated.note ? ` — ${updated.note}` : ''}. Offline mode: work continues, transmission is held.`,
  });
  return updated;
};

/** Start the monitor once per session, however many screens ask for it. */
export const startLinkMonitor = () => {
  if (started) return;
  started = true;

  probeLocalServer();
  loadCircuit().catch(() => {
    // The circuit row cannot be read without the command server; the state stays as last known.
  });

  window.setInterval(() => {
    if (navigator.onLine) probeLocalServer();
  }, PROBE_INTERVAL_MS);

  window.addEventListener('online', () => {
    links = { ...links, browser: true };
    applyExternal();
    publish();
    probeLocalServer();
    loadCircuit().catch(() => {});
  });

  window.addEventListener('offline', () => {
    links = { ...links, browser: false };
    setLocal('down');
    applyExternal();
  });
};