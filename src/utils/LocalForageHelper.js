import localforage from 'localforage';
import { isSignedOut } from './logoutState';
import { cacheNeedsRebuild, cacheWriteSucceeded, deferRebuildingCacheWrite,
  getCacheWriteGeneration, isApplicationCache } from './applicationCacheRecovery';

class LocalForageHelper {
  namespace;
  keyspace;

  constructor (namespace, keyspace) {
    this.namespace = namespace;
    this.writeGeneration = getCacheWriteGeneration();
    if (keyspace) {
      this.keyspace = keyspace;
    } else {
      this.keyspace = 'keyvaluepairs';
    }
  }

  setState (state) {
    if (isSignedOut()) {
      console.warn('Storing state when signed out')
      // Do not store when signed out to avoid leaking data
      return Promise.resolve(false);
    }
    if (isApplicationCache(this.namespace, this.keyspace) &&
        deferRebuildingCacheWrite(this.namespace, () => this.setState(state), this.writeGeneration)) {
      return Promise.resolve(false);
    }
    return localforage.createInstance({ storeName: this.keyspace }).setItem(this.namespace, state).then((stored) => {
      if (isApplicationCache(this.namespace, this.keyspace)) {
        cacheWriteSucceeded(this.namespace);
      }
      return stored;
    });
  }

  deleteState() {
    return localforage.createInstance({ storeName: this.keyspace }).removeItem(this.namespace);
  }

  getStoredState() {
    const applicationCache = isApplicationCache(this.namespace, this.keyspace);
    return localforage.createInstance({ storeName: this.keyspace }).getItem(this.namespace).then((stored) => {
      if (applicationCache && stored == null) {
        cacheNeedsRebuild(this.namespace);
        return undefined;
      }
      return stored;
    }).catch((error) => {
      if (!applicationCache) {
        throw error;
      }
      cacheNeedsRebuild(this.namespace, error);
      return undefined;
    });
  }

  getState(existingState) {
    if (existingState && !existingState.initializing) {
      return Promise.resolve(existingState);
    }
    return this.getStoredState()
      .catch((error) => {
        console.error('Error reading local forage');
        console.error(error);
        // https://github.com/ionic-team/cordova-plugin-ionic-webview/issues/354
        window.location.reload();
      });
  }
}

export default LocalForageHelper;
