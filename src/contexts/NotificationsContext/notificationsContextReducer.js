import LocalForageHelper from '../../utils/LocalForageHelper'
import _ from 'lodash'
import { getMassagedMessages } from '../../utils/messageUtils'
import { NOTIFICATIONS_CHANNEL } from './NotificationsContext'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'

export const NOTIFICATIONS_CONTEXT_NAMESPACE = 'notifications';
const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
const INITIALIZE_STATE = 'INITIALIZE_STATE';
const REMOVE_MESSAGE = 'REMOVE_MESSAGE';

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

export function initializeState (newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

/**
 * Data structure for storing messages is
 * state : {
 *   messages: [] // array containing all messages
 * }
 */

function refreshRecentMessages(state) {
  const { recent } = state;
  const date = new Date();
  const threeDaysAgo = date.setDate(date.getDate() - 3);
  const recentFiltered = (recent || []).filter((item) => item.removedAt > threeDaysAgo);
  return {
    ...state,
    recent: recentFiltered,
  };
}

/**
 * Stores messages in the state.
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
  const { messages: previousMessages } = state;
  const removed = _.differenceBy(previousMessages || [], messagesToStore || [], 'link');
  (removed || []).forEach((item) => item.removedAt = new Date());
  const newState = {
    ...state,
    messages: messagesToStore,
    recent: _.unionBy(removed || [], recent || [], 'link')
  };
  // Take this opportunity to clear old messages from the recent list
  return refreshRecentMessages(newState);
}

/**
 * Updates the message store with the new messages.
 * @param state
 * @param action
 * @returns {*}
 */
function doUpdateMessages (state, action) {
  const { messages } = action;
  const massagedMessages = getMassagedMessages(messages);
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
