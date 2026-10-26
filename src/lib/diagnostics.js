import moment from 'moment';
import { isOffline, readCircuit, readLinks } from './connectivity';
import { readQueue } from './syncQueue';
import { recordAudit } from './audit';

/**
 * Fault capture, for a deployed unit.
 *
 * A watchstander cannot debug the portal, and shore side cannot see the
 * workstation. So every fault is turned into a *statement*: one plain-text block
 * that carries what failed, where, for whom, and the exact state of the links and
 * the build at the moment it failed. The statement is what gets passed to the
 * supporting activity — copied, saved as a text file, or read over the phone.
 *
 * The statement is deliberately self-contained and plain text: it must survive
 * being pasted into a message, printed, or typed out.
 *
 * The full statement is never filed on the command server — only a one-line
 * summary, because the audit row is a fixed size. The statement itself is the
 * deliverable; the audit entry says a fault happened and names its reference.
 */

/** Which release is at fault. Bump `release` and `build` when the portal ships. */
export const BUILD = {
  product: 'ANCHOR',
  release: '1.0.0-pilot',
  build: '2026.10',
};

const STORE_KEY = 'anchor.faults.log';
const MAX_FAULTS = 40;
const MAX_DETAIL = 1600;
const MAX_STACK_LINES = 14;

const listeners = new Set();
let identity = null;
let captureInstalled = false;
let faults = readStored();

function readStored() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeStored() {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(faults));
  } catch (error) {
    // Storage unavailable — the log still holds for this session.
  }
}

const publish = () => listeners.forEach((listener) => listener([...faults]));

/** Who is at the keyboard. Remembered from the signed-in session so a statement can still name them when the server is down. */
export const rememberIdentity = (user) => {
  if (!user) return;
  identity = {
    name: user.full_name || user.email || '',
    email: user.email || '',
    role: user.role || '',
    duty: user.duty || user.position || '',
    command: user.unit || '',
  };
};

export const readFaults = () => [...faults];

export const subscribeFaults = (handler) => {
  listeners.add(handler);
  return () => listeners.delete(handler);
};

export const clearFaults = () => {
  faults = [];
  writeStored();
  publish();
};

export const updateFault = (id, patch) => {
  faults = faults.map((fault) => (fault.id === id ? { ...fault, ...patch } : fault));
  writeStored();
  publish();
  return faults.find((fault) => fault.id === id) || null;
};

const statusOf = (error) =>
  error?.status || error?.response?.status || error?.data?.status || null;

const SCREEN_FAULT = {
  kind: 'screen',
  meaning:
    'This screen stopped drawing itself, so it cannot be used until it is reloaded. The rest of the portal is unaffected.',
  guidance: 'Reload the screen, or move to another screen and come back. If it stops in the same place again, send this statement.',
};

const REPORTED_FAULT = {
  kind: 'reported',
  meaning: 'Reported by the operator: the portal did something wrong without stopping.',
  guidance: 'The state below is what the workstation looked like when the report was made.',
};

/** What the fault means for the watch, in plain words — not a stack trace. */
export const describeFault = (error) => {
  const status = statusOf(error);

  if (status === 401) {
    return {
      kind: 'credential',
      meaning: 'The command server refused the session, so this action could not be authorised.',
      guidance: 'Sign in again, then repeat the action. If it repeats immediately, send this statement.',
    };
  }
  if (status === 403) {
    return {
      kind: 'permission',
      meaning: 'The command server answered, but refused this action for this account.',
      guidance: 'Check the account’s role and duties. The statement names the account and the screen.',
    };
  }
  if (status === 404) {
    return {
      kind: 'missing',
      meaning: 'The record or address this action needed is not on the command server.',
      guidance: 'Reload the screen. If the record should exist, send this statement — it names the address that was asked for.',
    };
  }
  if (status === 409 || status === 422 || status === 400) {
    return {
      kind: 'rejected',
      meaning: 'The command server answered, but refused the contents of this action.',
      guidance: 'Check the entry for a required or malformed field, then try again.',
    };
  }
  if (status === 429) {
    return {
      kind: 'throttled',
      meaning: 'The command server refused the request as too frequent and asked the workstation to wait.',
      guidance: 'Wait a moment and repeat the action once.',
    };
  }
  if (status >= 500) {
    return {
      kind: 'server',
      meaning: 'The command server answered with an internal error, so the action did not complete.',
      guidance: 'Repeat the action once. If it fails again, send this statement — the detail below is what the server returned.',
    };
  }
  if (!status) {
    return {
      kind: 'link',
      meaning: 'The command server did not answer, so this action could not be completed and nothing was recorded.',
      guidance: 'Check the local ANCHOR server under Connectivity and transmission, then repeat the action.',
    };
  }
  return {
    kind: 'unknown',
    meaning: 'The portal stopped on an unexpected condition and could not complete this action.',
    guidance: 'Repeat the action once. If it fails again, send this statement.',
  };
};

