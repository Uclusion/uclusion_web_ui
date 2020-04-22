import LocalForageHelper from '../../utils/LocalForageHelper';
import _ from 'lodash';
import { getMassagedMessages, splitIntoLevels } from '../../utils/messageUtils';
import { intl } from '../../components/ContextHacks/IntlGlobalProvider';
import { pushMessage } from '../../utils/MessageBusUtils';
import { TOAST_CHANNEL } from './NotificationsContext';


export const NOTIFICATIONS_CONTEXT_NAMESPACE = 'notifications';
const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
const INITIALIZE_STATE = 'INITIALIZE_STATE';
const PAGE_CHANGED = 'PAGE_CHANGED';
const REMOVE = 'REMOVE';

// Empty state of the various subkeys of the state, useful for avoiding errors
const emptyMarketMessagesState = {}
const emptyMarketState = { market: [], investible: {}};
const emptyUserMessageState = [];
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
 * Data structure for messages is
 * state : {
 *   page: pageInfo // used to know what to toast on incoming messages
 *   userMessages: [],
 *   marketMessages: {
 *   [marketId]: {
 *     market: []
 *     investible: {
 *       [investibleId]: []
 *     }
 *   }
 *   }
 * }
 */

/**
 * Returns stored messages for a page which
 * is just a user action (not pertianing to a market)
 * @param userMessages
 * @param action
 * @returns {*[]|*}
 */
function getStoredMessagesForActionPage(userMessages, action) {
  switch(action){
    case 'notificationPreferences':
      return userMessages.filter((message) => message.pokeType === 'slack_reminder');
    case 'upgrade':
      return userMessages.filter((message) => message.pokeType === 'upgrade_reminder');
    default:
      return [];
  }
}

/**
 * Returns the stored message for the given page
 * @param state
 * @param page
 * @returns {*|*[]|[]}
 */
function getStoredMessagesForPage(state, page) {
  const { action } = page;
  if (action === 'dialog') {
    return getStoredMessagesForMarketPage(state, page);
  }
  const userMessages = state.userMessages || emptyUserMessageState;
  return getStoredMessagesForActionPage(userMessages, action);
}


/**
 * Gets all messages for pages that pertain to markets
 * @param state
 * @param page
 * @returns {*|*[]}
 */
function getStoredMessagesForMarketPage(state, page) {
  const { marketId, investibleId } = page;
  const marketMessages = state.marketMessages || emptyMarketMessagesState;
  const myMessages = marketMessages[marketId];
  if (_.isEmpty(myMessages)) {
    return [];
  }
  const { market, investible } = myMessages;
  if (_.isEmpty(investibleId)) {
    return market || [];
  }
  const thisInvestibleMessages = investible[investibleId] || [];
  return thisInvestibleMessages;
}

/**
 * Removes user messages from list that pertain to a particular
 * action
 * @param userMessages
 * @param action
 * @returns {*}
 */
function removeUserMessagesForAction(userMessages, action) {
  switch (action){
    case 'notificationPreferences':
      return userMessages.filter((message) => message.pokeType !== 'slack_reminder');
    case 'upgrade':
      return userMessages.filter((message) => message.pokeType != 'upgrade_reminder');
    default:
      return userMessages;
  }
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
  // all market pages are under /dialog
  if (action === 'dialog') {
    return removeStoredMessagesForMarketPage(state, page);
  }
  const userMessages = state.userMessages || emptyUserMessageState;
  const newUserMessages = removeUserMessagesForAction(userMessages, action)
  return {
    ...state,
    userMessages: newUserMessages
  }
}

/** Removes messages from the state that are for a
 * page pertaining to a market, or a subpage of a market
 * @param state
 * @param page
 * @returns {{marketMessages: *}|*}
 */
function removeStoredMessagesForMarketPage (state, page) {
  const marketMessages = state.marketMessages || emptyM;
  const { marketId, investibleId } = page;
  const myMessages = marketMessages[marketId];
  if (_.isEmpty(myMessages)) {
    return state;
  }
  const { market, investible } = marketMessages;
  if (_.isEmpty(investibleId)) {
    return {
      ...state,
      marketMessages: {
        ...marketMessages,
        [marketId]: {
          ...myMessages,
          market: []
        }
      }
    };
  }
  return {
    ...state,
    marketMessages: {
      ...market,
      [marketId]: {
        ...myMessages,
        investible: []
      }
    }
  };
}

/**
 * Generates the toasts for the messages on this page
 * @param messagesForPage
 */
function processToasts(messagesForPage) {
  const { redMessages, yellowMessages } = splitIntoLevels(messagesForPage);
  // all red messages get displayed immediately
  redMessages.forEach((message) => pushMessage(TOAST_CHANNEL, message));
  // for not bombarding the users sake, if we have more than one yellow message, we're
  // just going to display a summary message saying you have a bunch of updates
  if (!_.isEmpty(yellowMessages)) {
    const firstYellow = yellowMessages[0]
    if (yellowMessages.length > 1){
      const text = intl.formatMessage({id: 'notificationMulitpleUpdates'}, { n: yellowMessages.length})
    }else {
      pushMessage(TOAST_CHANNEL, firstYellow);
    }
  }
}

