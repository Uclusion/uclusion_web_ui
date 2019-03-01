import elasticlunr from 'elasticlunr/example/elasticlunr';
import { combineReducers } from 'redux';
import _ from 'lodash';
import {
  INVESTIBLE_CREATED,
  INVESTMENT_CREATED, MARKET_INVESTIBLE_CREATED,
  MARKET_INVESTIBLE_DELETED,
  RECEIVE_INVESTIBLES,
} from '../MarketInvestibles/actions';
import { getInvestibleCreatedState, getMarketInvestibleCreatedState } from '../MarketInvestibles/reducer';
import { updateCommentListState } from '../Comments/reducer';
import { COMMENT_DELETED, COMMENTS_RECEIVED } from '../Comments/actions';

/**
 * Given an HTML string renders the TEXT representation of the html with all
 * markup removed
 * @param html the HTML To render
 * @returns string the text content of the html
 */
function removeHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Takes a list of comments and packs them into a string suitable for
 * indexing
 * @param comments the list of comments to pack
 * @returns a searchable string containing the relevant parts of the comments
 */
function packComments(comments) {
  const reducer = (accumulator, comment) => {
    const strippedBody = removeHtml(comment.body);
    const separator = ' ';
    return accumulator.concat(separator).concat(strippedBody);
  };
  return comments.reduce(reducer, '');
}

/**
 * Given a packed state representing investibles, gets the comments for it
 * and loads the comments into the item under comments attribute
 * @param action
 * @param packedState
 */

function loadCommentsForItems(action, packedState) {
  const marketComments = action.commentsReducer.marketComments[packedState.marketId];
  if (marketComments) {
    packedState.items.forEach((item) => {
      const investibleComments = marketComments[item.id];
      if (investibleComments) {
        item.comments = packComments(investibleComments);
      }
    });
  }
}

/**
 * This reorganizes the packed state to make it the same as the investible form.
 * The reason it's different is because the index works on _investibles_ not comments.
 * Also the packed state here is a HASH keyed from investible id instead of an array
 * @param action
 * @param packedState
 */
function transformCommentsToItems(packedState) {
  const { marketInvestibles, items } = packedState;
  const newItems = [];
  if (marketInvestibles) {
    const investibleMap = _.keyBy(marketInvestibles, element => element.id);
    Object.keys(items).forEach((investibleId) => {
      const investible = investibleMap[investibleId];
      if (investible) {
        const comments = items[investibleId];
        investible.comments = packComments(comments);
        newItems.push(investible);
      }
    });
  }
  // overwrite the old items with the new items
  return { ...packedState, items: newItems };
}


/**
 * calculate the changed state and returns a convenient form with the market id and
 * the items separated
 * @param updates
 */

function createStateForUpdates(updates) {
  const marketId = Object.keys(updates)[0];
  const items = updates[marketId];
  const type = 'UPDATE';
  return { marketId, items, type };
}

function getCommentMarketState(action, updates) {
  const updateState = createStateForUpdates(updates);
  const marketInvestibles = action.investiblesReducer.items[updateState.marketId];
  return { ...updateState, marketInvestibles };
}
function getUpdatedCommentsState(action) {
  // empty state passed in so we just have the updates
  const updates = updateCommentListState({}, action);
  const marketState = getCommentMarketState(action, updates);
  // now we have comments in the items. We need to convert this to having the investible
  // with the comments
  return transformCommentsToItems(marketState);
}

function getDeletedCommentsState(action) {
  // we're going to do the same thing as the updated, but we're going
  // to remove the current list
  const { marketId, investibleId, commentId } = action;
  const marketComments = action.commentsReducer.marketComments[marketId];
  if (marketComments) {
    const investibleComments = marketComments[investibleId];
    if (investibleComments) {
      const filteredComments = investibleComments.filter(comment => comment.id !== commentId);
      const marketState = {
        marketId: action.marketId,
        marketInvestibles: action.investiblesReducer.items[action.marketId],
        // a delete on a comment is an update of the investbile
        type: 'UPDATE',
        // mimic the structure of an update
        items: { [marketId]: { [investibleId]: filteredComments } },
      };
      return transformCommentsToItems(marketState);
    }
  }
  return { type: 'NOOP' }; // if there's no investible to update, this is a NOOP
}

