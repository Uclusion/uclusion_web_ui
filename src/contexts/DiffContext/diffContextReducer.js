import HtmlDiff from 'htmldiff-js';
import { DIFF_CONTEXT_NAMESPACE } from './DiffContext';
import LocalForageHelper from '../LocalForageHelper';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const ADD_CONTENTS = 'ADD_CONTENTS';
const VIEW_CONTENT = 'VIEW_CONTENT';
const VIEW_DIFF = 'VIEW_DIFF';

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function addContents(items) {
  return {
    type: ADD_CONTENTS,
    items,
  }
}

export function viewContent(itemId, content) {
  return {
    type: VIEW_CONTENT,
    itemId,
    content,
  }
}

export function viewDiff(itemId) {
  return {
    type: VIEW_DIFF,
    itemId,
  };
}

/* Struct for an individual item
{
  id,
  lastSeenContent
  diff,
  updated_by
}
 */

function getNotSeenContent(state, content) {
  const { id, description, updated_by: updatedBy } = content;
  const firstReceived = {
    id,
    currentContent: description,
    updatedBy,
  };
  return {
    ...state,
    [id]: firstReceived,
  };
}

function addContentsState(state, action) {
  const { items } = action;
  return items.reduce((state, item) => addContentState(state, item), state);
}


function addContentState(state, item) {
  const {
    id,
    description,
    updated_by: updatedBy,
    updated_by_you: updatedByYou } = item;
  // if we've not seen anything yet, the data structure is the same regardless of hoe many
  // times we update it
  const existing = state[id];
  if (!existing) {
    return getNotSeenContent(state, item);
  }
  const { lastSeenContent } = existing;
  if (!lastSeenContent) {
    return getNotSeenContent(state, item);
  }
  // if it's updated by you, we can advance to last seen to this,
  // and then discard any previous diff because it's out of date
  // hence it looks a lot like a "haven't ever seen this"
  if (updatedByYou) {
    return getNotSeenContent(state, item);
  }
  // Updates may come in that doesn't update the description
  // so don't bother updating anything
  if (lastSeenContent === description ) {
    return state;
  }
  // ok at this point, you've seen something, and this new stuff
  // is genuinely new to you. Hence we need to calculate the diff
  const diff = HtmlDiff.execute(lastSeenContent, description);
  const newContent = {
    id,
    lastSeenContent,
    diff,
    diffViewed: false,
    updatedBy
  };
  return {
    ...state,
    [id]: newContent,
  }
}

function viewDiffState(state, action) {
  const { itemId } = action;
  const oldContent = state[itemId];
  if (!oldContent) {
    return state;
  }
  const newContent = {
    ...oldContent,
    diffViewed: true,
  };
  const newState = {
    ...state,
    [itemId]: newContent,
  };
  return newState;
}

function viewContentState(state, action) {
  const { itemId, content } = action;
  const oldData = state[itemId];
  if (!oldData) {
    const notSeenContent = {
      id: itemId,
      lastSeenContent: content,
    };
    return {
      ...state,
      [itemId]: notSeenContent,
    };
  }
  const newData = {
    ...oldData,
    id: itemId,
    lastSeenContent: content,
  };
  return {
    ...state,
    [itemId]: newData,
  };
}

function computeNewState(state, action) {
  const { type } = action;
  switch (type) {
    case INITIALIZE_STATE:
      return action.newState;
    case ADD_CONTENTS:
      return addContentsState(state, action);
    case VIEW_CONTENT:
      return viewContentState(state, action);
    case VIEW_DIFF:
      return viewDiffState(state, action);
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
