const UPDATE_MESSAGES = 'UPDATE_MESSAGES';
const UPDATE_PAGE = 'UPDATE_PAGE';

/** Messages you can send the reducer **/

export function updateMessages(messages) {
  return {
    type: UPDATE_MESSAGES,
    messages,
  };
}

export function updatePage(page) {
  return {
    type: UPDATE_PAGE,
    page,
  };
}

/** Helper functions **/
function getMassagedMessages(messages) {
  return messages.map((message) => {
    const {
      type_object_id: typeObjectId,
      market_id_user_id: marketIdUserId,
      level,
    } = message;
    const objectId = typeObjectId.substring(typeObjectId.lastIndexOf('_') + 1);
    const aType = typeObjectId.substring(0, typeObjectId.lastIndexOf('_'));
    const marketIdUserIdSplit = marketIdUserId.split('_');
    const marketId = marketIdUserIdSplit[0];
    if (marketId === objectId) {
      return {
        ...message, marketId, aType, level,
      };
    }
    return {
      ...message, marketId, aType, level, investibleId: objectId,
    };
  });
}

/** Functions that mutate the state **/

function doUpdateMessages(state, action) {
  const { messages } = action;
  const massagedMessages = getMassagedMessages(messages);
  return {
    ...state,
    messages: massagedMessages,
  };
}

function doUpdatePage(state, action) {
  const { page } = action;
  return {
    ...state,
    page,
  };
}

function computeNewState(state, action) {
  switch (action.type) {
    case UPDATE_MESSAGES:
      return doUpdateMessages(state, action);
    case UPDATE_PAGE:
      return doUpdatePage(state, action);
    default:
      return state;
  }
}

function reducer(state, action) {
  return computeNewState(state, action);
}

export default reducer;
