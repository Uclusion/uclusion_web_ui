import _ from 'lodash'

const UPDATE_PAGE = 'UPDATE_PAGE';
const UPDATE_TAB = 'SET_TAB';

export const PAGE_SIZE = 50;
export const PENDING_INDEX = 1;

export function setPage(pageNum) {
  return {
    type: UPDATE_PAGE,
    pageNum
  };
}

export function setTab(tabNum) {
  return {
    type: UPDATE_TAB,
    tabNum
  };
}

function searchFiltered(raw, searchResults) {
  const { results, parentResults, search } = searchResults;
  return _.isEmpty(search) ? raw : raw.filter((message) => {
      const { type_object_id: typeObjectId,  investible_id: investibleId, comment_id: commentId, id } = message;
      const allIds = [investibleId, commentId, id];
      const typeObjectIdSafe = typeObjectId || '';
      return results.find((result) => typeObjectIdSafe.endsWith(result.id) || allIds.includes(result.id)) ||
        parentResults.find((id) => typeObjectIdSafe.endsWith(id) || parentResults.find((id) => allIds.includes(id)));
    });
}

export function getMessages(allOutBoxMessagesOrderedRaw, messagesFullRaw, searchResults) {
  const messagesFull = searchFiltered(messagesFullRaw, searchResults);
  const outBoxMessagesOrdered = searchFiltered(allOutBoxMessagesOrderedRaw, searchResults);
  const inboxMessagesOrdered =  _.orderBy(messagesFull, ['updated_at'], ['desc']) || [];
  return {outBoxMessagesOrdered, inboxMessagesOrdered };
}

export function getUnpaginatedItems(messagesHash, tabIndex) {
  const {outBoxMessagesOrdered, inboxMessagesOrdered, teamMessagesOrdered} = messagesHash;
  return tabIndex === PENDING_INDEX ? outBoxMessagesOrdered : (tabIndex === 0 ? inboxMessagesOrdered
    : teamMessagesOrdered);
}

function updateTab(state, action) {
  const { pageState, defaultPage } = state;
  const { tabNum } = action;
  const pageNum = pageState[tabNum] === undefined ? defaultPage : pageState[tabNum];
  return { ...state, page: pageNum, tabIndex: tabNum };
}

function updatePage(state, action) {
  const { pageNum, tabIndex, pageState } = action;
  const newPageState = {...pageState, [tabIndex]: pageNum};
  return { ...state, page: pageNum, pageState: newPageState };
}

function getReducer() {
  return (state, action) => {
    switch (action.type) {
      case UPDATE_PAGE:
        return updatePage(state, action);
      case UPDATE_TAB:
        return updateTab(state, action);
      default:
    }
  };
}

export default getReducer;