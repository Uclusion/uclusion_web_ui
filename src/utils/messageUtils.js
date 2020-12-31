import { ISSUE_TYPE, RED_LEVEL} from '../constants/notifications'

export function messageComparator (a, b) {
  if (a.level === b.level) {
    if (a.aType === b.aType || a.level !== RED_LEVEL) {
      return 0;
    }
    if (a.aType === ISSUE_TYPE) {
      return -1;
    }
    if (b.aType === ISSUE_TYPE) {
      return 1;
    }
    return 0;
  }
  if (a.level === RED_LEVEL) {
    return -1;
  }
  return 1;
}

/**
 * Gets all messages of the given level. If no messages of that level are found
 * returns []
 * @param level
 * @param unsafeMessages
 */
export function filterMessagesToLevel(level, unsafeMessages){
  const messages = unsafeMessages || [];
  return messages.filter((message) => message.level === level) || [];
}

export function findMessageOfTypeAndId(notificationId, state) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  const notificationType = 'UNREAD';
  return safeMessages.find((message) => message.aType === notificationType
    && (message.commentId === notificationId || message.associatedUserId === notificationId ||
    message.investibleId === notificationId || message.marketId === notificationId));
}

/**
 * Converts the raw message stream from the backed into something that's more easily handled
 * by the frontend. I.E. it converts type object ids, etc into marketIds, investibleIds, commentIds
 * and so on. Note, the massaged messages still contain their original values, such as
 * type_object_id, etc, as we need to be able to look them up by those values when removing.
 * @param messages
 * @returns {*}
 */
export function getMassagedMessages (messages) {
  const massagedMessages = messages.map((message) => {
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
    // USER poke messages store their type of poke in the marketID for historical reasons
    if (aType === 'USER_POKED') {
      return {
        ...message, pokeType: marketId, aType, level, userId,
      };
    }
    if (aType === 'NEW_OPTION') {
      return {
        ...message,
        marketId,
        aType,
        level,
        associatedInvestibleId: objectId,
        userId,
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
  massagedMessages.sort(function (a, b) {
    const {
      marketId: aMarketId,
      investibleId: aInvestibleId,
      level: aLevel,
    } = a;
    const {
      marketId: bMarketId,
      investibleId: bInvestibleId,
      level: bLevel,
    } = b;
    if (aLevel === bLevel) {
      if (aMarketId === bMarketId) {
        if (aInvestibleId === bInvestibleId) {
          return 0;
        }
        if (!aInvestibleId) {
          return -1;
        }
        if (!bInvestibleId) {
          return 1;
        }
        return 0;
      }
      if (!aMarketId) {
        return -1;
      }
      return aMarketId.localeCompare(bMarketId);
    }
    if (aLevel === RED_LEVEL) {
      return -1;
    }
    return 1;
  });
  return massagedMessages;
}