import LocalForageHelper from '../../utils/LocalForageHelper'
import _ from 'lodash'
import { NOTIFICATIONS_CHANNEL } from './NotificationsContext'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { findMessagesForInvestibleId } from '../../utils/messageUtils'
import { getMarketClient } from '../../api/uclusionClient'

export const NOTIFICATIONS_CONTEXT_NAMESPACE = 'notifications';
const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
const INITIALIZE_STATE = 'INITIALIZE_STATE';
const REMOVE_MESSAGES = 'REMOVE_MESSAGES';
const LEVEL_MESSAGE = 'LEVEL_MESSAGE';
const ADD_MESSAGE = 'ADD_MESSAGE';
const REMOVE_FOR_INVESTIBLE = 'REMOVE_FOR_INVESTIBLE';
const DEHIGHLIGHT_MESSAGES = 'DEHIGHLIGHT_MESSAGES';
const CURRENT_MESSAGE = 'CURRENT_MESSAGE';
const REMOVE_CURRENT_MESSAGE = 'REMOVE_CURRENT_MESSAGE';

/** Messages you can send the reducer */

export function updateMessages(messages) {
  return {
    type: UPDATE_MESSAGES,
    messages,
  };
}

export function makeCurrentMessage(message) {
  return {
    type: CURRENT_MESSAGE,
    message
  }
}

export function removeCurrentMessage() {
  return {
    type: REMOVE_CURRENT_MESSAGE
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

export function initializeState (newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

function keepRelevantState(state, found, messagesToStore, current) {
  const { initializing } = state;
  if (initializing) {
    if (found) {
      return {
        messages: messagesToStore,
        current
      };
    }
    return {
      messages: messagesToStore,
    };
  }
  if (found) {
    return {
      ...state,
      messages: messagesToStore
    };
  }
  return {
    messages: messagesToStore,
  };
}

/**
 * Stores messages in the state.
 * @param state
 * @param messagesToStore
 * @returns {*}
 */
function storeMessagesInState(state, messagesToStore) {
  const { current } = state;
  const useCurrent = current || {};
  const found = (messagesToStore || []).find((aMessage) => aMessage.market_id_user_id === useCurrent.market_id_user_id
    && aMessage.type_object_id === useCurrent.type_object_id);
  return keepRelevantState(state, found, messagesToStore, current);
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
    const message = existingMessages.find((message) => message.type_object_id = id);
    if (message) {
      allMessages = allMessages.concat(message);
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

function markMessageCurrent(state, action) {
  const { message } = action;
  const { messages: existingMessages } = state;
  const found = (existingMessages || []).find((aMessage) => aMessage.market_id_user_id === message.market_id_user_id
    && aMessage.type_object_id === message.type_object_id);
  if (found && !message.id) {
    return { ...state, current: found };
  }
  if (message.id) {
    // Messages with IDs are coming from outbox
    return { ...state, current: message };
  }
  return removeMessageCurrent(state);
}

function removeMessageCurrent(state) {
  const { messages } = state;
  return keepRelevantState(state, false, messages);
}

function computeNewState (state, action) {
  switch (action.type) {
    case UPDATE_MESSAGES:
      return doUpdateMessages(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    case REMOVE_MESSAGES:
      return doRemoveMessages(state, action);
    case DEHIGHLIGHT_MESSAGES:
      return doDehighlightMessages(state, action);
    case ADD_MESSAGE:
      return addSingleMessage(state, action);
    case LEVEL_MESSAGE:
      return changeLevelSingleMessage(state, action);
    case REMOVE_FOR_INVESTIBLE:
      return removeForInvestible(state, action);
    case CURRENT_MESSAGE:
      return markMessageCurrent(state, action);
    case REMOVE_CURRENT_MESSAGE:
      return removeMessageCurrent(state);
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
      (messages || []).forEach((id) => {
        const message = existingMessages.find((message) => message.type_object_id === id);
        if (message && message.market_id) {
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
