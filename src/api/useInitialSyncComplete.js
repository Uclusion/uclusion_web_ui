import { useEffect, useRef, useState } from 'react';
import { registerListener } from '../utils/MessageBusUtils';
import { INITIAL_SYNC_COMPLETE, isInitialSyncComplete, SYNC_STATUS_CHANNEL } from './syncStatus';

// the bus replaces same-name listeners, and components like Screen mount many
// instances, so every hook instance registers under its own name
let instanceCounter = 0;

/**
 * B-all-570: reactive view of the sync layer's initial-sync convergence flag, so
 * expensive always-mounted components can stay dormant during a cold load.
 */
export function useInitialSyncComplete(listenerBaseName) {
  const [complete, setComplete] = useState(isInitialSyncComplete());
  const instanceRef = useRef(undefined);
  if (instanceRef.current === undefined) {
    instanceCounter += 1;
    instanceRef.current = `${listenerBaseName}-${instanceCounter}`;
  }
  const listenerName = instanceRef.current;
  useEffect(() => {
    registerListener(SYNC_STATUS_CHANNEL, listenerName, (data) => {
      const { payload: { event } } = data;
      if (event === INITIAL_SYNC_COMPLETE) {
        setComplete(true);
      }
    });
    // the flag can flip between first render and this effect - the message is gone but
    // the module flag is authoritative
    if (isInitialSyncComplete()) {
      setComplete(true);
    }
    return () => {};
  }, [listenerName]);
  return complete;
}
