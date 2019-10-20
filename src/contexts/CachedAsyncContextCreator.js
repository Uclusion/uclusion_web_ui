import React from 'react';
import localforage from "localforage";

/**
 * Cached async contexts allow a bridge from the indexDB
 * to the props/mutated context variables that react is expecting.
 * Essentially the context makes sure that when the underlying storage index is updated
 * that a variable that is understood by react is also updated.
 * Renders should be written to use the values in the variable, instead of the results
 * of the getter functions.
 * @param contextNamespace
 * @param emptyState
 * @returns {{getState: (function(): Promise<any | never>), setStateValues: (function(*): Promise<* | never>), context: React.Context<{getState: (function(): Promise<{}>), setStateValues: (function(): Promise<{}>), stateModifierWrapper: (function(): Promise<{}>), setState: (function(): Promise<{}>), clearState: (function(): Promise<{}>), stateCache: *}>, setState: (function(*=): Promise<*>), clearState: (function(): Promise<void>), stateCache: *, addStateCache: addStateCache}}
 */

export function createCachedAsyncContext(contextNamespace, emptyState) {
  console.debug('cached context being rerendered');
  let stateCache = emptyState;
  let setStateCache = () => { console.debug('Null set state cache call'); };
  /**
   * Returns a promise that will resolve to the current state
   */
  function getState() {
    return localforage.getItem(contextNamespace)
      .then((state) => {
       // console.log('Local forage state');
       // console.log(state);
        return state || emptyState;
      });
  }

  function setState(state) {
    return localforage.setItem(contextNamespace, state)
      .then(() => setStateCache(state));
  }

  function clearState() {
    setStateCache(emptyState);
    return localforage.removeItem(contextNamespace);
  }

  function setStateValues(valuesObject) {
    console.debug(valuesObject);
    return getState()
      .then((state) => {
        const newState = { ...state, ...valuesObject };
        return setState(newState);
      });
  }

  function addStateCache(newStateCache, newSetStateCache){
    console.debug('Replacing state cache');
    stateCache = newStateCache;
    setStateCache = (newState) => {
      return newSetStateCache(newState);
    };
  }

  function loadingWrapper(loadingFunc) {
    // const startTime = new Date();
    console.log(`Loading with ${loadingFunc.name}`);
    return setStateValues({ loading: true })
      .then(() => {
        // console.log('Firing state mutator');
        return loadingFunc();
      })
      .then(() => {
        // const endTime = new Date();
        // console.log(`Load time ${endTime - startTime}ms for ${loadingFunc.name}`);
        return setStateValues({ loading: false });
      });
  }

  const emptyFunc = () => Promise.resolve({});
  const context = React.createContext({
    getState: emptyFunc,
    clearState: emptyFunc,
    setStateValues: emptyFunc,
    stateModifierWrapper: emptyFunc,
    loadingWrapper: emptyFunc,
    stateCache: emptyState,
  });


  return {
    context,
    getState,
    clearState,
    setStateValues,
    addStateCache,
    loadingWrapper,
    stateCache,
  };
}