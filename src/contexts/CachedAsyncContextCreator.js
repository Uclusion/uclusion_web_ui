import React from 'react';
import _ from 'lodash';
import localforage from "localforage";

/**
 * Cached async contexts allow a bridge from the indexDB or promise based storage
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

  let stateCache = emptyState;
  let setStateCache = () => { console.debug('Null set state cache call'); };
  /**
   * Returns a promise that will resolve to the current state
   */
  function getState() {
    return localforage.getItem(contextNamespace)
      .then((state) => {
        const usedState = state || emptyState;
        if (!_.isEqual(usedState, stateCache)) {
          console.debug('Updating state cache in get state');
          console.debug(usedState);
          setStateCache(usedState);
        }
        return usedState;
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
    console.log('Turning on loading');
    return setStateValues({ loading: true })
      .then(() => {
        console.log('Firing state mutator');
        return loadingFunc();
      })
      .then(() => {
        console.log('Turning off loading');
        return setStateValues({ loading: false });
      });
  }

  const emptyFunc = () => Promise.resolve({});
  const context = React.createContext({
    setState: emptyFunc,
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
    setState,
    clearState,
    setStateValues,
    addStateCache,
    loadingWrapper,
    stateCache,
  };
}