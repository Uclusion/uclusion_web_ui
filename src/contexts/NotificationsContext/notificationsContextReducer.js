import LocalForageHelper from '../../utils/LocalForageHelper'
import _ from 'lodash'
import { getMassagedMessages, splitIntoLevels } from '../../utils/messageUtils'
import { intl } from '../../components/ContextHacks/IntlGlobalProvider'
import { pushMessage } from '../../utils/MessageBusUtils'
import { TOAST_CHANNEL } from './NotificationsContext'

export const NOTIFICATIONS_CONTEXT_NAMESPACE = 'notifications';
const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
const INITIALIZE_STATE = 'INITIALIZE_STATE';
const PAGE_CHANGED = 'PAGE_CHANGED';
const REMOVE = 'REMOVE';

// Empty state of the various subkeys of the state, useful for avoiding errors
const emptyMessagesState = [];
/** Messages you can send the reducer */

export function updateMessages (messages) {
  return {
    type: UPDATE_MESSAGES,
    messages,
  };
}

/**
 * Removes messages according to the backend's hash and range keys
 * @param hashKey
 * @param rangeKey
 * @returns {{rangeKey: *, hashKey: *, type: string}}
 */
export function removeStoredMessages(hashKey, rangeKey) {
  return {
    type: REMOVE,
    hashKey,
    rangeKey,
  };
}

export function pageChanged (page) {
  return {
    type: PAGE_CHANGED,
    page,
  };
}

export function initializeState (newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}


/**
 * Data structure for storing messages is
 * state : {
 *   page: pageInfo // used to know what to toast on incoming messages
 *   messages: [] // array containing all messages
 *   }
 */

/**
 * Returns stored messages for a page which
 * is just a user action (not pertianing to a market)
 * @param userMessages
 * @param action
 * @returns {*[]|*}
 */
function getStoredMessagesForActionPage(messages, action) {
  switch(action){
    case 'notificationPreferences':
      return messages.filter((message) => message.pokeType === 'slack_reminder');
    case 'upgrade':
      return messages.filter((message) => message.pokeType === 'upgrade_reminder');
    default:
      return [];
  }
}

/**
 * Gets all messages for that pertain to a particular market page
 * @param state
 * @param page
 * @returns {*|*[]}
 */
function getStoredMessagesForMarketPage(messages, page) {
  const { marketId, investibleId } = page;
  // it is assumed a page for a market will have an undefined investible id
  // and that a store message for the market will also
  return messages.filter((message) => message.marketId === marketId && message.investibleId === investibleId);
}

/**
 * Returns the stored message for the given page
 * @param state
 * @param page
 * @returns {*|*[]|[]}
 */
function getStoredMessagesForPage(state, page) {
  const { action } = page;
  const messages = state.messages || emptyMessagesState;
  if (action === 'dialog') {
    return getStoredMessagesForMarketPage(messages, page);
  }
  return getStoredMessagesForActionPage(messages, action);
}

/**
 * Removes user messages from list that pertain to a particular
 * action
 * @param userMessages
 * @param action
 * @returns {*}
 */
function removeStoredMessagesForAction(messages, action) {
  switch (action){
    case 'notificationPreferences':
      return messages.filter((message) => message.pokeType !== 'slack_reminder');
    case 'upgrade':
      return messages.filter((message) => message.pokeType !== 'upgrade_reminder');
    default:
      return messages;
  }
}

/** Removes messages from the state that are for a
 * page pertaining to a market, or a subpage of a market
 * @param state
 * @param page
 * @returns {{marketMessages: *}|*}
 */
function removeStoredMessagesForMarketPage (messages, page) {
  const { marketId, investibleId } = page;
  return messages.filter((message) => message.marketId !== marketId || message.investibleId !== investibleId);
}

/**
 * Removes messages from the state for any page in the system
 * even those that don't pertain to markets (e.g. Direct Messages,
 * or upgrade notifications etc)
 * @param state
 * @param page
 */
function removeStoredMessagesForPage(state, page) {
  const { action } = page;
  const messages = state.messages || emptyMessagesState;
  // all market pages are under /dialog
  if (action === 'dialog') {
    return removeStoredMessagesForMarketPage(messages, page);
  }
  return removeStoredMessagesForAction(messages, page);
}

