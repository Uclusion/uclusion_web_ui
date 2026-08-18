import { pushMessage } from '../utils/MessageBusUtils';

// B-all-570: the sync layer owns the "still chunking" fact and broadcasts it, so expensive
// always-mounted UI (NavigationChevrons and friends) can stay dormant during a cold load
// instead of recomputing on every arriving market and starving the sync of CPU. Initial
// sync is complete on the first cycle that finds zero dirty markets, or as a fallback after
// three consecutive cycles stuck at the same dirty count (permanently unsatisfiable
// signatures must not hide the UI forever). Lives in its own module so helpers the sync
// pipeline itself imports (marketsContextHelper) can read the flag without an import cycle.
export const SYNC_STATUS_CHANNEL = 'SyncStatusChannel';
export const INITIAL_SYNC_COMPLETE = 'initial_sync_complete';
let initialSyncComplete = false;
let lastDirtyCount = -1;
let stableDirtyCycles = 0;

export function isInitialSyncComplete() {
  return initialSyncComplete;
}

export function recordInitialSyncCycle(dirtyMarketCount) {
  if (initialSyncComplete || dirtyMarketCount === undefined || dirtyMarketCount === true) {
    return;
  }
  if (dirtyMarketCount === 0) {
    initialSyncComplete = true;
  } else if (dirtyMarketCount === lastDirtyCount) {
    stableDirtyCycles += 1;
    if (stableDirtyCycles >= 3) {
      console.warn(`Initial sync stuck at ${dirtyMarketCount} dirty markets - declaring complete`);
      initialSyncComplete = true;
    }
  } else {
    lastDirtyCount = dirtyMarketCount;
    stableDirtyCycles = 0;
  }
  if (initialSyncComplete) {
    pushMessage(SYNC_STATUS_CHANNEL, { event: INITIAL_SYNC_COMPLETE });
  }
}
