/** This reducer is pretty much identical to the form data wizard,
 * because there's not much difference between capturing form data and page
 * state. Consider extracting into a package of it's own
 * @type {string}
 */
import { generateLocalStorageBackedReducer } from '../localStorageUtils';
import { useReducer } from 'react';

const RESET_VALUES = 'RESET_VALUES';
const UPDATE_VALUES = 'UPDATE_VALUES';

export function updateValues(newValues) {
  return {
    type: UPDATE_VALUES,
    newValues
  }
}

/**
 * Returns a message to the reducer that
 * will empty out the state
 * @returns {{type: string}}
 */
export function resetValues() {
  return {
    type: RESET_VALUES,
  }
}

export function genericPageReducer(state, action) {
  const { type } = action
  switch (type) {
    case UPDATE_VALUES:
      return {
        ...state,
        ...action.newValues
      }
    case RESET_VALUES:
      return {}
    default:
      return state
  }
}


export function usePageStateReducer(pageId) {
  const { storageBackedReducer, storedValue } = generateLocalStorageBackedReducer(pageId, genericPageReducer);
  const [state, dispatch] = useReducer(storageBackedReducer, storedValue);
  return [state, (values) => dispatch(updateValues(values)), () => dispatch(resetValues())];
}