/* Generates the toasts for the messages on this page
 * @param messagesForPage
 */
function processToasts(messagesForPage) {
  const { redMessages, yellowMessages } = splitIntoLevels(messagesForPage);
  console.error(redMessages);
  console.error(yellowMessages);
  // all red messages get displayed immediately
  redMessages.forEach((message) => pushMessage(TOAST_CHANNEL, message));
  // for not bombarding the users sake, if we have more than one yellow message, we're
  // just going to display a summary message saying you have a bunch of updates
  if (!_.isEmpty(yellowMessages)) {
    const firstYellow = yellowMessages[0]
    if (yellowMessages.length > 1){
      const text = intl.formatMessage({id: 'notificationMulitpleUpdates'}, { n: yellowMessages.length})
      pushMessage(TOAST_CHANNEL, {
        ...firstYellow,
        text,
      });
    }else {
      pushMessage(TOAST_CHANNEL, firstYellow);
    }
  }
}

/** Functions that mutate the state */

/**
 * When we get a page event, we want to
 * process all messages for that page and remove
 * them from the store
 * @param state
 * @param action
 * @returns {{marketMessages?: *, page: *}}
 */
function processPageChange (state, action) {
  const { page } = action;
  console.error(page);
  console.error(state);
  const messagesForPage = getStoredMessagesForPage(state, page);
  // first compute what the new messages will look like
  console.error(messagesForPage);
  const newMessageState = removeStoredMessagesForPage(state, page);
  console.error(newMessageState);
  // then update the page to the current page
  const newState = {
    ...state,
    messages: newMessageState,
    page
  };
  processToasts(messagesForPage);
  return newState;
}

/**
 * Stores messages in the state. Note, we only store
 * messages for markets or investibles. Everything else is
 * immediately displayed
 * @param state
 * @param messagesToStore
 * @returns {*}
 */
function storeMessagesInState(state, messagesToStore) {
  const oldMessages = state.messages || emptyMessagesState;
  const newMessages = [...oldMessages, ...messagesToStore];
  const { initializing } = state;
  if (initializing) {
    return {
      messages: newMessages,
    };
  }
  return {
    ...state,
    messages: newMessages,
  };
}

/**
 * Updates the message store with the new messages
 * @param state
 * @param action
 * @returns {*}
 */
function doUpdateMessages (state, action) {
  const { messages } = action;
  const massagedMessages = getMassagedMessages(messages);
  // extract any messages for this page right now
  const { page } = state;
  // we can reuse the code for finding and removing page messages in the store, if we make the new
  // incoming messages look like they came from the store
  const pageMessages = getStoredMessagesForPage({messages: massagedMessages}, page);
  // the messages to store are the ones we can't immediately handle on the current page
  const messagesToStore = removeStoredMessagesForPage({ messages: massagedMessages}, page);
  // toast the page messages
  processToasts(pageMessages);
  // and compute the new state
  return storeMessagesInState(state, messagesToStore);
}


function doRemove (state, action) {
  const { hashKey, rangeKey } = action;
  // the market_id_user_id of the message is the backends hash key
  // the type_object_id is the backends range key
  const messages = state.messages || emptyMessagesState;
  const messageRemovalFilter = (message) => !(message.type_object_id === rangeKey && message.market_id_user_id === hashKey);
  const newMessages = messages.filter(messageRemovalFilter);
  return {
    ...state,
    messages: newMessages,
  };
}

function computeNewState (state, action) {
  switch (action.type) {
    case UPDATE_MESSAGES:
      return doUpdateMessages(state, action);
    case PAGE_CHANGED:
      return processPageChange(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    case REMOVE:
      return doRemove(state, action);
    default:
      return state;
  }
}

function reducer (state, action) {
  const newState = computeNewState(state, action);
  //// console.log(`Processed ${JSON.stringify(action)} to produce ${JSON.stringify(newState)}`);
  const lfh = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
  lfh.setState(newState);
  return newState;
}

export default reducer;
