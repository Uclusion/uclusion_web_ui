import localforage from 'localforage';

class LocalForageHelper {
  namespace;

  constructor(namespace) {
    this.namespace = namespace;
  }

  setState(state) {
    return localforage.setItem(this.namespace, state);
  }

  getState() {
    return localforage.getItem(this.namespace);
  }
}

export default LocalForageHelper;
