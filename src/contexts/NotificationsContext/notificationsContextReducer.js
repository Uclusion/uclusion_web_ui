import LocalForageHelper from '../LocalForageHelper';
import { toast } from 'react-toastify';
import _ from 'lodash';
export const NOTIFICATIONS_CONTEXT_NAMESPACE = 'notifications';
const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
const UPDATE_PAGE = 'UPDATE_PAGE';
const INITIALIZE_STATE = 'INITIALIZE_STATE';
const INCREMENT_CURRENT = 'INCREMENT_CURRENT';
const PROCESSED_PAGE = 'PROCESSED_PAGE';

/** Messages you can send the reducer */

export function updateMessages(messages) {
  return {
    type: UPDATE_MESSAGES,
    messages,
  };
}

export function processedPage(page, messages, toastInfo, newPage, scrollTarget) {
  return {
    type: PROCESSED_PAGE,
    page,
    messages,
    toastInfo,
    newPage,
    scrollTarget
  };
}

export function nextMessage() {
  return {
    type: INCREMENT_CURRENT,
  };
}

export function updatePage(page) {
  return {
    type: UPDATE_PAGE,
    page,
  };
}

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

function scroller(target, newPage, retry=true) {
  if (newPage !== undefined && newPage) {
    if (target) {
      const element = document.getElementById(target);
      if (element) {
        element.scrollIntoView();
      } else if (retry) {
        setTimeout(() => {
          scroller(target, newPage, false);
        }, 1000);
      } else {
        console.warn(`Processing scroll failed for ${target}`)
      }
    }
  }
}

/** Helper functions * */
function getMassagedMessages(messages) {
  const rawMessages = messages.map((message) => {
    const {
      type_object_id: typeObjectId,
      market_id_user_id: marketIdUserId,
      level,
      associated_object_id: associatedObjectId,
    } = message;
    const objectId = typeObjectId.substring(typeObjectId.lastIndexOf('_') + 1);
    const aType = typeObjectId.substring(0, typeObjectId.lastIndexOf('_'));
    const marketId = marketIdUserId.substring(0, marketIdUserId.lastIndexOf('_'));
    const userId = marketIdUserId.substring(marketIdUserId.lastIndexOf('_') + 1);
    if (aType === 'USER_POKED') {
      return {
        ...message, pokeType: marketId, aType, level, userId,
      };
    }
    if (marketId === objectId || userId === objectId) {
      return {
        ...message, marketId, aType, level, userId,
      };
    }
    if (associatedObjectId) {
      if (aType === 'NEW_VOTES') {
        return {
          ...message,
          marketId,
          aType,
          level,
          investibleId: objectId,
          associatedUserId: associatedObjectId,
          userId,
        };
      }
      return {
        ...message,
        marketId,
        aType,
        level,
        investibleId: associatedObjectId,
        commentId: objectId,
        userId,
      };
    }
    if (aType.startsWith('ISSUE')) {
      // Comment thread on context
      return {
        ...message,
        marketId,
        aType,
        level,
        commentId: objectId,
        userId,
      };
    }
    return {
      ...message, marketId, aType, level, investibleId: objectId, userId,
    };
  });
  //market level must come before investibles in the market
  rawMessages.sort(function(a, b) {
    const {
      marketId: aMarketId,
      investibleId: aInvestibleId,
    } = a;
    const {
      marketId: bMarketId,
      investibleId: bInvestibleId,
    } = b;
    if (aMarketId === bMarketId) {
      if (aInvestibleId === bInvestibleId) {
        return 0;
      }
      if (!aInvestibleId) {
        return -1;
      }
      if (!bInvestibleId) {
        return  1;
      }
      return 0;
    }
    if (!aMarketId) {
      return -1;
    }
    return aMarketId.localeCompare(bMarketId);
  })
  return rawMessages;
}

export function isMessageEqual(aMessage, message) {
  if (!message && !aMessage) {
    return true;
  }
  return message && aMessage && aMessage.type_object_id === message.type_object_id
    && aMessage.market_id_user_id === message.market_id_user_id;
}

function getNextCurrent(messages, current) {
  let index = messages.findIndex((message) => isMessageEqual(message, current));
  if (index === messages.length - 1) {
    index = 0;
  } else {
    index += 1;
  }
  return messages[index];
}

/** Functions that mutate the state */

function doUpdatePage(state, action) {
  const { page } = action;
  return {
    ...state,
    page,
  };
}

function markPageProcessed(state, action) {
  const { page, messages: removedMessages, toastInfo, newPage, scrollTarget } = action;
  if (_.isEmpty(removedMessages)) {
    scroller(scrollTarget, newPage);
    return {
      ...state,
      lastPage: page,
    };
  }
  const { messages, current, toastId: currentToastId } = state;
  if (currentToastId && toast.isActive(currentToastId)) {
    toast.dismiss(currentToastId);
  }
  const { level, myText, options } = toastInfo;
  let toastId;
  if (level) {
    switch (level) {
      case 'RED':
        toastId = toast.error(myText, options);
        break;
      case 'YELLOW':
        toastId = toast.warn(myText, options);
        break;
      default:
        toastId = toast.info(myText, options);
        break;
    }
  }
  // Done toasting so hopefully is safe to scroll without concern for re-render
  scroller(scrollTarget, newPage);
  let removedCurrent = false;
  let newCurrent = current;
  const filteredMessages = messages.filter((aMessage) => {
    let keep = true;
    removedMessages.forEach((removedMessage) => {
      if (isMessageEqual(aMessage, removedMessage)) {
        keep = false;
      }
    });
    if (!keep && isMessageEqual(current, aMessage)) {
      removedCurrent = true;
    }
    if (keep && removedCurrent) {
      newCurrent = aMessage;
    }
    return keep;
  });
  if (removedCurrent && isMessageEqual(newCurrent, current)) {
    if (_.isEmpty(filteredMessages)) {
      // Just removed the last one
      return {
        ...state,
        messages: [],
        current: undefined,
        lastPage: page,
        toastId
      };
    }
    newCurrent = filteredMessages[0];
  }
  return {
    ...state,
    messages: filteredMessages,
    current: newCurrent,
    lastPage: page,
    toastId
  };
}

function doUpdateMessages(state, action) {
  const { messages } = action;
  if (!Array.isArray(messages) || !messages.length) {
    return {
      ...state,
      messages: [],
      current: undefined,
    };
  }
  const { current } = state;
  const massagedMessages = getMassagedMessages(messages);
  let newCurrent = massagedMessages.find((aMessage) => isMessageEqual(aMessage, current));
  if (!newCurrent && massagedMessages.length > 0) {
    // eslint-disable-next-line prefer-destructuring
    newCurrent = massagedMessages[0];
  }
  return {
    ...state,
    messages: massagedMessages,
    current: newCurrent,
  };
}

function doNext(state) {
  const { messages, current } = state;
  const newCurrent = getNextCurrent(messages, current);
  return {
    ...state,
    current: newCurrent,
  };
}

function computeNewState(state, action) {
  switch (action.type) {
    case UPDATE_MESSAGES:
      return doUpdateMessages(state, action);
    case UPDATE_PAGE:
      return doUpdatePage(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    case INCREMENT_CURRENT:
      return doNext(state);
    case PROCESSED_PAGE:
      return markPageProcessed(state, action);
    default:
      return state;
  }
}

function reducer(state, action) {
  const newState = computeNewState(state, action);
  //// console.log(`Processed ${JSON.stringify(action)} to produce ${JSON.stringify(newState)}`);
  const lfh = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
  lfh.setState(newState);
  return newState;
}

export default reducer;
