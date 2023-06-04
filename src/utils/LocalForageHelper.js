import localforage from 'localforage';
import { isSignedOut } from './userFunctions';

class LocalForageHelper {
  namespace;
  keyspace;

  constructor (namespace, keyspace) {
    this.namespace = namespace;
    if (keyspace) {
      this.keyspace = keyspace;
    } else {
      this.keyspace = 'keyvaluepairs';
    }
  }

  setState (state) {
    if (isSignedOut()) {
      // Do not store when signed out to avoid leaking data
      return Promise.resolve(false);
    }
    return localforage.createInstance({ storeName: this.keyspace }).setItem(this.namespace, state);
  }

  getState () {
    return localforage.createInstance({ storeName: this.keyspace }).getItem(this.namespace)
      .then((state) => {
        return state;
      });
  }
}

export default LocalForageHelper;
