import LocalForageHelper from '../../utils/LocalForageHelper'
import _ from 'lodash'
import { NOTIFICATIONS_CHANNEL } from './NotificationsContext'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { findMessagesForInvestibleId } from '../../utils/messageUtils'

export const NOTIFICATIONS_CONTEXT_NAMESPACE = 'notifications';
const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
const INITIALIZE_STATE = 'INITIALIZE_STATE';
const REMOVE_MESSAGE = 'REMOVE_MESSAGE';
const REMOVE_MESSAGES = 'REMOVE_MESSAGES';
const DEHIGHLIGHT_MESSAGE = 'DEHIGHLIGHT_MESSAGE';
const LEVEL_MESSAGE = 'LEVEL_MESSAGE';
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

export function removeMessage(message) {
  return {
    type: REMOVE_MESSAGE,
    message
  }
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

export function removeMessagesForInvestible(investibleId, useRemoveTypes) {
  return {
    type: REMOVE_FOR_INVESTIBLE,
    investibleId,
    useRemoveTypes
  }
}

export function changeLevelMessage(message, level) {
  return {
    type: LEVEL_MESSAGE,
    message,
    level
  }
}

export function dehighlightMessage(message) {
  return {
    type: DEHIGHLIGHT_MESSAGE,
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
 * Stores messages in the state.
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
    messages: messagesToStore
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
        if (!_.isEmpty(
          deletedMessages.find((deletedMessage) => deletedMessage.type_object_id === message.type_object_id))) {
          // Mark deleted any shadow copies of deleted messages before replacing
          message.deleted = true;
        }
      });
    }
  }
  return storeMessagesInState(state, messages);
}

function removeSingleMessage(state, action) {
  const { message } = action;
  const { messages } = state;
  if (message.deleted) {
    // This is a soft delete to avoid eventually consistent shadow copies
    return modifySingleMessage(state, message, (message) => {
      return { ...message, deleted: true };
    });
  } else {
    const filteredMessages = (messages || []).filter((aMessage) =>
      aMessage.market_id_user_id !== message.market_id_user_id || aMessage.type_object_id !== message.type_object_id);
    return storeMessagesInState(state, filteredMessages);
  }
}

function addSingleMessage(state, action) {
  const { message } = action;
  const { messages } = state;
  const newMessages = _.concat(messages || [], message);
  return storeMessagesInState(state, newMessages);
}

function modifySingleMessage(state, message, modifyFunc) {
  const { messages } = state;
  const oldMessage = (messages || []).find((oldMessage) => oldMessage.market_id_user_id === message.market_id_user_id
    && oldMessage.type_object_id === message.type_object_id);
  if (oldMessage) {
    const newMessage = modifyFunc(oldMessage);
    // type_object_id sufficient to do the union because user id is the same and object id unique even without market id
    const newMessages = _.unionBy([newMessage], messages, 'type_object_id');
    return storeMessagesInState(state, newMessages);
  }
  return state;
}

function changeLevelSingleMessage(state, action) {
  const { message, level } = action;
  return modifySingleMessage(state, message, (message) => {
    return { ...message, level };
  });
}

function dehighlightSingleMessage(state, action) {
  const { message } = action;
  return modifySingleMessage(state, message, (message) => {
    return { ...message, is_highlighted: false};
  });
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
  const filteredMessages = (messages || []).filter((aMessage) => {
    return !(toRemoveMessages || []).includes(aMessage);
  });
  return storeMessagesInState(state, filteredMessages);
}

function doDehighlightMessages(state, action) {
  const { messages } = action;
  const { messages: existingMessages } = state;
  const dehighlightedMessages = [];
  (messages || []).forEach((message) => {
    dehighlightedMessages.push({...message, is_highlighted: false});
  });
  const newMessages = _.unionBy(dehighlightedMessages, existingMessages, 'type_object_id');
  return storeMessagesInState(state, newMessages);
}

function computeNewState (state, action) {
  switch (action.type) {
    case UPDATE_MESSAGES:
      return doUpdateMessages(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    case REMOVE_MESSAGE:
      return removeSingleMessage(state, action);
    case REMOVE_MESSAGES:
      return doRemoveMessages(state, action);
    case DEHIGHLIGHT_MESSAGES:
      return doDehighlightMessages(state, action);
    case ADD_MESSAGE:
      return addSingleMessage(state, action);
    case DEHIGHLIGHT_MESSAGE:
      return dehighlightSingleMessage(state, action);
    case LEVEL_MESSAGE:
      return changeLevelSingleMessage(state, action);
    case REMOVE_FOR_INVESTIBLE:
      return removeForInvestible(state, action);
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
