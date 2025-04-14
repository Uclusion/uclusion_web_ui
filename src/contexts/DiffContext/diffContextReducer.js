import HtmlDiff from 'htmldiff-js'
import { DIFF_CONTEXT_NAMESPACE } from './DiffContext'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { commentsContextHack } from '../CommentsContext/CommentsContext';
import { investibleContextHack } from '../InvestibesContext/InvestiblesContext';
import { getComment } from '../CommentsContext/commentsContextHelper';
import { getInvestible } from '../InvestibesContext/investiblesContextHelper';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const REMOVE_CONTENTS = 'REMOVE_CONTENTS';
const ADD_CONTENTS = 'ADD_CONTENTS';

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function addContents(items, contentType) {
  return {
    type: ADD_CONTENTS,
    items,
    contentType
  }
}

function removeContentsState(state, action) {
  const { items } = action;
  const newState = { ...state };
  items.forEach((id) => {
    delete newState[id];
  });
  return newState;
}

function addContentsState(state, action) {
  const { items, contentType } = action;
  console.info('Beginning diff add contents')
  const { initializing } = state;
  const newState = initializing ? {} : {...state};
  items.forEach((item) => {
    const contents = getContents(state, item, contentType);
    if (contents) {
      newState[item.id] = contents;
    }
  });
  return newState;
}

function getContents(state, item, contentType) {
  const {
    id,
    version,
    updated_by_you: updatedByYou,
    diff_versions: diffVersions } = item;
  // if we've not seen anything yet, the data structure is the same regardless of hoe many
  // times we update it
  const existing = state[id];
  if (!existing) {
    return { version };
  }
  // if it's updated by you, we can advance to last seen to this,
  // and then discard any previous diff because it's out of date
  // hence it looks a lot like a "haven't ever seen this"
  if (updatedByYou) {
    return { version };
  }
  const { version: lastSeenVersion } = existing;
  if (!lastSeenVersion) {
    return { version };
  }
  const isDescriptionChanged = diffVersions?.find((diffVersion) =>
    lastSeenVersion <= diffVersion) > 0;
  // Updates may come in that doesn't update the description so don't bother updating anything
  if (!isDescriptionChanged) {
    return undefined;
  }
  console.info(`Diff processing found ${id}`);
  const lastSeenContent = contentType === 'comment' ? getComment(commentsContextHack, item.market_id, id)?.body
    : getInvestible(investibleContextHack, id)?.investible?.description;
  if (!lastSeenContent) {
    return undefined;
  }
  console.info('Attempting a diff');
  const description = contentType === 'comment' ? item.body : item.description;
  // ok at this point, you've seen something, and this new stuff is genuinely new to you. Hence, calculate the diff
  try {
    const diff = HtmlDiff.execute(lastSeenContent, description || '');
    return {
      version,
      diff
    };
  } catch(e) {
    console.warn(`Could not add contents of diff for id: ${id}`);
    console.warn(e);
    // Diff does best effort only
    return undefined;
  }
}

function computeNewState(state, action) {
  const { type } = action;
  switch (type) {
    case INITIALIZE_STATE:
      if (state.initializing) {
        return action.newState;
      }
      return state;
    case REMOVE_CONTENTS:
      return removeContentsState(state, action);
    case ADD_CONTENTS:
      return addContentsState(state, action);
    default:
      return state;
  }
}

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE) {
    const lfh = new LocalForageHelper(DIFF_CONTEXT_NAMESPACE);
    lfh.setState(newState);
  }
  return newState;
}

export default reducer;