const SEVERITY = {
  screen: 'Screen fault — the page stopped drawing',
  link: 'Link fault — the command server did not answer',
  credential: 'Credential fault — the session was refused',
  permission: 'Permission fault — the action was refused for this account',
  missing: 'Missing record or address',
  rejected: 'Rejected contents — the command server refused the data',
  throttled: 'Throttled — the command server refused the request rate',
  server: 'Server fault — the command server answered with an error',
  reported: 'Reported by the operator',
  unknown: 'Unexpected fault',
};

const safeJson = (value) => {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    return text && text.length > MAX_DETAIL ? `${text.slice(0, MAX_DETAIL)}… [truncated]` : text || '';
  } catch (error) {
    return String(value ?? '');
  }
};

const captureContext = () => {
  const links = readLinks();
  const circuit = readCircuit();
  let held = 0;
  try {
    held = readQueue().length;
  } catch (error) {
    held = 0;
  }
  return {
    local: links.local,
    local_checked_at: links.checked_at || '',
    external: links.external,
    browser_online: links.browser,
    offline: isOffline(),
    circuit_label: circuit?.external_label || 'C2OIX circuit',
    circuit_up: circuit?.external_up,
    circuit_reported_at: circuit?.reported_at || '',
    circuit_reported_by: circuit?.reported_by_name || '',
    circuit_note: circuit?.note || '',
    held,
  };
};

const captureWorkstation = () => ({
  release: `${BUILD.product} ${BUILD.release} (build ${BUILD.build})`,
  mode: import.meta.env?.MODE || 'unknown',
  browser: typeof navigator === 'undefined' ? '' : navigator.userAgent,
  platform: typeof navigator === 'undefined' ? '' : navigator.platform,
  viewport:
    typeof window === 'undefined'
      ? ''
      : `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio || 1}x`,
  locale: typeof navigator === 'undefined' ? '' : navigator.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  location: typeof window === 'undefined' ? '' : window.location.href,
});

