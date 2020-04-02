import localforage from 'localforage';

class LocalForageHelper {
  namespace;

  constructor(namespace) {
    // // console.debug(namespace);
    this.namespace = namespace;
  }

  setState(state) {
    // // console.debug(`Storing state to disk for namespace ${this.namespace}`);
    // // console.debug(state);
    return localforage.setItem(this.namespace, state);
  }

  getState() {
    // // console.debug(`Getting state from disk for namespace ${this.namespace}`);
    return localforage.getItem(this.namespace)
      .then((state) => {
        // // console.debug(state);
        return state;
      });
  }
}

export default LocalForageHelper;
