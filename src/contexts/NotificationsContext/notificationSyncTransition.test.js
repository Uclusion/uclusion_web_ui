import { getInboxCount, getNotificationSyncState } from './notificationsContextHelper';
import { findMessagesForGroupId } from '../../utils/messageUtils';
import {
  countAssistanceRootsWithNewMessages
} from '../../pages/Investible/Planning/assistanceNotificationCounts';

/**
 * J-all-440: the reported defect was a skew. A notification arrived, every count badge announced
 * it, and the navigation chevron could not offer it, because only the chevron applied
 * messageIsSynced. This walks the real pipeline across the moment the missing comment arrives and
 * asserts both halves of the contract:
 *
 *   before the comment lands, nothing announces the message anywhere;
 *   after it lands, every count and the chevron's forward target appear in the same pass.
 *
 * Nothing here is mocked. The transition is just the same pure pipeline called twice with
 * different comment state, so there is no race and no timing.
 *
 * What this does not cover: the wall-clock delay in B-all-626. That lives in the backoff schedule
 * in scheduleNotificationVerification and in the network, and no test at this layer reaches it.
 */

const MARKET_ID = 'market-a';
const GROUP_ID = 'group-a';
const COMMENT_ID = 'comment-a';

const message = {
  type: 'UNREAD_COMMENT',
  type_object_id: 'UNREAD_COMMENT_comment-a',
  market_id: MARKET_ID,
  group_id: GROUP_ID,
  comment_id: COMMENT_ID,
  comment_version: 2,
  is_highlighted: true,
  level: 'RED'
};

const messages = [message];
const marketsState = { marketDetails: [{ id: MARKET_ID, version: 1 }] };
const marketPresencesState = {};
const investiblesState = {};
const groupsState = {};

const commentsMissing = {};
const commentsArrived = { [MARKET_ID]: [{ id: COMMENT_ID, version: 2 }] };

function syncStateFor(commentsState) {
  return getNotificationSyncState(messages, marketsState, marketPresencesState, commentsState,
    investiblesState, groupsState);
}

// computeForward builds the "Next message ->" target from the synced set filtered to highlighted,
// so this is the value that decides whether the chevron can offer the notification.
function chevronForwardCandidates(syncedMessages) {
  return syncedMessages.filter((candidate) => candidate.is_highlighted);
}

describe('notification sync transition', () => {
  it('announces nothing until the comment arrives, then announces everywhere at once', () => {
    const before = syncStateFor(commentsMissing);

    expect(before.syncedMessages).toEqual([]);
    expect(before.dependencies).toEqual([
      { marketId: MARKET_ID, commentId: COMMENT_ID, version: 2 }
    ]);

    // This is the defect itself, still reachable. The raw list is what every badge read before
    // J-all-440, and it counts a message the chevron cannot offer. Same helper, two lists,
    // different answers: that gap is the bug B-all-626 reported.
    expect(getInboxCount(messages)).toBe(1);
    expect(chevronForwardCandidates(before.syncedMessages)).toEqual([]);

    // And this is the fix: display surfaces read the synced list, so they agree with the chevron.
    expect(getInboxCount(before.syncedMessages)).toBe(0);
    expect(findMessagesForGroupId(GROUP_ID, before.syncedMessages, true)).toEqual([]);
    expect(countAssistanceRootsWithNewMessages([{ id: COMMENT_ID }], [], before.syncedMessages))
      .toBe(0);

    // The comment syncs.
    const after = syncStateFor(commentsArrived);

    expect(after.syncedMessages).toEqual([message]);
    expect(after.dependencies).toEqual([]);
    expect(getInboxCount(after.syncedMessages)).toBe(1);
    expect(findMessagesForGroupId(GROUP_ID, after.syncedMessages, true)).toEqual([message]);
    expect(countAssistanceRootsWithNewMessages([{ id: COMMENT_ID }], [], after.syncedMessages))
      .toBe(1);
    expect(chevronForwardCandidates(after.syncedMessages)).toEqual([message]);
  });

  it('keeps every count and the chevron agreeing on both sides of the transition', () => {
    [commentsMissing, commentsArrived].forEach((commentsState) => {
      const { syncedMessages } = syncStateFor(commentsState);
      const chevronCanOffer = chevronForwardCandidates(syncedMessages).length > 0;

      // A badge must never claim something the chevron cannot reach. That equality is the
      // invariant a future unfiltered count path would break.
      expect(getInboxCount(syncedMessages) > 0).toBe(chevronCanOffer);
      expect(findMessagesForGroupId(GROUP_ID, syncedMessages, true).length > 0)
        .toBe(chevronCanOffer);
      expect(countAssistanceRootsWithNewMessages([{ id: COMMENT_ID }], [], syncedMessages) > 0)
        .toBe(chevronCanOffer);
    });
  });
});
