import LocalForageHelper from '../../utils/LocalForageHelper'
import _ from 'lodash'
import { NOTIFICATIONS_CHANNEL } from './NotificationsContext'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { findMessagesForInvestibleId } from '../../utils/messageUtils'
import { getMarketClient } from '../../api/marketLogin'

export const NOTIFICATIONS_CONTEXT_NAMESPACE = 'notifications';
const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
const INITIALIZE_STATE = 'INITIALIZE_STATE';
const REMOVE_MESSAGES = 'REMOVE_MESSAGES';
const QUICK_REMOVE_MESSAGES = 'QUICK_REMOVE_MESSAGES';
const ADD_MESSAGE = 'ADD_MESSAGE';
const REMOVE_FOR_INVESTIBLE = 'REMOVE_FOR_INVESTIBLE';
const DEHIGHLIGHT_MESSAGES = 'DEHIGHLIGHT_MESSAGES';

/** Messages you can send the reducer */

export function updateMessages(messages) {
  return {
    type: UPDATE_MESSAGES,
    messages,
  };
}

export function removeMessages(messages) {
  return {
    type: REMOVE_MESSAGES,
    messages
  }
}

export function dehighlightMessages(messages) {
  return {
    type: DEHIGHLIGHT_MESSAGES,
    messages
  }
}

export function addMessage(message) {
  return {
    type: ADD_MESSAGE,
    message
  }
}

export function quickRemoveMessages(messages) {
  return {
    type: QUICK_REMOVE_MESSAGES,
    messages
  }
}

export function removeMessagesForInvestible(investibleId, useRemoveTypes) {
  return {
    type: REMOVE_FOR_INVESTIBLE,
    investibleId,
    useRemoveTypes
  }
}

export function initializeState (newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

/**
 * Stores messages in the state.
 * @param state
 * @param messagesToStore
 * @returns {*}
 */
function storeMessagesInState(state, messagesToStore) {
  return {
    messages: messagesToStore,
  };
}

/**
 * Updates the message store with the new messages.
 * @param state
 * @param action
 * @returns {*}
 */
function doUpdateMessages (state, action) {
  const { messages } = action;
  const { messages: existingMessages } = state;
  if (!_.isEmpty(existingMessages)) {
    const deletedMessages = existingMessages.filter((message) => message.deleted);
    if (!_.isEmpty(deletedMessages)) {
      messages.forEach((message) => {
        if (!_.isEmpty(deletedMessages.find((deletedMessage) => deletedMessage.type_object_id === message.type_object_id
            && message.updated_at === deletedMessage.updated_at))) {
          // Mark deleted any shadow copies of deleted messages before replacing
          message.deleted = true;
        }
      });
    }
  }
  return storeMessagesInState(state, messages);
}

function addSingleMessage(state, action) {
  const { message } = action;
  const { messages } = state;
  const newMessages = _.concat(messages || [], message);
  return storeMessagesInState(state, newMessages);
}

function removeForInvestible(state, action) {
  const { messages } = state;
  const { investibleId, useRemoveTypes } = action;
  const myMessages = findMessagesForInvestibleId(investibleId, state) || [];
  const filteredMessages = (messages || []).filter((aMessage) => {
    if ((myMessages || []).includes(aMessage)) {
      if (!useRemoveTypes) {
        return false;
      }
      return !useRemoveTypes.includes(aMessage.type);
    }
    return true;
  });
  return storeMessagesInState(state, filteredMessages);
}

function doRemoveMessages(state, action) {
  const { messages } = state;
  const { messages: toRemoveMessages } = action;
  const mappedMessages = (messages || []).map((aMessage) => {
    if (toRemoveMessages.find((msgId) => aMessage.type_object_id === msgId)) {
      return { ...aMessage, deleted: true};
    }
    return aMessage;
  });
  return storeMessagesInState(state, mappedMessages);
}

function doDehighlightMessages(state, action) {
  const { messages } = action;
  const { messages: existingMessages } = state;
  let allMessages = [];
  messages.forEach((id) => {
    const message = existingMessages.find((message) => message.type_object_id === id);
    if (message) {
      allMessages.push(message);
    }
  });
  const dehighlightedMessages = [];
  allMessages.forEach((message) => {
    if (message.is_highlighted) {
      dehighlightedMessages.push({ ...message, is_highlighted: false });
    }
  });
  if (_.isEmpty(dehighlightedMessages)) {
    return state;
  }
  const newMessages = _.unionBy(dehighlightedMessages, existingMessages, 'type_object_id');
  return storeMessagesInState(state, newMessages);
}

function computeNewState (state, action) {
  switch (action.type) {
    case UPDATE_MESSAGES:
      return doUpdateMessages(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    case REMOVE_MESSAGES:
    case QUICK_REMOVE_MESSAGES:
      return doRemoveMessages(state, action);
    case DEHIGHLIGHT_MESSAGES:
      return doDehighlightMessages(state, action);
    case ADD_MESSAGE:
      return addSingleMessage(state, action);
    case REMOVE_FOR_INVESTIBLE:
      return removeForInvestible(state, action);
    default:
      return state;
  }
}

function storeStatePromise(action, newState) {
  if (action.type !== INITIALIZE_STATE) {
    const lfh = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
    return lfh.setState(newState).then(() => {
      // In case the other tabs don't get the message
      const myChannel = new BroadcastChannel(NOTIFICATIONS_CHANNEL);
      return myChannel.postMessage(broadcastId || 'notifications').then(() => myChannel.close())
        .then(() => console.info('Update notifications context sent.'));
    });
  }
}

function reducer (state, action) {
  const isDehighilightRemove = [DEHIGHLIGHT_MESSAGES, REMOVE_MESSAGES].includes(action.type);
  if (isDehighilightRemove) {
    const { messages, message } = action;
    let allMessages = {};
    if (message) {
      if (message.market_id) {
        allMessages[message.market_id] = [];
        allMessages[message.market_id].push(message.type_object_id);
      }
    } else {
      const { messages: existingMessages } = state;
      (messages || []).forEach((messageId) => {
        const message = existingMessages.find((message) => message.type_object_id === messageId);
        if (message?.market_id) {
          if (!allMessages[message.market_id]) {
            allMessages[message.market_id] = [];
          }
          if (action.type !== DEHIGHLIGHT_MESSAGES || message.is_highlighted) {
            allMessages[message.market_id].push(message.type_object_id);
          }
        }
      });
    }
    Object.keys(allMessages).forEach((key) => {
      if (action.type === REMOVE_MESSAGES) {
        getMarketClient(key).then((client) => client.users.removeNotifications(allMessages[key])).then(() =>
          storeStatePromise(action, computeNewState(state, action)));
      } else if (!_.isEmpty(allMessages[key])) {
        getMarketClient(key).then((client) => client.users.dehighlightNotifications(allMessages[key]))
          .then(() => storeStatePromise(action, computeNewState(state, action)));
      }
    })
  }
  const newState = computeNewState(state, action);
  if (!isDehighilightRemove) {
    storeStatePromise(action, newState);
  }
  return newState;
}

export default reducer;
