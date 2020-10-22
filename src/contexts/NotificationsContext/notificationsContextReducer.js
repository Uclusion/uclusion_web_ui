import LocalForageHelper from '../../utils/LocalForageHelper'
import _ from 'lodash'
import { getMassagedMessages, splitIntoLevels } from '../../utils/messageUtils'
import { intl } from '../../components/ContextHacks/IntlGlobalProvider'
import { pushMessage } from '../../utils/MessageBusUtils'
import { NOTIFICATIONS_CHANNEL, TOAST_CHANNEL } from './NotificationsContext'
import { HIGHLIGHTED_COMMENT_CHANNEL } from '../HighlightingContexts/highligtedCommentContextMessages'
import { HIGHLIGHTED_VOTING_CHANNEL } from '../HighlightingContexts/highligtedVotingContextMessages'
import { deleteMessage } from '../../api/users'
import { getFullLink } from '../../components/Notifications/Notifications'
import { NO_PIPELINE_TYPE, USER_POKED_TYPE } from '../../constants/notifications'
import { BroadcastChannel } from 'broadcast-channel'
import { MARKETS_CHANNEL } from '../MarketsContext/MarketsContext'

export const NOTIFICATIONS_CONTEXT_NAMESPACE = 'notifications';
const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
const INITIALIZE_STATE = 'INITIALIZE_STATE';
const PAGE_CHANGED = 'PAGE_CHANGED';
const REFRESH_RECENT= 'REFRESH_RECENT';

// Empty state of the various subkeys of the state, useful for avoiding errors
const emptyMessagesState = [];
/** Messages you can send the reducer */

export function updateMessages (messages) {
  return {
    type: UPDATE_MESSAGES,
    messages,
  };
}

export function refreshRecent() {
  return {
    type: REFRESH_RECENT,
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
 * @param messages
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
 * @param messages
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
 * @param messages
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
function removeStoredMessagesForMarketPage (state, page) {
  const { marketId, investibleId } = page;
  const messages = (state || {}).messages || emptyMessagesState;
  const { recent } = state;
  const removed = messages.filter((message) =>
    message.marketId === marketId && message.investibleId === investibleId);
  const removedMassaged = (removed || []).map((item) => {
    return { ...item, link: getFullLink(item), viewedAt: new Date()};
  });
  const removedMassagedFiltered = (removedMassaged || []).filter((item) => item.aType !== NO_PIPELINE_TYPE
    && item.aType !== USER_POKED_TYPE)
  const newState = {
    ...state,
    recent: _.unionBy(removedMassagedFiltered || [], recent || [], 'link'),
  }
  return storeMessagesInState(newState,
    messages.filter((message) => message.marketId !== marketId || message.investibleId !== investibleId));
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
  const messages = (state || {}).messages || emptyMessagesState;
  return storeMessagesInState(state, removeStoredMessagesForAction(messages, action))
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
      associatedInvestibleId
    } = message;
    if (!_.isEmpty(commentId) || !_.isEmpty(associatedInvestibleId)) {
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
  const { redMessages, yellowMessages } = splitIntoLevels(messagesForPage);
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
  if (!_.isEmpty(pageMessages)) {
    // process highlighting
    processHighlighting(pageMessages);
    // toast the page messages
    processToasts(pageMessages);
    const notAssociatedInvestible = pageMessages.filter((message) => {
      const { associatedInvestibleId } = message;
      if (associatedInvestibleId) {
        // Each of these has to be deleted individually since we are not on that page
        deleteMessage(message)
          .catch((error) => console.error(error));
        return false;
      }
      return true;
    })
    if (!_.isEmpty(notAssociatedInvestible)) {
      // and tell the backend we've processed them immediately
      // the backend only needs the first message to figure out all of them
      // have been viewed
      const firstMessage = notAssociatedInvestible[0];
      deleteMessage(firstMessage)
        .catch((error) => console.error(error)); // not much to do other than log it.
    }
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
    return state; // send me a bad page I ingore you
  }
  const { isEntry } = page;
  if (!isEntry) {
    // If they have left the page we don't want to process messages on it
    return {
      ...state,
      page: undefined
    };
  }
  const messagesForPage = getStoredMessagesForPage(state, page);
  // first compute what the new messages will look like
  const newMessageState = removeStoredMessagesForPage(state, page);
  // then update the page to the current page
  const newState = {
    ...newMessageState,
    page
  };
  // now do all the magic for the messages we want to display
  handleMessagesForPage(messagesForPage);
  return newState;
}

function refreshRecentMessages(state) {
  const { recent } = state;
  const date = new Date();
  const yesterday = date.setDate(date.getDate() - 1);
  const recentFiltered = (recent || []).filter((item) => item.viewedAt > yesterday);
  return {
    ...state,
    recent: recentFiltered,
  };
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
  const { initializing, recent } = state;
  if (initializing) {
    return {
      messages: messagesToStore,
      recent
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
    return storeMessagesInState(state, massagedMessages);
  }
  // we can reuse the code for finding and removing page messages in the store, if we make the new
  // incoming messages look like they came from the store
  const pageMessages = getStoredMessagesForPage({messages: massagedMessages}, page);
  // the messages to store are the ones we can't immediately handle on the current page
  const newStore = removeStoredMessagesForPage(storeMessagesInState(state, massagedMessages), page);
  // now do all the magic for the messages we want to display
  handleMessagesForPage(pageMessages);
  // last compute the new state
  return newStore;
}

function computeNewState (state, action) {
  switch (action.type) {
    case UPDATE_MESSAGES:
      return doUpdateMessages(state, action);
    case PAGE_CHANGED:
      return processPageChange(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    case REFRESH_RECENT:
      return refreshRecentMessages(state);
    default:
      return state;
  }
}

function reducer (state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE) {
    const lfh = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
    lfh.setState(newState).then(() => {
      // Recently viewed is client specific. It does not work off of messages removed by the back
      // end because those might not have been recently viewed. Nor are we saving recently viewed globally.
      // So each local tab must be informed of changes.
      if (action.type !== REFRESH_RECENT) {
        const myChannel = new BroadcastChannel(NOTIFICATIONS_CHANNEL);
        return myChannel.postMessage('notifications').then(() => myChannel.close())
          .then(() => console.info('Update notifications context sent.'));
      }
    });
  }
  return newState;
}

export default reducer;