const makeReference = (at) =>
  `ERR-${moment.utc(at).format('YYMMDD-HHmm')}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

const makeFault = ({ kind, meaning, guidance, name, message, source, doing, status, code, detail, stack }) => {
  const at = moment.utc().toISOString();
  const fault = {
    id: `${at}-${Math.random().toString(16).slice(2, 8)}`,
    reference: makeReference(at),
    at,
    source,
    where: typeof window === 'undefined' ? '' : window.location.pathname,
    doing: doing || '',
    kind,
    meaning,
    guidance,
    name,
    message,
    status,
    code: code || '',
    detail: detail || '',
    stack: stack || '',
    context: captureContext(),
    workstation: captureWorkstation(),
    filed_at: '',
    filed_reference: '',
  };
  faults = [fault, ...faults].slice(0, MAX_FAULTS);
  writeStored();
  publish();
  return fault;
};

/**
 * Record one fault. Returns the fault so the caller can render its statement
 * straight away — the boundary does exactly that.
 */
export const recordFault = (error, options = {}) => {
  const described =
    options.source === 'screen' ? SCREEN_FAULT : describeFault(error);

  return makeFault({
    kind: described.kind,
    meaning: described.meaning,
    guidance: described.guidance,
    name: error?.name || 'Error',
    message: typeof error === 'string' ? error : error?.message || String(error ?? ''),
    status: statusOf(error),
    code: error?.code || error?.data?.code || '',
    detail: error?.data ? safeJson(error.data) : safeJson(error?.details || ''),
    stack: typeof error?.stack === 'string' ? error.stack : '',
    source: options.source || 'runtime',
    doing: options.doing || '',
  });
};

/** A fault the watchstander reports by hand: something wrong that did not stop the portal. */
export const recordOperatorReport = (description) =>
  makeFault({
    ...REPORTED_FAULT,
    name: 'Operator report',
    message: (description || '').trim(),
    source: 'operator',
    doing: '',
  });

const wrap = (text, width = 68, indent = '  ') => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const out = [];
  let line = '';
  words.forEach((word) => {
    if (`${line} ${word}`.trim().length > width) {
      if (line) out.push(indent + line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  });
  if (line) out.push(indent + line);
  return out.length ? out : [indent];
};

const field = (label, value) => `${`  ${label}`.padEnd(24)}${value}`;

const timeLine = (iso) => (iso ? moment.utc(iso).format('YYYY-MM-DD HH:mm:ss[Z]') : 'not recorded');

/**
 * Build the statement: the plain-text block that is sent to shore side.
 * Everything shore side needs is in here, and nothing it does not.
 */
export const buildStatement = (fault) => {
  const context = fault.context || {};
  const workstation = fault.workstation || {};
  const operator = identity;
  const lines = [];
  const rule = '='.repeat(72);

  lines.push(rule);
  lines.push('ANCHOR FAULT STATEMENT');
  lines.push(rule);
  lines.push(field('REFERENCE', fault.reference));
  lines.push(
    field(
      'RECORDED',
      `${moment.utc(fault.at).format('YYYY-MM-DD HH:mm:ss[Z]')}  (${moment(fault.at).format('YYYY-MM-DD HH:mm:ss ZZ')} ${workstation.timezone || ''})`,
    ),
  );
  lines.push(field('SEVERITY', SEVERITY[fault.kind] || SEVERITY.unknown));
  lines.push(field('SOURCE', fault.source));

  lines.push('');
  lines.push('WHAT THIS MEANS');
  lines.push(...wrap(fault.meaning));
  if (fault.guidance) lines.push(...wrap(fault.guidance));

  lines.push('');
  lines.push('WHERE IT HAPPENED');
  lines.push(field('SCREEN', fault.where || 'not recorded'));
  lines.push(field('ACTION', fault.doing || 'not stated by the operator'));
  lines.push(
    field(
      'OPERATOR',
      operator
        ? `${operator.name} <${operator.email}>${operator.role ? ` — role ${operator.role}` : ''}${operator.duty ? `, ${operator.duty}` : ''}`
        : 'not identified on this workstation',
    ),
  );
  if (operator?.command) lines.push(field('COMMAND', operator.command));

  lines.push('');
  lines.push('THE FAILURE');
  lines.push(field('TYPE', fault.name || 'not recorded'));
  lines.push(field('STATUS', fault.status ? `HTTP ${fault.status}` : 'no HTTP status returned'));
  lines.push(field('MESSAGE', fault.message || '(no message)'));
  if (fault.code) lines.push(field('CODE', fault.code));
  if (fault.detail) {
    lines.push('  DETAIL');
    lines.push(...wrap(fault.detail, 66, '    '));
  }
  if (fault.stack) {
    lines.push('  STACK');
    fault.stack
      .split('\n')
      .slice(0, MAX_STACK_LINES)
      .forEach((row) => lines.push(`    ${row.trim()}`));
    const more = fault.stack.split('\n').length - MAX_STACK_LINES;
    if (more > 0) lines.push(`    … ${more} further frames`);
  }

  lines.push('');
  lines.push('STATE AT THE MOMENT');
  lines.push(
    field(
      'LOCAL ANCHOR SERVER',
      `${context.local === 'down' ? 'NOT AVAILABLE' : context.local === 'up' ? 'connected' : 'not measured'} (last checked ${timeLine(context.local_checked_at)})`,
    ),
  );
  lines.push(
    field(
      'C2OIX CIRCUIT',
      `${context.circuit_up ? 'up' : 'DOWN'} (reported ${timeLine(context.circuit_reported_at)}${context.circuit_reported_by ? ` by ${context.circuit_reported_by}` : ''})`,
    ),
  );
  if (context.circuit_note) lines.push(field('CIRCUIT NOTE', context.circuit_note));
  lines.push(field('BROWSER NETWORK', context.browser_online ? 'online' : 'offline'));
  lines.push(field('OFFLINE MODE', context.offline ? 'yes' : 'no'));
  lines.push(field('HELD FOR CIRCUIT', `${context.held || 0} action${context.held === 1 ? '' : 's'}`));

  lines.push('');
  lines.push('WORKSTATION');
  lines.push(field('RELEASE', `${workstation.release} · ${workstation.mode}`));
  lines.push(field('BROWSER', workstation.browser || 'not recorded'));
  lines.push(field('PLATFORM', workstation.platform || 'not recorded'));
  lines.push(field('VIEWPORT', workstation.viewport || 'not recorded'));
  lines.push(field('LOCALE', `${workstation.locale || ''} / ${workstation.timezone || ''}`));
  lines.push(field('ADDRESS', workstation.location || 'not recorded'));

  const earlier = faults.filter((row) => row.id !== fault.id).slice(0, 5);
  if (earlier.length) {
    lines.push('');
    lines.push('EARLIER FAULTS ON THIS WORKSTATION');
    earlier.forEach((row) =>
      lines.push(`  ${moment.utc(row.at).format('DD MMM HH:mm:ss[Z]')}  ${row.reference}  ${row.kind}  ${row.where}`),
    );
  }

  lines.push('');
  lines.push('SEND THIS TO SHORE SIDE');
  lines.push(
    ...wrap(
      'Copy or save this statement and pass it to the supporting activity by whatever channel the command has. It carries the screen, the exact failure and the state of both links at the time, which is what is needed to reproduce and fix it.',
    ),
  );
  if (fault.filed_reference) {
    lines.push('');
    lines.push(
      ...wrap(
        `A summary of this fault is on the command server audit log under reference ${fault.filed_reference}.`,
      ),
    );
  }
  lines.push(rule);
  lines.push('END OF STATEMENT');
  lines.push(rule);

  return lines.join('\n');
};

/**
 * File a summary of the fault on the command server, so the audit chain records
 * that it happened even if the statement never leaves the workstation.
 * The full statement is too long for an audit row; only the summary is filed.
 */
export const fileFault = async (fault) => {
  const summary = [
    `${fault.reference} — ${fault.kind} fault`,
    fault.meaning,
    `screen ${fault.where}`,
    fault.status ? `HTTP ${fault.status}` : '',
    fault.message ? `“${fault.message.slice(0, 120)}”` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return recordAudit({
    action: 'system_fault',
    target_type: 'fault',
    target_id: fault.id,
    target_reference: fault.reference,
    detail: summary,
  });
};

/** Catch what React cannot: uncaught script errors and failed background actions. */
export const installFaultCapture = () => {
  if (captureInstalled || typeof window === 'undefined') return;
  captureInstalled = true;

  const recentDuplicate = (message) => {
    const newest = faults[0];
    return Boolean(newest && newest.message === message && moment.utc().diff(moment.utc(newest.at), 'seconds') < 3);
  };

  window.addEventListener('error', (event) => {
    if (!event?.error) return;
    if (recentDuplicate(event.error.message || '')) return;
    recordFault(event.error, { source: 'uncaught', doing: 'Uncaught script error on this screen' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const message = reason?.message || String(reason ?? '');
    if (recentDuplicate(message)) return;
    recordFault(reason, { source: 'unhandled rejection', doing: 'A background action failed with no handler' });
  });
};