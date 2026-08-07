import _ from 'lodash'
import { getMarketClient } from '../../api/marketLogin'

// B-all-544: notification clears stay GMail style - the row disappears instantly and nothing
// waits on the network. The reducer enqueues every clear durably in state.pendingClears
// (persisted to IndexedDB with the tombstone) and this module delivers them in the background,
// retrying with backoff until the server acknowledges, so a clear can no longer vanish locally
// while the server copy lives on.

export const PENDING_CLEARS_ACKED = 'PENDING_CLEARS_ACKED';

// The reducer cannot dispatch to itself, so the provider registers its dispatch here
export const notificationsDispatchHack = {};

const INITIAL_RETRY_DELAY = 30000;
const MAX_RETRY_DELAY = 300000;

let latestPending = [];
let flushInFlight = false;
let retryTimer = undefined;
let retryDelayMs = INITIAL_RETRY_DELAY;

export function clearsAcked(acked) {
  return {
    type: PENDING_CLEARS_ACKED,
    acked
  };
}

function scheduleRetry() {
  if (retryTimer) {
    return;
  }
  retryTimer = setTimeout(() => {
    retryTimer = undefined;
    flushPendingClears();
  }, retryDelayMs);
  retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY);
}

export function flushPendingClears(pendingClears) {
  if (pendingClears !== undefined) {
    latestPending = pendingClears;
  }
  if (_.isEmpty(latestPending) || flushInFlight) {
    return;
  }
  flushInFlight = true;
  const byMarketAndEvent = _.groupBy(latestPending, (entry) => `${entry.marketId}_${entry.event}`);
  const acked = [];
  let chain = Promise.resolve(true);
  Object.values(byMarketAndEvent).forEach((entries) => {
    const { marketId, event } = entries[0];
    const typeObjectIds = entries.map((entry) => entry.typeObjectId);
    chain = chain.then(() => getMarketClient(marketId)
      .then((client) => event === 'remove' ? client.users.removeNotifications(typeObjectIds)
        : client.users.dehighlightNotifications(typeObjectIds))
      .then(() => acked.push(...entries)));
  });
  function recordAcked() {
    flushInFlight = false;
    latestPending = latestPending.filter((entry) => !acked.includes(entry));
    if (!_.isEmpty(acked) && notificationsDispatchHack.dispatch) {
      notificationsDispatchHack.dispatch(clearsAcked(acked));
    }
  }
  chain.then(() => {
    recordAcked();
    retryDelayMs = INITIAL_RETRY_DELAY;
  }).catch(() => {
    // Whatever was delivered before the failure is acked; the rest waits for the retry
    recordAcked();
    scheduleRetry();
  });
}
