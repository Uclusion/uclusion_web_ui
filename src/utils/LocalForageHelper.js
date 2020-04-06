import localforage from 'localforage';

class LocalForageHelper {
  namespace;
  keyspace;

  constructor(namespace, keyspace) {
    // // console.debug(namespace);
    this.namespace = namespace;
    if (keyspace) {
      this.keyspace = keyspace;
    } else {
      this.keyspace = 'keyvaluepairs';
    }
  }

  setState(state) {
    // // console.debug(`Storing state to disk for namespace ${this.namespace}`);
    // // console.debug(state);
    return localforage.createInstance({storeName: this.keyspace}).setItem(this.namespace, state);
  }

  getState() {
    // // console.debug(`Getting state from disk for namespace ${this.namespace}`);
    return localforage.createInstance({storeName: this.keyspace}).getItem(this.namespace)
      .then((state) => {
        // // console.debug(state);
        return state;
      });
  }
}

export default LocalForageHelper;
