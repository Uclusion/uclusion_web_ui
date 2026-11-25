import { FRESHNESS_NAMESPACES, queuePersistenceWrite, waitForPendingWrites } from '../api/crossTabFreshness';

// Only these application records are disposable caches. Auth stores and the
// localStorage blob containing editor drafts must never take this fallback.
export const APPLICATION_CACHE_NAMESPACES = Object.freeze({
  MARKETS: 'market_context',
  COMMENTS: 'comments_context',
  INVESTIBLES: 'investibles',
  PRESENCES: 'market_presences',
  STAGES: 'market_stages',
  GROUPS: 'market_groups',
  MEMBERS: 'group_members',
  NOTIFICATIONS: 'notifications',
  DIFF: 'diff_context',
});

const cacheNamespaces = new Set(Object.values(APPLICATION_CACHE_NAMESPACES));
const unreadableCaches = new Set();
const pendingRebuilds = new Set();
const deferredWrites = new Map();
const listeners = new Set();
let retrying = false;
let writeGeneration = 0;

export function getCacheWriteGeneration() {
  return writeGeneration;
}

export function cancelCacheRecoveryWrites() {
  writeGeneration += 1;
  deferredWrites.clear();
}

function changed() {
  if (!pendingRebuilds.size) {
    retrying = false;
  }
  listeners.forEach((listener) => listener());
}

export function isApplicationCache(namespace, keyspace) {
  return keyspace === 'keyvaluepairs' && cacheNamespaces.has(namespace);
}

export function cacheNeedsRebuild(namespace, error) {
  if (error && !unreadableCaches.has(namespace)) {
    unreadableCaches.add(namespace);
    console.warn(`Unable to read ${namespace} cache; continuing with memory and server data.`, error);
  }
  // Diff history is a best-effort, local last-seen baseline. Like a cold start,
  // an unavailable baseline starts empty; the server cannot recreate it.
  if (namespace !== APPLICATION_CACHE_NAMESPACES.DIFF && !pendingRebuilds.has(namespace)) {
    pendingRebuilds.add(namespace);
    changed();
  }
}

export function cacheWriteSucceeded(namespace) {
  unreadableCaches.delete(namespace);
  // A partial release may have written this cache. Only the full server read
  // and publication can establish that all of its missing data was rebuilt.
}

export function deferRebuildingCacheWrite(namespace, write, generation) {
  if (!pendingRebuilds.has(namespace)) {
    return false;
  }
  if (generation !== writeGeneration) {
    return true;
  }
  // Retain only the latest complete in-memory snapshot. Publishing an early
  // phase to disk would make a new tab mistake a partial rebuild for a warm cache.
  deferredWrites.set(namespace, write);
  return true;
}

export function getVersionCachesToRebuild() {
  return [...pendingRebuilds].filter((namespace) => namespace !== APPLICATION_CACHE_NAMESPACES.NOTIFICATIONS);
}

export function hasPendingCacheRebuild() {
  return pendingRebuilds.size > 0;
}

export async function completeCacheRebuild(namespaces) {
  const generation = writeGeneration;
  // Reducers queue writes before their callbacks run. Drain those callbacks
  // while the namespace is still rebuilding so even queued partial snapshots
  // are deferred, then persist only the last snapshot through the same queue.
  await waitForPendingWrites();
  if (generation !== writeGeneration) {
    return;
  }
  let completed = false;
  namespaces.forEach((namespace) => {
    completed = pendingRebuilds.delete(namespace) || completed;
    const write = deferredWrites.get(namespace);
    if (write) {
      deferredWrites.delete(namespace);
      const key = Object.keys(APPLICATION_CACHE_NAMESPACES)
        .find((name) => APPLICATION_CACHE_NAMESPACES[name] === namespace);
      queuePersistenceWrite(FRESHNESS_NAMESPACES[key], write);
    }
  });
  if (completed) {
    changed();
  }
}

export function cacheRebuildFailed() {
  if (pendingRebuilds.size && !retrying) {
    retrying = true;
    changed();
  }
}

export function getCacheRecoveryStatus() {
  return pendingRebuilds.size ? (retrying ? 'retrying' : 'loading') : 'ready';
}

export function onCacheRecoveryChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
