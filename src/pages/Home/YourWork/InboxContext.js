import _ from 'lodash'
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';

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

function searchFiltered(raw, searchResults, workItemId) {
  const { results, parentResults, search } = searchResults;
  return _.isEmpty(search) || workItemId ? raw : raw.filter((message) => {
      const { type_object_id: typeObjectId,  investible_id: investibleId, comment_id: commentId, id } = message;
      const allIds = [investibleId, commentId, id];
      const typeObjectIdSafe = typeObjectId || '';
      return results.find((result) => typeObjectIdSafe.endsWith(result.id) || allIds.includes(result.id)) ||
        parentResults.find((id) => typeObjectIdSafe.endsWith(id) || parentResults.find((id) => allIds.includes(id)));
    });
}

export function addWorkspaceGroupAttribute (messagesFull, groupsState) {
  return messagesFull.map((message) => {
    const group = getGroup(groupsState, undefined, message.group_id);
    if (group) {
      return {...message, groupAttr: `${group.market_id}_${group.id}`};
    }
    return message;
  });
}

export function getMessages(allOutBoxMessagesOrderedRaw, messagesFullRaw, searchResults, workItemId,
  groupsState) {
  const messagesFull = searchFiltered(messagesFullRaw, searchResults, workItemId);
  const outBoxMessagesOrdered = searchFiltered(allOutBoxMessagesOrderedRaw, searchResults, workItemId);
  const messagesFullMapped = addWorkspaceGroupAttribute(messagesFull, groupsState);
  const inboxMessagesOrdered =  _.orderBy(messagesFullMapped,
    ['groupAttr', 'updated_at'], ['asc', 'desc']) || [];
  return {outBoxMessagesOrdered, inboxMessagesOrdered };
}

export function getUnpaginatedItems(messagesHash, tabIndex, workItemId) {
  const {outBoxMessagesOrdered, inboxMessagesOrdered } = messagesHash;
  if (workItemId) {
    return workItemId.includes('_') ? inboxMessagesOrdered : outBoxMessagesOrdered;
  }
  return tabIndex === PENDING_INDEX ? outBoxMessagesOrdered : inboxMessagesOrdered;
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