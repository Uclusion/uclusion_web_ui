import { fetchComments } from './comments';
import { fetchInvestibles } from './marketInvestibles';
import { getChangedIds, getVersions } from './summaries';
import { getMarketClient } from './marketLogin';
import { checkSignatureInStorage } from './storageIntrospector';
import { pushMessage } from '../utils/MessageBusUtils';
import { installEditingPause } from '../utils/editingPause';
import { FRESHNESS_NAMESPACES, registerNamespaceReloader, reloadFromDisk } from './crossTabFreshness';
import {
  refreshVersionsForNotificationDependencies,
  refreshVersionsFromPush,
  getStorageStates,
  refreshVersions,
  refreshVersionsNow,
  stopRefreshRunner
} from './versionedFetchUtils';

const mockMarketId = 'market-id';
const mockCommentId = 'comment-id';
const mockCommentsState = {};
const mockPresencesState = {};
const mockInvestiblesState = {};
const mockMarketsState = { marketDetails: [{ id: mockMarketId, version: 2 }] };

jest.mock('./summaries', () => ({ getChangedIds: jest.fn(), getVersions: jest.fn() }));
jest.mock('./comments', () => ({ fetchComments: jest.fn() }));
jest.mock('./marketInvestibles', () => ({ fetchInvestibles: jest.fn() }));
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
  get commentsContextHack() { return mockCommentsState; }
}));
jest.mock('../contexts/InvestibesContext/InvestiblesContext', () => ({
  INVESTIBLES_CONTEXT_NAMESPACE: 'investibles_context',
  get investibleContextHack() { return mockInvestiblesState; }
}));
jest.mock('../contexts/MarketsContext/MarketsContext', () => ({
  MARKET_CONTEXT_NAMESPACE: 'markets_context',
  get marketsContextHack() { return mockMarketsState; }
}));
jest.mock('../contexts/MarketPresencesContext/MarketPresencesContext', () => ({
  MARKET_PRESENCES_CONTEXT_NAMESPACE: 'presences_context',
  get marketPresencesContextHack() { return mockPresencesState; }
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
  getMarketInvestibles: (state) => Object.values(state)
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

describe('pushed changes hidden by the last audit signature', () => {
  const flushWork = () => new Promise(jest.requireActual('timers').setImmediate);
  const question = { id: mockCommentId, version: 2, resolved: true, comment_type: 'QUESTION' };
  const job = { investible: { id: 'job-id', version: 1 },
    market_infos: [{ id: 'job-info', market_id: mockMarketId, version: 2, stage: 'Doable' }] };
  const syncedVote = { object_type: 'investment', object_id_one: 'option-info',
    object_id_two: 'voter-id', version: 3 };

  beforeEach(() => {
    jest.useFakeTimers();
    mockCommentsState[mockMarketId] = [{ ...question, version: 1, resolved: false }];
    mockInvestiblesState['job-id'] = { ...job,
      market_infos: [{ ...job.market_infos[0], version: 1, stage: 'Requires Input' }] };
    mockPresencesState[mockMarketId] = [{ id: 'voter-id',
      investments: [{ type_object_id: 'investible_option-info', version: 3 }] }];
    getChangedIds.mockResolvedValue([{ id: mockMarketId, active: true, signature: syncedVote }]);
    getVersions.mockResolvedValue([{ market_id: mockMarketId, signatures: [
      { type: 'comment', object_versions: [{ object_id_one: mockCommentId, version: 2 }] },
      { type: 'market_investible', object_versions: [
        { object_id_one: 'job-info', object_id_two: 'job-id', version: 2 }
      ] }
    ] }]);
    getMarketClient.mockResolvedValue({ id: 'client' });
    fetchComments.mockResolvedValue([question]);
    fetchInvestibles.mockResolvedValue([job]);
  });

  afterEach(() => {
    stopRefreshRunner();
    delete mockCommentsState[mockMarketId];
    delete mockPresencesState[mockMarketId];
    delete mockInvestiblesState['job-id'];
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it.each([
    ['question resolution', 'comment', mockCommentId],
    ['job stage change', 'market_investible', 'job-info_job-id']
  ])('reconciles a pushed %s even when the audit names an already-synced vote',
    async (_description, objectType, objectIdOneTwo) => {
      expect(checkSignatureInStorage(mockMarketId, syncedVote,
        await getStorageStates())).toBe(true);

      await refreshVersionsFromPush({ marketId: mockMarketId, objectType, objectIdOneTwo, version: 2 });

      expect(getVersions).toHaveBeenCalledWith([mockMarketId], false);
      expect(fetchComments).toHaveBeenCalledTimes(1);
      expect(fetchInvestibles).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(2500);
      expect(pushMessage).toHaveBeenCalledWith('CommentsChannel', expect.objectContaining({
        commentDetails: { [mockMarketId]: [question] }
      }));
      expect(pushMessage).toHaveBeenCalledWith('InvestiblesChannel', expect.objectContaining({
        investibles: [job]
      }));
    });

  it.each(['already-synced vote', 'absent audit'])('retries delayed versions with an %s without another event',
    async (auditState) => {
      if (auditState === 'absent audit') {
        getChangedIds.mockResolvedValue([]);
      }
      getVersions.mockResolvedValueOnce([]);

      await refreshVersionsFromPush({ marketId: mockMarketId, objectType: 'comment',
        objectIdOneTwo: mockCommentId, version: 2 });
      await flushWork();
      expect(fetchComments).not.toHaveBeenCalled();

      jest.advanceTimersByTime(2000);
      await flushWork();
      jest.advanceTimersByTime(5000);
      await flushWork();
      jest.advanceTimersByTime(2500);

      expect(getVersions).toHaveBeenCalledTimes(2);
      expect(pushMessage).toHaveBeenCalledWith('CommentsChannel', expect.objectContaining({
        commentDetails: { [mockMarketId]: [question] }
      }));
    });

  it('does not force a refresh for a pushed version already in memory', async () => {
    mockCommentsState[mockMarketId] = [question];

    await refreshVersionsFromPush({ marketId: mockMarketId, objectType: 'comment',
      objectIdOneTwo: mockCommentId, version: 2 });
    await flushWork();
    jest.advanceTimersByTime(30000);
    await flushWork();

    expect(getVersions).not.toHaveBeenCalled();
    expect(fetchComments).not.toHaveBeenCalled();
  });

  it('retains a pushed resolution while editing and reconciles it after blur', async () => {
    const uninstall = installEditingPause();
    const editor = document.createElement('textarea');
    document.body.appendChild(editor);
    try {
      editor.focus();
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'a' }));
      const refresh = refreshVersionsFromPush({ marketId: mockMarketId, objectType: 'comment',
        objectIdOneTwo: mockCommentId, version: 2 });
      await flushWork();
      expect(getChangedIds).not.toHaveBeenCalled();

      editor.blur();
      await refresh;
      jest.advanceTimersByTime(2500);

      expect(pushMessage).toHaveBeenCalledWith('CommentsChannel', expect.objectContaining({
        commentDetails: { [mockMarketId]: [question] }
      }));
    } finally {
      uninstall();
      editor.remove();
    }
  });
});

describe('editing pause', () => {
  let editor;
  let uninstall;

  beforeEach(() => {
    uninstall = installEditingPause();
    editor = document.createElement('textarea');
    document.body.appendChild(editor);
    getChangedIds.mockResolvedValue([]);
    getVersions.mockResolvedValue([]);
  });

  afterEach(() => {
    stopRefreshRunner();
    uninstall();
    editor.remove();
    jest.clearAllMocks();
  });

  it.each(['textarea', 'Quill contenteditable'])('holds new syncs while editing a %s', async (kind) => {
    if (kind === 'Quill contenteditable') {
      editor.remove();
      editor = document.createElement('div');
      editor.className = 'ql-editor';
      editor.setAttribute('contenteditable', 'true');
      editor.tabIndex = 0;
      document.body.appendChild(editor);
    }
    editor.focus();
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'a' }));
    const refreshes = [refreshVersionsNow(), refreshVersionsNow(), refreshVersionsNow()];
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getChangedIds).not.toHaveBeenCalled();

    editor.blur();
    await Promise.all(refreshes);
    expect(getChangedIds).toHaveBeenCalledTimes(1);
  });

  it('finishes an admitted sync while holding its queued successor', async () => {
    let finishDiscovery;
    getChangedIds.mockImplementationOnce(() => new Promise((resolve) => { finishDiscovery = resolve; }));
    const admitted = refreshVersionsNow();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getChangedIds).toHaveBeenCalledTimes(1);
    await refreshVersionsNow();

    editor.focus();
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'a' }));
    finishDiscovery([]);
    await admitted;

    expect(getChangedIds).toHaveBeenCalledTimes(1);
    expect(pushMessage).toHaveBeenCalledWith('NotificationsChannel', expect.objectContaining({
      event: 'version_push'
    }));

    editor.blur();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getChangedIds).toHaveBeenCalledTimes(2);
  });

  it.each(['Enter', 'Backspace', 'paste'])('holds sync when the editor handles %s without native input',
    async (operation) => {
      editor.remove();
      editor = document.createElement('div');
      editor.className = 'ql-editor';
      editor.setAttribute('contenteditable', 'true');
      editor.tabIndex = 0;
      document.body.appendChild(editor);
      editor.focus();
      const event = operation === 'paste'
        ? new Event('paste', { bubbles: true, cancelable: true })
        : new KeyboardEvent('keydown', { key: operation, bubbles: true, cancelable: true });
      editor.addEventListener(event.type, (handled) => handled.preventDefault());
      editor.dispatchEvent(event);
      const refresh = refreshVersionsNow();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(getChangedIds).not.toHaveBeenCalled();

      editor.remove();
      await refresh;
      expect(getChangedIds).toHaveBeenCalledTimes(1);
    });

  it('coalesces paused refreshes and discards them when their lifecycle ends', async () => {
    editor.focus();
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'a' }));
    const requests = [refreshVersionsNow(), refreshVersionsNow(), refreshVersionsNow()];
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getChangedIds).not.toHaveBeenCalled();

    stopRefreshRunner();
    await Promise.all(requests);
    editor.blur();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getChangedIds).not.toHaveBeenCalled();
  });

  it('allows an explicit action to refresh while background work stays paused', async () => {
    editor.focus();
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'a' }));
    const background = refreshVersionsNow();
    await refreshVersionsNow(undefined, true);
    expect(getChangedIds).toHaveBeenCalledTimes(1);

    stopRefreshRunner();
    await background;
  });

  it('keeps a debounced verification refresh pending if typing starts before admission', async () => {
    jest.useFakeTimers();
    const flushWork = () => new Promise(jest.requireActual('timers').setImmediate);
    try {
      await refreshVersions();
      const completed = jest.fn();
      const retry = refreshVersions().then(completed);
      await flushWork();
      expect(completed).not.toHaveBeenCalled();

      editor.focus();
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'a' }));
      jest.advanceTimersByTime(120000);
      await flushWork();
      expect(getChangedIds).toHaveBeenCalledTimes(1);
      expect(completed).not.toHaveBeenCalled();

      editor.blur();
      await retry;
      expect(getChangedIds).toHaveBeenCalledTimes(2);
      expect(completed).toHaveBeenCalledWith(0);
    } finally {
      stopRefreshRunner();
      jest.useRealTimers();
    }
  });

  it('holds background disk adoption while an explicit read can still finish', async () => {
    const comments = jest.fn().mockResolvedValue(true);
    const investibles = jest.fn().mockResolvedValue(true);
    const unregister = [
      registerNamespaceReloader(FRESHNESS_NAMESPACES.COMMENTS, comments),
      registerNamespaceReloader(FRESHNESS_NAMESPACES.INVESTIBLES, investibles)
    ];
    try {
      editor.focus();
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'a' }));
      const notices = [reloadFromDisk(FRESHNESS_NAMESPACES.COMMENTS),
        reloadFromDisk(FRESHNESS_NAMESPACES.INVESTIBLES)];
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(comments).not.toHaveBeenCalled();
      expect(investibles).not.toHaveBeenCalled();

      await reloadFromDisk(FRESHNESS_NAMESPACES.COMMENTS, true);
      expect(comments).toHaveBeenCalledTimes(1);
      expect(investibles).toHaveBeenCalledTimes(1);

      editor.readOnly = true;
      await Promise.all(notices);
      expect(comments).toHaveBeenCalledTimes(2);
      expect(investibles).toHaveBeenCalledTimes(2);
    } finally {
      unregister.forEach((remove) => remove());
    }
  });
});