/**
 * Right now the getUpdatedInvestiblesState and getUpdatedMarketInvestiblesState
 * functions return _every_ investible in the market.
 * That's not super efficient, so we'll likely need to compute our own state
 * @param action
 */
function getUpdatedInvestiblesState(action) {
  // since we called with an empty state, this is the entirety of the changes
  const updates = getInvestibleCreatedState({}, action);
  const marketState = createStateForUpdates(updates);
  loadCommentsForItems(action, marketState);
  return marketState;
}

function getUpdatedMarketInvestiblesState(action) {
  const updates = getMarketInvestibleCreatedState({}, action);
  const marketState = createStateForUpdates(updates);
  loadCommentsForItems(action, marketState);
  return marketState;
}

function getDeletedInvestiblesState(action) {
  return { marketId: action.marketId, type: 'DELETE', items: [action.investibleId] };
}

function getActionState(action) {
  switch (action.type) {
    case RECEIVE_INVESTIBLES:
    case INVESTIBLE_CREATED:
      return getUpdatedInvestiblesState(action);
    case MARKET_INVESTIBLE_DELETED:
      return getDeletedInvestiblesState(action);
    case INVESTMENT_CREATED:
    case MARKET_INVESTIBLE_CREATED:
      return getUpdatedMarketInvestiblesState(action);
    case COMMENTS_RECEIVED:
      return getUpdatedCommentsState(action);
    case COMMENT_DELETED:
      return getDeletedCommentsState(action);
    default:
      return { type: 'NOOP' };// for completeness
  }
}


function handleIndexDocumentDelete(serializedIndex, marketId, items) {
  if (!serializedIndex) {
    return undefined;
  }
  const index = elasticlunr.load(serializedIndex);
  items.forEach((item) => { index.removeDoc({ id: item }); });
  return index;
}

function createNewIndex() {
  return elasticlunr(function () {
    this.addField('name');
    this.addField('description');
    this.addField('comments');
    this.setRef('id');
    this.saveDocument(true);
  });
}


function getInvestibleDocument(investible) {
  const doc = {
    id: investible.id,
    description: removeHtml(investible.description),
    name: investible.name,
    comments: investible.comments,
  };
  return doc;
}

function handleIndexDocumentUpdate(serializedIndex, marketId, items) {
  const index = serializedIndex ? elasticlunr.Index.load(JSON.parse(serializedIndex))
    : createNewIndex();
  items.forEach((investible) => {
    const doc = getInvestibleDocument(investible);
    index.updateDoc(doc); // works as an upsert
  });
  return index;
}

function getNewMarketIndex(serializedIndex, actionState) {
  const { type, marketId, items } = actionState;
  switch (type) {
    case 'UPDATE':
      return handleIndexDocumentUpdate(serializedIndex, marketId, items);
    case 'DELETE':
      return handleIndexDocumentDelete(serializedIndex, marketId, items);
    default:
      return null;
  }
}

/**
 * This function accepts the actions that mutate the state of the index, and
 * then creates the new resultant index and stores it out.
 * @param state
 * @param action
 */
function marketSearchIndexes(state = {}, action) {
  const actionState = getActionState(action);
  if (actionState.type === 'NOOP') {
    return state; // no CHANGES
  }
  const { marketId } = actionState;
  const serializedIndex = state[marketId];
  const newState = { ...state };
  const newIndex = getNewMarketIndex(serializedIndex, actionState);
  if (newIndex !== null) {
    newState[marketId] = JSON.stringify(newIndex.toJSON());
  }
  return newState;
}


export function getSerializedMarketIndexes(state) {
  return state.marketSearchIndexes;
}

export default combineReducers({ marketSearchIndexes });
