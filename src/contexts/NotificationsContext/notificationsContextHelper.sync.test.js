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
    expect(getSyncState({})).toEqual({
      syncedMessages: [],
      dependencies: [{ marketId, commentId, version: 2 }]
    });
  });

  it('keeps an older local comment unsynced', () => {
    expect(getSyncState({
      [marketId]: [{ id: commentId, version: 1 }]
    })).toEqual({
      syncedMessages: [],
      dependencies: [{ marketId, commentId, version: 2 }]
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
      dependencies: [{ marketId: inlineMarketId, commentId, version: 3 }]
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
});
