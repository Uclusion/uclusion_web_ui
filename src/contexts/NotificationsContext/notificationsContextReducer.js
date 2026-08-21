import LocalForageHelper from '../../utils/LocalForageHelper'
import _ from 'lodash'
import { findMessagesForInvestibleId } from '../../utils/messageUtils'
import { leaderContextHack } from '../LeaderContext/LeaderContext';
import { flushPendingClears, PENDING_CLEARS_ACKED } from './pendingClearsFlusher';
import { timeSpan, timeSpanAsync } from '../../utils/renderProfiler';
import { getInboxTarget, getMessageId, isInboxItemNavigationUrl, isInInbox } from './notificationsContextHelper';

export const NOTIFICATIONS_CONTEXT_NAMESPACE = 'notifications';
const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
const INITIALIZE_STATE = 'INITIALIZE_STATE';
const REMOVE_MESSAGES = 'REMOVE_MESSAGES';
const REMOVE_NAVIGATION = 'REMOVE_NAVIGATION';
const CLEAR_NAVIGATIONS = 'CLEAR_NAVIGATIONS';
const ADD_NAVIGATION = 'ADD_NAVIGATION';
const QUICK_REMOVE_MESSAGES = 'QUICK_REMOVE_MESSAGES';
const ADD_MESSAGE = 'ADD_MESSAGE';
const REMOVE_FOR_INVESTIBLE = 'REMOVE_FOR_INVESTIBLE';
const DEHIGHLIGHT_MESSAGES = 'DEHIGHLIGHT_MESSAGES';
const DEHIGHLIGHT_CRITICAL_MESSAGE = 'DEHIGHLIGHT_CRITICAL_MESSAGE';

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

export function removeNavigation(url) {
  return {
    type: REMOVE_NAVIGATION,
    url
  }
}

export function clearNavigations() {
  return {
    type: CLEAR_NAVIGATIONS
  }
}

export function addNavigation(url, allExistingUrls) {
  return {
    type: ADD_NAVIGATION,
    url,
    allExistingUrls
  }
}

export function dehighlightMessages(messages, isPromise=false) {
  return {
    type: DEHIGHLIGHT_MESSAGES,
    messages,
    isPromise
  }
}

