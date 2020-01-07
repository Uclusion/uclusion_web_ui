import { DIFF_CONTEXT_NAMESPACE } from './DiffContext';
import LocalForageHelper from '../LocalForageHelper';
import HtmlDiff from 'htmldiff-js';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_DIFF = 'UPDATE_DIFF';
const DELETE_DIFF = 'DELETE_DIFF';

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateDiff(newItem) {
  return {
    type: UPDATE_DIFF,
    newItem,
  };
}

export function deleteDiff(id) {
  return {
    type: DELETE_DIFF,
    id,
  };
}

function doDelete(state, id) {
  console.log(`Deleting diff for ${id}`);
  if (state[id]) {
    const oldValue = state[id];
    const newValue = {
      ...oldValue,
    };
    delete newValue.diff;
    return {
      ...state,
      [id]: newValue,
    }
  }
  return state;
}

function doUpdate(state, action) {
  const { newItem } = action;
  const { id, description } = newItem;
  if (!id && description) {
    return state;
  }
  const itemVersion = {
    contents: description,
  };
  if (state[id]) {
    const { contents } = state[id];
    itemVersion.diff = HtmlDiff.execute(contents, description);
  }
  return {
    ...state,
    [id]: itemVersion,
  };
}

function computeNewState(state, action) {
  const { type } = action;
  switch (type) {
    case INITIALIZE_STATE:
      return action.newState;
    case UPDATE_DIFF:
      return doUpdate(state, action);
    case DELETE_DIFF:
      return doDelete(state, action.id);
    default:
      return state;
  }
}

function reducer(state, action) {
  const newState = computeNewState(state, action);
  const lfh = new LocalForageHelper(DIFF_CONTEXT_NAMESPACE);
  lfh.setState(newState);
  return newState;
}

export default reducer;


