import { base44 } from '@/api/base44Client';

/**
 * The two server simulators, called from the screen the same way the app calls any
 * backend function. Every action goes to the server it names — the external C2OIX
 * server or the local ANCHOR server — and returns its answer.
 */
export const c2oix = async (action, payload = {}) => {
  const response = await base44.functions.invoke('c2oixSimulator', { action, ...payload });
  return response?.data || response;
};

export const localServer = async (action, payload = {}) => {
  const response = await base44.functions.invoke('localServerSimulator', { action, ...payload });
  return response?.data || response;
};