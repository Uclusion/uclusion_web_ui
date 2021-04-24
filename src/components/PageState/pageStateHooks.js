/** This reducer is pretty much identical to the form data wizard,
 * because there's not much difference between capturing form data and page
 * state. Consider extracting into a package of it's own
 * @type {string}
 */
import { generateLocalStorageBackedReducer } from '../localStorageUtils';
import { useReducer } from 'react';

const RESET_VALUES = 'RESET_VALUES';
const UPDATE_VALUES = 'UPDATE_VALUES';

export function updateValues(newValues, id) {
  return {
    type: UPDATE_VALUES,
    id,
    newValues
  }
}

/**
 * Returns a message to the reducer that
 * will empty out the state
 * @returns {{type: string}}
 */
export function resetValues(id) {
  return {
    type: RESET_VALUES,
    id
  }
}

export function genericPageReducer(state, action) {
  const { type, id } = action;
  const newState = { ...state };
  switch (type) {
    case UPDATE_VALUES:
      const currentValues = state[id] || {};
      const newValues = {...currentValues, ...action.newValues};
      newState[id] = newValues;
      return newState;
    case RESET_VALUES:
      delete newState[id];
      return newState;
    default:
      return state
  }
}

export function getPageReducerPage(state, dispatch, id) {
  return [state[id] || {},  (values) => dispatch(updateValues(values, id)), () => dispatch(resetValues(id))];
}


export function usePageStateReducer(pageId) {
  const { storageBackedReducer, storedValue } = generateLocalStorageBackedReducer(pageId, genericPageReducer);
  const [state, dispatch] = useReducer(storageBackedReducer, storedValue || {}, undefined);
  return [state, dispatch];
}

