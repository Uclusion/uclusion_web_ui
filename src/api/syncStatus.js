import { pushMessage } from '../utils/MessageBusUtils';

// B-all-570: the sync layer owns the "still chunking" fact and broadcasts it, so expensive
// always-mounted UI (NavigationChevrons and friends) can stay dormant during a cold load
// instead of recomputing on every arriving market and starving the sync of CPU. Initial
// sync is complete once syncing has caught up, which versionedFetchUtils decides because it
// owns the cycle, push and notification state that depends on
// (https://stage.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/Q-Marketing-258 O-4).
// Lives in its own module so helpers the sync pipeline itself imports (marketsContextHelper)
// can read the flag without an import cycle.
export const SYNC_STATUS_CHANNEL = 'SyncStatusChannel';
export const INITIAL_SYNC_COMPLETE = 'initial_sync_complete';
let initialSyncComplete = false;

export function isInitialSyncComplete() {
  return initialSyncComplete;
}

export function markInitialSyncComplete() {
  if (initialSyncComplete) {
    return;
  }
  initialSyncComplete = true;
  pushMessage(SYNC_STATUS_CHANNEL, { event: INITIAL_SYNC_COMPLETE });
}

export function markDiskAdoptionComplete(marketDetails) {
  if (marketDetails?.length) {
    markInitialSyncComplete();
  }
}