export function dehighlightCriticalMessage(message, originalMessage) {
  return {
    type: DEHIGHLIGHT_CRITICAL_MESSAGE,
    message,
    originalMessage
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
 * @param pendingClears
 * @returns {*}
 */
function storeMessagesInState(state, messagesToStore, pendingClears) {
  return {
    messages: messagesToStore,
    navigations: pruneNavigationsForMessages(state.navigations, messagesToStore),
    pendingClears: pendingClears || state.pendingClears || []
  };
}

// T-all-2492: a Back entry pointing at a notification outlives the notification unless it is
// dropped here. Every way one disappears - explicit remove, quick remove, the investible sweep,
// or the server list no longer carrying the row - writes through storeMessagesInState, so this
// is the one place that closes the whole class instead of one producer at a time. Returns the
// same array when nothing goes, which is what keeps the S-all-255 no-change bail out below alive.
function pruneNavigationsForMessages(navigations, messagesToStore) {
  if (_.isEmpty(navigations) || !navigations.find((navigation) => isInboxItemNavigationUrl(navigation.url))) {
    return navigations;
  }
  const liveUrls = new Set((messagesToStore || []).filter((message) => isInInbox(message))
    .map((message) => `${getInboxTarget(message)}/${getMessageId(message)}`));
  const kept = navigations.filter((navigation) => !isInboxItemNavigationUrl(navigation.url) ||
    liveUrls.has(navigation.url));
  return _.size(kept) === _.size(navigations) ? navigations : kept;
}

// B-all-544: clears are delivered by the background flusher, so they are enqueued durably
// alongside the tombstone instead of fired and forgotten. Entries without a market cannot be
// sent and rollup ids may repeat, so both are filtered here.
function withEnqueuedClears(state, additions) {
  const existing = state.pendingClears || [];
  const fresh = additions.filter((addition) => addition.marketId &&
    !existing.find((entry) => entry.typeObjectId === addition.typeObjectId && entry.event === addition.event));
  return _.isEmpty(fresh) ? existing : existing.concat(fresh);
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
  const reEnqueued = [];
  if (!_.isEmpty(existingMessages)) {
    const deletedMessages = existingMessages.filter((message) => message.deleted);
    if (!_.isEmpty(deletedMessages)) {
      const pending = state.pendingClears || [];
      messages.forEach((message) => {
        if (!_.isEmpty(deletedMessages.find((deletedMessage) => deletedMessage.type_object_id === message.type_object_id
            && message.updated_at === deletedMessage.updated_at))) {
          // Mark deleted any shadow copies of deleted messages before replacing
          message.deleted = true;
          // B-all-544: the server still returning this row highlighted means its clear was
          // lost (the old mechanism dropped them) - re-enqueue delivery to self-heal the drift
          if (message.is_highlighted &&
              !pending.find((entry) => entry.typeObjectId === message.type_object_id)) {
            reEnqueued.push({ typeObjectId: message.type_object_id, marketId: message.market_id, event: 'remove' });
          }
        }
      });
    }
  }
  // S-all-255: most syncs return an unchanged list; returning the identical state object lets React
  // bail out of the dispatch, so none of the 70-plus consumers re-render and the reducer wrapper
  // skips the IndexedDB clone. The check has to come after the loop above, because that is what
  // stamps the local deleted tombstones onto the fetched rows - comparing before it would see a
  // difference on every sync as soon as anything had been cleared, which is most of the time.
  if (_.isEmpty(reEnqueued) && _.isEqual(existingMessages, messages)) {
    return state;
  }
  return storeMessagesInState(state, messages, withEnqueuedClears(state, reEnqueued));
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
  const { messages: toRemoveMessages, isPromise } = action;
  const additions = [];
  const mappedMessages = (messages || []).map((aMessage) => {
    if (toRemoveMessages.find((msgId) => aMessage.type_object_id === msgId)) {
      // isPromise means the caller runs the network call itself
      if (!isPromise) {
        additions.push({ typeObjectId: aMessage.type_object_id, marketId: aMessage.market_id, event: 'remove' });
      }
      return { ...aMessage, deleted: true};
    }
    return aMessage;
  });
  return storeMessagesInState(state, mappedMessages, withEnqueuedClears(state, additions));
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
  const additions = action.isPromise ? [] : dehighlightedMessages.map((message) => (
    { typeObjectId: message.type_object_id, marketId: message.market_id, event: 'dehighlight' }));
  const newMessages = _.unionBy(dehighlightedMessages, existingMessages, 'type_object_id');
  return storeMessagesInState(state, newMessages, withEnqueuedClears(state, additions));
}

function doDehighlightCriticalMessage (state, action) {
  const { messages: existingMessages } = state;
  const { message: rollupTypeObjectId, originalMessage } = action;
  const message = existingMessages?.find((message) => message.type_object_id === rollupTypeObjectId);
  if (_.isEmpty(message)) {
    return state;
  }
  const originalId = originalMessage.split('_')[1];
  const { highlighted_list: highlightedList } = message;
  if (!_.isEmpty(highlightedList)) {
    message.highlighted_list = highlightedList.filter((id) => id !== originalId);
  }
  if (_.isEmpty(message.highlighted_list)) {
    message.is_highlighted = false;
  }
  // The rollup is client-side only; the server row to dehighlight is the original message
  const additions = [{ typeObjectId: originalMessage, marketId: message.market_id, event: 'dehighlight' }];
  const newMessages = _.unionBy([message], existingMessages, 'type_object_id');
  return storeMessagesInState(state, newMessages, withEnqueuedClears(state, additions));
}

function doRemoveNavigation (state, action) {
  const { navigations } = state;
  const { url } = action;
  const filteredNavigations = navigations.filter((aNavigation) => {
    return aNavigation.url !== url;
  });
  return {
    messages: state.messages,
    navigations: filteredNavigations,
    pendingClears: state.pendingClears || []
  };
}

function doClearNavigations(state) {
  if (_.isEmpty(state.navigations)) {
    return state;
  }
  return {
    ...state,
    navigations: []
  };
}

function doAddNavigation(state, action) {
  const { url, allExistingUrls } = action;
  const { navigations } = state;
  const prunedNavigations = (navigations || []).filter((navigation) => navigation.url !== url);
  const newNavigations = _.concat(prunedNavigations, {url, time: new Date().getTime()});
  const now = Date.now();
  const filteredNavigations = newNavigations.filter((aNavigation) => {
    if (!allExistingUrls?.includes(aNavigation.url)) {
      return false;
    }
    // remove more than a day old
    return now - aNavigation.time < 86400000;
  });
  return {
    messages: state.messages,
    navigations: filteredNavigations,
    pendingClears: state.pendingClears || []
  };
}

function doClearsAcked(state, action) {
  const { acked } = action;
  const pendingClears = (state.pendingClears || []).filter((entry) =>
    !acked.find((ackedEntry) => ackedEntry.typeObjectId === entry.typeObjectId &&
      ackedEntry.event === entry.event));
  return { ...state, pendingClears };
}

function computeNewState (state, action) {
  switch (action.type) {
    case UPDATE_MESSAGES:
      return doUpdateMessages(state, action);
    case INITIALIZE_STATE:
      // T-all-2494: custom Back history belongs to this tab. Ignore legacy entries from the
      // shared NotificationsContext store without overwriting navigation that happened while
      // its asynchronous read was still in flight.
      return { ...action.newState, navigations: state.navigations || [],
        pendingClears: action.newState.pendingClears || [] };
    case PENDING_CLEARS_ACKED:
      return doClearsAcked(state, action);
    case REMOVE_MESSAGES:
    case QUICK_REMOVE_MESSAGES:
      return doRemoveMessages(state, action);
    case DEHIGHLIGHT_MESSAGES:
      return doDehighlightMessages(state, action);
    case DEHIGHLIGHT_CRITICAL_MESSAGE:
      return doDehighlightCriticalMessage(state, action);
    case ADD_MESSAGE:
      return addSingleMessage(state, action);
    case REMOVE_NAVIGATION:
      return doRemoveNavigation(state, action);
    case CLEAR_NAVIGATIONS:
      return doClearNavigations(state);
    case ADD_NAVIGATION:
      return doAddNavigation(state, action);
    case REMOVE_FOR_INVESTIBLE:
      return removeForInvestible(state, action);
    default:
      return state;
  }
}

// T-all-2485: every sibling context chains its writes, this one fired an unchained setTimeout
// so two writes could land out of order. R-all-2306 makes that inconsistency load bearing,
// because the release has to await each context's storage chain before telling other tabs to
// reload, and a chain that does not exist cannot be awaited.
let notificationsStoragePromiseChain = Promise.resolve(true);

function storeStatePromise(action, newState) {
  if (action.type !== INITIALIZE_STATE) {
    const { isLeader } = leaderContextHack;
    if (isLeader) {
      const lfh = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
      // T-all-2494: LocalForage is shared by every tab. Keep the field for storage-schema and
      // mixed-version compatibility, but never persist one tab's custom Back history.
      const stateToStore = { ...newState, navigations: [] };
      return timeSpanAsync('idb:notifications', () => lfh.setState(stateToStore)).then(() => {
        console.info('Updated notifications context storage.');
      });
    }
  }
  return Promise.resolve(true);
}

function reducer (state, action) {
  // B-all-544: clears no longer go to the server fire-and-forget from here. computeNewState
  // enqueues them durably in state.pendingClears (persisted with the tombstone below) and the
  // background flusher owns delivery and retry, so the UI never waits and a clear that fails
  // is retried instead of lost.
  const newState = timeSpan(`reducer:notifications:${action.type}`, () => computeNewState(state, action));
  // S-all-255: an action that changed nothing needs no persistence and no clear flush
  // (the flusher retries failures on its own timer)
  if (newState === state) {
    return state;
  }
  setTimeout(() => {
    notificationsStoragePromiseChain = notificationsStoragePromiseChain
      .then(() => storeStatePromise(action, newState));
  }, 0);
  if (action.type !== PENDING_CLEARS_ACKED && !_.isEmpty(newState.pendingClears)) {
    setTimeout(() => flushPendingClears(newState.pendingClears), 0);
  }
  return newState;
}

export default reducer;
