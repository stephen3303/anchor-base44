import { useCallback, useEffect, useState } from 'react';
import { readEmcon, subscribeEmcon, writeEmcon } from '@/lib/emcon';

/** The global EMCON flag, shared by the header, the page frame and every action. */
export default function useEmcon() {
  const [emcon, setEmcon] = useState(readEmcon);

  useEffect(() => subscribeEmcon(setEmcon), []);

  const set = useCallback((on) => {
    writeEmcon(typeof on === 'boolean' ? on : !readEmcon());
  }, []);

  return [emcon, set];
}