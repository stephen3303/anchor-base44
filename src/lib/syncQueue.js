import moment from 'moment';
import { base44 } from '@/api/base44Client';
import { recordAudit } from './audit';

/**
 * The EMCON queue. Actions that need the network are held on this workstation
 * and replayed when the connection returns — acknowledgements first, because
 * they are the ones with a deadline. Every replay is written to the audit chain.
 */
const KEY = 'anchor.sync.queue';
const EVENT = 'anchor:sync';

export const readQueue = () => {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const writeQueue = (items) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch (error) {
    // Storage unavailable — the queue cannot be held on this workstation.
  }
  window.dispatchEvent(new CustomEvent(EVENT));
};

export const subscribeQueue = (handler) => {
  const listener = () => handler(readQueue());
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
};

export const enqueue = (item) => {
  const row = {
    id: crypto.randomUUID(),
    queued_at: moment.utc().toISOString(),
    attempts: 0,
    last_error: '',
    ...item,
  };
  writeQueue([...readQueue(), row]);
  return row;
};

export const updateItem = (id, patch) =>
  writeQueue(readQueue().map((item) => (item.id === id ? { ...item, ...patch } : item)));

export const removeItem = (id) => writeQueue(readQueue().filter((item) => item.id !== id));

export const SYNC_ORDER = ['acknowledgement', 'annotation'];
const rankOf = (item) => {
  const index = SYNC_ORDER.indexOf(item.operation);
  return index === -1 ? SYNC_ORDER.length : index;
};

/** Acknowledgements first, then the rest in the order they were queued. */
export const orderedForSync = (items) =>
  [...items].sort(
    (a, b) => rankOf(a) - rankOf(b) || moment.utc(a.queued_at).valueOf() - moment.utc(b.queued_at).valueOf(),
  );

/** Replay the queue. Returns one result per item so the screen can report it. */
export const replayQueue = async () => {
  const results = [];
  for (const item of orderedForSync(readQueue())) {
    try {
      if (item.operation === 'acknowledgement') {
        await base44.entities.Acknowledgement.create(item.payload);
      } else {
        throw new Error(`No replay path for ${item.operation}`);
      }
      removeItem(item.id);
      await recordAudit({
        action: 'sync_replayed',
        target_type: 'sync_item',
        target_id: item.id,
        target_reference: item.target_reference || '',
        detail: `${item.label} synchronised after ${item.attempts + 1} attempt(s)`,
      });
      results.push({ id: item.id, label: item.label, ok: true, error: '' });
    } catch (error) {
      const message = String(error?.message || error).slice(0, 200);
      updateItem(item.id, { attempts: item.attempts + 1, last_error: message });
      results.push({ id: item.id, label: item.label, ok: false, error: message });
    }
  }
  return results;
};