import LocalForageHelper from '../../utils/LocalForageHelper'
import _ from 'lodash'
import { getMassagedMessages } from '../../utils/messageUtils'
import { pushMessage } from '../../utils/MessageBusUtils'
import { NOTIFICATIONS_CHANNEL } from './NotificationsContext'
import { HIGHLIGHTED_COMMENT_CHANNEL } from '../HighlightingContexts/highligtedCommentContextMessages'
import { HIGHLIGHTED_VOTING_CHANNEL } from '../HighlightingContexts/highligtedVotingContextMessages'
import { NO_PIPELINE_TYPE, USER_POKED_TYPE } from '../../constants/notifications'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { decomposeMarketPath } from '../../utils/marketIdPathFunctions'

export const NOTIFICATIONS_CONTEXT_NAMESPACE = 'notifications';
const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
const INITIALIZE_STATE = 'INITIALIZE_STATE';
const PAGE_CHANGED = 'PAGE_CHANGED';
const REMOVE_MESSAGE = 'REMOVE_MESSAGE';

// Empty state of the various subkeys of the state, useful for avoiding errors
const emptyMessagesState = [];
/** Messages you can send the reducer */

export function updateMessages (messages) {
  return {
    type: UPDATE_MESSAGES,
    messages,
  };
}

export function removeMessage(message) {
  return {
    type: REMOVE_MESSAGE,
    message
  }
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
 * Returns the stored message for the given page
 * @param state
 * @param page
 * @returns {*|*[]|[]}
 */
function getStoredMessagesForPage(state, page) {
  const messages = (state || {messages: []}).messages || emptyMessagesState;
  const { marketId, investibleId } = page;
  // it is assumed a page for a market will have an undefined investible id
  // and that a store message for the market will also
  return messages.filter((message) => {
    const { market_id: messageMarketId, investible_id: messageInvestibleId, link_multiple: linkMultiple } = message;
    if (messageMarketId === marketId && messageInvestibleId === investibleId) {
      return true;
    }
    if (!linkMultiple) {
      return false;
    }
    const urlParts = new URL(linkMultiple, 'https://blah');
    // A link multiple may contain an alternate market id and investible id for instance for decision options
    const { marketId: linkMarketId, investibleId: linkInvestibleId } = decomposeMarketPath(urlParts.pathname);
    return marketId === linkMarketId && investibleId === linkInvestibleId;
  });
}

/** Stores recently viewed in the state
 * @param state
 * @param page
 * @returns {{marketMessages: *}|*}
 */
function processRecentlyViewed(state, page) {
  const { marketId, investibleId } = page;
  const messages = (state || {}).messages || emptyMessagesState;
  const { recent } = state;
  const viewed = messages.filter((message) => message.market_id === marketId && message.investible_id === investibleId);
  const viewedMassaged = (viewed || []).map((item) => { return { ...item, viewedAt: new Date()}; });
  const viewedMassagedFiltered = (viewedMassaged || []).filter((item) => item.type !== NO_PIPELINE_TYPE
    && item.type !== USER_POKED_TYPE)
  const newState = {
    ...state,
    recent: _.unionBy(viewedMassagedFiltered || [], recent || [], 'link'),
  }
  return storeMessagesInState(newState, messages);
}

/**
 * Sends messages to the highlighting system
 * to tell it to highlight sections of the page
 * pertaining to the messages
 */
function processHighlighting(state, page) {
  const messagesForPage = getStoredMessagesForPage(state, page);
  (messagesForPage || []).forEach((message) => {
    const {
      link_type: linkType
    } = message;
    if (!linkType) {
      return;
    }
    if (linkType.includes('VOTE')) {
      pushMessage(HIGHLIGHTED_VOTING_CHANNEL, message);
    }
    else if ( linkType.includes('COMMENT') || linkType.includes('INVESTIBLE')) {
      pushMessage(HIGHLIGHTED_COMMENT_CHANNEL, message);
    }
  });
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
    return state; // send me a bad page I ignore you
  }
  const { isEntry } = page;
  if (!isEntry) {
    // If they have left the page we don't want to process messages on it
    return {
      ...state,
      page: undefined
    };
  }
  processHighlighting(state, page);
  // first compute what the new messages will look like
  const newMessageState = processRecentlyViewed(state, page);
  // then update the page to the current page
  return {
    ...newMessageState,
    page
  };
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
  const newState = {
    ...state,
    messages: messagesToStore,
  };
  // Take this opportunity to clear old messages from the recent list
  return refreshRecentMessages(newState)
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
  const { page } = state;
  if (_.isEmpty(page)) {
    return storeMessagesInState(state, massagedMessages);
  }
  processHighlighting({messages: massagedMessages}, page);
  return storeMessagesInState(state, massagedMessages);
}

function removeSingleMessage(state, action) {
  const { message } = action;
  const { messages } = state;
  const filteredMessages = (messages || []).filter((aMessage) =>
    aMessage.market_id_user_id !== message.market_id_user_id || aMessage.type_object_id !== message.type_object_id);
  return storeMessagesInState(state, filteredMessages);
}

function computeNewState (state, action) {
  switch (action.type) {
    case UPDATE_MESSAGES:
      return doUpdateMessages(state, action);
    case PAGE_CHANGED:
      return processPageChange(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    case REMOVE_MESSAGE:
      return removeSingleMessage(state, action);
    default:
      return state;
  }
}

function reducer (state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE) {
    const lfh = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
    lfh.setState(newState).then(() => {
      // In case the other tabs don't get the message
      const myChannel = new BroadcastChannel(NOTIFICATIONS_CHANNEL);
      return myChannel.postMessage(broadcastId || 'notifications').then(() => myChannel.close())
        .then(() => console.info('Update notifications context sent.'));
    });
  }
  return newState;
}

export default reducer;
