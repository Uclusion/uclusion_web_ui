import _ from 'lodash'

const UPDATE_PAGE = 'UPDATE_PAGE';
const UPDATE_TAB = 'SET_TAB';
const EXPAND_ALL_ON_PAGE = 'EXPAND_ALL_ON_PAGE';
const CONTRACT_ALL_ON_PAGE = 'CONTRACT_ALL_ON_PAGE';
const EXPAND_OR_CONTRACT = 'EXPAND_OR_CONTRACT';
const DEHIGHLIGHT_EXPANDED = 'DEHIGHLIGHT_EXPANDED';

export const PAGE_SIZE = 15;
export const TEAM_INDEX = 1;
export const PENDING_INDEX = 2;

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

export function expandAll() {
  return {
    type: EXPAND_ALL_ON_PAGE
  };
}

export function contractAll() {
  return {
    type: CONTRACT_ALL_ON_PAGE
  };
}

export function expandOrContract(id) {
  return {
    type: EXPAND_OR_CONTRACT,
    id
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
  const allOutBoxMessagesOrdered = searchFiltered(allOutBoxMessagesOrderedRaw, searchResults);
  let inboxMessagesOrdered =  _.orderBy(messagesFull, ['updated_at'], ['desc']) || [];
  const outBoxMessagesOrdered = allOutBoxMessagesOrdered.filter((message) => message.comment ||
    message.isOutboxAccepted);
  const outBoxAssigned = allOutBoxMessagesOrdered.filter((message) => !message.isOutboxAccepted && !message.comment);
  const assignedNotifications = (messagesFull || []).filter((message) => message.alert_type &&
    !message.is_highlighted);
  const assignedMessagesRaw = _.union(assignedNotifications, outBoxAssigned) || [];
  const assignedMessages = assignedMessagesRaw.map((message) =>  {
    return {...message, isAssigned: true};
  });
  const assignedMessagesOrdered = _.orderBy(assignedMessages, ['updated_at'], ['desc']) || [];
  const teamMessagesOrdered = inboxMessagesOrdered.filter((message) => !message.alert_type && !message.is_highlighted);
  inboxMessagesOrdered = _.union(inboxMessagesOrdered.filter((message) => message.is_highlighted),
    assignedMessagesOrdered);
  return {outBoxMessagesOrdered, inboxMessagesOrdered, teamMessagesOrdered };
}

export function getUnpaginatedItems(messagesHash, tabIndex) {
  const {outBoxMessagesOrdered, inboxMessagesOrdered, teamMessagesOrdered} = messagesHash;
  return tabIndex === PENDING_INDEX ? outBoxMessagesOrdered : (tabIndex === 0 ? inboxMessagesOrdered
    : teamMessagesOrdered);
}

function toggleExpandRow(state, action) {
  const { id } = action;
  const { expansionState } = state;
  let newExpandedState;
  if (expansionState[id] === undefined) {
    newExpandedState = {...expansionState, [id]: true};
  } else {
    newExpandedState = _.omit(expansionState, id);
  }
  return { ...state, expansionState: newExpandedState }
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

function expandPage(state, action, items, isExpand) {
  const { expansionState } = state;
  const newExpanded = { ...expansionState };
  if (!_.isEmpty(items)) {
    items.forEach((message) => {
      newExpanded[message.id] = isExpand;
    });
  }
  return { ...state, expansionState: newExpanded };
}

function getReducer(messagesHash) {
  return (state, action) => {
    const { tabIndex } = state;
    const items = getUnpaginatedItems(messagesHash, tabIndex);
    switch (action.type) {
      case UPDATE_PAGE:
        return updatePage(state, action);
      case UPDATE_TAB:
        return updateTab(state, action);
      case EXPAND_ALL_ON_PAGE:
        return expandPage(state, action, items, true);
      case CONTRACT_ALL_ON_PAGE:
        return expandPage(state, action, items, false);
      case EXPAND_OR_CONTRACT:
        // Dehighlight happens on click method
        return toggleExpandRow(state, action);
      case DEHIGHLIGHT_EXPANDED:
        return state;
      default:
    }
  };
}

export default getReducer;