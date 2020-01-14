import { DIFF_CONTEXT_NAMESPACE } from './DiffContext';
import LocalForageHelper from '../LocalForageHelper';
import HtmlDiff from 'htmldiff-js';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_DIFF = 'UPDATE_DIFF';
const UPDATE_DIFFS = 'UPDATE_DIFFS';
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

export function updateDiffs(newItems) {
  return {
    type: UPDATE_DIFFS,
    newItems,
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

function getUpdatedItemState(state, newItem) {
  const { id, description } = newItem;
  if (!id && description) {
    return state;
  }
  if (state[id]) {
    const { contents, diff: oldDiff } = state[id];
    // some updates do not change the contents
    let diff = oldDiff;
    if (description !== contents) {
      const newDiff = HtmlDiff.execute(contents, description);
      diff = newDiff;
    }
    // if we have an old diff, it means the user hasn't dismissed it yet.
    // Hence we need to keep around the old contents as that's the baseline
    // the have seen and want to compare against
    // if we don't have a diff, then we are free to set the contents to the
    // new value
    const newContents = (oldDiff) ? contents : description;
    return {
      ...state,
      [id]: {
        contents: newContents,
        diff,
        isNew: false,
      },
    };
  }
  // no existing version, so nothing to diff against yet
  // just store the contents for the future
  return {
    ...state,
    [id]: {
      contents: description,
      isNew: true,
    },
  };
}

function doUpdates(state, action) {
  const { newItems } = action;
  return newItems.reduce((accState, item) => getUpdatedItemState(accState, item), state);
}

function doUpdate(state, action) {
  const { newItem } = action;
  return getUpdatedItemState(state, newItem);
}

function computeNewState(state, action) {
  const { type } = action;
  switch (type) {
    case INITIALIZE_STATE:
      return action.newState;
    case UPDATE_DIFF:
      return doUpdate(state, action);
    case UPDATE_DIFFS:
      return doUpdates(state, action);
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


