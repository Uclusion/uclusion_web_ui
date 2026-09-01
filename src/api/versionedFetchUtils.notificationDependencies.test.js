import { fetchComments } from './comments';
import { getChangedIds, getVersions } from './summaries';
import { getMarketClient } from './marketLogin';
import { checkSignatureInStorage } from './storageIntrospector';
import {
  refreshVersionsForNotificationDependencies,
  refreshVersionsNow,
  stopRefreshRunner
} from './versionedFetchUtils';

const mockMarketId = 'market-id';
const mockCommentId = 'comment-id';
const mockCommentsState = {};
const mockMarketsState = { marketDetails: [{ id: mockMarketId, version: 2 }] };

jest.mock('./summaries', () => ({ getChangedIds: jest.fn(), getVersions: jest.fn() }));
jest.mock('./comments', () => ({ fetchComments: jest.fn() }));
jest.mock('./marketLogin', () => ({ getMarketClient: jest.fn() }));
jest.mock('../utils/MessageBusUtils', () => ({ pushMessage: jest.fn() }));
jest.mock('../utils/userFunctions', () => ({ isSignedOut: () => false }));
jest.mock('../utils/RepeatingFunction', () => ({
  RepeatingFunction: class {
    start() { return Promise.resolve(); }
    stop() {}
  }
}));
jest.mock('./syncStatus', () => ({ recordInitialSyncCycle: jest.fn() }));
jest.mock('../authorization/TokenStorageManager', () => jest.fn());
jest.mock('../contexts/CommentsContext/CommentsContext', () => ({
  COMMENTS_CONTEXT_NAMESPACE: 'comments_context',
  commentsContextHack: mockCommentsState
}));
jest.mock('../contexts/InvestibesContext/InvestiblesContext', () => ({
  INVESTIBLES_CONTEXT_NAMESPACE: 'investibles_context',
  investibleContextHack: {}
}));
jest.mock('../contexts/MarketsContext/MarketsContext', () => ({
  MARKET_CONTEXT_NAMESPACE: 'markets_context',
  marketsContextHack: mockMarketsState
}));
jest.mock('../contexts/MarketPresencesContext/MarketPresencesContext', () => ({
  MARKET_PRESENCES_CONTEXT_NAMESPACE: 'presences_context',
  marketPresencesContextHack: {}
}));
jest.mock('../contexts/MarketStagesContext/MarketStagesContext', () => ({
  MARKET_STAGES_CONTEXT_NAMESPACE: 'stages_context',
  marketStagesContextHack: {}
}));
jest.mock('../contexts/MarketGroupsContext/MarketGroupsContext', () => ({
  MARKET_GROUPS_CONTEXT_NAMESPACE: 'groups_context',
  marketGroupsContextHack: {}
}));
jest.mock('../contexts/GroupMembersContext/GroupMembersContext', () => ({
  GROUP_MEMBERS_CONTEXT_NAMESPACE: 'members_context',
  groupMembersContextHack: {}
}));
jest.mock('../utils/LocalForageHelper', () => jest.fn().mockImplementation(() => ({
  getState: (state) => Promise.resolve(state || {})
})));
jest.mock('../contexts/CommentsContext/commentsContextMessages', () => ({ addCommentsOther: jest.fn() }));
jest.mock('../contexts/CommentsContext/commentsContextReducer', () => ({
  updateCommentsFromVersions: (commentDetails, existingCommentIds) => ({ commentDetails, existingCommentIds })
}));
jest.mock('../contexts/MarketsContext/marketsContextHelper', () => ({ addMarketsToStorage: jest.fn() }));
jest.mock('../contexts/InvestibesContext/investiblesContextHelper', () => ({
  refreshInvestibles: jest.fn(),
  getMarketInvestibles: () => []
}));
jest.mock('../contexts/MarketPresencesContext/marketPresencesContextReducer', () => ({
  versionsUpdateMarketPresences: jest.fn()
}));
jest.mock('../contexts/MarketStagesContext/marketStagesContextReducer', () => ({
  updateMarketStagesFromNetwork: jest.fn()
}));
jest.mock('../contexts/MarketGroupsContext/marketGroupsContextHelper', () => ({ addGroupsToStorage: jest.fn() }));
jest.mock('../contexts/GroupMembersContext/groupMembersContextReducer', () => ({
  versionsUpdateGroupMembers: jest.fn()
}));

