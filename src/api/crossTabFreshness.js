import { isSignedOut } from '../utils/logoutState';

export const FRESHNESS_NAMESPACES = Object.freeze({
  MARKETS: 'markets',
  COMMENTS: 'comments',
  INVESTIBLES: 'investibles',
  PRESENCES: 'presences',
  STAGES: 'stages',
  GROUPS: 'groups',
  MEMBERS: 'members',
  NOTIFICATIONS: 'notifications',
  DIFF: 'diff',
  TOKENS: 'tokens',
});

const RELOAD_MESSAGE = 'reloadFromDisk';
const LEADER_REFRESH_METHOD = 'freshness.refresh';
const namespaceValues = Object.freeze(Object.values(FRESHNESS_NAMESPACES));
const knownNamespaces = new Set(namespaceValues);
const writeTails = new Map();
const pendingWrites = new Set();
const reloaders = new Map();
const queuedReloads = new Set();

let freshnessTab;
let localLeaderTab;
let localLeaderRefresh;
let onFullReload;
let reloadPromise;

function validateNamespace(namespace) {
  if (!knownNamespaces.has(namespace)) {
    throw new Error(`Unknown freshness namespace "${namespace}"`);
  }
}

function trackPendingWrite(promise) {
  pendingWrites.add(promise);
  promise.then(
    () => pendingWrites.delete(promise),
    () => pendingWrites.delete(promise),
  );
  return promise;
}

/** Configures the existing tab-election transport for namespace-only notices. */
export function configureFreshnessTab(tab, fullReloadComplete) {
  if (!tab || typeof tab.send !== 'function' || typeof tab.call !== 'function') {
    throw new TypeError('A tab-election Tab with send() and call() is required');
  }
  if (fullReloadComplete && typeof fullReloadComplete !== 'function') {
    throw new TypeError('The full reload callback must be a function');
  }
  if (localLeaderTab && localLeaderTab !== tab) {
    localLeaderTab = undefined;
    localLeaderRefresh = undefined;
  }
  freshnessTab = tab;
  onFullReload = fullReloadComplete;
  return () => {
    if (freshnessTab === tab) {
      freshnessTab = undefined;
      onFullReload = undefined;
    }
  };
}

/** Tells the other tabs to reread one context. No context data is sent. */
export function publishReloadNotice(namespace) {
  validateNamespace(namespace);
  if (!freshnessTab || isSignedOut()) {
    return false;
  }
  try {
    freshnessTab.send({ type: RELOAD_MESSAGE, namespace });
    return true;
  } catch (error) {
    console.warn(`Unable to announce ${namespace} disk reload`, error);
    return false;
  }
}

/**
 * Runs writes for one context in order, then announces each successful durable write.
 * A failed write is logged and does not prevent the next write from running.
 */
export function queuePersistenceWrite(namespace, write) {
  validateNamespace(namespace);
  if (typeof write !== 'function') {
    throw new TypeError('Persistence writes must be functions');
  }
  const previous = writeTails.get(namespace) || Promise.resolve();
  const operation = previous.then(async () => {
    try {
      const result = await write();
      if (result !== false) {
        publishReloadNotice(namespace);
      }
      return result;
    } catch (error) {
      console.warn(`Unable to persist ${namespace} context`, error);
      return false;
    }
  });
  writeTails.set(namespace, operation);
  operation.then(() => {
    if (writeTails.get(namespace) === operation) {
      writeTails.delete(namespace);
    }
  });
  return trackPendingWrite(operation);
}

/** Waits for writes that have already been registered by reducers. */
export async function waitForPendingWrites() {
  while (pendingWrites.size) {
    await Promise.all(Array.from(pendingWrites));
  }
}

/** Registers a provider callback that resolves only after its disk state is installed. */
export function registerNamespaceReloader(namespace, reload) {
  validateNamespace(namespace);
  if (typeof reload !== 'function') {
    throw new TypeError('A namespace reload callback is required');
  }
  reloaders.set(namespace, reload);
  return () => {
    if (reloaders.get(namespace) === reload) {
      reloaders.delete(namespace);
    }
  };
}

