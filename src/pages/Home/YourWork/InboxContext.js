import _ from 'lodash'
import { pushMessage, registerListener } from '../../../utils/MessageBusUtils'
import { VIEW_EVENT, VISIT_CHANNEL } from '../../../utils/marketIdPathFunctions'
import {
  DEHIGHLIGHT_EVENT,
  MODIFY_NOTIFICATIONS_CHANNEL
} from '../../../contexts/NotificationsContext/notificationsContextMessages'

const UPDATE_PAGE = 'UPDATE_PAGE';
const UPDATE_TAB = 'SET_TAB';
const EXPAND_ALL_ON_PAGE = 'EXPAND_ALL_ON_PAGE';
const CONTRACT_ALL_ON_PAGE = 'CONTRACT_ALL_ON_PAGE';
const EXPAND_OR_CONTRACT = 'EXPAND_OR_CONTRACT';
const DEHIGHLIGHT_EXPANDED = 'DEHIGHLIGHT_EXPANDED';

export const PAGE_SIZE = 15;
export const TEAM_INDEX = 3;
export const PENDING_INDEX = 2;
export const ASSIGNED_INDEX = 1;

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

export function dehighlight() {
  return {
    type: DEHIGHLIGHT_EXPANDED
  };
}

export function getMessages(allOutBoxMessagesOrdered, messagesUnsafe, messagesFull, searchResults) {
  const { results, parentResults, search } = searchResults;
  let inboxMessagesOrdered =  _.orderBy(messagesFull, ['updated_at'], ['desc']) || [];
  const outBoxMessagesOrdered = allOutBoxMessagesOrdered.filter((message) => message.comment ||
    message.isOutboxAccepted);
  const outBoxAssigned = allOutBoxMessagesOrdered.filter((message) => !message.isOutboxAccepted && !message.comment);
  const assignedNotifications = (messagesUnsafe || []).filter((message) => message.alert_type);
  const assignedMessages = _.union(assignedNotifications, outBoxAssigned);
  const assignedMessagesOrdered = _.orderBy(assignedMessages, ['updated_at'], ['desc']) || [];
  const messagesFiltered = _.isEmpty(search) ? inboxMessagesOrdered : inboxMessagesOrdered.filter((message) => {
    const { type_object_id: typeObjectId,  investible_id: investibleId } = message;
    return results.find((result) => typeObjectId.endsWith(result.id) || result.id === investibleId) ||
      parentResults.find((id) => typeObjectId.endsWith(id) || parentResults.find((id) => investibleId === id));
  });
  const dupeHash = {};
  messagesFiltered.forEach((message) => {
    const { link_multiple: linkMultiple } = message;
    if (linkMultiple) {
      if (dupeHash[linkMultiple]) {
        dupeHash[linkMultiple].push(message);
      } else {
        dupeHash[linkMultiple] = [message];
      }
    }
  });
  inboxMessagesOrdered = messagesFiltered.filter((message) => {
    const { link_multiple: linkMultiple, updated_at: updatedAt } = message;
    if (dupeHash[linkMultiple]) {
      //Choose the message to use for the row based on last updated
      return _.isEmpty(dupeHash[linkMultiple].find((aMessage) => {
        return aMessage.updated_at > updatedAt;
      }));
    }
    return true;
  });
  const teamMessagesOrdered = inboxMessagesOrdered.filter((message) => !message.alert_type && !message.is_highlighted);
  inboxMessagesOrdered = inboxMessagesOrdered.filter((message) => message.is_highlighted);
  return {outBoxMessagesOrdered, inboxMessagesOrdered, assignedMessagesOrdered, teamMessagesOrdered, dupeHash};
}

export function getUnpaginatedItems(messagesHash, tabIndex) {
  const {outBoxMessagesOrdered, inboxMessagesOrdered, assignedMessagesOrdered, teamMessagesOrdered} = messagesHash;
  return tabIndex === PENDING_INDEX ? outBoxMessagesOrdered : (tabIndex === 0 ? inboxMessagesOrdered
    : (tabIndex === ASSIGNED_INDEX ? assignedMessagesOrdered : teamMessagesOrdered));
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

function dehighlightExpandedOnPage(state, items) {
  const { expansionState } = state;
  const openOnPage = (items || []).filter((message) => !!expansionState[message.id]);
  if (!_.isEmpty(openOnPage)) {
    const messages = openOnPage.map((message) => message.id);
    pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event: DEHIGHLIGHT_EVENT, messages });
  }
}

function getReducer(messagesHash) {
  return (state, action) => {
    const { tabIndex } = state;
    const items = getUnpaginatedItems(messagesHash, tabIndex);
    switch (action.type) {
      case UPDATE_PAGE:
        dehighlightExpandedOnPage(state, items);
        return updatePage(state, action);
      case UPDATE_TAB:
        dehighlightExpandedOnPage(state, items);
        return updateTab(state, action);
      case EXPAND_ALL_ON_PAGE:
        return expandPage(state, action, items, true);
      case CONTRACT_ALL_ON_PAGE:
        dehighlightExpandedOnPage(state, items);
        return expandPage(state, action, items, false);
      case EXPAND_OR_CONTRACT:
        // Dehighlight happens on click method
        return toggleExpandRow(state, action);
      case DEHIGHLIGHT_EXPANDED:
        dehighlightExpandedOnPage(state, items);
        return state;
      default:
    }
  };
}

export function registerInboxContextListeners(dispatch) {
  registerListener(VISIT_CHANNEL, 'dehighlightListener', (data) => {
      if (!data) {
        return;
      }
      const { payload: { event, message } } = data;
      switch (event) {
        case VIEW_EVENT:
          const { isEntry } = message;
          if (isEntry) {
            dispatch(dehighlight());
          }
          break;
        default:
      }
    }
  );
}

export default getReducer;