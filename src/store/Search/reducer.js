import { combineReducers } from 'redux';
import { INVESTIBLE_SEARCH_RESULTS } from './actions';
import {
  INVESTIBLE_CREATED,
  INVESTMENT_CREATED, MARKET_INVESTIBLE_CREATED,
  MARKET_INVESTIBLE_DELETED,
  RECEIVE_INVESTIBLES
} from '../MarketInvestibles/actions';
import { getInvestibleCreatedState, getMarketInvestibleDeletedState } from '../MarketInvestibles/reducer';
import elasticlunr from 'elasticlunr/example/elasticlunr';

function investibleSearches(state = {}, action) {
  const newState = { ...state };
  switch (action.type) {
    case INVESTIBLE_SEARCH_RESULTS:
      newState[action.marketId] = { query: action.query, results: action.results};
      return newState;
    default:
      return newState;
  }
}
export function getActiveInvestibleSearches(state){
  return state.investibleSearches;
}
/**
 * calculate the changed state and returns a convenient form with the market id and the items seperated
 * @param action
 */

function unpackMarketState(updates){
  const marketId = Object.keys(updates)[0];
  const items = updates[marketId];
  const type = 'UPDATE';
  return { marketId, items, type };
}

/**
 * Right now the two update functions return _every_ investible in the market.
 * That's not super efficient, so we'll likely need to compute our own state
 * @param action
 */
function getUpdatedInvestiblesState(action){
  //since we called with an empty state, this is the entirety of the changes
  const updates = getInvestibleCreatedState({}, action);
  return unpackMarketState(updates);
}

function getUpdatedMarketInvestiblesState(action){
  const updates = getMarketInvestibleDeletedState({}, action);
  return unpackMarketState(updates);
}


function getDeletedInvestiblesState(action){
  return { marketId: action.marketId, type: 'DELETE', items: [action.investibleId] }
}


function getActionState(action){
  switch (action.type) {
    case RECEIVE_INVESTIBLES:
    case INVESTIBLE_CREATED:
      return getUpdatedInvestiblesState(action);
    case MARKET_INVESTIBLE_DELETED:
      return getDeletedInvestiblesState(action);
    case INVESTMENT_CREATED:
    case MARKET_INVESTIBLE_CREATED:
      return getUpdatedMarketInvestiblesState(action);
    default:
      return { type: 'NOOP' };// for completeness
  }
}


function handleIndexDocumentDelete(serializedIndex, marketId, items) {
  if(!serializedIndex){
    return undefined;
  }
  const index = elasticlunr.load(serializedIndex);
  items.forEach(item => { index.removeDoc({id: item})});
  return index;
}

function createNewIndex(){
  const newIndex = elasticlunr(function () {
    this.addField('name');
    this.addField('description');
    this.addField('comments');
    this.setRef('id');
    this.saveDocument(false);
  });
  return newIndex;
}

function removeHtml(html){
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}


function getInvestibleDocument(investible){
  const doc = { ...investible };
  doc.description = removeHtml(doc.description);
  //  doc.comments = collectComments(investible.id);
  return doc;
}

function handleIndexDocumentUpdate(serializedIndex, marketId, items) {
  const index = serializedIndex? elasticlunr.Index.load(serializedIndex): createNewIndex();
  items.forEach((investible) => {
    index.addDoc(getInvestibleDocument(investible));
  });
  return index;
}

function getNewMarketIndex(serializedIndex, actionState){
  const { type, marketId, items } = actionState;
  switch (type) {
    case 'UPDATE':
      return handleIndexDocumentUpdate(serializedIndex, marketId, items);
    case 'DELETE':
      return handleIndexDocumentDelete(serializedIndex, marketId, items);
    default:
      return undefined;
  }
}

/**
 * This function accepts the actions that mutate the state of the index, and
 * then creates the new resultant index and stores it out.
 * @param state
 * @param action
 */
function searchIndexes(state = {}, action){
  const actionState = getActionState(action);
  const { marketId } = actionState;
  const serializedIndex = state[marketId];
  const newState = { ...state };
  const newIndex = getNewMarketIndex(serializedIndex, actionState);
  if (newIndex) {
    const newSerialized = newIndex.toJSON();
    newState[marketId] = newSerialized;
  }
  return newState;
}

export function getSerializedIndexes(state){
  return state.searchIndexes;
}

/**
 *
 function collectComments(investibleId) {
    const investibleComments = comments[investibleId] || [];
    // using an empty space in back so the tokenizer recognizes the comments as separate words
    const commentsString = investibleComments.reduce((comment) => {
      const strippedBody = removeHtml(comment.body);
      const separator = ' ';
      return strippedBody.concat(separator);
    }, '');
    return commentsString;
  }

 */

export default combineReducers({ searchIndexes, investibleSearches })