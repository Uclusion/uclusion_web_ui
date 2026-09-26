import { getNotificationSyncState } from './notificationsContextHelper';

const marketId = 'market-id';
const commentId = 'comment-id';
const message = {
  type: 'UNREAD_COMMENT',
  type_object_id: `UNREAD_COMMENT_${commentId}`,
  market_id: marketId,
  comment_id: commentId,
  comment_version: 2
};

function getSyncState(commentsState, messages=[message]) {
  return getNotificationSyncState(messages, {}, {}, commentsState, {}, {});
}

describe('notification synchronization classification', () => {
  it('marks a missing notified comment as a known-dirty dependency', () => {
    [message, { ...message, comment_list: [commentId] }].forEach((notification) => {
      expect(getSyncState({}, [notification])).toEqual({
        syncedMessages: [],
        dependencies: [{ marketId, commentId, version: 2 }]
      });
    });
    // A loaded primary comment does not make a rollup's missing secondary comment ready.
    expect(getSyncState({ [marketId]: [{ id: commentId, version: 2 }] }, [
      { ...message, comment_list: [commentId, 'missing-secondary'] }
    ])).toEqual({
      syncedMessages: [],
      dependencies: [{ marketId, commentId, version: 2 }]
    });
  });

  it('keeps an older local comment unsynced', () => {
    [message, { ...message, comment_list: [commentId] }].forEach((notification) => {
      expect(getSyncState({
        [marketId]: [{ id: commentId, version: 1 }]
      }, [notification])).toEqual({
        syncedMessages: [],
        dependencies: [{ marketId, commentId, version: 2 }]
      });
    });
  });

  it('keeps a comment with a missing root unsynced', () => {
    expect(getSyncState({
      [marketId]: [{ id: commentId, reply_id: 'missing-root-id', version: 2 }]
    })).toEqual({
      syncedMessages: [],
      dependencies: [{ marketId, commentId, version: 2 }]
    });
  });

  it('uses the comment market and highest required version for duplicate notifications', () => {
    const inlineMarketId = 'inline-market-id';
    const olderMessage = { ...message, comment_market_id: inlineMarketId, comment_version: 2 };
    const newerMessage = { ...olderMessage, type_object_id: 'UNREAD_COMMENT_newer', comment_version: 3 };

    expect(getSyncState({}, [olderMessage, newerMessage])).toEqual({
      syncedMessages: [],
      dependencies: [
        { marketId: inlineMarketId, commentId, version: 3 },
        { marketId, commentId, version: 3 }
      ]
    });
  });

  it('loads both sides of an inline question before exposing its vote notification', () => {
    const inlineMarketId = 'inline-market-id';
    const investibleId = 'job-id';
    const inlineQuestionMessage = {
      ...message,
      type: 'NOT_FULLY_VOTED',
      type_object_id: `NOT_FULLY_VOTED_${inlineMarketId}`,
      comment_list: [commentId],
      market_id: inlineMarketId,
      comment_market_id: marketId,
      investible_id: investibleId
    };
    const commentsState = { [marketId]: [{ id: commentId, version: 2 }] };
    const investiblesState = {
      [investibleId]: {
        investible: { id: investibleId, version: 1 },
        market_infos: [{ market_id: marketId, version: 1 }]
      }
    };
    const parentMarketOnly = { marketDetails: [{ id: marketId, version: 1 }] };

    expect(getNotificationSyncState([inlineQuestionMessage], parentMarketOnly, {},
      commentsState, investiblesState, {})).toEqual({
      syncedMessages: [],
      dependencies: [
        { marketId: inlineMarketId, commentId, version: 2 },
        { marketId, commentId, version: 2 }
      ]
    });

    const bothMarkets = {
      marketDetails: [...parentMarketOnly.marketDetails, { id: inlineMarketId, version: 1 }]
    };
    expect(getNotificationSyncState([inlineQuestionMessage], bothMarkets, {},
      commentsState, investiblesState, {})).toEqual({
      syncedMessages: [inlineQuestionMessage],
      dependencies: []
    });
  });

  it('allows navigation and retires the dependency once the notification is renderable', () => {
    const capsule = {
      id: commentId,
      version: 2,
      comment_type: 'REPORT',
      notification_type: 'BLUE',
      pinned: true
    };

    expect(getSyncState({ [marketId]: [capsule] })).toEqual({
      syncedMessages: [message],
      dependencies: []
    });
  });

  it('records a market plus investible dependency when a job notification has no comment', () => {
    const investibleId = 'job-id';
    const jobMessage = {
      type: 'UNREAD_REVIEWABLE',
      type_object_id: `UNREAD_REVIEWABLE_${investibleId}`,
      market_id: marketId,
      investible_id: investibleId,
      investible_version: 2
    };

    expect(getNotificationSyncState([jobMessage], {}, {}, {}, {}, {})).toEqual({
      syncedMessages: [],
      dependencies: [{ marketId, investibleId, version: 2 }]
    });

    const investiblesState = {
      [investibleId]: {
        investible: { id: investibleId, version: 2 },
        market_infos: [{ market_id: marketId, version: 1 }]
      }
    };
    expect(getNotificationSyncState([jobMessage], {}, {}, {}, investiblesState, {})).toEqual({
      syncedMessages: [jobMessage],
      dependencies: []
    });
  });

  it('does not invent a dependency for an unsynced notification with neither comment nor investible', () => {
    const marketOnly = {
      type: 'UNREAD_GROUP',
      type_object_id: 'UNREAD_GROUP_x_group-id',
      market_id: marketId,
      market_version: 2
    };

    expect(getNotificationSyncState([marketOnly], {}, {}, {}, {}, {})).toEqual({
      syncedMessages: [],
      dependencies: []
    });
  });
});