function addReload(namespace) {
  validateNamespace(namespace);
  queuedReloads.add(namespace);
  if (namespace === FRESHNESS_NAMESPACES.COMMENTS ||
      namespace === FRESHNESS_NAMESPACES.INVESTIBLES) {
    queuedReloads.add(FRESHNESS_NAMESPACES.COMMENTS);
    queuedReloads.add(FRESHNESS_NAMESPACES.INVESTIBLES);
  }
}

async function runReloads() {
  try {
    let didReload = false;
    let firstError;
    while (queuedReloads.size && !isSignedOut()) {
      const targets = namespaceValues.filter((namespace) => queuedReloads.has(namespace));
      queuedReloads.clear();
      const results = await Promise.allSettled(targets.map((namespace) => {
        const reload = reloaders.get(namespace);
        return reload
          ? reload()
          : Promise.reject(new Error(`No disk reloader registered for ${namespace}`));
      }));
      results.forEach((result) => {
        if (result.status === 'rejected' && !firstError) {
          firstError = result.reason;
        }
      });
      didReload = didReload || results.some((result) => result.status === 'fulfilled');
    }
    if (firstError) {
      throw firstError;
    }
    return didReload;
  } finally {
    reloadPromise = undefined;
  }
}

/** Collapses concurrent requests into one provider-owned disk reload pass. */
export function reloadFromDisk(namespaces) {
  if (isSignedOut()) {
    return Promise.resolve(false);
  }
  (Array.isArray(namespaces) ? namespaces : [namespaces]).forEach(addReload);
  if (!reloadPromise) {
    reloadPromise = runReloads();
  }
  return reloadPromise;
}

export function reloadAllFromDisk() {
  return reloadFromDisk(namespaceValues).then((reloaded) => {
    if (reloaded) {
      onFullReload?.();
    }
    return reloaded;
  });
}

/** Handles only the fixed namespace reload message sent through tab-election. */
export function handleReloadMessage(message) {
  if (!message || message.type !== RELOAD_MESSAGE || !knownNamespaces.has(message.namespace)) {
    return false;
  }
  return reloadFromDisk(message.namespace);
}

/** Exposes the existing leader refresh through tab-election without persistence plumbing. */
export function createLeaderRefreshApi(refresh) {
  if (typeof refresh !== 'function') {
    throw new TypeError('A leader refresh function is required');
  }
  localLeaderTab = freshnessTab;
  localLeaderRefresh = refresh;
  return { freshness: { refresh } };
}

export function invalidateLocalLeaderRefresh(tab) {
  if (!tab || localLeaderTab === tab) {
    localLeaderTab = undefined;
    localLeaderRefresh = undefined;
  }
}

function waitForLeadershipRelease(tab) {
  if (!tab.isLeader) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const handleLeadershipChange = () => {
      if (!tab.isLeader) {
        tab.removeEventListener('leadershipchange', handleLeadershipChange);
        resolve();
      }
    };
    tab.addEventListener('leadershipchange', handleLeadershipChange);
  });
}

function canUseLocalLeaderRefresh(tab) {
  return tab.isLeader && localLeaderTab === tab && !!localLeaderRefresh;
}

export async function requestFreshness(request={}) {
  if (isSignedOut()) {
    return false;
  }
  if (!freshnessTab) {
    throw new Error('No callable freshness Tab is configured');
  }
  if (canUseLocalLeaderRefresh(freshnessTab)) {
    return localLeaderRefresh(request);
  }
  const tab = freshnessTab;
  await waitForLeadershipRelease(tab);
  if (canUseLocalLeaderRefresh(tab)) {
    return localLeaderRefresh(request);
  }
  if (request.reason !== 'push' && request.reason !== 'missingDataPoll') {
    await reloadAllFromDisk()
      .catch((error) => console.warn('Unable to reload follower state before refresh', error));
  }
  if (canUseLocalLeaderRefresh(tab)) {
    return localLeaderRefresh(request);
  }
  return tab.call(LEADER_REFRESH_METHOD, request);
}
