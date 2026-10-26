import { useCallback, useEffect, useState } from 'react';
import {
  isOffline,
  probeLocalServer,
  readCircuit,
  readLinks,
  reportCircuit,
  startLinkMonitor,
  subscribeLinks,
} from '@/lib/connectivity';

/**
 * Both links at the command, live: the command server (measured) and the C2OIX
 * circuit (held on the command server). The monitor itself is started once and
 * shared, so every screen that asks reads the same state.
 */
export default function useConnectivity() {
  const [links, setLinks] = useState(readLinks);
  const [circuit, setCircuit] = useState(readCircuit);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeLinks((next) => {
      setLinks(next.links);
      setCircuit(next.circuit);
    });
    startLinkMonitor();
    return unsubscribe;
  }, []);

  const checkLocal = useCallback(async () => {
    setChecking(true);
    try {
      return await probeLocalServer();
    } finally {
      setChecking(false);
    }
  }, []);

  const report = useCallback(async (up, note) => {
    setBusy(true);
    try {
      return await reportCircuit({ up, note });
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    local: links.local,
    external: links.external,
    browser: links.browser,
    checkedAt: links.checked_at,
    circuit,
    offline: isOffline(),
    localUp: links.local !== 'down',
    checking,
    busy,
    checkLocal,
    report,
  };
}