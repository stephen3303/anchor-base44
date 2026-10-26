/**
 * EMCON is a global mode, not a destination: one flag on the workstation, read
 * by the header, the page frame and every action that needs the network.
 *
 * It is honest graceful degradation, not offline storage: traffic already
 * received stays readable, acknowledgements queue locally, and network-only
 * actions are disabled with a reason.
 */
const KEY = 'anchor.emcon';
const EVENT = 'anchor:emcon';

export const readEmcon = () => {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch (error) {
    return false;
  }
};

export const writeEmcon = (on) => {
  try {
    window.localStorage.setItem(KEY, on ? '1' : '0');
  } catch (error) {
    // Storage unavailable: the mode still applies for this session.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: Boolean(on) }));
};

export const subscribeEmcon = (handler) => {
  const listener = (event) => handler(Boolean(event.detail));
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
};