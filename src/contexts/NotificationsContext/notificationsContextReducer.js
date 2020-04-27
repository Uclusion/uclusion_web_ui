import LocalForageHelper from '../../utils/LocalForageHelper'
import _ from 'lodash'
import { getMassagedMessages, splitIntoLevels } from '../../utils/messageUtils'
import { intl } from '../../components/ContextHacks/IntlGlobalProvider'
import { pushMessage } from '../../utils/MessageBusUtils'
import { NAVIGATION_CHANNEL, TOAST_CHANNEL } from './NotificationsContext'
import { HIGHLIGHTED_COMMENT_CHANNEL } from '../HighlightingContexts/highligtedCommentContextMessages'
import { HIGHLIGHTED_VOTING_CHANNEL } from '../HighlightingContexts/highligtedVotingContextMessages'
import { deleteMessage } from '../../api/users'

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
  // home page view
  if (_.isEmpty(action) || action === '/') {
    return messages.filter((message) => message.pokeType === 'new_user');
  }
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
  const messages = (state || {messages: []}).messages || emptyMessagesState;
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
  // home page view
  if (_.isEmpty(action) || action === '/') {
    return messages.filter((message) => message.pokeType !== 'new_user')
  }
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

/**
 * System messages are those that don't require a toast
 * or highlight, but direct the system to do something.
 * For instance the new user notification directs the system
 * to redirect the user to the create market page
 * @param messagesForPage
 */
function processSystemMessages(messagesForPage) {
  // we're not going to consider the case of system actions
  // conflicting with each other, until it actually happens
  messagesForPage.forEach((message) => {
    // system messages all use the pokeType
    const { pokeType } = message;
    // the new user system message sends them to dialogAdd for a new planning market
    if (pokeType === 'new_user') {
      const link = '/dialogAdd#type=PLANNING'
      pushMessage(NAVIGATION_CHANNEL, { link });
    }
  });
}

/**
 * Sends messages to the highlighting system
 * to tell it to highlight sections of the page
 * pertaining to the messages
 * @param messagesForPage
 */
function processHighlighting(messagesForPage) {
  messagesForPage.forEach((message) => {
    const {
      commentId,
      associatedUserId,
    } = message;
    if (!_.isEmpty(commentId)) {
      pushMessage(HIGHLIGHTED_COMMENT_CHANNEL, message);
    }
    if (!_.isEmpty(associatedUserId)) {
      pushMessage(HIGHLIGHTED_VOTING_CHANNEL, message);
    }
  });
}

/* Generates the toasts for the messages on this page
 * @param messagesForPage
 */
function processToasts(messagesForPage) {
  // remove system messages because they don't pop (there's only new user now)
  const messages = messagesForPage.filter((message) => message.pokeType !== 'new_user');
  const { redMessages, yellowMessages } = splitIntoLevels(messages);
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
 * The messages for the current page need to
 * be toasted, highlighted, reported to the server, etc.
 * @param pageMessages
 */
function handleMessagesForPage(pageMessages) {
  console.log(pageMessages);
  if (!_.isEmpty(pageMessages)) {
    // process highlighting
    processHighlighting(pageMessages);
    // toast the page messages
    processToasts(pageMessages);
    // and tell the backend we've processed them immediately
    // the backend only needs the first message to figure out all of them
    // have been viewed
    const firstMessage = pageMessages[0];
    deleteMessage(firstMessage)
      .catch((error) => console.error(error)); // not much to do other than log it.
    // lastly process any system messages
    processSystemMessages(pageMessages);
  }
}

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
  if (_.isEmpty(page)) {
    return; // send me a bad page I ingore you
  }
  const messagesForPage = getStoredMessagesForPage(state, page);
  // first compute what the new messages will look like
  const newMessageState = removeStoredMessagesForPage(state, page);
  // then update the page to the current page
  const newState = {
    ...state,
    messages: newMessageState,
    page
  };
  // now do all the magic for the messages we want to display
  handleMessagesForPage(messagesForPage);
  return newState;
}

/**
 * Stores messages in the state. Note,
 * we do not store messages for the page you are
 * on, but immediately display them
 * @param state
 * @param messagesToStore
 * @returns {*}
 */
function storeMessagesInState(state, messagesToStore) {
  const { initializing } = state;
  if (initializing) {
    return {
      messages: messagesToStore,
    };
  }
  return {
    ...state,
    messages: messagesToStore,
  };
}

/**
 * Updates the message store with the new messages. Does
 * similar things to a page change, we should probably
 * combine these two at some point.
 * @param state
 * @param action
 * @returns {*}
 */
function doUpdateMessages (state, action) {
  const { messages } = action;
  const massagedMessages = getMassagedMessages(messages);
  // extract any messages for this page right now
  const { page } = state;
  if (_.isEmpty(page)) {
    storeMessagesInState(state, messages);
    return;
  }
  // we can reuse the code for finding and removing page messages in the store, if we make the new
  // incoming messages look like they came from the store
  const pageMessages = getStoredMessagesForPage({messages: massagedMessages}, page);
  // the messages to store are the ones we can't immediately handle on the current page
  const messagesToStore = removeStoredMessagesForPage({ messages: massagedMessages}, page);
  // now do all the magic for the messages we want to display
  handleMessagesForPage(pageMessages);
  // last compute the new state
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