/** Functions that mutate the state */


function processPageChange (state, action) {
  const { page } = action;
  const messagesForPage = getStoredMessagesForPage(state, page);
  // first compute what the new messages will look like
  const newMessageState = removeStoredMessagesForPage(state, page);
  // then update the page to the current page
  const newState = {
    ...newMessageState,
    page
  };
  processToasts(messagesForPage);
  return newState;
}

/**
 * Takes a message and page, and
 * returns whether the message is for the given page
 * @param message
 * @param page
 * @returns {boolean}
 */
function pageMessageFilter(message, page) {
    const { marketId: mmId, investibleId: miId } = message;
    const { marketId: pmId, investibleId: piId } = page;
    // messages for a different market aren't mine
    if (mmId !== pmId) {
      return false;
    }
    // if we're for the same market, and the same investible value
    // we're fine: - note it's expected that a page with no investible
    // and a message with no Investible both have the investibleId set
    // to undefined
    return miId === piId;
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
  const newState = messagesToStore.reduce((acc, message) => {
    const { marketId, investibleId, pokeType } = message;
    const { messages } = acc;
    const messagesForMarket = messages[marketId] || emptyMarketState;
    const { marketMessages } = messagesForMarket;
    const { investibleMessages } = messagesForMarket;
    // we'll handle poke stuff (userMessages) first
    if (!_.isEmpty(pokeType)) {
      const userMessages = acc.userMessages || emptyUserMessageState;
      return {
        ...acc,
        userMessages: [...userMessages, message],
      };
    }
    // market stuff is below here
    // if we don't have an investible id, this is a new message for the market itself
    if (_.isEmpty(investibleId)) {
      const newMarketMessages = [...messagesForMarket, message];
      return {
        ...acc,
        messages: {
          [marketId]: {
            ...messagesForMarket,
            marketMessages: newMarketMessages
          }
        }
      };
    } else {
      // this update is bound for an individual investible in the market
      const newInvestibleMessages = {
        ...investibleMessages,
        [investibleId]: message,
      };
      return {
        ...acc,
        [marketId]: {
          ...messagesForMarket,
          investibleMessages: newInvestibleMessages,
        }
      };
    }
    return acc;
  }, state);
  return newState;
}

function doUpdateMessages (state, action) {
  const { messages } = action;
  const massagedMessages = getMassagedMessages(messages);
  // extract any messages for this page right now
  const { page } = state;
  // messages for this page, we should just toast, ever other should be stored in the state
  const pageMessages = massagedMessages.filter((message) => pageMessageFilter(message, page));
  const messagesToStore = massagedMessages.filter((message) => !pageMessageFilter(message, page));
  // toast the page messages
  processToasts(pageMessages);
  // and compute the new state
}
const messageRemovalFilter = (message) => !(message.type_object_id === rangeKey && message.market_id_user_id === hashKey);

/**
 * Removes all messages from the state that are for users
 * and match the range and hash key filter
 * @param state
 * @param hashKey
 * @param rangeKey
 * @returns {{userMessage: T[]}}
 */
function removeStoredUserMessages(state, hashKey, rangeKey) {
  const userMessages = state.userMessages || emptyUserMessageState;
  const newUserMessages = userMessages.filter(messageRemovalFilter);
  return {
    ...state,
    userMessage: newUserMessages,
  };
}

/**
 * Removes all messages from the state that are for markets and
 * match against the hash and range key filter
 * @param state
 * @param hashKey
 * @param rangeKey
 * @returns {{marketMessages: {}}}
 */
function removeStoredMarketMessages(state, hashKey, rangeKey) {
  const marketMessages = state.marketMessages || emptyMarketMessagesState;
  const newMessages = {...marketMessages};
  Object.keys(marketMessages).forEach((marketId) => {
    const { market, investible} = marketMessages[marketId];
    const newMarket = market.filter(messageRemovalFilter)
    const newInvestible = {...investible};
    Object.keys(investible).forEach((investibleId) => {
      const filtered = investible[investibleId].filter(messageRemovalFilter)
      newInvestible[investibleId] = filtered;
    });
    newMessages[marketId] = {
      market: newMarket,
      investible: newInvestible,
    };
  });
  return {
    ...state,
    marketMessages: newMessages,
  }
}

function doRemove (state, action) {
  const { hashKey, rangeKey } = action;
  // the market_id_user_id of the message is the backends hash key
  // the type_object_id is the backends range key
  const marketRemoved = removeStoredMarketMessages(state, hashKey, rangeKey);
  const userRemoved = removeStoredMarketMessages(marketRemoved, hashKey, rangeKey);
  return userRemoved;
}

function computeNewState (state, action) {
  switch (action.type) {
    case UPDATE_MESSAGES:
      return doUpdateMessages(state, action);
    case PAGE_CHANGED:
      return processPageChange(state, action);
    case INITIALIZE_STATE:
      return {
        ...action.newState,
        initializing: false,
      };
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