describe('notification dependency refresh', () => {
  afterEach(() => {
    stopRefreshRunner();
    delete mockCommentsState[mockMarketId];
    jest.clearAllMocks();
  });

  it('keeps forcing the normal market refresh until versions exposes the comment', async () => {
    const capsule = {
      id: mockCommentId,
      market_id: mockMarketId,
      version: 1,
      comment_type: 'REPORT',
      notification_type: 'BLUE',
      pinned: true
    };
    getChangedIds.mockResolvedValue([{
      id: mockMarketId,
      active: true,
      signature: { object_type: 'market', object_id_one: mockMarketId, version: 2 }
    }]);
    expect(checkSignatureInStorage(mockMarketId,
      { object_type: 'market', object_id_one: mockMarketId, version: 2 },
      { marketsState: mockMarketsState })).toBe(true);
    const commentVersions = [{
      market_id: mockMarketId,
      signatures: [{
        type: 'comment',
        object_versions: [{ object_id_one: mockCommentId, version: 1 }]
      }]
    }];
    getVersions.mockResolvedValueOnce([]).mockResolvedValueOnce(commentVersions);
    getMarketClient.mockResolvedValue({ id: 'client' });
    fetchComments.mockResolvedValue([capsule]);
    const commentsDispatch = jest.fn(() => {
      mockCommentsState[mockMarketId] = [capsule];
    });

    const dispatchers = { commentsDispatch, diffDispatch: jest.fn(), index: {}, ticketsDispatch: jest.fn() };
    await refreshVersionsForNotificationDependencies([{
      marketId: mockMarketId,
      commentId: mockCommentId,
      version: 1
    }], dispatchers);

    expect(getVersions).toHaveBeenNthCalledWith(1, [mockMarketId], false);
    expect(fetchComments).not.toHaveBeenCalled();

    await refreshVersionsNow(dispatchers);

    expect(getVersions).toHaveBeenNthCalledWith(2, [mockMarketId], false);
    expect(fetchComments).toHaveBeenCalledWith([{ id: mockCommentId, version: 1 }], { id: 'client' });
    expect(commentsDispatch).toHaveBeenCalledWith(expect.objectContaining({
      commentDetails: { [mockMarketId]: [capsule] }
    }));
  });

  it('stops forcing a market after its notification disappears', async () => {
    getChangedIds.mockResolvedValue([]);
    getVersions.mockResolvedValue([]);

    await refreshVersionsForNotificationDependencies([{
      marketId: mockMarketId,
      commentId: mockCommentId,
      version: 1
    }]);
    expect(getVersions).toHaveBeenCalledTimes(1);

    await refreshVersionsForNotificationDependencies([]);
    await refreshVersionsNow();

    expect(getVersions).toHaveBeenCalledTimes(1);
  });

  it('does not let one tab clear another tab\'s unsynced dependency', async () => {
    getChangedIds.mockResolvedValue([]);
    getVersions.mockResolvedValue([]);
    const dependency = [{ marketId: mockMarketId, commentId: mockCommentId, version: 1 }];

    await refreshVersionsForNotificationDependencies(dependency, undefined, 'tab-a');
    await refreshVersionsForNotificationDependencies(dependency, undefined, 'tab-b');
    expect(getVersions).toHaveBeenCalledTimes(2);

    await refreshVersionsForNotificationDependencies([], undefined, 'tab-a');
    await refreshVersionsNow();
    expect(getVersions).toHaveBeenCalledTimes(3);

    await refreshVersionsForNotificationDependencies([], undefined, 'tab-b');
    await refreshVersionsNow();
    expect(getVersions).toHaveBeenCalledTimes(3);
  });

  it('expires a dependency left behind by a closed tab', async () => {
    const now = 1000;
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
    try {
      getChangedIds.mockResolvedValue([]);
      getVersions.mockResolvedValue([]);

      await refreshVersionsForNotificationDependencies([{
        marketId: mockMarketId,
        commentId: mockCommentId,
        version: 1
      }], undefined, 'closed-tab');
      expect(getVersions).toHaveBeenCalledTimes(1);

      dateSpy.mockReturnValue(now + 24 * 60 * 60 * 1000);
      await refreshVersionsNow();
      expect(getVersions).toHaveBeenCalledTimes(1);
    } finally {
      dateSpy.mockRestore();
    }
  });
});
